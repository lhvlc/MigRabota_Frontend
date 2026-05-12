import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  Alert, ActivityIndicator, StyleSheet
} from 'react-native';
import auth from '@react-native-firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const API_URL = 'https://asap-horeca-backend-k6q2.onrender.com';

export default function PhoneAuthScreen({ navigation }) {
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState('phone');
  const [loading, setLoading] = useState(false);
  const confirmation = useRef(null);

  const sendSMS = async () => {
    if (phone.length < 10) {
      Alert.alert('Ошибка', 'Введите корректный номер');
      return;
    }

    // Веб — входим без SMS
    if (Platform.OS === 'web') {
      setLoading(true);
      try {
        const formatted = phone.startsWith('+') ? phone : `+7${phone}`;
        const response = await fetch(`${API_URL}/users/phone-sync`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone: formatted,
            role: 'B2C',
            webLogin: true,
          }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        await AsyncStorage.setItem('authToken', data.token);
        await AsyncStorage.setItem('user', JSON.stringify(data.user));
        navigation.replace('RoleSelection');
      } catch (e) {
        Alert.alert('Ошибка', e.message);
      } finally {
        setLoading(false);
      }
      return;
    }

    // Мобильный — Firebase SMS
    setLoading(true);
    try {
      const formatted = phone.startsWith('+') ? phone : `+7${phone}`;
      confirmation.current = await auth().signInWithPhoneNumber(formatted);
      setStep('code');
    } catch (e) {
      Alert.alert('Ошибка', 'Не удалось отправить SMS: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async () => {
    if (code.length !== 6) {
      Alert.alert('Ошибка', 'Введите 6-значный код');
      return;
    }
    setLoading(true);
    try {
      const result = await confirmation.current.confirm(code);
      const firebaseToken = await result.user.getIdToken();

      const response = await fetch(`${API_URL}/users/phone-sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firebaseToken,
          phoneNumber: result.user.phoneNumber,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      await AsyncStorage.setItem('authToken', data.token);
      await AsyncStorage.setItem('user', JSON.stringify(data.user));

      navigation.replace('RoleSelectionScreen.js');
    } catch (e) {
      Alert.alert('Ошибка', 'Неверный код или проблема с сервером');
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {step === 'phone' ? (
        <>
          <Text style={styles.title}>Войти в МигРабота</Text>
          <Text style={styles.subtitle}>Введите номер — пришлём SMS с кодом</Text>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            placeholder="+7 999 000 0000"
            keyboardType="phone-pad"
            maxLength={12}
            placeholderTextColor="#666"
          />
          <TouchableOpacity style={styles.button} onPress={sendSMS} disabled={loading}>
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.buttonText}>Получить код</Text>
            }
          </TouchableOpacity>
        </>
      ) : (
        <>
          <Text style={styles.title}>Введите код</Text>
          <Text style={styles.subtitle}>Код отправлен на {phone}</Text>
          <TextInput
            style={[styles.input, styles.codeInput]}
            value={code}
            onChangeText={setCode}
            placeholder="000000"
            keyboardType="number-pad"
            maxLength={6}
            placeholderTextColor="#666"
          />
          <TouchableOpacity style={styles.button} onPress={verifyCode} disabled={loading}>
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.buttonText}>Войти</Text>
            }
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setStep('phone')}>
            <Text style={styles.back}>← Изменить номер</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center', backgroundColor: '#0D1B2A' },
  title: { fontSize: 26, fontWeight: 'bold', marginBottom: 8, color: '#fff' },
  subtitle: { color: '#aaa', marginBottom: 32, fontSize: 15 },
  input: {
    borderWidth: 1, borderColor:'#333', borderRadius: 12,
    padding: 16, fontSize: 16, marginBottom: 16,
    color: '#fff', backgroundColor: '#1a2a3a'
  },
  codeInput: { letterSpacing: 10, textAlign: 'center', fontSize: 24 },
  button: {
    backgroundColor: '#2563EB', borderRadius: 12,
    padding: 16, alignItems: 'center', marginBottom: 16
  },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  back: { color: '#aaa', textAlign: 'center', marginTop: 8 },
});