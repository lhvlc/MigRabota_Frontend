import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, ScrollView, ActivityIndicator,
  TextInput, Image, Alert, Platform, Modal, FlatList } from 'react-native';

const API = 'https://asap-horeca-backend-k6q2.onrender.com';

const completeShift = async (applicationId) => {
  const res = await fetch(`${API}/applications/${applicationId}/complete`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }
  });
  return res.json();
};

const rateApplication = async (applicationId, stars, comment) => {
  const res = await fetch(`${API}/applications/${applicationId}/rate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ stars, comment })
  });
  return res.json();
};

const getApplicants = async (shiftId) => {
  const res = await fetch(`${API}/shifts/${shiftId}/applicants`);
  return res.json();
};

const acceptApplicant = async (applicationId) => {
  const res = await fetch(`${API}/applications/${applicationId}/accept`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }
  });
  return res.json();
};

const COMMENTS = [
  'Отличная работа!', 'Опоздал на смену', 'Не пришёл на смену',
  'Не выполнял обязанности', 'Хорошо справился', 'Рекомендую'
];

export default function OrderWaitingScreen({ route, navigation }) {
  const { shift, user } = route.params;
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(null);
  const [ratingModal, setRatingModal] = useState(null);
  const [selectedStars, setSelectedStars] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [rated, setRated] = useState({});

  useEffect(() => {
    load();
    const t = setInterval(load, 10000);
    return () => clearInterval(t);
  }, []);

  const load = async () => {
    try {
      const data = await getApplicants(shift.id);
      setApplicants(Array.isArray(data) ? data : []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleAccept = async (item) => {
    try { 
      await acceptApplicant(item.id); 
      await load(); 
    } catch (e) { 
      console.error(e); 
    }
  };

  const handleComplete = async (item) => {
    setCompleting(item.id);
    try {
      await completeShift(item.id);
      await load();
    } catch (e) { 
      console.error(e); 
    } finally { 
      setCompleting(null); 
    }
  };

  const openRating = (item) => {
    setRatingModal(item);
    setSelectedStars(0);
    setComment('');
  };

  const submitRating = async () => {
    if (!selectedStars) return;
    setSubmitting(true);
    try {
      await rateApplication(ratingModal.id, selectedStars, comment);
      setRated(r => ({ ...r, [ratingModal.id]: selectedStars }));
      setRatingModal(null);
    } catch (e) { console.error(e); }
    finally { setSubmitting(false); }
  };

  const openProfile = (item) => {
    navigation.navigate('ViewWorkerProfile', {
      workerId: item.seeker?.id,
      workerName: item.seeker?.name,
      currentUser: user,
    });
  };

  const cancelShift = async () => {
    try {
      const res = await fetch(`${API}/shifts/${shift.id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (data.success) {
        Alert.alert('✅ Смена отменена', 'Средства возвращены на баланс');
        navigation.navigate('EmployerProfile', { user });
      }
    } catch (e) { console.error(e); }
  };

  const renderApplicant = ({ item }) => {
    const isRated = !!rated[item.id] || !!item.rating;
    return (
      <View style={S.card}>
        <View style={S.cardLeft}>
          <TouchableOpacity onPress={() => openProfile(item)}>
            <Text style={S.name}>
              {item.seeker?.name || 'Без имени'}
              <Text style={S.profileLink}> · Профиль →</Text>
            </Text>
          </TouchableOpacity>
          <Text style={S.email}>{item.seeker?.email}</Text>
          <View style={S.scoreRow}>
            <Text style={S.scoreLbl}>Рейтинг соискателя: </Text>
            <Text style={S.scoreVal}>{item.seeker?.aiScore ?? 0}</Text>
          </View>
          {item.status === 'COMPLETED' && isRated && (
            <Text style={S.ratedTxt}>
              {'⭐'.repeat(rated[item.id] || item.rating || 0)} Оценено
            </Text>
          )}
          {item.comment ? (
            <Text style={S.commentTxt}>💬 {item.comment}</Text>
          ) : null}
        </View>
        <View style={S.actions}>
          {item.status === 'PENDING' && (
            <TouchableOpacity style={S.acceptBtn} onPress={() => handleAccept(item)}>
              <Text style={S.acceptTxt}>Принять</Text>
            </TouchableOpacity>
          )}
          {item.status === 'APPROVED' && (
            <TouchableOpacity
              style={S.completeBtn}
              disabled={completing === item.id}
              onPress={() => handleComplete(item)}>
              {completing === item.id
                ? <ActivityIndicator color="#fff" size="small"/>
                : <Text style={S.completeTxt}>🏁 Завершить</Text>}
            </TouchableOpacity>
          )}
          {item.status === 'COMPLETED' && !isRated && !item.rating && (
            <TouchableOpacity style={S.rateBtn} onPress={() => openRating(item)}>
              <Text style={S.rateTxt}>⭐ Оценить</Text>
            </TouchableOpacity>
          )}
          {item.status === 'COMPLETED' && isRated && (
            <View style={S.doneBadge}>
              <Text style={S.doneTxt}>✓ Готово</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={S.safe}>
      <View style={S.container}>
        <View style={S.topBar}>
          <TouchableOpacity onPress={() => navigation.navigate('EmployerProfile', { user })}>
            <Text style={S.backTxt}>← Профиль</Text>
          </TouchableOpacity>
          <TouchableOpacity style={S.newBtn}
            onPress={() => navigation.navigate('CreateOrder', { user })}>
            <Text style={S.newBtnTxt}>+ Новая смена</Text>
          </TouchableOpacity>
        </View>

        <View style={S.shiftInfo}>
          <View style={{flex:1}}>
            <Text style={S.shiftRole}>{shift.role}</Text>
            <Text style={S.shiftAddr}>📍 {shift.address}</Text>
          </View>
          <Text style={S.shiftPay}>{shift.pay?.toLocaleString()} ₽</Text>
        </View>

        {shift.status === 'OPEN' && (
          <TouchableOpacity style={S.cancelShiftBtn} onPress={cancelShift}>
            <Text style={S.cancelShiftTxt}>❌ Отменить смену</Text>
          </TouchableOpacity>
        )}

        <View style={S.sectionRow}>
          <Text style={S.section}>КАНДИДАТЫ</Text>
          {applicants.length > 0 &&
            <Text style={S.count}>{applicants.length} чел.</Text>}
        </View>

        {loading ? (
          <ActivityIndicator color='#C9B47F' size='large' style={{marginTop:40}}/>
        ) : applicants.length === 0 ? (
          <View style={S.empty}>
            <Text style={S.emptyIcon}>⏳</Text>
            <Text style={S.emptyTxt}>Ждём откликов...</Text>
            <Text style={S.emptySub}>Обновление каждые 10 секунд</Text>
          </View>
        ) : (
          <FlatList data={applicants} keyExtractor={i => i.id}
            renderItem={renderApplicant} showsVerticalScrollIndicator={false}/>
        )}
      </View>

      <Modal visible={ratingModal !== null} transparent animationType="slide">
        <View style={S.overlay}>
          <View style={S.modalBox}>
            <Text style={S.modalTitle}>
              Оценить {ratingModal?.seeker?.name}
            </Text>
            <Text style={S.modalSub}>Как прошла смена?</Text>

            <View style={S.starsRow}>
              {[1,2,3,4,5].map(star => (
                <TouchableOpacity key={star} onPress={() => setSelectedStars(star)}>
                  <Text style={[S.star,
                    star <= selectedStars && S.starActive]}>⭐</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={S.commentLbl}>Комментарий (необязательно)</Text>
            <View style={S.quickComments}>
              {COMMENTS.map(c => (
                <TouchableOpacity key={c}
                  style={[S.quickBtn, comment === c && S.quickBtnOn]}
                  onPress={() => setComment(comment === c ? '' : c)}>
                  <Text style={[S.quickTxt, comment === c && S.quickTxtOn]}>
                    {c}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput style={S.commentInput}
              placeholder="Или напиши свой комментарий..."
              placeholderTextColor="#778DA9"
              value={comment}
              onChangeText={setComment}
              multiline/>

            <TouchableOpacity
              style={[S.submitBtn, !selectedStars && S.submitDisabled]}
              disabled={!selectedStars || submitting}
              onPress={submitRating}>
              {submitting
                ? <ActivityIndicator color="#0D1B2A"/>
                : <Text style={S.submitTxt}>
                    {selectedStars ? `Отправить ${selectedStars}⭐` : 'Выбери оценку'}
                  </Text>}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setRatingModal(null)} style={S.cancelBtn}>
              <Text style={S.cancelTxt}>Отмена</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  safe: { 
    flex: 1, 
    backgroundColor: '#0D1B2A',
    paddingTop: Platform.OS === 'android' ? 35 : 0  // ← добавь это
  },
  container: { flex:1, padding:20 },
  topBar: { flexDirection:'row', justifyContent:'space-between',
    alignItems:'center', marginBottom:16, marginTop:8 },
  backTxt: { color:'#778DA9', fontSize:14 },
  newBtn: { backgroundColor:'#1B263B', borderRadius:10,
    paddingHorizontal:14, paddingVertical:8, borderWidth:1, borderColor:'#C9B47F44' },
  newBtnTxt: { color:'#C9B47F', fontWeight:'600', fontSize:13 },
  shiftInfo: { backgroundColor:'#1B263B', borderRadius:16,
    padding:16, flexDirection:'row', alignItems:'center', marginBottom:20 },
  shiftRole: { color:'#E0E1DD', fontWeight:'700', fontSize:18, marginBottom:4 },
  shiftAddr: { color:'#778DA9', fontSize:12 },
  shiftPay: { color:'#C9B47F', fontWeight:'900', fontSize:22 },
  sectionRow: { flexDirection:'row', justifyContent:'space-between',
    alignItems:'center', marginBottom:12 },
  section: { color:'#778DA9', fontSize:11, letterSpacing:1.5, fontWeight:'600' },
  count: { color:'#C9B47F', fontSize:12, fontWeight:'600' },
  card: { backgroundColor:'#1B263B', borderRadius:14, padding:16,
    marginBottom:10, flexDirection:'row', alignItems:'flex-start' },
  cardLeft: { flex:1 },
  name: { color:'#E0E1DD', fontWeight:'700', fontSize:16, marginBottom:3 },
  profileLink: { color:'#C9B47F', fontSize:13, fontWeight:'400' },
  email: { color:'#778DA9', fontSize:12, marginBottom:6 },
  scoreRow: { flexDirection:'row', alignItems:'center', marginBottom:4 },
  scoreLbl: { color:'#778DA9', fontSize:12 },
  scoreVal: { color:'#C9B47F', fontWeight:'700', fontSize:14 },
  ratedTxt: { color:'#C9B47F', fontSize:11, marginTop:4 },
  commentTxt: { color:'#778DA9', fontSize:11, marginTop:3, fontStyle:'italic' },
  actions: { alignItems:'center', gap:8, marginLeft:8 },
  acceptBtn: { backgroundColor:'#C9B47F', borderRadius:10,
    paddingHorizontal:14, paddingVertical:10 },
  acceptTxt: { color:'#0D1B2A', fontWeight:'700', fontSize:13 },
  completeBtn: { backgroundColor:'#2ECC71', borderRadius:10,
    paddingHorizontal:12, paddingVertical:10 },
  completeTxt: { color:'#fff', fontWeight:'700', fontSize:13 },
  rateBtn: { backgroundColor:'#C9B47F22', borderRadius:8,
    paddingHorizontal:10, paddingVertical:6, borderWidth:1, borderColor:'#C9B47F44' },
  rateTxt: { color:'#C9B47F', fontSize:12, fontWeight:'600' },
  doneBadge: { backgroundColor:'#1D9E7522', borderRadius:8,
    paddingHorizontal:8, paddingVertical:6, borderWidth:1, borderColor:'#1D9E7544' },
  doneTxt: { color:'#1D9E75', fontSize:12, fontWeight:'600' },
  empty: { flex:1, alignItems:'center', justifyContent:'center', paddingTop:60 },
  emptyIcon: { fontSize:48, marginBottom:16 },
  emptyTxt: { color:'#E0E1DD', fontSize:18, fontWeight:'600', marginBottom:8 },
  emptySub: { color:'#778DA9', fontSize:13 },
  overlay: { flex:1, backgroundColor:'rgba(0,0,0,0.8)',
    justifyContent:'flex-end' },
  modalBox: { backgroundColor:'#1B263B', borderTopLeftRadius:24,
    borderTopRightRadius:24, padding:24, paddingBottom:40 },
  modalTitle: { fontSize:20, fontWeight:'800', color:'#E0E1DD', marginBottom:6 },
  modalSub: { color:'#778DA9', fontSize:14, marginBottom:16 },
  starsRow: { flexDirection:'row', gap:10, marginBottom:20, justifyContent:'center' },
  star: { fontSize:36, opacity:0.3 },
  starActive: { opacity:1 },
  commentLbl: { color:'#778DA9', fontSize:12, marginBottom:8 },
  quickComments: { flexDirection:'row', flexWrap:'wrap', gap:6, marginBottom:12 },
  quickBtn: { backgroundColor:'#0D1B2A', borderRadius:20,
    paddingHorizontal:12, paddingVertical:7,
    borderWidth:1, borderColor:'#263550' },
  quickBtnOn: { borderColor:'#C9B47F', backgroundColor:'#C9B47F22' },
  quickTxt: { color:'#778DA9', fontSize:12 },
  quickTxtOn: { color:'#C9B47F' },
  commentInput: { backgroundColor:'#0D1B2A', color:'#E0E1DD',
    borderRadius:12, padding:14, fontSize:14, minHeight:60,
    borderWidth:1, borderColor:'#263550', marginBottom:16,
    textAlignVertical:'top' },
  submitBtn: { backgroundColor:'#C9B47F', padding:18,
    borderRadius:14, alignItems:'center', marginBottom:10 },
  submitDisabled: { opacity:0.4 },
  submitTxt: { color:'#0D1B2A', fontWeight:'800', fontSize:16 },
  cancelBtn: { alignItems:'center', padding:10 },
  cancelTxt: { color:'#778DA9', fontSize:14 },
  cancelShiftBtn: { backgroundColor:'#E2444422', borderRadius:12,
  padding:14, alignItems:'center', marginBottom:16,
  borderWidth:1, borderColor:'#E2444444' },
  cancelShiftTxt: { color:'#E24444', fontWeight:'700', fontSize:14 },
});