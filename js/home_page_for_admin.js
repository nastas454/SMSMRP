let currentTab = 'patients';
const API_BASE_URL = 'http://localhost:8000';

// Отримує токен доступу (access token) з локального сховища
function getAuthToken() {
  return localStorage.getItem('access_token') || '';
}

// Виконує HTTP-запити до бекенду, автоматично додаючи токен авторизації та обробляючи помилки сервера
async function apiRequest(endpoint, method = 'GET', body = null, isFormData = false) {
  const headers = {
    'Authorization': `Bearer ${getAuthToken()}`
  };

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
    let errorDetail = 'Сталася помилка при виконанні запиту';
    try {
      const errorData = await response.json();
      if (errorData && errorData.detail) {
        errorDetail = errorData.detail;
      }
    } catch (e) {
      console.error("Не вдалося прочитати JSON помилки");
    }
    throw { status: response.status, message: errorDetail };
  }

  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

// Ініціалізація при завантаженні сторінки
document.addEventListener("DOMContentLoaded", () => {
  loadUsersData();
  updateActionButtons();
});

// Перемикає активну вкладку, оновлює заголовок та ініціює завантаження відповідних даних
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

// Керує видимістю кнопок створення ("Створити лікаря", "Створити адміна") залежно від відкритої вкладки
function updateActionButtons() {
  document.getElementById('btn-create-doctor').classList.remove('active');
  document.getElementById('btn-create-admin').classList.remove('active');

  if (currentTab === 'doctors') {
    document.getElementById('btn-create-doctor').classList.add('active');
  } else if (currentTab === 'admins') {
    document.getElementById('btn-create-admin').classList.add('active');
  }
}

// Завантажує список користувачів з сервера для поточної вкладки та викликає функцію відмальовування таблиці
async function loadUsersData() {
  const tbody = document.getElementById('users-tbody');
  tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Завантаження даних...</td></tr>';

  try {
    const endpoint = `/admin/${currentTab}`;
    const data = await apiRequest(endpoint);
    renderTable(data);
  } catch (error) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Користувачі відсутні</td></tr>';
  }
}

