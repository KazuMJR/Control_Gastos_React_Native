import React, { createContext, useCallback, useEffect, useMemo, useState } from "react";

import {
  createPendingPayment,
  createExpense,
  deletePendingPayment,
  Expense,
  ExpenseCategory,
  expenseApiErrorMessage,
  getExpenseCategories,
  getExpenseHistory,
  getMonthlyPlan,
  MonthlyPlan,
  payPendingPayment,
  saveMonthlyPlan,
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

export function currentMonthKey() {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
}

export function todayKey() {
  const today = new Date();
  return `${currentMonthKey()}-${String(today.getDate()).padStart(2, "0")}`;
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [nombre, setNombre] = useState("Jason");
  const [correo, setCorreo] = useState("jason@email.com");
  const [gastos, setGastos] = useState<Expense[]>([]);
  const [categorias, setCategorias] = useState<ExpenseCategory[]>([]);
  const [expensesLoading, setExpensesLoading] = useState(true);
  const [gastosApiError, setGastosApiError] = useState<string | null>(null);
  const [deseados, setDeseados] = useState<CompraDeseada[]>([]);
  const [planMensual, setPlanMensual] = useState<MonthlyPlan>({
    month: currentMonthKey(),
    budget_id: null,
    budget_amount: 2500,
    allocations: [],
    pending_payments: [],
    summary: {
      spent_amount: 0,
      pending_amount: 0,
      available_amount: 2500,
      projected_available_amount: 2500,
      allocated_amount: 0,
      unallocated_amount: 2500,
    },
  });

  const totalGastadoMes = planMensual.summary.spent_amount;
  const presupuestoMensual = planMensual.budget_amount;
  const totalPendiente = planMensual.summary.pending_amount;
  const saldo = presupuestoMensual - totalGastadoMes;
  const saldoDespuesPendientes = saldo - totalPendiente;

  const refreshExpenses = useCallback(async () => {
    setExpensesLoading(true);
    try {
      const [history, expenseCategories, monthlyPlan] = await Promise.all([
        getExpenseHistory(currentMonthKey()),
        getExpenseCategories(),
        getMonthlyPlan(currentMonthKey()),
      ]);
      setGastos(history.data);
      setCategorias(expenseCategories);
      setPlanMensual(monthlyPlan);
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

  async function guardarPlanMensual(
    nuevoPresupuesto: number,
    distribuciones: { category_id: number; amount: number }[]
  ) {
    const savedPlan = await saveMonthlyPlan({
      month: currentMonthKey(),
      amount: nuevoPresupuesto,
      allocations: distribuciones,
    });
    setPlanMensual(savedPlan);
    return savedPlan;
  }

  async function agregarPagoPendiente(input: {
    descripcion: string;
    monto: number;
    fecha_vencimiento: string;
    categoria_id?: number | null;
    notas?: string | null;
  }) {
    await createPendingPayment(input);
    await refreshExpenses();
  }

  async function pagarPendiente(id: number) {
    await payPendingPayment(id, todayKey());
    await refreshExpenses();
  }

  async function eliminarPendiente(id: number) {
    await deletePendingPayment(id);
    await refreshExpenses();
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

    eliminarDeseado(compra.id);
    return comprado;
  }

  async function restablecerAplicacion() {
    setNombre("Jason");
    setCorreo("jason@email.com");
    setDeseados([]);
    await guardarPlanMensual(2500, []);
    await refreshExpenses();
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
        totalPendiente,
        saldoDespuesPendientes,
        planMensual,
        nombre,
        correo,
        gastos,
        categorias,
        expensesLoading,
        gastosApiError,
        deseados,
        totalDeseados,
        agregarGasto,
        guardarPlanMensual,
        agregarPagoPendiente,
        pagarPendiente,
        eliminarPendiente,
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
