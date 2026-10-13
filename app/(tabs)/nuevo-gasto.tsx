import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import { useContext, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { AppContext } from "../../context/AppContext";
import { expenseApiErrorMessage } from "../../services/expenses-api";

export default function NuevoGastoScreen() {
  const [descripcion, setDescripcion] = useState("");
  const [monto, setMonto] = useState("");
  const [notas, setNotas] = useState("");
  const [categoriaId, setCategoriaId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const { agregarGasto, saldo, categorias, gastosApiError, expensesLoading } = useContext(AppContext);

  const guardarGasto = async () => {
    if (!descripcion.trim() || !monto.trim()) {
      Alert.alert("Campos incompletos", "Ingresa una descripción y un monto.");
      return;
    }

    const montoNumero = Number(monto.replace(",", "."));
    if (!Number.isFinite(montoNumero) || montoNumero <= 0) {
      Alert.alert("Monto inválido", "Ingresa un monto mayor que cero.");
      return;
    }

    setSaving(true);
    try {
      await agregarGasto(descripcion, montoNumero, categoriaId, notas);

      setDescripcion("");
      setMonto("");
      setNotas("");
      setCategoriaId(null);
      router.push({
        pathname: "/resultado",
        params: {
          title: "Gasto registrado",
          message: `Se registró ${descripcion} por Q ${montoNumero.toFixed(2)}. ${montoNumero > saldo ? "El monto supera tu disponible y aparecerá como excedente." : "Ya aparece en tu historial mensual."}`,
          returnTo: "/(tabs)/estadisticas",
        },
      });
    } catch (error) {
      Alert.alert("No se pudo guardar", expenseApiErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.headingRow}>
          <View>
            <Text style={styles.eyebrow}>NUEVO MOVIMIENTO</Text>
            <Text style={styles.title}>Nuevo gasto</Text>
            <Text style={styles.subtitle}>Completa los datos para añadirlo a tu historial.</Text>
          </View>
          <View style={styles.headingIcon}>
            <Ionicons name="receipt-outline" size={28} color="#2563EB" />
          </View>
        </View>

        <View style={styles.balanceCard}>
          <View>
            <Text style={styles.balanceLabel}>Disponible este mes</Text>
            <Text style={styles.balance}>Q {saldo.toFixed(2)}</Text>
          </View>
          <View style={styles.apiBadge}>
            <View style={[styles.statusDot, gastosApiError && styles.statusDotError]} />
            <Text style={styles.apiBadgeText}>{gastosApiError ? "Sin conexión" : "Listo"}</Text>
          </View>
        </View>

        {gastosApiError ? (
          <View style={styles.errorCard}>
            <Ionicons name="cloud-offline-outline" size={21} color="#B45309" />
            <Text style={styles.errorText}>{gastosApiError}</Text>
          </View>
        ) : null}

        <View style={styles.formCard}>
          <Text style={styles.label}>Descripción</Text>
          <TextInput
            onChangeText={setDescripcion}
            placeholder="Ejemplo: Almuerzo"
            placeholderTextColor="#94A3B8"
            style={styles.input}
            value={descripcion}
          />

          <Text style={styles.label}>Monto en quetzales</Text>
          <View style={styles.amountInputRow}>
            <Text style={styles.currency}>Q</Text>
            <TextInput
              keyboardType="decimal-pad"
              onChangeText={setMonto}
              placeholder="0.00"
              placeholderTextColor="#94A3B8"
              style={styles.amountInput}
              value={monto}
            />
          </View>
          {Boolean(monto.trim()) && Number(monto.replace(",", ".")) > saldo ? (
            <Text style={styles.budgetWarning}>Este gasto supera tu disponible, pero puedes registrarlo para conservar el historial real.</Text>
          ) : null}

          <Text style={styles.label}>Categoría</Text>
          <ScrollView
            contentContainerStyle={styles.categoryList}
            horizontal
            showsHorizontalScrollIndicator={false}
          >
            <Pressable
              onPress={() => setCategoriaId(null)}
              style={[styles.categoryChip, categoriaId === null && styles.categoryChipSelected]}
            >
              <Text style={[styles.categoryText, categoriaId === null && styles.categoryTextSelected]}>
                Sin categoría
              </Text>
            </Pressable>
            {categorias.map((categoria: any) => {
              const selected = categoriaId === categoria.id;
              return (
                <Pressable
                  key={categoria.id}
                  onPress={() => setCategoriaId(categoria.id)}
                  style={[
                    styles.categoryChip,
                    selected && { backgroundColor: categoria.color, borderColor: categoria.color },
                  ]}
                >
                  <Text style={[styles.categoryText, selected && styles.categoryTextSelected]}>
                    {categoria.nombre}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <Text style={styles.label}>Nota opcional</Text>
          <TextInput
            multiline
            onChangeText={setNotas}
            placeholder="Agrega algún detalle útil"
            placeholderTextColor="#94A3B8"
            style={[styles.input, styles.notesInput]}
            textAlignVertical="top"
            value={notas}
          />

          <Pressable
            disabled={saving || expensesLoading || Boolean(gastosApiError)}
            onPress={guardarGasto}
            style={({ pressed }) => [
              styles.saveButton,
              (saving || expensesLoading || Boolean(gastosApiError)) && styles.saveButtonDisabled,
              pressed && styles.saveButtonPressed,
            ]}
          >
            {saving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="cloud-upload-outline" size={21} color="#FFFFFF" />
                <Text style={styles.saveButtonText}>Guardar gasto</Text>
              </>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: "#F1F5F9", flex: 1 },
  content: { padding: 18, paddingBottom: 40 },
  headingRow: { alignItems: "flex-start", flexDirection: "row", justifyContent: "space-between", marginBottom: 20 },
  eyebrow: { color: "#2563EB", fontSize: 11, fontWeight: "900", letterSpacing: 1.2 },
  title: { color: "#0F172A", fontSize: 30, fontWeight: "900", marginTop: 3 },
  subtitle: { color: "#64748B", lineHeight: 20, marginTop: 6, maxWidth: 280 },
  headingIcon: { alignItems: "center", backgroundColor: "#DBEAFE", borderRadius: 16, height: 54, justifyContent: "center", width: 54 },
  balanceCard: { alignItems: "center", backgroundColor: "#172554", borderRadius: 18, flexDirection: "row", justifyContent: "space-between", marginBottom: 14, padding: 20 },
  balanceLabel: { color: "#BFDBFE", fontSize: 13, fontWeight: "700" },
  balance: { color: "#FFFFFF", fontSize: 30, fontWeight: "900", marginTop: 3 },
  apiBadge: { alignItems: "center", backgroundColor: "rgba(255,255,255,0.12)", borderRadius: 16, flexDirection: "row", gap: 6, paddingHorizontal: 10, paddingVertical: 7 },
  apiBadgeText: { color: "#E0F2FE", fontSize: 11, fontWeight: "800" },
  statusDot: { backgroundColor: "#4ADE80", borderRadius: 4, height: 8, width: 8 },
  statusDotError: { backgroundColor: "#FBBF24" },
  errorCard: { alignItems: "flex-start", backgroundColor: "#FFFBEB", borderColor: "#FDE68A", borderRadius: 12, borderWidth: 1, flexDirection: "row", gap: 9, marginBottom: 14, padding: 13 },
  errorText: { color: "#92400E", flex: 1, fontSize: 12, lineHeight: 18 },
  formCard: { backgroundColor: "#FFFFFF", borderRadius: 18, elevation: 2, padding: 18 },
  label: { color: "#334155", fontSize: 12, fontWeight: "900", marginBottom: 7, textTransform: "uppercase" },
  input: { backgroundColor: "#F8FAFC", borderColor: "#CBD5E1", borderRadius: 11, borderWidth: 1, color: "#0F172A", fontSize: 15, marginBottom: 17, paddingHorizontal: 14, paddingVertical: 13 },
  amountInputRow: { alignItems: "center", backgroundColor: "#F8FAFC", borderColor: "#CBD5E1", borderRadius: 11, borderWidth: 1, flexDirection: "row", marginBottom: 17, paddingHorizontal: 14 },
  currency: { color: "#15803D", fontSize: 20, fontWeight: "900" },
  amountInput: { color: "#0F172A", flex: 1, fontSize: 20, fontWeight: "800", paddingHorizontal: 10, paddingVertical: 12 },
  budgetWarning: { color: "#B45309", fontSize: 11, lineHeight: 17, marginBottom: 16, marginTop: -9 },
  categoryList: { gap: 8, paddingBottom: 18 },
  categoryChip: { borderColor: "#CBD5E1", borderRadius: 18, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 8 },
  categoryChipSelected: { backgroundColor: "#334155", borderColor: "#334155" },
  categoryText: { color: "#475569", fontSize: 12, fontWeight: "700" },
  categoryTextSelected: { color: "#FFFFFF" },
  notesInput: { minHeight: 78 },
  saveButton: { alignItems: "center", backgroundColor: "#2563EB", borderRadius: 12, flexDirection: "row", gap: 8, justifyContent: "center", minHeight: 52 },
  saveButtonDisabled: { backgroundColor: "#94A3B8" },
  saveButtonPressed: { opacity: 0.82 },
  saveButtonText: { color: "#FFFFFF", fontSize: 15, fontWeight: "900" },
});
