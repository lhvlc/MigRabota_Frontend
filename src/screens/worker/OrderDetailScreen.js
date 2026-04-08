import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, Alert, ActivityIndicator } from 'react-native';
import { applyToOrder } from '../../services/api';

export default function OrderDetailScreen({ route, navigation }) {
  const { order, user } = route.params;
  const [applied, setApplied] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleApply = async () => {
    if (applied) return;
    setLoading(true);
    try {
      await applyToOrder(order.id, user.uid || user.id);
      setApplied(true);
      Alert.alert('✅ Отклик отправлен!', 'Работодатель получит уведомление');
    } catch (e) {
      Alert.alert('Ошибка', 'Не удалось откликнуться');
    } finally { setLoading(false); }
  };

  return (
    <SafeAreaView style={S.safe}>
      <View style={S.container}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={S.back}>
          <Text style={S.backTxt}>← Назад</Text>
        </TouchableOpacity>

        <View style={S.badge}>
          <Text style={S.badgeTxt}>🔥 ГОРЯЩАЯ СМЕНА</Text>
        </View>

        <Text style={S.role}>{order.role}</Text>
        <Text style={S.pay}>{order.pay} ₽</Text>

        <View style={S.infoBox}>
          <Text style={S.infoLabel}>Заведение</Text>
          <Text style={S.infoVal}>{order.establishment}</Text>
          <Text style={S.infoLabel}>Адрес</Text>
          <Text style={S.infoVal}>{order.address}</Text>
          {order.description ? (
            <>
              <Text style={S.infoLabel}>Требования</Text>
              <Text style={S.infoVal}>{order.description}</Text>
            </>
          ) : null}
        </View>

        <TouchableOpacity
          style={[S.btn, applied && S.btnDone]}
          onPress={handleApply}
          disabled={applied || loading}>
          {loading
            ? <ActivityIndicator color="#0D1B2A" />
            : <Text style={S.btnTxt}>
                {applied ? '✓ Отклик отправлен' : 'Откликнуться на смену'}
              </Text>}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0D1B2A' },
  container: { flex: 1, padding: 24 },
  back: { marginTop: 8, marginBottom: 20 },
  backTxt: { color: '#778DA9', fontSize: 14 },
  badge: { backgroundColor: '#C9B47F22', borderRadius: 8, paddingHorizontal: 12,
    paddingVertical: 6, alignSelf: 'flex-start', marginBottom: 16 },
  badgeTxt: { color: '#C9B47F', fontSize: 12, fontWeight: '700' },
  role: { fontSize: 32, fontWeight: '800', color: '#E0E1DD', marginBottom: 6 },
  pay: { fontSize: 40, fontWeight: '900', color: '#C9B47F', marginBottom: 28 },
  infoBox: { backgroundColor: '#1B263B', borderRadius: 16, padding: 18, marginBottom: 32 },
  infoLabel: { color: '#778DA9', fontSize: 12, marginTop: 10, marginBottom: 2 },
  infoVal: { color: '#E0E1DD', fontSize: 15 },
  btn: { backgroundColor: '#C9B47F', padding: 20, borderRadius: 16, alignItems: 'center' },
  btnDone: { backgroundColor: '#1D9E75' },
  btnTxt: { color: '#0D1B2A', fontWeight: '800', fontSize: 17 },
});