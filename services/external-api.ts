import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

const TOKEN_KEY = "dummyjson_catalog_token";
const CATALOG_USERNAME = "emilys";
const CATALOG_PASSWORD = "emilyspass";

export type Product = {
  id: number;
  title: string;
  description: string;
  category: string;
  price: number;
  discountPercentage: number;
  rating: number;
  stock: number;
  brand?: string;
  thumbnail: string;
  images: string[];
};

type AuthResponse = {
  accessToken: string;
};

type ProductsResponse = {
  products: Product[];
};

export const externalApi = axios.create({
  baseURL: "https://dummyjson.com",
  timeout: 10000,
});

externalApi.interceptors.request.use(async (config) => {
  // Todas las consultas posteriores incluyen el token recibido en el login externo.
  const token = await AsyncStorage.getItem(TOKEN_KEY);

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export async function loginToExternalApi(username: string, password: string) {
  const { data } = await externalApi.post<AuthResponse>("/auth/login", {
    username,
    password,
    expiresInMins: 60,
  });

  await AsyncStorage.setItem(TOKEN_KEY, data.accessToken);
}

// DummyJSON protege el catalogo: primero se autentica y luego Axios envia el token.
async function ensureCatalogSession() {
  const token = await AsyncStorage.getItem(TOKEN_KEY);

  if (!token) {
    await loginToExternalApi(CATALOG_USERNAME, CATALOG_PASSWORD);
  }
}

export async function getExternalProducts() {
  await ensureCatalogSession();

  try {
    const { data } = await externalApi.get<ProductsResponse>("/auth/products?limit=0");
    return data.products;
  } catch (error) {
    // Si el token externo vence, se renueva una vez y se repite la consulta.
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      await AsyncStorage.removeItem(TOKEN_KEY);
      await ensureCatalogSession();
      const { data } = await externalApi.get<ProductsResponse>("/auth/products?limit=0");
      return data.products;
    }

    throw error;
  }
}

export async function getExternalProduct(id: string) {
  await ensureCatalogSession();
  const { data } = await externalApi.get<Product>(`/auth/products/${id}`);
  return data;
}
