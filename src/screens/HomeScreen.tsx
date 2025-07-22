import React, { useEffect, useState } from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { getProfile } from '../utils/database';

export default function HomeScreen({ navigation }: any) {
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getProfile();
        if (data) setProfile(data);
      } catch (error) {
        console.error('Profil getirilemedi:', error);
      }
    };

    fetchData();
  }, []);

  if (!profile) {
    return (
      <View style={styles.container}>
        <Text>Yükleniyor...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Kayıtlı Bilgiler</Text>
      {Object.entries(profile).map(([key, value]) => (
        <Text key={key} style={styles.item}>
          {key.replace('_', ' ')}: {String(value)}
        </Text>
      ))}
      <Button title="Düzenle" onPress={() => navigation.navigate('Profile')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20 },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
  item: { fontSize: 16, marginBottom: 8 },
});
