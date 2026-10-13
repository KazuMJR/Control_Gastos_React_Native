import Ionicons from "@expo/vector-icons/Ionicons";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  ExpenseHistory,
  expenseApiErrorMessage,
  getExpenseHistory,
} from "../../services/expenses-api";

const MONTH_NAMES = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

function currentMonthKey() {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
}

function shiftMonth(month: string, offset: number) {
  const [year, monthNumber] = month.split("-").map(Number);
  const shifted = new Date(year, monthNumber - 1 + offset, 1);
  return `${shifted.getFullYear()}-${String(shifted.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(month: string) {
  const [year, monthNumber] = month.split("-").map(Number);
  return `${MONTH_NAMES[monthNumber - 1]} ${year}`;
}

function shortDate(date: string) {
  const [, month, day] = date.split("-");
  return `${day}/${month}`;
}

export default function HistorialScreen() {
  const currentMonth = currentMonthKey();
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [history, setHistory] = useState<ExpenseHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadHistory = useCallback(async (month: string, pullToRefresh = false) => {
    if (pullToRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    try {
      setHistory(await getExpenseHistory(month));
      setError(null);
    } catch (requestError) {
      setError(expenseApiErrorMessage(requestError));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      void loadHistory(selectedMonth);
    }, 0);

    return () => clearTimeout(timeout);
  }, [loadHistory, selectedMonth]);

  const summary = history?.summary;
  const goToNextMonth = () => {
    const next = shiftMonth(selectedMonth, 1);
    if (next <= currentMonth) {
      setSelectedMonth(next);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          onRefresh={() => loadHistory(selectedMonth, true)}
          refreshing={refreshing}
          tintColor="#2563EB"
        />
      }
      style={styles.container}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>MOVIMIENTOS DE LA API</Text>
          <Text style={styles.title}>Historial</Text>
          <Text style={styles.subtitle}>Consulta cuánto gastaste en cada mes.</Text>
        </View>
        <View style={styles.headerIcon}>
          <Ionicons name="calendar-outline" size={27} color="#2563EB" />
        </View>
      </View>

      <View style={styles.monthSelector}>
        <Pressable accessibilityLabel="Mes anterior" onPress={() => setSelectedMonth(shiftMonth(selectedMonth, -1))} style={styles.monthArrow}>
          <Ionicons name="chevron-back" size={22} color="#334155" />
        </Pressable>
        <View style={styles.monthCenter}>
          <Text style={styles.monthLabel}>{monthLabel(selectedMonth)}</Text>
          {selectedMonth !== currentMonth ? (
            <Pressable onPress={() => setSelectedMonth(currentMonth)}>
              <Text style={styles.currentMonthLink}>Volver al mes actual</Text>
            </Pressable>
          ) : (
            <Text style={styles.currentMonthText}>Mes actual</Text>
          )}
        </View>
        <Pressable
          accessibilityLabel="Mes siguiente"
          disabled={selectedMonth >= currentMonth}
          onPress={goToNextMonth}
          style={[styles.monthArrow, selectedMonth >= currentMonth && styles.monthArrowDisabled]}
        >
          <Ionicons name="chevron-forward" size={22} color={selectedMonth >= currentMonth ? "#CBD5E1" : "#334155"} />
        </Pressable>
      </View>

      {error ? (
        <View style={styles.errorCard}>
          <Ionicons name="cloud-offline-outline" size={24} color="#B45309" />
          <View style={styles.errorContent}>
            <Text style={styles.errorTitle}>No se pudo consultar la API</Text>
            <Text style={styles.errorText}>{error}</Text>
            <Pressable onPress={() => loadHistory(selectedMonth)} style={styles.retryButton}>
              <Text style={styles.retryText}>Reintentar</Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Gastado en {monthLabel(selectedMonth)}</Text>
        <Text style={styles.summaryAmount}>Q {(summary?.total_amount ?? 0).toFixed(2)}</Text>
        <View style={styles.summaryMetrics}>
          <View style={styles.metric}>
            <Text style={styles.metricValue}>{summary?.expense_count ?? 0}</Text>
            <Text style={styles.metricLabel}>movimientos</Text>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metric}>
            <Text style={styles.metricValue}>Q {(summary?.average_amount ?? 0).toFixed(2)}</Text>
            <Text style={styles.metricLabel}>promedio</Text>
          </View>
        </View>
      </View>

      {summary?.by_category.length ? (
        <>
          <Text style={styles.sectionTitle}>Distribución por categoría</Text>
          <ScrollView contentContainerStyle={styles.categorySummaryList} horizontal showsHorizontalScrollIndicator={false}>
            {summary.by_category.map((category) => (
              <View key={category.category_id ?? "none"} style={styles.categorySummaryCard}>
                <View style={[styles.categoryIcon, { backgroundColor: `${category.category_color}20` }]}>
                  <View style={[styles.categoryDot, { backgroundColor: category.category_color }]} />
                </View>
                <Text numberOfLines={1} style={styles.categorySummaryName}>{category.category_name}</Text>
                <Text style={styles.categorySummaryAmount}>Q {category.total_amount.toFixed(2)}</Text>
                <Text style={styles.categorySummaryCount}>{category.expense_count} gastos</Text>
              </View>
            ))}
          </ScrollView>
        </>
      ) : null}

      <View style={styles.listHeader}>
        <Text style={styles.sectionTitle}>Movimientos</Text>
        <Text style={styles.apiStatus}>Guardados en API</Text>
      </View>

      {loading ? (
        <View style={styles.loadingCard}>
          <ActivityIndicator color="#2563EB" />
          <Text style={styles.loadingText}>Consultando gastos…</Text>
        </View>
      ) : history?.data.length ? (
        <View style={styles.expenseList}>
          {history.data.map((expense) => (
            <View key={expense.id} style={styles.expenseCard}>
              <View style={[styles.expenseIcon, { backgroundColor: `${expense.categoria?.color ?? "#64748B"}18` }]}>
                <Ionicons name="receipt-outline" size={21} color={expense.categoria?.color ?? "#64748B"} />
              </View>
              <View style={styles.expenseInfo}>
                <Text numberOfLines={1} style={styles.expenseDescription}>{expense.descripcion}</Text>
                <Text style={styles.expenseMeta}>
                  {expense.categoria?.nombre ?? "Sin categoría"} · {shortDate(expense.fecha_gasto)}
                </Text>
                {expense.notas ? <Text numberOfLines={1} style={styles.expenseNote}>{expense.notas}</Text> : null}
              </View>
              <Text style={styles.expenseAmount}>- Q {expense.monto.toFixed(2)}</Text>
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.emptyCard}>
          <Ionicons name="receipt-outline" size={43} color="#94A3B8" />
          <Text style={styles.emptyTitle}>Sin gastos en este mes</Text>
          <Text style={styles.emptyText}>Selecciona otro mes o registra un gasto nuevo.</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: "#F1F5F9", flex: 1 },
  content: { padding: 17, paddingBottom: 38 },
  header: { alignItems: "flex-start", flexDirection: "row", justifyContent: "space-between", marginBottom: 18 },
  eyebrow: { color: "#2563EB", fontSize: 11, fontWeight: "900", letterSpacing: 1.15 },
  title: { color: "#0F172A", fontSize: 30, fontWeight: "900", marginTop: 3 },
  subtitle: { color: "#64748B", marginTop: 5 },
  headerIcon: { alignItems: "center", backgroundColor: "#DBEAFE", borderRadius: 16, height: 54, justifyContent: "center", width: 54 },
  monthSelector: { alignItems: "center", backgroundColor: "#FFFFFF", borderColor: "#E2E8F0", borderRadius: 15, borderWidth: 1, flexDirection: "row", justifyContent: "space-between", marginBottom: 14, padding: 9 },
  monthArrow: { alignItems: "center", backgroundColor: "#F1F5F9", borderRadius: 11, height: 42, justifyContent: "center", width: 42 },
  monthArrowDisabled: { backgroundColor: "#F8FAFC" },
  monthCenter: { alignItems: "center", flex: 1 },
  monthLabel: { color: "#0F172A", fontSize: 16, fontWeight: "900", textTransform: "capitalize" },
  currentMonthLink: { color: "#2563EB", fontSize: 11, fontWeight: "700", marginTop: 3 },
  currentMonthText: { color: "#94A3B8", fontSize: 11, marginTop: 3 },
  errorCard: { alignItems: "flex-start", backgroundColor: "#FFFBEB", borderColor: "#FDE68A", borderRadius: 13, borderWidth: 1, flexDirection: "row", gap: 10, marginBottom: 14, padding: 14 },
  errorContent: { flex: 1 },
  errorTitle: { color: "#92400E", fontWeight: "900" },
  errorText: { color: "#92400E", fontSize: 12, lineHeight: 18, marginTop: 4 },
  retryButton: { alignSelf: "flex-start", marginTop: 8 },
  retryText: { color: "#B45309", fontSize: 12, fontWeight: "900" },
  summaryCard: { backgroundColor: "#172554", borderRadius: 20, marginBottom: 20, padding: 21 },
  summaryLabel: { color: "#BFDBFE", fontSize: 13, fontWeight: "700", textTransform: "capitalize" },
  summaryAmount: { color: "#FFFFFF", fontSize: 36, fontWeight: "900", marginTop: 5 },
  summaryMetrics: { alignItems: "center", backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 13, flexDirection: "row", marginTop: 17, paddingVertical: 11 },
  metric: { alignItems: "center", flex: 1 },
  metricValue: { color: "#FFFFFF", fontSize: 15, fontWeight: "900" },
  metricLabel: { color: "#BFDBFE", fontSize: 10, marginTop: 2 },
  metricDivider: { backgroundColor: "rgba(255,255,255,0.2)", height: 28, width: 1 },
  sectionTitle: { color: "#0F172A", fontSize: 17, fontWeight: "900" },
  categorySummaryList: { gap: 9, paddingBottom: 20, paddingTop: 10 },
  categorySummaryCard: { backgroundColor: "#FFFFFF", borderColor: "#E2E8F0", borderRadius: 14, borderWidth: 1, padding: 13, width: 142 },
  categoryIcon: { alignItems: "center", borderRadius: 15, height: 30, justifyContent: "center", width: 30 },
  categoryDot: { borderRadius: 5, height: 10, width: 10 },
  categorySummaryName: { color: "#475569", fontSize: 11, fontWeight: "700", marginTop: 9 },
  categorySummaryAmount: { color: "#0F172A", fontSize: 16, fontWeight: "900", marginTop: 3 },
  categorySummaryCount: { color: "#94A3B8", fontSize: 10, marginTop: 2 },
  listHeader: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", marginBottom: 10 },
  apiStatus: { color: "#15803D", fontSize: 11, fontWeight: "800" },
  loadingCard: { alignItems: "center", backgroundColor: "#FFFFFF", borderRadius: 14, flexDirection: "row", gap: 10, justifyContent: "center", padding: 24 },
  loadingText: { color: "#64748B" },
  expenseList: { gap: 9 },
  expenseCard: { alignItems: "center", backgroundColor: "#FFFFFF", borderColor: "#E2E8F0", borderRadius: 14, borderWidth: 1, flexDirection: "row", padding: 12 },
  expenseIcon: { alignItems: "center", borderRadius: 13, height: 42, justifyContent: "center", width: 42 },
  expenseInfo: { flex: 1, marginHorizontal: 10 },
  expenseDescription: { color: "#1E293B", fontSize: 14, fontWeight: "800" },
  expenseMeta: { color: "#64748B", fontSize: 11, marginTop: 3 },
  expenseNote: { color: "#94A3B8", fontSize: 10, marginTop: 3 },
  expenseAmount: { color: "#DC2626", fontSize: 13, fontWeight: "900" },
  emptyCard: { alignItems: "center", backgroundColor: "#FFFFFF", borderColor: "#E2E8F0", borderRadius: 15, borderWidth: 1, padding: 34 },
  emptyTitle: { color: "#334155", fontSize: 16, fontWeight: "900", marginTop: 10 },
  emptyText: { color: "#64748B", marginTop: 5, textAlign: "center" },
});
