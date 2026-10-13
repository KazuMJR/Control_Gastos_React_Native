import Ionicons from "@expo/vector-icons/Ionicons";
import { useContext, useMemo, useState } from "react";
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

import { AppContext, currentMonthKey, todayKey } from "../context/AppContext";
import { expenseApiErrorMessage, PendingPayment } from "../services/expenses-api";

const MONTH_NAMES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

function formatQuetzales(amount: number) {
  const prefix = amount < 0 ? "- Q" : "Q";
  return `${prefix} ${Math.abs(amount).toFixed(2)}`;
}

export default function PlanMensualScreen() {
  const { planMensual } = useContext(AppContext);
  const revision = JSON.stringify([
    planMensual.budget_amount,
    planMensual.allocations,
    planMensual.pending_payments,
    planMensual.summary,
  ]);

  return <PlanMensualContent key={revision} />;
}

function PlanMensualContent() {
  const {
    categorias,
    expensesLoading,
    gastos,
    gastosApiError,
    guardarPlanMensual,
    agregarPagoPendiente,
    pagarPendiente,
    eliminarPendiente,
    planMensual,
    presupuestoMensual,
    saldo,
    saldoDespuesPendientes,
    totalGastadoMes,
    totalPendiente,
  } = useContext(AppContext);
  const [budget, setBudget] = useState(() => planMensual.budget_amount.toFixed(2));
  const [allocations, setAllocations] = useState<Record<number, string>>(() =>
    Object.fromEntries(
      planMensual.allocations.map((allocation: any) => [
        allocation.categoria_id,
        allocation.monto.toFixed(2),
      ])
    )
  );
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState(todayKey());
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [savingPlan, setSavingPlan] = useState(false);
  const [savingPayment, setSavingPayment] = useState(false);
  const [processingPaymentId, setProcessingPaymentId] = useState<number | null>(null);

  const allocatedDraft = useMemo(
    () => Object.values(allocations).reduce((sum, value) => sum + (Number(value.replace(",", ".")) || 0), 0),
    [allocations]
  );
  const spentByCategory = useMemo(
    () => gastos.reduce((totals: Record<number, number>, expense: any) => {
      if (expense.categoria_id) {
        totals[expense.categoria_id] = (totals[expense.categoria_id] ?? 0) + expense.monto;
      }
      return totals;
    }, {}),
    [gastos]
  );
  const currentDate = new Date();
  const monthTitle = `${MONTH_NAMES[currentDate.getMonth()]} ${currentDate.getFullYear()}`;

  const savePlan = async () => {
    const parsedBudget = Number(budget.replace(",", "."));
    if (!Number.isFinite(parsedBudget) || parsedBudget < 0) {
      Alert.alert("Presupuesto no válido", "Ingresa un monto igual o mayor que cero.");
      return;
    }
    if (allocatedDraft > parsedBudget) {
      Alert.alert("Distribución excedida", "La suma por categorías no puede superar el presupuesto mensual.");
      return;
    }

    setSavingPlan(true);
    try {
      await guardarPlanMensual(
        parsedBudget,
        categorias.map((category: any) => ({
          category_id: category.id,
          amount: Number((allocations[category.id] ?? "0").replace(",", ".")) || 0,
        }))
      );
      Alert.alert("Plan guardado", `El presupuesto de ${monthTitle} quedó actualizado.`);
    } catch (error) {
      Alert.alert("No se pudo guardar", expenseApiErrorMessage(error));
    } finally {
      setSavingPlan(false);
    }
  };

  const addPayment = async () => {
    const parsedAmount = Number(amount.replace(",", "."));
    if (!description.trim() || !Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      Alert.alert("Datos incompletos", "Ingresa una descripción y un monto mayor que cero.");
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) {
      Alert.alert("Fecha no válida", "Usa el formato AAAA-MM-DD.");
      return;
    }
    if (!dueDate.startsWith(`${currentMonthKey()}-`)) {
      Alert.alert("Fecha fuera del mes", "El pago debe tener una fecha límite dentro del mes actual.");
      return;
    }

    setSavingPayment(true);
    try {
      await agregarPagoPendiente({
        descripcion: description.trim(),
        monto: parsedAmount,
        fecha_vencimiento: dueDate,
        categoria_id: categoryId,
      });
      setDescription("");
      setAmount("");
      setCategoryId(null);
      Alert.alert("Pago agregado", "Ya se incluyó en el saldo proyectado del mes.");
    } catch (error) {
      Alert.alert("No se pudo agregar", expenseApiErrorMessage(error));
    } finally {
      setSavingPayment(false);
    }
  };

  const pay = async (payment: PendingPayment) => {
    Alert.alert(
      "Registrar pago",
      `Se registrará ${payment.descripcion} por Q ${payment.monto.toFixed(2)} como gasto real.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Marcar como pagado",
          onPress: async () => {
            setProcessingPaymentId(payment.id);
            try {
              await pagarPendiente(payment.id);
              Alert.alert("Pago realizado", "El pendiente pasó a tu historial de gastos.");
            } catch (error) {
              Alert.alert("No se pudo pagar", expenseApiErrorMessage(error));
            } finally {
              setProcessingPaymentId(null);
            }
          },
        },
      ]
    );
  };

  const remove = (payment: PendingPayment) => {
    Alert.alert("Eliminar pendiente", `¿Quieres quitar ${payment.descripcion} de tu planificación?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: async () => {
          setProcessingPaymentId(payment.id);
          try {
            await eliminarPendiente(payment.id);
          } catch (error) {
            Alert.alert("No se pudo eliminar", expenseApiErrorMessage(error));
          } finally {
            setProcessingPaymentId(null);
          }
        },
      },
    ]);
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.heading}>
          <View>
            <Text style={styles.eyebrow}>PLANIFICACIÓN</Text>
            <Text style={styles.title}>Plan de {monthTitle}</Text>
            <Text style={styles.subtitle}>Organiza lo que puedes gastar y lo que todavía debes pagar.</Text>
          </View>
          <View style={styles.headingIcon}>
            <Ionicons name="calendar" size={27} color="#15803D" />
          </View>
        </View>

        {gastosApiError ? <Text style={styles.errorCard}>{gastosApiError}</Text> : null}

        <View style={styles.summaryCard}>
          <View style={styles.summaryMain}>
            <Text style={styles.summaryLabel}>Después de pagar pendientes</Text>
            <Text style={[styles.summaryAmount, saldoDespuesPendientes < 0 && styles.negativeAmount]}>
              {formatQuetzales(saldoDespuesPendientes)}
            </Text>
          </View>
          <View style={styles.metricsRow}>
            <Metric label="Presupuesto" value={presupuestoMensual} />
            <Metric label="Gastado" value={totalGastadoMes} />
            <Metric label="Pendiente" value={totalPendiente} />
          </View>
        </View>

        <Text style={styles.sectionTitle}>Presupuesto y distribución</Text>
        <View style={styles.card}>
          <Text style={styles.label}>Cantidad que puedes gastar este mes</Text>
          <View style={styles.amountInputRow}>
            <Text style={styles.currency}>Q</Text>
            <TextInput keyboardType="decimal-pad" onChangeText={setBudget} style={styles.amountInput} value={budget} />
          </View>

          <View style={styles.distributionHeading}>
            <Text style={styles.label}>Dividir por categorías</Text>
            <Text style={[styles.allocatedText, allocatedDraft > Number(budget || 0) && styles.allocatedError]}>
              Q {allocatedDraft.toFixed(2)} asignados
            </Text>
          </View>
          {categorias.map((category: any) => (
            <View key={category.id} style={styles.allocationRow}>
              <View style={[styles.categoryDot, { backgroundColor: category.color }]} />
              <View style={styles.categoryInfo}>
                <Text style={styles.categoryName}>{category.nombre}</Text>
                <Text style={styles.categorySpent}>Gastado: Q {(spentByCategory[category.id] ?? 0).toFixed(2)}</Text>
              </View>
              <View style={styles.compactAmount}>
                <Text style={styles.compactCurrency}>Q</Text>
                <TextInput
                  keyboardType="decimal-pad"
                  onChangeText={(value) => setAllocations((current) => ({ ...current, [category.id]: value }))}
                  placeholder="0.00"
                  style={styles.compactInput}
                  value={allocations[category.id] ?? ""}
                />
              </View>
            </View>
          ))}
          <Text style={styles.unallocatedText}>
            Sin asignar: {formatQuetzales((Number(budget.replace(",", ".")) || 0) - allocatedDraft)}
          </Text>
          <Pressable disabled={savingPlan || expensesLoading} onPress={savePlan} style={styles.primaryButton}>
            {savingPlan ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryButtonText}>Guardar plan mensual</Text>}
          </Pressable>
        </View>

        <Text style={styles.sectionTitle}>Nuevo pago pendiente</Text>
        <View style={styles.card}>
          <Text style={styles.label}>Qué tienes que pagar</Text>
          <TextInput onChangeText={setDescription} placeholder="Ejemplo: Servicio de agua" style={styles.input} value={description} />
          <View style={styles.twoColumns}>
            <View style={styles.column}>
              <Text style={styles.label}>Monto</Text>
              <View style={styles.smallAmountRow}>
                <Text style={styles.compactCurrency}>Q</Text>
                <TextInput keyboardType="decimal-pad" onChangeText={setAmount} placeholder="0.00" style={styles.smallAmountInput} value={amount} />
              </View>
            </View>
            <View style={styles.column}>
              <Text style={styles.label}>Fecha límite</Text>
              <TextInput onChangeText={setDueDate} placeholder="AAAA-MM-DD" style={styles.input} value={dueDate} />
            </View>
          </View>
          <Text style={styles.label}>Categoría</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.categoryChips}>
              <Pressable onPress={() => setCategoryId(null)} style={[styles.chip, categoryId === null && styles.chipSelected]}>
                <Text style={[styles.chipText, categoryId === null && styles.chipTextSelected]}>Sin categoría</Text>
              </Pressable>
              {categorias.map((category: any) => (
                <Pressable
                  key={category.id}
                  onPress={() => setCategoryId(category.id)}
                  style={[styles.chip, categoryId === category.id && { backgroundColor: category.color, borderColor: category.color }]}
                >
                  <Text style={[styles.chipText, categoryId === category.id && styles.chipTextSelected]}>{category.nombre}</Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
          <Pressable disabled={savingPayment || expensesLoading} onPress={addPayment} style={[styles.primaryButton, styles.addPaymentButton]}>
            {savingPayment ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryButtonText}>Agregar pendiente</Text>}
          </Pressable>
        </View>

        <View style={styles.pendingHeading}>
          <Text style={styles.sectionTitle}>Pendientes por pagar</Text>
          <Text style={styles.pendingTotal}>Q {totalPendiente.toFixed(2)}</Text>
        </View>
        {planMensual.pending_payments.length ? (
          planMensual.pending_payments.map((payment: PendingPayment) => (
            <View key={payment.id} style={styles.paymentCard}>
              <View style={styles.paymentTop}>
                <View style={[styles.paymentIcon, { backgroundColor: `${payment.categoria?.color ?? "#64748B"}18` }]}>
                  <Ionicons name="receipt-outline" size={21} color={payment.categoria?.color ?? "#64748B"} />
                </View>
                <View style={styles.paymentInfo}>
                  <Text style={styles.paymentTitle}>{payment.descripcion}</Text>
                  <Text style={styles.paymentMeta}>{payment.categoria?.nombre ?? "Sin categoría"} · vence {payment.fecha_vencimiento}</Text>
                </View>
                <Text style={styles.paymentAmount}>Q {payment.monto.toFixed(2)}</Text>
              </View>
              <View style={styles.impactBox}>
                <Ionicons name="arrow-down-circle-outline" size={18} color="#B45309" />
                <Text style={styles.impactText}>
                  Al pagarlo restará Q {payment.monto.toFixed(2)} y tu saldo quedaría en {formatQuetzales(saldo - payment.monto)}.
                </Text>
              </View>
              <View style={styles.paymentActions}>
                <Pressable disabled={processingPaymentId !== null} onPress={() => remove(payment)} style={styles.deleteButton}>
                  <Text style={styles.deleteButtonText}>Eliminar</Text>
                </Pressable>
                <Pressable disabled={processingPaymentId !== null} onPress={() => pay(payment)} style={styles.payButton}>
                  {processingPaymentId === payment.id ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.payButtonText}>Marcar pagado</Text>}
                </Pressable>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyCard}>
            <Ionicons name="checkmark-circle-outline" size={38} color="#16A34A" />
            <Text style={styles.emptyTitle}>No tienes pagos pendientes</Text>
            <Text style={styles.emptyText}>Cuando agregues uno, aquí verás cómo afectará tu saldo.</Text>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{formatQuetzales(value)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: "#F1F5F9", flex: 1 },
  content: { padding: 17, paddingBottom: 42 },
  heading: { alignItems: "flex-start", flexDirection: "row", justifyContent: "space-between", marginBottom: 18 },
  eyebrow: { color: "#15803D", fontSize: 11, fontWeight: "900", letterSpacing: 1.1 },
  title: { color: "#0F172A", fontSize: 27, fontWeight: "900", marginTop: 3, textTransform: "capitalize" },
  subtitle: { color: "#64748B", lineHeight: 19, marginTop: 5, maxWidth: 280 },
  headingIcon: { alignItems: "center", backgroundColor: "#DCFCE7", borderRadius: 16, height: 52, justifyContent: "center", width: 52 },
  errorCard: { backgroundColor: "#FFFBEB", borderColor: "#FDE68A", borderRadius: 12, borderWidth: 1, color: "#92400E", marginBottom: 13, padding: 12 },
  summaryCard: { backgroundColor: "#172554", borderRadius: 20, marginBottom: 22, padding: 18 },
  summaryMain: { borderBottomColor: "rgba(255,255,255,0.14)", borderBottomWidth: 1, paddingBottom: 14 },
  summaryLabel: { color: "#BFDBFE", fontSize: 12, fontWeight: "700" },
  summaryAmount: { color: "#86EFAC", fontSize: 31, fontWeight: "900", marginTop: 3 },
  negativeAmount: { color: "#FCA5A5" },
  metricsRow: { flexDirection: "row", gap: 7, paddingTop: 14 },
  metric: { flex: 1 },
  metricLabel: { color: "#93C5FD", fontSize: 9, fontWeight: "800", textTransform: "uppercase" },
  metricValue: { color: "#FFFFFF", fontSize: 11, fontWeight: "900", marginTop: 4 },
  sectionTitle: { color: "#334155", fontSize: 16, fontWeight: "900", marginBottom: 9 },
  card: { backgroundColor: "#FFFFFF", borderColor: "#E2E8F0", borderRadius: 18, borderWidth: 1, marginBottom: 22, padding: 16 },
  label: { color: "#475569", fontSize: 10, fontWeight: "900", marginBottom: 6, textTransform: "uppercase" },
  amountInputRow: { alignItems: "center", backgroundColor: "#F8FAFC", borderColor: "#CBD5E1", borderRadius: 11, borderWidth: 1, flexDirection: "row", marginBottom: 18, paddingHorizontal: 13 },
  currency: { color: "#15803D", fontSize: 21, fontWeight: "900" },
  amountInput: { color: "#0F172A", flex: 1, fontSize: 22, fontWeight: "900", paddingHorizontal: 9, paddingVertical: 11 },
  distributionHeading: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  allocatedText: { color: "#15803D", fontSize: 10, fontWeight: "800" },
  allocatedError: { color: "#DC2626" },
  allocationRow: { alignItems: "center", borderTopColor: "#F1F5F9", borderTopWidth: 1, flexDirection: "row", minHeight: 49 },
  categoryDot: { borderRadius: 5, height: 10, width: 10 },
  categoryInfo: { flex: 1, marginHorizontal: 9 },
  categoryName: { color: "#334155", fontSize: 12, fontWeight: "700" },
  categorySpent: { color: "#94A3B8", fontSize: 9, marginTop: 2 },
  compactAmount: { alignItems: "center", backgroundColor: "#F8FAFC", borderColor: "#CBD5E1", borderRadius: 8, borderWidth: 1, flexDirection: "row", paddingHorizontal: 8, width: 105 },
  compactCurrency: { color: "#64748B", fontSize: 12, fontWeight: "900" },
  compactInput: { color: "#0F172A", flex: 1, fontSize: 12, paddingHorizontal: 5, paddingVertical: 8, textAlign: "right" },
  unallocatedText: { color: "#64748B", fontSize: 11, fontWeight: "700", marginBottom: 14, marginTop: 8, textAlign: "right" },
  primaryButton: { alignItems: "center", backgroundColor: "#15803D", borderRadius: 11, justifyContent: "center", minHeight: 49 },
  primaryButtonText: { color: "#FFFFFF", fontSize: 13, fontWeight: "900" },
  input: { backgroundColor: "#F8FAFC", borderColor: "#CBD5E1", borderRadius: 10, borderWidth: 1, color: "#0F172A", marginBottom: 14, paddingHorizontal: 12, paddingVertical: 11 },
  twoColumns: { flexDirection: "row", gap: 10 },
  column: { flex: 1 },
  smallAmountRow: { alignItems: "center", backgroundColor: "#F8FAFC", borderColor: "#CBD5E1", borderRadius: 10, borderWidth: 1, flexDirection: "row", marginBottom: 14, paddingHorizontal: 10 },
  smallAmountInput: { color: "#0F172A", flex: 1, paddingHorizontal: 6, paddingVertical: 11 },
  categoryChips: { flexDirection: "row", gap: 7, paddingBottom: 13 },
  chip: { borderColor: "#CBD5E1", borderRadius: 16, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 7 },
  chipSelected: { backgroundColor: "#334155", borderColor: "#334155" },
  chipText: { color: "#475569", fontSize: 10, fontWeight: "700" },
  chipTextSelected: { color: "#FFFFFF" },
  addPaymentButton: { backgroundColor: "#2563EB", marginTop: 2 },
  pendingHeading: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  pendingTotal: { color: "#B45309", fontSize: 14, fontWeight: "900", marginBottom: 9 },
  paymentCard: { backgroundColor: "#FFFFFF", borderColor: "#E2E8F0", borderRadius: 16, borderWidth: 1, marginBottom: 11, padding: 14 },
  paymentTop: { alignItems: "center", flexDirection: "row" },
  paymentIcon: { alignItems: "center", borderRadius: 11, height: 40, justifyContent: "center", width: 40 },
  paymentInfo: { flex: 1, marginHorizontal: 10 },
  paymentTitle: { color: "#1E293B", fontSize: 13, fontWeight: "900" },
  paymentMeta: { color: "#64748B", fontSize: 9, marginTop: 3 },
  paymentAmount: { color: "#B45309", fontSize: 13, fontWeight: "900" },
  impactBox: { alignItems: "flex-start", backgroundColor: "#FFFBEB", borderRadius: 10, flexDirection: "row", gap: 7, marginTop: 12, padding: 10 },
  impactText: { color: "#92400E", flex: 1, fontSize: 10, lineHeight: 15 },
  paymentActions: { flexDirection: "row", gap: 8, justifyContent: "flex-end", marginTop: 11 },
  deleteButton: { borderColor: "#FCA5A5", borderRadius: 9, borderWidth: 1, paddingHorizontal: 13, paddingVertical: 9 },
  deleteButtonText: { color: "#DC2626", fontSize: 11, fontWeight: "800" },
  payButton: { alignItems: "center", backgroundColor: "#16A34A", borderRadius: 9, minWidth: 125, paddingHorizontal: 13, paddingVertical: 9 },
  payButtonText: { color: "#FFFFFF", fontSize: 11, fontWeight: "900" },
  emptyCard: { alignItems: "center", backgroundColor: "#FFFFFF", borderColor: "#E2E8F0", borderRadius: 16, borderWidth: 1, padding: 25 },
  emptyTitle: { color: "#334155", fontWeight: "900", marginTop: 7 },
  emptyText: { color: "#64748B", fontSize: 11, lineHeight: 17, marginTop: 3, textAlign: "center" },
});
