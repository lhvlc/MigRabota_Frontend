import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, ScrollView, TextInput,
  ActivityIndicator } from 'react-native';

const API = 'https://asap-horeca-backend-k6q2.onrender.com';

export default function WalletScreen({ route, navigation }) {
  const { user } = route.params;
  const isEmployer = user.role === 'B2B';
  const [balance, setBalance] = useState(0);
  const [earnings, setEarnings] = useState(0);
  const [history, setHistory] = useState([]);
  const [amount, setAmount] = useState('');
  const [card, setCard] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [balRes, histRes] = await Promise.all([
        fetch(`${API}/balance/${user.id}`).then(r => r.json()),
        fetch(`${API}/balance/${user.id}/history`).then(r => r.json()),
      ]);
      setBalance(balRes.balance || 0);
      setEarnings(balRes.earnings || 0);
      setHistory(Array.isArray(histRes) ? histRes : []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleTopUp = async () => {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      setError('Укажи сумму пополнения'); return;
    }
    setActionLoading(true); setError('');
    try {
      const res = await fetch(`${API}/balance/${user.id}/topup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: Number(amount) })
      }).then(r => r.json());
      if (res.success) {
        setBalance(res.newBalance);
        setMsg(`✅ Баланс пополнен на ${amount}₽`);
        setAmount('');
        await loadData();
      } else { setError(res.error); }
    } catch { setError('Ошибка соединения'); }
    finally { setActionLoading(false); }
  };

  const handleWithdraw = async () => {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      setError('Укажи сумму вывода'); return;
    }
    setActionLoading(true); setError('');
    try {
      const res = await fetch(`${API}/balance/${user.id}/withdraw`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: Number(amount), cardNumber: card })
      }).then(r => r.json());
      if (res.success) {
        setMsg(res.message);
        setAmount('');
        await loadData();
      } else { setError(res.error); }
    } catch { setError('Ошибка соединения'); }
    finally { setActionLoading(false); }
  };

  const typeLabel = (type) => ({
    TOPUP: '💳 Пополнение', PAYMENT: '💰 Заработок',
    WITHDRAW: '📤 Вывод', RESERVE: '🔒 Резерв',
    REFUND: '↩️ Возврат',
  }[type] || type);

  if (loading) return (
    <SafeAreaView style={S.safe}>
      <ActivityIndicator color='#C9B47F' size='large' style={{marginTop:100}}/>
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={S.safe}>
      <ScrollView contentContainerStyle={S.container}>

        <View style={S.topBar}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={S.back}>← Назад</Text>
          </TouchableOpacity>
          <Text style={S.title}>Кошелёк</Text>
          <View style={{width:60}}/>
        </View>

        <View style={S.balanceCard}>
          <Text style={S.balLbl}>
            {isEmployer ? 'Баланс' : 'Заработано'}
          </Text>
          <Text style={S.balAmount}>
            {isEmployer ? balance.toFixed(2) : earnings.toFixed(2)} ₽
          </Text>
          {isEmployer && (
            <Text style={S.balNote}>
              Средства списываются при создании смены
            </Text>
          )}
        </View>

        {msg ? (
          <View style={S.msgBox}>
            <Text style={S.msgTxt}>{msg}</Text>
          </View>
        ) : null}
        {error ? (
          <View style={S.errBox}>
            <Text style={S.errTxt}>⚠️ {error}</Text>
          </View>
        ) : null}

        <View style={S.actionCard}>
          <Text style={S.actionTitle}>
            {isEmployer ? 'Пополнить баланс' : 'Вывести средства'}
          </Text>

          {!isEmployer && (
            <TextInput style={S.inp}
              placeholder="Номер карты"
              placeholderTextColor="#778DA9"
              keyboardType="numeric"
              value={card} onChangeText={setCard}/>
          )}

          <TextInput style={S.inp}
            placeholder="Сумма в рублях"
            placeholderTextColor="#778DA9"
            keyboardType="numeric"
            value={amount} onChangeText={v => { setAmount(v); setError(''); setMsg(''); }}/>

          {isEmployer ? (
            <TouchableOpacity style={S.btn}
              onPress={handleTopUp} disabled={actionLoading}>
              {actionLoading
                ? <ActivityIndicator color="#0D1B2A"/>
                : <Text style={S.btnTxt}>💳 Пополнить</Text>}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={[S.btn, S.btnGreen]}
              onPress={handleWithdraw} disabled={actionLoading}>
              {actionLoading
                ? <ActivityIndicator color="#fff"/>
                : <Text style={S.btnTxt}>📤 Вывести на карту</Text>}
            </TouchableOpacity>
          )}
        </View>

        {history.length > 0 && (
          <View>
            <Text style={S.histTitle}>ИСТОРИЯ ОПЕРАЦИЙ</Text>
            {history.map(t => (
              <View key={t.id} style={S.histRow}>
                <View style={{flex:1}}>
                  <Text style={S.histType}>{typeLabel(t.type)}</Text>
                  <Text style={S.histDesc}>{t.description}</Text>
                  <Text style={S.histDate}>
                    {new Date(t.createdAt).toLocaleString('ru-RU')}
                  </Text>
                </View>
                <Text style={[S.histAmount,
                  t.type === 'WITHDRAW' || t.type === 'RESERVE'
                    ? S.histMinus : S.histPlus]}>
                  {t.type === 'WITHDRAW' || t.type === 'RESERVE' ? '-' : '+'}
                  {Number(t.amount).toFixed(0)}₽
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  safe: { flex:1, backgroundColor:'#0D1B2A' },
  container: { padding:20, paddingBottom:40 },
  topBar: { flexDirection:'row', justifyContent:'space-between',
    alignItems:'center', marginBottom:24, marginTop:8 },
  back: { color:'#778DA9', fontSize:14 },
  title: { fontSize:18, fontWeight:'700', color:'#E0E1DD' },
  balanceCard: { backgroundColor:'#1B263B', borderRadius:20,
    padding:24, alignItems:'center', marginBottom:20,
    borderWidth:1.5, borderColor:'#C9B47F44' },
  balLbl: { color:'#778DA9', fontSize:14, marginBottom:8 },
  balAmount: { fontSize:52, fontWeight:'900', color:'#C9B47F' },
  balNote: { color:'#778DA9', fontSize:11, marginTop:8, textAlign:'center' },
  msgBox: { backgroundColor:'#1D9E7522', borderRadius:10,
    padding:12, marginBottom:14, borderWidth:1, borderColor:'#1D9E7544' },
  msgTxt: { color:'#1D9E75', fontSize:13, textAlign:'center' },
  errBox: { backgroundColor:'#E2444422', borderRadius:10,
    padding:12, marginBottom:14, borderWidth:1, borderColor:'#E2444444' },
  errTxt: { color:'#E24444', fontSize:13 },
  actionCard: { backgroundColor:'#1B263B', borderRadius:16,
    padding:16, marginBottom:24 },
  actionTitle: { fontSize:14, fontWeight:'600', color:'#E0E1DD', marginBottom:14 },
  inp: { backgroundColor:'#0D1B2A', color:'#E0E1DD',
    padding:14, borderRadius:12, fontSize:15,
    marginBottom:12, borderWidth:1, borderColor:'#263550' },
  btn: { backgroundColor:'#C9B47F', padding:16,
    borderRadius:12, alignItems:'center' },
  btnGreen: { backgroundColor:'#1D9E75' },
  btnTxt: { color:'#0D1B2A', fontWeight:'800', fontSize:15 },
  histTitle: { color:'#778DA9', fontSize:11, letterSpacing:1.5,
    fontWeight:'600', marginBottom:12 },
  histRow: { backgroundColor:'#1B263B', borderRadius:12,
    padding:14, marginBottom:8, flexDirection:'row', alignItems:'center' },
  histType: { color:'#E0E1DD', fontWeight:'600', fontSize:14, marginBottom:3 },
  histDesc: { color:'#778DA9', fontSize:12, marginBottom:3 },
  histDate: { color:'#778DA9', fontSize:11 },
  histAmount: { fontSize:18, fontWeight:'900' },
  histPlus: { color:'#1D9E75' },
  histMinus: { color:'#E24444' },
});