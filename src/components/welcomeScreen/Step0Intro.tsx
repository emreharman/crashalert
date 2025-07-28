// Step0Intro.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export default function Step0Intro({ onNext }: { onNext: () => void }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Hoş Geldin 👋</Text>
      <Text style={styles.subtitle}>
        Bu uygulama kaza algıladığında otomatik olarak konumunu ve sağlık bilgilerini sevdiklerinle paylaşır.
      </Text>
      <TouchableOpacity onPress={onNext} style={styles.button}>
        <Text style={styles.buttonText}>Devam Et</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#bbb',
    marginBottom: 32,
    textAlign: 'center',
    lineHeight: 22,
  },
  button: {
    backgroundColor: '#1e88e5',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
