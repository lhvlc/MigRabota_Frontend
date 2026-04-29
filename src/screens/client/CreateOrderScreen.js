import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, ActivityIndicator, ScrollView, Modal, Platform,
} from 'react-native';
import { createOrder } from '../../services/api';
 
const ROLES = [
  'Бариста', 'Официант', 'Повар', 'Хостес', 'Мойщик посуды',
  'Монтажник', 'Демонтажник', 'Разнорабочий', 'Грузчик',
];
 
// Генерируем список дней (сегодня + 13 дней вперёд)
const getDays = () => {
  const days = [];
  const now = new Date();
  const weekDays = ['Вс','Пн','Вт','Ср','Чт','Пт','Сб'];
  const months = ['янв','фев','мар','апр','май','июн','июл','авг','сен','окт','ноя','дек'];
  for (let i = 0; i < 14; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() + i);
    days.push({
      date: d,
      label: i === 0 ? 'Сегодня' : i === 1 ? 'Завтра'
        : `${weekDays[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]}`,
      short: `${d.getDate()} ${months[d.getMonth()]}`,
    });
  }
  return days;
};
 
// Генерируем список часов 00:00 - 23:00
const getHours = () => {
  const hours = [];
  for (let h = 0; h < 24; h++) {
    for (let m of [0, 30]) {
      hours.push(`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`);
    }
  }
  return hours;
};
 
const DAYS = getDays();
const HOURS = getHours();
 
// Комбинируем дату и время в ISO строку
const buildDateTime = (dayObj, timeStr) => {
  const d = new Date(dayObj.date);
  const [h, m] = timeStr.split(':').map(Number);
  d.setHours(h, m, 0, 0);
  return d.toISOString();
};
 
