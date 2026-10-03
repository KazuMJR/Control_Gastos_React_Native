import { Platform } from 'react-native';
import { router } from 'expo-router';
import { getToken, logout } from './services/authService';

export interface Category {
  id: string;
  name: string;
  color: string;
}

export interface Task {
  id: string;
  title: string;
  categoryId: string | null;
  completed: boolean;
  category_name?: string | null;
  category_color?: string | null;
}

export interface UserProfile {
  id: number;
  name: string;
  email: string;
}

const API_URL = Platform.OS === 'android' ? 'http://10.0.2.2:8000/api' : 'http://localhost:8000/api';

const getHeaders = async () => {
  const token = await getToken();
  return {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
};

const handleApiResponse = async (res: Response, fallbackMessage: string) => {
  if (res.status === 401) {
    await logout();
    router.replace('/login');
    throw new Error('No autorizado. Sesión expirada.');
  }
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    console.error(`[API Error ${res.status}]`, errorData);
    throw new Error(errorData.message || `${fallbackMessage} (HTTP ${res.status})`);
  }
};

export const getUserProfile = async (): Promise<UserProfile | null> => {
  try {
    const res = await fetch(`${API_URL}/me`, { headers: await getHeaders() });
    await handleApiResponse(res, 'Error al obtener perfil');
    const data = await res.json();
    return data.user;
  } catch (e) {
    console.error(e);
    return null;
  }
};

// ==========================================
// 1. CRUD DE CATEGORÍAS (Backend Laravel)
// ==========================================

export const getCategories = async (): Promise<Category[]> => {
  try {
    const res = await fetch(`${API_URL}/categories`, {
      headers: await getHeaders(),
    });
    await handleApiResponse(res, 'Error al obtener categorías');
    return await res.json();
  } catch (e) {
    console.error('Error al leer categorías del servidor:', e);
    return [];
  }
};

export const addCategory = async (name: string, color: string): Promise<Category> => {
  const res = await fetch(`${API_URL}/categories`, {
    method: 'POST',
    headers: await getHeaders(),
    body: JSON.stringify({ name: name.trim(), color }),
  });
  await handleApiResponse(res, 'Error agregando categoría');
  return await res.json();
};

export const updateCategory = async (id: string, name: string, color: string): Promise<void> => {
  const res = await fetch(`${API_URL}/categories/${id}`, {
    method: 'PUT',
    headers: await getHeaders(),
    body: JSON.stringify({ name: name.trim(), color }),
  });
  await handleApiResponse(res, 'Error editando categoría');
};

export const deleteCategory = async (id: string): Promise<void> => {
  const res = await fetch(`${API_URL}/categories/${id}`, {
    method: 'DELETE',
    headers: await getHeaders(),
  });
  await handleApiResponse(res, 'Error al eliminar categoría');
};

// ==========================================
// 2. CRUD DE TAREAS (Backend Laravel)
// ==========================================

export const getTasks = async (): Promise<Task[]> => {
  try {
    const res = await fetch(`${API_URL}/tasks`, {
      headers: await getHeaders(),
    });
    await handleApiResponse(res, 'Error al obtener tareas');
    return await res.json();
  } catch (e) {
    console.error('Error al leer tareas del servidor:', e);
    return [];
  }
};

export const addTask = async (title: string, categoryId: string | null): Promise<void> => {
  const res = await fetch(`${API_URL}/tasks`, {
    method: 'POST',
    headers: await getHeaders(),
    body: JSON.stringify({ title: title.trim(), category_id: categoryId }),
  });
  await handleApiResponse(res, 'Error agregando tarea');
};

export const toggleTaskCompleted = async (id: string): Promise<void> => {
  try {
    const getRes = await fetch(`${API_URL}/tasks/${id}`, { headers: await getHeaders() });
    await handleApiResponse(getRes, 'Error al consultar tarea');
    const task = await getRes.json();

    const putRes = await fetch(`${API_URL}/tasks/${id}`, {
      method: 'PUT',
      headers: await getHeaders(),
      body: JSON.stringify({ completed: !task.completed }),
    });
    await handleApiResponse(putRes, 'Error al actualizar estado de la tarea');
  } catch (e) {
    console.error('Error al marcar tarea como completada:', e);
  }
};

export const updateTask = async (id: string, title: string, categoryId: string | null): Promise<void> => {
  const res = await fetch(`${API_URL}/tasks/${id}`, {
    method: 'PUT',
    headers: await getHeaders(),
    body: JSON.stringify({ title: title.trim(), category_id: categoryId }),
  });
  await handleApiResponse(res, 'Error al editar tarea');
};

export const deleteTask = async (id: string): Promise<void> => {
  const res = await fetch(`${API_URL}/tasks/${id}`, {
    method: 'DELETE',
    headers: await getHeaders(),
  });
  await handleApiResponse(res, 'Error al eliminar tarea');
};