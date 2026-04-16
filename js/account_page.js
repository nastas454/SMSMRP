const API_BASE_URL = "http://localhost:8000";

document.addEventListener('DOMContentLoaded', () => {
  initAccountPage();
});

async function initAccountPage() {
  const token = localStorage.getItem('access_token');
  if (!token) {
    window.location.href = '/login.html';
    return;
  }

  await loadUserData();
  setupEventListeners();
}

async function loadUserData() {
  const token = localStorage.getItem('access_token');
  // Отримуємо роль з локального сховища (переконайтесь, що ви зберігаєте її під час логіну)
  const userRole = localStorage.getItem('user_role');

  try {
    // 1. Отримання базових даних користувача
    const userResponse = await fetch(`${API_BASE_URL}/users/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!userResponse.ok) throw new Error("Помилка отримання даних користувача");
    const userData = await userResponse.json();

    // Заповнюємо ліву картку (відображення) - базові дані
    document.getElementById('display-login').textContent = userData.login;
    document.getElementById('display-name').textContent = userData.first_name || '-';
    document.getElementById('display-surname').textContent = userData.last_name || '-';
    document.getElementById('display-email').textContent = userData.email || '-';

    // Заповнюємо праву форму (редагування) - базові дані
    document.getElementById('input-login').value = userData.login;
    document.getElementById('input-name').value = userData.first_name;
    document.getElementById('input-surname').value = userData.last_name;
    document.getElementById('input-email').value = userData.email;

    // Отримуємо контейнери полів, які залежать від ролі
    const displayGenderContainer = document.getElementById('container-display-gender');
    const displayAgeContainer = document.getElementById('container-display-age');
    const inputAgeContainer = document.getElementById('container-input-age');

    // 2. Якщо роль "patient", завантажуємо додаткові дані
    if (userRole === 'patient') {
      const patientResponse = await fetch(`${API_BASE_URL}/patients/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!patientResponse.ok) throw new Error("Помилка отримання даних пацієнта");
      const patientData = await patientResponse.json();

      // Заповнюємо дані пацієнта
      document.getElementById('display-gender').textContent = patientData.sex || '-';
      document.getElementById('display-age').textContent = patientData.age || '-';
      document.getElementById('input-age').value = patientData.age || '';

      // Показуємо поля
      if (displayGenderContainer) displayGenderContainer.style.display = 'flex';
      if (displayAgeContainer) displayAgeContainer.style.display = 'flex';
      if (inputAgeContainer) inputAgeContainer.style.display = 'flex';
    } else {
      // Якщо це не пацієнт, приховуємо ці поля
      if (displayGenderContainer) displayGenderContainer.style.display = 'none';
      if (displayAgeContainer) displayAgeContainer.style.display = 'none';
      if (inputAgeContainer) inputAgeContainer.style.display = 'none';
    }

  } catch (error) {
    console.error("Помилка:", error);
    alert("Не вдалося завантажити профіль.");
  }
}

function setupEventListeners() {
  const editForm = document.getElementById('edit-profile-form');
  const deleteBtn = document.getElementById('delete-account-btn');

  editForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    await updateUserData();
  });

  deleteBtn.addEventListener('click', async () => {
    const isConfirmed = confirm("Ви впевнені, що хочете видалити свій акаунт? Цю дію неможливо скасувати.");
    if (isConfirmed) {
      await deleteAccount();
    }
  });
}

