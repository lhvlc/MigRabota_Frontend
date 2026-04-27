import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, ScrollView, ActivityIndicator,
  Platform } from 'react-native';
import { applyToOrder } from '../../services/api';
 
export default function OrderDetailScreen({ route, navigation }) {
  const { order, user } = route.params;
  const [loading, setLoading] = useState(false);
  const [applied, setApplied] = useState(false);
  const [error, setError] = useState('');
 
  const handleApply = async () => {
    setLoading(true); setError('');
    try {
      const seekerId = user?.id || user?.uid;
      const result = await applyToOrder(order.id, seekerId);
      if (result?.error) {
        setError(result.error === 'Уже откликался'
          ? 'Ты уже откликнулся на эту смену'
          : result.error);
      } else {
        setApplied(true);
      }
    } catch {
      setError('Нет соединения. Попробуй снова.');
    } finally { setLoading(false); }
  };
 
  const formatDate = (dateStr) => {
    if (!dateStr) return 'Не указано';
    const d = new Date(dateStr);
    return d.toLocaleString('ru-RU', {
      day: 'numeric', month: 'long',
      hour: '2-digit', minute: '2-digit'
    });
  };
 
  return (
    <SafeAreaView style={S.safe}>
      <ScrollView contentContainerStyle={S.container}>
 
        <TouchableOpacity onPress={() => navigation.goBack()} style={S.back}>
          <Text style={S.backTxt}>← Назад</Text>
        </TouchableOpacity>
 
        <View style={S.badge}>
          <Text style={S.badgeTxt}>🔥 ГОРЯЩАЯ СМЕНА</Text>
        </View>
 
        <Text style={S.role}>{order.role}</Text>
        <Text style={S.pay}>{order.pay?.toLocaleString()} ₽</Text>
 
        <View style={S.infoCard}>
          <View style={S.infoRow}>
            <Text style={S.infoIcon}>🏢</Text>
            <View style={{flex:1}}>
              <Text style={S.infoLbl}>Заведение</Text>
              <Text style={S.infoVal}>{order.establishment || order.address}</Text>
            </View>
          </View>
          <View style={S.divider}/>
          <View style={S.infoRow}>
            <Text style={S.infoIcon}>📍</Text>
            <View style={{flex:1}}>
              <Text style={S.infoLbl}>Адрес</Text>
              <Text style={S.infoVal}>{order.address}</Text>
            </View>
          </View>
          <View style={S.divider}/>
          <View style={S.infoRow}>
            <Text style={S.infoIcon}>🕐</Text>
            <View style={{flex:1}}>
              <Text style={S.infoLbl}>Начало смены</Text>
              <Text style={S.infoVal}>{formatDate(order.startTime)}</Text>
            </View>
          </View>
          {order.description ? (
            <>
              <View style={S.divider}/>
              <View style={S.infoRow}>
                <Text style={S.infoIcon}>📋</Text>
                <View style={{flex:1}}>
                  <Text style={S.infoLbl}>Требования</Text>
                  <Text style={S.infoVal}>{order.description}</Text>
                </View>
              </View>
            </>
          ) : null}
        </View>
 
        {/* Кнопка профиля работодателя — передаём currentUser для отзывов */}
        <TouchableOpacity
          style={S.employerBtn}
          onPress={() => navigation.navigate('EmployerPublicProfile', {
            employerId: order.creatorId,
            employerName: order.establishment || 'Работодатель',
            currentUser: user,  // ← передаём текущего пользователя
          })}>
          <Text style={S.employerBtnTxt}>🏢 Профиль заведения</Text>
        </TouchableOpacity>
 
        {error ? (
          <View style={S.errorBox}>
            <Text style={S.errorTxt}>⚠️ {error}</Text>
          </View>
        ) : null}
 
        {applied ? (
          <View style={S.successBox}>
            <Text style={S.successIcon}>✅</Text>
            <Text style={S.successTitle}>Отклик отправлен!</Text>
            <Text style={S.successSub}>
              Работодатель получил уведомление и рассмотрит твою кандидатуру
            </Text>
          </View>
        ) : (<TouchableOpacity
            style={[S.applyBtn, loading && S.applyBtnDisabled]}
            onPress={handleApply}
            disabled={loading}>
            {loading
              ? <ActivityIndicator color="#0D1B2A"/>
              : <Text style={S.applyTxt}>⚡ Откликнуться на смену</Text>}
          </TouchableOpacity>
        )}
 
      </ScrollView>
    </SafeAreaView>
  );
}
 
const S = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#0D1B2A',
    paddingTop: Platform.OS === 'android' ? 35 : 0
  },
  container: { padding:20, paddingBottom:40 },
  back: { marginBottom:20, marginTop:8 },
  backTxt: { color:'#778DA9', fontSize:14 },
  badge: { backgroundColor:'#C9B47F22', borderRadius:8,
    paddingHorizontal:12, paddingVertical:5, alignSelf:'flex-start',
    marginBottom:14, borderWidth:1, borderColor:'#C9B47F44' },
  badgeTxt: { color:'#C9B47F', fontSize:11, fontWeight:'700' },
  role: { fontSize:30, fontWeight:'800', color:'#E0E1DD', marginBottom:6 },
  pay: { fontSize:36, fontWeight:'900', color:'#C9B47F', marginBottom:24 },
  infoCard: { backgroundColor:'#1B263B', borderRadius:16,
    padding:16, marginBottom:16, borderWidth:1, borderColor:'#263550' },
  infoRow: { flexDirection:'row', alignItems:'flex-start',
    gap:14, paddingVertical:12 },
  infoIcon: { fontSize:20 },
  infoLbl: { color:'#778DA9', fontSize:12, marginBottom:3 },
  infoVal: { color:'#E0E1DD', fontSize:15, fontWeight:'500' },
  divider: { height:1, backgroundColor:'#263550' },
  employerBtn: { backgroundColor:'#1B263B', borderRadius:14,
    padding:16, alignItems:'center', marginBottom:16,
    borderWidth:1, borderColor:'#378ADD44',
    flexDirection:'row', justifyContent:'center', gap:8 },
  employerBtnTxt: { color:'#378ADD', fontWeight:'700', fontSize:15 },
  errorBox: { backgroundColor:'#E2444422', borderRadius:12,
    padding:14, marginBottom:16, borderWidth:1, borderColor:'#E2444444' },
  errorTxt: { color:'#E24444', fontSize:13 },
  successBox: { backgroundColor:'#1D9E7511', borderRadius:18,
    padding:24, alignItems:'center', borderWidth:1.5, borderColor:'#1D9E7555' },
  successIcon: { fontSize:48, marginBottom:12 },
  successTitle: { fontSize:22, fontWeight:'800', color:'#1D9E75', marginBottom:8 },
  successSub: { color:'#778DA9', fontSize:14, textAlign:'center', lineHeight:20 },
  applyBtn: { backgroundColor:'#C9B47F', padding:20,
    borderRadius:16, alignItems:'center' },
  applyBtnDisabled: { opacity:0.6 },
  applyTxt: { color:'#0D1B2A', fontWeight:'800', fontSize:17 },
});