// Picker Modal — общий компонент
function PickerModal({ visible, title, items, selected, onSelect, onClose }) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={PM.overlay} activeOpacity={1} onPress={onClose}>
        <View style={PM.sheet}>
          <View style={PM.header}>
            <Text style={PM.title}>{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={PM.close}>Готово</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={PM.list} showsVerticalScrollIndicator={false}>
            {items.map((item, idx) => {
              const label = typeof item === 'string' ? item : item.label;
              const isOn = label === selected || item === selected;
              return (
                <TouchableOpacity key={idx} style={[PM.item, isOn && PM.itemOn]}
                  onPress={() => { onSelect(item); onClose(); }}>
                  <Text style={[PM.itemTxt, isOn && PM.itemTxtOn]}>{label}</Text>
                  {isOn && <Text style={PM.check}>✓</Text>}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}
 
export default function CreateOrderScreen({ route, navigation }) {
  const user = route?.params?.user || {};
  const [role, setRole] = useState('Бариста');
  const [address, setAddress] = useState(user.address || '');
  const [pay, setPay] = useState('');
  const [desc, setDesc] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
 
  // Дата и время
  const [startDay, setStartDay] = useState(DAYS[0]);
  const [startTime, setStartTime] = useState('09:00');
  const [endDay, setEndDay] = useState(DAYS[0]);
  const [endTime, setEndTime] = useState('18:00');

// Пикеры
  const [showStartDay, setShowStartDay] = useState(false);
  const [showStartTime, setShowStartTime] = useState(false);
  const [showEndDay, setShowEndDay] = useState(false);
  const [showEndTime, setShowEndTime] = useState(false);
 
  const showError = (msg) => {
    setError(msg);
    setTimeout(() => setError(''), 4000);
  };
 
  const handleCreate = async () => {
    setError(''); setSuccess('');
 
    if (!address.trim()) { showError('Укажи адрес заведения'); return; }
    if (!pay.trim() || isNaN(Number(pay))) { showError('Укажи оплату (только цифры)'); return; }
 
    const startISO = buildDateTime(startDay, startTime);
    const endISO = buildDateTime(endDay, endTime);
 
    if (new Date(endISO) <= new Date(startISO)) {
      showError('Время окончания должно быть позже начала'); return;
    }
 
    const creatorId = user.id || user.uid;
    if (!creatorId) { showError('Ошибка: войди снова'); return; }
 
    setLoading(true);
    try {
      const shift = await createOrder({
        role,
        establishment: user.companyName || user.name || 'Заведение',
        address: address.trim(),
        pay: parseInt(pay),
        description: desc.trim() || null,
        startTime: startISO,
        endTime: endISO,
        creatorId,
      });
 
      if (shift?.id) {
        setSuccess('✅ Смена опубликована!');
        setTimeout(() => navigation.replace('OrderWaiting', { shift, user }), 1000);
      } else if (shift?.error) {
        showError('Ошибка: ' + shift.error);
      } else {
        showError('Не удалось создать смену');
      }
    } catch (e) {
      showError('Нет соединения с сервером');
    } finally {
      setLoading(false);
    }
  };
 
  // Считаем длительность смены
  const getDuration = () => {
    try {
      const start = new Date(buildDateTime(startDay, startTime));
      const end = new Date(buildDateTime(endDay, endTime));
      const diff = (end - start) / 1000 / 60;
      if (diff <= 0) return null;
      const h = Math.floor(diff / 60);
      const m = diff % 60;
      return m > 0 ? `${h} ч ${m} мин` : `${h} ч`;
    } catch { return null; }
  };
 
  const duration = getDuration();
 
  return (
    <SafeAreaView style={S.safe}>
      <ScrollView contentContainerStyle={S.container}>
 
        <View style={S.topBar}>
          <TouchableOpacity onPress={() => navigation.navigate('EmployerProfile', { user })}>
            <Text style={S.backTxt}>← Профиль</Text>
          </TouchableOpacity>
          <Text style={S.title}>Создать смену</Text>
        </View>
 
        <Text style={S.sub}>Заполни — уведомление уйдёт всем свободным</Text>
 
        {error ? (
          <View style={S.errorBox}><Text style={S.errorTxt}>⚠️ {error}</Text></View>
        ) : null}
        {success ? (
          <View style={S.successBox}><Text style={S.successTxt}>{success}</Text></View>
        ) : null}
 
        {/* Должность */}
        <Text style={S.lbl}>Должность</Text>
        <View style={S.rolesRow}>
          {ROLES.map(r => (
            <TouchableOpacity key={r}
              style={[S.roleChip, role === r && S.roleChipOn]}
              onPress={() => setRole(r)}>
              <Text style={[S.roleChipTxt, role === r && S.roleChipTxtOn]}>{r}</Text>
            </TouchableOpacity>
          ))}
        </View>


{/* Адрес */}
        <Text style={S.lbl}>Адрес заведения</Text>
        <TextInput style={S.inp} placeholder="ул. Ленина, 12"
          placeholderTextColor="#778DA9"
          value={address} onChangeText={setAddress}/>
 
        {/* Дата и время начала */}
        <Text style={S.lbl}>Начало смены</Text>
        <View style={S.timeRow}>
          <TouchableOpacity style={S.timePicker} onPress={() => setShowStartDay(true)}>
            <Text style={S.timeIcon}>📅</Text>
            <View>
              <Text style={S.timeLabel}>Дата</Text>
              <Text style={S.timeValue}>{startDay.short}</Text>
            </View>
            <Text style={S.timeArrow}>›</Text>
          </TouchableOpacity>
 
          <TouchableOpacity style={S.timePicker} onPress={() => setShowStartTime(true)}>
            <Text style={S.timeIcon}>🕐</Text>
            <View>
              <Text style={S.timeLabel}>Время</Text>
              <Text style={S.timeValue}>{startTime}</Text>
            </View>
            <Text style={S.timeArrow}>›</Text>
          </TouchableOpacity>
        </View>
 
        {/* Дата и время конца */}
        <Text style={S.lbl}>Конец смены</Text>
        <View style={S.timeRow}>
          <TouchableOpacity style={S.timePicker} onPress={() => setShowEndDay(true)}>
            <Text style={S.timeIcon}>📅</Text>
            <View>
              <Text style={S.timeLabel}>Дата</Text>
              <Text style={S.timeValue}>{endDay.short}</Text>
            </View>
            <Text style={S.timeArrow}>›</Text>
          </TouchableOpacity>
 
          <TouchableOpacity style={S.timePicker} onPress={() => setShowEndTime(true)}>
            <Text style={S.timeIcon}>🕐</Text>
            <View>
              <Text style={S.timeLabel}>Время</Text>
              <Text style={S.timeValue}>{endTime}</Text>
            </View>
            <Text style={S.timeArrow}>›</Text>
          </TouchableOpacity>
        </View>
 
        {/* Длительность */}
        {duration && (
          <View style={S.durationBox}>
            <Text style={S.durationTxt}>⏱ Длительность смены: {duration}</Text>
          </View>
        )}
 
        {/* Оплата */}
        <Text style={S.lbl}>Оплата за смену (₽)</Text>
        <TextInput style={S.inp} placeholder="2000"
          placeholderTextColor="#778DA9"
          keyboardType="numeric"
          value={pay} onChangeText={setPay}/>
 
        {/* Описание */}
        <Text style={S.lbl}>Требования (необязательно)</Text>
        <TextInput style={[S.inp, S.inpTall]}
          placeholder="Опыт от 1 года..."
          placeholderTextColor="#778DA9"
          multiline value={desc} onChangeText={setDesc}/>
 
        <TouchableOpacity style={[S.btn, loading && S.btnDisabled]}
          onPress={handleCreate} disabled={loading}>
          {loading
            ? <ActivityIndicator color="#0D1B2A"/>
            : <Text style={S.btnTxt}>🔥 Опубликовать смену</Text>}
        </TouchableOpacity>
 
      </ScrollView>
 
      {/* Пикеры */}
      <PickerModal
        visible={showStartDay} title="Дата начала"
        items={DAYS} selected={startDay.label}
        onSelect={(d) => { setStartDay(d); setEndDay(d); }}
        onClose={() => setShowStartDay(false)}/>
 
      <PickerModal
        visible={showStartTime} title="Время начала"
        items={HOURS} selected={startTime}
        onSelect={(t) => setStartTime(t)}
        onClose={() => setShowStartTime(false)}/>
 
      <PickerModal
        visible={showEndDay} title="Дата окончания"
        items={DAYS} selected={endDay.label}
        onSelect={(d) => setEndDay(d)}
        onClose={() => setShowEndDay(false)}/>
 
      <PickerModal
        visible={showEndTime} title="Время окончания"
        items={HOURS} selected={endTime}
        onSelect={(t) => setEndTime(t)}
        onClose={() => setShowEndTime(false)}/>
 
    </SafeAreaView>
  );
}
 
const S = StyleSheet.create({
  safe: { flex:1, backgroundColor:'#0D1B2A' },
  container: { padding:24, paddingBottom:60 },
  topBar: { flexDirection:'row', alignItems:'center',


justifyContent:'space-between', marginBottom:6, marginTop:8 },
  backTxt: { color:'#778DA9', fontSize:14 },
  title: { fontSize:22, fontWeight:'800', color:'#E0E1DD' },
  sub: { fontSize:13, color:'#778DA9', marginBottom:20 },
  errorBox: { backgroundColor:'#E2444422', borderRadius:10,
    padding:12, marginBottom:14, borderWidth:1, borderColor:'#E2444455' },
  errorTxt: { color:'#E24444', fontSize:13 },
  successBox: { backgroundColor:'#1D9E7522', borderRadius:10,
    padding:12, marginBottom:14, borderWidth:1, borderColor:'#1D9E7555' },
  successTxt: { color:'#1D9E75', fontSize:13, fontWeight:'600' },
  lbl: { fontSize:12, color:'#778DA9', marginBottom:8,
    marginTop:16, letterSpacing:0.5 },
  rolesRow: { flexDirection:'row', flexWrap:'wrap', gap:8 },
  roleChip: { backgroundColor:'#1B263B', borderRadius:20,
    paddingHorizontal:14, paddingVertical:8,
    borderWidth:1, borderColor:'#263550' },
  roleChipOn: { borderColor:'#C9B47F', backgroundColor:'#C9B47F22' },
  roleChipTxt: { color:'#778DA9', fontSize:13 },
  roleChipTxtOn: { color:'#C9B47F', fontWeight:'600' },
  // Время
  timeRow: { flexDirection:'row', gap:10 },
  timePicker: { flex:1, backgroundColor:'#1B263B', borderRadius:14,
    padding:14, flexDirection:'row', alignItems:'center',
    borderWidth:1, borderColor:'#263550', gap:10 },
  timeIcon: { fontSize:22 },
  timeLabel: { color:'#778DA9', fontSize:11, marginBottom:2 },
  timeValue: { color:'#E0E1DD', fontSize:16, fontWeight:'700' },
  timeArrow: { color:'#778DA9', fontSize:20, marginLeft:'auto' },
  durationBox: { backgroundColor:'#C9B47F18', borderRadius:10,
    padding:12, marginTop:10, borderWidth:1, borderColor:'#C9B47F33' },
  durationTxt: { color:'#C9B47F', fontSize:13, fontWeight:'600' },
  inp: { backgroundColor:'#1B263B', color:'#E0E1DD',
    padding:16, borderRadius:12, fontSize:15,
    borderWidth:1, borderColor:'#263550' },
  inpTall: { height:80, textAlignVertical:'top' },
  btn: { backgroundColor:'#C9B47F', padding:20,
    borderRadius:16, alignItems:'center', marginTop:28 },
  btnDisabled: { opacity:0.6 },
  btnTxt: { color:'#0D1B2A', fontWeight:'800', fontSize:17 },
});
 
// Стили для PickerModal
const PM = StyleSheet.create({
  overlay: { flex:1, backgroundColor:'rgba(0,0,0,0.6)',
    justifyContent:'flex-end' },
  sheet: { backgroundColor:'#1B263B', borderTopLeftRadius:24,
    borderTopRightRadius:24, maxHeight:'70%' },
  header: { flexDirection:'row', justifyContent:'space-between',
    alignItems:'center', padding:20,
    borderBottomWidth:1, borderBottomColor:'#263550' },
  title: { color:'#E0E1DD', fontSize:17, fontWeight:'700' },
  close: { color:'#C9B47F', fontSize:15, fontWeight:'600' },
  list: { paddingHorizontal:8, paddingBottom:20 },
  item: { padding:16, borderRadius:12, marginVertical:2,
    flexDirection:'row', alignItems:'center' },
  itemOn: { backgroundColor:'#C9B47F18' },
  itemTxt: { color:'#E0E1DD', fontSize:16, flex:1 },
  itemTxtOn: { color:'#C9B47F', fontWeight:'700' },
  check: { color:'#C9B47F', fontSize:18, fontWeight:'700' },
});