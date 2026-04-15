let currentTab = 'patients';
const API_BASE_URL = 'http://localhost:8000';

// Отримання токена (налаштуйте під вашу логіку авторизації)
function getAuthToken() {
  return localStorage.getItem('access_token') || '';
}

// Універсальна обгортка для fetch запитів до API
async function apiRequest(endpoint, method = 'GET', body = null, isFormData = false) {
  const headers = {
    'Authorization': `Bearer ${getAuthToken()}`
  };

  // Якщо це не FormData, додаємо заголовок JSON
  if (!isFormData && body) {
    headers['Content-Type'] = 'application/json';
  }

  const config = { method, headers };
  if (body) {
    config.body = isFormData ? body : JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

  if (!response.ok) {
    console.error('API Error:', response.status);
    alert('Помилка при виконанні запиту. Перевірте консоль для деталей.');
    throw new Error('API Request Failed');
  }

  // Якщо відповідь не має тіла (наприклад, при 204 No Content), повертаємо null
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

// Ініціалізація при завантаженні сторінки
document.addEventListener("DOMContentLoaded", () => {
  loadUsersData();
  updateActionButtons();
});

// Перемикання вкладок
function switchTab(tabName, btnElement) {
  currentTab = tabName;

  const titles = {
    'patients': 'Пацієнти',
    'doctors': 'Лікарі',
    'admins': 'Адміністратори'
  };
  document.getElementById('page-title').innerText = `Користувачі: ${titles[tabName]}`;

  document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
  btnElement.classList.add('active');

  updateActionButtons();
  loadUsersData();
}

// Керування відображенням кнопок створення залежно від обраної вкладки
function updateActionButtons() {
  document.getElementById('btn-create-doctor').classList.remove('active');
  document.getElementById('btn-create-admin').classList.remove('active');

  if (currentTab === 'doctors') {
    document.getElementById('btn-create-doctor').classList.add('active');
  } else if (currentTab === 'admins') {
    document.getElementById('btn-create-admin').classList.add('active');
  }
}

// Завантаження даних з бекенду
async function loadUsersData() {
  const tbody = document.getElementById('users-tbody');
  tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Завантаження даних...</td></tr>';

  try {
    const endpoint = `/admin/${currentTab}`;
    const data = await apiRequest(endpoint);
    renderTable(data);
  } catch (error) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:red;">Помилка завантаження даних</td></tr>';
  }
}

// Відмальовування таблиці
function renderTable(data) {
  const tbody = document.getElementById('users-tbody');
  tbody.innerHTML = '';

  if (!data || data.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Користувачів не знайдено</td></tr>';
    return;
  }

  data.forEach(user => {
    const tr = document.createElement('tr');

    const isActive = user.is_active !== undefined ? user.is_active : true;
    const statusText = isActive ? "Активний" : "Неактивний";
    const statusClass = isActive ? "active" : "inactive";

    // Беремо логін з відповіді бекенду
    const loginInfo = user.login || 'Невідомо';

    // Форматуємо дату з поля create_at
    const dateInfo = user.create_at
      ? new Date(user.create_at).toLocaleString('uk-UA', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
      : '-';

    const shortId = user.id ? user.id.toString().substring(0,8) + '...' : 'Н/Д';

    tr.innerHTML = `
      <td><span title="${user.id}">#${shortId}</span></td>
      <td>
        <div class="user-info">
          <i class="far fa-user-circle"></i> ${loginInfo}
        </div>
      </td>
      <td>${dateInfo}</td>
      <td class="status-text ${statusClass}">${statusText}</td>
      <td class="actions">
        <button class="btn-action btn-unban"
                onclick="toggleStatus('${user.id}', true)"
                ${isActive ? 'disabled' : ''}>
          активувати
        </button>
        <button class="btn-action btn-ban"
                onclick="toggleStatus('${user.id}', false)"
                ${!isActive ? 'disabled' : ''}>
          деактивувати
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// Зміна статусу користувача (активація / деактивація)
async function toggleStatus(userId, makeActive) {
  try {
    if (makeActive) {
      await apiRequest(`/admin/${userId}/activate`, 'PATCH');
    } else {
      await apiRequest(`/admin/${userId}/deactivate`, 'DELETE');
    }
    // Оновлюємо таблицю після успішної дії
    loadUsersData();
  } catch (error) {
    console.error('Помилка зміни статусу:', error);
  }
}

// --- Логіка модальних вікон та форм ---

function openModal(modalId) {
  document.getElementById(modalId).style.display = 'block';
}

function closeModal(modalId) {
  document.getElementById(modalId).style.display = 'none';
}

// Закриття модального вікна при кліку поза його межами
window.onclick = function(event) {
  if (event.target.classList.contains('modal')) {
    event.target.style.display = 'none';
  }
}

// Обробка відправки форми створення (Form Data)
async function handleCreateUser(event, endpoint, modalId) {
  event.preventDefault();
  const form = event.target;
  const formData = new FormData(form);

  // Блокуємо кнопку на час запиту, щоб уникнути подвійних натискань
  const submitBtn = form.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.innerText = 'Збереження...';

  try {
    await apiRequest(endpoint, 'POST', formData, true);
    closeModal(modalId);
    form.reset();
    loadUsersData(); // Оновлюємо список
    alert('Користувача успішно створено!');
  } catch (error) {
    console.error('Помилка створення:', error);
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerText = 'Зберегти';
  }
}

// Функція виходу (заглушка)
function logoutUser(event) {
  event.preventDefault();
  localStorage.removeItem('access_token');
  window.location.href = event.currentTarget.href;
}
