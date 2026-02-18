const API_BASE_URL = 'http://localhost:8000';

// Керування розділами (Авторизація)
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

// Повернення назад
function goBack() {
  document.getElementById('auth-section').classList.add('hidden');
  document.getElementById('landing-page').classList.remove('hidden');
  document.querySelector('.brand-overlay').classList.remove('hidden');
  document.querySelector('.contact-fab').classList.remove('hidden');
}

// Керування формою "Зв'язатись з нами"
function toggleContactModal(show) {
  const modal = document.getElementById('contact-modal');
  if (show) {
    modal.classList.remove('hidden');
  } else {
    modal.classList.add('hidden');
  }
}

// Імітація відправки повідомлення
function handleContactSubmit(event) {
  event.preventDefault();
  alert('Ваше повідомлення надіслано! Ми зв\'яжемося з вами найближчим часом.');
  toggleContactModal(false);
  event.target.reset();
}

// Функцій логін/реєстрація
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

// Допоміжна функція для розшифровки токена
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

// Логіка для авторизації
  async function handleLogin(event, apiPath) {
    event.preventDefault();
    const form = event.target;

    // Блок помилки всередині цієї форми
    const errorBox = form.querySelector('.error-message');

    // Ховаємо попередні помилки перед новим запитом
    if (errorBox) {
      errorBox.style.display = 'none';
      errorBox.innerText = '';
    }

    const username = form.username.value;
    const password = form.password.value;

    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);

    try {
      const response = await fetch(`http://localhost:8000${apiPath}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: formData
      });

      // Якщо статус не ОК
      if (!response.ok) {
        const errorData = await response.json();

        // Дістаємо текст помилки з поля "detail"
        const errorMessage = errorData.detail || 'Сталася помилка входу';

        // Показуємо помилку під формою
        if (errorBox) {
          errorBox.innerText = errorMessage;
          errorBox.style.display = 'block';
        } else {
          alert(errorMessage);
        }
        return;
      }

      // Якщо все добре (успішний вхід)
      const data = await response.json();
      const token = data.access_token;
      localStorage.setItem('access_token', token);

      const decodedToken = parseJwt(token);
      const userRole = decodedToken ? decodedToken.role : null;

      if (userRole) localStorage.setItem('user_role', userRole);

      // Якщо це не адміністратор, то вхід на іншу домашню сторінку
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

// Логіка реєстрації пацієнтів
async function handleRegister(event) {
  event.preventDefault();
  const form = event.target;
  const formData = new FormData(form);

  const submitBtn = form.querySelector('button[type="submit"]');

  // Блок помилок
  let errorBox = form.querySelector('.error-message');
  if (!errorBox) {
    errorBox = document.createElement('div');
    errorBox.className = 'error-message';
    form.insertBefore(errorBox, submitBtn);
  }

  // Блок успіху
  let successBox = form.querySelector('.success-message');
  if (!successBox) {
    successBox = document.createElement('div');
    successBox.className = 'success-message';
    form.insertBefore(successBox, submitBtn);
  }

  // Функції для показу повідомлень
  const showError = (text) => {
    successBox.style.display = 'none'; // ховаємо успіх, якщо є помилка

    if (typeof text === 'object') {
      if (Array.isArray(text)) {
        text = text.map(e => `Поле ${e.loc[1]}: ${e.msg}`).join('\n');
      } else {
        text = JSON.stringify(text, null, 2);
      }
    }
    errorBox.innerText = text;
    errorBox.style.display = 'block';
  };

  const showSuccess = (text) => {
    errorBox.style.display = 'none'; // ховаємо помилки
    successBox.innerText = text;
    successBox.style.display = 'block';
  };

  // Очищення перед новою спробою
  errorBox.style.display = 'none';
  successBox.style.display = 'none';

  // Отримування даних
  const firstName = formData.get('first_name')?.trim();
  const lastName = formData.get('last_name')?.trim();
  const ageStr = formData.get('age');
  const login = formData.get('login')?.trim() || formData.get('username')?.trim();
  const password = formData.get('password');
  const sexRaw = formData.get('sex');

  // Валідація (Regex)
  const nameRegex = /^[a-zA-Zа-яА-ЯґҐєЄіІїЇ\-\']+$/;
  const loginRegex = /^[a-zA-Zа-яА-ЯґҐєЄіІїЇ0-9]+$/;

  if (!firstName || firstName.length < 2) { showError("❌ Ім'я має бути не коротше 2 символів."); return; }
  if (!nameRegex.test(firstName)) { showError("❌ Ім'я містить недопустимі символи."); return; }

  if (!lastName || lastName.length < 2) { showError("❌ Прізвище має бути не коротше 2 символів."); return; }
  if (!nameRegex.test(lastName)) { showError("❌ Прізвище містить недопустимі символи."); return; }

  const age = Number(ageStr);
  if (!ageStr || isNaN(age) || age < 1 || age > 130) { showError("❌ Вкажіть коректний вік."); return; }

  if (!login || login.length < 8) { showError("❌ Логін має бути не менше 8 символів."); return; }
  if (!loginRegex.test(login)) { showError("❌ Логін містить недопустимі символи."); return; }

  if (!password || password.length < 8) { showError("❌ Пароль має бути не менше 8 символів."); return; }

  // Підготовка даних (Mapping)
  if (formData.has('username') && !formData.has('login')) {
    formData.append('login', login);
    formData.delete('username');
  }
  if (sexRaw === 'Чоловік') formData.set('sex', 'MALE');
  if (sexRaw === 'Жінка') formData.set('sex', 'FEMALE');

  // Надсилаємо бек-енду
  try {
    const response = await fetch('http://localhost:8000/auth/users/register', {
      method: 'POST',
      body: formData
    });

    if (response.ok) {
      showSuccess('✅ Реєстрація успішна! Перенаправлення...');
      form.reset();

      // Чекаємо 2 секунди, щоб користувач встиг прочитати повідомлення,
      // і тільки потім перемикаємо на вхід
      setTimeout(() => {
        if (typeof togglePatientMode === 'function') togglePatientMode('login');
        // Приховуємо повідомлення після переходу
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
