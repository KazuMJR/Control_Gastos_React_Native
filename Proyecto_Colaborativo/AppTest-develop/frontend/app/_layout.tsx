import { Stack, useRouter, useSegments } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useEffect, useState } from 'react';
import { isAuthenticated } from '../services/authService';
import { View, ActivityIndicator, Text } from 'react-native';
import Toast from 'react-native-toast-message';
import { Ionicons } from '@expo/vector-icons';

const toastConfig = {
  success: ({ text1 }: any) => (
    <View style={{ height: 56, width: '90%', backgroundColor: '#0F172A', borderRadius: 14, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 10, elevation: 4 }}>
      <Ionicons name="checkmark-circle" size={24} color="#10b981" style={{ marginRight: 12 }} />
      <Text style={{ color: '#fff', fontSize: 15, fontWeight: '600', flex: 1 }}>{text1}</Text>
    </View>
  ),
  error: ({ text1 }: any) => (
    <View style={{ height: 56, width: '90%', backgroundColor: '#0F172A', borderRadius: 14, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 10, elevation: 4 }}>
      <Ionicons name="close-circle" size={24} color="#ef4444" style={{ marginRight: 12 }} />
      <Text style={{ color: '#fff', fontSize: 15, fontWeight: '600', flex: 1 }}>{text1}</Text>
    </View>
  ),
  info: ({ text1 }: any) => (
    <View style={{ height: 56, width: '90%', backgroundColor: '#0F172A', borderRadius: 14, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 10, elevation: 4 }}>
      <Ionicons name="information-circle" size={24} color="#3b82f6" style={{ marginRight: 12 }} />
      <Text style={{ color: '#fff', fontSize: 15, fontWeight: '600', flex: 1 }}>{text1}</Text>
    </View>
  ),
  deleteSuccess: ({ text1 }: any) => (
    <View style={{ height: 56, width: '90%', backgroundColor: '#0F172A', borderRadius: 14, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 10, elevation: 4 }}>
      <Ionicons name="checkmark-circle" size={24} color="#ef4444" style={{ marginRight: 12 }} />
      <Text style={{ color: '#fff', fontSize: 15, fontWeight: '600', flex: 1 }}>{text1}</Text>
    </View>
  )
};

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    const checkAuth = async () => {
      const auth = await isAuthenticated();
      const inAuthGroup = segments[0] === 'login';

      if (!auth && !inAuthGroup) {
        router.replace('/login');
      } else if (auth && inAuthGroup) {
        router.replace('/(tabs)');
      }
      setIsReady(true);
    };

    checkAuth();
  }, [segments]);

  if (!isReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="login" />
        <Stack.Screen name="(tabs)" />
      </Stack>
      <Toast config={toastConfig} position="top" topOffset={50} visibilityTime={3000} />
    </SafeAreaProvider>
  );
}