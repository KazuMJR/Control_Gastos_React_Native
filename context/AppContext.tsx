import React, { createContext, useState } from "react";

export const AppContext = createContext<any>(null);

export function AppProvider({ children }: any) {
  const [saldo, setSaldo] = useState(2500);

  const [nombre, setNombre] = useState("Jason");

  const [correo, setCorreo] = useState("jason@email.com");

  const [gastos, setGastos] = useState<any[]>([]);

  function agregarGasto(descripcion: string, monto: number) {
    setSaldo((s) => s - monto);

    setGastos((lista) => [
      ...lista,
      {
        id: Date.now().toString(),
        descripcion,
        monto,
      },
    ]);
  }

  function restablecerAplicacion() {
    setSaldo(2500);
    setNombre("Jason");
    setCorreo("jason@email.com");
    setGastos([]);
  }

  return (
    <AppContext.Provider
      value={{
        saldo,
        nombre,
        correo,
        gastos,
        agregarGasto,
        restablecerAplicacion,
        setNombre,
        setCorreo,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}