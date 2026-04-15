const API_BASE_URL = 'http://localhost:8000';

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

function goBack() {
  document.getElementById('auth-section').classList.add('hidden');
  document.getElementById('landing-page').classList.remove('hidden');
  document.querySelector('.brand-overlay').classList.remove('hidden');
  document.querySelector('.contact-fab').classList.remove('hidden');
}

function toggleContactModal(show) {
  const modal = document.getElementById('contact-modal');
  if (show) {
    modal.classList.remove('hidden');
  } else {
    modal.classList.add('hidden');
  }
}

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

async function handleLogin(event) {
  event.preventDefault();
  const form = event.target;
  const errorBox = form.querySelector('.error-message');

  if (errorBox) {
    errorBox.style.display = 'none';
    errorBox.innerText = '';
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
      const errorMessage = errorData.detail || 'Сталася помилка входу';
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

  const nameRegex = /^[a-zA-Zа-яА-ЯґҐєЄіІїЇ\-\']+$/;

  if (!firstName || firstName.length < 2) { showError("❌ Ім'я має бути не коротше 2 символів."); return; }
  if (!nameRegex.test(firstName)) { showError("❌ Ім'я містить недопустимі символи."); return; }
  if (!lastName || lastName.length < 2) { showError("❌ Прізвище має бути не коротше 2 символів."); return; }
  if (!nameRegex.test(lastName)) { showError("❌ Прізвище містить недопустимі символи."); return; }

  const age = Number(ageStr);
  if (!ageStr || isNaN(age) || age < 1 || age > 130) { showError("❌ Вкажіть коректний вік."); return; }
  if (!login || login.length < 8) { showError("❌ Логін має бути не менше 8 символів."); return; }
  if (!password || password.length < 8) { showError("❌ Пароль має бути не менше 8 символів."); return; }

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
      showError(errorData.detail || errorData);
    }
  } catch (error) {
    console.error(error);
    showError('⚠️ Немає з\'єднання з сервером.');
  }
}
