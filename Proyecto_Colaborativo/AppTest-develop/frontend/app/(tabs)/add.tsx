import { useState, useCallback } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet, ScrollView } from 'react-native';
import Toast from 'react-native-toast-message';
import { useRouter, useFocusEffect } from 'expo-router';
import {
  Category,
  getCategories,
  addTask
} from '../../storage';
import { Ionicons } from '@expo/vector-icons';

export default function AddTaskScreen() {
  const [title, setTitle] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  
  const router = useRouter();

  // Carga las categorías disponibles
  const loadCategories = async () => {
    try {
      const allCategories = await getCategories();
      setCategories(allCategories);
    } catch (error) {
      console.error('Error cargando categorías para agregar tarea:', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadCategories();
    }, [])
  );

  const handleSave = async () => {
    if (!title.trim()) {
      Toast.show({ type: 'error', text1: 'Por favor, escribe el nombre de la tarea.' });
      return;
    }

    try {
      // Guarda la tarea en la base de datos con la categoría elegida
      await addTask(title.trim(), selectedCategoryId);

      setTitle('');
      Toast.show({ type: 'success', text1: 'Tarea creada con éxito' });
      // Redirigir a la pestaña de listado
      router.push('/');
    } catch (error) {
      Toast.show({ type: 'error', text1: 'No se pudo completar la acción. Inténtalo de nuevo' });
      console.error(error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.label}>Nombre de la Tarea</Text>
        <TextInput
          style={styles.input}
          placeholder="E.g., Comprar víveres, Estudiar react native..."
          placeholderTextColor="#94a3b8"
          value={title}
          onChangeText={setTitle}
        />

        <Text style={styles.label}>Selecciona una Categoría</Text>
        <View style={styles.categorySelectorContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categorySelector}
          >
            <TouchableOpacity
              style={[
                styles.categoryItem,
                selectedCategoryId === null && { backgroundColor: '#e2e8f0', borderColor: '#94a3b8' }
              ]}
              onPress={() => setSelectedCategoryId(null)}
            >
              <Ionicons name="remove-circle-outline" size={16} color={selectedCategoryId === null ? '#0f172a' : '#64748B'} style={{ marginRight: 6 }} />
              <Text style={[styles.categoryText, selectedCategoryId === null && { color: '#0f172a' }]}>
                Ninguna
              </Text>
            </TouchableOpacity>

            {categories.map((category) => {
              const isSelected = selectedCategoryId === category.id;
              return (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.categoryItem,
                    isSelected && { backgroundColor: category.color, borderColor: category.color }
                  ]}
                  onPress={() => setSelectedCategoryId(category.id)}
                >
                  <View style={[styles.dot, { backgroundColor: isSelected ? '#fff' : category.color }]} />
                  <Text style={[styles.categoryText, isSelected && styles.categoryTextSelected]}>
                    {category.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <TouchableOpacity style={styles.button} onPress={handleSave}>
          <Ionicons name="checkmark-circle" size={20} color="#fff" />
          <Text style={styles.buttonText}>Guardar Tarea</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f8fafc',
    justifyContent: 'center'
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    color: '#0f172a',
    marginBottom: 24,
    backgroundColor: '#f8fafc'
  },
  categorySelectorContainer: {
    marginBottom: 30
  },
  categorySelector: {
    flexDirection: 'row',
    paddingVertical: 4
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginRight: 10,
    backgroundColor: '#fff'
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569'
  },
  categoryTextSelected: {
    color: '#fff'
  },
  button: {
    flexDirection: 'row',
    backgroundColor: '#2563eb',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8
  }
});