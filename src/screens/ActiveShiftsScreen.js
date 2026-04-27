import React, { useState, useEffect } from 'react';
// Добавь импорт Platform:
import { View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, ScrollView, ActivityIndicator,
  TextInput, Image, Alert, Platform } from 'react-native';

const API = 'https://asap-horeca-backend-k6q2.onrender.com';

export default function ActiveShiftsScreen({ route, navigation }) {
  const { user } = route.params;
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(null);

  useEffect(() => { loadShifts(); }, []);

  const loadShifts = async () => {
    try {
      const res = await fetch(`${API}/applications/active/${user.id}`);
      const data = await res.json();
      setShifts(Array.isArray(data) ? data : []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const confirmShift = async (applicationId) => {
    setConfirming(applicationId);
    try {
      const res = await fetch(
        `${API}/applications/${applicationId}/confirm-seeker`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' } }
      );
      const data = await res.json();
      if (data.success) {
        Alert.alert('✅ Подтверждено!',
          'Ждём подтверждения от работодателя');
        await loadShifts();
      }
    } catch (e) { console.error(e); }
    finally { setConfirming(null); }
  };

  const getStatus = (app) => {
    if (app.status === 'COMPLETED') return { label: '✅ Завершена', color: '#1D9E75' };
    if (app.confirmedBySeeker && !app.confirmedByEmployer)
      return { label: '⏳ Ждём работодателя', color: '#C9B47F' };
    if (!app.confirmedBySeeker)
      return { label: '🔄 Требует подтверждения', color: '#378ADD' };
    return { label: '✅ Завершена', color: '#1D9E75' };
  };

  const cancelShift = async (applicationId) => {
    try {
      const res = await fetch(
        `${API}/applications/${applicationId}/cancel-seeker`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' } }
      );
      const data = await res.json();
      if (data.success) {
        Alert.alert('✅ Смена отменена');
        await loadShifts();
      }
    } catch (e) { console.error(e); }
  };

  return (
    <SafeAreaView style={S.safe}>
      <ScrollView contentContainerStyle={S.container}>

        <TouchableOpacity onPress={() => navigation.goBack()} style={S.back}>
          <Text style={S.backTxt}>← Назад</Text>
        </TouchableOpacity>

        <Text style={S.title}>⚡ В работе</Text>
        <Text style={S.subtitle}>
          Смены в которых ты принят и активно работаешь
        </Text>

        {loading ? (
          <ActivityIndicator color='#C9B47F' size='large' style={{marginTop:40}}/>
        ) : shifts.length === 0 ? (
          <View style={S.empty}>
            <Text style={S.emptyIcon}>🔍</Text>
            <Text style={S.emptyTxt}>Активных смен нет</Text>
            <Text style={S.emptySub}>
              Здесь появятся смены в которых тебя приняли
            </Text>
          </View>
        ) : (
          shifts.map(app => {
            const status = getStatus(app);
            return (
              <View key={app.id} style={S.card}>
                <View style={S.cardTop}>
                  <Text style={S.role}>{app.shift?.role}</Text>
                  <Text style={S.pay}>{app.shift?.pay?.toLocaleString()} ₽</Text>
                </View>
                <Text style={S.addr}>📍 {app.shift?.address}</Text>
                <Text style={S.establishment}>
                  🏢 {app.shift?.establishment || 'Заведение'}
                </Text>

                <View style={S.statusRow}>
                  <View style={[S.statusDot, {backgroundColor: status.color}]}/>
                  <Text style={[S.statusTxt, {color: status.color}]}>
                    {status.label}
                  </Text>
                </View>

                <View style={S.confirmRow}>
                  <View style={S.confirmItem}>
                    <Text style={app.confirmedBySeeker ? S.confirmed : S.notConfirmed}>
                      {app.confirmedBySeeker ? '✅' : '⏳'} Ты
                    </Text>
                  </View>
                  <View style={S.confirmItem}>
                    <Text style={app.confirmedByEmployer ? S.confirmed : S.notConfirmed}>
                      {app.confirmedByEmployer ? '✅' : '⏳'} Работодатель
                    </Text>
                  </View>
                </View>

                {!app.confirmedBySeeker && app.status !== 'COMPLETED' &&(<TouchableOpacity
                    style={S.confirmBtn}
                    disabled={confirming === app.id}
                    onPress={() => confirmShift(app.id)}>
                    {confirming === app.id
                      ? <ActivityIndicator color="#0D1B2A"/>
                      : <Text style={S.confirmBtnTxt}>
                          ✅ Подтвердить выполнение
                        </Text>}
                  </TouchableOpacity>
                )}

                {app.status === 'COMPLETED' && (
                  <TouchableOpacity
                    style={S.reviewBtn}
                    onPress={() => navigation.navigate('Reviews', {
                      targetUserId: app.shift?.creatorId,
                      targetName: app.shift?.establishment || 'Работодатель',
                      currentUser: user,
                      canReview: true,
                    })}>
                    <Text style={S.reviewBtnTxt}>💬 Оставить отзыв</Text>
                  </TouchableOpacity>
                )}

                {app.status === 'APPROVED' && !app.confirmedBySeeker && (
                  <TouchableOpacity
                    style={S.cancelBtn}
                    onPress={() => cancelShift(app.id)}>
                    <Text style={S.cancelBtnTxt}>❌ Отменить участие</Text>
                  </TouchableOpacity>
                )}

              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  // Добавь в стиль safe:
  safe: { 
    flex: 1, 
    backgroundColor: '#0D1B2A',
    paddingTop: Platform.OS === 'android' ? 35 : 0  // ← добавь это
  },
  container: { padding:20, paddingBottom:40 },
  back: { marginBottom:16, marginTop:8 },
  backTxt: { color:'#778DA9', fontSize:14 },
  title: { fontSize:24, fontWeight:'800', color:'#E0E1DD', marginBottom:8 },
  subtitle: { color:'#778DA9', fontSize:13, lineHeight:20, marginBottom:24 },
  empty: { alignItems:'center', paddingTop:60 },
  emptyIcon: { fontSize:48, marginBottom:16 },
  emptyTxt: { color:'#E0E1DD', fontSize:18, fontWeight:'600', marginBottom:8 },
  emptySub: { color:'#778DA9', fontSize:13, textAlign:'center', lineHeight:20 },
  card: { backgroundColor:'#1B263B', borderRadius:16,
    padding:16, marginBottom:14, borderWidth:1, borderColor:'#263550' },
  cardTop: { flexDirection:'row', justifyContent:'space-between', marginBottom:6 },
  role: { color:'#E0E1DD', fontWeight:'700', fontSize:18 },
  pay: { color:'#C9B47F', fontWeight:'900', fontSize:18 },
  addr: { color:'#778DA9', fontSize:12, marginBottom:4 },
  establishment: { color:'#778DA9', fontSize:12, marginBottom:12 },
  statusRow: { flexDirection:'row', alignItems:'center', gap:8, marginBottom:12 },
  statusDot: { width:8, height:8, borderRadius:4 },
  statusTxt: { fontSize:13, fontWeight:'600' },
  confirmRow: { flexDirection:'row', gap:12, marginBottom:12 },
  confirmItem: { flex:1, backgroundColor:'#0D1B2A', borderRadius:10,
    padding:10, alignItems:'center' },
  confirmed: { color:'#1D9E75', fontWeight:'600', fontSize:13 },
  notConfirmed: { color:'#778DA9', fontSize:13 },
  confirmBtn: { backgroundColor:'#1D9E75', borderRadius:12,
    padding:14, alignItems:'center', marginBottom:8 },
  confirmBtnTxt: { color:'#fff', fontWeight:'800', fontSize:14 },
  reviewBtn: { backgroundColor:'#1B263B', borderRadius:12,
    padding:12, alignItems:'center',
    borderWidth:1, borderColor:'#C9B47F44' },
  reviewBtnTxt: { color:'#C9B47F', fontWeight:'600', fontSize:13 },
  cancelBtn: { backgroundColor:'#E2444422', borderRadius:12,
  padding:12, alignItems:'center', marginTop:8,
  borderWidth:1, borderColor:'#E2444444' },
  cancelBtnTxt: { color:'#E24444', fontWeight:'600', fontSize:13 },
});