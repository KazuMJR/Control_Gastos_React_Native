import Ionicons from "@expo/vector-icons/Ionicons";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  Expense,
  expenseApiErrorMessage,
  getExpense,
} from "../../services/expenses-api";

function longDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Intl.DateTimeFormat("es-GT", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(year, month - 1, day));
}

export default function ExpenseDetailScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const expenseId = Number(id);
  const [expense, setExpense] = useState<Expense | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadExpense = useCallback(async () => {
    if (!Number.isInteger(expenseId) || expenseId <= 0) {
      setError("No se encontró el gasto solicitado.");
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      setExpense(await getExpense(expenseId));
      setError(null);
    } catch (requestError) {
      setError(expenseApiErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, [expenseId]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      void loadExpense();
    }, 0);

    return () => clearTimeout(timeout);
  }, [loadExpense]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Cargando detalle…</Text>
      </View>
    );
  }

  if (error || !expense) {
    return (
      <View style={styles.centered}>
        <View style={styles.errorIcon}>
          <Ionicons name="alert-circle-outline" size={34} color="#B45309" />
        </View>
        <Text style={styles.errorTitle}>No se pudo mostrar el gasto</Text>
        <Text style={styles.errorText}>{error}</Text>
        <Pressable onPress={loadExpense} style={styles.retryButton}>
          <Text style={styles.retryText}>Intentar de nuevo</Text>
        </Pressable>
      </View>
    );
  }

  const categoryColor = expense.categoria?.color ?? "#64748B";

  return (
    <ScrollView contentContainerStyle={styles.content} style={styles.container}>
      <View style={styles.heroCard}>
        <View style={styles.receiptIcon}>
          <Ionicons name="receipt-outline" size={31} color="#FFFFFF" />
        </View>
        <Text style={styles.heroLabel}>Monto del gasto</Text>
        <Text style={styles.amount}>Q {expense.monto.toFixed(2)}</Text>
        <View style={styles.categoryBadge}>
          <View style={[styles.categoryDot, { backgroundColor: categoryColor }]} />
          <Text style={styles.categoryText}>{expense.categoria?.nombre ?? "Sin categoría"}</Text>
        </View>
      </View>

      <View style={styles.detailCard}>
        <Text style={styles.sectionTitle}>Información</Text>
        <View style={styles.detailRow}>
          <View style={styles.detailIcon}>
            <Ionicons name="text-outline" size={20} color="#2563EB" />
          </View>
          <View style={styles.detailContent}>
            <Text style={styles.detailLabel}>Descripción</Text>
            <Text style={styles.detailValue}>{expense.descripcion}</Text>
          </View>
        </View>
        <View style={styles.divider} />
        <View style={styles.detailRow}>
          <View style={styles.detailIcon}>
            <Ionicons name="calendar-outline" size={20} color="#2563EB" />
          </View>
          <View style={styles.detailContent}>
            <Text style={styles.detailLabel}>Fecha</Text>
            <Text style={styles.detailValue}>{longDate(expense.fecha_gasto)}</Text>
          </View>
        </View>
        <View style={styles.divider} />
        <View style={styles.detailRow}>
          <View style={styles.detailIcon}>
            <Ionicons name="pricetag-outline" size={20} color="#2563EB" />
          </View>
          <View style={styles.detailContent}>
            <Text style={styles.detailLabel}>Categoría</Text>
            <Text style={styles.detailValue}>{expense.categoria?.nombre ?? "Sin categoría"}</Text>
          </View>
        </View>
      </View>

      <View style={styles.notesCard}>
        <View style={styles.notesHeader}>
          <Ionicons name="document-text-outline" size={21} color="#475569" />
          <Text style={styles.sectionTitle}>Notas</Text>
        </View>
        <Text style={expense.notas ? styles.notesText : styles.emptyNotes}>
          {expense.notas || "Este gasto no tiene notas adicionales."}
        </Text>
      </View>

      <Pressable onPress={() => router.back()} style={styles.backButton}>
        <Ionicons name="arrow-back" size={19} color="#1D4ED8" />
        <Text style={styles.backText}>Volver al historial</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: "#F1F5F9", flex: 1 },
  content: { padding: 18, paddingBottom: 40 },
  centered: { alignItems: "center", backgroundColor: "#F1F5F9", flex: 1, justifyContent: "center", padding: 28 },
  loadingText: { color: "#64748B", marginTop: 12 },
  errorIcon: { alignItems: "center", backgroundColor: "#FEF3C7", borderRadius: 22, height: 64, justifyContent: "center", width: 64 },
  errorTitle: { color: "#0F172A", fontSize: 20, fontWeight: "900", marginTop: 15 },
  errorText: { color: "#64748B", lineHeight: 20, marginTop: 7, textAlign: "center" },
  retryButton: { backgroundColor: "#2563EB", borderRadius: 11, marginTop: 20, paddingHorizontal: 20, paddingVertical: 12 },
  retryText: { color: "#FFFFFF", fontWeight: "900" },
  heroCard: { alignItems: "center", backgroundColor: "#1D4ED8", borderRadius: 22, padding: 24 },
  receiptIcon: { alignItems: "center", backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 20, height: 58, justifyContent: "center", marginBottom: 13, width: 58 },
  heroLabel: { color: "#BFDBFE", fontSize: 12, fontWeight: "700" },
  amount: { color: "#FFFFFF", fontSize: 38, fontWeight: "900", marginTop: 3 },
  categoryBadge: { alignItems: "center", backgroundColor: "rgba(255,255,255,0.13)", borderRadius: 17, flexDirection: "row", gap: 7, marginTop: 14, paddingHorizontal: 12, paddingVertical: 8 },
  categoryDot: { borderRadius: 5, height: 10, width: 10 },
  categoryText: { color: "#FFFFFF", fontSize: 12, fontWeight: "800" },
  detailCard: { backgroundColor: "#FFFFFF", borderColor: "#E2E8F0", borderRadius: 18, borderWidth: 1, marginTop: 15, padding: 17 },
  sectionTitle: { color: "#0F172A", fontSize: 16, fontWeight: "900" },
  detailRow: { alignItems: "center", flexDirection: "row", paddingVertical: 14 },
  detailIcon: { alignItems: "center", backgroundColor: "#EFF6FF", borderRadius: 12, height: 40, justifyContent: "center", width: 40 },
  detailContent: { flex: 1, marginLeft: 12 },
  detailLabel: { color: "#94A3B8", fontSize: 10, fontWeight: "800", textTransform: "uppercase" },
  detailValue: { color: "#334155", fontSize: 14, fontWeight: "800", marginTop: 3, textTransform: "capitalize" },
  divider: { backgroundColor: "#E2E8F0", height: 1 },
  notesCard: { backgroundColor: "#FFFFFF", borderColor: "#E2E8F0", borderRadius: 18, borderWidth: 1, marginTop: 15, padding: 17 },
  notesHeader: { alignItems: "center", flexDirection: "row", gap: 8 },
  notesText: { color: "#475569", lineHeight: 21, marginTop: 11 },
  emptyNotes: { color: "#94A3B8", fontStyle: "italic", marginTop: 11 },
  backButton: { alignItems: "center", alignSelf: "center", flexDirection: "row", gap: 7, marginTop: 22, padding: 10 },
  backText: { color: "#1D4ED8", fontWeight: "800" },
});
