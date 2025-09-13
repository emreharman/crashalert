import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
} from 'react-native';
import PhoneInput from 'react-native-phone-number-input';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Props {
  onNext: () => void;
  initialContacts?: string[];
}

export default function Step3Contacts({ onNext, initialContacts = [] }: Props) {
  const [contacts, setContacts] = useState<string[]>(initialContacts);
  const [newContact, setNewContact] = useState('');
  const [inputKey, setInputKey] = useState(0);

  const handleAdd = () => {
    if (!newContact.trim()) return;

    if (contacts.includes(newContact)) {
      Alert.alert('Hata', 'Bu numara zaten eklenmiş.');
      return;
    }

    if (contacts.length >= 3) {
      Alert.alert('Uyarı', 'En fazla 3 numara ekleyebilirsin.');
      return;
    }

    setContacts(prev => [...prev, newContact.trim()]);
    setNewContact('');
    setInputKey(prev => prev + 1);
  };

  const handleRemove = (index: number) => {
    const updated = [...contacts];
    updated.splice(index, 1);
    setContacts(updated);
  };

  const handleNextPress = async () => {
    if (contacts.length === 0) {
      Alert.alert('Uyarı', 'En az bir numara eklemelisin.');
      return;
    }

    try {
      await AsyncStorage.setItem(
        '@emergency_contacts',
        JSON.stringify(contacts),
      );
      onNext();
    } catch (error) {
      console.error('AsyncStorage hatası:', error);
      Alert.alert('Hata', 'Numaralar kaydedilemedi.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Acil Durum Kişileri</Text>

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
        textInputProps={{
          cursorColor: '#1e88e5',
        }}
        renderDropdownImage={
          <Text style={{ color: '#fff', fontSize: 12 }}>▼</Text>
        }
      />

      <TouchableOpacity
        style={[
          styles.addButton,
          contacts.length >= 3 && { backgroundColor: '#666' },
        ]}
        onPress={handleAdd}
      >
        <Text style={styles.addButtonText}>+ Ekle</Text>
      </TouchableOpacity>

      <FlatList
        data={contacts}
        keyExtractor={(item, index) => `${item}-${index}`}
        renderItem={({ item, index }) => (
          <View style={styles.contactItem}>
            <Text style={styles.contactText}>{item}</Text>
            <TouchableOpacity onPress={() => handleRemove(index)}>
              <Text style={styles.removeText}>✕</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Henüz numara eklenmedi.</Text>
        }
      />

      <TouchableOpacity style={styles.nextButton} onPress={handleNextPress}>
        <Text style={styles.nextButtonText}>Devam Et</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#121212' },
  title: {
    fontSize: 22,
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  phoneContainer: {
    backgroundColor: '#1e1e1e',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#333',
    height: 50,
    width: '100%',
    color: '#fff',
  },
  phoneTextContainer: {
    backgroundColor: '#1e1e1e',
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
    color: '#fff',
  },
  phoneTextInput: {
    color: '#fff',
    fontSize: 16,
    paddingVertical: 0,
    paddingHorizontal: 0,
    margin: 0,
  },
  codeTextStyle: { color: '#fff', fontWeight: 'bold' },
  flagButtonStyle: { backgroundColor: '#1e1e1e', color: '#fff' },
  addButton: {
    backgroundColor: '#444',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 16,
  },
  addButtonText: { color: '#fff', fontWeight: '600' },
  contactItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#222',
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
  },
  contactText: { color: '#fff', fontSize: 16 },
  removeText: {
    color: '#d9534f',
    fontWeight: 'bold',
    fontSize: 18,
  },
  emptyText: {
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 20,
  },
  nextButton: {
    backgroundColor: '#1e88e5',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  flagButton: {
    backgroundColor: '#1e1e1e',
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
  },
});
