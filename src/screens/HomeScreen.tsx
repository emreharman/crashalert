import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  NativeModules,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getProfile } from '../utils/database';
import { capitalize } from '../utils/functions';

const { CrashServiceStarter } = NativeModules;

export default function HomeScreen({ navigation }: any) {
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    const initService = async () => {
      try {
        const prefRaw = await AsyncStorage.getItem('@preferences');
        const prefs = prefRaw ? JSON.parse(prefRaw) : null;

        if (prefs && Platform.OS === 'android') {
          await CrashServiceStarter.configureCrashService({
            alarm: prefs.alarm ?? true,
            sms: prefs.sms ?? true,
            location: true,
            gLimit: prefs.gLimit ?? 4.5,
          });
          CrashServiceStarter.startService();
          console.log('✅ Servis konfigüre edildi ve başlatıldı.');
        }
      } catch (err) {
        console.warn('⚠️ Servis başlatılamadı:', err);
      }
    };

    const fetchData = async () => {
      try {
        const data = await getProfile();
        console.log(data);
        
        if (data) setProfile(data);
      } catch (error) {
        console.error('Profil getirilemedi:', error);
      }
    };

    fetchData();
    initService();
  }, []);

  if (!profile) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Yükleniyor...</Text>
      </View>
    );
  }

  const fields = [
    { key: 'name', label: 'Ad' },
    { key: 'surname', label: 'Soyad' },
    { key: 'birth_year', label: 'Doğum Yılı' },
    { key: 'blood_type', label: 'Kan Grubu' },
    { key: 'health_notes', label: 'Sağlık Notları' },
    { key: 'emergency_contacts', label: 'Acil Durum Kişileri' },
  ];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Kayıtlı Bilgiler</Text>

      {fields.map(({ key, label }) => {
        const value = profile[key];
        if (!value) return null;

        return (
          <View key={key} style={styles.card}>
            <Text style={styles.cardLabel}>{label}</Text>
            {key === 'emergency_contacts' ? (
              value.split(',').map((num: string, idx: number) => (
                <Text key={idx} style={styles.cardValue}>
                  • {num}
                </Text>
              ))
            ) : (
              <Text style={styles.cardValue}>
                {typeof value === 'string' ? capitalize(value) : String(value)}
              </Text>
            )}
          </View>
        );
      })}

      <TouchableOpacity
        style={styles.editButton}
        onPress={() => navigation.navigate('Profile')}
      >
        <Text style={styles.editButtonText}>Düzenle</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#121212',
    padding: 20,
  },
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 24,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  cardLabel: {
    color: '#bbb',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  cardValue: {
    color: '#fff',
    fontSize: 16,
    lineHeight: 22,
  },
  editButton: {
    backgroundColor: '#1e88e5',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
