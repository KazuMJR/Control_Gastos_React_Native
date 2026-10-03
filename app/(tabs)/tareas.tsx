import Ionicons from "@expo/vector-icons/Ionicons";
import { useEffect, useState } from "react";
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

import {
  clearCollaborativeToken,
  COLLABORATIVE_DEMO_EMAIL,
  COLLABORATIVE_DEMO_PASSWORD,
  COLLABORATIVE_TASKS_API_URL,
  collaborativeApiErrorMessage,
  CollaborativeCategory,
  createCollaborativeTask,
  getCollaborativeCategories,
  getCollaborativeToken,
  getTaskProgress,
  loginToCollaborativeDemo,
  loginToCollaborativeApi,
  logoutFromCollaborativeApi,
  registerInCollaborativeApi,
  TaskProgress,
} from "../../services/collaborative-tasks-api";

type SessionState = "checking" | "anonymous" | "authenticated";

function formatLocalDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function initialRange() {
  const today = new Date();
  return {
    from: formatLocalDate(new Date(today.getFullYear(), today.getMonth(), 1)),
    to: formatLocalDate(today),
  };
}

function validIsoDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const parsed = new Date(`${value}T00:00:00`);
  return !Number.isNaN(parsed.getTime()) && formatLocalDate(parsed) === value;
}

async function fetchDashboard(from: string, to: string) {
  const [categories, progress] = await Promise.all([
    getCollaborativeCategories(),
    getTaskProgress(from, to),
  ]);

  return { categories, progress };
}

