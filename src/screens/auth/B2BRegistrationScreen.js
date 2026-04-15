import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, ActivityIndicator, KeyboardAvoidingView,
  Platform, ScrollView,
} from 'react-native';
import { syncUser, saveUser } from '../../services/api';

export default function B2BRegistrationScreen({ navigation }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const showError = (msg) => {
    setError(msg);
    setTimeout(() => setError(''), 4000);
  };

  const handleRegister = async () => {
    setError('');
    if (!name.trim()) { showError('Укажи название заведения'); return; }
    if (!email.trim() || !email.includes('@')) {
      showError('Укажи корректный email'); return;
    }
    setLoading(true);
    try {
      const uid = 'b2b_' + email.replace(/[^a-z0-9]/gi, '') + '_' + Date.now();
      const user = await syncUser(uid, email.trim().toLowerCase(), 'B2B', name.trim());

      if (user?.id || user?.email) {
        // Используем user.id из базы как основной идентификатор!
        const fullUser = {
          ...user,
          uid: user.id, // uid = реальный id из базы
          address: address.trim(),
        };
        await saveUser(fullUser);
        // Переходим на профиль работодателя
        navigation.replace('EmployerProfile', { user: fullUser });
      } else if (user?.error) {
        showError('Ошибка: ' + user.error);
      } else {
        showError('Не удалось создать аккаунт');
      }
    } catch (e) {
      showError('Нет соединения с сервером');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={S.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{flex:1}}>
        <ScrollView contentContainerStyle={S.container}>

          <TouchableOpacity onPress={() => navigation.goBack()} style={S.back}>
            <Text style={S.backTxt}>← Назад</Text>
          </TouchableOpacity>

          <View style={S.badge}>
            <Text style={S.badgeTxt}>🏢 РАБОТОДАТЕЛЬ</Text>
          </View>
          <Text style={S.title}>Профиль заведения</Text>
          <Text style={S.sub}>Находи персонал за считанные минуты</Text>

          {error ? (
            <View style={S.errorBox}>
              <Text style={S.errorTxt}>⚠️ {error}</Text>
            </View>
          ) : null}

          <Text style={S.lbl}>Название заведения</Text>
          <TextInput style={S.inp}
            placeholder="Кофейня 'Утро'"
            placeholderTextColor="#778DA9"
            value={name} onChangeText={setName}/>

          <Text style={S.lbl}>Email</Text>
          <TextInput style={S.inp}
            placeholder="cafe@email.com"
            placeholderTextColor="#778DA9"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            value={email} onChangeText={setEmail}/>

          <Text style={S.lbl}>Адрес заведения</Text>
          <TextInput style={S.inp}
            placeholder="ул. Ленина, 12"
            placeholderTextColor="#778DA9"
            value={address} onChangeText={setAddress}/>

          <View style={S.infoBox}>
            <Text style={S.infoTxt}>⚡ Создай смену за 30 секунд</Text>
            <Text style={S.infoTxt}>🔔 Уведомления всем свободным</Text>
            <Text style={S.infoTxt}>📊 AI-рейтинг кандидатов</Text>
          </View>

          <TouchableOpacity
            style={[S.btn, loading && S.btnDisabled]}
            onPress={handleRegister}
            disabled={loading}>
            {loading
              ? <ActivityIndicator color="#fff"/>
              : <Text style={S.btnTxt}>Начать поиск персонала →</Text>}
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  safe: { flex:1, backgroundColor:'#0D1B2A' },
  container: { padding:24, paddingTop:16, paddingBottom:60 },
  back: { marginBottom:24 },
  backTxt: { color:'#778DA9', fontSize:14 },
  badge: { backgroundColor:'#378ADD22', borderRadius:8,
    paddingHorizontal:12, paddingVertical:6, alignSelf:'flex-start',
    marginBottom:14, borderWidth:1, borderColor:'#378ADD33' },
  badgeTxt: { color:'#378ADD', fontSize:11, fontWeight:'700', letterSpacing:1 },
  title: { fontSize:28, fontWeight:'800', color:'#E0E1DD', marginBottom:8 },
  sub: { fontSize:14, color:'#778DA9', marginBottom:24, lineHeight:20 },
  errorBox: { backgroundColor:'#E2444422', borderRadius:10,
    padding:12, marginBottom:16, borderWidth:1, borderColor:'#E2444455' },
  errorTxt: { color:'#E24444', fontSize:13 },
  lbl: { fontSize:12, color:'#778DA9', marginBottom:8, marginTop:16, letterSpacing:0.5 },
  inp: { backgroundColor:'#1B263B', color:'#E0E1DD',
    padding:16, borderRadius:12, fontSize:15,
    borderWidth:1, borderColor:'#263550' },
  infoBox: { backgroundColor:'#1B263B', borderRadius:14,
    padding:16, marginTop:24, gap:10 },
  infoTxt: { color:'#778DA9', fontSize:13, lineHeight:20 },
  btn: { backgroundColor:'#378ADD', padding:20,
    borderRadius:16, alignItems:'center', marginTop:28 },
  btnDisabled: { opacity:0.6 },
  btnTxt: { color:'#fff', fontWeight:'800', fontSize:16 },
});