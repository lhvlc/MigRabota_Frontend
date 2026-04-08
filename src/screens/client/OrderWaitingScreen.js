import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet,
  SafeAreaView, ActivityIndicator, Alert } from 'react-native';
import { getApplicants, acceptApplicant } from '../../services/api';

export default function OrderWaitingScreen({ route, navigation }) {
  const { shift, user } = route.params;
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
    const interval = setInterval(load, 10000); // обновление каждые 10 сек
    return () => clearInterval(interval);
  }, []);

  const load = async () => {
    try {
      const data = await getApplicants(shift.id);
      setApplicants(Array.isArray(data) ? data : []);
    } catch (e) {} finally { setLoading(false); }
  };

  const handleAccept = async (application) => {
    Alert.alert(
      'Принять кандидата?',
      `${application.seeker?.name} выйдет на смену`,
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Принять',
          onPress: async () => {
            await acceptApplicant(application.id);
            Alert.alert('✅ Готово!', 'Кандидат утверждён на смену');
            load();
          }
        }
      ]
    );
  };

  const renderApplicant = ({ item }) => (
    <View style={S.card}>
      <View style={S.cardLeft}>
        <Text style={S.name}>{item.seeker?.name || 'Без имени'}</Text>
        <Text style={S.email}>{item.seeker?.email}</Text>
        <View style={S.scoreRow}>
          <Text style={S.scoreLbl}>AI Score: </Text>
          <Text style={S.scoreVal}>{item.seeker?.aiScore || 80}</Text>
        </View>
      </View>
      {item.status === 'APPROVED' ? (
        <Text style={S.approved}>✓ Принят</Text>
      ) : (
        <TouchableOpacity style={S.acceptBtn} onPress={() => handleAccept(item)}>
          <Text style={S.acceptTxt}>Принять</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <SafeAreaView style={S.safe}>
      <View style={S.container}>
        <TouchableOpacity onPress={() => navigation.navigate('CreateOrder', { user })}
          style={S.newBtn}>
          <Text style={S.newBtnTxt}>+ Новая смена</Text>
        </TouchableOpacity>

        <View style={S.shiftInfo}>
          <Text style={S.shiftRole}>{shift.role}</Text>
          <Text style={S.shiftPay}>{shift.pay} ₽</Text>
        </View>

        <Text style={S.section}>
          КАНДИДАТЫ {applicants.length > 0 ? `· ${applicants.length}` : ''}
        </Text>

        {loading ? (
          <ActivityIndicator color='#C9B47F' size='large' style={{ marginTop: 40 }} />
        ) : applicants.length === 0 ? (
          <View style={S.emptyBox}>
            <Text style={S.emptyIcon}>⏳</Text>
            <Text style={S.emptyTxt}>Ждём откликов...</Text>
            <Text style={S.emptySub}>Обновление каждые 10 секунд</Text>
          </View>
        ) : (
          <FlatList data={applicants} keyExtractor={i => i.id}
            renderItem={renderApplicant} showsVerticalScrollIndicator={false} />
        )}
      </View>
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0D1B2A' },
  container: { flex: 1, padding: 20 },
  newBtn: { backgroundColor: '#1B263B', borderRadius: 10, padding: 12,
    alignSelf: 'flex-end', marginTop: 8, marginBottom: 16 },
  newBtnTxt: { color: '#C9B47F', fontWeight: '600', fontSize: 13 },
  shiftInfo: { backgroundColor: '#1B263B', borderRadius: 14, padding: 16,
    flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  shiftRole: { color: '#E0E1DD', fontWeight: '700', fontSize: 18 },
  shiftPay: { color: '#C9B47F', fontWeight: '800', fontSize: 20 },
  section: { color: '#778DA9', fontSize: 11, letterSpacing: 1.5, marginBottom: 12 },
  card: { backgroundColor: '#1B263B', borderRadius: 14, padding: 16,
    marginBottom: 10, flexDirection: 'row', alignItems: 'center' },
  cardLeft: { flex: 1 },
  name: { color: '#E0E1DD', fontWeight: '700', fontSize: 16, marginBottom: 2 },
  email: { color: '#778DA9', fontSize: 12, marginBottom: 6 },
  scoreRow: { flexDirection: 'row', alignItems: 'center' },
  scoreLbl: { color: '#778DA9', fontSize: 12 },
  scoreVal: { color: '#C9B47F', fontWeight: '700', fontSize: 14 },
  acceptBtn: { backgroundColor: '#C9B47F', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 10 },
  acceptTxt: { color: '#0D1B2A', fontWeight: '700', fontSize: 13 },
  approved: { color: '#1D9E75', fontWeight: '700', fontSize: 13 },
  emptyBox: { alignItems: 'center', marginTop: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTxt: { color: '#E0E1DD', fontSize: 18, fontWeight: '600', marginBottom: 8 },
  emptySub: { color: '#778DA9', fontSize: 13 },
});