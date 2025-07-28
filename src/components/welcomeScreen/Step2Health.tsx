import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  TextInput,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Picker } from '@react-native-picker/picker';

type Props = {
  onNext: () => void;
};

const bloodTypeOptions = [
  '0 Rh+',
  '0 Rh-',
  'A Rh+',
  'A Rh-',
  'B Rh+',
  'B Rh-',
  'AB Rh+',
  'AB Rh-',
];

export default function Step2Health({ onNext }: Props) {
  const [bloodType, setBloodType] = useState('');
  const [note, setNote] = useState('');

  const handleNext = async () => {
    if (!bloodType) {
      Alert.alert('Eksik Bilgi', 'Lütfen kan grubunuzu seçin.');
      return;
    }

    try {
      await AsyncStorage.setItem('@blood_type', bloodType);
      await AsyncStorage.setItem('@health_notes', note);
      onNext();
    } catch (error) {
      console.error('Veri kaydetme hatası:', error);
      Alert.alert('Hata', 'Veriler kaydedilemedi.');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <Text style={styles.title}>Sağlık Bilgileri</Text>

      <Text style={styles.label}>Kan Grubun</Text>
      <View style={styles.pickerWrapper}>
        <Picker
          selectedValue={bloodType}
          onValueChange={value => setBloodType(value)}
          dropdownIconColor="#fff"
          style={styles.picker}
        >
          <Picker.Item label="Seçiniz..." value="" />
          {bloodTypeOptions.map(bt => (
            <Picker.Item key={bt} label={bt} value={bt} />
          ))}
        </Picker>
      </View>

      <Text style={styles.label}>Sağlık Notları</Text>
      <TextInput
        style={styles.input}
        placeholder="Varsa alerjileriniz, kullandığınız ilaçlar..."
        placeholderTextColor="#888"
        value={note}
        onChangeText={text => setNote(text)}
      />

      <TouchableOpacity style={styles.button} onPress={handleNext}>
        <Text style={styles.buttonText}>Devam Et</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
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
    fontSize: 24,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 24,
    textAlign: 'center',
  },
  label: {
    color: '#bbb',
    marginBottom: 6,
    fontSize: 14,
  },
  pickerWrapper: {
    backgroundColor: '#1e1e1e',
    borderRadius: 8,
    borderColor: '#333',
    borderWidth: 1,
    marginBottom: 16,
  },
  picker: {
    color: '#fff',
  },
  button: {
    backgroundColor: '#1e88e5',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 24,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
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
});
