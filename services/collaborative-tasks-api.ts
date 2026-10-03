import AsyncStorage from "@react-native-async-storage/async-storage";
import { create as createAxiosClient, isAxiosError } from "axios";
import { Platform } from "react-native";

const TOKEN_KEY = "collaborative_tasks_passport_token";
const configuredApiUrl = process.env.EXPO_PUBLIC_TASKS_API_URL?.trim();
const localApiUrl = Platform.OS === "android" ? "http://10.0.2.2:8001/api" : "http://127.0.0.1:8001/api";

export const COLLABORATIVE_TASKS_API_URL = (configuredApiUrl || localApiUrl).replace(/\/$/, "");
export const COLLABORATIVE_DEMO_EMAIL = "integracion@controlgastos.test";
export const COLLABORATIVE_DEMO_PASSWORD = "Tareas2026!";

export type CollaborativeCategory = {
  id: string;
  name: string;
  color: string;
};

export type TaskProgressGroup = {
  category_id: string | null;
  category_name: string;
  category_color: string;
  total_tasks: number;
  completed_tasks: number;
  pending_tasks: number;
  percentage: number;
  tasks: TaskProgressItem[];
};

export type TaskProgressItem = {
  id: string;
  title: string;
  description: string | null;
  completed: boolean;
  created_at: string;
};

export type TaskProgress = {
  range: {
    from: string;
    to: string;
  };
  summary: {
    total_tasks: number;
    completed_tasks: number;
    pending_tasks: number;
    percentage: number;
  };
  groups: TaskProgressGroup[];
};

export type CollaborativeTask = {
  id: string;
  title: string;
  description: string | null;
  categoryId: string | null;
  completed: boolean;
  category_name: string | null;
  category_color: string | null;
  created_at: string;
  updated_at: string;
};

type AuthResponse = {
  access_token: string;
};

type ValidationErrors = Record<string, string[]>;

const collaborativeTasksApi = createAxiosClient({
  baseURL: COLLABORATIVE_TASKS_API_URL,
  timeout: 12000,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

collaborativeTasksApi.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem(TOKEN_KEY);

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

async function saveToken(token: string) {
  await AsyncStorage.setItem(TOKEN_KEY, token);
}

export async function getCollaborativeToken() {
  return AsyncStorage.getItem(TOKEN_KEY);
}

export async function clearCollaborativeToken() {
  await AsyncStorage.removeItem(TOKEN_KEY);
}

export async function logoutFromCollaborativeApi() {
  try {
    await collaborativeTasksApi.post("/logout");
  } finally {
    await clearCollaborativeToken();
  }
}

export async function loginToCollaborativeApi(email: string, password: string) {
  const { data } = await collaborativeTasksApi.post<AuthResponse>("/login", {
    email: email.trim().toLowerCase(),
    password,
  });

  if (!data.access_token) {
    throw new Error("La API no devolvió un access_token de Passport.");
  }

  await saveToken(data.access_token);
}

export async function loginToCollaborativeDemo() {
  return loginToCollaborativeApi(COLLABORATIVE_DEMO_EMAIL, COLLABORATIVE_DEMO_PASSWORD);
}

export async function registerInCollaborativeApi(name: string, email: string, password: string) {
  const { data } = await collaborativeTasksApi.post<AuthResponse>("/register", {
    name: name.trim(),
    email: email.trim().toLowerCase(),
    password,
    password_confirmation: password,
  });

  if (!data.access_token) {
    throw new Error("La API no devolvió un access_token de Passport.");
  }

  await saveToken(data.access_token);
}

export async function getCollaborativeCategories() {
  const { data } = await collaborativeTasksApi.get<CollaborativeCategory[]>("/categories");
  return data;
}

export async function getTaskProgress(from: string, to: string) {
  const { data } = await collaborativeTasksApi.get<TaskProgress>("/tasks/progress", {
    params: { from, to },
  });
  return data;
}

export async function createCollaborativeTask(
  title: string,
  description: string,
  categoryId: string | null
) {
  const { data } = await collaborativeTasksApi.post<CollaborativeTask>("/tasks", {
    title: title.trim(),
    description: description.trim() || null,
    category_id: categoryId,
    completed: false,
  });
  return data;
}

export function collaborativeApiErrorMessage(error: unknown) {
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
    return `No fue posible conectar con ${COLLABORATIVE_TASKS_API_URL}. Ejecuta npm run dev, espera que ambos túneles indiquen que están listos y mantén la terminal abierta.`;
  }

  return `La API respondió con el estado ${error.response.status}.`;
}
