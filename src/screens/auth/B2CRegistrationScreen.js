import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, ActivityIndicator, KeyboardAvoidingView,
  Platform, ScrollView,
} from 'react-native';
import { syncUser, saveUser } from '../../services/api';

export default function B2CRegistrationScreen({ navigation }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const showError = (msg) => {
    setError(msg);
    setTimeout(() => setError(''), 4000);
  };

  const handleRegister = async () => {
    setError('');

    if (!name.trim()) {
      showError('Укажи своё имя');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      showError('Укажи корректный email (например: test@mail.ru)');
      return;
    }

    setLoading(true);
    try {
      const uid = 'b2c_' + email.replace(/[^a-z0-9]/gi, '') + '_' + Date.now();
      console.log('[B2C] Регистрация:', { uid, email: email.trim(), name: name.trim() });

      const user = await syncUser(uid, email.trim().toLowerCase(), 'B2C', name.trim());
      console.log('[B2C] Ответ сервера:', user);

      if (user?.id || user?.email) {
        const fullUser = { ...user, uid };
        await saveUser(fullUser);
        console.log('[B2C] Пользователь сохранён, переходим на OrdersFeed');
        navigation.replace('OrdersFeed', { user: fullUser });
      } else if (user?.error) {
        showError('Ошибка сервера: ' + user.error);
      } else {
        showError('Не удалось создать аккаунт. Попробуй другой email.');
      }
    } catch (e) {
      console.error('[B2C] Ошибка:', e);
      showError('Нет соединения с сервером. Проверь интернет.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={S.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={S.container}>

          <TouchableOpacity onPress={() => navigation.goBack()} style={S.back}>
            <Text style={S.backTxt}>← Назад</Text>
          </TouchableOpacity>

          <View style={S.badge}>
            <Text style={S.badgeTxt}>👤 СОИСКАТЕЛЬ</Text>
          </View>
          <Text style={S.title}>Создай профиль</Text>
          <Text style={S.sub}>Получай уведомления о горящих сменах</Text>

          {error ? (
            <View style={S.errorBox}>
              <Text style={S.errorTxt}>⚠️ {error}</Text>
            </View>
          ) : null}

          <Text style={S.lbl}>Твоё имя</Text>
          <TextInput
            style={[S.inp, !name.trim() && error ? S.inpError : null]}
            placeholder="Например: Айгерим"
            placeholderTextColor="#778DA9"
            value={name}
            onChangeText={setName}
          />

          <Text style={S.lbl}>Email</Text>
          <TextInput
            style={[S.inp, !email.trim() && error ? S.inpError : null]}
            placeholder="your@email.com"
            placeholderTextColor="#778DA9"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            value={email}
            onChangeText={setEmail}
          />

          <View style={S.infoBox}>
            <Text style={S.infoTxt}>⚡ После регистрации сразу видишь горящие смены</Text>
            <Text style={S.infoTxt}>🔔 Push-уведомления о новых сменах</Text>
            <Text style={S.infoTxt}>📊 AI-рейтинг надёжности</Text>
          </View>

          <TouchableOpacity
            style={[S.btn, loading && S.btnDisabled]}
            onPress={handleRegister}
            disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#0D1B2A" />
            ) : (
              <Text style={S.btnTxt}>Начать поиск работы ⚡</Text>
            )}
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0D1B2A' },
  container: { padding: 24, paddingTop: 16, paddingBottom: 60 },
  back: { marginBottom: 24 },
  backTxt: { color: '#778DA9', fontSize: 14 },
  badge: {
    backgroundColor: '#C9B47F22', borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 6,
    alignSelf: 'flex-start', marginBottom: 14,
    borderWidth: 1, borderColor: '#C9B47F33',
  },
  badgeTxt: { color: '#C9B47F', fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  title: { fontSize: 28, fontWeight: '800', color: '#E0E1DD', marginBottom: 8 },
  sub: { fontSize: 14, color: '#778DA9', marginBottom: 24, lineHeight: 20 },
  errorBox: {
    backgroundColor: '#E2444422', borderRadius: 10,
    padding: 12, marginBottom: 16,
    borderWidth: 1, borderColor: '#E2444455',
  },
  errorTxt: { color: '#E24444', fontSize: 13, lineHeight: 18 },
  lbl: { fontSize: 12, color: '#778DA9', marginBottom: 8, marginTop: 16, letterSpacing: 0.5 },
  inp: {
    backgroundColor: '#1B263B', color: '#E0E1DD',
    padding: 16, borderRadius: 12, fontSize: 15,
    borderWidth: 1, borderColor: '#263550',
  },
  inpError: { borderColor: '#E24444' },
  infoBox: {
    backgroundColor: '#1B263B', borderRadius: 14,
    padding: 16, marginTop: 24, gap: 10,
  },
  infoTxt: { color: '#778DA9', fontSize: 13, lineHeight: 20 },
  btn: {
    backgroundColor: '#C9B47F', padding: 20,
    borderRadius: 16, alignItems: 'center', marginTop: 28,
  },
  btnDisabled: { opacity: 0.6 },
  btnTxt: { color: '#0D1B2A', fontWeight: '800', fontSize: 16 },
});