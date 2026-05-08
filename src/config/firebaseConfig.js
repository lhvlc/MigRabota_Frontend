import { initializeApp, getApps } from 'firebase/app';
import { initializeAuth, getAuth, getReactNativePersistence } from 'firebase/auth';
import { Platform } from 'react-native';

const firebaseConfig = {
  apiKey: Platform.OS === 'iOS'
    ? 'AIzaSyA6ta_ZbKZc7typViPh9MtzKQ0h9EBfFCU'
    : 'AIzaSyDQ0tXhMAiJm0BhbyC3fKdyrbMp3Vh1bxY',

  authDomain:        'migrabota-a5dba.firebaseapp.com',
  projectId:         'migrabota-a5dba',
  storageBucket:     'migrabota-a5dba.firebasestorage.app',
  messagingSenderId: '336288540958',

  appId: Platform.OS === 'iOS'
    ? '1:336288540958:ios:9b17a2f7e75445b72f810f'
    : '1:336288540958:android:14181be4f9abd8402f810f',
};

let app;
let auth;

if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);

  // На мобильных используем AsyncStorage для персистентности сессии
  if (Platform.OS !== 'web') {
    try {
      const ReactNativeAsyncStorage =
        require('@react-native-async-storage/async-storage').default;
      auth = initializeAuth(app, {
        persistence: getReactNativePersistence(ReactNativeAsyncStorage),
      });
    } catch (e) {
      // Fallback если AsyncStorage недоступен
      auth = getAuth(app);
    }
  } else {
    auth = getAuth(app);
  }
} else {
  app = getApps()[0];
  auth = getAuth(app);
}

export { app, auth, firebaseConfig };