import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts, Manrope_400Regular, Manrope_700Bold, Manrope_800ExtraBold } from '@expo-google-fonts/manrope';
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold } from '@expo-google-fonts/inter';
import { View, ActivityIndicator } from 'react-native';
import { Colors } from '../constants/theme';
import { AppProvider } from '../context/AppContext';
import '../global.css';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Manrope_400Regular,
    Manrope_700Bold,
    Manrope_800ExtraBold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#006684' }}>
        <ActivityIndicator size="large" color="#ffffff" />
      </View>
    );
  }

  return (
    <AppProvider>
      <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
        {/* Splash — always the initial route */}
        <Stack.Screen name="splash" options={{ gestureEnabled: false, animation: 'none' }} />
        {/* Onboarding */}
        <Stack.Screen name="welcome" options={{ gestureEnabled: false, animation: 'fade' }} />
        {/* Main tabs */}
        <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
        {/* Secondary stack screens */}
        <Stack.Screen name="notifications" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="analytics" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="project_details" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="team_balance" options={{ animation: 'slide_from_right' }} />
      </Stack>
      <StatusBar style="auto" />
    </AppProvider>
  );
}
