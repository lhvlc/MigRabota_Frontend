import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView,
  ActivityIndicator, TextInput, Image, Alert, Platform, FlatList, Modal } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { clearUser, saveUser } from '../../services/api';
 
const API = 'https://asap-horeca-backend-k6q2.onrender.com';
 
export default function EmployerProfileScreen({ route, navigation }) {
  const [user, setUser] = useState(route?.params?.user || {});
  const [myShifts, setMyShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [completedCount, setCompletedCount] = useState(0);
  const [photo, setPhoto] = useState(user.photoUrl || null);
  const [shiftFilter, setShiftFilter] = useState('ALL');
  const [fullPhoto, setFullPhoto] = useState(null);
  const [myReviews, setMyReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
 
  const [form, setForm] = useState({
    companyName: user.companyName || user.name || '',
    responsibleName: user.responsibleName || '',
    location: user.location || user.address || '',
    yearsOnMarket: user.yearsOnMarket?.toString() || '0',
  });
 
  useEffect(() => { loadData(); loadMyReviews(); }, []);
 
  const loadData = async () => {
    try {
      const userId = user.id || user.uid;
      const [allRes, completedRes, profileRes] = await Promise.all([
        fetch(`${API}/shifts/employer/${userId}`),
        fetch(`${API}/shifts/completed/${userId}`),
        fetch(`${API}/users/${userId}`),
      ]);
      if (allRes.ok) { const all = await allRes.json(); setMyShifts(Array.isArray(all)?all:[]); }
      if (completedRes.ok) { const data = await completedRes.json(); setCompletedCount(data.count||0); }
      if (profileRes.ok) {
        const profile = await profileRes.json();
        setForm({
          companyName: profile.companyName||profile.name||'',
          responsibleName: profile.responsibleName||'',
          location: profile.location||profile.address||'',
          yearsOnMarket: profile.yearsOnMarket?.toString()||'0',
        });
        if (profile.photoUrl && !profile.photoUrl.startsWith('blob:')) setPhoto(profile.photoUrl);
      }
    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  };
 
  const loadMyReviews = async () => {
    setReviewsLoading(true);
    try {
      const res = await fetch(`${API}/reviews/${user.id}`);
      const data = await res.json();
      setMyReviews(Array.isArray(data) ? data : []);
    } catch(e) { console.error(e); }
    finally { setReviewsLoading(false); }
  };
 
  const pickPhoto = async () => {
    try {
      if (Platform.OS === 'web') {
        const input = document.createElement('input');
        input.type = 'file'; input.accept = 'image/*';
        input.onchange = async (e) => {
          const file = e.target.files[0]; if (!file) return;
          const reader = new FileReader();
          reader.onload = (ev) => setPhoto(ev.target.result);
          reader.readAsDataURL(file);
        };
        input.click(); return;
      }
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') { Alert.alert('Нет доступа','Разреши доступ к фото'); return; }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing:true, aspect:[1,1], quality:0.2, base64:true });
      if (!result.canceled && result.assets[0].base64)
        setPhoto(`data:image/jpeg;base64,${result.assets[0].base64}`);
    } catch(e) { console.error(e); }
  };
 
  const handleAvatarPress = () => {
    if (editing) pickPhoto();
    else if (photo) setFullPhoto(photo);
  };
 
  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API}/users/${user.id}/profile`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.companyName, companyName: form.companyName,
          responsibleName: form.responsibleName,
          location: form.location, address: form.location,
          yearsOnMarket: parseInt(form.yearsOnMarket)||0,
          photoUrl: photo||null,
        })
      });
      const updated = await res.json();
      const newUser = {...user,...updated};
      setUser(newUser); await saveUser(newUser); setEditing(false);
      setSaveMsg('✅ Профиль сохранён!'); setTimeout(()=>setSaveMsg(''),3000);
    } catch(e) { setSaveMsg('❌ Ошибка сохранения'); }
    finally { setSaving(false); }
  };
 
  const handleLogout = async () => {
    await clearUser();
    navigation.reset({ index:0, routes:[{name:'RoleSelection'}] });
  };
 
  const rawScore = user.employerRating || 0;
  const score = Math.round(rawScore * 20);
  const scoreColor = score>=80?'#C9B47F':score>=60?'#2ECC71':'#778DA9';
  const scoreLabel = score>=80?'Отличный работодатель':score>=60?'Хороший работодатель':score>0?'Новый работодатель':'Нет оценок';
  const initials = (form.companyName||'КО').split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2);
  const filteredShifts = shiftFilter==='ALL'?myShifts:myShifts.filter(s=>s.status===shiftFilter);
  const avgStars = myReviews.length
    ? (myReviews.reduce((s,r)=>s+r.stars,0)/myReviews.length).toFixed(1) : null;
 
  const renderShift = ({ item }) => (
    <TouchableOpacity style={S.shiftCard}
      onPress={() => navigation.navigate('OrderWaiting', { shift: item, user })}>
      <View style={S.shiftTop}>
        <Text style={S.shiftRole}>{item.role}</Text>
        <Text style={S.shiftPay}>{item.pay?.toLocaleString()} ₽</Text>
      </View>
      <Text style={S.shiftAddr}>📍 {item.address}</Text>
      <View style={S.shiftFooter}>
        <View style={[S.statusDot,
          item.status==='OPEN'?S.statusOpen:item.status==='COMPLETED'?S.statusDone:S.statusClosed]}/>
        <Text style={S.statusTxt}>
          {item.status==='OPEN'?'Идёт поиск':item.status==='COMPLETED'?'Завершена':item.status==='CANCELLED'?'Отменена':'Закрыта'}
        </Text>
        <Text style={S.viewTxt}>Подробнее →</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={S.safe}>
      <ScrollView contentContainerStyle={S.container}>
 
        <View style={S.topBar}>
          <Text style={S.badge}>🏢 РАБОТОДАТЕЛЬ</Text>
          <View style={{flexDirection:'row',gap:12}}>
            {!editing&&<TouchableOpacity onPress={()=>setEditing(true)}>
              <Text style={S.editTxt}>✏️ Изменить</Text></TouchableOpacity>}
            <TouchableOpacity onPress={handleLogout}>
              <Text style={S.logoutTxt}>Выйти</Text></TouchableOpacity>
          </View>
        </View>
 
        {saveMsg?<View style={[S.msgBox,saveMsg.includes('✅')?S.msgGreen:S.msgRed]}>
          <Text style={S.msgTxt}>{saveMsg}</Text></View>:null}
 
        {/* Аватарка — кликабельная */}
        <View style={S.avatarWrap}>
          <TouchableOpacity onPress={handleAvatarPress} activeOpacity={0.8}>
            {photo?
              <Image source={{uri:photo}} style={[S.avatar,{borderColor:scoreColor}]}/>:
              <View style={[S.avatar,{borderColor:scoreColor}]}>
                <Text style={S.avatarTxt}>{initials}</Text></View>}
            {editing?
              <View style={S.photoBadgeBlue}><Text style={S.photoBadgeTxt}>📷</Text></View>:
              photo?<View style={S.photoBadgeDark}><Text style={S.photoBadgeTxt}>👁️</Text></View>:null}
          </TouchableOpacity>
        </View>
 
        {editing?
          <TextInput style={S.nameInput} value={form.companyName}
            onChangeText={v=>setForm({...form,companyName:v})}
            placeholder="Название заведения/компании" placeholderTextColor="#778DA9"/>:
          <Text style={S.companyName}>{form.companyName||'Название не указано'}</Text>}
 
        <View style={S.scoreCard}>
          <Text style={S.scoreLbl}>Рейтинг работодателя</Text>
          <View style={S.scoreRow}>
            <Text style={[S.scoreNum,{color:scoreColor}]}>{score}</Text>
            <Text style={S.scoreMax}> /100</Text>
          </View>
          <Text style={[S.scoreDesc,{color:scoreColor}]}>{scoreLabel}</Text>
          <View style={S.statsRow}>
            <View style={S.statBox}><Text style={S.statNum}>{completedCount}</Text>
              <Text style={S.statLbl}>закрыто смен</Text></View>
            <View style={S.statBox}><Text style={S.statNum}>{form.yearsOnMarket||0}</Text>
              <Text style={S.statLbl}>лет на рынке</Text></View>
            <View style={S.statBox}><Text style={S.statNum}>{myShifts.length}</Text>
              <Text style={S.statLbl}>смен создано</Text></View>
          </View>
        </View>
 
        <Text style={S.sectionTitle}>ИНФОРМАЦИЯ</Text>
        <View style={S.infoCard}>
          <View style={S.infoRow}>
            <Text style={S.infoIcon}>👤</Text>
            <View style={{flex:1}}>
              <Text style={S.infoLbl}>Имя ответственного</Text>
              {editing?<TextInput style={S.infoInput} value={form.responsibleName}
                onChangeText={v=>setForm({...form,responsibleName:v})}
                placeholder="Иван Иванов" placeholderTextColor="#778DA9"/>:
                <Text style={S.infoVal}>{form.responsibleName||'Не указано'}</Text>}
            </View>
          </View>
          <View style={S.infoDivider}/>
          <View style={S.infoRow}>
            <Text style={S.infoIcon}>📍</Text>
            <View style={{flex:1}}>
              <Text style={S.infoLbl}>Место дислокации</Text>
              {editing?<TextInput style={S.infoInput} value={form.location}
                onChangeText={v=>setForm({...form,location:v})}
                placeholder="Город, район" placeholderTextColor="#778DA9"/>:
                <Text style={S.infoVal}>{form.location||'Не указано'}</Text>}
            </View>
          </View>
          <View style={S.infoDivider}/>
          <View style={S.infoRow}>
            <Text style={S.infoIcon}>📅</Text>
            <View style={{flex:1}}>
              <Text style={S.infoLbl}>Лет на рынке</Text>
              {editing?<TextInput style={S.infoInput} value={form.yearsOnMarket}
                onChangeText={v=>setForm({...form,yearsOnMarket:v})}
                placeholder="5" placeholderTextColor="#778DA9" keyboardType="numeric"/>:
                <Text style={S.infoVal}>{form.yearsOnMarket||'0'} лет</Text>}
            </View>
          </View>
          <View style={S.infoDivider}/>
          <View style={S.infoRow}>
            <Text style={S.infoIcon}>✉️</Text>
            <View><Text style={S.infoLbl}>Email</Text>
              <Text style={S.infoVal}>{user.email||'Не указан'}</Text></View>
          </View>
        </View>
 
        {editing?(
          <View style={{flexDirection:'row',gap:10,marginBottom:16}}>
            <TouchableOpacity style={[S.saveBtn,{flex:1}]} onPress={handleSave} disabled={saving}>
              {saving?<ActivityIndicator color="#0D1B2A"/>:
                <Text style={S.saveBtnTxt}>💾 Сохранить</Text>}</TouchableOpacity>
            <TouchableOpacity style={[S.cancelBtn,{flex:1}]} onPress={()=>setEditing(false)}>
              <Text style={S.cancelBtnTxt}>Отмена</Text></TouchableOpacity>
          </View>
        ):null}
        
        {/* ═══ ОТЗЫВЫ ОБО МНЕ ═══ */}
        <View style={S.reviewsSection}>
          <View style={S.reviewsHeader}>
            <Text style={S.sectionTitle}>ОТЗЫВЫ ОБО МНЕ</Text>
            {avgStars&&<View style={S.avgBadge}>
              <Text style={S.avgBadgeTxt}>⭐ {avgStars}</Text></View>}
          </View>
          {reviewsLoading?<ActivityIndicator color='#C9B47F' style={{marginVertical:16}}/>:
            myReviews.length===0?(
              <View style={S.reviewsEmpty}>
                <Text style={S.reviewsEmptyTxt}>Отзывов пока нет</Text>
                <Text style={S.reviewsEmptySub}>Отзывы появятся после завершённых смен</Text>
              </View>
            ):(
              myReviews.map(r=>(
                <View key={r.id} style={S.reviewCard}>
                  <View style={S.reviewHeader2}>
                    <TouchableOpacity onPress={()=>r.fromPhoto&&setFullPhoto(r.fromPhoto)}>
                      {r.fromPhoto?
                        <Image source={{uri:r.fromPhoto}} style={S.reviewAvatar}/>:
                        <View style={S.reviewAvatarEmpty}>
                          <Text style={S.reviewAvatarTxt}>{(r.fromName||'А').charAt(0).toUpperCase()}</Text>
                        </View>}
                    </TouchableOpacity>
                    <View style={{flex:1}}>
                      <Text style={S.reviewName}>{r.fromName||'Аноним'}</Text>
                      <Text style={S.reviewRole}>{r.fromRole==='B2C'?'👤 Соискатель':'🏢 Работодатель'}</Text>
                    </View>
                    <Text style={S.reviewStars}>{'⭐'.repeat(r.stars)}</Text>
                  </View>
                  <Text style={S.reviewText}>{r.text}</Text>
                  <Text style={S.reviewDate}>{new Date(r.createdAt).toLocaleDateString('ru-RU')}</Text>
                </View>
              ))
            )
          }
        </View>
 
        <TouchableOpacity style={S.docsBtn}
          onPress={()=>navigation.navigate('Documents',{user})}>
          <Text style={S.docsBtnTxt}>📁 Документы</Text></TouchableOpacity>
 
        <TouchableOpacity style={S.walletBtn}
          onPress={()=>navigation.navigate('Wallet',{user})}>
          <Text style={S.walletBtnTxt}>💳 Кошелёк</Text></TouchableOpacity>
 
        <TouchableOpacity style={S.createBtn}
          onPress={()=>navigation.navigate('CreateOrder',{user})}>
          <Text style={S.createBtnTxt}>🔥 Создать новую смену</Text></TouchableOpacity>
 
        <View style={S.sectionRow}>
          <Text style={S.sectionTitle}>МОИ СМЕНЫ</Text>
          <Text style={S.count}>{myShifts.length} смен</Text>
        </View>
 
        <View style={S.filterRow}>
          {[{key:'ALL',label:'Все'},{key:'OPEN',label:'Активные'},
            {key:'COMPLETED',label:'Завершённые'},{key:'CANCELLED',label:'Отменённые'}
          ].map(f=>(
            <TouchableOpacity key={f.key}
              style={[S.filterBtn,shiftFilter===f.key&&S.filterBtnOn]}
              onPress={()=>setShiftFilter(f.key)}>
              <Text style={[S.filterTxt,shiftFilter===f.key&&S.filterTxtOn]}>{f.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
 
        {loading?<ActivityIndicator color='#C9B47F' size='large' style={{marginTop:20}}/>:
          filteredShifts.length===0?(
            <View style={S.empty}>
              <Text style={S.emptyIcon}>📋</Text>
              <Text style={S.emptyTxt}>{shiftFilter==='ALL'?'Смен пока нет':'Нет смен в этом статусе'}</Text>
              {shiftFilter==='ALL'&&<Text style={S.emptySub}>Создай первую смену!</Text>}
            </View>
          ):(
            <FlatList 
              data={filteredShifts ?? []} 
              keyExtractor={(item, index) => item?.id ? item.id.toString() : index.toString()}
              renderItem={renderShift} 
              scrollEnabled={false}
            />
          )
        }
      </ScrollView>
 
      <Modal visible={fullPhoto!==null} transparent animationType="fade"
        onRequestClose={()=>setFullPhoto(null)}>
        <TouchableOpacity style={S.photoModal} activeOpacity={1} onPress={()=>setFullPhoto(null)}>
          {fullPhoto&&<Image source={{uri:fullPhoto}} style={S.fullPhoto} resizeMode="contain"/>}
          <Text style={S.photoModalHint}>Нажми чтобы закрыть</Text>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}
 
const S = StyleSheet.create({
  safe:{flex:1,backgroundColor:'#0D1B2A',paddingTop:Platform.OS==='android'?35:0},
  container:{padding:20,paddingBottom:40},
  topBar:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:16,marginTop:8},
  badge:{color:'#378ADD',fontSize:12,fontWeight:'700',letterSpacing:1},
  editTxt:{color:'#C9B47F',fontSize:14},logoutTxt:{color:'#778DA9',fontSize:14},
  msgBox:{borderRadius:10,padding:12,marginBottom:14,borderWidth:1},
  msgGreen:{backgroundColor:'#1D9E7522',borderColor:'#1D9E7544'},
  msgRed:{backgroundColor:'#E2444422',borderColor:'#E2444444'},
  msgTxt:{color:'#E0E1DD',fontSize:13,textAlign:'center'},
  avatarWrap:{alignItems:'center',marginBottom:14,position:'relative'},
  avatar:{width:100,height:100,borderRadius:50,backgroundColor:'#1B263B',alignItems:'center',justifyContent:'center',borderWidth:3},
  avatarTxt:{fontSize:36,fontWeight:'700',color:'#E0E1DD'},
  photoBadgeBlue:{position:'absolute',bottom:0,right:0,width:28,height:28,borderRadius:14,backgroundColor:'#378ADD',alignItems:'center',justifyContent:'center',borderWidth:2,borderColor:'#0D1B2A'},
  photoBadgeDark:{position:'absolute',bottom:0,right:0,width:28,height:28,borderRadius:14,backgroundColor:'#0D1B2A',alignItems:'center',justifyContent:'center',borderWidth:2,borderColor:'#1B263B'},
  photoBadgeTxt:{fontSize:13},
  nameInput:{fontSize:22,fontWeight:'700',color:'#E0E1DD',backgroundColor:'#1B263B',borderRadius:12,padding:12,marginBottom:8,textAlign:'center'},
  companyName:{fontSize:24,fontWeight:'800',color:'#E0E1DD',textAlign:'center',marginBottom:8},
  scoreCard:{backgroundColor:'#1B263B',borderRadius:20,padding:24,alignItems:'center',marginBottom:24,borderWidth:1,borderColor:'#C9B47F33'},
  scoreLbl:{color:'#778DA9',fontSize:13,marginBottom:8},
  scoreRow:{flexDirection:'row',alignItems:'flex-end',marginBottom:8},
  scoreNum:{fontSize:72,fontWeight:'900',lineHeight:80},
  scoreMax:{fontSize:22,color:'#778DA9',marginBottom:10},
  scoreDesc:{fontSize:15,fontWeight:'600',marginBottom:12},
  statsRow:{flexDirection:'row',gap:12},
  statBox:{alignItems:'center',backgroundColor:'#0D1B2A',borderRadius:12,padding:12,minWidth:90},
  statNum:{fontSize:20,fontWeight:'800',color:'#C9B47F'},
  statLbl:{fontSize:10,color:'#778DA9',marginTop:2,textAlign:'center'},
  sectionTitle:{fontSize:11,color:'#778DA9',letterSpacing:1.5,fontWeight:'600',marginBottom:12},
  infoCard:{backgroundColor:'#1B263B',borderRadius:16,padding:16,marginBottom:16,borderWidth:1,borderColor:'#263550'},
  infoRow:{flexDirection:'row',alignItems:'flex-start',gap:14,paddingVertical:10},
  infoIcon:{fontSize:20,marginTop:2},infoLbl:{color:'#778DA9',fontSize:12,marginBottom:4},
  infoVal:{color:'#E0E1DD',fontSize:15,fontWeight:'500'},
  infoInput:{color:'#E0E1DD',fontSize:14,backgroundColor:'#0D1B2A',borderRadius:8,padding:8,borderWidth:1,borderColor:'#263550'},
  infoDivider:{height:1,backgroundColor:'#263550'},
  saveBtn:{backgroundColor:'#C9B47F',padding:18,borderRadius:14,alignItems:'center'},
  saveBtnTxt:{color:'#0D1B2A',fontWeight:'800',fontSize:15},
  cancelBtn:{backgroundColor:'#1B263B',padding:18,borderRadius:14,alignItems:'center',borderWidth:1,borderColor:'#263550'},
  cancelBtnTxt:{color:'#778DA9',fontSize:15},
  reviewsSection:{marginBottom:16},
  reviewsHeader:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginBottom:12},
  avgBadge:{backgroundColor:'#C9B47F22',borderRadius:12,paddingHorizontal:10,paddingVertical:4,borderWidth:1,borderColor:'#C9B47F44'},
  avgBadgeTxt:{color:'#C9B47F',fontWeight:'700',fontSize:13},
  reviewsEmpty:{backgroundColor:'#1B263B',borderRadius:14,padding:16,alignItems:'center',borderWidth:1,borderColor:'#263550'},
  reviewsEmptyTxt:{color:'#E0E1DD',fontSize:14,fontWeight:'600',marginBottom:4},
  reviewsEmptySub:{color:'#778DA9',fontSize:12,textAlign:'center'},
  reviewCard:{backgroundColor:'#1B263B',borderRadius:14,padding:14,marginBottom:10,borderWidth:1,borderColor:'#263550'},
  reviewHeader2:{flexDirection:'row',alignItems:'center',gap:10,marginBottom:8},
  reviewAvatar:{width:40,height:40,borderRadius:20},
  reviewAvatarEmpty:{width:40,height:40,borderRadius:20,backgroundColor:'#0D1B2A',alignItems:'center',justifyContent:'center'},
  reviewAvatarTxt:{color:'#C9B47F',fontWeight:'700',fontSize:16},
  reviewName:{color:'#E0E1DD',fontWeight:'600',fontSize:14},
  reviewRole:{color:'#778DA9',fontSize:12},
  reviewStars:{fontSize:13},
  reviewText:{color:'#E0E1DD',fontSize:13,lineHeight:19,marginBottom:6},
  reviewDate:{color:'#778DA9',fontSize:11},
  docsBtn:{backgroundColor:'#1B263B',borderRadius:14,padding:16,alignItems:'center',marginBottom:10,borderWidth:1,borderColor:'#378ADD44',flexDirection:'row',justifyContent:'center',gap:8},
  docsBtnTxt:{color:'#378ADD',fontWeight:'700',fontSize:15},
  walletBtn:{backgroundColor:'#1B263B',borderRadius:14,padding:16,alignItems:'center',marginBottom:10,borderWidth:1,borderColor:'#C9B47F44',flexDirection:'row',justifyContent:'center',gap:8},
  walletBtnTxt:{color:'#C9B47F',fontWeight:'700',fontSize:15},
  createBtn:{backgroundColor:'#C9B47F',padding:18,borderRadius:16,alignItems:'center',marginBottom:20},
  createBtnTxt:{color:'#0D1B2A',fontWeight:'800',fontSize:16},
  sectionRow:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:8},
  count:{color:'#C9B47F',fontSize:12,fontWeight:'600'},
  filterRow:{flexDirection:'row',gap:6,marginBottom:14,flexWrap:'wrap'},
  filterBtn:{paddingHorizontal:12,paddingVertical:6,borderRadius:20,backgroundColor:'#1B263B',borderWidth:1,borderColor:'#263550'},
  filterBtnOn:{borderColor:'#C9B47F',backgroundColor:'#C9B47F22'},
  filterTxt:{color:'#778DA9',fontSize:12},filterTxtOn:{color:'#C9B47F',fontWeight:'600'},
  shiftCard:{backgroundColor:'#1B263B',borderRadius:16,padding:16,marginBottom:12,borderWidth:1,borderColor:'#263550'},
  shiftTop:{flexDirection:'row',justifyContent:'space-between',marginBottom:6},
  shiftRole:{color:'#E0E1DD',fontWeight:'700',fontSize:17},
  shiftPay:{color:'#C9B47F',fontWeight:'900',fontSize:18},
  shiftAddr:{color:'#778DA9',fontSize:12,marginBottom:10},
  shiftFooter:{flexDirection:'row',alignItems:'center',gap:6},
  statusDot:{width:8,height:8,borderRadius:4},
  statusOpen:{backgroundColor:'#C9B47F'},statusDone:{backgroundColor:'#1D9E75'},statusClosed:{backgroundColor:'#778DA9'},
  statusTxt:{color:'#778DA9',fontSize:12,flex:1},viewTxt:{color:'#C9B47F',fontSize:12,fontWeight:'600'},
  empty:{alignItems:'center',paddingTop:40},
  emptyIcon:{fontSize:40,marginBottom:12},emptyTxt:{color:'#E0E1DD',fontSize:18,fontWeight:'600',marginBottom:6},emptySub:{color:'#778DA9',fontSize:13},
  photoModal:{flex:1,backgroundColor:'rgba(0,0,0,0.92)',alignItems:'center',justifyContent:'center'},
  fullPhoto:{width:320,height:320,borderRadius:16},
  photoModalHint:{color:'#778DA9',fontSize:13,marginTop:20},
});