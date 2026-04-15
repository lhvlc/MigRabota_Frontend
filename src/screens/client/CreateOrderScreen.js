import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, ActivityIndicator, ScrollView,
} from 'react-native';
import { createOrder } from '../../services/api';

const ROLES = [
  'Бариста',
  'Официант',
  'Повар',
  'Хостес',
  'Мойщик посуды',
  'Монтажник',
  'Демонтажник',
  'Разнорабочий',
  'Грузчик',
];

export default function CreateOrderScreen({ route, navigation }) {
  const user = route?.params?.user || {};
  const [role, setRole] = useState('Бариста');
  const [address, setAddress] = useState(user.address || '');
  const [pay, setPay] = useState('');
  const [desc, setDesc] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const showError = (msg) => {
    setError(msg);
    setTimeout(() => setError(''), 4000);
  };

  const handleCreate = async () => {
    setError('');
    setSuccess('');

    if (!address.trim()) { showError('Укажи адрес заведения'); return; }
    if (!pay.trim() || isNaN(Number(pay))) {
      showError('Укажи оплату (только цифры)'); return;
    }

    const creatorId = user.id || user.uid;
    if (!creatorId) {
      showError('Ошибка: войди снова'); return;
    }

    setLoading(true);
    try {
      const shift = await createOrder({
        role,
        establishment: user.name || 'Заведение',
        address: address.trim(),
        pay: parseInt(pay),
        description: desc.trim() || null,
        startTime: new Date(Date.now() + 3600000).toISOString(),
        creatorId,
      });

      if (shift?.id) {
        setSuccess('✅ Смена опубликована!');
        setTimeout(() => {
          navigation.replace('OrderWaiting', { shift, user });
        }, 1000);
      } else if (shift?.error) {
        showError('Ошибка: ' + shift.error);
      } else {
        showError('Не удалось создать смену');
      }
    } catch (e) {
      showError('Нет соединения с сервером');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={S.safe}>
      <ScrollView contentContainerStyle={S.container}>

        <View style={S.topBar}>
          <TouchableOpacity
            onPress={() => navigation.navigate('EmployerProfile', { user })}>
            <Text style={S.backTxt}>← Профиль</Text>
          </TouchableOpacity>
          <Text style={S.title}>Создать смену</Text>
        </View>

        <Text style={S.sub}>Заполни — уведомление уйдёт всем свободным</Text>

        {error ? (
          <View style={S.errorBox}>
            <Text style={S.errorTxt}>⚠️ {error}</Text>
          </View>
        ) : null}
        {success ? (
          <View style={S.successBox}>
            <Text style={S.successTxt}>{success}</Text>
          </View>
        ) : null}

        <Text style={S.lbl}>Должность</Text>
        <View style={S.rolesRow}>
          {ROLES.map(r => (
            <TouchableOpacity key={r}
              style={[S.roleChip, role === r && S.roleChipOn]}
              onPress={() => setRole(r)}>
              <Text style={[S.roleChipTxt, role === r && S.roleChipTxtOn]}>{r}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={S.lbl}>Адрес заведения</Text>
        <TextInput style={S.inp} placeholder="ул. Ленина, 12"
          placeholderTextColor="#778DA9"
          value={address} onChangeText={setAddress}/>

        <Text style={S.lbl}>Оплата за смену (₽)</Text>
        <TextInput style={S.inp} placeholder="2000"
          placeholderTextColor="#778DA9"
          keyboardType="numeric"
          value={pay} onChangeText={setPay}/>

        <Text style={S.lbl}>Требования (необязательно)</Text>
        <TextInput style={[S.inp, S.inpTall]}
          placeholder="Опыт от 1 года..."
          placeholderTextColor="#778DA9"
          multiline value={desc} onChangeText={setDesc}/>

        <TouchableOpacity style={[S.btn, loading && S.btnDisabled]}
          onPress={handleCreate} disabled={loading}>
          {loading
            ? <ActivityIndicator color="#0D1B2A"/>
            : <Text style={S.btnTxt}>🔥 Опубликовать смену</Text>}
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  safe: { flex:1, backgroundColor:'#0D1B2A' },
  container: { padding:24, paddingBottom:60 },
  topBar: { flexDirection:'row', alignItems:'center',
    justifyContent:'space-between', marginBottom:6, marginTop:8 },
  backTxt: { color:'#778DA9', fontSize:14 },
  title: { fontSize:22, fontWeight:'800', color:'#E0E1DD' },
  sub: { fontSize:13, color:'#778DA9', marginBottom:20 },
  errorBox: { backgroundColor:'#E2444422', borderRadius:10,
    padding:12, marginBottom:14, borderWidth:1, borderColor:'#E2444455' },
  errorTxt: { color:'#E24444', fontSize:13 },
  successBox: { backgroundColor:'#1D9E7522', borderRadius:10,
    padding:12, marginBottom:14, borderWidth:1, borderColor:'#1D9E7555' },
  successTxt: { color:'#1D9E75', fontSize:13, fontWeight:'600' },
  lbl: { fontSize:12, color:'#778DA9', marginBottom:8, marginTop:16, letterSpacing:0.5 },
  rolesRow: { flexDirection:'row', flexWrap:'wrap', gap:8 },
  roleChip: { backgroundColor:'#1B263B', borderRadius:20,
    paddingHorizontal:14, paddingVertical:8,
    borderWidth:1, borderColor:'#263550' },
  roleChipOn: { borderColor:'#C9B47F', backgroundColor:'#C9B47F22' },
  roleChipTxt: { color:'#778DA9', fontSize:13 },
  roleChipTxtOn: { color:'#C9B47F', fontWeight:'600' },
  inp: { backgroundColor:'#1B263B', color:'#E0E1DD',
    padding:16, borderRadius:12, fontSize:15,
    borderWidth:1, borderColor:'#263550' },
  inpTall: { height:80, textAlignVertical:'top' },
  btn: { backgroundColor:'#C9B47F', padding:20,
    borderRadius:16, alignItems:'center', marginTop:28 },
  btnDisabled: { opacity:0.6 },
  btnTxt: { color:'#0D1B2A', fontWeight:'800', fontSize:17 },
});