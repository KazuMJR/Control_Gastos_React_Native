import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { getTasks, getCategories } from '../../storage';
import { Ionicons } from '@expo/vector-icons';

interface GlobalStats {
  total: number;
  completed: number;
  percentage: number;
}

interface CategoryStats {
  id: string;
  name: string;
  color: string;
  total_tasks: number;
  completed_tasks: number;
  percentage: number;
}

export default function StatsScreen() {
  const [globalStats, setGlobalStats] = useState<GlobalStats>({ total: 0, completed: 0, percentage: 0 });
  const [categoryStats, setCategoryStats] = useState<CategoryStats[]>([]);

  const loadStats = async () => {
    try {
      const allTasks = await getTasks();
      const allCategories = await getCategories();

      // 1. Estadísticas Globales
      const total = allTasks.length;
      const completed = allTasks.filter((t) => t.completed).length;
      const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
      setGlobalStats({ total, completed, percentage });

      // 2. Estadísticas por Categoría
      const formattedCatStats = allCategories.map((cat) => {
        const catTasks = allTasks.filter((t) => t.categoryId === cat.id);
        const totalCat = catTasks.length;
        const completedCat = catTasks.filter((t) => t.completed).length;
        const percentageCat = totalCat > 0 ? Math.round((completedCat / totalCat) * 100) : 0;

        return {
          id: cat.id,
          name: cat.name,
          color: cat.color,
          total_tasks: totalCat,
          completed_tasks: completedCat,
          percentage: percentageCat
        };
      });

      setCategoryStats(formattedCatStats);
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadStats();
    }, [])
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Tarjeta de Progreso General */}
      <View style={styles.mainProgressCard}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressTitle}>Progreso General</Text>
          <View style={styles.statsBadge}>
            <Text style={styles.statsBadgeText}>
              {globalStats.completed} / {globalStats.total} Tareas
            </Text>
          </View>
        </View>

        <View style={styles.progressContainer}>
          <Text style={styles.percentageText}>{globalStats.percentage}%</Text>
          <Text style={styles.percentageSub}>completado</Text>
        </View>

        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: `${globalStats.percentage}%` }]} />
        </View>
      </View>

      {/* Mini Tarjetas Informativas */}
      <View style={styles.infoRow}>
        <View style={styles.infoCard}>
          <View style={[styles.iconWrapper, { backgroundColor: '#eff6ff' }]}>
            <Ionicons name="time" size={24} color="#3b82f6" />
          </View>
          <Text style={styles.infoValue}>{globalStats.total - globalStats.completed}</Text>
          <Text style={styles.infoLabel}>Pendientes</Text>
        </View>

        <View style={styles.infoCard}>
          <View style={[styles.iconWrapper, { backgroundColor: '#ecfdf5' }]}>
            <Ionicons name="checkmark-done-circle" size={24} color="#10b981" />
          </View>
          <Text style={styles.infoValue}>{globalStats.completed}</Text>
          <Text style={styles.infoLabel}>Completadas</Text>
        </View>
      </View>

      {/* Desglose por Categoría */}
      <Text style={styles.sectionTitle}>Progreso por Categoría</Text>
      
      {categoryStats.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>No hay categorías disponibles.</Text>
        </View>
      ) : (
        categoryStats.map((item) => (
          <View key={item.id} style={styles.categoryCard}>
            <View style={styles.catCardHeader}>
              <View style={styles.catNameWrapper}>
                <View style={[styles.catColorDot, { backgroundColor: item.color }]} />
                <Text style={styles.catName}>{item.name}</Text>
              </View>
              <Text style={styles.catProgressText}>
                {item.completed_tasks} / {item.total_tasks}
              </Text>
            </View>

            <View style={styles.catProgressBarBg}>
              <View
                style={[
                  styles.catProgressBarFill,
                  { width: `${item.percentage}%`, backgroundColor: item.color }
                ]}
              />
            </View>

            <View style={styles.catCardFooter}>
              <Text style={styles.catPercentage}>{item.percentage}% completado</Text>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc'
  },
  content: {
    padding: 20,
    paddingBottom: 40
  },
  mainProgressCard: {
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    elevation: 4,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#cbd5e1'
  },
  statsBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 20
  },
  statsBadgeText: {
    color: '#f8fafc',
    fontSize: 12,
    fontWeight: '600'
  },
  progressContainer: {
    alignItems: 'center',
    marginBottom: 20
  },
  percentageText: {
    fontSize: 54,
    fontWeight: '800',
    color: '#fff',
    lineHeight: 58
  },
  percentageSub: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 4
  },
  progressBarBg: {
    height: 10,
    backgroundColor: '#334155',
    borderRadius: 5,
    overflow: 'hidden'
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#3b82f6',
    borderRadius: 5
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 28
  },
  infoCard: {
    backgroundColor: '#fff',
    flex: 1,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    marginHorizontal: 5,
    elevation: 2,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4
  },
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12
  },
  infoValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a'
  },
  infoLabel: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
    fontWeight: '600'
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 16
  },
  emptyCard: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center'
  },
  emptyText: {
    color: '#64748b',
    fontSize: 14
  },
  categoryCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    elevation: 2,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4
  },
  catCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  catNameWrapper: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  catColorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8
  },
  catName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#334155'
  },
  catProgressText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b'
  },
  catProgressBarBg: {
    height: 6,
    backgroundColor: '#f1f5f9',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8
  },
  catProgressBarFill: {
    height: '100%',
    borderRadius: 3
  },
  catCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  catPercentage: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '600'
  }
});