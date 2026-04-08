import React, { useState } from 'react';
import { View, TextInput, Button, Alert } from 'react-native';
import api from '../../services/api';

export default function RegisterScreen({ navigation }) {
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('B2B');

  const handleRegister = async () => {
    try {
      const response = await api.post('/auth/register', {
        phone,
        role
      });
      
      // Переход на экран ввода кода SMS
      navigation.navigate('VerifyCode', { phone, role });
    } catch (error) {
      Alert.alert('Ошибка', error.response?.data?.message || 'Не удалось зарегистрироваться');
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <TextInput
        placeholder="+7 (999) 999-99-99"
        keyboardType="phone-pad"
        value={phone}
        onChangeText={setPhone}
        style={{ borderWidth: 1, padding: 10, marginBottom: 10 }}
      />
      
      <Button title="Получить код" onPress={handleRegister} />
    </View>
  );
}