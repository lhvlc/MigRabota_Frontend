const API_URL = 'https://asap-horeca-backend-k6q2.onrender.com';

// Проверка соединения (её ищет index.tsx)
export const checkBackendConnection = async () => {
  try {
    const res = await fetch(`${API_URL}/health`);
    return res.ok;
  } catch { return false; }
};

// Пользователи
export const syncUser = async (uid, email, role, name) => {
  const res = await fetch(`${API_URL}/users/sync`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ uid, email, role, name })
  });
  return res.json();
};

export const getMyProfile = async (uid) => {
  const res = await fetch(`${API_URL}/users/me`, {
    headers: { 'x-uid': uid }
  });
  return res.json();
};

// Соискатель
export const toggleHotStatus = async (uid, isHot) => {
  const res = await fetch(`${API_URL}/seeker/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ uid, isHot })
  });
  return res.json();
};

export const getOrders = async () => {
  const res = await fetch(`${API_URL}/shifts`);
  return res.json();
};

export const applyToOrder = async (shiftId, seekerId) => {
  const res = await fetch(`${API_URL}/shifts/${shiftId}/apply`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ seekerId })
  });
  return res.json();
};

// Работодатель
export const createOrder = async (data) => {
  const res = await fetch(`${API_URL}/shifts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
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
    headers: { 'Content-Type': 'application/json' }
  });
  return res.json();
};