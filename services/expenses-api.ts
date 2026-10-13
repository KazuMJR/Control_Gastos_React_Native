import AsyncStorage from "@react-native-async-storage/async-storage";
import { AxiosResponse, create as createAxiosClient, isAxiosError } from "axios";
import { Platform } from "react-native";

const TOKEN_KEY = "control_gastos_passport_token_v2";
const configuredApiUrl = process.env.EXPO_PUBLIC_EXPENSES_API_URL?.trim();
const localApiUrl = Platform.OS === "android" ? "http://10.0.2.2:8000/api" : "http://127.0.0.1:8000/api";

export const EXPENSES_API_URL = (configuredApiUrl || localApiUrl).replace(/\/$/, "");
export const EXPENSES_DEMO_EMAIL = "integracion@controlgastos.test";
export const EXPENSES_DEMO_PASSWORD = "Tareas2026!";

const FULL_SCOPES = [
  "perfil.read",
  "categorias.read",
  "categorias.write",
  "categorias.delete",
  "gastos.read",
  "gastos.write",
  "gastos.delete",
  "plan.read",
  "plan.write",
];

export type ExpenseCategory = {
  id: number;
  nombre: string;
  color: string;
};

export type Expense = {
  id: number;
  descripcion: string;
  monto: number;
  fecha_gasto: string;
  notas: string | null;
  categoria_id: number | null;
  categoria: ExpenseCategory | null;
};

export type ExpenseCategorySummary = {
  category_id: number | null;
  category_name: string;
  category_color: string;
  expense_count: number;
  total_amount: number;
};

export type ExpenseSummary = {
  expense_count: number;
  total_amount: number;
  average_amount: number;
  by_category: ExpenseCategorySummary[];
};

export type ExpenseHistory = {
  data: Expense[];
  current_page: number;
  last_page: number;
  total: number;
  summary: ExpenseSummary;
};

export type BudgetAllocation = {
  id: number;
  categoria_id: number;
  monto: number;
  categoria: ExpenseCategory;
};

export type PendingPayment = {
  id: number;
  descripcion: string;
  monto: number;
  fecha_vencimiento: string;
  estado: "pendiente" | "pagado";
  fecha_pago: string | null;
  notas: string | null;
  categoria_id: number | null;
  categoria: ExpenseCategory | null;
  gasto_id: number | null;
};

export type MonthlyPlan = {
  month: string;
  budget_id: number | null;
  budget_amount: number;
  allocations: BudgetAllocation[];
  pending_payments: PendingPayment[];
  summary: {
    spent_amount: number;
    pending_amount: number;
    available_amount: number;
    projected_available_amount: number;
    allocated_amount: number;
    unallocated_amount: number;
  };
};

type RawExpense = Omit<Expense, "monto" | "fecha_gasto"> & {
  monto: number | string;
  fecha_gasto: string;
};

type RawExpenseHistory = Omit<ExpenseHistory, "data" | "summary"> & {
  data: RawExpense[];
  summary: Omit<ExpenseSummary, "total_amount" | "average_amount" | "by_category"> & {
    total_amount: number | string;
    average_amount: number | string;
    by_category: (Omit<ExpenseCategorySummary, "total_amount"> & {
      total_amount: number | string;
    })[];
  };
};

type RawBudgetAllocation = Omit<BudgetAllocation, "monto"> & { monto: number | string };
type RawPendingPayment = Omit<PendingPayment, "monto"> & {
  monto: number | string;
  fecha_vencimiento: string;
  fecha_pago: string | null;
};
type RawMonthlyPlan = Omit<MonthlyPlan, "budget_amount" | "allocations" | "pending_payments" | "summary"> & {
  budget_amount: number | string;
  allocations: RawBudgetAllocation[];
  pending_payments: RawPendingPayment[];
  summary: {
    spent_amount: number | string;
    pending_amount: number | string;
    available_amount: number | string;
    projected_available_amount: number | string;
    allocated_amount: number | string;
    unallocated_amount: number | string;
  };
};

type AuthResponse = {
  token: string;
};

type ValidationErrors = Record<string, string[]>;

