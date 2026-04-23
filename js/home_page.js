const API_BASE_URL = "http://localhost:8000"; // Ваша адреса бекенду

document.addEventListener('DOMContentLoaded', () => {
  initApp();
});

// Ініціалізує застосунок (перевіряє токен, завантажує дані користувача та список курсів, налаштовує кнопки залежно від ролі)
async function initApp() {
  const token = localStorage.getItem('access_token');
  if (!token) {
    console.warn("Токен відсутній. Перенаправлення на вхід.");
    window.location.href = '/login.html';
    return;
  }
  const role = getUserRole();
  console.log("Поточна роль:", role);
  await fetchAndDisplayUser();
  setupAddButton(role);
  if (role !== 'doctor') {
    setupModalListeners();
  }
  await loadCourses(role);
}

// Налаштовує логіку кнопки "Додати" (перехід на сторінку створення курсу для лікаря або відкриття модального вікна для пацієнта)
function setupAddButton(role) {
  const btn = document.getElementById('add-course-btn');
  if (!btn) return;
  const newBtn = btn.cloneNode(true);
  newBtn.onclick = null;
  btn.parentNode.replaceChild(newBtn, btn);

  newBtn.addEventListener('click', (event) => {
    event.preventDefault();
    if (role === 'doctor') {
      console.log("Лікар: перехід на constructor_course.html");
      sessionStorage.removeItem('course_edit_data');
      sessionStorage.removeItem('course_edit_id');
      window.location.href = "constructor_course.html";
    } else {
      console.log("Пацієнт: відкриття модального вікна");
      openJoinModal();
    }
  });
}

// Завантажує список курсів з сервера (залежно від ролі), сортує їх та викликає функції для відображення інтерфейсу
async function loadCourses(role) {
  const endpoint = role === 'doctor'
    ? `${API_BASE_URL}/doctors/courses`
    : `${API_BASE_URL}/patients/courses`;

  try {
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.status === 401) {
      alert("Сесія закінчилась. Будь ласка, увійдіть знову.");
      window.location.href = '/login.html';
      return;
    }

    if (!response.ok) throw new Error(`Status: ${response.status}`);
    const courses = await response.json();
    const activeCourses = courses.filter(c => c.is_active !== false);
    const completedCourses = courses.filter(c => c.is_active === false);
    const sortedCourses = [...activeCourses, ...completedCourses];
    renderSidebar(sortedCourses);
    renderGrid(sortedCourses, role);
    updateWelcomePanel(activeCourses.length, completedCourses.length, role);

  } catch (error) {
    console.error("Помилка завантаження курсів:", error);
    const grid = document.getElementById('courses-grid');
    if (grid) {
      grid.innerHTML = `<p style="text-align: center; color: red;">Не вдалося завантажити курси</p>`;
    }
  }
}

const modal = document.getElementById('join-modal');
const modalInput = document.getElementById('modal-course-id');
const errorText = document.getElementById('modal-error');
const successText = document.getElementById('modal-success');

// Змінні для контролю таймерів (щоб вони не збивалися при швидких кліках)
let messageTimer;

// Приховує та очищає всі повідомлення про помилку або успіх у модальному вікні
function hideAllMessages() {
  const errorText = document.getElementById('modal-error');
  const successText = document.getElementById('modal-success');

  if (errorText) {
    errorText.classList.add('hidden');
    errorText.textContent = '';
  }
  if (successText) {
    successText.classList.add('hidden');
    successText.textContent = '';
  }
  if (typeof messageTimer !== 'undefined') {
    clearTimeout(messageTimer);
  }
}

// Відкриває модальне вікно для приєднання до курсу та фокусує поле вводу
function openJoinModal() {
  const modal = document.getElementById('join-modal');
  const modalInput = document.getElementById('modal-course-id');
  if (!modal) return;
  modal.classList.remove('hidden');
  hideAllMessages();

  if (modalInput) {
    modalInput.value = '';
    modalInput.focus();
  }
}

// Закриває модальне вікно та очищає введені дані
function closeJoinModal() {
  const modal = document.getElementById('join-modal');
  const modalInput = document.getElementById('modal-course-id');
  if (modal) modal.classList.add('hidden');
  hideAllMessages();

  if (modalInput) modalInput.value = '';
}

