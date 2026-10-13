import { Stack } from "expo-router";
import { DarkTheme, DefaultTheme, ThemeProvider } from "expo-router/react-navigation";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

import { useColorScheme } from "@/hooks/use-color-scheme";

import { AppProvider } from "../context/AppContext";

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <AppProvider>
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="gasto/[id]" options={{ title: "Detalle del gasto" }} />
          <Stack.Screen name="producto/[id]" options={{ title: "Detalle del producto" }} />
          <Stack.Screen name="resultado" options={{ title: "Operación realizada" }} />
        </Stack>

        <StatusBar style="auto" />
      </ThemeProvider>
    </AppProvider>
  );
}
