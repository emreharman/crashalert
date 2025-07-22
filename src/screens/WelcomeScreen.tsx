import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

type Props = NativeStackScreenProps<any, 'Welcome'>;

export default function WelcomeScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Hoş Geldin 👋</Text>
      <Text style={styles.text}>Uygulamayı kullanmaya başlamak için acil bilgilerini girmen gerekiyor.</Text>
      <Button title="Bilgileri Gir" onPress={() => navigation.navigate('Profile')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 12 },
  text: { fontSize: 16, marginBottom: 24 },
});
