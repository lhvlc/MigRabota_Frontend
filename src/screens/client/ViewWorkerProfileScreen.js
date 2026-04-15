import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, ScrollView, ActivityIndicator } from 'react-native';
import { getWorkerProfile } from '../../services/api';

export default function ViewWorkerProfileScreen({ route, navigation }) {
  const { workerId, workerName } = route.params;
  const [worker, setWorker] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadProfile(); }, []);

  const loadProfile = async () => {
    try {
      const data = await getWorkerProfile(workerId);
      setWorker(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const score = worker?.aiScore ?? 0;
  const scoreColor = score >= 80 ? '#C9B47F' : score >= 60 ? '#2ECC71' : '#E24444';
  const initials = (worker?.name || workerName || 'АК')
    .split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  if (loading) return (
    <SafeAreaView style={S.safe}>
      <ActivityIndicator color='#C9B47F' size='large' style={{marginTop:100}}/>
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={S.safe}>
      <ScrollView contentContainerStyle={S.container}>

        <TouchableOpacity onPress={() => navigation.goBack()} style={S.back}>
          <Text style={S.backTxt}>← Назад</Text>
        </TouchableOpacity>

        <View style={S.avatarWrap}>
          <View style={[S.avatar, {borderColor: scoreColor}]}>
            <Text style={S.avatarTxt}>{initials}</Text>
          </View>
        </View>

        <Text style={S.name}>{worker?.name || workerName}</Text>
        <Text style={S.email}>{worker?.email}</Text>

        <View style={S.scoreCard}>
          <Text style={S.scoreLbl}>AI Score</Text>
          <View style={S.scoreRow}>
            <Text style={[S.scoreNum, {color: scoreColor}]}>{score}</Text>
            <Text style={S.scoreMax}> /100</Text>
          </View>
          <View style={S.statsRow}>
            <View style={S.statBox}>
              <Text style={S.statNum}>{worker?.totalShifts || 0}</Text>
              <Text style={S.statLbl}>смен выполнено</Text>
            </View>
            <View style={S.statBox}>
              <Text style={S.statNum}>{worker?.ratingCount || 0}</Text>
              <Text style={S.statLbl}>оценок получено</Text>
            </View>
          </View>
        </View>

        <View style={S.infoCard}>
          {worker?.experience ? (
            <View style={S.infoRow}>
              <Text style={S.infoIcon}>💼</Text>
              <View>
                <Text style={S.infoLbl}>Опыт</Text>
                <Text style={S.infoVal}>{worker.experience}</Text>
              </View>
            </View>
          ) : null}
          {worker?.address ? (
            <>
              <View style={S.div}/>
              <View style={S.infoRow}>
                <Text style={S.infoIcon}>📍</Text>
                <View>
                  <Text style={S.infoLbl}>Локация</Text>
                  <Text style={S.infoVal}>{worker.address}</Text>
                </View>
              </View>
            </>
          ) : null}
          {worker?.phone ? (
            <>
              <View style={S.div}/>
              <View style={S.infoRow}>
                <Text style={S.infoIcon}>📱</Text>
                <View>
                  <Text style={S.infoLbl}>Телефон</Text>
                  <Text style={S.infoVal}>{worker.phone}</Text>
                </View>
              </View>
            </>
          ) : null}
        </View>

        {/* Кнопки "Оценить" здесь НЕТ — только через OrderWaiting */}

      </ScrollView>
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  safe: { flex:1, backgroundColor:'#0D1B2A' },
  container: { padding:20, paddingBottom:40 },
  back: { marginBottom:20, marginTop:8 },
  backTxt: { color:'#778DA9', fontSize:14 },
  avatarWrap: { alignItems:'center', marginBottom:14 },
  avatar: { width:100, height:100, borderRadius:50, backgroundColor:'#1B263B',
    alignItems:'center', justifyContent:'center', borderWidth:3 },
  avatarTxt: { fontSize:36, fontWeight:'700', color:'#E0E1DD' },
  name: { fontSize:26, fontWeight:'800', color:'#E0E1DD',
    textAlign:'center', marginBottom:4 },
  email: { fontSize:13, color:'#778DA9', textAlign:'center', marginBottom:20 },
  scoreCard: { backgroundColor:'#1B263B', borderRadius:20,
    padding:20, alignItems:'center', marginBottom:20,
    borderWidth:1, borderColor:'#C9B47F33' },
  scoreLbl: { color:'#778DA9', fontSize:13, marginBottom:8 },
  scoreRow: { flexDirection:'row', alignItems:'flex-end', marginBottom:12 },
  scoreNum: { fontSize:64, fontWeight:'900', lineHeight:70 },
  scoreMax: { fontSize:20, color:'#778DA9', marginBottom:8 },
  statsRow: { flexDirection:'row', gap:12 },
  statBox: { alignItems:'center', backgroundColor:'#0D1B2A',
    borderRadius:12, padding:12, minWidth:100 },
  statNum: { fontSize:24, fontWeight:'800', color:'#C9B47F' },
  statLbl: { fontSize:11, color:'#778DA9', marginTop:2, textAlign:'center' },
  infoCard: { backgroundColor:'#1B263B', borderRadius:16,
    padding:16, marginBottom:20, borderWidth:1, borderColor:'#263550' },
  infoRow: { flexDirection:'row', alignItems:'center',
    gap:14, paddingVertical:10 },
  infoIcon: { fontSize:20 },
  infoLbl: { color:'#778DA9', fontSize:12, marginBottom:2 },
  infoVal: { color:'#E0E1DD', fontSize:15, fontWeight:'500' },
  div: { height:1, backgroundColor:'#263550' },
});