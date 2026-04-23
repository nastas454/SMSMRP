// Розшифровує JWT токен та повертає його корисне навантаження (payload) у вигляді об'єкта
function parseJwt(token) {
  if (!token) return null;
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error("Помилка парсингу токена:", e);
    return null;
  }
}

// Отримує роль поточного користувача з розшифрованого токена або з локального сховища
function getUserRole() {
  const token = localStorage.getItem('access_token');
  if (!token) return null;
  const payload = parseJwt(token);
  return payload ? (payload.role || localStorage.getItem('user_role')) : null;
}

// Повертає правильну форму слова залежно від числівника
function getDeclension(number, words) {
  const num100 = Math.abs(number) % 100;
  const num10 = num100 % 10;
  if (num100 > 10 && num100 < 20) return words[2];
  if (num10 > 1 && num10 < 5) return words[1];
  if (num10 === 1) return words[0];
  return words[2];
}
