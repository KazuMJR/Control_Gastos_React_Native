import React, { createContext, useMemo, useState } from "react";

export const AppContext = createContext<any>(null);

// Tipo de cambio de referencia para comparar precios del catalogo con el saldo en quetzales.
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

  function agregarGasto(descripcion: string, monto: number) {
    // No permite registrar compras cuyo precio supera el saldo disponible.
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

  function actualizarSaldo(nuevoSaldo: number) {
    if (!Number.isFinite(nuevoSaldo) || nuevoSaldo < 0) {
      return false;
    }

    // El usuario define su saldo inicial o disponible; las compras usan este valor actualizado.
    setSaldo(nuevoSaldo);
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
    // Al comprar, el articulo pasa de deseados al historial local de gastos.
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
    // Suma de la lista para indicar al usuario si todo su plan de compras alcanza.
    () => deseados.reduce((total, compra) => total + compra.precioQuetzales, 0),
    [deseados]
  );

  return (
    <AppContext.Provider
      value={{
        saldo,
        nombre,
        correo,
        gastos,
        deseados,
        totalDeseados,
        agregarGasto,
        actualizarSaldo,
        agregarDeseado,
        eliminarDeseado,
        comprarDeseado,
        restablecerAplicacion,
        setNombre,
        setCorreo,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}
