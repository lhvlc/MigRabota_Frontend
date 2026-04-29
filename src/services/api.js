import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'https://asap-horeca-backend-k6q2.onrender.com';

// Безопасный fetch — не крашится если сервер вернул пустой ответ
const safeFetch = async (url, options = {}) => {
  try {
    const res = await fetch(url, options);
    const text = await res.text();
    if (!text || text.trim() === '') {
      console.warn('Empty response from:', url);
      return { error: 'Сервер не ответил. Попробуй ещё раз.' };
    }
    try {
      return JSON.parse(text);
    } catch (e) {
      console.error('JSON parse error from:', url, 'response:', text.slice(0, 200));
      return { error: 'Ошибка ответа сервера' };
    }
  } catch (e) {
    console.error('Network error:', url, e.message);
    return { error: 'Нет соединения с сервером' };
  }
};

// ── ХРАНЕНИЕ ПОЛЬЗОВАТЕЛЯ ────────────────────────────
export const saveUser = async (user) => {
  await AsyncStorage.setItem('user', JSON.stringify(user));
};

export const getStoredUser = async () => {
  const raw = await AsyncStorage.getItem('user');
  return raw ? JSON.parse(raw) : null;
};

export const clearUser = async () => {
  await AsyncStorage.removeItem('user');
};

// ── ПОЛЬЗОВАТЕЛИ ─────────────────────────────────────
export const checkBackendConnection = async () => {
  try {
    const res = await fetch(`${API_URL}/health`);
    return res.ok;
  } catch { return false; }
};

export const syncUser = async (uid, email, role, name, isLogin = false) => {
  return safeFetch(`${API_URL}/users/sync`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ uid, email, role, name, isLogin }),
  });
};

export const getWorkerProfile = async (userId) => {
  return safeFetch(`${API_URL}/users/${userId}`);
};

export const updateProfile = async (userId, data) => {
  return safeFetch(`${API_URL}/users/${userId}/profile`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
};

export const rateWorker = async (userId, stars) => {
  return safeFetch(`${API_URL}/users/${userId}/rate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ stars }),
  });
};

// ── СОИСКАТЕЛЬ ───────────────────────────────────────
export const toggleHotStatus = async (uid, isHot) => {
  return safeFetch(`${API_URL}/seeker/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ uid, isHot }),
  });
};

export const getOrders = async () => {
  const res = await fetch(`${API_URL}/shifts`);
  if (!res.ok) throw new Error('Ошибка загрузки');
  return res.json();
};

export const applyToOrder = async (shiftId, seekerId) => {
  return safeFetch(`${API_URL}/shifts/${shiftId}/apply`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ seekerId }),
  });
};

// ── РАБОТОДАТЕЛЬ ─────────────────────────────────────
export const createOrder = async (data) => {
  return safeFetch(`${API_URL}/shifts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
};

export const getApplicants = async (shiftId) => {
  return safeFetch(`${API_URL}/shifts/${shiftId}/applicants`);
};

export const acceptApplicant = async (applicationId) => {
  return safeFetch(`${API_URL}/applications/${applicationId}/accept`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
};

export const getHotWorkers = async () => {
  return safeFetch(`${API_URL}/workers/hot`);
};