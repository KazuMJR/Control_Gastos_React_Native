import Ionicons from "@expo/vector-icons/Ionicons";
import { PropsWithChildren, useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import {
  COLLABORATIVE_DEMO_EMAIL,
  collaborativeApiErrorMessage,
  getCollaborativeToken,
  loginToCollaborativeApi,
} from "../services/collaborative-tasks-api";
import {
  expenseApiErrorMessage,
  getExpenseToken,
  loginToExpensesAccount,
} from "../services/expenses-api";

type GateState = "checking" | "login" | "ready";

export function SharedAccountGate({ children }: PropsWithChildren) {
  const [state, setState] = useState<GateState>("checking");
  const [email, setEmail] = useState(COLLABORATIVE_DEMO_EMAIL);
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    Promise.all([getExpenseToken(), getCollaborativeToken()])
      .then(([expenseToken, taskToken]) => {
        if (active) {
          setState(expenseToken && taskToken ? "ready" : "login");
        }
      })
      .catch(() => {
        if (active) {
          setState("login");
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const connect = async () => {
    if (!email.trim() || !password) {
      setError("Escribe el correo y la contraseña de la cuenta compartida.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await Promise.all([
        loginToExpensesAccount(email, password),
        loginToCollaborativeApi(email, password),
      ]);
      setPassword("");
      setState("ready");
    } catch (connectionError) {
      const expenseMessage = expenseApiErrorMessage(connectionError);
      const taskMessage = collaborativeApiErrorMessage(connectionError);
      setError(expenseMessage || taskMessage || "No se pudo conectar la cuenta.");
    } finally {
      setSubmitting(false);
    }
  };

  if (state === "ready") {
    return children;
  }

  if (state === "checking") {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator color="#2563EB" size="large" />
        <Text style={styles.loadingText}>Preparando tu cuenta compartida…</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Ionicons color="#FFFFFF" name="people" size={34} />
          </View>
          <Text style={styles.eyebrow}>CUENTA COMPARTIDA</Text>
          <Text style={styles.title}>Conecta tus gastos y tareas</Text>
          <Text style={styles.description}>
            Inicia sesión una sola vez. A partir de ahí, ambos aplicativos mostrarán los mismos movimientos y actividades.
          </Text>

          <View style={styles.formCard}>
            <Text style={styles.label}>Correo electrónico</Text>
            <TextInput
              autoCapitalize="none"
              autoComplete="email"
              editable={!submitting}
              keyboardType="email-address"
              onChangeText={setEmail}
              placeholder="correo@ejemplo.com"
              style={styles.input}
              value={email}
            />
            <Text style={styles.label}>Contraseña</Text>
            <TextInput
              autoCapitalize="none"
              autoComplete="password"
              editable={!submitting}
              onChangeText={setPassword}
              onSubmitEditing={() => void connect()}
              placeholder="Contraseña"
              secureTextEntry
              style={styles.input}
              value={password}
            />

            {error ? (
              <View style={styles.errorBox}>
                <Ionicons color="#B91C1C" name="alert-circle-outline" size={20} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <Pressable
              disabled={submitting}
              onPress={() => void connect()}
              style={({ pressed }) => [
                styles.button,
                pressed && styles.buttonPressed,
                submitting && styles.buttonDisabled,
              ]}
            >
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons color="#FFFFFF" name="log-in-outline" size={22} />
                  <Text style={styles.buttonText}>Conectar cuenta</Text>
                </>
              )}
            </Pressable>
          </View>

          <View style={styles.notice}>
            <Ionicons color="#475569" name="shield-checkmark-outline" size={20} />
            <Text style={styles.noticeText}>
              La contraseña no forma parte del APK ni del código público. El teléfono conserva únicamente los tokens de sesión.
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: "#EFF6FF", flex: 1 },
  keyboardView: { flex: 1 },
  content: { flex: 1, justifyContent: "center", paddingHorizontal: 24, paddingVertical: 28 },
  iconContainer: { alignItems: "center", alignSelf: "center", backgroundColor: "#2563EB", borderRadius: 26, height: 62, justifyContent: "center", marginBottom: 18, width: 62 },
  eyebrow: { color: "#1D4ED8", fontSize: 12, fontWeight: "900", letterSpacing: 1.5, textAlign: "center" },
  title: { color: "#0F172A", fontSize: 30, fontWeight: "900", lineHeight: 36, marginTop: 8, textAlign: "center" },
  description: { color: "#64748B", fontSize: 15, lineHeight: 22, marginBottom: 22, marginTop: 10, textAlign: "center" },
  formCard: { backgroundColor: "#FFFFFF", borderColor: "#DBEAFE", borderRadius: 22, borderWidth: 1, elevation: 3, padding: 20 },
  label: { color: "#334155", fontSize: 12, fontWeight: "800", marginBottom: 7, textTransform: "uppercase" },
  input: { backgroundColor: "#F8FAFC", borderColor: "#CBD5E1", borderRadius: 13, borderWidth: 1, color: "#0F172A", fontSize: 16, marginBottom: 16, minHeight: 52, paddingHorizontal: 15 },
  errorBox: { alignItems: "flex-start", backgroundColor: "#FEF2F2", borderRadius: 11, flexDirection: "row", gap: 8, marginBottom: 15, padding: 11 },
  errorText: { color: "#991B1B", flex: 1, fontSize: 13, lineHeight: 18 },
  button: { alignItems: "center", backgroundColor: "#2563EB", borderRadius: 13, flexDirection: "row", gap: 9, justifyContent: "center", minHeight: 54 },
  buttonPressed: { opacity: 0.82, transform: [{ scale: 0.99 }] },
  buttonDisabled: { opacity: 0.65 },
  buttonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "900" },
  notice: { alignItems: "flex-start", flexDirection: "row", gap: 8, marginTop: 18, paddingHorizontal: 8 },
  noticeText: { color: "#475569", flex: 1, fontSize: 12, lineHeight: 17 },
  loadingScreen: { alignItems: "center", backgroundColor: "#EFF6FF", flex: 1, justifyContent: "center" },
  loadingText: { color: "#475569", marginTop: 12 },
});