async function updateUserData() {
  const token = localStorage.getItem('access_token');
  const userRole = localStorage.getItem('user_role');

  // Отримуємо поточні значення з полів
  const firstNameInput = document.getElementById('input-name').value;
  const lastNameInput = document.getElementById('input-surname').value;
  const loginInput = document.getElementById('input-login').value;
  const emailInput = document.getElementById('input-email').value;
  const passwordInput = document.getElementById('input-password').value;

  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  try {
    // Масив для зберігання всіх запитів (щоб виконати їх одночасно)
    const updatePromises = [];

    // 1. Оновлення імені та прізвища (PATCH /users/change)
    // Тіло запиту відповідає моделі ChangeUser
    updatePromises.push(
      fetch(`${API_BASE_URL}/users/change`, {
        method: 'PATCH',
        headers: headers,
        body: JSON.stringify({
          first_name: firstNameInput,
          last_name: lastNameInput
        })
      }).then(res => { if (!res.ok) throw new Error("Помилка оновлення імені/прізвища"); })
    );

    // 2. Оновлення логіну (PATCH /users/login?new_login=...)
    const loginUrl = new URL(`${API_BASE_URL}/users/login`);
    loginUrl.searchParams.append('new_login', loginInput);
    updatePromises.push(
      fetch(loginUrl, { method: 'PATCH', headers: headers })
        .then(res => { if (!res.ok) throw new Error("Помилка оновлення логіну"); })
    );

    // 3. Оновлення email (PATCH /users/email?new_email=...)
    const emailUrl = new URL(`${API_BASE_URL}/users/email`);
    emailUrl.searchParams.append('new_email', emailInput);
    updatePromises.push(
      fetch(emailUrl, { method: 'PATCH', headers: headers })
        .then(res => { if (!res.ok) throw new Error("Помилка оновлення email"); })
    );

    // 4. Оновлення пароля (PATCH /users/password?new_password=...) - лише якщо поле не пусте
    if (passwordInput.trim() !== '') {
      const passUrl = new URL(`${API_BASE_URL}/users/password`);
      passUrl.searchParams.append('new_password', passwordInput);
      updatePromises.push(
        fetch(passUrl, { method: 'PATCH', headers: headers })
          .then(res => { if (!res.ok) throw new Error("Помилка оновлення пароля"); })
      );
    }

    // 5. Оновлення даних пацієнта (якщо це пацієнт)
    if (userRole === 'patient') {
      const ageInput = parseInt(document.getElementById('input-age').value, 10);
      updatePromises.push(
        // Залишив метод PUT, але якщо ви змінили ендпоінт пацієнта на PATCH, змініть метод тут
        fetch(`${API_BASE_URL}/patients/me`, {
          method: 'PUT',
          headers: headers,
          body: JSON.stringify({ age: ageInput })
        }).then(res => { if (!res.ok) throw new Error("Помилка оновлення даних пацієнта"); })
      );
    }

    // Виконуємо всі сформовані запити паралельно
    await Promise.all(updatePromises);

    alert("Дані успішно оновлено!");
    document.getElementById('input-password').value = ''; // Очищаємо поле пароля після успішної зміни
    await loadUserData(); // Завантажуємо свіжі дані з сервера для оновлення UI лівої картки

  } catch (error) {
    console.error("Помилка:", error);
    alert(error.message || "Сталася помилка при збереженні змін.");
  }
}

async function deleteAccount() {
  try {
    // Вказуємо точний шлях /users/me
    const response = await fetch(`${API_BASE_URL}/users/me`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
      }
    });

    if (response.ok) {
      alert("Акаунт видалено.");
      logoutUser(new Event('click'));
    } else {
      throw new Error("Не вдалося видалити акаунт");
    }
  } catch (error) {
    console.error("Помилка видалення:", error);
    alert("Помилка при видаленні акаунта.");
  }
}

function logoutUser(event) {
  if (event) event.preventDefault();
  localStorage.removeItem('access_token');
  localStorage.removeItem('user_role');
  window.location.href = 'main_and_auth.html';
}

// ==========================================
// НОВІ ФУНКЦІЇ ДЛЯ НАВІГАЦІЇ
// ==========================================

/**
 * Перенаправляє на головну сторінку залежно від ролі
 */
function goHome() {
  const userRole = localStorage.getItem('user_role');

  if (userRole === 'admin') {
    window.location.href = 'home_page_for_admin.html';
  } else {
    // Для 'doctor', 'patient' та всіх інших
    window.location.href = 'home_page.html';
  }
}

/**
 * Повертає на попередню сторінку, якщо вона належить нашому сайту,
 * інакше перекидає на головну сторінку.
 */
function goBack(event) {
  if (event) event.preventDefault(); // Запобігаємо стандартному переходу за посиланням

  const referrer = document.referrer;
  const currentHost = window.location.hostname;

  // Якщо користувач перейшов сюди з іншої сторінки нашого сайту
  if (referrer && referrer.includes(currentHost)) {
    window.history.back();
  } else {
    goHome();
  }
}
