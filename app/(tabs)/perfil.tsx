import Ionicons from "@expo/vector-icons/Ionicons";
import { Href, router } from "expo-router";
import { useContext, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";

import { AppContext } from "../../context/AppContext";

export default function PerfilScreen() {
  const {
    nombre,
    correo,
    setNombre,
    setCorreo,
    restablecerAplicacion,
    presupuestoMensual,
    saldoDespuesPendientes,
  } = useContext(AppContext);

  const [notificaciones, setNotificaciones] = useState(true);
  const [showAbout, setShowAbout] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState(nombre);
  const [nuevoCorreo, setNuevoCorreo] = useState(correo);

  const guardarPerfil = () => {
    if (!nuevoNombre.trim() || !nuevoCorreo.trim()) {
      Alert.alert("Datos incompletos", "Completa el nombre y el correo electrónico.");
      return;
    }

    setNombre(nuevoNombre.trim());
    setCorreo(nuevoCorreo.trim());
    router.push({
      pathname: "/resultado",
      params: {
        title: "Perfil actualizado",
        message: "Tus datos personales fueron guardados correctamente.",
        returnTo: "/(tabs)/perfil",
      },
    });
  };

  const confirmarRestablecer = () => {
    Alert.alert(
      "Restablecer preferencias",
      "Se restaurarán el perfil, el presupuesto y la lista de deseos. Tu historial de gastos se conservará.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Restablecer",
          style: "destructive",
          onPress: async () => {
            await restablecerAplicacion();
            setNuevoNombre("Jason");
            setNuevoCorreo("jason@email.com");
            router.push({
              pathname: "/resultado",
              params: {
                title: "Preferencias restablecidas",
                message: "El perfil volvió a sus valores iniciales. Tu historial permanece disponible.",
                returnTo: "/(tabs)/perfil",
              },
            });
          },
        },
      ]
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>TU CUENTA</Text>
          <Text style={styles.title}>Perfil</Text>
          <Text style={styles.subtitle}>Administra tus datos y preferencias.</Text>
        </View>
        <View style={styles.avatar}>
          <Ionicons name="person" size={30} color="#1D4ED8" />
        </View>
      </View>

      <View style={styles.identityCard}>
        <View style={styles.identityIcon}>
          <Text style={styles.initial}>{(nuevoNombre.trim()[0] || "U").toUpperCase()}</Text>
        </View>
        <View style={styles.identityInfo}>
          <Text numberOfLines={1} style={styles.identityName}>{nuevoNombre || "Usuario"}</Text>
          <Text numberOfLines={1} style={styles.identityEmail}>{nuevoCorreo || "Sin correo"}</Text>
        </View>
        <View style={styles.activeBadge}>
          <View style={styles.activeDot} />
          <Text style={styles.activeText}>Activo</Text>
        </View>
      </View>

      <Text style={styles.sectionLabel}>Datos personales</Text>
      <View style={styles.formCard}>
        <Text style={styles.label}>Nombre</Text>
        <View style={styles.inputRow}>
          <Ionicons name="person-outline" size={19} color="#64748B" />
          <TextInput onChangeText={setNuevoNombre} placeholder="Nombre" style={styles.input} value={nuevoNombre} />
        </View>

        <Text style={styles.label}>Correo electrónico</Text>
        <View style={styles.inputRow}>
          <Ionicons name="mail-outline" size={19} color="#64748B" />
          <TextInput
            autoCapitalize="none"
            keyboardType="email-address"
            onChangeText={setNuevoCorreo}
            placeholder="Correo electrónico"
            style={styles.input}
            value={nuevoCorreo}
          />
        </View>

        <View style={styles.preferenceRow}>
          <View style={styles.preferenceInfo}>
            <View style={styles.preferenceIcon}>
              <Ionicons name="notifications-outline" size={19} color="#7C3AED" />
            </View>
            <View>
              <Text style={styles.preferenceTitle}>Notificaciones</Text>
              <Text style={styles.preferenceText}>Recordatorios y novedades</Text>
            </View>
          </View>
          <Switch onValueChange={setNotificaciones} value={notificaciones} />
        </View>

        <Pressable onPress={guardarPerfil} style={({ pressed }) => [styles.saveButton, pressed && styles.buttonPressed]}>
          <Ionicons name="checkmark-circle-outline" size={20} color="#FFFFFF" />
          <Text style={styles.saveButtonText}>Guardar cambios</Text>
        </Pressable>
      </View>

      <Text style={styles.sectionLabel}>Plan del mes</Text>
      <Pressable onPress={() => router.push("/(tabs)/pagos" as Href)} style={styles.planCard}>
        <View style={styles.planIcon}>
          <Ionicons name="calendar-outline" size={24} color="#15803D" />
        </View>
        <View style={styles.planInfo}>
          <Text style={styles.planTitle}>Administrar presupuesto</Text>
          <Text style={styles.planText}>Presupuesto actual: Q {presupuestoMensual.toFixed(2)}</Text>
          <Text style={[styles.planBalance, saldoDespuesPendientes < 0 && styles.planBalanceNegative]}>
            Después de pendientes: Q {saldoDespuesPendientes.toFixed(2)}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#64748B" />
      </Pressable>

      <Text style={styles.sectionLabel}>Información</Text>
      <View style={styles.aboutCard}>
        <Pressable onPress={() => setShowAbout((current) => !current)} style={styles.aboutHeader}>
          <View style={styles.aboutHeaderInfo}>
            <View style={styles.aboutIcon}>
              <Ionicons name="information-circle-outline" size={23} color="#2563EB" />
            </View>
            <View>
              <Text style={styles.aboutTitle}>Acerca de la aplicación</Text>
              <Text style={styles.aboutSubtitle}>Conoce las APIs utilizadas</Text>
            </View>
          </View>
          <Ionicons name={showAbout ? "chevron-up" : "chevron-down"} size={20} color="#64748B" />
        </Pressable>

        {showAbout ? (
          <View style={styles.aboutContent}>
            <Text style={styles.aboutDescription}>
              La aplicación consume tres APIs: una propia para administrar gastos, una colaborativa para las tareas y una externa para el catálogo de productos.
            </Text>
            <View style={styles.serviceRow}>
              <View style={[styles.serviceIcon, { backgroundColor: "#DCFCE7" }]}>
                <Ionicons name="wallet-outline" size={20} color="#15803D" />
              </View>
              <View style={styles.serviceInfo}>
                <Text style={styles.serviceTitle}>Gastos y categorías</Text>
                <Text style={styles.serviceText}>API propia en Laravel Passport para guardar gastos, categorías, totales e historial mensual.</Text>
              </View>
            </View>
            <View style={styles.serviceRow}>
              <View style={[styles.serviceIcon, { backgroundColor: "#F3E8FF" }]}>
                <Ionicons name="checkbox-outline" size={20} color="#7C3AED" />
              </View>
              <View style={styles.serviceInfo}>
                <Text style={styles.serviceTitle}>Tareas compartidas</Text>
                <Text style={styles.serviceText}>API colaborativa protegida con Laravel Passport para registrar tareas y consultar el progreso por fechas.</Text>
              </View>
            </View>
            <View style={styles.serviceRow}>
              <View style={[styles.serviceIcon, { backgroundColor: "#DBEAFE" }]}>
                <Ionicons name="storefront-outline" size={20} color="#2563EB" />
              </View>
              <View style={styles.serviceInfo}>
                <Text style={styles.serviceTitle}>Catálogo de productos</Text>
                <Text style={styles.serviceText}>API externa de productos; la aplicación traduce el catálogo y muestra los precios en quetzales.</Text>
              </View>
            </View>
            <Text style={styles.version}>Versión 1.0.0 · Expo SDK 57</Text>
          </View>
        ) : null}
      </View>

      <Pressable onPress={confirmarRestablecer} style={styles.resetButton}>
        <Ionicons name="refresh-outline" size={19} color="#DC2626" />
        <Text style={styles.resetText}>Restablecer preferencias</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: "#F1F5F9", flex: 1 },
  content: { padding: 18, paddingBottom: 42 },
  header: { alignItems: "flex-start", flexDirection: "row", justifyContent: "space-between", marginBottom: 17 },
  eyebrow: { color: "#2563EB", fontSize: 11, fontWeight: "900", letterSpacing: 1.15 },
  title: { color: "#0F172A", fontSize: 30, fontWeight: "900", marginTop: 3 },
  subtitle: { color: "#64748B", marginTop: 5 },
  avatar: { alignItems: "center", backgroundColor: "#DBEAFE", borderRadius: 17, height: 54, justifyContent: "center", width: 54 },
  identityCard: { alignItems: "center", backgroundColor: "#172554", borderRadius: 19, flexDirection: "row", marginBottom: 21, padding: 17 },
  identityIcon: { alignItems: "center", backgroundColor: "#3B82F6", borderRadius: 21, height: 52, justifyContent: "center", width: 52 },
  initial: { color: "#FFFFFF", fontSize: 23, fontWeight: "900" },
  identityInfo: { flex: 1, marginHorizontal: 12 },
  identityName: { color: "#FFFFFF", fontSize: 16, fontWeight: "900" },
  identityEmail: { color: "#BFDBFE", fontSize: 11, marginTop: 3 },
  activeBadge: { alignItems: "center", backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 14, flexDirection: "row", gap: 5, paddingHorizontal: 9, paddingVertical: 7 },
  activeDot: { backgroundColor: "#4ADE80", borderRadius: 4, height: 8, width: 8 },
  activeText: { color: "#DBEAFE", fontSize: 10, fontWeight: "800" },
  sectionLabel: { color: "#334155", fontSize: 12, fontWeight: "900", letterSpacing: 0.7, marginBottom: 8, marginLeft: 2, textTransform: "uppercase" },
  formCard: { backgroundColor: "#FFFFFF", borderColor: "#E2E8F0", borderRadius: 18, borderWidth: 1, marginBottom: 21, padding: 17 },
  label: { color: "#475569", fontSize: 11, fontWeight: "900", marginBottom: 6, textTransform: "uppercase" },
  inputRow: { alignItems: "center", backgroundColor: "#F8FAFC", borderColor: "#CBD5E1", borderRadius: 11, borderWidth: 1, flexDirection: "row", marginBottom: 14, paddingHorizontal: 12 },
  input: { color: "#0F172A", flex: 1, fontSize: 14, paddingHorizontal: 10, paddingVertical: 12 },
  preferenceRow: { alignItems: "center", borderTopColor: "#E2E8F0", borderTopWidth: 1, flexDirection: "row", justifyContent: "space-between", paddingBottom: 16, paddingTop: 16 },
  preferenceInfo: { alignItems: "center", flexDirection: "row", gap: 10 },
  preferenceIcon: { alignItems: "center", backgroundColor: "#F3E8FF", borderRadius: 11, height: 38, justifyContent: "center", width: 38 },
  preferenceTitle: { color: "#334155", fontSize: 13, fontWeight: "900" },
  preferenceText: { color: "#94A3B8", fontSize: 10, marginTop: 2 },
  saveButton: { alignItems: "center", backgroundColor: "#2563EB", borderRadius: 11, flexDirection: "row", gap: 8, justifyContent: "center", minHeight: 50 },
  saveButtonText: { color: "#FFFFFF", fontSize: 14, fontWeight: "900" },
  buttonPressed: { opacity: 0.82 },
  planCard: { alignItems: "center", backgroundColor: "#FFFFFF", borderColor: "#BBF7D0", borderRadius: 18, borderWidth: 1, flexDirection: "row", marginBottom: 21, padding: 15 },
  planIcon: { alignItems: "center", backgroundColor: "#DCFCE7", borderRadius: 13, height: 45, justifyContent: "center", width: 45 },
  planInfo: { flex: 1, marginHorizontal: 11 },
  planTitle: { color: "#14532D", fontSize: 14, fontWeight: "900" },
  planText: { color: "#64748B", fontSize: 11, marginTop: 3 },
  planBalance: { color: "#15803D", fontSize: 11, fontWeight: "800", marginTop: 3 },
  planBalanceNegative: { color: "#DC2626" },
  aboutCard: { backgroundColor: "#FFFFFF", borderColor: "#E2E8F0", borderRadius: 18, borderWidth: 1, overflow: "hidden" },
  aboutHeader: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", padding: 15 },
  aboutHeaderInfo: { alignItems: "center", flexDirection: "row", gap: 11 },
  aboutIcon: { alignItems: "center", backgroundColor: "#EFF6FF", borderRadius: 13, height: 43, justifyContent: "center", width: 43 },
  aboutTitle: { color: "#334155", fontSize: 14, fontWeight: "900" },
  aboutSubtitle: { color: "#94A3B8", fontSize: 10, marginTop: 2 },
  aboutContent: { borderTopColor: "#E2E8F0", borderTopWidth: 1, padding: 16 },
  aboutDescription: { color: "#64748B", fontSize: 12, lineHeight: 19, marginBottom: 15 },
  serviceRow: { alignItems: "flex-start", flexDirection: "row", marginBottom: 14 },
  serviceIcon: { alignItems: "center", borderRadius: 12, height: 40, justifyContent: "center", width: 40 },
  serviceInfo: { flex: 1, marginLeft: 11 },
  serviceTitle: { color: "#334155", fontSize: 13, fontWeight: "900" },
  serviceText: { color: "#64748B", fontSize: 11, lineHeight: 17, marginTop: 3 },
  version: { color: "#94A3B8", fontSize: 10, marginTop: 3, textAlign: "center" },
  resetButton: { alignItems: "center", alignSelf: "center", flexDirection: "row", gap: 7, marginTop: 20, padding: 11 },
  resetText: { color: "#DC2626", fontSize: 13, fontWeight: "800" },
});
