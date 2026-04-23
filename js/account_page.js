const API_BASE_URL = "http://localhost:8000";

document.addEventListener('DOMContentLoaded', () => {
  initAccountPage();
});

// Ініціалізує сторінку профілю (перевіряє наявність токена, завантажує дані користувача та налаштовує обробники подій)
async function initAccountPage() {
  const token = localStorage.getItem('access_token');
  if (!token) {
    window.location.href = '/login.html';
    return;
  }
  await loadUserData();
  setupEventListeners();
}

// Отримує з сервера базові дані користувача, заповнює форми та зберігає початкові значення для подальшого порівняння
async function loadUserData() {
  const token = localStorage.getItem('access_token');
  const userRole = localStorage.getItem('user_role');
  try {
    const userResponse = await fetch(`${API_BASE_URL}/users/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!userResponse.ok) throw new Error("Помилка отримання даних користувача");
    const userData = await userResponse.json();

    document.getElementById('display-login').textContent = userData.login;
    document.getElementById('display-name').textContent = userData.first_name || '-';
    document.getElementById('display-surname').textContent = userData.last_name || '-';
    document.getElementById('display-email').textContent = userData.email || '-';

    const loginInput = document.getElementById('input-login');
    loginInput.value = userData.login;
    loginInput.dataset.initial = userData.login;

    const nameInput = document.getElementById('input-name');
    nameInput.value = userData.first_name;
    nameInput.dataset.initial = userData.first_name;

    const surnameInput = document.getElementById('input-surname');
    surnameInput.value = userData.last_name;
    surnameInput.dataset.initial = userData.last_name;

    const emailInput = document.getElementById('input-email');
    emailInput.value = userData.email;
    emailInput.dataset.initial = userData.email;

    const displayGenderContainer = document.getElementById('container-display-gender');
    const displayAgeContainer = document.getElementById('container-display-age');
    const inputAgeContainer = document.getElementById('container-input-age');

    if (userRole === 'patient') {
      const patientResponse = await fetch(`${API_BASE_URL}/patients/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!patientResponse.ok) throw new Error("Помилка отримання даних пацієнта");
      const patientData = await patientResponse.json();

      document.getElementById('display-gender').textContent = patientData.sex || '-';
      document.getElementById('display-age').textContent = patientData.age || '-';

      const ageInput = document.getElementById('input-age');
      ageInput.value = patientData.age || '';
      ageInput.dataset.initial = patientData.age || '';

      if (displayGenderContainer) displayGenderContainer.style.display = 'flex';
      if (displayAgeContainer) displayAgeContainer.style.display = 'flex';
      if (inputAgeContainer) inputAgeContainer.style.display = 'flex';
    } else {
      if (displayGenderContainer) displayGenderContainer.style.display = 'none';
      if (displayAgeContainer) displayAgeContainer.style.display = 'none';
      if (inputAgeContainer) inputAgeContainer.style.display = 'none';
    }
  } catch (error) {
    console.error("Помилка:", error);
    alert("Не вдалося завантажити профіль");
  }
}

// Призначає обробники подій для форми редагування профілю, кнопки видалення акаунту та модального вікна підтвердження
function setupEventListeners() {
  const editForm = document.getElementById('edit-profile-form');
  const deleteBtn = document.getElementById('delete-account-btn');
  const modal = document.getElementById('delete-confirm-modal');
  const cancelBtn = document.getElementById('cancel-delete-btn');
  const confirmBtn = document.getElementById('confirm-delete-btn');

  editForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    await updateUserData();
  });

  deleteBtn.addEventListener('click', () => {
    modal.classList.add('show');
  });

  cancelBtn.addEventListener('click', () => {
    modal.classList.remove('show');
  });

  confirmBtn.addEventListener('click', async () => {
    modal.classList.remove('show');
    deleteBtn.disabled = true;
    deleteBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Видалення...';
    await deleteAccount();
    deleteBtn.disabled = false;
    deleteBtn.innerHTML = '<i class="fas fa-trash-alt"></i> видалити акаунт';
  });
  window.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.classList.remove('show');
    }
  });
}

