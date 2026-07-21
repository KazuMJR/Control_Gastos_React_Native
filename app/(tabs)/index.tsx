import { View, Text, StyleSheet, Image, Pressable } from "react-native";
import { router } from "expo-router";
import { useContext } from "react";
import { AppContext } from "../../context/AppContext";

export default function HomeScreen() {
  const { saldo, nombre } = useContext(AppContext);

  return (
    <View style={styles.container}>
      <Image
        source={{
          uri: "https://cdn-icons-png.flaticon.com/512/3062/3062634.png",
        }}
        style={styles.logo}
      />

      <Text style={styles.title}>Control de Gastos</Text>

      <Text style={styles.subtitle}>
        Bienvenido, {nombre}
      </Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Saldo Disponible</Text>

        <Text style={styles.balance}>
          Q {saldo.toFixed(2)}
        </Text>
      </View>

      <Pressable
        style={styles.button}
        onPress={() => router.push("/(tabs)/nuevo-gasto")}
      >
        <Text style={styles.buttonText}>Agregar Gasto</Text>
      </Pressable>

      <Pressable
        style={styles.button}
        onPress={() => router.push("/(tabs)/estadisticas")}
      >
        <Text style={styles.buttonText}>Ver Estadísticas</Text>
      </Pressable>

      <Pressable
        style={styles.button}
        onPress={() => router.push("/(tabs)/perfil")}
      >
        <Text style={styles.buttonText}>Mi Perfil</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F4F6F8",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },

  logo: {
    width: 120,
    height: 120,
    marginBottom: 20,
  },

  title: {
    fontSize: 30,
    fontWeight: "bold",
    color: "#1E3A8A",
    marginBottom: 10,
  },

  subtitle: {
    fontSize: 18,
    color: "#555",
    marginBottom: 25,
  },

  card: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderRadius: 12,
    elevation: 4,
    marginBottom: 25,
    alignItems: "center",
  },

  cardTitle: {
    fontSize: 18,
    color: "#666",
  },

  balance: {
    fontSize: 34,
    fontWeight: "bold",
    color: "#16A34A",
    marginTop: 10,
  },

  button: {
    width: "100%",
    backgroundColor: "#2563EB",
    padding: 15,
    borderRadius: 10,
    marginTop: 15,
    alignItems: "center",
  },

  buttonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 16,
  },
});