import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { fetchNasaApod, ApodItem } from '../../../services/nasaApi';
import { Ionicons } from '@expo/vector-icons';

export default function NasaListScreen() {
  const [items, setItems] = useState<ApodItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const loadData = async (showLoadingIndicator = true) => {
    if (showLoadingIndicator) {
      setLoading(true);
    }
    setError(null);
    try {
      const data = await fetchNasaApod(10);
      setItems(data);
    } catch (err: any) {
      const errorMsg = err?.message || 'Ocurrió un error al cargar las imágenes.';
      setError(errorMsg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData(false);
  }, []);

  const handlePressItem = (item: ApodItem) => {
    // Pasar el objeto serializado de forma segura en la URL
    const serializedItem = encodeURIComponent(JSON.stringify(item));
    router.push({
      pathname: '/(tabs)/nasa/detail' as any,
      params: { item: serializedItem }
    });
  };

  const renderItem = ({ item }: { item: ApodItem }) => {
    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.85}
        onPress={() => handlePressItem(item)}
      >
        <Image
          source={{ uri: item.url }}
          style={styles.cardImage}
          contentFit="cover"
          transition={300}
        />
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle} numberOfLines={2}>
            {item.title}
          </Text>
          <View style={styles.cardFooter}>
            <View style={styles.dateContainer}>
              <Ionicons name="calendar-outline" size={14} color="#64748b" style={styles.dateIcon} />
              <Text style={styles.cardDate}>{item.date}</Text>
            </View>
            <View style={styles.detailButton}>
              <Text style={styles.detailButtonText}>Ver detalle</Text>
              <Ionicons name="arrow-forward" size={14} color="#2563eb" />
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Explorando el cosmos...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle-outline" size={64} color="#ef4444" />
        <Text style={styles.errorTitle}>Error de Conexión</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => loadData(true)}>
          <Ionicons name="refresh" size={18} color="#fff" style={styles.retryIcon} />
          <Text style={styles.retryButtonText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.date + '-' + item.title}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#2563eb']}
            tintColor="#2563eb"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="planet-outline" size={48} color="#94a3b8" />
            <Text style={styles.emptyText}>No se encontraron imágenes en este momento.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0'
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0f172a'
  },
  logoutButton: {
    padding: 4
  },
  listContent: {
    padding: 16
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6
  },
  cardImage: {
    width: '100%',
    height: 180,
    backgroundColor: '#f1f5f9'
  },
  cardContent: {
    padding: 16
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 8,
    lineHeight: 22
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  dateIcon: {
    marginRight: 4
  },
  cardDate: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500'
  },
  detailButton: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  detailButtonText: {
    fontSize: 13,
    color: '#2563eb',
    fontWeight: '600',
    marginRight: 4
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 32
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: '#475569',
    fontWeight: '500'
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    marginTop: 16,
    marginBottom: 8
  },
  errorText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563eb',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    elevation: 1,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2
  },
  retryIcon: {
    marginRight: 6
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600'
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64
  },
  emptyText: {
    fontSize: 15,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 12
  }
});
