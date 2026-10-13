import React, { createContext, useCallback, useEffect, useMemo, useState } from "react";

import {
  createExpense,
  Expense,
  ExpenseCategory,
  expenseApiErrorMessage,
  getExpenseCategories,
  getExpenseHistory,
} from "../services/expenses-api";

export const AppContext = createContext<any>(null);

// Tipo de cambio de referencia para comparar precios del catálogo con el presupuesto en quetzales.
export const USD_TO_GTQ = 7.75;

export type CompraDeseada = {
  id: number;
  titulo: string;
  imagen: string;
  precioQuetzales: number;
};

function currentMonthKey() {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
}

function todayKey() {
  const today = new Date();
  return `${currentMonthKey()}-${String(today.getDate()).padStart(2, "0")}`;
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [presupuestoMensual, setPresupuestoMensual] = useState(2500);
  const [nombre, setNombre] = useState("Jason");
  const [correo, setCorreo] = useState("jason@email.com");
  const [gastos, setGastos] = useState<Expense[]>([]);
  const [categorias, setCategorias] = useState<ExpenseCategory[]>([]);
  const [expensesLoading, setExpensesLoading] = useState(true);
  const [gastosApiError, setGastosApiError] = useState<string | null>(null);
  const [deseados, setDeseados] = useState<CompraDeseada[]>([]);

  const totalGastadoMes = useMemo(
    () => gastos.reduce((total, gasto) => total + gasto.monto, 0),
    [gastos]
  );
  const saldo = Math.max(0, presupuestoMensual - totalGastadoMes);

  const refreshExpenses = useCallback(async () => {
    setExpensesLoading(true);
    try {
      const [history, expenseCategories] = await Promise.all([
        getExpenseHistory(currentMonthKey()),
        getExpenseCategories(),
      ]);
      setGastos(history.data);
      setCategorias(expenseCategories);
      setGastosApiError(null);
    } catch (error) {
      setGastosApiError(expenseApiErrorMessage(error));
    } finally {
      setExpensesLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      void refreshExpenses();
    }, 0);

    return () => clearTimeout(timeout);
  }, [refreshExpenses]);

  async function agregarGasto(
    descripcion: string,
    monto: number,
    categoriaId: number | null = null,
    notas = ""
  ) {
    if (monto > saldo) {
      return false;
    }

    await createExpense({
      descripcion: descripcion.trim(),
      monto,
      fecha_gasto: todayKey(),
      categoria_id: categoriaId,
      notas: notas.trim() || null,
    });
    await refreshExpenses();
    return true;
  }

  function actualizarSaldo(nuevoPresupuesto: number) {
    if (!Number.isFinite(nuevoPresupuesto) || nuevoPresupuesto < totalGastadoMes) {
      return false;
    }

    setPresupuestoMensual(nuevoPresupuesto);
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

  async function comprarDeseado(compra: CompraDeseada) {
    const comprado = await agregarGasto(
      `Compra: ${compra.titulo}`,
      compra.precioQuetzales,
      categorias.find((categoria) => categoria.nombre === "Compras")?.id ?? null,
      "Compra registrada desde la lista de deseos."
    );

    if (comprado) {
      eliminarDeseado(compra.id);
    }

    return comprado;
  }

  function restablecerAplicacion() {
    setPresupuestoMensual(2500);
    setNombre("Jason");
    setCorreo("jason@email.com");
    setDeseados([]);
    refreshExpenses();
  }

  const totalDeseados = useMemo(
    () => deseados.reduce((total, compra) => total + compra.precioQuetzales, 0),
    [deseados]
  );

  return (
    <AppContext.Provider
      value={{
        saldo,
        presupuestoMensual,
        totalGastadoMes,
        nombre,
        correo,
        gastos,
        categorias,
        expensesLoading,
        gastosApiError,
        deseados,
        totalDeseados,
        agregarGasto,
        actualizarSaldo,
        agregarDeseado,
        eliminarDeseado,
        comprarDeseado,
        refreshExpenses,
        restablecerAplicacion,
        setNombre,
        setCorreo,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}
