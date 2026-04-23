const API_BASE_URL = 'http://localhost:8000';

// Відкриває секцію авторизації та відображає форми відповідно до обраної ролі (адмін, лікар, пацієнт)
function openAuth(role) {
  document.getElementById('landing-page').classList.add('hidden');
  document.querySelector('.brand-overlay').classList.add('hidden');
  document.querySelector('.contact-fab').classList.add('hidden');
  document.getElementById('auth-section').classList.remove('hidden');
  document.querySelectorAll('.form-wrapper').forEach(el => el.classList.add('hidden'));

  if (role === 'admin') {
    document.getElementById('admin-forms').classList.remove('hidden');
  } else if (role === 'doctor') {
    document.getElementById('doctor-forms').classList.remove('hidden');
  } else if (role === 'patient') {
    document.getElementById('patient-forms').classList.remove('hidden');
    togglePatientMode('login');
  }
}

// Приховує секцію авторизації та повертає користувача на головну сторінку
function goBack() {
  document.getElementById('auth-section').classList.add('hidden');
  document.getElementById('landing-page').classList.remove('hidden');
  document.querySelector('.brand-overlay').classList.remove('hidden');
  document.querySelector('.contact-fab').classList.remove('hidden');
}

// Показує або приховує модальне вікно з контактами залежно від переданого параметра
function toggleContactModal(show) {
  const modal = document.getElementById('contact-modal');
  if (show) {
    modal.classList.remove('hidden');
  } else {
    modal.classList.add('hidden');
  }
}

// Перемикає видимість між формами входу та реєстрації у секції пацієнта
function togglePatientMode(mode) {
  const loginBlock = document.getElementById('patient-login-block');
  const registerBlock = document.getElementById('patient-register-block');
  const btns = document.querySelectorAll('.toggle-btns button');

  if (mode === 'login') {
    loginBlock.classList.remove('hidden');
    registerBlock.classList.add('hidden');
    btns[0].classList.add('active');
    btns[1].classList.remove('active');
  } else {
    loginBlock.classList.add('hidden');
    registerBlock.classList.remove('hidden');
    btns[0].classList.remove('active');
    btns[1].classList.add('active');
  }
}

// Декодує JWT токен і повертає його дані (payload) у форматі JSON
function parseJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

