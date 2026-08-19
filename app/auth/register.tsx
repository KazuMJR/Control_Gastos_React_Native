import { isAxiosError } from "axios";
import { router } from "expo-router";
import { useContext, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { AppContext } from "../../context/AppContext";

export default function RegisterScreen() {
  const { crearCuenta } = useContext(AppContext);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!name.trim() || !email.trim() || password.length < 8) {
      Alert.alert("Datos incompletos", "Ingresa nombre, correo y una contrasena de 8 caracteres.");
      return;
    }

    setLoading(true);
    try {
      await crearCuenta(name.trim(), email.trim(), password);
      router.replace("/(tabs)");
    } catch (error) {
      const message = isAxiosError(error)
        ? error.response?.data?.message ?? "No fue posible crear la cuenta."
        : "Revisa que la API Laravel este encendida.";
      Alert.alert("Registro no completado", message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Crea tu cuenta</Text>
        <Text style={styles.subtitle}>Tu cuenta genera un token seguro para acceder a la aplicacion.</Text>
        <TextInput onChangeText={setName} placeholder="Nombre" style={styles.input} value={name} />
        <TextInput autoCapitalize="none" keyboardType="email-address" onChangeText={setEmail} placeholder="Correo" style={styles.input} value={email} />
        <TextInput onChangeText={setPassword} placeholder="Contrasena (minimo 8 caracteres)" secureTextEntry style={styles.input} value={password} />
        <Pressable disabled={loading} onPress={submit} style={styles.primaryButton}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Crear cuenta</Text>}
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: "center", backgroundColor: "#EFF6FF", flexGrow: 1, justifyContent: "center", padding: 20 },
  card: { backgroundColor: "#FFFFFF", borderRadius: 18, elevation: 4, maxWidth: 430, padding: 24, width: "100%" },
  title: { color: "#1E3A8A", fontSize: 28, fontWeight: "bold" },
  subtitle: { color: "#475569", lineHeight: 21, marginBottom: 22, marginTop: 8 },
  input: { backgroundColor: "#F8FAFC", borderColor: "#CBD5E1", borderRadius: 10, borderWidth: 1, marginBottom: 12, padding: 14 },
  primaryButton: { alignItems: "center", backgroundColor: "#2563EB", borderRadius: 10, minHeight: 50, justifyContent: "center", padding: 14 },
  buttonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "bold" },
});
