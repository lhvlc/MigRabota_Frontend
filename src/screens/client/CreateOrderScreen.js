import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, SafeAreaView, ActivityIndicator, ScrollView } from 'react-native';
import { createOrder } from '../../services/api';

const ROLES = ['Бариста', 'Официант', 'Повар', 'Хостес', 'Мойщик посуды'];

export default function CreateOrderScreen({ route, navigation }) {
  const user = route?.params?.user || {};
  const [role, setRole] = useState('');
  const [address, setAddress] = useState(user.address || '');
  const [pay, setPay] = useState('');
  const [desc, setDesc] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!role || !address.trim() || !pay.trim()) {
      Alert.alert('Ошибка', 'Выбери должность, адрес и укажи оплату');
      return;
    }
    setLoading(true);
    try {
      const shift = await createOrder({
        role,
        establishment: user.name || 'Заведение',
        address: address.trim(),
        pay: parseInt(pay),
        description: desc.trim(),
        startTime: new Date().toISOString(),
        creatorId: user.uid || user.id,
      });
      if (shift?.id) {
        navigation.replace('OrderWaiting', { shift, user });
      } else {
        Alert.alert('Ошибка', 'Не удалось создать смену');
      }
    } catch (e) {
      Alert.alert('Ошибка соединения', 'Проверь интернет');
    } finally { setLoading(false); }
  };

  return (
    <SafeAreaView style={S.safe}>
      <ScrollView style={S.scroll} contentContainerStyle={S.container}>
        <Text style={S.title}>Создать смену</Text>
        <Text style={S.sub}>Заполни — уведомление уйдёт всем свободным</Text>

        <Text style={S.label}>Должность</Text>
        <View style={S.rolesRow}>
          {ROLES.map(r => (
            <TouchableOpacity key={r} style={[S.roleChip, role === r && S.roleChipOn]}
              onPress={() => setRole(r)}>
              <Text style={[S.roleChipTxt, role === r && S.roleChipTxtOn]}>{r}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={S.label}>Адрес заведения</Text>
        <TextInput style={S.input} placeholder="ул. Ленина, 12"
          placeholderTextColor="#778DA9" value={address} onChangeText={setAddress} />

        <Text style={S.label}>Оплата за смену (₽)</Text>
        <TextInput style={S.input} placeholder="2000"
          placeholderTextColor="#778DA9" keyboardType="numeric"
          value={pay} onChangeText={setPay} />

        <Text style={S.label}>Требования (необязательно)</Text>
        <TextInput style={[S.input, S.inputTall]} placeholder="Опыт от 1 года, знание кассы..."
          placeholderTextColor="#778DA9" multiline value={desc} onChangeText={setDesc} />

        <TouchableOpacity style={S.btn} onPress={handleCreate} disabled={loading}>
          {loading
            ? <ActivityIndicator color="#0D1B2A" />
            : <Text style={S.btnTxt}>🔥 Опубликовать смену</Text>}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0D1B2A' },
  scroll: { flex: 1 },
  container: { padding: 24, paddingBottom: 40 },
  title: { fontSize: 26, fontWeight: '800', color: '#E0E1DD', marginBottom: 6, marginTop: 8 },
  sub: { fontSize: 13, color: '#778DA9', marginBottom: 28 },
  label: { fontSize: 13, color: '#778DA9', marginBottom: 8, marginTop: 18 },
  rolesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  roleChip: { backgroundColor: '#1B263B', borderRadius: 20, paddingHorizontal: 14,
    paddingVertical: 8, borderWidth: 1, borderColor: '#1B263B' },
  roleChipOn: { borderColor: '#C9B47F', backgroundColor: '#C9B47F22' },
  roleChipTxt: { color: '#778DA9', fontSize: 13 },
  roleChipTxtOn: { color: '#C9B47F', fontWeight: '600' },
  input: { backgroundColor: '#1B263B', color: '#E0E1DD', padding: 16,
    borderRadius: 12, fontSize: 15 },
  inputTall: { height: 80, textAlignVertical: 'top' },
  btn: { backgroundColor: '#C9B47F', padding: 20, borderRadius: 16,
    alignItems: 'center', marginTop: 32},
  btnTxt: { color: '#0D1B2A', fontWeight: '800', fontSize: 17 },
});