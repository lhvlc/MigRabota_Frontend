import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView,
  ActivityIndicator, TextInput, Image, Alert, Platform, Modal } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { clearUser, saveUser, updateProfile } from '../../services/api';
 
const API_URL = 'https://asap-horeca-backend-k6q2.onrender.com';
 
const ROLES_LIST = [
  'Бариста', 'Официант', 'Повар', 'Хостес', 'Бармен',
  'Мойщик посуды', 'Монтажник', 'Демонтажник', 'Разнорабочий', 'Грузчик'
];
 
export default function WorkerProfileScreen({ route, navigation }) {
  const [user, setUser] = useState(route?.params?.user || {});
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [photo, setPhoto] = useState(user.photoUrl || null);
  const [fullPhoto, setFullPhoto] = useState(null);
  const [myReviews, setMyReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
 
  const [form, setForm] = useState({
    name: user.name || '',
    experience: user.experience || '',
    phone: user.phone || '',
    address: user.address || '',
    specialties: user.specialties || '',
  });
 
  useEffect(() => { loadProfile(); loadMyReviews(); }, []);
 
  const loadProfile = async () => {
    try {
      const res = await fetch(`${API_URL}/users/${user.id}`);
      const data = await res.json();
      if (data.id) {
        setForm({ name: data.name||'', experience: data.experience||'',
          phone: data.phone||'', address: data.address||'', specialties: data.specialties||'' });
        if (data.photoUrl && !data.photoUrl.startsWith('blob:')) setPhoto(data.photoUrl);
      }
    } catch (e) { console.error(e); }
  };
 
  const loadMyReviews = async () => {
    setReviewsLoading(true);
    try {
      const res = await fetch(`${API_URL}/reviews/${user.id}`);
      const data = await res.json();
      setMyReviews(Array.isArray(data) ? data : []);
    } catch (e) { console.error(e); }
    finally { setReviewsLoading(false); }
  };
 
  const score = user.aiScore ?? 0;
  const initials = (user.name||'АК').split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2);
  const scoreColor = score>=80?'#C9B47F':score>=60?'#2ECC71':'#E24444';
  const scoreLabel = score>=80?'Превосходный профиль':score>=60?'Хороший профиль':'Нужно улучшить';
 
  const pickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Нет доступа','Разреши доступ к фото'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing:true, aspect:[1,1], quality:0.05, base64:true });
    if (!result.canceled && result.assets[0].base64)
      setPhoto(`data:image/jpeg;base64,${result.assets[0].base64}`);
  };
 
  const handleAvatarPress = () => {
    if (editing) pickPhoto();
    else if (photo && !photo.startsWith('blob:')) setFullPhoto(photo);
  };
 
  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await updateProfile(user.id, {
        name:form.name, experience:form.experience, phone:form.phone,
        address:form.address, specialties:form.specialties, photoUrl:photo||null });
      const newUser = {...user,...updated,specialties:form.specialties,photoUrl:photo};
      setUser(newUser); await saveUser(newUser); setEditing(false);
      setSaveMsg('✅ Профиль сохранён!'); setTimeout(()=>setSaveMsg(''),3000);
    } catch(e) { setSaveMsg('❌ Ошибка сохранения'); }
    finally { setSaving(false); }
  };
 
  const handleLogout = async () => {
    await clearUser();
    navigation.reset({ index:0, routes:[{name:'RoleSelection'}] });
  };
 
  const avgStars = myReviews.length
    ? (myReviews.reduce((s,r)=>s+r.stars,0)/myReviews.length).toFixed(1) : null;
 
 return (
    <SafeAreaView style={S.safe}>
      <ScrollView contentContainerStyle={S.container}>
        <View style={S.topBar}>
          <TouchableOpacity onPress={()=>navigation.navigate('OrdersFeed',{user})}>
            <Text style={S.backTxt}>← Смены</Text>
          </TouchableOpacity>
          <View style={{flexDirection:'row',gap:12}}>
            {!editing && <TouchableOpacity onPress={()=>setEditing(true)}>
              <Text style={S.editTxt}>✏️ Изменить</Text></TouchableOpacity>}
            <TouchableOpacity onPress={handleLogout}>
              <Text style={S.logoutTxt}>Выйти</Text></TouchableOpacity>
          </View>
        </View>
 
        {saveMsg?<View style={S.saveMsg}><Text style={S.saveMsgTxt}>{saveMsg}</Text></View>:null}
 
        <View style={S.avatarWrap}>
          <TouchableOpacity onPress={handleAvatarPress} activeOpacity={0.8}>
            {photo&&!photo.startsWith('blob:')?
              <Image source={{uri:photo}} style={[S.avatar,{borderColor:scoreColor}]}/>:
              <View style={[S.avatar,{borderColor:scoreColor}]}>
                <Text style={S.avatarTxt}>{initials}</Text></View>}
            {editing?<View style={S.photoBadgeBlue}><Text style={S.photoBadgeTxt}>📷</Text></View>:
              photo&&!photo.startsWith('blob:')?
              <View style={S.photoBadgeDark}><Text style={S.photoBadgeTxt}>👁️</Text></View>:null}
          </TouchableOpacity>
        </View>
 
        {editing?
          <TextInput style={S.nameInput} value={form.name}
            onChangeText={v=>setForm({...form,name:v})}
            placeholder="Твоё имя" placeholderTextColor="#778DA9"/>:
          <Text style={S.name}>{form.name||user.name||'Соискатель'}</Text>}
 
        <View style={S.scoreCard}>
          <Text style={S.scoreLabel}>Рейтинг соискателя</Text>
          <View style={S.scoreRow}>
            <Text style={[S.scoreNum,{color:scoreColor}]}>{score}</Text>
            <Text style={S.scoreMax}> /100</Text>
          </View>
          <Text style={[S.scoreDesc,{color:scoreColor}]}>{scoreLabel}</Text>
          <View style={S.statsRow}>
            <View style={S.statBox}>
              <Text style={S.statNum}>{user.ratingCount||0}</Text>
              <Text style={S.statLbl}>оценок</Text>
            </View>
            <View style={S.statBox}>
              <Text style={S.statNum}>{user.earnings?`${user.earnings}₽`:'0₽'}</Text>
              <Text style={S.statLbl}>заработано</Text>
            </View>
          </View>
        </View>


<Text style={S.sectionTitle}>Специальности</Text>
        {editing?(
          <View style={S.rolesWrap}>
            {ROLES_LIST.map(r=>{
              const selected=form.specialties.includes(r);
              return <TouchableOpacity key={r} style={[S.roleChip,selected&&S.roleChipOn]}
                onPress={()=>{
                  const arr=form.specialties?form.specialties.split(', '):[];
                  const newArr=selected?arr.filter(x=>x!==r):[...arr,r];
                  setForm({...form,specialties:newArr.join(', ')});
                }}><Text style={[S.roleChipTxt,selected&&S.roleChipTxtOn]}>{r}</Text>
              </TouchableOpacity>;
            })}
          </View>
        ):(
          <View style={S.rolesWrap}>
            {(form.specialties||'').split(', ').filter(Boolean).map(r=>(
              <View key={r} style={S.roleChipOn}><Text style={S.roleChipTxtOn}>{r}</Text></View>))}
            {!form.specialties&&<Text style={S.roles}>Не указаны</Text>}
          </View>
        )}
 
        <Text style={S.sectionTitle}>Информация</Text>
        <View style={S.infoCard}>
          <View style={S.infoRow}>
            <Text style={S.infoIcon}>💼</Text>
            <View style={{flex:1}}>
              <Text style={S.infoLbl}>Опыт работы</Text>
              {editing?<TextInput style={S.infoInput} value={form.experience}
                onChangeText={v=>setForm({...form,experience:v})}
                placeholder="Например: 3 года в кофейнях" placeholderTextColor="#778DA9"/>:
                <Text style={S.infoVal}>{form.experience||'Не указан'}</Text>}
            </View>
          </View>
          <View style={S.infoDivider}/>
          <View style={S.infoRow}>
            <Text style={S.infoIcon}>📍</Text>
            <View style={{flex:1}}>
              <Text style={S.infoLbl}>Локация</Text>
              {editing?<TextInput style={S.infoInput} value={form.address}
                onChangeText={v=>setForm({...form,address:v})}
                placeholder="Город, район" placeholderTextColor="#778DA9"/>:
                <Text style={S.infoVal}>{form.address||'Не указана'}</Text>}
            </View>
          </View>
          <View style={S.infoDivider}/>
          <View style={S.infoRow}>
            <Text style={S.infoIcon}>📱</Text>
            <View style={{flex:1}}>
              <Text style={S.infoLbl}>Телефон</Text>
              {editing?<TextInput style={S.infoInput} value={form.phone}
                onChangeText={v=>setForm({...form,phone:v})}
                placeholder="+7 (999) 999-99-99" placeholderTextColor="#778DA9"
                keyboardType="phone-pad"/>:
                <Text style={S.infoVal}>{form.phone||'Не указан'}</Text>}
            </View>
          </View>
          <View style={S.infoDivider}/>
          <View style={S.infoRow}>
            <Text style={S.infoIcon}>✉️</Text>
            <View><Text style={S.infoLbl}>Email</Text>
              <Text style={S.infoVal}>{user.email||'Не указан'}</Text></View>
          </View>
        </View>
 
        {/* ═══ МОИ ОТЗЫВЫ ═══ */}
        <View style={S.reviewsSection}>
          <View style={S.reviewsHeader}>
            <Text style={S.sectionTitle}>Отзывы обо мне</Text>
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
                      <Text style={S.reviewRole}>{r.fromRole==='B2B'?'🏢 Работодатель':'👤 Соискатель'}</Text>
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
          <Text style={S.docsBtnTxt}>📁 Мои документы</Text></TouchableOpacity>
 
        <TouchableOpacity style={S.activeBtn}
          onPress={()=>navigation.navigate('ActiveShifts',{user})}>
          <Text style={S.activeBtnTxt}>⚡ В работе</Text></TouchableOpacity>
 
        <TouchableOpacity style={S.walletBtn}
          onPress={()=>navigation.navigate('Wallet',{user})}>
          <Text style={S.walletBtnTxt}>💳 Мой заработок</Text></TouchableOpacity>
 
        {editing?(
          <View style={{flexDirection:'row',gap:10}}>
            <TouchableOpacity style={[S.saveBtn,{flex:1}]} onPress={handleSave} disabled={saving}>
              {saving?<ActivityIndicator color="#0D1B2A"/>:
                <Text style={S.saveBtnTxt}>💾 Сохранить</Text>}</TouchableOpacity>
            <TouchableOpacity style={[S.cancelBtn,{flex:1}]} onPress={()=>setEditing(false)}>
              <Text style={S.cancelBtnTxt}>Отмена</Text></TouchableOpacity>
          </View>
        ):(
          <TouchableOpacity style={S.feedBtn}
            onPress={()=>navigation.navigate('OrdersFeed',{user})}>
            <Text style={S.feedBtnTxt}>⚡ Найти смену</Text></TouchableOpacity>
        )}
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
  topBar:{flexDirection:'row',justifyContent:'space-between',marginBottom:20,marginTop:8},
  backTxt:{color:'#778DA9',fontSize:14},editTxt:{color:'#C9B47F',fontSize:14},
  logoutTxt:{color:'#778DA9',fontSize:14},
  saveMsg:{backgroundColor:'#1D9E7522',borderRadius:10,padding:10,marginBottom:14,borderWidth:1,borderColor:'#1D9E7544'},
  saveMsgTxt:{color:'#1D9E75',fontSize:13,textAlign:'center'},
  avatarWrap:{alignItems:'center',marginBottom:14,position:'relative'},
  avatar:{width:100,height:100,borderRadius:50,backgroundColor:'#1B263B',alignItems:'center',justifyContent:'center',borderWidth:3},
  avatarTxt:{fontSize:36,fontWeight:'700',color:'#E0E1DD'},
  photoBadgeBlue:{position:'absolute',bottom:0,right:0,width:28,height:28,borderRadius:14,backgroundColor:'#378ADD',alignItems:'center',justifyContent:'center',borderWidth:2,borderColor:'#0D1B2A'},
  photoBadgeDark:{position:'absolute',bottom:0,right:0,width:28,height:28,borderRadius:14,backgroundColor:'#0D1B2A',alignItems:'center',justifyContent:'center',borderWidth:2,borderColor:'#1B263B'},
  photoBadgeTxt:{fontSize:13},
  name:{fontSize:26,fontWeight:'800',color:'#E0E1DD',textAlign:'center',marginBottom:4},
  nameInput:{fontSize:22,fontWeight:'700',color:'#E0E1DD',textAlign:'center',backgroundColor:'#1B263B',borderRadius:12,padding:12,marginBottom:4},
  scoreCard:{backgroundColor:'#1B263B',borderRadius:20,padding:24,alignItems:'center',marginBottom:24,borderWidth:1,borderColor:'#C9B47F33'},
  scoreLabel:{color:'#778DA9',fontSize:13,marginBottom:8},
  scoreRow:{flexDirection:'row',alignItems:'flex-end',marginBottom:8},
  scoreNum:{fontSize:72,fontWeight:'900',lineHeight:80},
  scoreMax:{fontSize:22,color:'#778DA9',marginBottom:10},
  scoreDesc:{fontSize:15,fontWeight:'600',marginBottom:12},
  statsRow:{flexDirection:'row',gap:12},
  statBox:{alignItems:'center',backgroundColor:'#0D1B2A',borderRadius:12,padding:12,minWidth:100},
  statNum:{fontSize:20,fontWeight:'800',color:'#C9B47F'},
  statLbl:{fontSize:11,color:'#778DA9',marginTop:2},
  sectionTitle:{fontSize:16,fontWeight:'700',color:'#E0E1DD',marginBottom:12},
  rolesWrap:{flexDirection:'row',flexWrap:'wrap',gap:8,marginBottom:20},
  roleChip:{backgroundColor:'#1B263B',borderRadius:20,paddingHorizontal:14,paddingVertical:8,borderWidth:1,borderColor:'#263550'},
  roleChipOn:{borderColor:'#C9B47F',backgroundColor:'#C9B47F22',borderRadius:20,paddingHorizontal:14,paddingVertical:8,borderWidth:1},
  roleChipTxt:{color:'#778DA9',fontSize:13},
  roleChipTxtOn:{color:'#C9B47F',fontWeight:'600',fontSize:13},
  roles:{color:'#778DA9',fontSize:14,marginBottom:20},
  infoCard:{backgroundColor:'#1B263B',borderRadius:16,padding:16,marginBottom:20,borderWidth:1,borderColor:'#263550'},
  infoRow:{flexDirection:'row',alignItems:'flex-start',gap:14,paddingVertical:10},
  infoIcon:{fontSize:20,marginTop:2},
  infoLbl:{color:'#778DA9',fontSize:12,marginBottom:4},
  infoVal:{color:'#E0E1DD',fontSize:15,fontWeight:'500'},
  infoInput:{color:'#E0E1DD',fontSize:14,backgroundColor:'#0D1B2A',borderRadius:8,padding:8,borderWidth:1,borderColor:'#263550'},
  infoDivider:{height:1,backgroundColor:'#263550'},
  reviewsSection:{marginBottom:20},
  reviewsHeader:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginBottom:12},
  avgBadge:{backgroundColor:'#C9B47F22',borderRadius:12,paddingHorizontal:10,paddingVertical:4,borderWidth:1,borderColor:'#C9B47F44'},
  avgBadgeTxt:{color:'#C9B47F',fontWeight:'700',fontSize:13},
