import Ionicons from "@expo/vector-icons/Ionicons";
import { Href, router } from "expo-router";
import { useContext } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { AppContext } from "../../context/AppContext";

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

const SECONDARY_ACTIONS: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: Href;
  color: string;
  background: string;
}[] = [
  { label: "Tareas", icon: "checkbox-outline", route: "/(tabs)/tareas", color: "#7C3AED", background: "#F3E8FF" },
  { label: "Mercado", icon: "storefront-outline", route: "/(tabs)/mercado", color: "#2563EB", background: "#DBEAFE" },
  { label: "Deseados", icon: "heart-outline", route: "/(tabs)/deseados", color: "#DB2777", background: "#FCE7F3" },
  { label: "Perfil", icon: "person-outline", route: "/(tabs)/perfil", color: "#0891B2", background: "#CFFAFE" },
];

export default function HomeScreen() {
  const {
    saldo,
    presupuestoMensual,
    totalGastadoMes,
    nombre,
    gastos,
    expensesLoading,
    gastosApiError,
    refreshExpenses,
  } = useContext(AppContext);
  const percentage = presupuestoMensual > 0
    ? Math.min(100, (totalGastadoMes / presupuestoMensual) * 100)
    : 0;
  const monthName = MONTH_NAMES[new Date().getMonth()];

  return (
    <ScrollView contentContainerStyle={styles.content} style={styles.container}>
      <View style={styles.topBar}>
        <View>
          <Text style={styles.greeting}>Hola, {nombre}</Text>
          <Text style={styles.dateLabel}>Resumen de {monthName}</Text>
        </View>
        <Pressable onPress={() => router.push("/(tabs)/perfil")} style={styles.avatarButton}>
          <Ionicons name="person" size={23} color="#1D4ED8" />
        </Pressable>
      </View>

      <View style={styles.heroCard}>
        <View style={styles.heroHeader}>
          <View>
            <Text style={styles.heroLabel}>Saldo disponible</Text>
            <Text style={styles.heroAmount}>Q {saldo.toFixed(2)}</Text>
          </View>
          <View style={styles.apiBadge}>
            <View style={[styles.apiDot, gastosApiError && styles.apiDotError]} />
            <Text style={styles.apiText}>{gastosApiError ? "API sin conexión" : "Sincronizado"}</Text>
          </View>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${percentage}%` }]} />
        </View>
        <View style={styles.budgetRow}>
          <Text style={styles.budgetText}>Gastado: Q {totalGastadoMes.toFixed(2)}</Text>
          <Text style={styles.budgetText}>Presupuesto: Q {presupuestoMensual.toFixed(2)}</Text>
        </View>
      </View>

      {gastosApiError ? (
        <Pressable onPress={refreshExpenses} style={styles.errorCard}>
          <Ionicons name="cloud-offline-outline" size={22} color="#B45309" />
          <View style={styles.errorContent}>
            <Text style={styles.errorTitle}>No se pudieron actualizar tus gastos</Text>
            <Text numberOfLines={2} style={styles.errorText}>{gastosApiError}</Text>
          </View>
          <Ionicons name="refresh" size={20} color="#B45309" />
        </Pressable>
      ) : null}

      <View style={styles.primaryActions}>
        <Pressable onPress={() => router.push("/(tabs)/nuevo-gasto")} style={[styles.primaryAction, styles.addAction]}>
          <View style={styles.primaryIcon}>
            <Ionicons name="add" size={24} color="#FFFFFF" />
          </View>
          <View>
            <Text style={styles.primaryActionTitle}>Nuevo gasto</Text>
            <Text style={styles.primaryActionSubtitle}>Guardar en la API</Text>
          </View>
        </Pressable>
        <Pressable onPress={() => router.push("/(tabs)/estadisticas")} style={[styles.primaryAction, styles.historyAction]}>
          <View style={[styles.primaryIcon, styles.historyIcon]}>
            <Ionicons name="time-outline" size={23} color="#1D4ED8" />
          </View>
          <View>
            <Text style={[styles.primaryActionTitle, styles.historyActionTitle]}>Historial</Text>
            <Text style={[styles.primaryActionSubtitle, styles.historyActionSubtitle]}>Filtrar por mes</Text>
          </View>
        </Pressable>
      </View>

      <Text style={styles.sectionTitle}>Accesos rápidos</Text>
      <View style={styles.secondaryGrid}>
        {SECONDARY_ACTIONS.map((action) => (
          <Pressable key={action.label} onPress={() => router.push(action.route)} style={styles.secondaryAction}>
            <View style={[styles.secondaryIcon, { backgroundColor: action.background }]}>
              <Ionicons name={action.icon} size={22} color={action.color} />
            </View>
            <Text style={styles.secondaryLabel}>{action.label}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.sectionHeading}>
        <Text style={styles.sectionTitle}>Últimos movimientos</Text>
        <Pressable onPress={() => router.push("/(tabs)/estadisticas")}>
          <Text style={styles.seeAll}>Ver todos</Text>
        </Pressable>
      </View>

      {expensesLoading ? (
        <View style={styles.loadingCard}>
          <ActivityIndicator color="#2563EB" />
          <Text style={styles.loadingText}>Sincronizando con Laravel…</Text>
        </View>
      ) : gastos.length ? (
        <View style={styles.movementsCard}>
          {gastos.slice(0, 3).map((gasto: any, index: number) => (
            <View key={gasto.id} style={[styles.movementRow, index > 0 && styles.movementBorder]}>
              <View style={[styles.movementIcon, { backgroundColor: `${gasto.categoria?.color ?? "#64748B"}18` }]}>
                <Ionicons name="receipt-outline" size={20} color={gasto.categoria?.color ?? "#64748B"} />
              </View>
              <View style={styles.movementInfo}>
                <Text numberOfLines={1} style={styles.movementTitle}>{gasto.descripcion}</Text>
                <Text style={styles.movementCategory}>{gasto.categoria?.nombre ?? "Sin categoría"}</Text>
              </View>
              <Text style={styles.movementAmount}>- Q {gasto.monto.toFixed(2)}</Text>
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.emptyCard}>
          <Ionicons name="wallet-outline" size={35} color="#94A3B8" />
          <Text style={styles.emptyTitle}>Aún no hay gastos este mes</Text>
          <Text style={styles.emptyText}>Registra el primero para comenzar tu historial.</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: "#F1F5F9", flex: 1 },
  content: { padding: 17, paddingBottom: 38 },
  topBar: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", marginBottom: 18 },
  greeting: { color: "#0F172A", fontSize: 26, fontWeight: "900" },
  dateLabel: { color: "#64748B", marginTop: 3, textTransform: "capitalize" },
  avatarButton: { alignItems: "center", backgroundColor: "#DBEAFE", borderRadius: 22, height: 44, justifyContent: "center", width: 44 },
  heroCard: { backgroundColor: "#1D4ED8", borderRadius: 21, elevation: 3, marginBottom: 14, padding: 21 },
  heroHeader: { alignItems: "flex-start", flexDirection: "row", justifyContent: "space-between" },
  heroLabel: { color: "#BFDBFE", fontSize: 13, fontWeight: "700" },
  heroAmount: { color: "#FFFFFF", fontSize: 35, fontWeight: "900", marginTop: 3 },
  apiBadge: { alignItems: "center", backgroundColor: "rgba(255,255,255,0.13)", borderRadius: 15, flexDirection: "row", gap: 5, paddingHorizontal: 9, paddingVertical: 7 },
  apiDot: { backgroundColor: "#4ADE80", borderRadius: 4, height: 8, width: 8 },
  apiDotError: { backgroundColor: "#FBBF24" },
  apiText: { color: "#DBEAFE", fontSize: 10, fontWeight: "800" },
  progressTrack: { backgroundColor: "rgba(255,255,255,0.18)", borderRadius: 5, height: 9, marginTop: 20, overflow: "hidden" },
  progressFill: { backgroundColor: "#93C5FD", borderRadius: 5, height: "100%" },
  budgetRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 9 },
  budgetText: { color: "#DBEAFE", fontSize: 10, fontWeight: "600" },
  errorCard: { alignItems: "center", backgroundColor: "#FFFBEB", borderColor: "#FDE68A", borderRadius: 13, borderWidth: 1, flexDirection: "row", gap: 9, marginBottom: 14, padding: 12 },
  errorContent: { flex: 1 },
  errorTitle: { color: "#92400E", fontSize: 12, fontWeight: "900" },
  errorText: { color: "#B45309", fontSize: 10, lineHeight: 14, marginTop: 2 },
  primaryActions: { flexDirection: "row", gap: 10, marginBottom: 22 },
  primaryAction: { alignItems: "center", borderRadius: 16, flex: 1, flexDirection: "row", gap: 9, minHeight: 75, padding: 12 },
  addAction: { backgroundColor: "#16A34A" },
  historyAction: { backgroundColor: "#FFFFFF", borderColor: "#BFDBFE", borderWidth: 1 },
  primaryIcon: { alignItems: "center", backgroundColor: "rgba(255,255,255,0.18)", borderRadius: 13, height: 39, justifyContent: "center", width: 39 },
  historyIcon: { backgroundColor: "#DBEAFE" },
  primaryActionTitle: { color: "#FFFFFF", fontSize: 13, fontWeight: "900" },
  primaryActionSubtitle: { color: "#DCFCE7", fontSize: 9, marginTop: 2 },
  historyActionTitle: { color: "#1E3A8A" },
  historyActionSubtitle: { color: "#64748B" },
  sectionTitle: { color: "#0F172A", fontSize: 17, fontWeight: "900" },
  secondaryGrid: { flexDirection: "row", gap: 8, marginBottom: 24, marginTop: 10 },
  secondaryAction: { alignItems: "center", backgroundColor: "#FFFFFF", borderColor: "#E2E8F0", borderRadius: 14, borderWidth: 1, flex: 1, paddingHorizontal: 5, paddingVertical: 12 },
  secondaryIcon: { alignItems: "center", borderRadius: 13, height: 38, justifyContent: "center", width: 38 },
  secondaryLabel: { color: "#475569", fontSize: 10, fontWeight: "800", marginTop: 7 },
  sectionHeading: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", marginBottom: 10 },
  seeAll: { color: "#2563EB", fontSize: 12, fontWeight: "800" },
  loadingCard: { alignItems: "center", backgroundColor: "#FFFFFF", borderRadius: 14, flexDirection: "row", gap: 10, justifyContent: "center", padding: 22 },
  loadingText: { color: "#64748B", fontSize: 12 },
  movementsCard: { backgroundColor: "#FFFFFF", borderColor: "#E2E8F0", borderRadius: 16, borderWidth: 1, paddingHorizontal: 13 },
  movementRow: { alignItems: "center", flexDirection: "row", paddingVertical: 13 },
  movementBorder: { borderTopColor: "#E2E8F0", borderTopWidth: 1 },
  movementIcon: { alignItems: "center", borderRadius: 12, height: 39, justifyContent: "center", width: 39 },
  movementInfo: { flex: 1, marginHorizontal: 10 },
  movementTitle: { color: "#1E293B", fontSize: 13, fontWeight: "800" },
  movementCategory: { color: "#64748B", fontSize: 10, marginTop: 3 },
  movementAmount: { color: "#DC2626", fontSize: 12, fontWeight: "900" },
  emptyCard: { alignItems: "center", backgroundColor: "#FFFFFF", borderColor: "#E2E8F0", borderRadius: 15, borderWidth: 1, padding: 27 },
  emptyTitle: { color: "#334155", fontWeight: "900", marginTop: 8 },
  emptyText: { color: "#64748B", fontSize: 12, marginTop: 4, textAlign: "center" },
});
