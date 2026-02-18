/**
 * Розшифровує JWT токен і повертає об'єкт payload (дані).
 * @param {string} token
 * @returns {object|null}
 */
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

/**
 * Отримує роль користувача з токена або сховища.
 * @returns {string} 'user' або 'doctor'
 */
function getUserRole() {
  const token = localStorage.getItem('access_token');
  if (!token) return null;

  const payload = parseJwt(token);
  // Змініть 'role' на те поле, яке реально використовує ваш бекенд (наприклад, 'sub' або 'user_role')
  return payload ? (payload.role || localStorage.getItem('user_role')) : null;
}
