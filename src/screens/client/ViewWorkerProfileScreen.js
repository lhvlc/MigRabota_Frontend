import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, ScrollView, ActivityIndicator,
  Image, Platform, Modal } from 'react-native';
import { getWorkerProfile } from '../../services/api';
 
export default function ViewWorkerProfileScreen({ route, navigation }) {
  const { workerId, workerName, currentUser } = route.params;
  const [worker, setWorker] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fullPhoto, setFullPhoto] = useState(null);
 
  useEffect(() => { loadProfile(); }, []);
 
  const loadProfile = async () => {
    try {
      if (!workerId) { setLoading(false); return; }
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
 
        {/* Аватарка — кликабельная для просмотра полного фото */}
        <View style={S.avatarWrap}>
          <TouchableOpacity
            onPress={() => worker?.photoUrl && setFullPhoto(worker.photoUrl)}
            activeOpacity={worker?.photoUrl ? 0.7 : 1}>
            {worker?.photoUrl ? (
              <Image
                source={{ uri: worker.photoUrl }}
                style={[S.avatarImg, { borderColor: scoreColor }]}/>
            ) : (
              <View style={[S.avatar, { borderColor: scoreColor }]}>
                <Text style={S.avatarTxt}>{initials}</Text>
              </View>
            )}
            {worker?.photoUrl && (
              <View style={S.photoHint}>
                <Text style={S.photoHintTxt}>👁️</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
 
        <Text style={S.name}>{worker?.name || workerName}</Text>
        <Text style={S.email}>{worker?.email}</Text>
 
        {/* Рейтинг соискателя */}
        <View style={S.scoreCard}>
          <Text style={S.scoreLbl}>Рейтинг соискателя</Text>
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
              <View


style={S.infoRow}>
                <Text style={S.infoIcon}>📱</Text>
                <View>
                  <Text style={S.infoLbl}>Телефон</Text>
                  <Text style={S.infoVal}>{worker.phone}</Text>
                </View>
              </View>
            </>
          ) : null}
          {worker?.specialties ? (
            <>
              <View style={S.div}/>
              <View style={S.infoRow}>
                <Text style={S.infoIcon}>🎯</Text>
                <View>
                  <Text style={S.infoLbl}>Специальности</Text>
                  <Text style={S.infoVal}>{worker.specialties}</Text>
                </View>
              </View>
            </>
          ) : null}
        </View>
 
        {/* Отзывы — только просмотр, canReview: false */}
        <TouchableOpacity style={S.reviewsBtn}
          onPress={() => navigation.navigate('Reviews', {
            targetUserId: worker?.id || workerId,
            targetName: worker?.name || workerName,
            currentUser: currentUser || route.params?.currentUser || route.params?.user,
            canReview: false,
          })}>
          <Text style={S.reviewsBtnTxt}>💬 Отзывы о соискателе</Text>
        </TouchableOpacity>
 
        {/* Документы — только просмотр */}
        <TouchableOpacity style={S.docsBtn}
          onPress={() => navigation.navigate('Documents', {
            user: worker,
            readOnly: true,
          })}>
          <Text style={S.docsBtnTxt}>📁 Документы соискателя</Text>
        </TouchableOpacity>
 
      </ScrollView>
 
      {/* Модальное окно просмотра аватарки */}
      <Modal
        visible={fullPhoto !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setFullPhoto(null)}>
        <TouchableOpacity
          style={S.photoModal}
          activeOpacity={1}
          onPress={() => setFullPhoto(null)}>
          {fullPhoto && (
            <Image
              source={{ uri: fullPhoto }}
              style={S.fullPhoto}
              resizeMode="contain"/>
          )}
          <Text style={S.photoModalHint}>Нажми чтобы закрыть</Text>
        </TouchableOpacity>
      </Modal>
 
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
  avatarWrap: { alignItems:'center', marginBottom:14 },
  avatar: { width:100, height:100, borderRadius:50, backgroundColor:'#1B263B',
    alignItems:'center', justifyContent:'center', borderWidth:3 },
  avatarImg: { width:100, height:100, borderRadius:50, borderWidth:3 },
  avatarTxt: { fontSize:36, fontWeight:'700', color:'#E0E1DD' },
  photoHint: { position:'absolute', bottom:0, right:0,
    width:26, height:26, borderRadius:13, backgroundColor:'#0D1B2A',
    alignItems:'center', justifyContent:'center',
    borderWidth:2, borderColor:'#1B263B' },
  photoHintTxt: { fontSize:13 },
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
    padding:16, marginBottom:20, borderWidth:1,


borderColor:'#263550' },
  infoRow: { flexDirection:'row', alignItems:'center',
    gap:14, paddingVertical:10 },
  infoIcon: { fontSize:20 },
  infoLbl: { color:'#778DA9', fontSize:12, marginBottom:2 },
  infoVal: { color:'#E0E1DD', fontSize:15, fontWeight:'500' },
  div: { height:1, backgroundColor:'#263550' },
  reviewsBtn: { backgroundColor:'#1B263B', borderRadius:14,
    padding:16, alignItems:'center', marginBottom:12,
    borderWidth:1, borderColor:'#C9B47F44' },
  reviewsBtnTxt: { color:'#C9B47F', fontWeight:'700', fontSize:15 },
  docsBtn: { backgroundColor:'#1B263B', borderRadius:14,
    padding:16, alignItems:'center',
    borderWidth:1, borderColor:'#378ADD44' },
  docsBtnTxt: { color:'#378ADD', fontWeight:'700', fontSize:15 },
  photoModal: { flex:1, backgroundColor:'rgba(0,0,0,0.92)',
    alignItems:'center', justifyContent:'center' },
  fullPhoto: { width:320, height:320, borderRadius:16 },
  photoModalHint: { color:'#778DA9', fontSize:13, marginTop:20 },
});