import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity,
  StyleSheet, SafeAreaView, ActivityIndicator } from 'react-native';
import { getOrders, clearUser } from '../../services/api';
import { getHotWorkers } from '../../services/api';

export default function EmployerProfileScreen({ route, navigation }) {
  const user = route?.params?.user || {};
  const [myShifts, setMyShifts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [hotWorkers, setHotWorkers] = useState([]);

  useEffect(() => {
    loadMyShifts();
  // Загрузить горячих соискателей
    getHotWorkers().then(data => {
      setHotWorkers(Array.isArray(data) ? data : []);
    });
  }, []);

// В JSX добавь секцию под кнопкой "Создать смену":
  {hotWorkers.length > 0 && (
    <View>
      <View style={{flexDirection:'row', justifyContent:'space-between', marginBottom:12}}>
        <Text style={{color:'#778DA9', fontSize:11, letterSpacing:1.5, fontWeight:'600'}}>
          ГОТОВЫ РАБОТАТЬ СЕЙЧАС
        </Text>
        <Text style={{color:'#C9B47F', fontSize:12, fontWeight:'600'}}>
          {hotWorkers.length} чел.
        </Text>
      </View>
      {hotWorkers.map(w => (
        <TouchableOpacity key={w.id}
          style={{backgroundColor:'#1B263B', borderRadius:14, padding:14,
            marginBottom:8, flexDirection:'row', alignItems:'center',
            borderWidth:1, borderColor:'#C9B47F33'}}
          onPress={() => navigation.navigate('ViewWorkerProfile', {
            workerId: w.id, workerName: w.name
          })}>
          <View style={{width:36, height:36, borderRadius:18,
            backgroundColor:'#C9B47F22', alignItems:'center',
            justifyContent:'center', marginRight:12}}>
            <Text style={{color:'#C9B47F', fontWeight:'700'}}>
              {(w.name||'?')[0].toUpperCase()}
            </Text>
          </View>
          <View style={{flex:1}}>
            <Text style={{color:'#E0E1DD', fontWeight:'700', fontSize:15}}>
              ⚡ {w.name}
            </Text>
            <Text style={{color:'#778DA9', fontSize:12}}>
              AI Score: {w.aiScore} · {w.address || 'Локация не указана'}
            </Text>
          </View>
          <Text style={{color:'#C9B47F', fontSize:14}}>→</Text>
        </TouchableOpacity>
      ))}
    </View>
  )}

  useEffect(() => { loadMyShifts(); }, []);

  const loadMyShifts = async () => {
    try {
      const all = await getOrders();
      const mine = Array.isArray(all)
        ? all.filter(s => s.creatorId === (user.id || user.uid))
        : [];
      setMyShifts(mine);
    } catch (e) {
      console.error('Ошибка загрузки смен:', e);
    } finally { setLoading(false); }
  };

  const handleLogout = async () => {
    if (typeof window !== 'undefined') {
      if (window.confirm('Выйти из аккаунта?')) {
        await clearUser();
        navigation.reset({
          index: 0,
          routes: [{ name: 'RoleSelection' }],
        });
      }
    } else {
      await clearUser();
      navigation.reset({
        index: 0,
        routes: [{ name: 'RoleSelection' }],
      });
    }
  };

  const renderShift = ({ item }) => (
    <TouchableOpacity
      style={S.shiftCard}
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
          {item.status === 'OPEN' ? 'Идёт поиск...' : 'Закрыта'}
        </Text>
        <Text style={S.viewTxt}>Смотреть кандидатов →</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={S.safe}>
      <View style={S.container}>

        <View style={S.header}>
          <View>
            <Text style={S.name}>{user.name || 'Заведение'}</Text>
            <Text style={S.email}>{user.email || ''}</Text>
          </View>
          <TouchableOpacity onPress={handleLogout}>
            <Text style={S.logoutTxt}>Выйти</Text>
          </TouchableOpacity>
        </View>

        <View style={S.badge}>
          <Text style={S.badgeTxt}>🏢 РАБОТОДАТЕЛЬ</Text>
        </View>

        <TouchableOpacity
          style={S.walletBtn}
          onPress={() => navigation.navigate('Wallet', { user })}>
          <Text style={S.walletBtnTxt}>
            💳 Кошелёк
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={S.createBtn}
          onPress={() => navigation.navigate('CreateOrder', { user })}>
          <Text style={S.createBtnTxt}>🔥 Создать новую смену</Text>
        </TouchableOpacity>

        <View style={S.sectionRow}>
          <Text style={S.section}>МОИ СМЕНЫ</Text>
          <Text style={S.count}>{myShifts.length} смен</Text>
        </View>

        {loading ? (
          <ActivityIndicator color='#C9B47F' size='large' style={{marginTop:40}}/>
        ) : myShifts.length === 0 ? (
          <View style={S.empty}>
            <Text style={S.emptyIcon}>📋</Text>
            <Text style={S.emptyTxt}>Смен пока нет</Text>
            <Text style={S.emptySub}>Создай первую смену!</Text>
          </View>
        ) : (
          <FlatList data={myShifts} keyExtractor={i => i.id}
            renderItem={renderShift} showsVerticalScrollIndicator={false}/>
        )}
      </View>
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  safe: { flex:1, backgroundColor:'#0D1B2A' },
  container: { flex:1, padding:20 },
  header: { flexDirection:'row', justifyContent:'space-between',
    alignItems:'flex-start', marginBottom:16, marginTop:8 },
  name: { fontSize:22, fontWeight:'800', color:'#E0E1DD' },
  email: { fontSize:12, color:'#778DA9', marginTop:2 },
  logoutTxt: { color:'#778DA9', fontSize:13, paddingTop:4 },
  badge: { backgroundColor:'#378ADD22', borderRadius:8,
    paddingHorizontal:12, paddingVertical:5, alignSelf:'flex-start',
    marginBottom:20, borderWidth:1, borderColor:'#378ADD33' },
  badgeTxt: { color:'#378ADD', fontSize:11, fontWeight:'700', letterSpacing:1 },
  createBtn: { backgroundColor:'#C9B47F', padding:18,
    borderRadius:16, alignItems:'center', marginBottom:24 },
  createBtnTxt: { color:'#0D1B2A', fontWeight:'800', fontSize:16 },
  sectionRow: { flexDirection:'row', justifyContent:'space-between',
    alignItems:'center', marginBottom:12 },
  section: { color:'#778DA9', fontSize:11, letterSpacing:1.5, fontWeight:'600' },
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
  empty: { flex:1, alignItems:'center', justifyContent:'center', paddingTop:60 },
  emptyIcon: { fontSize:48, marginBottom:16 },
  emptyTxt: { color:'#E0E1DD', fontSize:18, fontWeight:'600', marginBottom:8 },
  emptySub: { color:'#778DA9', fontSize:13 },
  walletBtn: { backgroundColor:'#1B263B', borderRadius:14,
  padding:16, alignItems:'center', marginBottom:14,
  borderWidth:1, borderColor:'#C9B47F44',
  flexDirection:'row', justifyContent:'center', gap:8 },
  walletBtnTxt: { color:'#C9B47F', fontWeight:'700', fontSize:15 },
});