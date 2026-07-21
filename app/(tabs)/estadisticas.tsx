import React, { useContext } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
} from "react-native";

import { AppContext } from "../../context/AppContext";

export default function EstadisticasScreen() {
  const { gastos } = useContext(AppContext);

  const totalGastado = gastos.reduce(
    (total: number, gasto: any) => total + gasto.monto,
    0
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Estadísticas</Text>

      <Text style={styles.subtitle}>
        Historial de Gastos
      </Text>

      {gastos.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            Aún no has registrado gastos.
          </Text>
        </View>
      ) : (
        <FlatList
          data={gastos}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View>
                <Text style={styles.category}>
                  {item.descripcion}
                </Text>

                <Text style={styles.date}>
                  Gasto registrado
                </Text>
              </View>

              <Text style={styles.amount}>
                - Q {item.monto.toFixed(2)}
              </Text>
            </View>
          )}
        />
      )}

      <View style={styles.totalCard}>
        <Text style={styles.totalTitle}>
          Total Gastado
        </Text>

        <Text style={styles.totalText}>
          Q {totalGastado.toFixed(2)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: "#F4F6F8",
    padding: 20,
  },

  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1E3A8A",
    textAlign: "center",
    marginBottom: 10,
  },

  subtitle: {
    fontSize: 18,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
  },

  emptyContainer: {
    backgroundColor: "#FFFFFF",
    padding: 25,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 20,
  },

  emptyText: {
    color: "#666",
    fontSize: 16,
  },

  card: {
    backgroundColor: "#FFFFFF",
    padding: 15,
    borderRadius: 10,
    marginBottom: 12,
    elevation: 3,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  category: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#222",
  },

  date: {
    color: "#888",
    marginTop: 5,
  },

  amount: {
    fontSize: 18,
    color: "#DC2626",
    fontWeight: "bold",
  },

  totalCard: {
    marginTop: 20,
    backgroundColor: "#2563EB",
    padding: 20,
    borderRadius: 12,
    alignItems: "center",
  },

  totalTitle: {
    color: "#FFFFFF",
    fontSize: 18,
  },

  totalText: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "bold",
    marginTop: 5,
  },

});