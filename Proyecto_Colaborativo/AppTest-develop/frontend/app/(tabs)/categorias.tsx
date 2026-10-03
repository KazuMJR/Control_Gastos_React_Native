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
    Category,
    getCategories,
    addCategory,
    updateCategory,
    deleteCategory
} from '../../storage';
import { Ionicons } from '@expo/vector-icons';

const PRESET_COLORS = [
    '#3b82f6', // Azul
    '#ec4899', // Rosa
    '#10b981', // Verde
    '#f59e0b', // Naranja
    '#8b5cf6', // Morado
    '#ef4444', // Rojo
    '#06b6d4', // Cian
    '#64748b'  // Gris
];

export default function CategoriesScreen() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [name, setName] = useState('');
    const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0]);

    // Estados para Eliminación
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);

    // Cargar categorías
    const loadCategories = async () => {
        try {
            const result = await getCategories();
            setCategories(result);
        } catch (error) {
            console.error('Error cargando categorías:', error);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadCategories();
        }, [])
    );

    // Abrir modal para crear
    const handleOpenCreate = () => {
        setEditingCategory(null);
        setName('');
        setSelectedColor(PRESET_COLORS[0]);
        setModalVisible(true);
    };

    // Abrir modal para editar
    const handleOpenEdit = (category: Category) => {
        setEditingCategory(category);
        setName(category.name);
        setSelectedColor(category.color);
        setModalVisible(true);
    };

    const handleSave = async () => {
        if (!name.trim()) {
            Toast.show({ type: 'error', text1: 'El nombre de la categoría no puede estar vacío.' });
            return;
        }

        try {
            if (editingCategory) {
                // Editar
                await updateCategory(editingCategory.id, name.trim(), selectedColor);
                Toast.show({ type: 'success', text1: 'Categoría actualizada' });
            } else {
                // Crear
                await addCategory(name.trim(), selectedColor);
                Toast.show({ type: 'success', text1: 'Categoría creada con éxito' });
            }
            setModalVisible(false);
            loadCategories();
        } catch (error: any) {
            if (error.message && error.message.includes('UNIQUE constraint failed')) {
                Toast.show({ type: 'error', text1: 'Ya existe una categoría con este nombre.' });
            } else {
                Toast.show({ type: 'error', text1: 'No se pudo completar la acción. Inténtalo de nuevo' });
                console.error(error);
            }
        }
    };

    // Confirmar y eliminar categoría
    const handleDelete = (category: Category) => {
        if (category.name === 'General') {
            Toast.show({ type: 'error', text1: 'La categoría "General" no puede eliminarse.' });
            return;
        }
        setCategoryToDelete(category);
        setDeleteModalVisible(true);
    };

    const confirmDeleteCategory = async () => {
        if (!categoryToDelete) return;
        try {
            await deleteCategory(categoryToDelete.id);
            loadCategories();
            Toast.show({ type: 'deleteSuccess', text1: 'Categoría eliminada' });
            setDeleteModalVisible(false);
        } catch (error) {
            Toast.show({ type: 'error', text1: 'No se pudo completar la acción. Inténtalo de nuevo' });
            console.error(error);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.description}>
                    Administra las etiquetas para organizar tus tareas de manera más efectiva.
                </Text>
                <TouchableOpacity style={styles.addButton} onPress={handleOpenCreate}>
                    <Ionicons name="add" size={20} color="#fff" />
                    <Text style={styles.addButtonText}>Nueva Categoría</Text>
                </TouchableOpacity>
            </View>

            <FlatList
                data={categories}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.list}
                renderItem={({ item }) => (
                    <View style={styles.card}>
                        <View style={styles.categoryInfo}>
                            <View style={[styles.colorIndicator, { backgroundColor: item.color }]} />
                            <Text style={styles.categoryName}>{item.name}</Text>
                        </View>
                        <View style={styles.actions}>
                            <TouchableOpacity
                                style={styles.actionButton}
                                onPress={() => handleOpenEdit(item)}
                            >
                                <Ionicons name="pencil" size={18} color="#2563eb" />
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.actionButton, item.name === 'General' && styles.disabledButton]}
                                onPress={() => handleDelete(item)}
                                disabled={item.name === 'General'}
                            >
                                <Ionicons
                                    name="trash"
                                    size={18}
                                    color={item.name === 'General' ? '#cbd5e1' : '#ef4444'}
                                />
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            />

            <Modal
                visible={modalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setModalVisible(false)}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.modalOverlay}
                >
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>
                                {editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}
                            </Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Ionicons name="close" size={24} color="#64748b" />
                            </TouchableOpacity>
                        </View>

                        <TextInput
                            style={styles.input}
                            placeholder="Nombre de la categoría..."
                            placeholderTextColor="#94a3b8"
                            value={name}
                            onChangeText={setName}
                            maxLength={25}
                        />

                        <Text style={styles.sectionTitle}>Selecciona un color</Text>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.colorSelector}
                        >
                            {PRESET_COLORS.map((color) => (
                                <TouchableOpacity
                                    key={color}
                                    style={[
                                        styles.colorOption,
                                        { backgroundColor: color },
                                        selectedColor === color && styles.colorOptionSelected
                                    ]}
                                    onPress={() => setSelectedColor(color)}
                                >
                                    {selectedColor === color && (
                                        <Ionicons name="checkmark" size={18} color="#fff" />
                                    )}
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        <View style={styles.modalFooter}>
                            <TouchableOpacity
                                style={[styles.btn, styles.btnCancel]}
                                onPress={() => setModalVisible(false)}
                            >
                                <Text style={styles.btnCancelText}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.btn, styles.btnSave, { backgroundColor: selectedColor }]}
                                onPress={handleSave}
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
                            <Text style={styles.modalTitle}>Eliminar Categoría</Text>
                        </View>

                        <Text style={styles.deletePrompt}>
                            ¿Estás seguro de que deseas eliminar la categoría <Text style={{ fontWeight: 'bold' }}>"{categoryToDelete?.name}"</Text>? Las tareas asociadas quedarán sin categoría asignada.
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
                                onPress={confirmDeleteCategory}
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
    header: {
        padding: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
        alignItems: 'center'
    },
    description: {
        fontSize: 14,
        color: '#64748b',
        textAlign: 'center',
        marginBottom: 12,
        lineHeight: 20
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#2563eb',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 8,
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 1
    },
    addButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 14,
        marginLeft: 6
    },
    list: {
        padding: 16
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        elevation: 2,
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4
    },
    categoryInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1
    },
    colorIndicator: {
        width: 16,
        height: 16,
        borderRadius: 8,
        marginRight: 12
    },
    categoryName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#0f172a'
    },
    actions: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    actionButton: {
        padding: 8,
        marginLeft: 8,
        borderRadius: 8,
        backgroundColor: '#f1f5f9'
    },
    disabledButton: {
        opacity: 0.5,
        backgroundColor: '#f8fafc'
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
    sectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#64748b',
        marginBottom: 10
    },
    colorSelector: {
        flexDirection: 'row',
        paddingVertical: 4,
        marginBottom: 24
    },
    colorOption: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 12,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'transparent'
    },
    colorOptionSelected: {
        borderColor: '#0f172a',
        transform: [{ scale: 1.1 }]
    },
    modalFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 10
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