import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

const TOKEN_KEY = "dummyjson_access_token";

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

export async function getExternalProducts() {
  const { data } = await externalApi.get<ProductsResponse>("/auth/products?limit=100");
  return data.products;
}

export async function getExternalProduct(id: string) {
  const { data } = await externalApi.get<Product>(`/auth/products/${id}`);
  return data;
}
