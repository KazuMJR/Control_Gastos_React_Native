import Ionicons from "@expo/vector-icons/Ionicons";
import { isAxiosError } from "axios";
import { Href, router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import {
  getExternalProducts,
  loginToExternalApi,
  Product,
} from "../../services/external-api";

const DEMO_USERNAME = "emilys";
const DEMO_PASSWORD = "emilyspass";

function messageFromError(error: unknown) {
  if (isAxiosError(error)) {
    return error.response?.data?.message ?? "No se pudo conectar con el servicio externo.";
  }

  return "Ocurrió un error inesperado. Inténtalo de nuevo.";
}

export default function MercadoScreen() {
  const [username, setUsername] = useState(DEMO_USERNAME);
  const [password, setPassword] = useState(DEMO_PASSWORD);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [loggingIn, setLoggingIn] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [search, setSearch] = useState("");

  const filteredProducts = useMemo(
    () =>
      products.filter((product) =>
        `${product.title} ${product.category}`.toLowerCase().includes(search.toLowerCase())
      ),
    [products, search]
  );

  const loadProducts = async () => {
    setLoading(true);

    try {
      setProducts(await getExternalProducts());
    } catch (error) {
      Alert.alert("No se pudo cargar", messageFromError(error));
    } finally {
      setLoading(false);
    }
  };

  const loginToCatalog = async () => {
    if (!username.trim() || !password) {
      Alert.alert("Datos requeridos", "Ingresa usuario y contrasena.");
      return;
    }

    setLoggingIn(true);
    try {
      // This is the required external API authentication: credentials -> token -> catalog requests.
      await loginToExternalApi(username.trim(), password);
      setAuthenticated(true);
    } catch (error) {
      Alert.alert("Acceso al catalogo denegado", messageFromError(error));
    } finally {
      setLoggingIn(false);
    }
  };

  useEffect(() => {
    if (authenticated) {
      loadProducts();
    }
  }, [authenticated]);

  if (!authenticated) {
    return (
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.loginContainer}>
        <View style={styles.loginCard}>
          <Ionicons name="cart-outline" size={42} color="#2563EB" />
          <Text style={styles.title}>Acceso al catalogo</Text>
          <Text style={styles.description}>Autenticate con la API externa para obtener su token y consultar los productos.</Text>
          <TextInput autoCapitalize="none" onChangeText={setUsername} placeholder="Usuario externo" style={styles.input} value={username} />
          <TextInput onChangeText={setPassword} placeholder="Contrasena externa" secureTextEntry style={styles.input} value={password} />
          <Text style={styles.hint}>Demo: emilys / emilyspass</Text>
          <Pressable disabled={loggingIn} onPress={loginToCatalog} style={styles.primaryButton}>
            {loggingIn ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryButtonText}>Obtener token y ver catalogo</Text>}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Catalogo de compras</Text>
          <Text style={styles.connected}>Productos e imagenes desde DummyJSON</Text>
        </View>
        <Pressable accessibilityLabel="Actualizar productos" onPress={loadProducts} style={styles.refreshButton}>
          <Ionicons name="refresh" size={22} color="#2563EB" />
        </Pressable>
      </View>

      <TextInput
        autoCapitalize="none"
        onChangeText={setSearch}
        placeholder="Buscar producto o categoría"
        style={styles.searchInput}
        value={search}
      />

      {loading && products.length === 0 ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>Consultando la API…</Text>
        </View>
      ) : (
        <FlatList
          contentContainerStyle={styles.listContent}
          data={filteredProducts}
          keyExtractor={(item) => item.id.toString()}
          ListEmptyComponent={<Text style={styles.emptyText}>No hay productos que coincidan.</Text>}
          refreshing={loading}
          onRefresh={loadProducts}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => router.push(`/producto/${item.id}` as Href)}
              style={styles.productCard}
            >
              <Image source={{ uri: item.thumbnail }} style={styles.thumbnail} />
              <View style={styles.productInfo}>
                <Text numberOfLines={1} style={styles.productTitle}>{item.title}</Text>
                <Text numberOfLines={1} style={styles.category}>{item.category}</Text>
                <Text style={styles.price}>USD {item.price.toFixed(2)}</Text>
              </View>
              <Ionicons name="chevron-forward" size={22} color="#94A3B8" />
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F4F6F8", padding: 16 },
  loginContainer: { flex: 1, backgroundColor: "#F4F6F8", justifyContent: "center", padding: 20 },
  loginCard: { backgroundColor: "#FFFFFF", borderRadius: 16, elevation: 3, padding: 24 },
  title: { color: "#1E3A8A", fontSize: 24, fontWeight: "bold" },
  description: { color: "#475569", lineHeight: 21, marginBottom: 18, marginTop: 8 },
  input: { backgroundColor: "#F8FAFC", borderColor: "#CBD5E1", borderRadius: 10, borderWidth: 1, marginBottom: 12, padding: 14 },
  hint: { color: "#64748B", fontSize: 12, marginBottom: 16 },
  primaryButton: { alignItems: "center", backgroundColor: "#2563EB", borderRadius: 10, minHeight: 50, justifyContent: "center", padding: 14 },
  primaryButtonText: { color: "#FFFFFF", fontWeight: "bold" },
  header: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", marginBottom: 16, marginTop: 4 },
  connected: { color: "#15803D", fontSize: 13, marginTop: 3 },
  refreshButton: { backgroundColor: "#DBEAFE", borderRadius: 22, padding: 11 },
  searchInput: { backgroundColor: "#FFFFFF", borderColor: "#CBD5E1", borderRadius: 10, borderWidth: 1, marginBottom: 12, padding: 13 },
  centered: { alignItems: "center", flex: 1, justifyContent: "center" },
  loadingText: { color: "#64748B", marginTop: 12 },
  listContent: { paddingBottom: 18 },
  productCard: { alignItems: "center", backgroundColor: "#FFFFFF", borderRadius: 12, elevation: 2, flexDirection: "row", marginBottom: 10, padding: 10 },
  thumbnail: { backgroundColor: "#E2E8F0", borderRadius: 8, height: 64, width: 64 },
  productInfo: { flex: 1, marginHorizontal: 12 },
  productTitle: { color: "#0F172A", fontSize: 16, fontWeight: "bold" },
  category: { color: "#64748B", fontSize: 13, marginTop: 3, textTransform: "capitalize" },
  price: { color: "#15803D", fontSize: 15, fontWeight: "bold", marginTop: 6 },
  emptyText: { color: "#64748B", padding: 30, textAlign: "center" },
});
