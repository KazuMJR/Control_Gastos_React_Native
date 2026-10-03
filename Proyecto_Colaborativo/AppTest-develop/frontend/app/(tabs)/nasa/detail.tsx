import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { ApodItem } from '../../../services/nasaApi';

const { width } = Dimensions.get('window');

export default function NasaDetailScreen() {
  const params = useLocalSearchParams<{ item?: string }>();
  const router = useRouter();

  let item: ApodItem | null = null;
  if (params.item) {
    try {
      item = JSON.parse(decodeURIComponent(params.item)) as ApodItem;
    } catch (e) {
      console.error('Error al decodificar el ítem de NASA:', e);
    }
  }

  if (!item) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle-outline" size={64} color="#ef4444" />
        <Text style={styles.errorText}>No se pudo cargar la información del recurso astronómico.</Text>
        <TouchableOpacity style={styles.backButtonSecondary} onPress={() => router.back()}>
          <Text style={styles.backButtonTextSecondary}>Volver a la Lista</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Usar hdurl si está disponible para alta resolución, de lo contrario fallback a url
  const imageUrl = item.hdurl || item.url;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      {/* Cabecera de Imagen en Alta Resolución */}
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: imageUrl }}
          style={styles.image}
          contentFit="cover"
          transition={300}
        />
        {item.copyright ? (
          <View style={styles.copyrightBadge}>
            <Ionicons name="camera" size={12} color="#fff" style={styles.badgeIcon} />
            <Text style={styles.copyrightText} numberOfLines={1}>
              {item.copyright.trim()}
            </Text>
          </View>
        ) : null}
      </View>

      {/* Contenido Detallado */}
      <View style={styles.contentContainer}>
        <Text style={styles.title}>{item.title}</Text>

        {/* Metadatos */}
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Ionicons name="calendar-outline" size={16} color="#64748b" style={styles.metaIcon} />
            <Text style={styles.metaText}>{item.date}</Text>
          </View>
          {item.copyright ? (
            <View style={[styles.metaItem, styles.metaItemRight]}>
              <Ionicons name="person-outline" size={16} color="#64748b" style={styles.metaIcon} />
              <Text style={styles.metaText} numberOfLines={1}>
                {item.copyright.trim()}
              </Text>
            </View>
          ) : null}
        </View>

        <View style={styles.divider} />

        {/* Explicación */}
        <Text style={styles.descriptionHeader}>Descripción</Text>
        <Text style={styles.descriptionText}>{item.explanation}</Text>

        <View style={styles.divider} />

        {/* Botón de Retorno Adicional */}
        <TouchableOpacity style={styles.backButtonPrimary} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={18} color="#64748b" style={styles.buttonIcon} />
          <Text style={styles.backButtonTextPrimary}>Regresar a Exploración</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc'
  },
  scrollContent: {
    paddingBottom: 32
  },
  imageContainer: {
    width: '100%',
    height: 300,
    position: 'relative',
    backgroundColor: '#0f172a'
  },
  image: {
    width: '100%',
    height: '100%'
  },
  copyrightBadge: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    maxWidth: width * 0.7
  },
  badgeIcon: {
    marginRight: 4
  },
  copyrightText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '500'
  },
  contentContainer: {
    padding: 20,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -20,
    minHeight: 300
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
    lineHeight: 28,
    marginBottom: 12
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  metaItemRight: {
    marginLeft: 16,
    flex: 1
  },
  metaIcon: {
    marginRight: 6
  },
  metaText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500'
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 16
  },
  descriptionHeader: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 10
  },
  descriptionText: {
    fontSize: 15,
    color: '#334155',
    lineHeight: 24,
    textAlign: 'justify'
  },
  backButtonPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f5f9',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 8
  },
  buttonIcon: {
    marginRight: 6
  },
  backButtonTextPrimary: {
    color: '#475569',
    fontSize: 15,
    fontWeight: '600'
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 32
  },
  errorText: {
    fontSize: 15,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
    lineHeight: 22
  },
  backButtonSecondary: {
    backgroundColor: '#2563eb',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10
  },
  backButtonTextSecondary: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600'
  }
});