reviewsEmpty:{backgroundColor:'#1B263B',borderRadius:14,padding:20,alignItems:'center',borderWidth:1,borderColor:'#263550'},
  reviewsEmptyTxt:{color:'#E0E1DD',fontSize:15,fontWeight:'600',marginBottom:6},
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
  saveBtn:{backgroundColor:'#C9B47F',padding:18,borderRadius:14,alignItems:'center'},
  saveBtnTxt:{color:'#0D1B2A',fontWeight:'800',fontSize:15},
  cancelBtn:{backgroundColor:'#1B263B',padding:18,borderRadius:14,alignItems:'center',borderWidth:1,borderColor:'#263550'},
  cancelBtnTxt:{color:'#778DA9',fontSize:15},
  feedBtn:{backgroundColor:'#C9B47F',padding:18,borderRadius:16,alignItems:'center'},
  feedBtnTxt:{color:'#0D1B2A',fontWeight:'800',fontSize:16},
  walletBtn:{backgroundColor:'#1B263B',borderRadius:14,padding:16,alignItems:'center',marginBottom:14,borderWidth:1,borderColor:'#C9B47F44',flexDirection:'row',justifyContent:'center',gap:8},
  walletBtnTxt:{color:'#C9B47F',fontWeight:'700',fontSize:15},
  docsBtn:{backgroundColor:'#1B263B',borderRadius:14,padding:16,alignItems:'center',marginBottom:10,borderWidth:1,borderColor:'#378ADD44',flexDirection:'row',justifyContent:'center',gap:8},
  docsBtnTxt:{color:'#378ADD',fontWeight:'700',fontSize:15},
  activeBtn:{backgroundColor:'#1D9E7522',borderRadius:14,padding:16,alignItems:'center',marginBottom:10,borderWidth:1,borderColor:'#1D9E7544',flexDirection:'row',justifyContent:'center',gap:8},
  activeBtnTxt:{color:'#1D9E75',fontWeight:'700',fontSize:15},
  photoModal:{flex:1,backgroundColor:'rgba(0,0,0,0.92)',alignItems:'center',justifyContent:'center'},
  fullPhoto:{width:320,height:320,borderRadius:16},
  photoModalHint:{color:'#778DA9',fontSize:13,marginTop:20},
});