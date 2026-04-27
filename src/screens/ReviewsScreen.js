import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, ScrollView, ActivityIndicator,
  TextInput, Image, Alert, Platform, Modal } from 'react-native';

const API = 'https://asap-horeca-backend-k6q2.onrender.com';

export default function ReviewsScreen({ route, navigation }) {
  const { targetUserId, targetName, currentUser, canReview } = route.params;
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [stars, setStars] = useState(0);
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [fullPhoto, setFullPhoto] = useState(null); // для просмотра аватарки

  useEffect(() => { loadReviews(); }, []);

  const loadReviews = async () => {
    try {
      const res = await fetch(`${API}/reviews/${targetUserId}`);
      const data = await res.json();
      setReviews(Array.isArray(data) ? data : []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const submitReview = async () => {
    if (!currentUser?.id) {
      Alert.alert('Ошибка', 'Войди в аккаунт чтобы оставить отзыв');
      return;
    }
    if (!stars) { Alert.alert('Выбери оценку'); return; }
    if (!text.trim()) { Alert.alert('Напиши отзыв'); return; }

    setSubmitting(true);
    try {
      const res = await fetch(`${API}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromUserId: currentUser.id,
          toUserId: targetUserId,
          text: text.trim(),
          stars,
        })
      });
      const data = await res.json();
      if (res.status === 409) {
        Alert.alert('❌', data.error || 'Вы уже оставляли отзыв');
        setShowForm(false);
        return;
      }
      if (data.id) {
        setShowForm(false);
        setStars(0);
        setText('');
        await loadReviews();
        Alert.alert('✅ Отзыв отправлен!');
      } else {
        Alert.alert('Ошибка', data.error || 'Не удалось отправить');
      }
    } catch (e) { console.error(e); }
    finally { setSubmitting(false); }
  };

  const deleteReview = async (reviewId) => {
    Alert.alert('Удалить отзыв?', 'Это действие нельзя отменить', [
      { text: 'Отмена', style: 'cancel' },
      { text: 'Удалить', style: 'destructive', onPress: async () => {
        try {
          const res = await fetch(`${API}/reviews/${reviewId}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fromUserId: currentUser?.id }),
          });
          const data = await res.json();
          if (data.success) {
            await loadReviews();
            Alert.alert('✅ Отзыв удалён');
          } else {
            Alert.alert('Ошибка', data.error || 'Не удалось удалить');
          }
        } catch (e) { console.error(e); }
      }}
    ]);
  };

  const avgStars = reviews.length
    ? (reviews.reduce((s, r) => s + r.stars, 0) / reviews.length).toFixed(1)
    : 0;

  return (
    <SafeAreaView style={S.safe}>
      <ScrollView contentContainerStyle={S.container}>

        <TouchableOpacity onPress={() => navigation.goBack()} style={S.back}>
          <Text style={S.backTxt}>← Назад</Text>
        </TouchableOpacity>

        <Text style={S.title}>Отзывы о {targetName}</Text>

        {reviews.length > 0 && (
          <View style={S.avgCard}>
            <Text style={S.avgNum}>{avgStars}</Text>
            <Text style={S.avgStars}>
              {'⭐'.repeat(Math.round(Number(avgStars)))}
            </Text>
            <Text style={S.avgCount}>{reviews.length} отзывов</Text>
          </View>
        )}

        {canReview && !showForm && (
          <TouchableOpacity style={S.addBtn}
            onPress={() => setShowForm(true)}>
            <Text style={S.addBtnTxt}>✍️ Написать отзыв</Text>
          </TouchableOpacity>
        )}

        {showForm && (
          <View style={S.formCard}><Text style={S.formTitle}>Твой отзыв</Text>
            <View style={S.starsRow}>
              {[1,2,3,4,5].map(s => (
                <TouchableOpacity key={s} onPress={() => setStars(s)}>
                  <Text style={[S.star, s <= stars && S.starOn]}>⭐</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput style={S.textInput}
              placeholder="Напиши свой отзыв..."
              placeholderTextColor="#778DA9"
              value={text}
              onChangeText={setText}
              multiline
              numberOfLines={4}/>
            <View style={{flexDirection:'row', gap:10}}>
              <TouchableOpacity style={[S.submitBtn, {flex:1}]}
                onPress={submitReview} disabled={submitting}>
                {submitting
                  ? <ActivityIndicator color="#0D1B2A"/>
                  : <Text style={S.submitTxt}>Отправить</Text>}
              </TouchableOpacity>
              <TouchableOpacity style={[S.cancelBtn, {flex:1}]}
                onPress={() => setShowForm(false)}>
                <Text style={S.cancelTxt}>Отмена</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {loading ? (
          <ActivityIndicator color='#C9B47F' size='large' style={{marginTop:40}}/>
        ) : reviews.length === 0 ? (
          <View style={S.empty}>
            <Text style={S.emptyIcon}>💬</Text>
            <Text style={S.emptyTxt}>Отзывов пока нет</Text>
            <Text style={S.emptySub}>Будь первым кто оставит отзыв!</Text>
          </View>
        ) : (
          reviews.map(r => (
            <View key={r.id} style={S.reviewCard}>
              <View style={S.reviewHeader}>

                {/* Аватарка — нажимаемая для просмотра полного фото */}
                <TouchableOpacity
                  onPress={() => r.fromPhoto && setFullPhoto(r.fromPhoto)}
                  activeOpacity={r.fromPhoto ? 0.7 : 1}>
                  {r.fromPhoto ? (
                    <Image
                      source={{ uri: r.fromPhoto }}
                      style={S.reviewAvatarImg}/>
                  ) : (
                    <View style={S.reviewAvatar}>
                      <Text style={S.reviewAvatarTxt}>
                        {(r.fromName || 'А').charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>

                <View style={{flex:1}}>
                  <Text style={S.reviewName}>{r.fromName || 'Аноним'}</Text>
                  <Text style={S.reviewRole}>
                    {r.fromRole === 'B2C' ? '👤 Соискатель' : '🏢 Работодатель'}
                  </Text>
                </View>
                <Text style={S.reviewStars}>{'⭐'.repeat(r.stars)}</Text>

                {/* Кнопка удаления — только для автора отзыва */}
                {currentUser?.id === r.fromUserId && (
                  <TouchableOpacity
                    style={S.deleteBtn}
                    onPress={() => deleteReview(r.id)}>
                    <Text style={S.deleteTxt}>🗑️</Text>
                  </TouchableOpacity>
                )}
              </View>

              <Text style={S.reviewText}>{r.text}</Text>
              <Text style={S.reviewDate}>
                {new Date(r.createdAt).toLocaleDateString('ru-RU')}
              </Text>
            </View>
          ))
        )}
      </ScrollView>

      {/* Модальное окно для просмотра полной аватарки */}
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
        </TouchableOpacity></Modal>

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
  back: { marginBottom:16, marginTop:8 },
  backTxt: { color:'#778DA9', fontSize:14 },
  title: { fontSize:22, fontWeight:'800', color:'#E0E1DD', marginBottom:20 },
  avgCard: { backgroundColor:'#1B263B', borderRadius:16,
    padding:20, alignItems:'center', marginBottom:16,
    borderWidth:1, borderColor:'#C9B47F33' },
  avgNum: { fontSize:48, fontWeight:'900', color:'#C9B47F' },
  avgStars: { fontSize:20, marginVertical:6 },
  avgCount: { color:'#778DA9', fontSize:13 },
  addBtn: { backgroundColor:'#1B263B', borderRadius:14,
    padding:16, alignItems:'center', marginBottom:16,
    borderWidth:1, borderColor:'#C9B47F44' },
  addBtnTxt: { color:'#C9B47F', fontWeight:'700', fontSize:15 },
  formCard: { backgroundColor:'#1B263B', borderRadius:16,
    padding:16, marginBottom:16, borderWidth:1, borderColor:'#263550' },
  formTitle: { color:'#E0E1DD', fontWeight:'700', fontSize:16, marginBottom:12 },
  starsRow: { flexDirection:'row', gap:8, marginBottom:12, justifyContent:'center' },
  star: { fontSize:32, opacity:0.3 },
  starOn: { opacity:1 },
  textInput: { backgroundColor:'#0D1B2A', color:'#E0E1DD',
    borderRadius:12, padding:14, fontSize:14, minHeight:80,
    borderWidth:1, borderColor:'#263550', marginBottom:12,
    textAlignVertical:'top' },
  submitBtn: { backgroundColor:'#C9B47F', padding:14,
    borderRadius:12, alignItems:'center' },
  submitTxt: { color:'#0D1B2A', fontWeight:'800', fontSize:14 },
  cancelBtn: { backgroundColor:'#1B263B', padding:14,
    borderRadius:12, alignItems:'center',
    borderWidth:1, borderColor:'#263550' },
  cancelTxt: { color:'#778DA9', fontSize:14 },
  empty: { alignItems:'center', paddingTop:40 },
  emptyIcon: { fontSize:40, marginBottom:12 },
  emptyTxt: { color:'#E0E1DD', fontSize:18, fontWeight:'600', marginBottom:6 },
  emptySub: { color:'#778DA9', fontSize:13 },
  reviewCard: { backgroundColor:'#1B263B', borderRadius:14,
    padding:16, marginBottom:12, borderWidth:1, borderColor:'#263550' },
  reviewHeader: { flexDirection:'row', alignItems:'center', gap:12, marginBottom:10 },
  reviewAvatar: { width:44, height:44, borderRadius:22, backgroundColor:'#0D1B2A',
    alignItems:'center', justifyContent:'center' },
  reviewAvatarImg: { width:44, height:44, borderRadius:22 },
  reviewAvatarTxt: { color:'#C9B47F', fontWeight:'700', fontSize:18 },
  reviewName: { color:'#E0E1DD', fontWeight:'600', fontSize:14 },
  reviewRole: { color:'#778DA9', fontSize:12 },
  reviewStars: { fontSize:14 },
  reviewText: { color:'#E0E1DD', fontSize:14, lineHeight:20, marginBottom:8 },
  reviewDate: { color:'#778DA9', fontSize:11 },
  deleteBtn: { padding:6, marginLeft:4 },
  deleteTxt: { fontSize:18 },
  // Модальное окно для просмотра аватарки
  photoModal: { flex:1, backgroundColor:'rgba(0,0,0,0.92)',
    alignItems:'center', justifyContent:'center' },
  fullPhoto: { width:320, height:320, borderRadius:16 },
  photoModalHint: { color:'#778DA9', fontSize:13, marginTop:20 },
});