// Обробляє форму входу (відправляє дані на сервер, зберігає токени, обробляє помилки та здійснює перенаправлення)
async function handleLogin(event) {
  event.preventDefault();
  const form = event.target;
  const errorBox = form.querySelector('.error-message');

  if (errorBox) {
    errorBox.style.display = 'none';
    errorBox.innerText = '';
    errorBox.style.backgroundColor = '';
    errorBox.style.color = '';
    errorBox.style.border = '';
    errorBox.style.padding = '';
  }

  const username = form.elements['username'].value;
  const password = form.elements['password'].value;

  const formData = new URLSearchParams();
  formData.append('username', username);
  formData.append('password', password);

  try {
    const response = await fetch(`${API_BASE_URL}/auth/users/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json();
      let errorMessage = errorData.detail || 'Сталася помилка входу';

      if (errorMessage === "Ваш акаунт було заблоковано") {
        errorMessage = "Ваш акаунт було заблоковано. Зверніться до адміністратора";
        if (errorBox) {
          errorBox.style.backgroundColor = '#ffebee';
          errorBox.style.color = '#c62828';
          errorBox.style.border = '1px solid #ef5350';
          errorBox.style.padding = '10px';
          errorBox.style.borderRadius = '5px';
          errorBox.style.marginBottom = '15px';
        }
      }

      if (errorBox) {
        errorBox.innerText = errorMessage;
        errorBox.style.display = 'block';
      } else {
        alert(errorMessage);
      }
      return;
    }

    const data = await response.json();
    const token = data.access_token;
    localStorage.setItem('access_token', token);

    if (data.refresh_token) {
      localStorage.setItem('refresh_token', data.refresh_token);
    }

    const decodedToken = parseJwt(token);
    const userRole = decodedToken ? decodedToken.role : null;

    if (userRole) localStorage.setItem('user_role', userRole);
    if (userRole === 'admin') {
      window.location.href = 'home_page_for_admin.html';
    } else {
      window.location.href = 'home_page.html';
    }

  } catch (error) {
    console.error('Помилка мережі:', error);
    if (errorBox) {
      errorBox.innerText = 'Немає зв\'язку з сервером';
      errorBox.style.display = 'block';
    }
  }
}

// Обробляє форму реєстрації (проводить строгу валідацію полів, відправляє запит на сервер та відображає повідомлення про успіх або помилку)
async function handleRegister(event) {
  event.preventDefault();
  const form = event.target;
  const formData = new FormData(form);
  const submitBtn = form.querySelector('button[type="submit"]');

  let errorBox = form.querySelector('.error-message');
  if (!errorBox) {
    errorBox = document.createElement('div');
    errorBox.className = 'error-message';
    form.insertBefore(errorBox, submitBtn);
  }

  let successBox = form.querySelector('.success-message');
  if (!successBox) {
    successBox = document.createElement('div');
    successBox.className = 'success-message';
    form.insertBefore(successBox, submitBtn);
  }

  const showError = (text) => {
    successBox.style.display = 'none';
    if (typeof text === 'object') {
      if (Array.isArray(text)) {
        text = text.map(e => `Поле ${e.loc[e.loc.length - 1]}: ${e.msg}`).join('\n');
      } else {
        text = JSON.stringify(text, null, 2);
      }
    }
    errorBox.innerText = text;
    errorBox.style.display = 'block';
  };

  const showSuccess = (text) => {
    errorBox.style.display = 'none';
    successBox.innerText = text;
    successBox.style.display = 'block';
  };

  errorBox.style.display = 'none';
  successBox.style.display = 'none';

  const firstName = formData.get('first_name')?.trim();
  const lastName = formData.get('last_name')?.trim();
  const email = formData.get('email')?.trim();
  const login = formData.get('login')?.trim();
  const password = formData.get('password');
  const ageStr = formData.get('age');
  const sexRaw = formData.get('sex');

  const nameRegex = /^[\p{L}\-]{2,30}$/u;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const loginRegex = /^[a-zA-Z0-9_]{8,}$/;
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;

  if (!firstName || !nameRegex.test(firstName)) {
    showError("Ім'я: від 2 до 30 символів, дозволені лише букви та '-'");
    return;
  }
  if (!lastName || !nameRegex.test(lastName)) {
    showError("Прізвище: від 2 до 30 символів, дозволені лише букви та '-'");
    return;
  }
  if (!ageStr || !/^\d+$/.test(ageStr)) {
    showError("Вік: дозволені лише цілі цифри");
    return;
  }
  const age = parseInt(ageStr, 10);
  if (age < 1 || age > 130) {
    showError("Вік: введіть значення від 1 до 130");
    return;
  }
  if (/[A-Z]/.test(email)) {
    return "Email: використання великих літер заборонено.";
  }
  if (!email || !emailRegex.test(email)) {
    showError("Email: введіть коректну адресу (наприклад, name@example.com)");
    return;
  }
  if (!login || !loginRegex.test(login)) {
    showError("Логін: мін. 8 символів, без пробілів та спецсимволів (лише латиниця, цифри, '_')");
    return;
  }
  if (!password || !passwordRegex.test(password)) {
    showError("Пароль: мін. 8 символів, обов'язково великі та малі літери, цифри та спецсимволи");
    return;
  }

  let parsedSex = 'other';
  if (sexRaw === 'male' || sexRaw === 'Чоловік') parsedSex = 'male';
  else if (sexRaw === 'female' || sexRaw === 'Жінка') parsedSex = 'female';

  const requestBody = {
    register_user_dto: {
      first_name: firstName,
      last_name: lastName,
      email: email,
      login: login,
      password: password
    },
    register_patient_dto: {
      age: age,
      sex: parsedSex
    }
  };

  try {
    submitBtn.disabled = true;
    submitBtn.innerText = 'Завантаження...';
    const response = await fetch(`${API_BASE_URL}/auth/users/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (response.ok) {
      showSuccess('✅ Реєстрація успішна! Перенаправлення...');
      form.reset();

      setTimeout(() => {
        if (typeof togglePatientMode === 'function') togglePatientMode('login');
        successBox.style.display = 'none';
      }, 2000);

    } else {
      const errorData = await response.json();
      let displayMessage = errorData.detail || errorData;

      if (typeof displayMessage === 'string') {
        const lowerMsg = displayMessage.toLowerCase();
        if (lowerMsg.includes("email already registered") || lowerMsg.includes("email already exists")) {
          displayMessage = "Користувач з таким Email вже існує";
        } else if (lowerMsg.includes("login already") || lowerMsg.includes("username already")) {
          displayMessage = "Цей логін вже зайнятий";
        }
      }

      showError(displayMessage);
    }
  } catch (error) {
    console.error(error);
    showError('⚠️ Немає з\'єднання з сервером.');
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerText = 'Зареєструватися';
  }
}
