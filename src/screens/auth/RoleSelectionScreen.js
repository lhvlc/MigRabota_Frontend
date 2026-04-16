import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, Modal, TextInput, ActivityIndicator } from 'react-native';
import { getStoredUser, syncUser, saveUser } from '../../services/api';
import { Image } from 'react-native';

export default function RoleSelectionScreen({ navigation }) {
  const [modal, setModal] = useState(null);
  const [mode, setMode] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getStoredUser().then(user => {
      if (!user) return;
      if (user.role === 'B2C') navigation.replace('WorkerProfile', { user });
      else navigation.replace('EmployerProfile', { user });
    });
  }, []);

  const openModal = (role) => {
    setModal(role); setMode('login');
    setName(''); setEmail(''); setError('');
  };

  const handleSubmit = async () => {
    if (!email.trim() || !email.includes('@')) {
      setError('Укажи корректный email'); return;
    }
    if (mode === 'register' && !name.trim()) {
      setError('Укажи имя'); return;
    }
    setLoading(true); setError('');
    try {
      const prefix = modal === 'b2c' ? 'b2c_' : 'b2b_';
      const role = modal === 'b2c' ? 'B2C' : 'B2B';
      const uid = prefix + email.replace(/[^a-z0-9]/gi, '');
      const isLogin = mode === 'login';

      const user = await syncUser(
        uid,
        email.trim().toLowerCase(),
        role,
        isLogin ? '' : name.trim(),
        isLogin // передаём флаг входа
      );

      if (user?.error) {
        setError(user.error); return;
      }

      if (user?.id) {
        const fullUser = { ...user, uid: user.id };
        await saveUser(fullUser);
        setModal(null);
        if (role === 'B2C') navigation.replace('WorkerProfile', { user: fullUser });
        else navigation.replace('EmployerProfile', { user: fullUser });
      } else {
        setError('Ошибка. Попробуй снова.');
      }
    } catch { setError('Нет соединения'); }
    finally { setLoading(false); }
  };

  const isB2C = modal === 'b2c';

  return (
    <SafeAreaView style={S.safe}>
      <View style={S.container}>
        <View style={S.logoWrap}>
          <Image
            source={require('../../../assets/logo.png')}
            style={S.logoImage}
            resizeMode="contain"
          />
          <Text style={S.logoMain}>
            <Text style={S.logoRed}>М</Text>
            <Text>иг</Text>
            <Text style={S.logoRed}>Р</Text>
            <Text>абота</Text>
          </Text>
            <View style={S.divider}/>
          <Text style={S.tagline}>Работа здесь и сейчас</Text>
        </View>

        <Text style={S.question}>Выбери свою роль</Text>

        <TouchableOpacity style={S.cardWorker}
          onPress={() => openModal('b2c')} activeOpacity={0.85}>
          <View style={S.cardIconWrap}>
            <Text style={S.cardIconTxt}>👤</Text>
          </View>
          <Text style={S.cardTitle}>Я ищу работу</Text>
          <Text style={S.cardArrow}>→</Text>
        </TouchableOpacity>

        <TouchableOpacity style={S.cardClient}
          onPress={() => openModal('b2b')} activeOpacity={0.85}>
          <View style={S.cardIconWrap}>
            <Text style={S.cardIconTxt}>🏢</Text>
          </View>
          <Text style={S.cardTitle}>Найти персонал</Text>
          <Text style={S.cardArrow}>→</Text>
        </TouchableOpacity>

        <Text style={S.footer}>
          Нажимая, ты соглашаешься с условиями{'\n'}
          <Text style={S.footerLink}>ОБРАБОТКИ ПЕРСОНАЛЬНЫХ ДАННЫХ</Text>
        </Text>
      </View>

      <Modal visible={modal !== null} transparent animationType="slide">
        <View style={S.overlay}>
          <View style={S.modal}>
            <Text style={S.modalTitle}>
              {isB2C ? '👤 Соискатель' : '🏢 Работодатель'}
            </Text>

            <View style={S.modeRow}>
              <TouchableOpacity
                style={[S.modeBtn, mode === 'login' && S.modeBtnOn]}
                onPress={() => { setMode('login'); setError(''); }}>
                <Text style={[S.modeTxt, mode === 'login' && S.modeTxtOn]}>Войти</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[S.modeBtn, mode === 'register' && S.modeBtnOn]}
                onPress={() => { setMode('register'); setError(''); }}>
                <Text style={[S.modeTxt, mode === 'register' && S.modeTxtOn]}>
                  Регистрация
                </Text>
              </TouchableOpacity>
            </View>

            {error ? (
              <View style={S.errBox}>
                <Text style={S.errTxt}>⚠️ {error}</Text>
              </View>
            ) : null}

            {mode === 'register' && (
              <TextInput style={S.inp}
                placeholder={isB2C ? 'Твоё имя' : 'Название заведения'}
                placeholderTextColor='#778DA9'
                value={name} onChangeText={setName}/>
            )}

            <TextInput style={S.inp}
              placeholder='email@example.com'
              placeholderTextColor='#778DA9'
              keyboardType='email-address'
              autoCapitalize='none'
              value={email} onChangeText={setEmail}/>

            <TouchableOpacity
              style={[S.submitBtn, isB2C ? S.submitB2C : S.submitB2B]}
              onPress={handleSubmit} disabled={loading}>
              {loading
                ? <ActivityIndicator color='#0D1B2A'/>
                : <Text style={S.submitTxt}>
                    {mode === 'login' ? 'Войти' : 'Зарегистрироваться'}
                  </Text>}
            </TouchableOpacity>

            <TouchableOpacity style={S.cancelBtn}
              onPress={() => { setModal(null); setError(''); }}>
              <Text style={S.cancelTxt}>Отмена</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  safe: { flex:1, backgroundColor:'#0D1B2A' },
  container: { flex:1, padding:24, justifyContent:'center' },
  logoWrap: { alignItems:'center', marginBottom:40 },
  logoImage: { width: 120, height: 120, marginBottom: 12 },
  logoMain: { fontSize: 36,
    fontWeight: '500',      // тонкий шрифт
    fontStyle: 'italic',    // курсив
    color: '#dddde1',
    letterSpacing: 1,
    marginBottom: 4,
  },
  logoRed: {
    color: '#e72121',       // красный
    fontWeight: '500',      // буквы М и Р чуть жирнее
    fontStyle: 'italic',
  },
  divider: { width:40, height:1.5, backgroundColor:'#C9B47F44', marginVertical:12 },
  tagline: { fontSize:13, color:'#778DA9', letterSpacing:1 },
  question: { fontSize:18, fontWeight:'600', color:'#E0E1DD',
    marginBottom:18, textAlign:'center' },
  cardWorker: { backgroundColor:'#1B263B', borderRadius:18, padding:20,
    flexDirection:'row', alignItems:'center', marginBottom:12,
    borderWidth:1.5, borderColor:'#C9B47F44' },
  cardClient: { backgroundColor:'#1B263B', borderRadius:18, padding:20,
    flexDirection:'row', alignItems:'center', marginBottom:12,
    borderWidth:1.5, borderColor:'#378ADD44' },
  cardIconWrap: { width:44, height:44, borderRadius:12, backgroundColor:'#0D1B2A',
    alignItems:'center', justifyContent:'center', marginRight:14 },
  cardIconTxt: { fontSize:22 },
  cardTitle: { flex:1, fontSize:17, fontWeight:'700', color:'#E0E1DD' },
  cardArrow: { fontSize:18, color:'#C9B47F' },
  footer: { color:'#778DA9', fontSize:11, textAlign:'center',
    marginTop:24, lineHeight:18 },
  footerLink: { color:'#C9B47F', fontWeight:'600', fontSize:11 },
  overlay: { flex:1, backgroundColor:'rgba(0,0,0,0.75)', justifyContent:'flex-end' },
  modal: { backgroundColor:'#1B263B', borderTopLeftRadius:24,
    borderTopRightRadius:24, padding:28, paddingBottom:40 },
  modalTitle: { fontSize:20, fontWeight:'800', color:'#E0E1DD', marginBottom:20 },
  modeRow: { flexDirection:'row', backgroundColor:'#0D1B2A',
    borderRadius:12, padding:4, marginBottom:16 },
  modeBtn: { flex:1, padding:10, borderRadius:9, alignItems:'center' },
  modeBtnOn: { backgroundColor:'#C9B47F' },
  modeTxt: { color:'#778DA9', fontWeight:'600', fontSize:14 },
  modeTxtOn: { color:'#0D1B2A' },
  errBox: { backgroundColor:'#E2444422', borderRadius:8,
    padding:10, marginBottom:10, borderWidth:1, borderColor:'#E2444444' },
  errTxt: { color:'#E24444', fontSize:12 },
  inp: { backgroundColor:'#0D1B2A', color:'#E0E1DD',
    padding:16, borderRadius:12, fontSize:15,
    marginBottom:12, borderWidth:1, borderColor:'#263550' },
  submitBtn: { padding:18, borderRadius:14, alignItems:'center', marginBottom:10 },
  submitB2C: { backgroundColor:'#C9B47F' },
  submitB2B: { backgroundColor:'#378ADD' },
  submitTxt: { color:'#fff', fontWeight:'800', fontSize:16 },
  cancelBtn: { alignItems:'center', padding:10 },
  cancelTxt: { color:'#778DA9', fontSize:14 },
});