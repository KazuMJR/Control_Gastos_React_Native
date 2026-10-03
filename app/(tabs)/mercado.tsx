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
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";

import {
  getExternalProducts,
  loginToExternalApi,
  Product,
} from "../../services/external-api";
import { productMatchesSearch } from "../../services/product-localization";
import { USD_TO_GTQ } from "../../context/AppContext";

const DEMO_USERNAME = "emilys";
const DEMO_PASSWORD = "emilyspass";

type SortOption = "featured" | "price" | "rating" | "discount";

const SORT_OPTIONS: { id: SortOption; label: string }[] = [
  { id: "featured", label: "Destacados" },
  { id: "discount", label: "Ofertas" },
  { id: "price", label: "Menor precio" },
  { id: "rating", label: "Mejor valorados" },
];

function messageFromError(error: unknown) {
  if (isAxiosError(error)) {
    return error.response?.data?.message ?? "No se pudo conectar con el servicio externo.";
  }

  return "Ocurrió un error inesperado. Inténtalo de nuevo.";
}

export default function MercadoScreen() {
  // Limita los intentos de acceso al catalogo y aplica un bloqueo temporal.
  const MAX_LOGIN_ATTEMPTS = 5;
  const LOCK_DURATION_MS = 3 * 60 * 1000;
  const [username, setUsername] = useState(DEMO_USERNAME);
  const [password, setPassword] = useState(DEMO_PASSWORD);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [loggingIn, setLoggingIn] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [sortOption, setSortOption] = useState<SortOption>("featured");
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockUntil, setLockUntil] = useState<number | null>(null);
  const [remainingLockMs, setRemainingLockMs] = useState(0);
  const { width } = useWindowDimensions();
  const columns = width >= 1180 ? 4 : width >= 760 ? 3 : 2;
  const productCardWidth = (width - 28 - (columns - 1) * 10) / columns;

  // El boton y el formulario se desactivan mientras el bloqueo siga vigente.
  const isLocked = lockUntil !== null && remainingLockMs > 0;

  useEffect(() => {
    if (!lockUntil) {
      return;
    }

    // Actualiza el contador visible cada segundo y libera el acceso al terminar.
    const updateRemainingTime = () => {
      const remaining = Math.max(0, lockUntil - Date.now());
      setRemainingLockMs(remaining);

      if (remaining === 0) {
        setLockUntil(null);
        setFailedAttempts(0);
      }
    };

    updateRemainingTime();
    const timer = setInterval(updateRemainingTime, 1000);

    return () => clearInterval(timer);
  }, [lockUntil]);

  const categories = useMemo(
    () => [
      "Todos",
      ...Array.from(new Set(products.map((product) => product.category))).sort((a, b) =>
        a.localeCompare(b, "es")
      ),
    ],
    [products]
  );

  const filteredProducts = useMemo(() => {
    const matches = products.filter(
      (product) =>
        (selectedCategory === "Todos" || product.category === selectedCategory) &&
        productMatchesSearch(product, search)
    );

    if (sortOption === "price") {
      return [...matches].sort((a, b) => a.price - b.price);
    }

    if (sortOption === "rating") {
      return [...matches].sort((a, b) => b.rating - a.rating);
    }

    if (sortOption === "discount") {
      return [...matches].sort((a, b) => b.discountPercentage - a.discountPercentage);
    }

    return matches;
  }, [products, search, selectedCategory, sortOption]);

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
    if (isLocked) {
      return;
    }

    if (!username.trim() || !password) {
      Alert.alert("Datos requeridos", "Ingresa usuario y contrasena.");
      return;
    }

    setLoggingIn(true);
    try {
      // This is the required external API authentication: credentials -> token -> catalog requests.
      await loginToExternalApi(username.trim(), password);
      setAuthenticated(true);
      setFailedAttempts(0);
      await loadProducts();
    } catch (error) {
      const nextFailedAttempts = failedAttempts + 1;
      setFailedAttempts(nextFailedAttempts);

      // El quinto fallo informa al usuario y comienza los tres minutos de espera.
      if (nextFailedAttempts >= MAX_LOGIN_ATTEMPTS) {
        setLockUntil(Date.now() + LOCK_DURATION_MS);
        Alert.alert(
          "Acceso bloqueado",
          "Ya utilizaste tus 5 intentos. Espera 3 minutos antes de volver a intentarlo."
        );
        return;
      }

      Alert.alert("Acceso al catalogo denegado", messageFromError(error));
    } finally {
      setLoggingIn(false);
    }
  };

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
          {isLocked ? (
            <Text style={styles.lockMessage}>
              Acceso bloqueado. Podrás intentarlo de nuevo en {Math.ceil(remainingLockMs / 1000)} segundos.
            </Text>
          ) : null}
          <Pressable disabled={loggingIn || isLocked} onPress={loginToCatalog} style={styles.primaryButton}>
            {loggingIn ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryButtonText}>{isLocked ? "Acceso bloqueado" : "Obtener token y ver catalogo"}</Text>}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>TIENDA EN LÍNEA</Text>
          <Text style={styles.title}>Mercado</Text>
        </View>
        <Pressable accessibilityLabel="Actualizar productos" onPress={loadProducts} style={styles.refreshButton}>
          <Ionicons name="refresh" size={22} color="#2563EB" />
        </Pressable>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#64748B" />
        <TextInput
          autoCapitalize="none"
          onChangeText={setSearch}
          placeholder="Buscar en español"
          placeholderTextColor="#94A3B8"
          style={styles.searchInput}
          value={search}
        />
        {search ? (
          <Pressable accessibilityLabel="Limpiar búsqueda" onPress={() => setSearch("")}>
            <Ionicons name="close-circle" size={20} color="#94A3B8" />
          </Pressable>
        ) : null}
      </View>

      {loading && products.length === 0 ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>Consultando la API…</Text>
        </View>
      ) : (
        <FlatList
          key={`catalog-${columns}`}
          columnWrapperStyle={styles.productRow}
          contentContainerStyle={styles.listContent}
          data={filteredProducts}
          keyExtractor={(item) => item.id.toString()}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="storefront-outline" size={48} color="#94A3B8" />
              <Text style={styles.emptyTitle}>No encontramos productos</Text>
              <Text style={styles.emptyText}>Prueba otra palabra o selecciona una categoría diferente.</Text>
            </View>
          }
          ListHeaderComponent={
            <View>
              <Pressable onPress={() => setSortOption("discount")} style={styles.heroCard}>
                <View style={styles.heroTextContainer}>
                  <Text style={styles.heroKicker}>CATÁLOGO COMPLETO</Text>
                  <Text style={styles.heroTitle}>Encuentra algo para ti</Text>
                  <Text style={styles.heroDescription}>
                    Explora {products.length} productos con precios en quetzales.
                  </Text>
                  <View style={styles.heroButton}>
                    <Text style={styles.heroButtonText}>Ver mejores ofertas</Text>
                    <Ionicons name="arrow-forward" size={16} color="#1E3A8A" />
                  </View>
                </View>
                <View style={styles.heroIcon}>
                  <Ionicons name="bag-handle" size={48} color="#FFFFFF" />
                </View>
              </Pressable>

              <View style={styles.sectionHeading}>
                <Text style={styles.sectionTitle}>Categorías</Text>
                <Text style={styles.sectionMeta}>{categories.length - 1} disponibles</Text>
              </View>
              <ScrollView
                contentContainerStyle={styles.horizontalList}
                horizontal
                showsHorizontalScrollIndicator={false}
              >
                {categories.map((category) => {
                  const active = selectedCategory === category;

                  return (
                    <Pressable
                      key={category}
                      onPress={() => setSelectedCategory(category)}
                      style={[styles.categoryChip, active && styles.categoryChipActive]}
                    >
                      <Ionicons
                        name={category === "Todos" ? "grid-outline" : "pricetag-outline"}
                        size={15}
                        color={active ? "#FFFFFF" : "#334155"}
                      />
                      <Text style={[styles.categoryChipText, active && styles.categoryChipTextActive]}>
                        {category}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>

              <Text style={styles.sectionTitle}>Ordenar por</Text>
              <ScrollView
                contentContainerStyle={styles.horizontalList}
                horizontal
                showsHorizontalScrollIndicator={false}
              >
                {SORT_OPTIONS.map((option) => {
                  const active = sortOption === option.id;

                  return (
                    <Pressable
                      key={option.id}
                      onPress={() => setSortOption(option.id)}
                      style={[styles.sortChip, active && styles.sortChipActive]}
                    >
                      <Text style={[styles.sortChipText, active && styles.sortChipTextActive]}>
                        {option.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>

              <View style={styles.resultsHeading}>
                <Text style={styles.sectionTitle}>
                  {selectedCategory === "Todos" ? "Todos los productos" : selectedCategory}
                </Text>
                <Text style={styles.resultCount}>{filteredProducts.length} resultados</Text>
              </View>
            </View>
          }
          numColumns={columns}
          refreshing={loading}
          onRefresh={loadProducts}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => router.push(`/producto/${item.id}` as Href)}
              style={[styles.productCard, { maxWidth: productCardWidth }]}
            >
              <View style={styles.imageContainer}>
                <Image resizeMode="contain" source={{ uri: item.thumbnail }} style={styles.thumbnail} />
                {item.discountPercentage > 0 ? (
                  <View style={styles.discountBadge}>
                    <Text style={styles.discountText}>-{Math.round(item.discountPercentage)}%</Text>
                  </View>
                ) : null}
              </View>
              <View style={styles.productInfo}>
                <Text numberOfLines={1} style={styles.category}>{item.category}</Text>
                <Text numberOfLines={2} style={styles.productTitle}>{item.title}</Text>
                <View style={styles.ratingRow}>
                  <Ionicons name="star" size={14} color="#F59E0B" />
                  <Text style={styles.rating}>{item.rating.toFixed(1)}</Text>
                  <Text style={styles.stock}>· {item.stock} disponibles</Text>
                </View>
                <Text style={styles.price}>Q {(item.price * USD_TO_GTQ).toFixed(2)}</Text>
                <Text style={styles.originalPrice}>
                  Q {((item.price / (1 - item.discountPercentage / 100)) * USD_TO_GTQ).toFixed(2)}
                </Text>
                <View style={styles.viewProductButton}>
                  <Text style={styles.viewProductText}>Ver producto</Text>
                  <Ionicons name="chevron-forward" size={15} color="#FFFFFF" />
                </View>
              </View>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F1F5F9", paddingHorizontal: 14, paddingTop: 12 },
  loginContainer: { flex: 1, backgroundColor: "#F4F6F8", justifyContent: "center", padding: 20 },
  loginCard: { backgroundColor: "#FFFFFF", borderRadius: 16, elevation: 3, padding: 24 },
  title: { color: "#1E3A8A", fontSize: 24, fontWeight: "bold" },
  description: { color: "#475569", lineHeight: 21, marginBottom: 18, marginTop: 8 },
  input: { backgroundColor: "#F8FAFC", borderColor: "#CBD5E1", borderRadius: 10, borderWidth: 1, marginBottom: 12, padding: 14 },
  hint: { color: "#64748B", fontSize: 12, marginBottom: 16 },
  lockMessage: { color: "#B45309", fontSize: 13, marginBottom: 12, textAlign: "center" },
  primaryButton: { alignItems: "center", backgroundColor: "#2563EB", borderRadius: 10, minHeight: 50, justifyContent: "center", padding: 14 },
  primaryButtonText: { color: "#FFFFFF", fontWeight: "bold" },
  header: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", marginBottom: 12 },
  eyebrow: { color: "#2563EB", fontSize: 11, fontWeight: "800", letterSpacing: 1.3 },
  refreshButton: { backgroundColor: "#DBEAFE", borderRadius: 22, padding: 11 },
  searchContainer: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#E2E8F0",
    borderRadius: 14,
    borderWidth: 1,
    elevation: 2,
    flexDirection: "row",
    marginBottom: 12,
    paddingHorizontal: 14,
  },
  searchInput: { color: "#0F172A", flex: 1, fontSize: 15, paddingHorizontal: 10, paddingVertical: 13 },
  centered: { alignItems: "center", flex: 1, justifyContent: "center" },
  loadingText: { color: "#64748B", marginTop: 12 },
  listContent: { paddingBottom: 24 },
  heroCard: {
    backgroundColor: "#1D4ED8",
    borderRadius: 20,
    flexDirection: "row",
    marginBottom: 22,
    overflow: "hidden",
    padding: 20,
  },
  heroTextContainer: { flex: 1 },
  heroKicker: { color: "#BFDBFE", fontSize: 11, fontWeight: "800", letterSpacing: 1.2 },
  heroTitle: { color: "#FFFFFF", fontSize: 23, fontWeight: "800", marginTop: 5 },
  heroDescription: { color: "#DBEAFE", fontSize: 13, lineHeight: 19, marginTop: 7 },
  heroButton: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    flexDirection: "row",
    gap: 5,
    marginTop: 14,
    paddingHorizontal: 13,
    paddingVertical: 8,
  },
  heroButtonText: { color: "#1E3A8A", fontSize: 12, fontWeight: "800" },
  heroIcon: {
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: "rgba(255,255,255,0.16)",
    borderRadius: 42,
    height: 84,
    justifyContent: "center",
    marginLeft: 10,
    width: 84,
  },
  sectionHeading: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  sectionTitle: { color: "#0F172A", fontSize: 17, fontWeight: "800" },
  sectionMeta: { color: "#64748B", fontSize: 12 },
  horizontalList: { gap: 8, paddingBottom: 18, paddingTop: 10 },
  categoryChip: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#E2E8F0",
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 13,
    paddingVertical: 9,
  },
  categoryChipActive: { backgroundColor: "#2563EB", borderColor: "#2563EB" },
  categoryChipText: { color: "#334155", fontSize: 13, fontWeight: "600" },
  categoryChipTextActive: { color: "#FFFFFF" },
  sortChip: {
    backgroundColor: "#E2E8F0",
    borderRadius: 16,
    paddingHorizontal: 13,
    paddingVertical: 8,
  },
  sortChipActive: { backgroundColor: "#0F172A" },
  sortChipText: { color: "#475569", fontSize: 12, fontWeight: "700" },
  sortChipTextActive: { color: "#FFFFFF" },
  resultsHeading: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  resultCount: { color: "#64748B", fontSize: 12 },
  productRow: { gap: 10 },
  productCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    elevation: 2,
    flex: 1,
    marginBottom: 11,
    overflow: "hidden",
  },
  imageContainer: { backgroundColor: "#F8FAFC", height: 142, position: "relative" },
  thumbnail: { height: "100%", width: "100%" },
  discountBadge: {
    backgroundColor: "#DC2626",
    borderRadius: 12,
    left: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    position: "absolute",
    top: 8,
  },
  discountText: { color: "#FFFFFF", fontSize: 11, fontWeight: "800" },
  productInfo: { flex: 1, padding: 11 },
  productTitle: { color: "#0F172A", fontSize: 14, fontWeight: "800", lineHeight: 19, minHeight: 38 },
  category: { color: "#2563EB", fontSize: 10, fontWeight: "700", marginBottom: 5, textTransform: "uppercase" },
  ratingRow: { alignItems: "center", flexDirection: "row", marginTop: 7 },
  rating: { color: "#475569", fontSize: 11, fontWeight: "700", marginLeft: 3 },
  stock: { color: "#94A3B8", flexShrink: 1, fontSize: 10, marginLeft: 3 },
  price: { color: "#15803D", fontSize: 17, fontWeight: "900", marginTop: 8 },
  originalPrice: {
    color: "#94A3B8",
    fontSize: 11,
    marginTop: 1,
    textDecorationLine: "line-through",
  },
  viewProductButton: {
    alignItems: "center",
    backgroundColor: "#2563EB",
    borderRadius: 9,
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 10,
    paddingVertical: 8,
  },
  viewProductText: { color: "#FFFFFF", fontSize: 11, fontWeight: "800" },
  emptyState: { alignItems: "center", paddingHorizontal: 30, paddingVertical: 60 },
  emptyTitle: { color: "#334155", fontSize: 17, fontWeight: "800", marginTop: 12 },
  emptyText: { color: "#64748B", lineHeight: 20, marginTop: 5, textAlign: "center" },
});