// Генерує HTML-розмітку рядків таблиці та заповнює її даними отриманих користувачів
function renderTable(data) {
  const tbody = document.getElementById('users-tbody');
  tbody.innerHTML = '';

  if (!data || data.length === 0) {
    // Якщо масив порожній, також виводимо "користувачі відсутні"
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Користувачі відсутні</td></tr>';
    return;
  }

  data.forEach(user => {
    const tr = document.createElement('tr');
    const isActive = user.is_active !== undefined ? user.is_active : true;
    const statusText = isActive ? "Активний" : "Неактивний";
    const statusClass = isActive ? "active" : "inactive";
    const loginInfo = user.login || 'Невідомо';
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
      <td>
        <div class="id-cell">
          <span title="${user.id}">#${shortId}</span>
          <i class="far fa-copy copy-icon" title="Скопіювати повний ID" onclick="copyIdToClipboard('${user.id}', this)"></i>
        </div>
      </td>
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

// Відправляє запит на сервер для зміни статусу користувача (активація/деактивація) та показує відповідне сповіщення
async function toggleStatus(userId, makeActive) {
  try {
    if (makeActive) {
      await apiRequest(`/admin/${userId}/activate`, 'PATCH');
      showNotification('Користувача успішно активовано', 'success');
    } else {
      await apiRequest(`/admin/${userId}/deactivate`, 'DELETE');
      showNotification('Користувача успішно деактивовано', 'success');
    }
    loadUsersData();
  } catch (error) {
    console.error('Помилка зміни статусу:', error);
    if (error.status === 403) {
      showNotification('У вас немає прав для деактивації цього користувача', 'error');
    } else {
      showNotification('Сталася помилка при зміні статусу', 'error');
    }
  }
}

// Відображає модальне вікно за вказаним ідентифікатором
function openModal(modalId) {
  document.getElementById(modalId).style.display = 'block';
}

// Приховує модальне вікно, а також очищає його форму та повідомлення про помилки
function closeModal(modalId) {
  document.getElementById(modalId).style.display = 'none';
  const form = document.querySelector(`#${modalId} form`);
  if (form) {
    form.reset();
    const errorMsgContainer = form.querySelector('.form-error-message');
    if (errorMsgContainer) errorMsgContainer.textContent = '';
  }
}

// Закриття модального вікна при кліку поза його межами
window.onclick = function(event) {
  if (event.target.classList.contains('modal')) {
    event.target.style.display = 'none';
  }
}

// Перевіряє правильність введених у форму даних за допомогою регулярних виразів
function validateUserForm(formData) {
  const firstName = formData.get('first_name');
  const lastName = formData.get('last_name');
  const email = formData.get('email');
  const login = formData.get('login');
  const password = formData.get('password');

  const nameRegex = /^[\p{L}\-]{2,30}$/u;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const loginRegex = /^[a-zA-Z0-9_]{8,}$/;
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;

  if (!nameRegex.test(firstName)) {
    return "Ім'я: від 2 до 30 символів, дозволені лише букви та '-'";
  }
  if (!nameRegex.test(lastName)) {
    return "Прізвище: від 2 до 30 символів, дозволені лише букви та '-'";
  }
  if (/[A-Z]/.test(email)) {
    return "Email: використання великих літер заборонено.";
  }
  if (!emailRegex.test(email)) {
    return "Email: введіть коректну адресу (наприклад, name@example.com)";
  }
  if (!loginRegex.test(login)) {
    return "Логін: мін. 8 символів, без пробілів та спецсимволів (лише латиниця, цифри, '_')";
  }
  if (!passwordRegex.test(password)) {
      return "Пароль: мін. 8 символів, обов'язково великі та малі літери, цифри та спецсимволи";
  }
  return null;
}

// Перехоплює відправку форми створення користувача (валідує дані, надсилає їх на бекенд, обробляє помилки дублювання та закриває модалку у разі успіху)
async function handleCreateUser(event, endpoint, modalId) {
  event.preventDefault();
  const form = event.target;
  const formData = new FormData(form);
  const errorMsgContainer = form.querySelector('.form-error-message');
  if (errorMsgContainer) errorMsgContainer.textContent = '';
  const validationError = validateUserForm(formData);
  if (validationError) {
    if (errorMsgContainer) {
      errorMsgContainer.textContent = validationError;
    }
    return;
  }

  const submitBtn = form.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.innerText = 'Збереження...';

  try {
    await apiRequest(endpoint, 'POST', formData, true);
    closeModal(modalId);
    form.reset();
    loadUsersData();
    showNotification('Користувача успішно створено!', 'success');
  } catch (error) {
    console.error('Помилка створення:', error);

    if (errorMsgContainer) {
      let displayMessage = error.message || "Невідома помилка";
      const lowerMsg = displayMessage.toLowerCase();

      if (lowerMsg.includes("failed to fetch") || lowerMsg.includes("networkerror")) {
        displayMessage = "Помилка мережі: Неможливо з'єднатися з сервером";
      }
      else if (lowerMsg.includes("email already registered") || lowerMsg.includes("email already exists")) {
        displayMessage = "Користувач з таким Email вже існує";
      }
      else if (lowerMsg.includes("login already") || lowerMsg.includes("username already")) {
        displayMessage = "Цей логін вже зайнятий";
      }

      errorMsgContainer.textContent = displayMessage;
    }
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerText = 'Зберегти';
  }
}

// Видаляє токен з пам'яті браузера та перенаправляє користувача для виходу з акаунту
function logoutUser(event) {
  event.preventDefault();
  localStorage.removeItem('access_token');
  window.location.href = event.currentTarget.href;
}

// Копіює ідентифікатор користувача в буфер обміну та тимчасово змінює іконку копіювання на галочку для візуального підтвердження
async function copyIdToClipboard(fullId, iconElement) {
  try {
    await navigator.clipboard.writeText(fullId);
    iconElement.classList.remove('fa-copy', 'far');
    iconElement.classList.add('fa-check', 'fas', 'copied');
    iconElement.title = "Скопійовано!";
    setTimeout(() => {
      iconElement.classList.remove('fa-check', 'fas', 'copied');
      iconElement.classList.add('fa-copy', 'far');
      iconElement.title = "Скопіювати повний ID";
    }, 1500);
  } catch (err) {
    console.error('Помилка копіювання: ', err);
    alert('Не вдалося скопіювати ID. Ваш браузер може блокувати цю дію.');
  }
}

// Динамічно створює та показує спливаюче повідомлення про успішну дію або помилку
function showNotification(message, type = 'error') {
  let container = document.getElementById('notification-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'notification-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast-notification ${type}`;

  const icon = type === 'error' ? '<i class="fas fa-exclamation-circle"></i>' : '<i class="fas fa-check-circle"></i>';
  toast.innerHTML = `${icon} <span>${message}</span>`;

  container.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = 'fadeOutRight 0.4s cubic-bezier(0.25, 0.8, 0.25, 1) forwards';
    setTimeout(() => toast.remove(), 400);
  }, 4000);
}
