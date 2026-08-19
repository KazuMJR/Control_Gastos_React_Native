import Ionicons from "@expo/vector-icons/Ionicons";
import { router, useLocalSearchParams } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

export default function ResultadoScreen() {
  // La pantalla recibe el resultado por parametros para reutilizarse en cada guardado.
  const { title, message, returnTo = "/(tabs)" } = useLocalSearchParams<{
    title?: string;
    message?: string;
    returnTo?: string;
  }>();

  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <Ionicons name="checkmark" size={42} color="#FFFFFF" />
      </View>
      <Text style={styles.title}>{title ?? "Cambios guardados"}</Text>
      <Text style={styles.message}>{message ?? "La operación se realizó correctamente."}</Text>
      <Pressable onPress={() => router.replace(returnTo as never)} style={styles.button}>
        <Text style={styles.buttonText}>Continuar</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: "center", backgroundColor: "#F4F6F8", flex: 1, justifyContent: "center", padding: 24 },
  iconCircle: { alignItems: "center", backgroundColor: "#16A34A", borderRadius: 40, height: 80, justifyContent: "center", marginBottom: 22, width: 80 },
  title: { color: "#1E3A8A", fontSize: 26, fontWeight: "bold", textAlign: "center" },
  message: { color: "#475569", fontSize: 16, lineHeight: 24, marginTop: 12, maxWidth: 340, textAlign: "center" },
  button: { backgroundColor: "#2563EB", borderRadius: 10, marginTop: 28, minWidth: 180, padding: 15 },
  buttonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "bold", textAlign: "center" },
});
