import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  Platform,
  NativeModules,
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import WelcomeScreen from './src/screens/WelcomeScreen';
import HomeScreen from './src/screens/HomeScreen';
import ProfileScreen from './src/screens/ProfileScreen';

import { initDB, getProfile, deleteDB } from './src/utils/database';
import { requestAndroidPermissions } from './src/utils/functions';

const Stack = createNativeStackNavigator();
const { CrashServiceStarter } = NativeModules; // Native Kotlin Module

export default function App() {
  const [initialRoute, setInitialRoute] = useState<'Welcome' | 'Home' | null>(
    null,
  );

  useEffect(() => {
    const bootstrap = async () => {
      try {
        //await deleteDB(); // ⚠️ Sadece test için, prod'da silme!
        await initDB();
        const profile = await getProfile();
        setInitialRoute(profile ? 'Home' : 'Welcome');

        const granted = await requestAndroidPermissions();

        if (granted && Platform.OS === 'android') {
          try {
            CrashServiceStarter.startService();
            console.log('Crash detection service started');
          } catch (error) {
            console.error('Servis başlatılamadı:', error);
          }
        }
      } catch (error) {
        console.error('Başlatma hatası:', error);
        setInitialRoute('Welcome');
      }
    };

    bootstrap();
  }, []);

  if (initialRoute === null) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Yükleniyor...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={initialRoute}
        screenOptions={{
          headerStyle: { backgroundColor: '#121212' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: 'bold' },
          contentStyle: { backgroundColor: '#121212' },
        }}
      >
        <Stack.Screen
          name="Welcome"
          component={WelcomeScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#121212',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
  },
});
