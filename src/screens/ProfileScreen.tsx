import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  Text,
  TextInput,
  Alert,
  StyleSheet,
  View,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Switch,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import PhoneInput from 'react-native-phone-number-input';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getProfile, saveProfile, initDB } from '../utils/database';
import { NativeModules } from 'react-native';

const { CrashServiceStarter } = NativeModules;

type FormType = {
  name: string;
  surname: string;
  birth_year: string;
  blood_type: string;
  health_notes: string;
  emergency_contacts: string[];
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

const MAX_CONTACTS = 3;

export default function ProfileScreen({ navigation }: any) {
  const [form, setForm] = useState<FormType>({
    name: '',
    surname: '',
    birth_year: '',
    blood_type: '',
    health_notes: '',
    emergency_contacts: [],
  });

  const [alarm, setAlarm] = useState<boolean>(true);
  const [gLimitKm, setGLimitKm] = useState<string>('25');
  const [newContact, setNewContact] = useState('');
  const [inputKey, setInputKey] = useState(0);

  const handleChange = (key: keyof FormType, value: any) => {
    setForm({ ...form, [key]: value });
  };

  const handleAddContact = () => {
    if (!newContact.trim()) return;
    if (form.emergency_contacts.includes(newContact)) return;
    if (form.emergency_contacts.length >= MAX_CONTACTS) {
      Alert.alert('Uyarı', `En fazla ${MAX_CONTACTS} numara ekleyebilirsin.`);
      return;
    }
    handleChange('emergency_contacts', [
      ...form.emergency_contacts,
      newContact.trim(),
    ]);
    setNewContact('');
    setInputKey(prev => prev + 1);
  };

  const handleSave = async () => {
    try {
      if (form.emergency_contacts.length === 0) {
        Alert.alert('Acil durum numarası boş olamaz');
        return;
      }

      if (form.emergency_contacts.length > MAX_CONTACTS) {
        Alert.alert(
          'Uyarı',
          `En fazla ${MAX_CONTACTS} numara kaydedebilirsin.`,
        );
      }

      const contactsAsString = form.emergency_contacts
        .filter(Boolean)
        .join(',');

      await saveProfile({
        ...form,
        emergency_contacts: contactsAsString,
      });

      // GÜNCELLENMİŞ gLimit hesaplaması
      const speed = parseFloat(gLimitKm);
      const timeToStop = 0.3; // saniye
      const speedMs = speed / 3.6;
      const acceleration = speedMs / timeToStop;
      const gLimit = acceleration / 9.81;

      const preferences = {
        alarm,
        sms: true,
        gLimit,
      };

      await AsyncStorage.setItem('@preferences', JSON.stringify(preferences));
      await CrashServiceStarter.configureCrashService({
        ...preferences,
        location: true,
      });
      CrashServiceStarter.startService();

      Alert.alert('Kaydedildi', 'Bilgiler ve tercihler başarıyla kaydedildi.');
      navigation.navigate('Home');
    } catch (error) {
      console.error('Kayıt hatası:', error);
      Alert.alert('Hata', 'Kayıt sırasında bir hata oluştu.');
    }
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
              ? profile.emergency_contacts
                  .split(',')
                  .map((num: string) => num.trim())
              : [],
          });
        }

        const savedPrefs = await AsyncStorage.getItem('@preferences');
        if (savedPrefs) {
          const prefs = JSON.parse(savedPrefs);
          setAlarm(!!prefs.alarm);
          if (prefs.gLimit) {
            const timeToStop = 0.3;
            const speedKm = (prefs.gLimit * 9.81 * timeToStop * 3.6).toFixed(0);
            setGLimitKm(speedKm);
          }
        }
      } catch (error) {
        console.error('Profil yüklenirken hata:', error);
      }
    };

    loadProfile();
  }, []);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={60}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Acil Bilgi Formu</Text>

        {/* Text Inputs */}
        {[
          { key: 'name', label: 'Ad' },
          { key: 'surname', label: 'Soyad' },
          { key: 'birth_year', label: 'Doğum Yılı' },
          { key: 'health_notes', label: 'Sağlık Notları' },
        ].map(({ key, label }) => (
          <TextInput
            key={key}
            style={styles.input}
            placeholder={label}
            placeholderTextColor="#777"
            value={form[key as keyof FormType] as string}
            onChangeText={text => handleChange(key as keyof FormType, text)}
            keyboardType={key === 'birth_year' ? 'numeric' : 'default'}
          />
        ))}

        {/* Blood Type Picker */}
        <Text style={styles.label}>Kan Grubu</Text>
        <View style={styles.pickerWrapper}>
          <Picker
            selectedValue={form.blood_type}
            onValueChange={value => handleChange('blood_type', value)}
            dropdownIconColor="#fff"
            style={styles.picker}
          >
            <Picker.Item label="Seçiniz..." value="" />
            {bloodTypeOptions.map(bt => (
              <Picker.Item key={bt} label={bt} value={bt} />
            ))}
          </Picker>
        </View>

        {/* Emergency Contacts */}
        <Text style={styles.label}>Yeni Acil Durum Numarası</Text>
        <PhoneInput
          key={inputKey}
          defaultCode="TR"
          layout="second"
          placeholder="Telefon Numarası"
          value={newContact}
          onChangeFormattedText={text => setNewContact(text)}
          containerStyle={styles.phoneContainer}
          textContainerStyle={styles.phoneTextContainer}
          textInputStyle={styles.phoneTextInput}
          codeTextStyle={styles.codeTextStyle}
          flagButtonStyle={styles.flagButton}
          textInputProps={{ placeholderTextColor: '#bbb' }}
        />
        <TouchableOpacity style={styles.addButton} onPress={handleAddContact}>
          <Text style={styles.addButtonText}>+ Ekle</Text>
        </TouchableOpacity>

        {form.emergency_contacts.length > 0 && (
          <>
            <Text style={styles.label}>Kayıtlı Numara Listesi</Text>
            {form.emergency_contacts.map((contact, index) => (
              <View key={index} style={styles.contactItem}>
                <Text style={styles.savedContact}>{contact}</Text>
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => {
                    const updated = [...form.emergency_contacts];
                    updated.splice(index, 1);
                    handleChange('emergency_contacts', updated);
                  }}
                >
                  <Text style={styles.removeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
          </>
        )}

        {/* Preferences */}
        <Text style={styles.label}>Alarm Aktif</Text>
        <Switch value={alarm} onValueChange={setAlarm} />

        <Text style={styles.label}>Uyarı Hızı (km/h)</Text>
        <TextInput
          style={styles.input}
          placeholder="Örn: 25"
          placeholderTextColor="#777"
          keyboardType="numeric"
          value={gLimitKm}
          onChangeText={setGLimitKm}
        />

        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Kaydet</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#121212', padding: 20 },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 24,
    textAlign: 'center',
  },
  label: {
    color: '#bbb',
    fontWeight: '600',
    fontSize: 14,
    marginTop: 16,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#1e1e1e',
    color: '#fff',
    borderWidth: 1,
    borderColor: '#333',
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
  },
  pickerWrapper: {
    backgroundColor: '#1e1e1e',
    borderColor: '#333',
    borderWidth: 1,
    borderRadius: 10,
    marginBottom: 12,
  },
  picker: { color: '#fff' },
  phoneContainer: {
    backgroundColor: '#1e1e1e',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#333',
    height: 50,
    paddingRight: 0,
    width: '100%',
  },
  phoneTextContainer: {
    backgroundColor: '#1e1e1e',
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
    paddingVertical: 0,
  },
  phoneTextInput: { color: '#fff', fontSize: 16, paddingVertical: 0 },
  codeTextStyle: { color: '#fff', fontWeight: 'bold' },
  flagButton: {
    backgroundColor: '#1e1e1e',
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
  },
  addButton: {
    backgroundColor: '#444',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  addButtonText: { color: '#fff', fontWeight: '600' },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  savedContact: { color: '#fff', fontSize: 16, flex: 1 },
  removeButton: {
    backgroundColor: '#d9534f',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
  },
  removeButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  saveButton: {
    backgroundColor: '#1e88e5',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginVertical: 12,
  },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
