import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, ActivityIndicator, TextInput, Image, Alert, Platform, Switch, FlatList, RefreshControl } from 'react-native';
import { getOrders, toggleHotStatus, getStoredUser, clearUser } from '../../services/api';

export default function OrdersFeedScreen({ route, navigation }) {
  const [user, setUser] = useState(route?.params?.user || null);
  const [orders, setOrders] = useState([]);
  const [isHot, setIsHot] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    const init = async () => {
      if (!user) {
        const stored = await getStoredUser();
        if (!stored) {
          navigation.reset({
            index: 0,
            routes: [{ name: 'RoleSelection' }],
          });
        }
        setUser(stored);
      }
      loadShifts();
    };
    init();
  }, []);

  const loadShifts = async () => {
    try {
      const data = await getOrders();
      const userId = user?.id || user?.uid;
      const filtered = Array.isArray(data)
        ? data.filter(s => s.status === 'OPEN')
        : [];

      setOrders(filtered);
    } catch (e) {
      console.error('Ошибка загрузки смен:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadShifts();
  }, []);

  const handleToggle = async (val) => {
    if (toggling) return;
    setToggling(true);
    setIsHot(val);
    try {
      const uid = user?.uid || user?.id;
      await toggleHotStatus(uid, val);
    } catch {
      setIsHot(!val);
    } finally {
      setToggling(false);
    }
  };

  const handleLogout = async () => {
    if (Platform.OS === 'web') {
      const ok = window.confirm('Выйти из аккаунта?');
      if (ok) {
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

  const renderCard = ({ item }) => (
    <TouchableOpacity
      style={S.card}
      activeOpacity={0.85}
      onPress={() => navigation.navigate('OrderDetail', { order: item, user })}>
      <View style={S.cardHeader}>
        <View style={S.hotBadge}>
          <Text style={S.hotBadgeTxt}>🔥 ГОРЯЩАЯ</Text>
        </View>
        <Text style={S.pay}>{item.pay?.toLocaleString()} ₽</Text>
      </View>
      <Text style={S.role}>{item.role}</Text>
      <Text style={S.place}>{item.establishment}</Text>
      <View style={S.cardFooter}>
        <Text style={S.addr}>📍 {item.address}</Text>
        <Text style={S.more}>Смотреть →</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={S.safe}>
      <View style={S.container}>

        <View style={S.topBar}>
          <View>
            <Text style={S.greeting}>
              Привет, {user?.name || 'Worker'} 👋
            </Text>
            <Text style={S.greetingSub}>Найди смену прямо сейчас</Text>
          </View>
        <View style={{flexDirection:'row', gap:8}}>
          <TouchableOpacity
            style={S.profileBtn}
            onPress={() => navigation.navigate('WorkerProfile', { user })}>
            <Text style={S.profileBtnTxt}>👤</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleLogout} style={S.logoutBtn}>
            <Text style={S.logoutTxt}>Выйти</Text>
          </TouchableOpacity>
        </View>
        </View>

        <TouchableOpacity
          style={[S.hotBox, isHot && S.hotBoxOn]}
          onPress={() => handleToggle(!isHot)}
          activeOpacity={0.9}>
          <View style={S.hotLeft}>
            <Text style={S.hotEmoji}>{isHot ? '⚡' : '😴'}</Text>
            <View style={{ flex: 1 }}>
              <Text style={[S.hotTitle, isHot && S.hotTitleOn]}>
                {isHot ? 'Я ГОТОВ РАБОТАТЬ' : 'Скрыт от работодателей'}
              </Text>
              <Text style={S.hotSub}>
                {isHot
                  ? 'Работодатели видят твой профиль'
                  : 'Включи чтобы найти смену'}
              </Text>
            </View>
          </View>
          {toggling ? (
            <ActivityIndicator color='#C9B47F' size='small' />
          ) : (
            <Switch
              value={isHot}
              onValueChange={handleToggle}
              trackColor={{ false: '#0D1B2A', true: '#C9B47F' }}
              thumbColor={isHot ? '#0D1B2A' : '#778DA9'}
            />
          )}
        </TouchableOpacity>

        <View style={S.sectionRow}>
          <Text style={S.section}>ГОРЯЩИЕ СМЕНЫ</Text>
          <Text style={S.count}>{orders.length} доступно</Text>
        </View>

        {loading ? (
          <View style={S.center}>
            <ActivityIndicator color='#C9B47F' size='large' />
            <Text style={S.loadTxt}>Загружаем смены...</Text>
          </View>
        ) : orders.length === 0 ? (
          <View style={S.center}>
            <Text style={S.emptyIcon}>📭</Text>
            <Text style={S.emptyTxt}>Пока нет открытых смен</Text>
            <Text style={S.emptySub}>Потяни вниз чтобы обновить</Text>
          </View>
        ) : (
          <FlatList
            data={orders}
            keyExtractor={(i) => i.id}
            renderItem={renderCard}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor='#C9B47F'
              />
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  safe: { 
    flex: 1, 
    backgroundColor: '#0D1B2A',
    paddingTop: Platform.OS === 'android' ? 35 : 0
  },
  container: { flex: 1, padding: 20 },
  topBar: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', marginBottom: 20, marginTop: 8,
  },
  greeting: { fontSize: 22, fontWeight: '800', color: '#E0E1DD' },
  greetingSub: { fontSize: 12, color: '#778DA9', marginTop: 2 },
  logoutBtn: { padding: 8, marginTop: 4 },
  logoutTxt: { color: '#778DA9', fontSize: 13 },
  hotBox: {
    backgroundColor: '#1B263B', borderRadius: 18, padding: 18,
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 24,
    borderWidth: 1.5, borderColor: '#1B263B',
  },
  hotBoxOn: { borderColor: '#C9B47F' },
  hotLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  hotEmoji: { fontSize: 24 },
  hotTitle: { color: '#778DA9', fontWeight: '700', fontSize: 14, marginBottom: 3 },
  hotTitleOn: { color: '#C9B47F' },
  hotSub: { color: '#778DA9', fontSize: 11 },
  sectionRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 12,
  },
  section: { color: '#778DA9', fontSize: 11, letterSpacing: 1.5, fontWeight: '600' },
  count: { color: '#C9B47F', fontSize: 12, fontWeight: '600' },
  card: {
    backgroundColor: '#1B263B', borderRadius: 18, padding: 18,
    marginBottom: 12, borderWidth: 1, borderColor: '#263550',
  },
  cardHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 10,
  },
  hotBadge: {
    backgroundColor: '#C9B47F22', borderRadius: 6,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  hotBadgeTxt: { color: '#C9B47F', fontSize: 10, fontWeight: '700' },
  pay: { color: '#C9B47F', fontWeight: '900', fontSize: 22 },
  role: { color: '#E0E1DD', fontWeight: '800', fontSize: 20, marginBottom: 4 },
  place: { color: '#E0E1DD', fontSize: 14, marginBottom: 10, opacity: 0.8 },
  cardFooter: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  addr: { color: '#778DA9', fontSize: 12 },
  more: { color: '#C9B47F', fontWeight: '600', fontSize: 13 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
  loadTxt: { color: '#778DA9', marginTop: 12, fontSize: 14 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTxt: { color: '#E0E1DD', fontSize: 18, fontWeight: '600', marginBottom: 8 },
  emptySub: { color: '#778DA9', fontSize: 13 },
  profileBtn: {
    width:36, height:36, borderRadius:18,
    backgroundColor:'#1B263B', alignItems:'center',
    justifyContent:'center', borderWidth:1, borderColor:'#C9B47F44'
  },
  profileBtnTxt: { fontSize:16 },
});