// Відображає повідомлення про помилку в модальному вікні та автоматично приховує його через 2.5 секунди
function showModalError(msg) {
  hideAllMessages();
  if (errorText) {
    errorText.textContent = msg;
    errorText.classList.remove('hidden');
    messageTimer = setTimeout(() => {
      errorText.classList.add('hidden');
    }, 2500);
  } else {
    alert(msg);
  }
}

// Показує повідомлення про успішне приєднання, а потім автоматично закриває вікно та оновлює список курсів
function showModalSuccess(message) {
  hideAllMessages();
  if (successText) {
    successText.textContent = message;
    successText.classList.remove('hidden');
    messageTimer = setTimeout(() => {
      successText.classList.add('hidden');
      closeJoinModal();
      loadCourses('user');
    }, 1200);
  }
}

// Додає обробники подій на кнопки модального вікна та на його фон
function setupModalListeners() {
  if (!modal) return;
  const closeBtn = document.getElementById('close-modal-btn');
  const cancelBtn = document.getElementById('cancel-btn');
  if (closeBtn) closeBtn.onclick = closeJoinModal;
  if (cancelBtn) cancelBtn.onclick = closeJoinModal;
  modal.onclick = (event) => {
    if (event.target === modal) closeJoinModal();
  };
  const confirmBtn = document.getElementById('confirm-join-btn');
  if (confirmBtn) {
    const newConfirmBtn = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);

    newConfirmBtn.addEventListener('click', async () => {
      const courseId = modalInput.value.trim();
      if (!courseId) {
        showModalError("Введіть ID курсу");
        return;
      }
      await joinCourseAsUser(courseId);
    });
  }
}

// Відправляє запит на сервер для приєднання пацієнта до курсу за введеним ID та обробляє результат
async function joinCourseAsUser(courseId) {
  hideAllMessages();

  try {
    const token = localStorage.getItem('access_token');
    const response = await fetch(`${API_BASE_URL}/patients/${courseId}/join`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      if (modalInput) modalInput.value = '';
      showModalSuccess("Успішно приєднано!");
    } else {
      const err = await response.json();
      let errorMessage = err.detail || err.message || 'Помилка приєднання';

      if (typeof errorMessage === 'string' && errorMessage.includes('already enrolled')) {
        errorMessage = "Ви вже приєднані до цього курсу!";
      }
      showModalError(errorMessage);
    }
  } catch (error) {
    console.error(error);
    showModalError("Помилка з'єднання");
  }
}

// Генерує та відображає список курсів у боковій панелі навігації
function renderSidebar(courses) {
  const list = document.getElementById('sidebar-list');
  if (!list) return;
  list.innerHTML = "";
  courses.forEach(course => {
    const li = document.createElement('li');
    li.textContent = course.title || `${course.course_name}`;
    li.onclick = () => {
      window.location.href = `course_page.html?id=${course.id}`;
    };
    list.appendChild(li);
  });
}

// Відправляє запит на видалення курсу (для лікаря) або від'єднання від нього (для пацієнта) та оновлює список
async function handleCourseAction(courseId, role) {
  const isDoctor = role === 'doctor';
  const endpoint = isDoctor
    ? `${API_BASE_URL}/courses/${courseId}`
    : `${API_BASE_URL}/patients/${courseId}/leave`;

  try {
    const token = localStorage.getItem('access_token');
    const response = await fetch(endpoint, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.ok) {
      loadCourses(role);
    } else {
      const err = await response.json();
      console.error("Помилка видалення:", err);
      alert(`Помилка: ${err.detail || 'Не вдалося виконати дію'}`);
    }
  } catch (error) {
    console.error("Помилка при видаленні/від'єднанні:", error);
    alert("Помилка з'єднання з сервером.");
  }
}