const expensesApi = createAxiosClient({
  baseURL: EXPENSES_API_URL,
  timeout: 15000,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

expensesApi.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem(TOKEN_KEY);

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

async function loginToExpensesApi() {
  const { data } = await expensesApi.post<AuthResponse>("/auth/login", {
    email: EXPENSES_DEMO_EMAIL,
    password: EXPENSES_DEMO_PASSWORD,
    device_name: "Aplicación móvil",
    scopes: FULL_SCOPES,
  });

  if (!data.token) {
    throw new Error("La API de gastos no devolvió un token de Passport.");
  }

  await AsyncStorage.setItem(TOKEN_KEY, data.token);
}

async function ensureExpenseSession() {
  if (!(await AsyncStorage.getItem(TOKEN_KEY))) {
    await loginToExpensesApi();
  }
}

async function authorizedRequest<T>(request: () => Promise<AxiosResponse<T>>) {
  await ensureExpenseSession();

  try {
    return (await request()).data;
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 401) {
      await AsyncStorage.removeItem(TOKEN_KEY);
      await loginToExpensesApi();
      return (await request()).data;
    }

    throw error;
  }
}

function normalizeExpense(expense: RawExpense): Expense {
  return {
    ...expense,
    monto: Number(expense.monto),
    fecha_gasto: expense.fecha_gasto.slice(0, 10),
  };
}

function normalizePendingPayment(payment: RawPendingPayment): PendingPayment {
  return {
    ...payment,
    monto: Number(payment.monto),
    fecha_vencimiento: payment.fecha_vencimiento.slice(0, 10),
    fecha_pago: payment.fecha_pago?.slice(0, 10) ?? null,
  };
}

function normalizeMonthlyPlan(plan: RawMonthlyPlan): MonthlyPlan {
  return {
    ...plan,
    budget_amount: Number(plan.budget_amount),
    allocations: plan.allocations.map((allocation) => ({
      ...allocation,
      monto: Number(allocation.monto),
    })),
    pending_payments: plan.pending_payments.map(normalizePendingPayment),
    summary: {
      spent_amount: Number(plan.summary.spent_amount),
      pending_amount: Number(plan.summary.pending_amount),
      available_amount: Number(plan.summary.available_amount),
      projected_available_amount: Number(plan.summary.projected_available_amount),
      allocated_amount: Number(plan.summary.allocated_amount),
      unallocated_amount: Number(plan.summary.unallocated_amount),
    },
  };
}

export async function getExpenseHistory(month: string): Promise<ExpenseHistory> {
  const data = await authorizedRequest(() =>
    expensesApi.get<RawExpenseHistory>("/gastos", {
      params: { month, per_page: 100 },
    })
  );

  return {
    ...data,
    data: data.data.map(normalizeExpense),
    summary: {
      ...data.summary,
      total_amount: Number(data.summary.total_amount),
      average_amount: Number(data.summary.average_amount),
      by_category: data.summary.by_category.map((category) => ({
        ...category,
        total_amount: Number(category.total_amount),
      })),
    },
  };
}

export async function getExpenseCategories() {
  return authorizedRequest(() => expensesApi.get<ExpenseCategory[]>("/categorias"));
}

export async function getExpense(id: number) {
  const data = await authorizedRequest(() => expensesApi.get<RawExpense>(`/gastos/${id}`));
  return normalizeExpense(data);
}

export async function createExpense(input: {
  descripcion: string;
  monto: number;
  fecha_gasto: string;
  categoria_id?: number | null;
  notas?: string | null;
}) {
  const data = await authorizedRequest(() => expensesApi.post<RawExpense>("/gastos", input));
  return normalizeExpense(data);
}

export async function getMonthlyPlan(month: string) {
  const data = await authorizedRequest(() =>
    expensesApi.get<RawMonthlyPlan>("/plan-mensual", { params: { month } })
  );
  return normalizeMonthlyPlan(data);
}

export async function saveMonthlyPlan(input: {
  month: string;
  amount: number;
  allocations: { category_id: number; amount: number }[];
}) {
  const data = await authorizedRequest(() =>
    expensesApi.put<RawMonthlyPlan>("/plan-mensual", input)
  );
  return normalizeMonthlyPlan(data);
}

export async function createPendingPayment(input: {
  descripcion: string;
  monto: number;
  fecha_vencimiento: string;
  categoria_id?: number | null;
  notas?: string | null;
}) {
  const data = await authorizedRequest(() =>
    expensesApi.post<RawPendingPayment>("/pagos-pendientes", input)
  );
  return normalizePendingPayment(data);
}

export async function payPendingPayment(id: number, paymentDate?: string) {
  const data = await authorizedRequest(() =>
    expensesApi.post<RawPendingPayment>(`/pagos-pendientes/${id}/pagar`, {
      payment_date: paymentDate,
    })
  );
  return normalizePendingPayment(data);
}

export async function deletePendingPayment(id: number) {
  return authorizedRequest(() => expensesApi.delete(`/pagos-pendientes/${id}`));
}

export async function clearExpenseSession() {
  await AsyncStorage.removeItem(TOKEN_KEY);
}

export function expenseApiErrorMessage(error: unknown) {
  if (!isAxiosError(error)) {
    return error instanceof Error ? error.message : "Ocurrió un error inesperado.";
  }

  const validationErrors = error.response?.data?.errors as ValidationErrors | undefined;
  if (validationErrors) {
    return Object.values(validationErrors).flat().join("\n");
  }

  const apiMessage = error.response?.data?.message;
  if (typeof apiMessage === "string") {
    return apiMessage;
  }

  if (!error.response) {
    return "No fue posible actualizar tus gastos. Ejecuta npm run dev y mantén la terminal abierta.";
  }

  return `No se pudo completar la operación (estado ${error.response.status}).`;
}
