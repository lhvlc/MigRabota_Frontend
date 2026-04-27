import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, ScrollView, ActivityIndicator,
  Alert, Platform, Linking } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';

const API = 'https://asap-horeca-backend-k6q2.onrender.com';

export default function DocumentsScreen({ route, navigation }) {
  const { user, readOnly } = route.params;
  // readOnly=true — просмотр чужих документов без загрузки
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => { loadDocs(); }, []);

  const loadDocs = async () => {
    try {
      const res = await fetch(`${API}/documents/${user.id}`);
      const data = await res.json();
      setDocs(Array.isArray(data) ? data : []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;
      const file = result.assets[0];
      setUploading(true);

      const formData = new FormData();
      formData.append('userId', user.id);
      formData.append('name', file.name);
      formData.append('type', file.mimeType || 'document');

      if (file.file) {
        formData.append('file', file.file, file.name);
      } else {
        formData.append('file', {
          uri: file.uri,
          name: file.name,
          type: file.mimeType || 'application/octet-stream',
        });
      }

      const res = await fetch(`${API}/documents`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.id) {
        await loadDocs();
        Alert.alert('✅ Документ добавлен!');
      } else {
        Alert.alert('Ошибка', data.error || 'Не удалось загрузить');
      }
    } catch (e) {
      console.error(e);
      Alert.alert('Ошибка', 'Не удалось загрузить документ');
    } finally { setUploading(false); }
  };

  const deleteDoc = async (docId) => {
    Alert.alert('Удалить документ?', 'Это действие нельзя отменить', [
      { text: 'Отмена', style: 'cancel' },
      { text: 'Удалить', style: 'destructive', onPress: async () => {
        try {
          await fetch(`${API}/documents/${docId}`, { method: 'DELETE' });
          setDocs(docs.filter(d => d.id !== docId));
        } catch (e) { console.error(e); }
      }}
    ]);
  };

  const openDoc = (doc) => {
    if (doc.url && doc.url.startsWith('http')) {
      Linking.openURL(doc.url);
    } else {
      Alert.alert('📎 ' + doc.name, 'Файл сохранён на устройстве');
    }
  };

  const getIcon = (type) => {
    if (type?.includes('pdf')) return '📄';
    if (type?.includes('image')) return '🖼️';
    if (type?.includes('word') || type?.includes('doc')) return '📝';
    return '📎';
  };

  return (
    <SafeAreaView style={S.safe}>
      <ScrollView contentContainerStyle={S.container}>

        <TouchableOpacity onPress={() => navigation.goBack()} style={S.back}>
          <Text style={S.backTxt}>← Назад</Text>
        </TouchableOpacity>

        <Text style={S.title}>📁 Документы</Text>
        <Text style={S.subtitle}>
          {readOnly
            ? 'Документы пользователя'
            : 'Документы видны другим пользователям в профиле'}
        </Text>

        {/* Кнопка добавления только если НЕ readOnly */}
        {!readOnly && (
          <TouchableOpacity style={S.addBtn}
            onPress={pickDocument} disabled={uploading}>
            {uploading
              ? <ActivityIndicator color="#0D1B2A"/>
              : <Text style={S.addBtnTxt}>+ Добавить документ</Text>}
          </TouchableOpacity>
        )}

        {loading ? (
          <ActivityIndicator color='#C9B47F' size='large' style={{marginTop:40}}/>
        ) : docs.length === 0 ? (
          <View style={S.empty}>
            <Text style={S.emptyIcon}>📂</Text>
            <Text style={S.emptyTxt}>Документов пока нет</Text>
            <Text style={S.emptySub}>
              {readOnly
                ? 'Пользователь ещё не добавил документы'
                : 'Добавь паспорт, диплом, сертификаты или другие документы'}
            </Text>
          </View>
        ) : (
          docs.map(doc => (
            <TouchableOpacity
              key={doc.id} style={S.docCard}
              onPress={() => openDoc(doc)}>
              <Text style={S.docIcon}>{getIcon(doc.type)}</Text>
              <View style={{flex:1}}>
                <Text style={S.docName} numberOfLines={1}>{doc.name}</Text>
                <Text style={S.docDate}>
                  {new Date(doc.createdAt).toLocaleDateString('ru-RU')}
                </Text>
              </View>
              {/* Кнопка удаления только если НЕ readOnly */}
              {!readOnly && (
                <TouchableOpacity style={S.deleteBtn}
                  onPress={(e) => {
                    e.stopPropagation();
                    deleteDoc(doc.id);
                  }}>
                  <Text style={S.deleteTxt}>🗑️</Text>
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
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
  title: { fontSize:24, fontWeight:'800', color:'#E0E1DD', marginBottom:8 },
  subtitle: { color:'#778DA9', fontSize:13, lineHeight:20, marginBottom:20 },
  addBtn: { backgroundColor:'#C9B47F', borderRadius:14,
    padding:16, alignItems:'center', marginBottom:24 },
  addBtnTxt: { color:'#0D1B2A', fontWeight:'800', fontSize:15 },
  empty: { alignItems:'center', paddingTop:40 },
  emptyIcon: { fontSize:48, marginBottom:16 },
  emptyTxt: { color:'#E0E1DD', fontSize:18, fontWeight:'600', marginBottom:8 },
  emptySub: { color:'#778DA9', fontSize:13, textAlign:'center', lineHeight:20 },
  docCard: { backgroundColor:'#1B263B', borderRadius:14,
    padding:16, marginBottom:10, flexDirection:'row',
    alignItems:'center', gap:12, borderWidth:1, borderColor:'#263550' },
  docIcon: { fontSize:28 },
  docName: { color:'#E0E1DD', fontWeight:'600', fontSize:14, marginBottom:4 },
  docDate: { color:'#778DA9', fontSize:12 },
  deleteBtn: { padding:8 },
  deleteTxt: { fontSize:20 },
});