export default function CollaborativeTasksScreen() {
  const range = initialRange();
  const [session, setSession] = useState<SessionState>("checking");
  const [registerMode, setRegisterMode] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState(COLLABORATIVE_DEMO_EMAIL);
  const [password, setPassword] = useState(COLLABORATIVE_DEMO_PASSWORD);
  const [authenticating, setAuthenticating] = useState(false);
  const [from, setFrom] = useState(range.from);
  const [to, setTo] = useState(range.to);
  const [categories, setCategories] = useState<CollaborativeCategory[]>([]);
  const [progress, setProgress] = useState<TaskProgress | null>(null);
  const [loadingProgress, setLoadingProgress] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [savingTask, setSavingTask] = useState(false);

  useEffect(() => {
    let active = true;

    getCollaborativeToken()
      .then((token) => {
        if (!active) {
          return null;
        }

        if (!token) {
          setSession("anonymous");
          return null;
        }

        return fetchDashboard(range.from, range.to).then((dashboard) => {
          if (active) {
            setCategories(dashboard.categories);
            setProgress(dashboard.progress);
            setSession("authenticated");
          }
        });
      })
      .catch(async () => {
        await clearCollaborativeToken();
        if (active) {
          setSession("anonymous");
        }
      });

    return () => {
      active = false;
    };
  }, [range.from, range.to]);

  const applyDashboard = async () => {
    if (!validIsoDate(from) || !validIsoDate(to)) {
      Alert.alert("Fechas inválidas", "Utiliza el formato AAAA-MM-DD en ambas fechas.");
      return;
    }

    if (from > to) {
      Alert.alert("Rango inválido", "La fecha inicial no puede ser posterior a la fecha final.");
      return;
    }

    setLoadingProgress(true);
    try {
      const dashboard = await fetchDashboard(from, to);
      setCategories(dashboard.categories);
      setProgress(dashboard.progress);
    } catch (error) {
      Alert.alert("No se pudo consultar el progreso", collaborativeApiErrorMessage(error));
    } finally {
      setLoadingProgress(false);
    }
  };

  const authenticate = async () => {
    if (!email.trim() || !password || (registerMode && !name.trim())) {
      Alert.alert("Datos requeridos", "Completa los campos de autenticación.");
      return;
    }

    if (registerMode && password.length < 8) {
      Alert.alert("Contraseña inválida", "La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    setAuthenticating(true);
    try {
      if (registerMode) {
        await registerInCollaborativeApi(name, email, password);
      } else {
        await loginToCollaborativeApi(email, password);
      }

      const dashboard = await fetchDashboard(from, to);
      setCategories(dashboard.categories);
      setProgress(dashboard.progress);
      setPassword("");
      setSession("authenticated");
    } catch (error) {
      Alert.alert("No se pudo iniciar la integración", collaborativeApiErrorMessage(error));
    } finally {
      setAuthenticating(false);
    }
  };

  const authenticateDemo = async () => {
    setAuthenticating(true);
    try {
      await loginToCollaborativeDemo();
      const dashboard = await fetchDashboard(from, to);
      setCategories(dashboard.categories);
      setProgress(dashboard.progress);
      setSession("authenticated");
    } catch (error) {
      Alert.alert("No se pudo abrir la demostración", collaborativeApiErrorMessage(error));
    } finally {
      setAuthenticating(false);
    }
  };

  const saveTask = async () => {
    if (!taskTitle.trim()) {
      Alert.alert("Título requerido", "Escribe el nombre de la nueva tarea.");
      return;
    }

    setSavingTask(true);
    try {
      const createdTask = await createCollaborativeTask(
        taskTitle,
        taskDescription,
        selectedCategoryId
      );
      setTaskTitle("");
      setTaskDescription("");

      const dashboard = await fetchDashboard(from, to);
      setCategories(dashboard.categories);
      setProgress(dashboard.progress);
      Alert.alert("Tarea registrada", `La API creó correctamente “${createdTask.title}”.`);
    } catch (error) {
      Alert.alert("No se pudo registrar la tarea", collaborativeApiErrorMessage(error));
    } finally {
      setSavingTask(false);
    }
  };

  const logout = async () => {
    try {
      await logoutFromCollaborativeApi();
    } catch {
      await clearCollaborativeToken();
    }
    setProgress(null);
    setCategories([]);
    setSelectedCategoryId(null);
    setEmail(COLLABORATIVE_DEMO_EMAIL);
    setPassword(COLLABORATIVE_DEMO_PASSWORD);
    setSession("anonymous");
  };

  const toggleRegisterMode = () => {
    setRegisterMode((current) => {
      const nextMode = !current;
      setName("");
      setEmail(nextMode ? "" : COLLABORATIVE_DEMO_EMAIL);
      setPassword(nextMode ? "" : COLLABORATIVE_DEMO_PASSWORD);
      return nextMode;
    });
  };

  if (session === "checking") {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.mutedText}>Conectando con la API de tareas…</Text>
      </View>
    );
  }

  if (session === "anonymous") {
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.authContainer}
      >
        <ScrollView contentContainerStyle={styles.authContent} keyboardShouldPersistTaps="handled">
          <View style={styles.integrationBadge}>
            <Ionicons name="git-network-outline" size={22} color="#1D4ED8" />
            <Text style={styles.integrationBadgeText}>API colaborativa Laravel Passport</Text>
          </View>

          <Text style={styles.authTitle}>{registerMode ? "Crear cuenta de tareas" : "Conectar con tareas"}</Text>
          <Text style={styles.authDescription}>
            Usa una cuenta del proyecto de tu compañero para consultar el progreso y registrar tareas desde esta aplicación.
          </Text>

          {!registerMode ? (
            <>
              <Pressable disabled={authenticating} onPress={authenticateDemo} style={styles.demoButton}>
                {authenticating ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="play-circle-outline" size={21} color="#FFFFFF" />
                    <Text style={styles.primaryButtonText}>Entrar a la demostración</Text>
                  </>
                )}
              </Pressable>
              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>o usa otra cuenta</Text>
                <View style={styles.dividerLine} />
              </View>
            </>
          ) : null}

          {registerMode ? (
            <TextInput
              onChangeText={setName}
              placeholder="Nombre completo"
              style={styles.input}
              value={name}
            />
          ) : null}

          <TextInput
            autoCapitalize="none"
            keyboardType="email-address"
            onChangeText={setEmail}
            placeholder="Correo electrónico"
            style={styles.input}
            value={email}
          />
          <TextInput
            onChangeText={setPassword}
            placeholder="Contraseña"
            secureTextEntry
            style={styles.input}
            value={password}
          />

          <Pressable disabled={authenticating} onPress={authenticate} style={styles.primaryButton}>
            {authenticating ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.primaryButtonText}>{registerMode ? "Registrarme y conectar" : "Iniciar sesión"}</Text>
            )}
          </Pressable>

          <Pressable onPress={toggleRegisterMode} style={styles.linkButton}>
            <Text style={styles.linkButtonText}>
              {registerMode ? "Ya tengo una cuenta" : "Crear una cuenta para la demostración"}
            </Text>
          </Pressable>

          <Text selectable style={styles.apiAddress}>API: {COLLABORATIVE_TASKS_API_URL}</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  const summary = progress?.summary;

  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" style={styles.container}>
      <View style={styles.connectionCard}>
        <View style={styles.connectionTitleRow}>
          <View style={styles.onlineDot} />
          <Text style={styles.connectionTitle}>Conectado a la API de tareas</Text>
        </View>
        <Text numberOfLines={1} style={styles.connectionUrl}>{COLLABORATIVE_TASKS_API_URL}</Text>
        <Pressable onPress={logout}>
          <Text style={styles.logoutText}>Desconectar cuenta</Text>
        </Pressable>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Progreso por rango de fechas</Text>
        <Text style={styles.sectionDescription}>Las fechas filtran las tareas por el día en que fueron registradas.</Text>

        <View style={styles.dateRow}>
          <View style={styles.dateField}>
            <Text style={styles.label}>Desde</Text>
            <TextInput
              autoCapitalize="none"
              onChangeText={setFrom}
              placeholder="AAAA-MM-DD"
              style={styles.input}
              value={from}
            />
          </View>
          <View style={styles.dateField}>
            <Text style={styles.label}>Hasta</Text>
            <TextInput
              autoCapitalize="none"
              onChangeText={setTo}
              placeholder="AAAA-MM-DD"
              style={styles.input}
              value={to}
            />
          </View>
        </View>

        <Pressable disabled={loadingProgress} onPress={applyDashboard} style={styles.secondaryButton}>
          {loadingProgress ? (
            <ActivityIndicator color="#1D4ED8" />
          ) : (
            <>
              <Ionicons name="analytics-outline" size={19} color="#1D4ED8" />
              <Text style={styles.secondaryButtonText}>Consultar progreso</Text>
            </>
          )}
        </Pressable>
      </View>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Progreso general</Text>
        <Text style={styles.summaryPercentage}>{summary?.percentage ?? 0}%</Text>
        <Text style={styles.summaryDetail}>
          {summary?.completed_tasks ?? 0} completadas de {summary?.total_tasks ?? 0} tareas
        </Text>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${summary?.percentage ?? 0}%` }]} />
        </View>
      </View>

      <Text style={styles.groupHeading}>Progreso por grupo</Text>
      {progress?.groups.length ? (
        progress.groups.map((group) => (
          <View key={group.category_id ?? "uncategorized"} style={styles.groupCard}>
            <View style={styles.groupHeader}>
              <View style={styles.groupNameRow}>
                <View style={[styles.categoryDot, { backgroundColor: group.category_color }]} />
                <Text style={styles.groupName}>{group.category_name}</Text>
              </View>
              <Text style={styles.groupPercentage}>{group.percentage}%</Text>
            </View>
            <Text style={styles.groupDetail}>
              {group.completed_tasks} completadas · {group.pending_tasks} pendientes · {group.total_tasks} total
            </Text>
            <View style={styles.groupTrack}>
              <View
                style={[
                  styles.groupFill,
                  { backgroundColor: group.category_color, width: `${group.percentage}%` },
                ]}
              />
            </View>
            <View style={styles.taskList}>
              {group.tasks.map((task) => (
                <View key={task.id} style={styles.taskRow}>
                  <Ionicons
                    name={task.completed ? "checkmark-circle" : "ellipse-outline"}
                    size={21}
                    color={task.completed ? "#16A34A" : "#94A3B8"}
                  />
                  <View style={styles.taskTextContainer}>
                    <Text style={[styles.taskTitle, task.completed && styles.taskTitleCompleted]}>
                      {task.title}
                    </Text>
                    {task.description ? (
                      <Text style={styles.taskDescription}>{task.description}</Text>
                    ) : null}
                  </View>
                </View>
              ))}
            </View>
          </View>
        ))
      ) : (
        <View style={styles.emptyCard}>
          <Ionicons name="calendar-outline" size={32} color="#94A3B8" />
          <Text style={styles.emptyTitle}>No hay tareas en este rango</Text>
          <Text style={styles.mutedText}>Cambia las fechas o registra una tarea nueva.</Text>
        </View>
      )}

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Registrar nueva tarea</Text>
        <TextInput
          onChangeText={setTaskTitle}
          placeholder="Ejemplo: Preparar presentación"
          style={styles.input}
          value={taskTitle}
        />
        <TextInput
          multiline
          numberOfLines={3}
          onChangeText={setTaskDescription}
          placeholder="Descripción de la tarea (opcional)"
          style={[styles.input, styles.descriptionInput]}
          textAlignVertical="top"
          value={taskDescription}
        />

        <Text style={styles.label}>Grupo o categoría</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroller}>
          <Pressable
            onPress={() => setSelectedCategoryId(null)}
            style={[styles.categoryChip, selectedCategoryId === null && styles.categoryChipSelected]}
          >
            <Text style={[styles.categoryChipText, selectedCategoryId === null && styles.categoryChipTextSelected]}>
              Sin categoría
            </Text>
          </Pressable>
          {categories.map((category) => {
            const selected = category.id === selectedCategoryId;
            return (
              <Pressable
                key={category.id}
                onPress={() => setSelectedCategoryId(category.id)}
                style={[
                  styles.categoryChip,
                  selected && { backgroundColor: category.color, borderColor: category.color },
                ]}
              >
                <Text style={[styles.categoryChipText, selected && styles.categoryChipTextSelected]}>
                  {category.name}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <Pressable disabled={savingTask} onPress={saveTask} style={styles.primaryButton}>
          {savingTask ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="add-circle-outline" size={20} color="#FFFFFF" />
              <Text style={styles.primaryButtonText}>Guardar mediante la API</Text>
            </>
          )}
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: "#F4F6F8", flex: 1 },
  content: { padding: 16, paddingBottom: 42 },
  centered: { alignItems: "center", backgroundColor: "#F4F6F8", flex: 1, justifyContent: "center", padding: 24 },
  authContainer: { backgroundColor: "#F4F6F8", flex: 1 },
  authContent: { flexGrow: 1, justifyContent: "center", padding: 22 },
  integrationBadge: { alignItems: "center", alignSelf: "center", backgroundColor: "#DBEAFE", borderRadius: 24, flexDirection: "row", gap: 8, marginBottom: 20, paddingHorizontal: 14, paddingVertical: 9 },
  integrationBadgeText: { color: "#1D4ED8", fontSize: 13, fontWeight: "700" },
  authTitle: { color: "#0F172A", fontSize: 28, fontWeight: "800", textAlign: "center" },
  authDescription: { color: "#64748B", lineHeight: 21, marginBottom: 24, marginTop: 10, textAlign: "center" },
  input: { backgroundColor: "#FFFFFF", borderColor: "#CBD5E1", borderRadius: 10, borderWidth: 1, color: "#0F172A", fontSize: 15, marginBottom: 14, paddingHorizontal: 14, paddingVertical: 13 },
  demoButton: { alignItems: "center", backgroundColor: "#15803D", borderRadius: 11, flexDirection: "row", gap: 8, justifyContent: "center", marginBottom: 18, minHeight: 52, paddingHorizontal: 16 },
  dividerRow: { alignItems: "center", flexDirection: "row", gap: 10, marginBottom: 18 },
  dividerLine: { backgroundColor: "#CBD5E1", flex: 1, height: 1 },
  dividerText: { color: "#64748B", fontSize: 12 },
  primaryButton: { alignItems: "center", backgroundColor: "#2563EB", borderRadius: 11, flexDirection: "row", gap: 8, justifyContent: "center", minHeight: 50, paddingHorizontal: 16 },
  primaryButtonText: { color: "#FFFFFF", fontSize: 15, fontWeight: "800" },
  linkButton: { alignItems: "center", padding: 16 },
  linkButtonText: { color: "#2563EB", fontWeight: "700" },
  apiAddress: { color: "#94A3B8", fontSize: 11, marginTop: 8, textAlign: "center" },
  connectionCard: { backgroundColor: "#EFF6FF", borderColor: "#BFDBFE", borderRadius: 14, borderWidth: 1, marginBottom: 14, padding: 14 },
  connectionTitleRow: { alignItems: "center", flexDirection: "row", gap: 8 },
  onlineDot: { backgroundColor: "#16A34A", borderRadius: 5, height: 10, width: 10 },
  connectionTitle: { color: "#1E3A8A", fontWeight: "800" },
  connectionUrl: { color: "#64748B", fontSize: 12, marginTop: 6 },
  logoutText: { color: "#DC2626", fontSize: 13, fontWeight: "700", marginTop: 10 },
  card: { backgroundColor: "#FFFFFF", borderRadius: 16, elevation: 2, marginBottom: 16, padding: 18 },
  sectionTitle: { color: "#0F172A", fontSize: 19, fontWeight: "800", marginBottom: 6 },
  sectionDescription: { color: "#64748B", fontSize: 13, lineHeight: 19, marginBottom: 16 },
  dateRow: { flexDirection: "row", gap: 10 },
  dateField: { flex: 1 },
  label: { color: "#475569", fontSize: 12, fontWeight: "800", marginBottom: 7, textTransform: "uppercase" },
  secondaryButton: { alignItems: "center", backgroundColor: "#EFF6FF", borderColor: "#BFDBFE", borderRadius: 10, borderWidth: 1, flexDirection: "row", gap: 8, justifyContent: "center", minHeight: 46 },
  secondaryButtonText: { color: "#1D4ED8", fontWeight: "800" },
  summaryCard: { backgroundColor: "#172554", borderRadius: 18, marginBottom: 18, padding: 22 },
  summaryLabel: { color: "#BFDBFE", fontSize: 14, fontWeight: "700" },
  summaryPercentage: { color: "#FFFFFF", fontSize: 46, fontWeight: "900", marginTop: 4 },
  summaryDetail: { color: "#DBEAFE", marginBottom: 16, marginTop: 3 },
  progressTrack: { backgroundColor: "#1E3A8A", borderRadius: 5, height: 10, overflow: "hidden" },
  progressFill: { backgroundColor: "#60A5FA", borderRadius: 5, height: "100%" },
  groupHeading: { color: "#0F172A", fontSize: 18, fontWeight: "800", marginBottom: 10, marginLeft: 2 },
  groupCard: { backgroundColor: "#FFFFFF", borderColor: "#E2E8F0", borderRadius: 14, borderWidth: 1, marginBottom: 10, padding: 15 },
  groupHeader: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  groupNameRow: { alignItems: "center", flexDirection: "row", gap: 8 },
  categoryDot: { borderRadius: 6, height: 12, width: 12 },
  groupName: { color: "#334155", fontSize: 15, fontWeight: "800" },
  groupPercentage: { color: "#0F172A", fontSize: 17, fontWeight: "900" },
  groupDetail: { color: "#64748B", fontSize: 12, marginBottom: 10, marginTop: 8 },
  groupTrack: { backgroundColor: "#E2E8F0", borderRadius: 4, height: 7, overflow: "hidden" },
  groupFill: { borderRadius: 4, height: "100%" },
  taskList: { borderTopColor: "#E2E8F0", borderTopWidth: 1, gap: 11, marginTop: 14, paddingTop: 13 },
  taskRow: { alignItems: "flex-start", flexDirection: "row", gap: 9 },
  taskTextContainer: { flex: 1 },
  taskTitle: { color: "#334155", fontSize: 14, fontWeight: "800" },
  taskTitleCompleted: { color: "#64748B", textDecorationLine: "line-through" },
  taskDescription: { color: "#64748B", fontSize: 12, lineHeight: 17, marginTop: 3 },
  emptyCard: { alignItems: "center", backgroundColor: "#FFFFFF", borderColor: "#E2E8F0", borderRadius: 14, borderWidth: 1, marginBottom: 16, padding: 24 },
  emptyTitle: { color: "#334155", fontWeight: "800", marginBottom: 5, marginTop: 8 },
  mutedText: { color: "#64748B", marginTop: 9, textAlign: "center" },
  categoryScroller: { marginBottom: 18 },
  descriptionInput: { minHeight: 86 },
  categoryChip: { borderColor: "#CBD5E1", borderRadius: 20, borderWidth: 1, marginRight: 8, paddingHorizontal: 13, paddingVertical: 9 },
  categoryChipSelected: { backgroundColor: "#334155", borderColor: "#334155" },
  categoryChipText: { color: "#475569", fontSize: 13, fontWeight: "700" },
  categoryChipTextSelected: { color: "#FFFFFF" },
});
