import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';

export default function RoleSelectionScreen({ navigation }) {
  return (
    <SafeAreaView style={S.safe}>
      <View style={S.container}>

        <View style={S.logoBox}>
          <Text style={S.logo}>ASAP</Text>
          <Text style={S.logoSub}>WORK</Text>
          <Text style={S.tagline}>Работа здесь и сейчас</Text>
        </View>

        <Text style={S.question}>Кто ты?</Text>

        <TouchableOpacity
          style={S.cardWorker}
          onPress={() => navigation.navigate('B2CRegistration')}
        >
          <Text style={S.cardIcon}>👤</Text>
          <Text style={S.cardTitle}>Я ищу работу</Text>
          <Text style={S.cardSub}>Соискатель · Бариста, официант, повар</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={S.cardClient}
          onPress={() => navigation.navigate('B2BRegistration')}
        >
          <Text style={S.cardIcon}>🏢</Text>
          <Text style={S.cardTitle}>Мне нужен персонал</Text>
          <Text style={S.cardSub}>Работодатель · Ресторан, кафе, бар</Text>
        </TouchableOpacity>

      </View>
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0D1B2A' },
  container: { flex: 1, padding: 24, justifyContent: 'center' },
  logoBox: { alignItems: 'center', marginBottom: 48 },
  logo: { fontSize: 52, fontWeight: '900', color: '#C9B47F', letterSpacing: 6 },
  logoSub: { fontSize: 22, fontWeight: '300', color: '#E0E1DD', letterSpacing: 8, marginTop: -8 },
  tagline: { fontSize: 13, color: '#778DA9', marginTop: 10, letterSpacing: 1 },
  question: { fontSize: 22, fontWeight: '600', color: '#E0E1DD', marginBottom: 20, textAlign: 'center' },
  cardWorker: {
    backgroundColor: '#1B263B', borderRadius: 18, padding: 22,
    marginBottom: 14, borderWidth: 1, borderColor: '#C9B47F44',
    alignItems: 'center'
  },
  cardClient: {
    backgroundColor: '#1B263B', borderRadius: 18, padding: 22,
    marginBottom: 14, borderWidth: 1, borderColor: '#378ADD44',
    alignItems: 'center'
  },
  cardIcon: { fontSize: 36, marginBottom: 8 },
  cardTitle: { fontSize: 20, fontWeight: '700', color: '#E0E1DD', marginBottom: 6 },
  cardSub: { fontSize: 13, color: '#778DA9', textAlign: 'center' },
});