import { Stack } from 'expo-router';

export default function NasaStackLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: '#ffffff',
        },
        headerTintColor: '#2563eb', // Color de tema activo (Blue)
        headerTitleStyle: {
          fontWeight: 'bold',
          color: '#0f172a', // Color slate para textos
        },
        headerShadowVisible: true,
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          headerShown: false, // Ni la IA puede quitarlo jajajaja
        }}
      />
      <Stack.Screen
        name="detail"
        options={{
          headerTitle: 'Detalle de Imagen',
        }}
      />
    </Stack>
  );
}
