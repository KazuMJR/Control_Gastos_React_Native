import { isAxiosError } from "axios";
import { Href, router } from "expo-router";
import { useContext, useState } from "react";
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { AppContext } from "../../context/AppContext";

function errorMessage(error: unknown) {
  if (isAxiosError(error)) {
    return error.response?.data?.message ?? "No fue posible iniciar sesion.";
  }

  return "Revisa que la API Laravel este encendida e intenta de nuevo.";
}

export default function LoginScreen() {
  const { iniciarSesion } = useContext(AppContext);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!email.trim() || !password) {
      Alert.alert("Campos requeridos", "Ingresa tu correo y contrasena.");
      return;
    }

    setLoading(true);
    try {
      await iniciarSesion(email.trim(), password);
      router.replace("/(tabs)" as Href);
    } catch (error) {
      Alert.alert("Acceso denegado", errorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Control de Gastos</Text>
        <Text style={styles.subtitle}>Inicia sesion para proteger tus compras y gastos.</Text>
        <TextInput autoCapitalize="none" keyboardType="email-address" onChangeText={setEmail} placeholder="Correo" style={styles.input} value={email} />
        <TextInput onChangeText={setPassword} placeholder="Contrasena" secureTextEntry style={styles.input} value={password} />
        <Pressable disabled={loading} onPress={submit} style={styles.primaryButton}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Iniciar sesion</Text>}
        </Pressable>
        <Pressable onPress={() => router.push("/auth/register" as Href)} style={styles.linkButton}>
          <Text style={styles.linkText}>Crear una cuenta nueva</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: "center", backgroundColor: "#EFF6FF", flex: 1, justifyContent: "center", padding: 20 },
  card: { backgroundColor: "#FFFFFF", borderRadius: 18, elevation: 4, maxWidth: 430, padding: 24, width: "100%" },
  title: { color: "#1E3A8A", fontSize: 28, fontWeight: "bold" },
  subtitle: { color: "#475569", lineHeight: 21, marginBottom: 22, marginTop: 8 },
  input: { backgroundColor: "#F8FAFC", borderColor: "#CBD5E1", borderRadius: 10, borderWidth: 1, marginBottom: 12, padding: 14 },
  primaryButton: { alignItems: "center", backgroundColor: "#2563EB", borderRadius: 10, minHeight: 50, justifyContent: "center", padding: 14 },
  buttonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "bold" },
  linkButton: { alignItems: "center", marginTop: 17, padding: 8 },
  linkText: { color: "#2563EB", fontWeight: "bold" },
});
