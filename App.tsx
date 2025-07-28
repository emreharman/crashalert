import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  NativeModules,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import WelcomeScreen from './src/screens/WelcomeScreen';
import HomeScreen from './src/screens/HomeScreen';
import ProfileScreen from './src/screens/ProfileScreen';

import { initDB, getProfile } from './src/utils/database';
import { requestAndroidPermissions } from './src/utils/functions';

const Stack = createNativeStackNavigator();
const { CrashServiceStarter } = NativeModules;

export default function App() {
  const [initialRoute, setInitialRoute] = useState<'Welcome' | 'Home' | null>(null);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        await initDB();
        const profile = await getProfile();
        const onboardingStep = await AsyncStorage.getItem('onboardingStep');

        if (profile && onboardingStep === 'completed') {
          setInitialRoute('Home');
        } else {
          setInitialRoute('Welcome');
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
