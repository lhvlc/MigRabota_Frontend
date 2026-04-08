// App.js или любой экран
import { useFonts } from 'expo-font';
import { Inter_400Regular, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';

export default function App() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  if (!fontsLoaded) {
    return null; // или индикатор загрузки
  }

  return (
    <View>
      <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 24 }}>
        ASAP WORK
      </Text>
    </View>
  );
}