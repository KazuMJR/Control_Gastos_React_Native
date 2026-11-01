import AsyncStorage from "@react-native-async-storage/async-storage";
import { create as createAxiosClient, isAxiosError } from "axios";
import { Platform } from "react-native";

const TOKEN_KEY = "collaborative_tasks_passport_token";
const configuredApiUrl = process.env.EXPO_PUBLIC_TASKS_API_URL?.trim();
const localApiUrl = Platform.OS === "android" ? "http://10.0.2.2:8001/api" : "http://127.0.0.1:8001/api";

export const COLLABORATIVE_TASKS_API_URL = (configuredApiUrl || localApiUrl).replace(/\/$/, "");
// Cuenta compartida para la demostración académica. También se usa para
// precargar el formulario, por lo que el usuario puede editarla o borrarla.
export const COLLABORATIVE_DEMO_EMAIL = "hennrryc@gmail.com";
export const COLLABORATIVE_DEMO_PASSWORD = "123456789";

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
  description?: string | null;
  categoryId: string | null;
  completed: boolean;
  category_name: string | null;
  category_color: string | null;
  created_at?: string;
  updated_at?: string;
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

function buildProgressFromTasks(tasks: CollaborativeTask[], from: string, to: string): TaskProgress {
  // Algunas versiones anteriores de la API no incluyen created_at. Esas tareas
  // se conservan para que el tablero siga siendo útil hasta actualizar el backend.
  const filteredTasks = tasks.filter((task) => {
    const createdDate = task.created_at?.slice(0, 10);
    return !createdDate || (createdDate >= from && createdDate <= to);
  });
  const groups = new Map<string, CollaborativeTask[]>();

  for (const task of filteredTasks) {
    const key = task.categoryId ? `category:${task.categoryId}` : "uncategorized";
    groups.set(key, [...(groups.get(key) ?? []), task]);
  }

  const mappedGroups = [...groups.values()]
    .map<TaskProgressGroup>((groupTasks) => {
      const firstTask = groupTasks[0];
      const completed = groupTasks.filter((task) => task.completed).length;
      const total = groupTasks.length;

      return {
        category_id: firstTask.categoryId,
        category_name: firstTask.category_name ?? "Sin categoría",
        category_color: firstTask.category_color ?? "#94A3B8",
        total_tasks: total,
        completed_tasks: completed,
        pending_tasks: total - completed,
        percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
        tasks: groupTasks.map((task) => ({
          id: String(task.id),
          title: task.title,
          description: task.description ?? null,
          completed: Boolean(task.completed),
          created_at: task.created_at ?? "",
        })),
      };
    })
    .sort((left, right) => left.category_name.localeCompare(right.category_name, "es"));
  const completed = filteredTasks.filter((task) => task.completed).length;
  const total = filteredTasks.length;

  return {
    range: { from, to },
    summary: {
      total_tasks: total,
      completed_tasks: completed,
      pending_tasks: total - completed,
      percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
    },
    groups: mappedGroups,
  };
}

export async function getTaskProgress(from: string, to: string) {
  try {
    const { data } = await collaborativeTasksApi.get<TaskProgress>("/tasks/progress", {
      params: { from, to },
    });
    return data;
  } catch (error) {
    // En el despliegue anterior, apiResource interpreta "progress" como un ID.
    // El respaldo permite trabajar con /tasks y desaparece automáticamente al
    // publicar la versión nueva que ya contiene el reporte por fechas.
    if (!isAxiosError(error) || error.response?.status !== 404) {
      throw error;
    }

    const { data } = await collaborativeTasksApi.get<CollaborativeTask[]>("/tasks");
    return buildProgressFromTasks(data, from, to);
  }
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
    return "No fue posible actualizar las tareas. Ejecuta npm run dev, espera a que termine de iniciar y mantén la terminal abierta.";
  }

  return `No se pudo completar la operación (estado ${error.response.status}).`;
}
