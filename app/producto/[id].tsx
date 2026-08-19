import Ionicons from "@expo/vector-icons/Ionicons";
import { isAxiosError } from "axios";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useContext, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { AppContext, USD_TO_GTQ } from "../../context/AppContext";
import { getExternalProduct, Product } from "../../services/external-api";

export default function ProductoDetalleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { agregarDeseado, comprarDeseado, saldo } = useContext(AppContext);

  const loadProduct = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      setProduct(await getExternalProduct(id));
    } catch (requestError) {
      setError(
        isAxiosError(requestError)
          ? requestError.response?.data?.message ?? "No fue posible consultar este producto."
          : "No fue posible consultar este producto."
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadProduct();
  }, [loadProduct]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.muted}>Cargando detalle…</Text>
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.centered}>
        <Ionicons name="alert-circle-outline" size={42} color="#DC2626" />
        <Text style={styles.error}>{error}</Text>
        <Pressable onPress={loadProduct} style={styles.retryButton}>
          <Text style={styles.retryText}>Reintentar</Text>
        </Pressable>
      </View>
    );
  }

  const compra = {
    id: product.id,
    titulo: product.title,
    imagen: product.thumbnail,
    precioUsd: product.price,
    precioQuetzales: product.price * USD_TO_GTQ,
  };

  const guardarDeseado = () => {
    const added = agregarDeseado(compra);
    if (!added) {
      Alert.alert("Ya existe", "Este articulo ya esta en tu lista.");
      return;
    }

    // Confirma que el producto quedo guardado en la lista de deseados.
    router.push({
      pathname: "/resultado",
      params: {
        title: "Producto guardado",
        message: `${compra.titulo} se agregó a tus compras deseadas.`,
        returnTo: `/producto/${compra.id}`,
      },
    });
  };

  const registrarCompra = () => {
    const purchased = comprarDeseado(compra);
    if (!purchased) {
      Alert.alert("Saldo insuficiente", `Necesitas Q ${compra.precioQuetzales.toFixed(2)} y tienes Q ${saldo.toFixed(2)}.`);
      return;
    }

    // Confirma la compra y el descuento aplicado al saldo.
    router.push({
      pathname: "/resultado",
      params: {
        title: "Compra registrada",
        message: `Se registraron Q ${compra.precioQuetzales.toFixed(2)} como gasto y se actualizó tu saldo.`,
        returnTo: "/(tabs)",
      },
    });
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Pressable onPress={() => router.back()} style={styles.backButton}>
        <Ionicons name="arrow-back" size={20} color="#2563EB" />
        <Text style={styles.backText}>Volver al catalogo</Text>
      </Pressable>
      <Image source={{ uri: product.images[0] ?? product.thumbnail }} style={styles.heroImage} />
      <View style={styles.card}>
        <Text style={styles.category}>{product.category}</Text>
        <Text style={styles.title}>{product.title}</Text>
        {product.brand ? <Text style={styles.brand}>{product.brand}</Text> : null}
        <Text style={styles.price}>USD {product.price.toFixed(2)}</Text>
        <Text style={styles.quetzales}>Equivale a Q {compra.precioQuetzales.toFixed(2)}</Text>
        <Text style={styles.description}>{product.description}</Text>

        <View style={styles.metrics}>
          <Metric icon="star" label="Calificación" value={`${product.rating} / 5`} />
          <Metric icon="cube-outline" label="Disponibles" value={`${product.stock}`} />
          <Metric icon="pricetag-outline" label="Descuento" value={`${product.discountPercentage}%`} />
        </View>

        <Pressable onPress={guardarDeseado} style={styles.desiredButton}>
          <Text style={styles.desiredButtonText}>Agregar a compras deseadas</Text>
        </Pressable>
        <Pressable onPress={registrarCompra} style={styles.buyButton}>
          <Text style={styles.buyButtonText}>Registrar compra como gasto</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

function Metric({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) {
  return (
    <View style={styles.metric}>
      <Ionicons name={icon} size={21} color="#2563EB" />
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: "#F4F6F8", flexGrow: 1, padding: 16 },
  centered: { alignItems: "center", backgroundColor: "#F4F6F8", flex: 1, justifyContent: "center", padding: 30 },
  muted: { color: "#64748B", marginTop: 12 },
  error: { color: "#991B1B", fontSize: 16, marginTop: 12, textAlign: "center" },
  retryButton: { backgroundColor: "#2563EB", borderRadius: 8, marginTop: 18, paddingHorizontal: 18, paddingVertical: 11 },
  retryText: { color: "#FFFFFF", fontWeight: "bold" },
  backButton: { alignItems: "center", alignSelf: "flex-start", flexDirection: "row", marginBottom: 12, paddingVertical: 5 },
  backText: { color: "#2563EB", fontWeight: "bold", marginLeft: 6 },
  heroImage: { backgroundColor: "#FFFFFF", borderRadius: 14, height: 260, resizeMode: "cover", width: "100%" },
  card: { backgroundColor: "#FFFFFF", borderRadius: 14, elevation: 2, marginTop: 14, padding: 20 },
  category: { color: "#2563EB", fontSize: 14, fontWeight: "bold", textTransform: "capitalize" },
  title: { color: "#0F172A", fontSize: 26, fontWeight: "bold", marginTop: 5 },
  brand: { color: "#64748B", fontSize: 15, marginTop: 5 },
  price: { color: "#15803D", fontSize: 25, fontWeight: "bold", marginTop: 16 },
  quetzales: { color: "#475569", fontSize: 15, fontWeight: "bold", marginTop: 4 },
  description: { color: "#334155", fontSize: 16, lineHeight: 24, marginTop: 18 },
  metrics: { borderTopColor: "#E2E8F0", borderTopWidth: 1, flexDirection: "row", justifyContent: "space-between", marginTop: 22, paddingTop: 18 },
  metric: { alignItems: "center", flex: 1 },
  metricLabel: { color: "#64748B", fontSize: 12, marginTop: 5, textAlign: "center" },
  metricValue: { color: "#0F172A", fontSize: 13, fontWeight: "bold", marginTop: 2, textAlign: "center" },
  desiredButton: { alignItems: "center", borderColor: "#2563EB", borderRadius: 10, borderWidth: 1, marginTop: 22, padding: 14 },
  desiredButtonText: { color: "#2563EB", fontWeight: "bold" },
  buyButton: { alignItems: "center", backgroundColor: "#15803D", borderRadius: 10, marginTop: 10, padding: 14 },
  buyButtonText: { color: "#FFFFFF", fontWeight: "bold" },
});
