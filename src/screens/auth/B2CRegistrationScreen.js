import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, SafeAreaView, ActivityIndicator } from 'react-native';
import { syncUser } from '../../services/api';

export default function B2CRegistrationScreen({ navigation }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name.trim() || !email.trim()) {
      Alert.alert('Ошибка', 'Заполни имя и email');
      return;
    }
    setLoading(true);
    try {
      const uid = 'b2c_' + email.replace(/[^a-z0-9]/gi, '') + Date.now();
      const user = await syncUser(uid, email.trim(), 'B2C', name.trim());
      if (user?.id || user?.uid) {
        navigation.replace('OrdersFeed', { user: { ...user, uid } });
      } else {
        Alert.alert('Ошибка', 'Не удалось создать аккаунт. Проверь интернет.');
      }
    } catch (e) {
      Alert.alert('Ошибка соединения', 'Сервер недоступен');
    } finally { setLoading(false); }
  };

  return (
    <SafeAreaView style={S.safe}>
      <View style={S.container}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={S.back}>
          <Text style={S.backTxt}>← Назад</Text>
        </TouchableOpacity>
        <Text style={S.title}>Я ищу работу</Text>
        <Text style={S.sub}>Создай профиль соискателя</Text>
        <Text style={S.label}>Твоё имя</Text>
        <TextInput style={S.input} placeholder="Например: Айгерим"
          placeholderTextColor="#778DA9" value={name} onChangeText={setName} />
        <Text style={S.label}>Email</Text>
        <TextInput style={S.input} placeholder="your@email.com"
          placeholderTextColor="#778DA9" keyboardType="email-address"
          autoCapitalize="none" value={email} onChangeText={setEmail} />
        <TouchableOpacity style={S.btn} onPress={handleRegister} disabled={loading}>
          {loading
            ? <ActivityIndicator color="#0D1B2A" />
            : <Text style={S.btnTxt}>Начать поиск работы</Text>}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0D1B2A' },
  container: { flex: 1, padding: 24, justifyContent: 'center' },
  back: { position: 'absolute', top: 20, left: 24 },
  backTxt: { color: '#778DA9', fontSize: 14 },
  title: { fontSize: 28, fontWeight: '700', color: '#E0E1DD', marginBottom: 6 },
  sub: { fontSize: 14, color: '#778DA9', marginBottom: 32 },
  label: { fontSize: 13, color: '#778DA9', marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: '#1B263B', color: '#E0E1DD', padding: 16,
    borderRadius: 12, fontSize: 15 },
  btn: { backgroundColor: '#C9B47F', padding: 18, borderRadius: 14,
    alignItems: 'center', marginTop: 32 },
  btnTxt: { color: '#0D1B2A', fontWeight: '700', fontSize: 16 },
});