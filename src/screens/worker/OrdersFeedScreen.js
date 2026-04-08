import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Switch,
  StyleSheet, ActivityIndicator, SafeAreaView, Alert } from 'react-native';
import { getOrders, toggleHotStatus } from '../../services/api';

export default function OrdersFeedScreen({ route, navigation }) {
  const user = route?.params?.user || {};
  const [orders, setOrders] = useState([]);
  const [isHot, setIsHot] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const data = await getOrders();
      setOrders(Array.isArray(data) ? data : []);
    } catch (e) { setOrders([]); }
    finally { setLoading(false); }
  };

  const handleToggle = async (val) => {
    setIsHot(val);
    try {
      await toggleHotStatus(user.uid || user.id, val);
    } catch (e) { setIsHot(!val); }
  };

  const renderCard = ({ item }) => (
    <TouchableOpacity style={S.card}
      onPress={() => navigation.navigate('OrderDetail', { order: item, user })}>
      <View style={S.cardTop}>
        <Text style={S.role}>{item.role}</Text>
        <Text style={S.pay}>{item.pay} ₽</Text>
      </View>
      <Text style={S.place}>{item.establishment}</Text>
      <Text style={S.addr}>📍 {item.address}</Text>
      <View style={S.applyRow}>
        <Text style={S.applyBtn}>Смотреть →</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={S.safe}>
      <View style={S.container}>
        <Text style={S.header}>Привет, {user.name || 'Worker'} 👋</Text>

        <View style={[S.hotBox, isHot && S.hotBoxOn]}>
          <View style={{ flex: 1 }}>
            <Text style={S.hotTitle}>
              {isHot ? '⚡ Я ГОТОВ РАБОТАТЬ' : 'Скрыт от работодателей'}
            </Text>
            <Text style={S.hotSub}>
              {isHot ? 'Работодатели видят твой профиль' : 'Включи чтобы найти смену'}
            </Text>
          </View>
          <Switch value={isHot} onValueChange={handleToggle}
            trackColor={{ false: '#0D1B2A', true: '#C9B47F' }}
            thumbColor={isHot ? '#0D1B2A' : '#778DA9'} />
        </View>

        <Text style={S.section}>ГОРЯЩИЕ СМЕНЫ</Text>

        {loading ? (
          <ActivityIndicator color='#C9B47F' size='large' style={{ marginTop: 40 }} />
        ) : orders.length === 0 ? (
          <Text style={S.empty}>Пока нет открытых смен</Text>
        ) : (
          <FlatList data={orders} keyExtractor={i => i.id}
            renderItem={renderCard} showsVerticalScrollIndicator={false} />
        )}
      </View>
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0D1B2A' },
  container: { flex: 1, padding: 20 },
  header: { fontSize: 22, fontWeight: '700', color: '#E0E1DD', marginBottom: 16, marginTop: 8 },
  hotBox: { backgroundColor: '#1B263B', borderRadius: 16, padding: 18,
    flexDirection: 'row', alignItems: 'center', marginBottom: 24,
    borderWidth: 1.5, borderColor: '#1B263B' },
  hotBoxOn: { borderColor: '#C9B47F' },
  hotTitle: { color: '#E0E1DD', fontWeight: '700', fontSize: 15, marginBottom: 4 },
  hotSub: { color: '#778DA9', fontSize: 12 },
  section: { color: '#778DA9', fontSize: 11, letterSpacing: 1.5, marginBottom: 12 },
  card: { backgroundColor: '#1B263B', borderRadius: 16, padding: 18, marginBottom: 12 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  role: { color: '#E0E1DD', fontWeight: '700', fontSize: 18 },
  pay: { color: '#C9B47F', fontWeight: '800', fontSize: 20 },
  place: { color: '#E0E1DD', fontSize: 14, marginBottom: 4 },
  addr: { color: '#778DA9', fontSize: 13, marginBottom: 12 },
  applyRow: { alignItems: 'flex-end' },
  applyBtn: { color: '#C9B47F', fontWeight: '600', fontSize: 14 },
  empty: { color: '#778DA9', textAlign: 'center', marginTop: 60, fontSize: 15 },
});