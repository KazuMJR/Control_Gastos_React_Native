#!/usr/bin/env node
/* global __dirname */

const { spawn, spawnSync } = require("node:child_process");
const { existsSync, writeFileSync } = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const backend = path.join(root, "Proyecto_Colaborativo", "AppTest-develop", "backend");
const php = path.join(root, ".tools", "php", "php.exe");
const cloudflared = path.join(root, ".tools", "cloudflared.exe");
const artisan = path.join(backend, "artisan");
const laravelRouter = path.join(
  backend,
  "vendor",
  "laravel",
  "framework",
  "src",
  "Illuminate",
  "Foundation",
  "resources",
  "server.php"
);
const expoCli = path.join(root, "node_modules", "expo", "bin", "cli");
const children = new Set();
let stopping = false;

function log(message) {
  console.log(`\n[integración] ${message}`);
}

function requireFile(file, message) {
  if (!existsSync(file)) {
    throw new Error(message);
  }
}

function run(command, args, cwd) {
  const result = spawnSync(command, args, { cwd, stdio: "inherit" });
  if (result.status !== 0) {
    throw new Error(`No se pudo completar: ${args.join(" ")}`);
  }
}

function start(command, args, cwd, options = {}) {
  const child = spawn(command, args, {
    cwd,
    windowsHide: true,
    ...options,
  });
  children.add(child);
  child.once("exit", () => children.delete(child));
  child.once("error", (error) => {
    console.error(`\n[integración] No se pudo iniciar un servicio: ${error.message}`);
    cleanup(1);
  });
  return child;
}

function stopChild(child) {
  if (!child.pid || child.exitCode !== null) {
    return;
  }

  if (process.platform === "win32") {
    try {
      child.kill();
    } catch {
      // taskkill es el respaldo para procesos con descendientes en Windows.
    }
    spawnSync("taskkill", ["/PID", String(child.pid), "/T", "/F"], {
      stdio: "ignore",
      windowsHide: true,
    });
    return;
  }

  child.kill("SIGTERM");
}

function cleanup(exitCode = 0) {
  if (stopping) {
    return;
  }

  stopping = true;
  log("Cerrando Expo, el túnel de la API y Laravel…");
  for (const child of children) {
    stopChild(child);
  }
  process.exit(exitCode);
}

function pipeWithPrefix(stream, prefix, shouldPrint = () => true) {
  let pending = "";
  stream.setEncoding("utf8");
  stream.on("data", (chunk) => {
    pending += chunk;
    const lines = pending.split(/\r?\n/);
    pending = lines.pop() ?? "";
    for (const line of lines) {
      if (line.trim() && shouldPrint(line)) {
        console.log(`[${prefix}] ${line}`);
      }
    }
  });
}

async function waitForApi(url, child, timeoutMs = 30000) {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    if (child.exitCode !== null) {
      throw new Error("Laravel se cerró antes de quedar listo.");
    }

    try {
      const response = await fetch(url);
      if (response.ok) {
        return;
      }
    } catch {
      // Laravel todavía está iniciando.
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error(`La dirección ${url} no respondió después de ${Math.round(timeoutMs / 1000)} segundos.`);
}

function waitForTunnel(child) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(
      () => reject(new Error("El túnel HTTPS de la API no entregó una dirección después de 45 segundos.")),
      45000
    );
    let buffer = "";

    const inspect = (chunk) => {
      buffer = `${buffer}${chunk.toString()}`.slice(-12000);
      const match = buffer.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/i);
      if (match) {
        clearTimeout(timeout);
        resolve(match[0]);
      }
    };

    child.stdout.on("data", inspect);
    child.stderr.on("data", inspect);
    child.once("exit", (code) => {
      clearTimeout(timeout);
      reject(new Error(`El túnel HTTPS de la API se cerró con el código ${code}.`));
    });
  });
}

async function main() {
  requireFile(php, "No se encontró .tools/php/php.exe.");
  requireFile(cloudflared, "No se encontró .tools/cloudflared.exe.");
  requireFile(artisan, "No se encontró el backend colaborativo.");
  requireFile(laravelRouter, "Faltan dependencias de Laravel. Ejecuta composer install una vez.");
  requireFile(expoCli, "Faltan dependencias de Expo. Ejecuta npm install una vez.");

  log("Preparando la base de datos y la cuenta de demostración…");
  run(php, [artisan, "migrate", "--force"], backend);
  run(php, [artisan, "db:seed", "--class=Database\\Seeders\\DemoTaskIntegrationSeeder", "--force"], backend);

  log("Iniciando Laravel localmente en el puerto 8001…");
  const laravel = start(
    php,
    ["-S", "127.0.0.1:8001", laravelRouter],
    path.join(backend, "public"),
    { stdio: ["ignore", "pipe", "pipe"] }
  );
  pipeWithPrefix(laravel.stdout, "Laravel");
  pipeWithPrefix(laravel.stderr, "Laravel");
  await waitForApi("http://127.0.0.1:8001/up", laravel);

  log("Creando la dirección HTTPS temporal para la API…");
  const apiTunnel = start(
    cloudflared,
    ["tunnel", "--url", "http://127.0.0.1:8001", "--no-autoupdate", "--protocol", "http2"],
    root,
    { stdio: ["ignore", "pipe", "pipe"] }
  );
  const importantTunnelLine = (line) => /trycloudflare\.com|Registered tunnel connection|\bERR\b/.test(line);
  pipeWithPrefix(apiTunnel.stdout, "Túnel API", importantTunnelLine);
  pipeWithPrefix(apiTunnel.stderr, "Túnel API", importantTunnelLine);
  const publicApiOrigin = await waitForTunnel(apiTunnel);
  log("Esperando que la dirección HTTPS sea accesible; la primera vez puede tardar hasta 90 segundos…");
  await waitForApi(`${publicApiOrigin}/up`, apiTunnel, 90000);

  const apiUrl = `${publicApiOrigin}/api`;
  writeFileSync(path.join(root, ".env.local"), `EXPO_PUBLIC_TASKS_API_URL=${apiUrl}\n`, "utf8");
  log(`API temporal disponible para el teléfono: ${apiUrl}`);

  log("Iniciando Expo con túnel. Escanea el nuevo código QR con Expo Go.");
  const expo = start(process.execPath, [expoCli, "start", "--tunnel", "--clear"], root, {
    stdio: "inherit",
  });
  expo.once("exit", (code) => cleanup(code ?? 0));
}

process.on("SIGINT", () => cleanup(0));
process.on("SIGTERM", () => cleanup(0));

main().catch((error) => {
  console.error(`\n[integración] ${error.message}`);
  cleanup(1);
});
