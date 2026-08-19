import React, { createContext, useEffect, useMemo, useState } from "react";

import { AuthUser, login, logout, register, restoreSession } from "../services/auth-api";

export const AppContext = createContext<any>(null);

export const USD_TO_GTQ = 7.75;

export type CompraDeseada = {
  id: number;
  titulo: string;
  imagen: string;
  precioUsd: number;
  precioQuetzales: number;
};

export function AppProvider({ children }: any) {
  const [saldo, setSaldo] = useState(2500);

  const [nombre, setNombre] = useState("Jason");

  const [correo, setCorreo] = useState("jason@email.com");

  const [gastos, setGastos] = useState<any[]>([]);
  const [deseados, setDeseados] = useState<CompraDeseada[]>([]);
  const [usuario, setUsuario] = useState<AuthUser | null>(null);
  const [cargandoSesion, setCargandoSesion] = useState(true);

  // Restores the Sanctum session so the app stays locked after a refresh.
  useEffect(() => {
    restoreSession()
      .then(setUsuario)
      .catch(() => setUsuario(null))
      .finally(() => setCargandoSesion(false));
  }, []);

  function agregarGasto(descripcion: string, monto: number) {
    if (monto > saldo) {
      return false;
    }

    setSaldo((s) => s - monto);

    setGastos((lista) => [
      ...lista,
      {
        id: Date.now().toString(),
        descripcion,
        monto,
      },
    ]);

    return true;
  }

  function agregarDeseado(compra: CompraDeseada) {
    if (deseados.some((item) => item.id === compra.id)) {
      return false;
    }

    setDeseados((lista) => [...lista, compra]);
    return true;
  }

  function eliminarDeseado(id: number) {
    setDeseados((lista) => lista.filter((item) => item.id !== id));
  }

  function comprarDeseado(compra: CompraDeseada) {
    const comprado = agregarGasto(`Compra: ${compra.titulo}`, compra.precioQuetzales);

    if (comprado) {
      eliminarDeseado(compra.id);
    }

    return comprado;
  }

  function restablecerAplicacion() {
    setSaldo(2500);
    setNombre("Jason");
    setCorreo("jason@email.com");
    setGastos([]);
    setDeseados([]);
  }

  const totalDeseados = useMemo(
    () => deseados.reduce((total, compra) => total + compra.precioQuetzales, 0),
    [deseados]
  );

  async function iniciarSesion(email: string, password: string) {
    const user = await login(email, password);
    setUsuario(user);
  }

  async function crearCuenta(name: string, email: string, password: string) {
    const user = await register(name, email, password);
    setUsuario(user);
    setNombre(user.name);
    setCorreo(user.email);
  }

  async function cerrarSesion() {
    await logout();
    setUsuario(null);
    setDeseados([]);
  }

  return (
    <AppContext.Provider
      value={{
        saldo,
        nombre,
        correo,
        gastos,
        deseados,
        totalDeseados,
        usuario,
        cargandoSesion,
        agregarGasto,
        agregarDeseado,
        eliminarDeseado,
        comprarDeseado,
        restablecerAplicacion,
        iniciarSesion,
        crearCuenta,
        cerrarSesion,
        setNombre,
        setCorreo,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}
