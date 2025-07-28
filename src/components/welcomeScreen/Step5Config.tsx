import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { saveProfile } from '../../utils/database';

interface Props {
  onFinish: () => void;
}

export default function Step5Preferences({ onFinish }: Props) {
  const [alarm, setAlarm] = useState(true);
  const [speedLimit, setSpeedLimit] = useState('30'); // km/h

  const handleSubmit = async () => {
    const speed = parseFloat(speedLimit);
    if (isNaN(speed) || speed < 5 || speed > 150) {
      Alert.alert('Geçersiz Hız', 'Lütfen 5 ile 150 arasında bir hız girin.');
      return;
    }

    // Doğru G kuvveti hesabı
    const timeToStop = 0.3; // saniye – çarpışma süresi tahmini
    const speedMs = speed / 3.6; // km/h → m/s
    const acceleration = speedMs / timeToStop; // m/s²
    const gLimit = acceleration / 9.81; // kaç G?

    try {
      const [name, surname, birth_year, blood_type, health_notes, contactsRaw] =
        await Promise.all([
          AsyncStorage.getItem('@user_name'),
          AsyncStorage.getItem('@user_surname'),
          AsyncStorage.getItem('@birth_year'),
          AsyncStorage.getItem('@blood_type'),
          AsyncStorage.getItem('@health_notes'),
          AsyncStorage.getItem('@emergency_contacts'),
        ]);

      const contacts = contactsRaw ? JSON.parse(contactsRaw) : [];

      await saveProfile({
        name: name || '',
        surname: surname || '',
        birth_year: birth_year || '',
        blood_type: blood_type || '',
        health_notes: health_notes || '',
        emergency_contacts: contacts.join(','),
      });

      await AsyncStorage.setItem(
        '@preferences',
        JSON.stringify({
          alarm,
          sms: true,
          gLimit,
        }),
      );

      await AsyncStorage.setItem('onboardingStep', 'completed');

      onFinish();
    } catch (error) {
      console.error('Kayıt hatası:', error);
      Alert.alert('Hata', 'Bilgiler kaydedilemedi.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Son Adım</Text>

      <View style={styles.row}>
        <Text style={styles.label}>Alarm çalsın mı?</Text>
        <Switch value={alarm} onValueChange={setAlarm} />
      </View>

      <Text style={[styles.label, { marginTop: 20 }]}>Hız Limiti (km/h):</Text>
      <TextInput
        value={speedLimit}
        onChangeText={setSpeedLimit}
        keyboardType="numeric"
        style={styles.input}
        placeholder="Örn: 30"
        placeholderTextColor="#999"
      />

      <TouchableOpacity style={styles.button} onPress={handleSubmit}>
        <Text style={styles.buttonText}>Kurulumu Tamamla</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212', padding: 24 },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 24,
    textAlign: 'center',
  },
  row: {
    backgroundColor: '#1e1e1e',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#1e1e1e',
    color: '#fff',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    marginTop: 8,
  },
  button: {
    backgroundColor: '#1e88e5',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 28,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
