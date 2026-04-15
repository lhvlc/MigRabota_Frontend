import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  ScrollView, Platform, TextInput, ActivityIndicator } from 'react-native';
import { clearUser, updateProfile, saveUser } from '../../services/api';

const ROLES_LIST = ['Бариста', 'Официант', 'Повар', 'Хостес', 'Бармен', 'Мойщик'];

export default function WorkerProfileScreen({ route, navigation }) {
  const [user, setUser] = useState(route?.params?.user || {});
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  const [form, setForm] = useState({
    name: user.name || '',
    experience: user.experience || '',
    phone: user.phone || '',
    address: user.address || '',
    specialties: user.specialties || '',
  });

  const score = user.aiScore || 80;
  const initials = (user.name || 'АК')
    .split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  const scoreColor = score >= 90 ? '#C9B47F' : score >= 70 ? '#2ECC71' : '#E24444';
  const scoreLabel = score >= 90 ? 'Превосходный профиль'
    : score >= 70 ? 'Хороший профиль' : 'Нужно улучшить';

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await updateProfile(user.id, {
        name: form.name,
        experience: form.experience + (form.specialties ? ' | ' + form.specialties : ''),
        phone: form.phone,
        address: form.address,
      });
      const newUser = { ...user, ...updated };
      setUser(newUser);
      await saveUser(newUser);
      setEditing(false);
      setSaveMsg('✅ Профиль сохранён!');
      setTimeout(() => setSaveMsg(''), 3000);
    } catch (e) {
      setSaveMsg('❌ Ошибка сохранения');
    } finally { setSaving(false); }
  };

  const handleLogout = async () => {
    try {
      await clearUser();
      // Сбросить весь стек навигации и начать заново
      navigation.reset({
        index: 0,
        routes: [{ name: 'RoleSelection' }],
      });
    } catch (e) {
      console.error('Ошибка выхода:', e);
    }
  };

  return (
    <SafeAreaView style={S.safe}>
      <ScrollView contentContainerStyle={S.container}>

        <View style={S.topBar}>
          <TouchableOpacity onPress={() => navigation.navigate('OrdersFeed', { user })}>
            <Text style={S.backTxt}>← Смены</Text>
          </TouchableOpacity>
          <View style={{flexDirection:'row', gap:12}}>
            {!editing ? (
              <TouchableOpacity onPress={() => setEditing(true)}>
                <Text style={S.editTxt}>✏️ Изменить</Text>
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity onPress={handleLogout}>
              <Text style={S.logoutTxt}>Выйти</Text>
            </TouchableOpacity>
          </View>
        </View>

        {saveMsg ? <View style={S.saveMsg}><Text style={S.saveMsgTxt}>{saveMsg}</Text></View> : null}

        <View style={S.avatarWrap}>
          <View style={[S.avatar, {borderColor: scoreColor}]}>
            <Text style={S.avatarTxt}>{initials}</Text>
          </View>
          <View style={S.verifiedBadge}><Text style={S.verifiedTxt}>✓</Text></View>
        </View>

        {editing ? (
          <TextInput style={S.nameInput}
            value={form.name}
            onChangeText={v => setForm({...form, name: v})}
            placeholder="Твоё имя" placeholderTextColor="#778DA9"/>
        ) : (
          <Text style={S.name}>{user.name || 'Соискатель'}</Text>
        )}

        <View style={S.scoreCard}>
          <Text style={S.scoreLabel}>AI Score</Text>
          <View style={S.scoreRow}>
            <Text style={[S.scoreNum, {color: scoreColor}]}>{score}</Text>
            <Text style={S.scoreMax}> /100</Text>
          </View>
          <Text style={[S.scoreDesc, {color: scoreColor}]}>{scoreLabel}</Text>
        </View>

        <Text style={S.sectionTitle}>Специальности</Text>
        {editing ? (
          <View style={S.rolesWrap}>
            {ROLES_LIST.map(r => {
              const selected = form.specialties.includes(r);
              return (
                <TouchableOpacity key={r}
                  style={[S.roleChip, selected && S.roleChipOn]}onPress={() => {
                    const arr = form.specialties ? form.specialties.split(', ') : [];
                    const newArr = selected ? arr.filter(x => x !== r) : [...arr, r];
                    setForm({...form, specialties: newArr.join(', ')});
                  }}>
                  <Text style={[S.roleChipTxt, selected && S.roleChipTxtOn]}>{r}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <Text style={S.roles}>{form.specialties || 'Не указаны'}</Text>
        )}

        <Text style={S.sectionTitle}>Информация</Text>
        <View style={S.infoCard}>

          <View style={S.infoRow}>
            <Text style={S.infoIcon}>💼</Text>
            <View style={{flex:1}}>
              <Text style={S.infoLbl}>Опыт работы</Text>
              {editing ? (
                <TextInput style={S.infoInput}
                  value={form.experience}
                  onChangeText={v => setForm({...form, experience: v})}
                  placeholder="Например: 3 года в кофейнях"
                  placeholderTextColor="#778DA9"/>
              ) : (
                <Text style={S.infoVal}>{form.experience || 'Не указан'}</Text>
              )}
            </View>
          </View>

          <View style={S.infoDivider}/>
          <View style={S.infoRow}>
            <Text style={S.infoIcon}>📍</Text>
            <View style={{flex:1}}>
              <Text style={S.infoLbl}>Локация</Text>
              {editing ? (
                <TextInput style={S.infoInput}
                  value={form.address}
                  onChangeText={v => setForm({...form, address: v})}
                  placeholder="Город, район"
                  placeholderTextColor="#778DA9"/>
              ) : (
                <Text style={S.infoVal}>{form.address || 'Не указана'}</Text>
              )}
            </View>
          </View>

          <View style={S.infoDivider}/>
          <View style={S.infoRow}>
            <Text style={S.infoIcon}>📱</Text>
            <View style={{flex:1}}>
              <Text style={S.infoLbl}>Телефон</Text>
              {editing ? (
                <TextInput style={S.infoInput}
                  value={form.phone}
                  onChangeText={v => setForm({...form, phone: v})}
                  placeholder="+7 (999) 999-99-99"
                  placeholderTextColor="#778DA9"
                  keyboardType="phone-pad"/>
              ) : (
                <Text style={S.infoVal}>{form.phone || 'Не указан'}</Text>
              )}
            </View>
          </View>

          <View style={S.infoDivider}/>
          <View style={S.infoRow}>
            <Text style={S.infoIcon}>✉️</Text>
            <View>
              <Text style={S.infoLbl}>Email</Text>
              <Text style={S.infoVal}>{user.email || 'Не указан'}</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={S.walletBtn}
          onPress={() => navigation.navigate('Wallet', { user })}>
          <Text style={S.walletBtnTxt}>💳 Мой заработок</Text>
        </TouchableOpacity>

        {editing ? (
          <View style={{flexDirection:'row', gap:10}}>
            <TouchableOpacity style={[S.saveBtn, {flex:1}]}
              onPress={handleSave} disabled={saving}>
              {saving
                ? <ActivityIndicator color="#0D1B2A"/>
                : <Text style={S.saveBtnTxt}>💾 Сохранить</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={[S.cancelBtn, {flex:1}]}
              onPress={() => setEditing(false)}>
              <Text style={S.cancelBtnTxt}>Отмена</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={S.feedBtn}
            onPress={() => navigation.navigate('OrdersFeed', { user })}>
            <Text style={S.feedBtnTxt}>⚡ Найти смену</Text>
          </TouchableOpacity>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  safe: { flex:1, backgroundColor:'#0D1B2A' },
  container: { padding:20, paddingBottom:40 },
  topBar: { flexDirection:'row', justifyContent:'space-between', marginBottom:20, marginTop:8 },
  backTxt: { color:'#778DA9', fontSize:14 },
  editTxt: { color:'#C9B47F', fontSize:14 },
  logoutTxt: { color:'#778DA9', fontSize:14 },
  saveMsg: { backgroundColor:'#1D9E7522', borderRadius:10, padding:10,
    marginBottom:14, borderWidth:1, borderColor:'#1D9E7544' },
  saveMsgTxt: { color:'#1D9E75', fontSize:13, textAlign:'center' },
  avatarWrap: { alignItems:'center', marginBottom:14, position:'relative' },
  avatar: { width:100, height:100, borderRadius:50, backgroundColor:'#1B263B',
    alignItems:'center', justifyContent:'center', borderWidth:3 },
  avatarTxt: { fontSize:36, fontWeight:'700', color:'#E0E1DD' },
  verifiedBadge: { position:'absolute', bottom:0, right:'32%',
    width:28, height:28, borderRadius:14, backgroundColor:'#C9B47F',
    alignItems:'center', justifyContent:'center',
    borderWidth:2, borderColor:'#0D1B2A' },
  verifiedTxt: { color:'#0D1B2A', fontSize:14, fontWeight:'800' },
  name: { fontSize:26, fontWeight:'800', color:'#E0E1DD', textAlign:'center', marginBottom:4 },
  nameInput: { fontSize:22, fontWeight:'700', color:'#E0E1DD', textAlign:'center',
    backgroundColor:'#1B263B', borderRadius:12, padding:12, marginBottom:4 },
  scoreCard: { backgroundColor:'#1B263B', borderRadius:20, padding:24,
    alignItems:'center', marginBottom:24, borderWidth:1, borderColor:'#C9B47F33' },
  scoreLabel: { color:'#778DA9', fontSize:13, marginBottom:8 },
  scoreRow: { flexDirection:'row', alignItems:'flex-end', marginBottom:8 },
  scoreNum: { fontSize:72, fontWeight:'900', lineHeight:80 },
  scoreMax: { fontSize:22, color:'#778DA9', marginBottom:10 },
  scoreDesc: { fontSize:15, fontWeight:'600' },
  sectionTitle: { fontSize:16, fontWeight:'700', color:'#E0E1DD', marginBottom:12 },
  rolesWrap: { flexDirection:'row', flexWrap:'wrap', gap:8, marginBottom:20 },
  roleChip: { backgroundColor:'#1B263B', borderRadius:20,
    paddingHorizontal:14, paddingVertical:8, borderWidth:1, borderColor:'#263550' },
  roleChipOn: { borderColor:'#C9B47F', backgroundColor:'#C9B47F22' },
  roleChipTxt: { color:'#778DA9', fontSize:13 },
  roleChipTxtOn: { color:'#C9B47F', fontWeight:'600' },
  roles: { color:'#778DA9', fontSize:14, textAlign:'center', marginBottom:20 },
  infoCard: { backgroundColor:'#1B263B', borderRadius:16,
    padding:16, marginBottom:20, borderWidth:1, borderColor:'#263550' },
  infoRow: { flexDirection:'row', alignItems:'flex-start', gap:14, paddingVertical:10 },
  infoIcon: { fontSize:20, marginTop:2 },
  infoLbl: { color:'#778DA9', fontSize:12, marginBottom:4 },
  infoVal: { color:'#E0E1DD', fontSize:15, fontWeight:'500' },
  infoInput: { color:'#E0E1DD', fontSize:14, backgroundColor:'#0D1B2A',
    borderRadius:8, padding:8, borderWidth:1, borderColor:'#263550' },
  infoDivider: { height:1, backgroundColor:'#263550' },
  saveBtn: { backgroundColor:'#C9B47F', padding:18,
    borderRadius:14, alignItems:'center' },
  saveBtnTxt: { color:'#0D1B2A', fontWeight:'800', fontSize:15 },
  cancelBtn: { backgroundColor:'#1B263B', padding:18,
    borderRadius:14, alignItems:'center', borderWidth:1, borderColor:'#263550' },
  cancelBtnTxt: { color:'#778DA9', fontSize:15 },
  feedBtn: { backgroundColor:'#C9B47F', padding:18, borderRadius:16, alignItems:'center' },
  feedBtnTxt: { color:'#0D1B2A', fontWeight:'800', fontSize:16 },
  walletBtn: { backgroundColor:'#1B263B', borderRadius:14,
  padding:16, alignItems:'center', marginBottom:14,
  borderWidth:1, borderColor:'#C9B47F44',
  flexDirection:'row', justifyContent:'center', gap:8 },
  walletBtnTxt: { color:'#C9B47F', fontWeight:'700', fontSize:15 },
});