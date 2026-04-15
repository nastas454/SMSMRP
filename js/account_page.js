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
  // Тут повинен бути GET запит для отримання даних користувача
  /*
  const response = await fetch(`${API_BASE_URL}/users/me`, {
    headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
  });
  const userData = await response.json();
  */

  // Демонстраційні дані для прикладу (замініть на реальні з API)
  const userData = {
    login: "doctor_smith",
    name: "Джон",
    surname: "Сміт",
    gender: "Чоловік",
    age: 42,
    email: "john.smith@example.com"
  };

  // Заповнюємо ліву картку (відображення)
  document.getElementById('display-login').textContent = userData.login;
  document.getElementById('display-name').textContent = userData.name || '-';
  document.getElementById('display-surname').textContent = userData.surname || '-';
  document.getElementById('display-gender').textContent = userData.gender || '-';
  document.getElementById('display-age').textContent = userData.age || '-';
  document.getElementById('display-email').textContent = userData.email || '-';

  // Заповнюємо праву форму (редагування)
  document.getElementById('input-login').value = userData.login;
  document.getElementById('input-name').value = userData.name;
  document.getElementById('input-surname').value = userData.surname;
  document.getElementById('input-age').value = userData.age;
  document.getElementById('input-email').value = userData.email;
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
  const updatedData = {
    name: document.getElementById('input-name').value,
    login: document.getElementById('input-login').value,
    surname: document.getElementById('input-surname').value,
    age: document.getElementById('input-age').value,
    email: document.getElementById('input-email').value,
    // Пароль передаємо тільки якщо він введений
  };

  const passwordInput = document.getElementById('input-password').value;
  if (passwordInput.trim() !== '') {
    updatedData.password = passwordInput;
  }

  try {
    // Реальний PUT/PATCH запит до API
    /*
    const response = await fetch(`${API_BASE_URL}/users/me`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updatedData)
    });

    if (response.ok) {
      alert("Дані успішно оновлено!");
      loadUserData(); // Оновлюємо відображення
    } else {
      alert("Помилка при оновленні даних.");
    }
    */

    // Для демо
    console.log("Відправка даних на сервер:", updatedData);
    alert("Дані успішно оновлено! (Демонстрація)");

    // Оновлюємо ліву картку вручну для демо ефекту
    document.getElementById('display-login').textContent = updatedData.login;
    document.getElementById('display-name').textContent = updatedData.name;
    document.getElementById('display-surname').textContent = updatedData.surname;
    document.getElementById('display-age').textContent = updatedData.age;
    document.getElementById('display-email').textContent = updatedData.email;
    document.getElementById('input-password').value = ''; // Очищаємо поле пароля після зміни

  } catch (error) {
    console.error("Помилка:", error);
  }
}

async function deleteAccount() {
  try {
    // Реальний DELETE запит
    /*
    const response = await fetch(`${API_BASE_URL}/users/me`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
    });

    if (response.ok) {
      alert("Акаунт видалено.");
      logoutUser(new Event('click'));
    }
    */

    alert("Акаунт видалено. Перенаправлення... (Демонстрація)");
    logoutUser(new Event('click'));
  } catch (error) {
    console.error("Помилка видалення:", error);
  }
}

function logoutUser(event) {
  if(event) event.preventDefault();
  localStorage.removeItem('access_token');
  localStorage.removeItem('user_role');
  window.location.href = 'main_and_auth.html';
}
