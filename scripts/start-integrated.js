#!/usr/bin/env node
/* global __dirname */

const { spawn, spawnSync } = require("node:child_process");
const { existsSync, writeFileSync } = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const expensesBackend = path.join(root, "backend");
const tasksBackend = path.join(root, "Proyecto_Colaborativo", "AppTest-develop", "backend");
const php = path.join(root, ".tools", "php", "php.exe");
const cloudflared = path.join(root, ".tools", "cloudflared.exe");
const expensesArtisan = path.join(expensesBackend, "artisan");
const tasksArtisan = path.join(tasksBackend, "artisan");
const expensesLaravelRouter = path.join(
  expensesBackend,
  "vendor",
  "laravel",
  "framework",
  "src",
  "Illuminate",
  "Foundation",
  "resources",
  "server.php"
);
const tasksLaravelRouter = path.join(
  tasksBackend,
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
  log("Cerrando Expo, los túneles y las API de Laravel…");
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

function ensurePassportKeys(backend, artisan) {
  const privateKey = path.join(backend, "storage", "oauth-private.key");
  const publicKey = path.join(backend, "storage", "oauth-public.key");

  if (!existsSync(privateKey) || !existsSync(publicKey)) {
    log(`Generando claves Passport para ${path.basename(path.dirname(backend))}…`);
    run(php, [artisan, "passport:keys", "--force"], backend);
  }
}

async function openApiTunnel(localUrl, label) {
  const tunnel = start(
    cloudflared,
    ["tunnel", "--url", localUrl, "--no-autoupdate", "--protocol", "http2"],
    root,
    { stdio: ["ignore", "pipe", "pipe"] }
  );
  const importantTunnelLine = (line) => /trycloudflare\.com|Registered tunnel connection|\bERR\b/.test(line);
  pipeWithPrefix(tunnel.stdout, `Túnel ${label}`, importantTunnelLine);
  pipeWithPrefix(tunnel.stderr, `Túnel ${label}`, importantTunnelLine);
  const publicOrigin = await waitForTunnel(tunnel);
  await waitForApi(`${publicOrigin}/up`, tunnel, 90000);
  return publicOrigin;
}

async function main() {
  requireFile(php, "No se encontró .tools/php/php.exe.");
  requireFile(cloudflared, "No se encontró .tools/cloudflared.exe.");
  requireFile(expensesArtisan, "No se encontró la API propia de gastos.");
  requireFile(tasksArtisan, "No se encontró la API colaborativa de tareas.");
  requireFile(expensesLaravelRouter, "Faltan dependencias de la API de gastos. Ejecuta composer install en backend.");
  requireFile(tasksLaravelRouter, "Faltan dependencias de la API de tareas. Ejecuta composer install en su backend.");
  requireFile(expoCli, "Faltan dependencias de Expo. Ejecuta npm install una vez.");

  ensurePassportKeys(expensesBackend, expensesArtisan);
  ensurePassportKeys(tasksBackend, tasksArtisan);

  log("Preparando gastos, categorías y la cuenta de demostración…");
  run(php, [expensesArtisan, "migrate", "--force"], expensesBackend);
  run(php, [expensesArtisan, "db:seed", "--class=Database\\Seeders\\DemoExpenseIntegrationSeeder", "--force"], expensesBackend);

  log("Preparando tareas y la cuenta colaborativa…");
  run(php, [tasksArtisan, "migrate", "--force"], tasksBackend);
  run(php, [tasksArtisan, "db:seed", "--class=Database\\Seeders\\DemoTaskIntegrationSeeder", "--force"], tasksBackend);

  log("Iniciando la API de gastos en el puerto 8000 y la API de tareas en el 8001…");
  const expensesLaravel = start(
    php,
    ["-S", "127.0.0.1:8000", expensesLaravelRouter],
    path.join(expensesBackend, "public"),
    { stdio: ["ignore", "pipe", "pipe"] }
  );
  const tasksLaravel = start(
    php,
    ["-S", "127.0.0.1:8001", tasksLaravelRouter],
    path.join(tasksBackend, "public"),
    { stdio: ["ignore", "pipe", "pipe"] }
  );
  pipeWithPrefix(expensesLaravel.stdout, "API gastos");
  pipeWithPrefix(expensesLaravel.stderr, "API gastos");
  pipeWithPrefix(tasksLaravel.stdout, "API tareas");
  pipeWithPrefix(tasksLaravel.stderr, "API tareas");
  await Promise.all([
    waitForApi("http://127.0.0.1:8000/up", expensesLaravel),
    waitForApi("http://127.0.0.1:8001/up", tasksLaravel),
  ]);

  log("Creando direcciones HTTPS temporales para ambas API…");
  const [expensesApiOrigin, tasksApiOrigin] = await Promise.all([
    openApiTunnel("http://127.0.0.1:8000", "gastos"),
    openApiTunnel("http://127.0.0.1:8001", "tareas"),
  ]);

  const expensesApiUrl = `${expensesApiOrigin}/api`;
  const tasksApiUrl = `${tasksApiOrigin}/api`;
  writeFileSync(
    path.join(root, ".env.local"),
    `EXPO_PUBLIC_EXPENSES_API_URL=${expensesApiUrl}\nEXPO_PUBLIC_TASKS_API_URL=${tasksApiUrl}\n`,
    "utf8"
  );
  log(`API de gastos disponible: ${expensesApiUrl}`);
  log(`API de tareas disponible: ${tasksApiUrl}`);

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