// Перевіряє правильність введених даних
function validateAccountForm(firstName, lastName, login, email, password, ageStr, userRole) {
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
  if (userRole === 'patient') {
    if (!ageStr || !/^\d+$/.test(ageStr)) {
      return "Вік: дозволені лише цілі цифри";
    }
    const age = parseInt(ageStr, 10);
    if (age < 1 || age > 130) {
      return "Вік: введіть значення від 1 до 130";
    }
  }
  if (/[A-Z]/.test(email)) {
    return "Email: використання великих літер заборонено";
  }
  if (!emailRegex.test(email)) {
    return "Email: введіть коректну адресу (наприклад, name@example.com)";
  }
  if (!loginRegex.test(login)) {
    return "Логін: мін. 8 символів, лише латинські літери, цифри та '_'";
  }
  if (password.trim() !== '' && !passwordRegex.test(password)) {
    return "Пароль: мін. 8 символів, обов'язково великі та малі літери, цифри та спецсимволи";
  }
  return null;
}

// Збирає дані з форми, порівнює їх із початковими значеннями та відправляє на сервер лише ті поля, які були змінені
async function updateUserData() {
  const token = localStorage.getItem('access_token');
  const userRole = localStorage.getItem('user_role');
  const firstNameEl = document.getElementById('input-name');
  const lastNameEl = document.getElementById('input-surname');
  const loginEl = document.getElementById('input-login');
  const emailEl = document.getElementById('input-email');
  const ageEl = document.getElementById('input-age');
  const passwordEl = document.getElementById('input-password');

  const firstNameInput = firstNameEl.value.trim();
  const lastNameInput = lastNameEl.value.trim();
  const loginInput = loginEl.value.trim();
  const emailInput = emailEl.value.trim();
  const passwordInput = passwordEl.value;
  const ageInputStr = ageEl ? ageEl.value.trim() : "";

  const validationError = validateAccountForm(firstNameInput, lastNameInput, loginInput, emailInput, passwordInput, ageInputStr, userRole);
  if (validationError) {
    showStatusMessage(validationError, "error-text");
    return;
  }

  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  try {
    const updatePromises = [];
    const handleResponse = async (res, defaultMsg) => {
      if (!res.ok) {
        let errDetail = defaultMsg;
        try {
          const errData = await res.json();
          if (errData && errData.detail) errDetail = errData.detail;
        } catch (e) {}
        throw new Error(errDetail);
      }
    };

    if (firstNameInput !== firstNameEl.dataset.initial || lastNameInput !== lastNameEl.dataset.initial) {
      updatePromises.push(
        fetch(`${API_BASE_URL}/users/change`, {
          method: 'PATCH',
          headers: headers,
          body: JSON.stringify({
            first_name: firstNameInput,
            last_name: lastNameInput
          })
        }).then(res => handleResponse(res, "Помилка оновлення імені/прізвища"))
      );
    }

    if (loginInput !== loginEl.dataset.initial) {
      const loginUrl = new URL(`${API_BASE_URL}/users/login`);
      loginUrl.searchParams.append('new_login', loginInput);
      updatePromises.push(
        fetch(loginUrl, { method: 'PATCH', headers: headers })
          .then(res => handleResponse(res, "Помилка оновлення логіну"))
      );
    }

    if (emailInput !== emailEl.dataset.initial) {
      const emailUrl = new URL(`${API_BASE_URL}/users/email`);
      emailUrl.searchParams.append('new_email', emailInput);
      updatePromises.push(
        fetch(emailUrl, { method: 'PATCH', headers: headers })
          .then(res => handleResponse(res, "Помилка оновлення email"))
      );
    }

    if (passwordInput.trim() !== '') {
      const passUrl = new URL(`${API_BASE_URL}/users/password`);
      passUrl.searchParams.append('new_password', passwordInput);
      updatePromises.push(
        fetch(passUrl, { method: 'PATCH', headers: headers })
          .then(res => handleResponse(res, "Помилка оновлення пароля"))
      );
    }

    if (userRole === 'patient' && ageEl && ageInputStr !== ageEl.dataset.initial) {
      const ageInput = parseInt(ageInputStr, 10);
      const ageUrl = new URL(`${API_BASE_URL}/patients/me/age`);
      ageUrl.searchParams.append('new_age', ageInput);
      updatePromises.push(
        fetch(ageUrl, { method: 'PUT', headers: headers })
          .then(res => handleResponse(res, "Помилка оновлення віку пацієнта"))
      );
    }

    if (updatePromises.length === 0) {
      showStatusMessage("Немає змін для збереження", "success-text");
      passwordEl.value = '';
      return;
    }

    await Promise.all(updatePromises);
    showStatusMessage("Дані успішно оновлено!", "success-text");
    passwordEl.value = '';
    await loadUserData();
  } catch (error) {
    console.error("Помилка:", error);
    let displayMessage = error.message || "Сталася помилка при збереженні змін.";
    const lowerMsg = displayMessage.toLowerCase();
    if (lowerMsg.includes("email already") || lowerMsg.includes("email exists") || lowerMsg.includes("email already registered")) {
      displayMessage = "Помилка: Користувач з таким Email вже існує.";
    } else if (lowerMsg.includes("login already") || lowerMsg.includes("username already")) {
      displayMessage = "Помилка: Цей логін вже зайнятий.";
    }
    showStatusMessage(displayMessage, "error-text");
  }
}

