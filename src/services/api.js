import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'https://asap-horeca-backend-k6q2.onrender.com';

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
  const res = await fetch(`${API_URL}/users/sync`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ uid, email, role, name, isLogin }),
  });
  return res.json();
};

// Получить профиль соискателя по ID (для работодателя)
export const getWorkerProfile = async (userId) => {
  const res = await fetch(`${API_URL}/users/${userId}`);
  return res.json();
};

// Обновить профиль соискателя
export const updateProfile = async (userId, data) => {
  const res = await fetch(`${API_URL}/users/${userId}/profile`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
};

// Поставить рейтинг соискателю (от работодателя)
export const rateWorker = async (userId, stars) => {
  const res = await fetch(`${API_URL}/users/${userId}/rate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ stars }),
  });
  return res.json();
};

// ── СОИСКАТЕЛЬ ───────────────────────────────────────
export const toggleHotStatus = async (uid, isHot) => {
  const res = await fetch(`${API_URL}/seeker/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ uid, isHot }),
  });
  return res.json();
};

export const getOrders = async () => {
  const res = await fetch(`${API_URL}/shifts`);
  if (!res.ok) throw new Error('Ошибка загрузки');
  return res.json();
};

export const applyToOrder = async (shiftId, seekerId) => {
  const res = await fetch(`${API_URL}/shifts/${shiftId}/apply`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ seekerId }),
  });
  return res.json();
};

// ── РАБОТОДАТЕЛЬ ─────────────────────────────────────
export const createOrder = async (data) => {
  const res = await fetch(`${API_URL}/shifts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
};

export const getApplicants = async (shiftId) => {
  const res = await fetch(`${API_URL}/shifts/${shiftId}/applicants`);
  return res.json();
};

export const acceptApplicant = async (applicationId) => {
  const res = await fetch(`${API_URL}/applications/${applicationId}/accept`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  return res.json();
};

export const getHotWorkers = async () => {
  const res = await fetch(`${API_URL}/workers/hot`);
  return res.json();
};