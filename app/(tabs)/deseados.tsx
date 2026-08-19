import Ionicons from "@expo/vector-icons/Ionicons";
import { useContext } from "react";
import { Alert, FlatList, Image, Pressable, StyleSheet, Text, View } from "react-native";

import { AppContext } from "../../context/AppContext";

export default function DeseadosScreen() {
  const { deseados, eliminarDeseado, comprarDeseado, saldo, totalDeseados } = useContext(AppContext);
  const alcanzaTotal = totalDeseados <= saldo;

  const comprar = (item: any) => {
    if (comprarDeseado(item)) {
      Alert.alert("Compra registrada", `${item.titulo} fue agregado a tus gastos.`);
      return;
    }

    Alert.alert("Saldo insuficiente", "No tienes saldo disponible para esta compra.");
  };

  return (
    <View style={styles.container}>
      <View style={styles.summary}>
        <Text style={styles.summaryTitle}>Mi lista de deseos</Text>
        <Text style={styles.total}>Q {totalDeseados.toFixed(2)}</Text>
        <Text style={alcanzaTotal ? styles.statusSuccess : styles.statusError}>
          {alcanzaTotal ? `Te alcanza: saldo actual Q ${saldo.toFixed(2)}` : `Te faltan Q ${(totalDeseados - saldo).toFixed(2)}`}
        </Text>
      </View>

      <FlatList
        contentContainerStyle={styles.list}
        data={deseados}
        keyExtractor={(item) => item.id.toString()}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="heart-outline" size={44} color="#94A3B8" />
            <Text style={styles.emptyText}>Aun no agregas articulos. Visita Mercado para crear tu lista.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Image source={{ uri: item.imagen }} style={styles.image} />
            <View style={styles.info}>
              <Text numberOfLines={2} style={styles.title}>{item.titulo}</Text>
              <Text style={styles.price}>USD {item.precioUsd.toFixed(2)} · Q {item.precioQuetzales.toFixed(2)}</Text>
              <View style={styles.actions}>
                <Pressable onPress={() => comprar(item)} style={styles.buyButton}><Text style={styles.buyText}>Comprar</Text></Pressable>
                <Pressable onPress={() => eliminarDeseado(item.id)} style={styles.deleteButton}><Text style={styles.deleteText}>Quitar</Text></Pressable>
              </View>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: "#F4F6F8", flex: 1, padding: 16 },
  summary: { alignItems: "center", backgroundColor: "#FFFFFF", borderRadius: 14, elevation: 2, marginBottom: 14, padding: 18 },
  summaryTitle: { color: "#1E3A8A", fontSize: 20, fontWeight: "bold" },
  total: { color: "#0F172A", fontSize: 28, fontWeight: "bold", marginTop: 6 },
  statusSuccess: { color: "#15803D", marginTop: 5 },
  statusError: { color: "#DC2626", marginTop: 5 },
  list: { paddingBottom: 18 },
  empty: { alignItems: "center", padding: 36 },
  emptyText: { color: "#64748B", lineHeight: 21, marginTop: 10, textAlign: "center" },
  card: { backgroundColor: "#FFFFFF", borderRadius: 12, elevation: 2, flexDirection: "row", marginBottom: 10, padding: 10 },
  image: { backgroundColor: "#E2E8F0", borderRadius: 8, height: 76, width: 76 },
  info: { flex: 1, marginLeft: 12 },
  title: { color: "#0F172A", fontWeight: "bold" },
  price: { color: "#15803D", fontSize: 13, marginTop: 5 },
  actions: { flexDirection: "row", marginTop: 10 },
  buyButton: { backgroundColor: "#15803D", borderRadius: 7, marginRight: 8, paddingHorizontal: 12, paddingVertical: 8 },
  buyText: { color: "#FFFFFF", fontWeight: "bold" },
  deleteButton: { borderColor: "#DC2626", borderRadius: 7, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 8 },
  deleteText: { color: "#DC2626", fontWeight: "bold" },
});
