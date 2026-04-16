import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet,
  SafeAreaView, ScrollView, ActivityIndicator,
  TextInput, Platform } from 'react-native';
import { getOrders, clearUser } from '../../services/api';

const API = 'https://asap-horeca-backend-k6q2.onrender.com';

export default function EmployerProfileScreen({ route, navigation }) {
  const [user, setUser] = useState(route?.params?.user || {});
  const [myShifts, setMyShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [completedCount, setCompletedCount] = useState(0);

  const [form, setForm] = useState({
    companyName: user.companyName || user.name || '',
    responsibleName: user.responsibleName || '',
    location: user.location || user.address || '',
    yearsOnMarket: user.yearsOnMarket?.toString() || '0',
  });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const all = await getOrders();
      const userId = user.id || user.uid;
      const mine = Array.isArray(all)
        ? all.filter(s => s.creatorId === userId)
        : [];
      setMyShifts(mine);

      // Посчитать завершённые смены
      const res = await fetch(`${API}/shifts/completed/${userId}`);
      if (res.ok) {
        const data = await res.json();
        setCompletedCount(data.count || 0);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API}/users/${user.id}/profile`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.companyName,
          companyName: form.companyName,
          responsibleName: form.responsibleName,
          location: form.location,
          address: form.location,
          yearsOnMarket: parseInt(form.yearsOnMarket) || 0,
        })
      });
      const updated = await res.json();
      setUser({ ...user, ...updated });
      setEditing(false);
      setSaveMsg('✅ Профиль сохранён!');
      setTimeout(() => setSaveMsg(''), 3000);
    } catch (e) {
      setSaveMsg('❌ Ошибка сохранения');
    } finally { setSaving(false); }
  };

  const handleLogout = async () => {
    if (Platform.OS === 'web' && !window.confirm('Выйти?')) return;
    await clearUser();
    navigation.reset({ index: 0, routes: [{ name: 'RoleSelection' }] });
  };

  const score = user.employerRating || 0;
  const scoreColor = score >= 4 ? '#C9B47F' : score >= 3 ? '#2ECC71' : '#778DA9';
  const initials = (form.companyName || 'КО')
    .split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  const renderShift = ({ item }) => (
    <TouchableOpacity style={S.shiftCard}
      onPress={() => navigation.navigate('OrderWaiting', { shift: item, user })}>
      <View style={S.shiftTop}>
        <Text style={S.shiftRole}>{item.role}</Text>
        <Text style={S.shiftPay}>{item.pay?.toLocaleString()} ₽</Text>
      </View>
      <Text style={S.shiftAddr}>📍 {item.address}</Text>
      <View style={S.shiftFooter}>
        <View style={[S.statusDot,
          item.status === 'OPEN' ? S.statusOpen : S.statusClosed]}/>
        <Text style={S.statusTxt}>
          {item.status === 'OPEN' ? 'Идёт поиск'
            : item.status === 'COMPLETED' ? 'Завершена'
            : item.status === 'CANCELLED' ? 'Отменена' : 'Закрыта'}
        </Text>
        <Text style={S.viewTxt}>Кандидаты →</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={S.safe}>
      <ScrollView contentContainerStyle={S.container}>

        <View style={S.topBar}>
          <View style={{flex:1}}>
            <Text style={S.badge}>🏢 РАБОТОДАТЕЛЬ</Text>
          </View>
          <View style={{flexDirection:'row', gap:12}}>
            {!editing && (
              <TouchableOpacity onPress={() => setEditing(true)}>
                <Text style={S.editTxt}>✏️ Изменить</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={handleLogout}>
              <Text style={S.logoutTxt}>Выйти</Text>
            </TouchableOpacity>
          </View>
        </View>

        {saveMsg ? (
          <View style={[S.msgBox,
            saveMsg.includes('✅') ? S.msgGreen : S.msgRed]}>
            <Text style={S.msgTxt}>{saveMsg}</Text>
          </View>
        ) : null}

        <View style={S.profileHeader}>
          <View style={[S.avatar, {borderColor: scoreColor}]}>
            <Text style={S.avatarTxt}>{initials}</Text>
          </View>
          <View style={S.scoreCard}>
            <Text style={S.scoreLbl}>Рейтинг</Text>
            <Text style={[S.scoreNum, {color: scoreColor}]}>
              {score > 0 ? score.toFixed(1) : '—'}
            </Text>
            <Text style={S.scoreMax}>/5.0</Text>
          </View>
        </View>

        {editing ? (
          <TextInput style={S.nameInput}
            value={form.companyName}
            onChangeText={v => setForm({...form, companyName: v})}
            placeholder="Название заведения/компании"
            placeholderTextColor="#778DA9"/>
        ) : (
          <Text style={S.companyName}>
            {form.companyName || 'Название не указано'}
          </Text>
        )}

        <View style={S.statsRow}>
          <View style={S.statBox}>
            <Text style={S.statNum}>{completedCount}</Text>
            <Text style={S.statLbl}>смен закрыто</Text>
          </View>
          <View style={S.statBox}>
            <Text style={S.statNum}>{form.yearsOnMarket || 0}</Text>
            <Text style={S.statLbl}>лет на рынке</Text>
          </View>
          <View style={S.statBox}>
            <Text style={S.statNum}>{myShifts.length}</Text>
            <Text style={S.statLbl}>смен создано</Text>
          </View>
        </View>

        <Text style={S.sectionTitle}>Информация</Text>
        <View style={S.infoCard}>

          <View style={S.infoRow}>
            <Text style={S.infoIcon}>👤</Text>
            <View style={{flex:1}}>
              <Text style={S.infoLbl}>Имя ответственного</Text>
              {editing ? (
                <TextInput style={S.infoInput}
                  value={form.responsibleName}
                  onChangeText={v => setForm({...form, responsibleName: v})}
                  placeholder="Иван Иванов"
                  placeholderTextColor="#778DA9"/>
              ) : (
                <Text style={S.infoVal}>
                  {form.responsibleName || 'Не указано'}
                </Text>
              )}
            </View>
          </View>

          <View style={S.divider}/>
          <View style={S.infoRow}>
            <Text style={S.infoIcon}>📍</Text>
            <View style={{flex:1}}>
              <Text style={S.infoLbl}>Место дислокации</Text>
              {editing ? (
                <TextInput style={S.infoInput}
                  value={form.location}
                  onChangeText={v => setForm({...form, location: v})}
                  placeholder="Москва, ЦАО"
                  placeholderTextColor="#778DA9"/>
              ) : (
                <Text style={S.infoVal}>
                  {form.location || 'Не указано'}
                </Text>
              )}
            </View>
          </View>

          <View style={S.divider}/>
          <View style={S.infoRow}>
            <Text style={S.infoIcon}>📅</Text>
            <View style={{flex:1}}>
              <Text style={S.infoLbl}>Лет на рынке</Text>
              {editing ? (
                <TextInput style={S.infoInput}
                  value={form .yearsOnMarket}
                  onChangeText={v => setForm({...form, yearsOnMarket: v})}
                  placeholder="5"
                  placeholderTextColor="#778DA9"
                  keyboardType="numeric"/>
              ) : (
                <Text style={S.infoVal}>
                  {form.yearsOnMarket || '0'} лет
                </Text>
              )}
            </View>
          </View>

        </View>

        {editing ? (
          <View style={{flexDirection:'row', gap:10, marginBottom:16}}>
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
        ) : null}

        <TouchableOpacity style={S.walletBtn}
          onPress={() => navigation.navigate('Wallet', { user })}>
          <Text style={S.walletBtnTxt}>💳 Кошелёк</Text>
        </TouchableOpacity>

        <TouchableOpacity style={S.createBtn}
          onPress={() => navigation.navigate('CreateOrder', { user })}>
          <Text style={S.createBtnTxt}>🔥 Создать новую смену</Text>
        </TouchableOpacity>

        <View style={S.sectionRow}>
          <Text style={S.sectionTitle}>МОИ СМЕНЫ</Text>
          <Text style={S.count}>{myShifts.length} смен</Text>
        </View>

        {loading ? (
          <ActivityIndicator color='#C9B47F' size='large' style={{marginTop:20}}/>
        ) : myShifts.length === 0 ? (
          <View style={S.empty}>
            <Text style={S.emptyIcon}>📋</Text>
            <Text style={S.emptyTxt}>Смен пока нет</Text>
            <Text style={S.emptySub}>Создай первую смену!</Text>
          </View>
        ) : (
          <FlatList
            data={myShifts}
            keyExtractor={i => i.id}
            renderItem={renderShift}
            scrollEnabled={false}
            showsVerticalScrollIndicator={false}/>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  safe: { flex:1, backgroundColor:'#0D1B2A' },
  container: { padding:20, paddingBottom:40 },
  topBar: { flexDirection:'row', justifyContent:'space-between',
    alignItems:'center', marginBottom:16, marginTop:8 },
  badge: { color:'#378ADD', fontSize:12, fontWeight:'700', letterSpacing:1 },
  editTxt: { color:'#C9B47F', fontSize:14 },
  logoutTxt: { color:'#778DA9', fontSize:14 },
  msgBox: { borderRadius:10, padding:12, marginBottom:14, borderWidth:1 },
  msgGreen: { backgroundColor:'#1D9E7522', borderColor:'#1D9E7544' },
  msgRed: { backgroundColor:'#E2444422', borderColor:'#E2444444' },
  msgTxt: { color:'#E0E1DD', fontSize:13, textAlign:'center' },
  profileHeader: { flexDirection:'row', alignItems:'center',
    gap:16, marginBottom:16 },
  avatar: { width:80, height:80, borderRadius:40, backgroundColor:'#1B263B',
    alignItems:'center', justifyContent:'center', borderWidth:3 },
  avatarTxt: { fontSize:28, fontWeight:'700', color:'#E0E1DD' },
  scoreCard: { flex:1, backgroundColor:'#1B263B', borderRadius:16,
    padding:14, alignItems:'center', borderWidth:1, borderColor:'#C9B47F33' },
  scoreLbl: { color:'#778DA9', fontSize:12, marginBottom:4 },
  scoreNum: { fontSize:36, fontWeight:'900' },
  scoreMax: { color:'#778DA9', fontSize:13 },
  nameInput: { fontSize:22, fontWeight:'700', color:'#E0E1DD',
    backgroundColor:'#1B263B', borderRadius:12, padding:12,
    marginBottom:16, textAlign:'center' },
  companyName: { fontSize:24, fontWeight:'800', color:'#E0E1DD',
    textAlign:'center', marginBottom:16 },
  statsRow: { flexDirection:'row', gap:8, marginBottom:20 },
  statBox: { flex:1, backgroundColor:'#1B263B', borderRadius:14,
    padding:12, alignItems:'center', borderWidth:1, borderColor:'#263550' },
  statNum: { fontSize:24, fontWeight:'900', color:'#C9B47F' },
  statLbl: { fontSize:10, color:'#778DA9', marginTop:3, textAlign:'center' },
  sectionTitle: { fontSize:11, color:'#778DA9', letterSpacing:1.5,
    fontWeight:'600', marginBottom:12 },
  infoCard: { backgroundColor:'#1B263B', borderRadius:16,
    padding:16, marginBottom:16, borderWidth:1, borderColor:'#263550' },
  infoRow: { flexDirection:'row', alignItems:'flex-start',
    gap:12, paddingVertical:10 },
  infoIcon: { fontSize:20 },
  infoLbl: { color:'#778DA9', fontSize:12, marginBottom:4 },
  infoVal: { color:'#E0E1DD', fontSize:15, fontWeight:'500' },
  infoInput: { color:'#E0E1DD', fontSize:14, backgroundColor:'#0D1B2A',
    borderRadius:8, padding:8, borderWidth:1, borderColor:'#263550' },
  divider: { height:1, backgroundColor:'#263550' },
  saveBtn: { backgroundColor:'#C9B47F', padding:16,
    borderRadius:14, alignItems:'center' },
  saveBtnTxt: { color:'#0D1B2A', fontWeight:'800', fontSize:15 },
  cancelBtn: { backgroundColor:'#1B263B', padding:16,
    borderRadius:14, alignItems:'center',
    borderWidth:1, borderColor:'#263550' },
  cancelBtnTxt: { color:'#778DA9', fontSize:15 },
  walletBtn: { backgroundColor:'#1B263B', borderRadius:14,
    padding:16, alignItems:'center', marginBottom:10,
    borderWidth:1, borderColor:'#C9B47F44',
    flexDirection:'row', justifyContent:'center', gap:8 },
  walletBtnTxt: { color:'#C9B47F', fontWeight:'700', fontSize:15 },
  createBtn: { backgroundColor:'#C9B47F', padding:18,
    borderRadius:16, alignItems:'center', marginBottom:20 },
  createBtnTxt: { color:'#0D1B2A', fontWeight:'800', fontSize:16 },
  sectionRow: { flexDirection:'row', justifyContent:'space-between',
    alignItems:'center', marginBottom:12 },
  count: { color:'#C9B47F', fontSize:12, fontWeight:'600' },
  shiftCard: { backgroundColor:'#1B263B', borderRadius:16,
    padding:16, marginBottom:12, borderWidth:1, borderColor:'#263550' },
  shiftTop: { flexDirection:'row', justifyContent:'space-between', marginBottom:6 },
  shiftRole: { color:'#E0E1DD', fontWeight:'700', fontSize:17 },
  shiftPay: { color:'#C9B47F', fontWeight:'900', fontSize:18 },
  shiftAddr: { color:'#778DA9', fontSize:12, marginBottom:10 },
  shiftFooter: { flexDirection:'row', alignItems:'center', gap:6 },
  statusDot: { width:8, height:8, borderRadius:4 },
  statusOpen: { backgroundColor:'#C9B47F' },
  statusClosed: { backgroundColor:'#778DA9' },
  statusTxt: { color:'#778DA9', fontSize:12, flex:1 },
  viewTxt: { color:'#C9B47F', fontSize:12, fontWeight:'600' },
  empty: { alignItems:'center', paddingTop:40 },
  emptyIcon: { fontSize:40, marginBottom:12 },
  emptyTxt: { color:'#E0E1DD', fontSize:18, fontWeight:'600', marginBottom:6 },
  emptySub: { color:'#778DA9', fontSize:13 },
});