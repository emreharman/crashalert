import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import WelcomeScreen from './src/screens/WelcomeScreen';
import HomeScreen from './src/screens/HomeScreen';
import ProfileScreen from './src/screens/ProfileScreen';

import { initDB, getProfile, deleteDB } from './src/utils/database';

const Stack = createNativeStackNavigator();

export default function App() {
  const [initialRoute, setInitialRoute] = useState<'Welcome' | 'Home' | null>(
    null,
  );

  useEffect(() => {
    const bootstrap = async () => {
      try {
        await deleteDB();
        await initDB();
        const profile = await getProfile();
        setInitialRoute(profile ? 'Home' : 'Welcome');
      } catch (error) {
        console.error('Veritabanı başlatılırken hata:', error);
        setInitialRoute('Welcome');
      }
    };

    bootstrap();
  }, []);

  if (initialRoute === null) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Yükleniyor...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={initialRoute}>
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
