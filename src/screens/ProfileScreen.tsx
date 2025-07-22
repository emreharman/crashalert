import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  Text,
  TextInput,
  Button,
  Alert,
  StyleSheet,
  KeyboardTypeOptions,
  View,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { getProfile, saveProfile, initDB } from '../utils/database';

type FormType = {
  name: string;
  surname: string;
  birth_year: string;
  blood_type: string;
  health_notes: string;
  emergency_contacts: string[]; // artık array
};

const bloodTypeOptions = ['0 Rh+', '0 Rh-', 'A Rh+', 'A Rh-', 'B Rh+', 'B Rh-', 'AB Rh+', 'AB Rh-'];

export default function ProfileScreen({ navigation }: any) {
  const [form, setForm] = useState<FormType>({
    name: '',
    surname: '',
    birth_year: '',
    blood_type: '',
    health_notes: '',
    emergency_contacts: [''],
  });

  const handleChange = (key: keyof FormType, value: any) => {
    setForm({ ...form, [key]: value });
  };

  useEffect(() => {
    const loadProfile = async () => {
      try {
        await initDB();
        const profile = await getProfile();
        if (profile) {
          setForm({
            name: profile.name || '',
            surname: profile.surname || '',
            birth_year: profile.birth_year?.toString() || '',
            blood_type: profile.blood_type || '',
            health_notes: profile.health_notes || '',
            emergency_contacts: profile.emergency_contacts
              ? profile.emergency_contacts.split(',').map((num: string) => num.trim())
              : [''],
          });
        }
      } catch (error) {
        console.error('Profil yüklenirken hata:', error);
      }
    };

    loadProfile();
  }, []);

  const handleSave = async () => {
    try {
      const contactsAsString = form.emergency_contacts.filter(Boolean).join(',');
      await saveProfile({ ...form, emergency_contacts: contactsAsString });
      Alert.alert('Kaydedildi', 'Bilgiler başarıyla kaydedildi.');
      navigation.navigate('Home');
    } catch (error) {
      console.error('Kayıt hatası:', error);
      Alert.alert('Hata', 'Kayıt sırasında bir hata oluştu.');
    }
  };

  const getKeyboardType = (key: keyof FormType): KeyboardTypeOptions => {
    if (key === 'birth_year') return 'numeric';
    return 'default';
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Acil Bilgi Formu</Text>

      {/* Normal alanlar */}
      {['name', 'surname', 'birth_year', 'health_notes'].map(key => (
        <TextInput
          key={key}
          style={styles.input}
          placeholder={key.replace('_', ' ').toUpperCase()}
          value={form[key as keyof FormType] as string}
          onChangeText={text => handleChange(key as keyof FormType, text)}
          keyboardType={getKeyboardType(key as keyof FormType)}
        />
      ))}

      {/* Kan Grubu */}
      <View style={styles.pickerWrapper}>
        <Text style={styles.pickerLabel}>Kan Grubu</Text>
        <Picker
          selectedValue={form.blood_type}
          onValueChange={value => handleChange('blood_type', value)}
        >
          <Picker.Item label="Seçiniz..." value="" />
          {bloodTypeOptions.map(bt => (
            <Picker.Item key={bt} label={bt} value={bt} />
          ))}
        </Picker>
      </View>

      {/* Acil Durum Kişileri */}
      <Text style={styles.pickerLabel}>Acil Durum Kişileri</Text>
      {form.emergency_contacts.map((contact, index) => (
        <View key={index} style={styles.contactItem}>
          <TextInput
            style={[styles.input, { flex: 1, marginBottom: 0 }]}
            placeholder={`Numara ${index + 1}`}
            value={contact}
            keyboardType="phone-pad"
            onChangeText={(text) => {
              const updated = [...form.emergency_contacts];
              updated[index] = text;
              handleChange('emergency_contacts', updated);
            }}
          />
          <Button
            title="✕"
            color="#d9534f"
            onPress={() => {
              const updated = [...form.emergency_contacts];
              updated.splice(index, 1);
              handleChange('emergency_contacts', updated.length ? updated : ['']);
            }}
          />
        </View>
      ))}
      <Button
        title="+ Kişi Ekle"
        onPress={() => handleChange('emergency_contacts', [...form.emergency_contacts, ''])}
      />

      {/* Kaydet */}
      <View style={{ marginTop: 16 }}>
        <Button title="Kaydet" onPress={handleSave} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20 },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 12,
    marginBottom: 12,
    borderRadius: 8,
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    marginBottom: 12,
    overflow: 'hidden',
  },
  pickerLabel: {
    fontWeight: 'bold',
    marginBottom: 4,
    marginTop: 12,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
});
