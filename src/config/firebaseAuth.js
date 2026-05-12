import { Platform } from 'react-native';

// На вебе — заглушка, SMS не нужен
const webAuth = {
  signInWithPhoneNumber: async () => { throw new Error('web'); },
};

let _auth = null;

export const getFirebaseAuth = () => {
  if (Platform.OS === 'web') return webAuth;
  if (!_auth) {
    _auth = require('@react-native-firebase/auth').default;
  }
  return _auth;
};