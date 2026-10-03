import { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import Toast from 'react-native-toast-message';
import { useFocusEffect } from 'expo-router';
import {
  Task as StorageTask,
  Category,
  getTasks,
  getCategories,
  toggleTaskCompleted,
  deleteTask,
  updateTask
} from '../../storage';
import { Ionicons } from '@expo/vector-icons';

interface Task {
  id: string;
  title: string;
  categoryId: string | null;
  completed: boolean;
  category_name: string | null;
  category_color: string | null;
}

export default function TasksScreen() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedFilterCategory, setSelectedFilterCategory] = useState<string | null>(null); // null = Todas

  // Estados para Edición
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editCategoryId, setEditCategoryId] = useState<string | null>(null);

  // Estados para Eliminación
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<{ id: string; title: string } | null>(null);

  // Carga las tareas aplicando filtros si corresponde
  const loadTasks = async () => {
    try {
      const allTasks = await getTasks();
      const allCategories = await getCategories();

      // Mapear categorías en JS (LEFT JOIN)
      let mappedTasks: Task[] = allTasks.map((task) => {
        const category = allCategories.find((c) => c.id === task.categoryId);
        return {
          ...task,
          category_name: category ? category.name : 'Sin Categoría',
          category_color: category ? category.color : '#cbd5e1'
        };
      });

      // Filtrar tareas por categoría
      if (selectedFilterCategory === 'none') {
        mappedTasks = mappedTasks.filter((t) => t.categoryId === null);
      } else if (selectedFilterCategory !== null) {
        mappedTasks = mappedTasks.filter((t) => t.categoryId === selectedFilterCategory);
      }

      setTasks(mappedTasks);
    } catch (error) {
      console.error('Error cargando tareas:', error);
    }
  };

  // Carga categorías para el filtro y la edición
  const loadCategories = async () => {
    try {
      const allCategories = await getCategories();
      setCategories(allCategories);
    } catch (error) {
      console.error('Error cargando categorías en index:', error);
    }
  };

  // Recargar datos cada vez que la pantalla tenga foco o cambie el filtro
  useFocusEffect(
    useCallback(() => {
      loadTasks();
      loadCategories();
    }, [selectedFilterCategory])
  );

  const toggleComplete = async (id: string) => {
    try {
      await toggleTaskCompleted(id);
      loadTasks();
      Toast.show({ type: 'info', text1: 'Estado de la tarea actualizado' });
    } catch (error) {
      console.error('Error al cambiar estado de la tarea:', error);
      Toast.show({ type: 'error', text1: 'No se pudo completar la acción. Inténtalo de nuevo' });
    }
  };

  // Confirmar y eliminar tarea
  const handleDeleteTask = (id: string, title: string) => {
    setTaskToDelete({ id, title });
    setDeleteModalVisible(true);
  };

  const confirmDeleteTask = async () => {
    if (!taskToDelete) return;
    try {
      await deleteTask(taskToDelete.id);
      loadTasks();
      Toast.show({ type: 'deleteSuccess', text1: 'Tarea eliminada' });
      setDeleteModalVisible(false);
    } catch (error) {
      console.error('Error al eliminar tarea:', error);
      Toast.show({ type: 'error', text1: 'No se pudo completar la acción. Inténtalo de nuevo' });
    }
  };

  // Abrir Modal de Edición
  const handleOpenEdit = (task: Task) => {
    setTaskToEdit(task);
    setEditTitle(task.title);
    setEditCategoryId(task.categoryId);
    setEditModalVisible(true);
  };

  // Guardar Cambios de Edición
  const handleSaveEdit = async () => {
    if (!editTitle.trim()) {
      Toast.show({ type: 'error', text1: 'El nombre de la tarea no puede estar vacío.' });
      return;
    }

    if (!taskToEdit) return;

    try {
      await updateTask(taskToEdit.id, editTitle.trim(), editCategoryId);
      setEditModalVisible(false);
      loadTasks();
      Toast.show({ type: 'success', text1: 'Tarea modificada correctamente' });
    } catch (error) {
      Toast.show({ type: 'error', text1: 'No se pudo completar la acción. Inténtalo de nuevo' });
      console.error(error);
    }
  };

  return (
    <View style={styles.container}>
      {/* Filtro de Categorías */}
      <View style={styles.filterWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContainer}
        >
          <TouchableOpacity
            style={[
              styles.filterItem,
              selectedFilterCategory === null && styles.filterItemActive
            ]}
            onPress={() => setSelectedFilterCategory(null)}
          >
            <Text
              style={[
                styles.filterText,
                selectedFilterCategory === null && styles.filterTextActive
              ]}
            >
              Todas
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterItem,
              selectedFilterCategory === 'none' && styles.filterItemActive
            ]}
            onPress={() => setSelectedFilterCategory('none')}
          >
            <Text
              style={[
                styles.filterText,
                selectedFilterCategory === 'none' && styles.filterTextActive
              ]}
            >
              Sin Categoría
            </Text>
          </TouchableOpacity>

          {categories.map((cat) => {
            const isActive = selectedFilterCategory === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.filterItem,
                  isActive && { backgroundColor: cat.color, borderColor: cat.color }
                ]}
                onPress={() => setSelectedFilterCategory(cat.id)}
              >
                <Text style={[styles.filterText, isActive && styles.filterTextActive]}>
                  {cat.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Lista de Tareas */}
      {tasks.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="clipboard-outline" size={64} color="#94a3b8" />
          <Text style={styles.emptyText}>No hay tareas aquí.</Text>
          <Text style={styles.emptySubtext}>Crea una tarea nueva para comenzar.</Text>
        </View>
      ) : (
        <FlatList
          data={tasks}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            const isCompleted = item.completed;
            const categoryName = item.category_name || 'Sin Categoría';
            const categoryColor = item.category_color || '#cbd5e1';

            return (
              <View style={[styles.card, isCompleted && styles.cardCompleted]}>
                <TouchableOpacity
                  style={styles.checkArea}
                  onPress={() => toggleComplete(item.id)}
                >
                  <Ionicons
                    name={isCompleted ? 'checkmark-circle' : 'ellipse-outline'}
                    size={24}
                    color={isCompleted ? '#10b981' : '#94a3b8'}
                  />
                </TouchableOpacity>

                <View style={styles.contentArea}>
                  <Text style={[styles.title, isCompleted && styles.done]}>
                    {item.title}
                  </Text>

                  {/* Badge de Categoría */}
                  <View style={[styles.badge, { backgroundColor: categoryColor + '15' }]}>
                    <View style={[styles.badgeDot, { backgroundColor: categoryColor }]} />
                    <Text style={[styles.badgeText, { color: categoryColor }]}>
                      {categoryName}
                    </Text>
                  </View>
                </View>

                <View style={styles.actions}>
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => handleOpenEdit(item)}
                  >
                    <Ionicons name="pencil" size={18} color="#3b82f6" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => handleDeleteTask(item.id, item.title)}
                  >
                    <Ionicons name="trash" size={18} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
        />
      )}

      {/* Modal de Edición de Tarea */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Editar Tarea</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalLabel}>Título</Text>
            <TextInput
              style={styles.input}
              value={editTitle}
              onChangeText={setEditTitle}
              placeholder="Editar título de la tarea..."
              placeholderTextColor="#94a3b8"
            />

            <Text style={styles.modalLabel}>Categoría</Text>
            <View style={styles.selectorWrapper}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.modalCategorySelector}
              >
                {categories.map((category) => {
                  const isSelected = editCategoryId === category.id;
                  return (
                    <TouchableOpacity
                      key={category.id}
                      style={[
                        styles.modalCategoryItem,
                        isSelected && { backgroundColor: category.color, borderColor: category.color }
                      ]}
                      onPress={() => setEditCategoryId(category.id)}
                    >
                      <View
                        style={[
                          styles.modalDot,
                          { backgroundColor: isSelected ? '#fff' : category.color }
                        ]}
                      />
                      <Text
                        style={[
                          styles.modalCategoryText,
                          isSelected && styles.modalCategoryTextSelected
                        ]}
                      >
                        {category.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.btn, styles.btnCancel]}
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={styles.btnCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btn, styles.btnSave]}
                onPress={handleSaveEdit}
              >
                <Text style={styles.btnSaveText}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Modal de Confirmación de Eliminación */}
      <Modal
        visible={deleteModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setDeleteModalVisible(false)}
      >
        <View style={styles.modalOverlayCenter}>
          <View style={styles.modalContentCenter}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Eliminar Tarea</Text>
            </View>

            <Text style={styles.deletePrompt}>
              ¿Estás seguro de que deseas eliminar la tarea <Text style={{ fontWeight: 'bold' }}>"{taskToDelete?.title}"</Text>? Esta acción no se puede deshacer.
            </Text>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.btn, styles.btnCancel]}
                onPress={() => setDeleteModalVisible(false)}
              >
                <Text style={styles.btnCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btn, { backgroundColor: '#ef4444', flexDirection: 'row' }]}
                onPress={confirmDeleteTask}
              >
                <Ionicons name="checkmark" size={18} color="#fff" style={{ marginRight: 6 }} />
                <Text style={styles.btnSaveText}>Eliminar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc'
  },
  filterWrapper: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingVertical: 12
  },
  filterContainer: {
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center'
  },
  filterItem: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 14,
    marginRight: 8,
    backgroundColor: '#fff'
  },
  filterItemActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb'
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569'
  },
  filterTextActive: {
    color: '#fff'
  },
  list: {
    padding: 16
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    elevation: 2,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6
  },
  cardCompleted: {
    backgroundColor: '#f8fafc',
    borderColor: '#f1f5f9'
  },
  checkArea: {
    paddingRight: 12,
    justifyContent: 'center',
    alignItems: 'center'
  },
  contentArea: {
    flex: 1,
    justifyContent: 'center'
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 6
  },
  done: {
    textDecorationLine: 'line-through',
    color: '#94a3b8',
    fontWeight: 'normal'
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 12
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700'
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 8
  },
  actionBtn: {
    padding: 8,
    marginLeft: 6,
    borderRadius: 8,
    backgroundColor: '#f1f5f9'
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#475569',
    marginTop: 16
  },
  emptySubtext: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 6
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(15, 23, 42, 0.4)'
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5
  },
  modalOverlayCenter: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    paddingHorizontal: 20
  },
  modalContentCenter: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5
  },
  deletePrompt: {
    fontSize: 15,
    color: '#475569',
    marginBottom: 24,
    lineHeight: 22
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a'
  },
  modalLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    color: '#0f172a',
    marginBottom: 20,
    backgroundColor: '#f8fafc'
  },
  selectorWrapper: {
    marginBottom: 24
  },
  modalCategorySelector: {
    flexDirection: 'row',
    paddingVertical: 4
  },
  modalCategoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
    backgroundColor: '#fff'
  },
  modalDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6
  },
  modalCategoryText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569'
  },
  modalCategoryTextSelected: {
    color: '#fff'
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  btn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center'
  },
  btnCancel: {
    backgroundColor: '#f1f5f9',
    marginRight: 12
  },
  btnCancelText: {
    color: '#64748b',
    fontWeight: '600'
  },
  btnSave: {
    backgroundColor: '#2563eb'
  },
  btnSaveText: {
    color: '#fff',
    fontWeight: '600'
  }
});