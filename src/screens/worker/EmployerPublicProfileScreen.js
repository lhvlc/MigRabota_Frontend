import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, ScrollView, ActivityIndicator, Image, Platform } from 'react-native';

const API = 'https://asap-horeca-backend-k6q2.onrender.com';

export default function EmployerPublicProfileScreen({ route, navigation }) {
  const { employerId, employerName, currentUser } = route.params;
  const [employer, setEmployer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [canReview, setCanReview] = useState(false);

  useEffect(() => {
    loadProfile();
    if (currentUser?.id) checkCanReview();
  }, []);

  const loadProfile = async () => {
    try {
      const res = await fetch(`${API}/users/${employerId}`);
      const data = await res.json();
      setEmployer(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  // Проверяем есть ли завершённая смена между текущим соискателем и этим работодателем
  const checkCanReview = async () => {
    try {
      const res = await fetch(`${API}/applications/completed?seekerId=${currentUser.id}&employerId=${employerId}`);
      const data = await res.json();
      setCanReview(data.hasCompleted === true);
    } catch (e) {
      // Если эндпоинт не работает — разрешим писать отзыв (fallback)
      setCanReview(true);
    }
  };

  const score = employer?.employerRating
    ? Math.round(employer.employerRating * 20) : 0;
  const scoreColor = score >= 80 ? '#C9B47F' : score >= 60 ? '#2ECC71' : '#778DA9';
  const initials = (employer?.companyName || employer?.name || employerName || 'КО')
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

        <Text style={S.badge}>🏢 РАБОТОДАТЕЛЬ</Text>

        {/* Аватарка — фото если есть, иначе инициалы */}
        <View style={S.avatarWrap}>
          {employer?.photoUrl ? (
            <Image
              source={{ uri: employer.photoUrl }}
              style={[S.avatarImg, { borderColor: scoreColor }]}/>
          ) : (
            <View style={[S.avatar, { borderColor: scoreColor }]}>
              <Text style={S.avatarTxt}>{initials}</Text>
            </View>
          )}
        </View>

        <Text style={S.name}>
          {employer?.companyName || employer?.name || employerName}
        </Text>

        <View style={S.scoreCard}>
          <Text style={S.scoreLbl}>Рейтинг работодателя</Text>
          <View style={S.scoreRow}>
            <Text style={[S.scoreNum, {color: scoreColor}]}>{score}</Text>
            <Text style={S.scoreMax}> /100</Text>
          </View>
          <View style={S.statsRow}>
            <View style={S.statBox}>
              <Text style={S.statNum}>{employer?.employerRatingCount || 0}</Text>
              <Text style={S.statLbl}>отзывов</Text>
            </View>
            <View style={S.statBox}>
              <Text style={S.statNum}>{employer?.yearsOnMarket || 0}</Text>
              <Text style={S.statLbl}>лет на рынке</Text>
            </View>
          </View>
        </View>

        <View style={S.infoCard}>
          {employer?.responsibleName ? (
            <View style={S.infoRow}>
              <Text style={S.infoIcon}>👤</Text>
              <View>
                <Text style={S.infoLbl}>Ответственный</Text>
                <Text style={S.infoVal}>{employer.responsibleName}</Text>
              </View>
            </View>
          ) : null}
          {employer?.location || employer?.address ? (
            <>
              <View style={S.div}/>
              <View style={S.infoRow}>
                <Text style={S.infoIcon}>📍</Text>
                <View>
                  <Text style={S.infoLbl}>Место дислокации</Text>
                  <Text style={S.infoVal}>{employer.location || employer.address}</Text>
                </View>
              </View>
            </>
          ) : null}
        </View>

        {/* Отзывы — только если была завершённая смена */}
        <TouchableOpacity style={S.reviewsBtn}
          onPress={() => navigation.navigate('Reviews', {
            targetUserId: employerId,
            targetName: employer?.companyName || employer?.name || employerName,
            currentUser: currentUser || route.params?.user,
            canReview,
          })}>
          <Text style={S.reviewsBtnTxt}>💬 Отзывы о заведении</Text>
        </TouchableOpacity>

        {!canReview && (
          <Text style={S.reviewHint}>
            ℹ️ Отзыв можно оставить после завершённой смены
          </Text>
        )}

        {/* Документы — только просмотр (readOnly) */}
        <TouchableOpacity style={S.docsBtn}
          onPress={() => navigation.navigate('Documents', {
            user: employer,
            readOnly: true,
          })}>
          <Text style={S.docsBtnTxt}>📁 Документы заведения</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  safe: { flex:1, backgroundColor:'#0D1B2A',
    paddingTop: Platform.OS === 'android' ? 35 : 0 },
  container: { padding:20, paddingBottom:40 },
  back: { marginBottom:16, marginTop:8 },
  backTxt: { color:'#778DA9', fontSize:14 },
  badge: { color:'#378ADD', fontSize:12, fontWeight:'700',
    letterSpacing:1, marginBottom:16 },
  avatarWrap: { alignItems:'center', marginBottom:14 },
  avatar: { width:100, height:100, borderRadius:50, backgroundColor:'#1B263B',
    alignItems:'center', justifyContent:'center', borderWidth:3 },
  avatarImg: { width:100, height:100, borderRadius:50, borderWidth:3 },
  avatarTxt: { fontSize:36, fontWeight:'700', color:'#E0E1DD' },
  name: { fontSize:24, fontWeight:'800', color:'#E0E1DD',
    textAlign:'center', marginBottom:20 },
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
  statLbl: { fontSize:11, color:'#778DA9', marginTop:2 },
  infoCard: { backgroundColor:'#1B263B', borderRadius:16,
    padding:16, borderWidth:1, borderColor:'#263550', marginBottom:16 },
  infoRow: { flexDirection:'row', alignItems:'center',
    gap:14, paddingVertical:10 },
  infoIcon: { fontSize:20 },
  infoLbl: { color:'#778DA9', fontSize:12, marginBottom:2 },
  infoVal: { color:'#E0E1DD', fontSize:15, fontWeight:'500' },
  div: { height:1, backgroundColor:'#263550' },
  reviewsBtn: { backgroundColor:'#1B263B', borderRadius:14,
    padding:16, alignItems:'center', marginBottom:8,
    borderWidth:1, borderColor:'#C9B47F44' },
  reviewsBtnTxt: { color:'#C9B47F', fontWeight:'700', fontSize:15 },
  reviewHint: { color:'#778DA9', fontSize:12, textAlign:'center',
    marginBottom:12 },
  docsBtn: { backgroundColor:'#1B263B', borderRadius:14,
    padding:16, alignItems:'center', marginTop:4,
    borderWidth:1, borderColor:'#378ADD44' },
  docsBtnTxt: { color:'#378ADD', fontWeight:'700', fontSize:15 },
});