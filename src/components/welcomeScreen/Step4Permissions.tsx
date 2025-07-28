import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { requestAndroidPermissions } from '../../utils/functions';

interface Props {
  onNext: () => void;
}

export default function Step4Permissions({ onNext }: Props) {
  const [isLoading, setIsLoading] = useState(false);

  const handleRequestPermissions = async () => {
    if (Platform.OS !== 'android') {
      onNext(); // iOS ise direkt geç
      return;
    }

    setIsLoading(true);
    const granted = await requestAndroidPermissions();
    setIsLoading(false);

    if (granted) {
      await AsyncStorage.setItem('@permissions_granted', 'true');
      onNext();
    } else {
      Alert.alert(
        'İzinler Gerekli',
        'Uygulamanın doğru çalışabilmesi için gerekli izinleri vermelisin.'
      );
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Gerekli İzinler</Text>
      <Text style={styles.description}>
        Uygulamanın düzgün çalışabilmesi için aşağıdaki izinler gereklidir:
      </Text>

      <View style={styles.card}>
        <Text style={styles.bullet}>• Konum izni (kazada konum göndermek için)</Text>
        <Text style={styles.bullet}>• SMS izni (acil kişilere mesaj göndermek için)</Text>
        <Text style={styles.bullet}>• Servis izni (arka planda çalışabilmek için)</Text>
      </View>

      <TouchableOpacity
        style={[styles.button, isLoading && { opacity: 0.6 }]}
        onPress={handleRequestPermissions}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>
          {isLoading ? 'İzinler alınıyor...' : 'İzinleri Ver'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212', padding: 24 },
  title: {
    fontSize: 22,
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    color: '#ccc',
    fontSize: 15,
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 20,
  },
  card: {
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 32,
  },
  bullet: {
    color: '#fff',
    fontSize: 15,
    marginBottom: 8,
  },
  button: {
    backgroundColor: '#1e88e5',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});
