import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  TextInput, ActivityIndicator, Image,
  KeyboardAvoidingView, ScrollView, Platform,
  Pressable, Keyboard
} from 'react-native';
import { getStoredUser, saveUser } from '../../services/api';

const API = 'https://asap-horeca-backend-k6q2.onrender.com';

const STEP = { ROLE: 'role', FORM: 'form', CODE: 'code' };
const TAB = { LOGIN: 'login', REGISTER: 'register' };

const phoneSyncUser = async (phone, role, name) => {
  try {
    const res = await fetch(`${API}/users/phone-sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, role, name }),
    });
    const text = await res.text();
    if (!text || text.trim() === '') return { error: 'Сервер не ответил' };
    return JSON.parse(text);
  } catch (e) {
    return { error: 'Нет соединения с сервером' };
  }
};

export default function RoleSelectionScreen({ navigation }) {
  const [step, setStep] = useState(STEP.ROLE);
  const [role, setRole] = useState(null);
  const [tab, setTab] = useState(TAB.LOGIN);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [confirmation, setConfirmation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendTimer, setResendTimer] = useState(0);
  const codeInputRef = useRef(null);

  useEffect(() => {
    getStoredUser().then(user => {
      if (!user) return;
      if (user.role === 'B2C') navigation.replace('WorkerProfile', { user });
      else navigation.replace('EmployerProfile', { user });
    });
  }, []);

  useEffect(() => {
    if (resendTimer > 0) {
      const t = setTimeout(() => setResendTimer(r => r - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [resendTimer]);

  const formatPhone = (raw) => {
    const digits = raw.replace(/\D/g, '');
    if (digits.startsWith('8') && digits.length >= 10) return '+7' + digits.slice(1);
    if (digits.startsWith('7') && digits.length >= 11) return '+' + digits;
    if (!raw.startsWith('+')) return '+7' + digits;
    return raw.replace(/[\s\-\(\)]/g, '');
  };

  const openForm = (selectedRole) => {
    setRole(selectedRole);
    setStep(STEP.FORM);
    setTab(TAB.LOGIN);
    setName(''); setPhone(''); setCode(''); setError('');
  };

  const goBack = () => {
    if (step === STEP.CODE) {
      setStep(STEP.FORM); setCode(''); setError('');
    } else {
      setStep(STEP.ROLE); setRole(null); setError('');
    }
    Keyboard.dismiss();
  };

  const handleSendCode = async () => {
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 10) { setError('Введи корректный номер телефона'); return; }
    if (tab === TAB.REGISTER && !name.trim()) { setError('Укажи имя'); return; }

    setLoading(true); setError('');
    const formattedPhone = formatPhone(phone);
    const roleStr = role === 'b2c' ? 'B2C' : 'B2B';

    // Веб — входим без SMS
    if (Platform.OS === 'web') {
      try {
      const digits = phone.replace(/\D/g, '');
      const formattedPhone = '+7' + (digits.startsWith('7') ? digits.slice(1) : digits.startsWith('8') ? digits.slice(1) : digits);
      const roleStr = role === 'b2c' ? 'B2C' : 'B2B';
      const userName = tab === TAB.REGISTER ? name.trim() : 'Пользователь';
      const user = await phoneSyncUser(formattedPhone, roleStr, userName);
      if (user?.error) { setError(user.error); setLoading(false); return; }
      if (user?.id) {
        const fullUser = { ...user, uid: user.id, phone: formattedPhone };
        await saveUser(fullUser);
        if (roleStr === 'B2C') navigation.replace('WorkerProfile', { user: fullUser });
        else navigation.replace('EmployerProfile', { user: fullUser });
      } else {
        setError('Ошибка входа. Попробуй снова.');
      }
    } catch (e) {
      setError('Нет соединения с сервером');
      console.error(e);
    } finally { setLoading(false); }
    return;
    }

    // Мобильный — Firebase SMS
    try {
      const rnfbAuth = require('@react-native-firebase/auth').default;
      const conf = await rnfbAuth().signInWithPhoneNumber(formattedPhone);
      setConfirmation(conf);


      setStep(STEP.CODE);
        setResendTimer(60);
        setTimeout(() => codeInputRef.current?.focus(), 300);
      } catch (e) {
        console.error('SMS error:', e);
        if (e.code === 'auth/invalid-phone-number')
          setError('Неверный формат. Пример: +79001234567');
        else if (e.code === 'auth/too-many-requests')
          setError('Слишком много попыток. Подожди немного.');
        else
          setError('Не удалось отправить SMS: ' + (e.message || e.code));
      } finally { setLoading(false); }
    };

  const handleVerifyCode = async () => {
    if (code.length !== 6) { setError('Введи 6-значный код из SMS'); return; }
    setLoading(true); setError('');
    try {
      await confirmation.confirm(code);
      const formattedPhone = formatPhone(phone);
      const roleStr = role === 'b2c' ? 'B2C' : 'B2B';
      const user = await phoneSyncUser(
        formattedPhone, roleStr,
        tab === TAB.REGISTER ? name.trim() : undefined
      );
      if (user?.error) { setError(user.error); return; }
      if (user?.id) {
        const fullUser = { ...user, uid: user.id, phone: formattedPhone };
        await saveUser(fullUser);
        if (roleStr === 'B2C') navigation.replace('WorkerProfile', { user: fullUser });
        else navigation.replace('EmployerProfile', { user: fullUser });
      } else {
        setError('Ошибка входа. Попробуй снова.');
      }
    } catch (e) {
      if (e.code === 'auth/invalid-verification-code')
        setError('Неверный код. Проверь SMS.');
      else if (e.code === 'auth/code-expired')
        setError('Код истёк. Запроси новый.');
      else
        setError('Ошибка: ' + (e.message || e.code));
    } finally { setLoading(false); }
  };

  const isB2C = role === 'b2c';
  const accentColor = isB2C ? '#C9B47F' : '#378ADD';

  return (
    <SafeAreaView style={S.safe}>

      {/* ── Шаг 0: Выбор роли ── */}
      {step === STEP.ROLE && (
        <View style={S.container}>
          <View style={S.logoWrap}>
            <Image
              source={require('../../../assets/logo.png')}
              style={S.logoImage} resizeMode="contain"/>
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
            onPress={() => openForm('b2c')} activeOpacity={0.85}>
            <View style={S.cardIconWrap}>
              <Text style={S.cardIconTxt}>👤</Text>
            </View>
            <Text style={S.cardTitle}>Я ищу работу</Text>
            <Text style={S.cardArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity style={S.cardClient}
            onPress={() => openForm('b2b')} activeOpacity={0.85}>
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
      )}

      {/* ── Шаг 1: Форма входа/регистрации ── */}
      {step === STEP.FORM && (
        <KeyboardAvoidingView style={S.safe}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <Pressable style={{flex:1}} onPress={Keyboard.dismiss}>
            <ScrollView contentContainerStyle={S.formContainer}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}>

              <TouchableOpacity onPress={goBack} style={S.backBtn}>
                <Text style={S.backTxt}>← Назад</Text>
              </TouchableOpacity>

              <View style={S.formHeader}>
                <Text


style={S.formIcon}>{isB2C ? '👤' : '🏢'}</Text>
                <Text style={S.formTitle}>{isB2C ? 'Соискатель' : 'Работодатель'}</Text>
              </View>

              {/* Вкладки */}
              <View style={S.tabs}>
                <TouchableOpacity
                  style={[S.tab, tab === TAB.LOGIN && { ...S.tabActive, borderBottomColor: accentColor }]}
                  onPress={() => { setTab(TAB.LOGIN); setError(''); }}>
                  <Text style={[S.tabTxt, tab === TAB.LOGIN && { color: accentColor }]}>
                    Войти
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[S.tab, tab === TAB.REGISTER && { ...S.tabActive, borderBottomColor: accentColor }]}
                  onPress={() => { setTab(TAB.REGISTER); setError(''); }}>
                  <Text style={[S.tabTxt, tab === TAB.REGISTER && { color: accentColor }]}>
                    Зарегистрироваться
                  </Text>
                </TouchableOpacity>
              </View>

              {error ? (
                <View style={S.errBox}><Text style={S.errTxt}>⚠️ {error}</Text></View>
              ) : null}

              {/* Имя только при регистрации */}
              {tab === TAB.REGISTER && (
                <>
                  <Text style={S.lbl}>{isB2C ? 'Твоё имя' : 'Название заведения'}</Text>
                  <TextInput style={S.inp}
                    placeholder={isB2C ? 'Иван Иванов' : 'Кафе «Уют»'}
                    placeholderTextColor='#778DA9'
                    value={name} onChangeText={setName}
                    autoCapitalize='words'/>
                </>
              )}

              <Text style={S.lbl}>Номер телефона</Text>
              <View style={S.phoneWrap}>
                <View style={S.phonePrefix}>
                  <Text style={S.phonePrefixTxt}>🇷🇺 +7</Text>
                </View>
                <TextInput style={S.phoneInput}
                  placeholder='900 123-45-67'
                  placeholderTextColor='#778DA9'
                  keyboardType='phone-pad'
                  value={phone}
                  onChangeText={t => setPhone(t.replace(/[^\d\s\-\+\(\)]/g, ''))}
                  maxLength={18}
                  returnKeyType="done"
                  onSubmitEditing={handleSendCode}/>
              </View>
              <Text style={S.phoneHint}>Пример: 9001234567 или +79001234567</Text>

              <TouchableOpacity
                style={[S.submitBtn, { backgroundColor: accentColor }, loading && S.submitDisabled]}
                onPress={handleSendCode} disabled={loading}>
                {loading
                  ? <ActivityIndicator color='#0D1B2A'/>
                  : <Text style={S.submitTxt}>
                      {Platform.OS === 'web'
                        ? (tab === TAB.LOGIN ? '🚀 Войти' : '🚀 Зарегистрироваться')
                        : '📲 Получить SMS код'}
                    </Text>}
              </TouchableOpacity>

              <TouchableOpacity style={S.cancelBtn} onPress={goBack}>
                <Text style={S.cancelTxt}>Отмена</Text>
              </TouchableOpacity>
              <View style={{ height: 40 }}/>
            </ScrollView>
          </Pressable>
        </KeyboardAvoidingView>
      )}

      {/* ── Шаг 2: Ввод SMS кода ── */}
      {step === STEP.CODE && (
        <KeyboardAvoidingView style={S.safe}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <Pressable style={{flex:1}} onPress={Keyboard.dismiss}>
            <ScrollView contentContainerStyle={S.formContainer}
              keyboardShouldPersistTaps="handled">

              <TouchableOpacity onPress={goBack} style={S.backBtn}>
                <Text style={S.backTxt}>← Назад</Text>
              </TouchableOpacity>

              <View style={S.formHeader}>
                <Text style={S.formIcon}>💬</Text>
                <Text style={S.formTitle}>Код из SMS</Text>
                <Text style={S.formSub}>
                  Отправили 6-значный код на{'\n'}


<Text style={{ color: accentColor, fontWeight: '700' }}>
                    {formatPhone(phone)}
                  </Text>
                </Text>
              </View>

              {error ? (
                <View style={S.errBox}><Text style={S.errTxt}>⚠️ {error}</Text></View>
              ) : null}

              <TextInput
                ref={codeInputRef}
                style={[S.codeInput, { borderColor: accentColor + '44' }]}
                placeholder='- - - - - -'
                placeholderTextColor='#778DA9'
                keyboardType='number-pad'
                maxLength={6}
                value={code}
                onChangeText={t => {
                  setCode(t.replace(/\D/g, ''));
                  if (t.length === 6) Keyboard.dismiss();
                }}
                textAlign='center'
                autoFocus/>

              <View style={S.dotsRow}>
                {[0,1,2,3,4,5].map(i => (
                  <View key={i} style={[S.dot,
                    i < code.length && { backgroundColor: accentColor, borderColor: accentColor }]}/>
                ))}
              </View>

              <TouchableOpacity
                style={[S.submitBtn, { backgroundColor: accentColor },
                  (loading || code.length < 6) && S.submitDisabled]}
                onPress={handleVerifyCode}
                disabled={loading || code.length < 6}>
                {loading
                  ? <ActivityIndicator color='#0D1B2A'/>
                  : <Text style={S.submitTxt}>✅ Подтвердить</Text>}
              </TouchableOpacity>

              <TouchableOpacity
                style={[S.cancelBtn, resendTimer > 0 && { opacity: 0.5 }]}
                onPress={() => { if (resendTimer === 0) { setStep(STEP.FORM); setCode(''); } }}
                disabled={resendTimer > 0}>
                <Text style={S.cancelTxt}>
                  {resendTimer > 0
                    ? `Отправить снова через ${resendTimer} сек`
                    : '🔄 Отправить код снова'}
                </Text>
              </TouchableOpacity>
              <View style={{ height: 40 }}/>
            </ScrollView>
          </Pressable>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  safe: { flex:1, backgroundColor:'#0D1B2A' },
  container: { flex:1, padding:24, justifyContent:'center' },
  logoWrap: { alignItems:'center', marginBottom:40 },
  logoImage: { width:120, height:120, marginBottom:12 },
  logoMain: { fontSize:36, fontWeight:'500', fontStyle:'italic',
    color:'#dddde1', letterSpacing:1, marginBottom:4 },
  logoRed: { color:'#e72121', fontWeight:'500', fontStyle:'italic' },
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
  formContainer: { flexGrow:1, padding:24, paddingTop:60 },
  backBtn: { marginBottom:24 },
  backTxt: { color:'#778DA9', fontSize:14 },
  formHeader: { alignItems:'center', marginBottom:24 },
  formIcon: { fontSize:48, marginBottom:12 },
  formTitle: { fontSize:24, fontWeight:'800', color:'#E0E1DD', marginBottom:4


},
  formSub: { fontSize:14, color:'#778DA9', textAlign:'center', lineHeight:20 },
  tabs: { flexDirection:'row', marginBottom:24,
    borderBottomWidth:1, borderBottomColor:'#1B263B' },
  tab: { flex:1, paddingVertical:12, alignItems:'center', borderBottomWidth:2,
    borderBottomColor:'transparent' },
  tabActive: { borderBottomWidth:2 },
  tabTxt: { fontSize:15, fontWeight:'600', color:'#778DA9' },
  lbl: { fontSize:12, color:'#778DA9', marginBottom:8, letterSpacing:0.5 },
  phoneWrap: { flexDirection:'row', backgroundColor:'#1B263B',
    borderRadius:12, borderWidth:1, borderColor:'#263550',
    marginBottom:6, alignItems:'center', overflow:'hidden' },
  phonePrefix: { backgroundColor:'#263550', padding:16 },
  phonePrefixTxt: { color:'#E0E1DD', fontSize:15, fontWeight:'600' },
  phoneInput: { flex:1, color:'#E0E1DD', padding:16, fontSize:18,
    fontWeight:'600', letterSpacing:1 },
  phoneHint: { color:'#778DA9', fontSize:11, marginBottom:24 },
  codeInput: { backgroundColor:'#1B263B', color:'#C9B47F',
    borderRadius:16, padding:20, fontSize:36, fontWeight:'900',
    letterSpacing:16, borderWidth:2,
    marginBottom:16, textAlign:'center' },
  dotsRow: { flexDirection:'row', justifyContent:'center', gap:10, marginBottom:28 },
  dot: { width:12, height:12, borderRadius:6,
    backgroundColor:'#263550', borderWidth:1, borderColor:'#778DA9' },
  errBox: { backgroundColor:'#E2444422', borderRadius:8,
    padding:12, marginBottom:16, borderWidth:1, borderColor:'#E2444444' },
  errTxt: { color:'#E24444', fontSize:13 },
  inp: { backgroundColor:'#1B263B', color:'#E0E1DD',
    padding:16, borderRadius:12, fontSize:15,
    marginBottom:16, borderWidth:1, borderColor:'#263550' },
  submitBtn: { padding:18, borderRadius:14, alignItems:'center', marginBottom:12 },
  submitDisabled: { opacity:0.5 },
  submitTxt: { color:'#0D1B2A', fontWeight:'800', fontSize:16 },
  cancelBtn: { alignItems:'center', padding:12 },
  cancelTxt: { color:'#778DA9', fontSize:14 },
});