// Генерує картки курсів для головної сітки, відображаючи різну інформацію залежно від ролі
function renderGrid(courses, role) {
  const grid = document.getElementById('courses-grid');
  if (!grid) return;
  grid.innerHTML = "";

  if (courses.length === 0) {
    grid.innerHTML = `<p style="width: 100%; text-align: center;">Список курсів порожній.</p>`;
    return;
  }

  courses.forEach(course => {
    const isDoctor = role === 'doctor'; // Перевіряємо чи це лікар
    const progress = course.progress ?? 0;
    const isCompleted = course.is_active === false;
    const actionText = isDoctor ? 'Видалити курс' : 'Від\'єднатись';
    const actionClass = isDoctor ? 'delete-course-btn' : 'leave-course-btn';
    const card = document.createElement('div');
    card.className = (!isDoctor && isCompleted) ? 'course-card completed-course' : 'course-card';
    card.onclick = (event) => {
      if (event.target.closest('.options-container')) return;
      window.location.href = `course_page.html?id=${course.id}`;
    };

    const titleHtml = (!isDoctor && isCompleted)
      ? `${course.course_name || 'Без назви'} <span style="font-size: 13px; color: #60a7bd; font-weight: normal;">(Завершено)</span>`
      : `${course.course_name || 'Без назви'}`;

    const progressHtml = isDoctor ? '' : `
      <div style="margin-top: 20px;">
          <span class="progress-text">Прогрес: ${isCompleted ? '100' : progress}%</span>
          <div class="progress-container">
              <div class="progress-bar" style="width: ${isCompleted ? '100' : progress}%"></div>
          </div>
      </div>
    `;

    card.innerHTML = `
      <div class="card-header"><h3 class="card-title">${titleHtml}</h3></div>
      <div class="card-body">
          <p><span class="card-label">Травми:</span> ${course.injuries || '-'}</p>
          <p><span class="card-label">Опис:</span><br>${course.description || '-'}</p>
          ${progressHtml} </div>
      <div class="card-footer">
          <span class="doctor-name"><span class="card-label">Лікар:</span> ${course.doctor_name + " " + course.doctor_lastname}</span>

          <div class="options-container">
            <button class="more-options-btn" onclick="toggleDropdown(event)">
              <i class="fas fa-ellipsis-v"></i>
            </button>
            <div class="dropdown-menu hidden">
              <button class="dropdown-item ${actionClass}" data-id="${course.id}" onclick="handleCourseAction('${course.id}', '${role}')">${actionText}</button>
            </div>
          </div>
      </div>
    `;
    grid.appendChild(card);
  });
}

// Запитує дані поточного користувача з сервера та відображає його ім'я і прізвище в інтерфейсі
async function fetchAndDisplayUser() {
  const token = localStorage.getItem('access_token');
  if (!token) return;
  try {
    const response = await fetch(`${API_BASE_URL}/users/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    if (response.ok) {
      const userData = await response.json();
      const nameElement = document.getElementById('user-name');
      if (nameElement) {
        nameElement.textContent = `${userData.first_name} ${userData.last_name}`;
      }
      localStorage.setItem('user_first_name', userData.first_name);
      localStorage.setItem('user_last_name', userData.last_name);
    } else {
      console.warn("Не вдалося отримати дані користувача (Status:", response.status, ")");
    }
  } catch (error) {
    console.error("Помилка при запиті /users/me:", error);
  }
}

// Відкриває/закриває контекстне меню для конкретної картки курсу, закриваючи всі інші відкриті меню
window.toggleDropdown = function(event) {
  event.stopPropagation();
  document.querySelectorAll('.dropdown-menu').forEach(menu => {
    if (menu !== event.currentTarget.nextElementSibling) {
      menu.classList.add('hidden');
    }
  });
  const menu = event.currentTarget.nextElementSibling;
  if (menu) {
    menu.classList.toggle('hidden');
  }
};

document.addEventListener('click', () => {
  document.querySelectorAll('.dropdown-menu').forEach(menu => {
    menu.classList.add('hidden');
  });
});

// Оновлює лічильники активних і завершених курсів у верхній панелі (відображається лише для пацієнтів)
function updateWelcomePanel(activeCount, completedCount, role) {
  const statsContainer = document.querySelector('.welcome-stats');
  if (role === 'doctor') {
    if (statsContainer) statsContainer.style.display = 'none';
    return;
  }
  if (statsContainer) statsContainer.style.display = 'flex';
  const activeEl = document.getElementById('active-courses-count');
  const completedEl = document.getElementById('completed-courses-count');
  if (activeEl) activeEl.textContent = activeCount;
  if (completedEl) completedEl.textContent = completedCount;
}

// Очищає локальне сховище від токенів та даних користувача і перенаправляє на сторінку входу
function logoutUser(event) {
  event.preventDefault();
  localStorage.removeItem('access_token');
  localStorage.removeItem('user_role');
  window.location.href = 'main_and_auth.html';
}