let statusMessageTimer;

// Відображає тимчасове повідомлення (успіх або помилка) під формою редагування профілю
function showStatusMessage(text, className) {
  const messageEl = document.getElementById('status-message');
  if (!messageEl) return;
  if (statusMessageTimer) clearTimeout(statusMessageTimer);
  messageEl.textContent = text;
  messageEl.className = className;
  const timeoutMs = className === "error-text" ? 4500 : 2000;
  statusMessageTimer = setTimeout(() => {
    messageEl.textContent = "";
    messageEl.className = "";
  }, timeoutMs);
}

// Відправляє запит на бекенд для безповоротного видалення акаунту користувача та обробляє можливі помилки
async function deleteAccount() {
  try {
    const response = await fetch(`${API_BASE_URL}/users/me`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
      }
    });

    if (response.ok) {
      showDeleteMessage("Акаунт успішно видалено.", "success-text");
      setTimeout(() => {
        logoutUser(new Event('click'));
      }, 2000);
    } else {
      let errorMessage = "Не вдалося видалити акаунт.";
      try {
        const errorData = await response.json();
        if (errorData && errorData.detail) {
          if (errorData.detail === "There must be at least three administrators in the system") {
            errorMessage = "У системі має залишатися мінімум 3 адміністратори.";
          } else {
            errorMessage = errorData.detail; // Інші помилки виводимо як є
          }
        }
      } catch (e) {
        console.error("Не вдалося прочитати JSON помилки");
      }
      throw new Error(errorMessage);
    }
  } catch (error) {
    console.error("Помилка видалення:", error);
    showDeleteMessage(error.message, "error-text");
  }
}

// Відображає тимчасове повідомлення про статус видалення акаунту під відповідною кнопкою
function showDeleteMessage(text, className) {
  const messageEl = document.getElementById('delete-status-message');
  if (!messageEl) return;
  messageEl.textContent = text;
  messageEl.className = className;
  setTimeout(() => {
    messageEl.textContent = "";
    messageEl.className = "";
  }, 3000);
}

// Видаляє токен доступу та роль користувача з локального сховища і перенаправляє на сторінку входу
function logoutUser(event) {
  if (event) event.preventDefault();
  localStorage.removeItem('access_token');
  localStorage.removeItem('user_role');
  window.location.href = 'main_and_auth.html';
}

// Здійснює перехід на відповідну головну сторінку залежно від ролі користувача
function goHome() {
  const userRole = localStorage.getItem('user_role');
  if (userRole === 'admin') {
    window.location.href = 'home_page_for_admin.html';
  } else {
    window.location.href = 'home_page.html';
  }
}

// Повертає користувача на попередню сторінку, якщо вона належить сайту, або перенаправляє на головну
function goBack(event) {
  if (event) event.preventDefault();
  const referrer = document.referrer;
  const currentHost = window.location.hostname;
  if (referrer && referrer.includes(currentHost)) {
    window.history.back();
  } else {
    goHome();
  }
}
