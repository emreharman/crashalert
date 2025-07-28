import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Props = {
  onNext: () => void;
};

export default function Step1Personal({ onNext }: Props) {
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [bithYear, setBirthYear] = useState('');

  const handleNext = async () => {
    if (!name.trim() || !surname.trim()) {
      Alert.alert('Eksik Bilgi', 'Lütfen ad ve soyad giriniz.');
      return;
    }

    try {
      await AsyncStorage.setItem('@user_name', name.trim());
      await AsyncStorage.setItem('@user_surname', surname.trim());
      await AsyncStorage.setItem('@birth_year', bithYear.trim());
      onNext();
    } catch (err) {
      Alert.alert('Hata', 'Bilgiler kaydedilemedi.');
      console.error(err);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>👤 Kişisel Bilgiler</Text>

      <TextInput
        style={styles.input}
        placeholder="Adınız"
        placeholderTextColor="#888"
        value={name}
        onChangeText={setName}
      />
      <TextInput
        style={styles.input}
        placeholder="Soyadınız"
        placeholderTextColor="#888"
        value={surname}
        onChangeText={setSurname}
      />
      <TextInput
        style={styles.input}
        placeholder="Doğum Yılı"
        placeholderTextColor="#888"
        value={bithYear}
        onChangeText={setBirthYear}
        keyboardType="numeric"
      />

      <TouchableOpacity style={styles.button} onPress={handleNext}>
        <Text style={styles.buttonText}>Devam Et</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 22,
    color: '#fff',
    fontWeight: '600',
    marginBottom: 24,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#1e1e1e',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    color: '#fff',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  button: {
    backgroundColor: '#1e88e5',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 12,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});
