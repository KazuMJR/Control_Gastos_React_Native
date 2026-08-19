import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

const AUTH_TOKEN_KEY = "control_gastos_auth_token";

// In web, localhost works. For Expo Go, set EXPO_PUBLIC_GASTOS_API_URL to your PC LAN IP.
const baseURL = process.env.EXPO_PUBLIC_GASTOS_API_URL ?? "http://127.0.0.1:8000/api";

export type AuthUser = {
  id: number;
  name: string;
  email: string;
};

type AuthResponse = {
  token: string;
  token_type: "Bearer";
  user: AuthUser;
};

const gastosApi = axios.create({ baseURL, timeout: 10000 });

// Each protected Laravel request receives the saved Sanctum token automatically.
gastosApi.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  config.headers.Accept = "application/json";
  return config;
});

async function saveSession(data: AuthResponse) {
  await AsyncStorage.setItem(AUTH_TOKEN_KEY, data.token);
  return data.user;
}

export async function login(email: string, password: string) {
  const { data } = await gastosApi.post<AuthResponse>("/auth/login", {
    email,
    password,
    device_name: "Control de Gastos Expo",
  });

  return saveSession(data);
}

export async function register(name: string, email: string, password: string) {
  const { data } = await gastosApi.post<AuthResponse>("/auth/register", {
    name,
    email,
    password,
    password_confirmation: password,
    device_name: "Control de Gastos Expo",
  });

  return saveSession(data);
}

export async function restoreSession() {
  const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);

  if (!token) {
    return null;
  }

  const { data } = await gastosApi.get<AuthUser>("/usuario");
  return data;
}

export async function logout() {
  try {
    await gastosApi.post("/auth/logout");
  } finally {
    await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
  }
}
