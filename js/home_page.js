// --- КОНФІГУРАЦІЯ ---
const API_BASE_URL = "http://localhost:8000"; // Ваша адреса бекенду

document.addEventListener('DOMContentLoaded', () => {
  initApp();
});

// --- ІНІЦІАЛІЗАЦІЯ ---

async function initApp() {
  // 1. Перевіряємо токен
  const token = localStorage.getItem('access_token');

  if (!token) {
    console.warn("Токен відсутній. Перенаправлення на вхід.");
    window.location.href = '/login.html';
    return;
  }

  // 2. Отримуємо роль (з utils.js)
  const role = getUserRole();
  console.log("Поточна роль:", role);

  // === ДОДАЄМО ВИКЛИК ТУТ ===
  // Запитуємо ім'я користувача і виводимо на екран
  await fetchAndDisplayUser();
  // =========================

  // 3. Налаштовуємо кнопку
  setupAddButton(role);

  // 4. Налаштовуємо модалку (тільки для пацієнта)
  if (role !== 'doctor') {
    setupModalListeners();
  }

  // 5. Завантажуємо курси
  await loadCourses(role);
}

// --- 1. ВИПРАВЛЕНА КНОПКА "ДОДАТИ" ---

function setupAddButton(role) {
  const btn = document.getElementById('add-course-btn');
  if (!btn) return;

  // Клонуємо кнопку, щоб зняти всі слухачі подій (addEventListener)
  const newBtn = btn.cloneNode(true);

  // ВАЖЛИВО: Знімаємо inline-обробники (якщо в HTML було onclick="...")
  newBtn.onclick = null;

  // Замінюємо кнопку в DOM
  btn.parentNode.replaceChild(newBtn, btn);

  // Додаємо нову подію
  newBtn.addEventListener('click', (event) => {
    event.preventDefault(); // Зупиняє відправку форми або перехід за посиланням

    if (role === 'doctor') {
      // ЛІКАР -> Перехід на сторінку створення
      console.log("Лікар: перехід на constructor_course.html");
      window.location.href = "constructor_course.html";
    } else {
      // ПАЦІЄНТ -> Відкрити модальне вікно
      console.log("Пацієнт: відкриття модального вікна");
      openJoinModal();
    }
  });
}

// --- 2. ЗАВАНТАЖЕННЯ ДАНИХ (GET) ---

async function loadCourses(role) {
  // Визначаємо правильний ендпоінт залежно від ролі користувача
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

    // Якщо сесія закінчилась або токен невалідний
    if (response.status === 401) {
      alert("Сесія закінчилась. Будь ласка, увійдіть знову.");
      window.location.href = '/login.html';
      return;
    }

    if (!response.ok) throw new Error(`Status: ${response.status}`);

    const courses = await response.json();

    // 1. Розподіляємо курси на активні та завершені
    // (Для лікаря is_active може не передаватись, тому строго перевіряємо на false)
    const activeCourses = courses.filter(c => c.is_active !== false);
    const completedCourses = courses.filter(c => c.is_active === false);

    // 2. Сортуємо масив: спочатку всі активні, потім всі неактивні (завершені)
    const sortedCourses = [...activeCourses, ...completedCourses];

    // 3. Відмальовуємо інтерфейс
    renderSidebar(sortedCourses);
    renderGrid(sortedCourses, role); // Передаємо role, щоб сховати прогрес у лікаря

    // 4. Оновлюємо статистику у верхній панелі
    updateWelcomePanel(activeCourses.length, completedCourses.length, role);

  } catch (error) {
    console.error("Помилка завантаження курсів:", error);
    const grid = document.getElementById('courses-grid');
    if (grid) {
      grid.innerHTML = `<p style="text-align: center; color: red;">Не вдалося завантажити курси.</p>`;
    }
  }
}

// --- 3. МОДАЛЬНЕ ВІКНО (Тільки Пацієнт) ---

const modal = document.getElementById('join-modal');
const modalInput = document.getElementById('modal-course-id');
const errorText = document.getElementById('modal-error');

function openJoinModal() {
  if (!modal) return;
  modal.classList.remove('hidden');
  if (modalInput) {
    modalInput.value = '';
    modalInput.focus();
  }
  if (errorText) errorText.classList.add('hidden');
}

function closeJoinModal() {
  if (modal) modal.classList.add('hidden');
}

function showModalError(msg) {
  if (errorText) {
    errorText.textContent = msg;
    errorText.classList.remove('hidden');
  } else {
    alert(msg);
  }
}

function setupModalListeners() {
  if (!modal) return;

  // Кнопки закриття
  const closeBtn = document.getElementById('close-modal-btn');
  const cancelBtn = document.getElementById('cancel-btn');
  if (closeBtn) closeBtn.onclick = closeJoinModal;
  if (cancelBtn) cancelBtn.onclick = closeJoinModal;

  // Клік по фону
  modal.onclick = (event) => {
    if (event.target === modal) closeJoinModal();
  };

  // Підтвердження
  const confirmBtn = document.getElementById('confirm-join-btn');
  if (confirmBtn) {
    // Видаляємо старі обробники через клонування (на випадок подвійного виклику init)
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

// --- 4. ЛОГІКА ПРИЄДНАННЯ (POST) ---

async function joinCourseAsUser(courseId) {
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
      closeJoinModal();
      alert("Успішно приєднано!");
      loadCourses('user'); // Оновити список
    } else {
      const err = await response.json();
      showModalError(err.detail || 'Помилка приєднання');
    }
  } catch (error) {
    console.error(error);
    showModalError("Помилка з'єднання");
  }
}

// --- 5. РЕНДЕР (Відображення) ---

function renderSidebar(courses) {
  const list = document.getElementById('sidebar-list');
  if (!list) return;
  list.innerHTML = "";

  courses.forEach(course => {
    const li = document.createElement('li');
    li.textContent = course.title || `${course.course_name}`;

    // Додаємо обробник кліку для переходу на сторінку курсу
    li.onclick = () => {
      window.location.href = `course_page.html?id=${course.id}`;
    };

    list.appendChild(li);
  });
}




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
    // Додаємо клас завершеного курсу ТІЛЬКИ для пацієнта
    card.className = (!isDoctor && isCompleted) ? 'course-card completed-course' : 'course-card';

    card.onclick = (event) => {
      if (event.target.closest('.options-container')) return;
      window.location.href = `course_page.html?id=${course.id}`;
    };

    // Візуальна позначка "(Завершено)" біля назви ТІЛЬКИ для пацієнта
    const titleHtml = (!isDoctor && isCompleted)
      ? `${course.course_name || 'Без назви'} <span style="font-size: 13px; color: #60a7bd; font-weight: normal;">(Завершено)</span>`
      : `${course.course_name || 'Без назви'}`;

    // Формуємо блок прогресу ТІЛЬКИ для пацієнта (для лікаря це буде пустий рядок)
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
              <button class="dropdown-item ${actionClass}" data-id="${course.id}">${actionText}</button>
            </div>
          </div>
      </div>
    `;
    grid.appendChild(card);
  });
}

// === НОВА ФУНКЦІЯ: Отримуємо дані користувача з бекенду ===
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

      // Знаходимо елемент на сторінці та вставляємо ім'я та прізвище
      const nameElement = document.getElementById('user-name');
      if (nameElement) {
        nameElement.textContent = `${userData.first_name} ${userData.last_name}`;
      }

      // (Опціонально) Зберігаємо в пам'ять, щоб інші сторінки теж могли це швидко прочитати
      localStorage.setItem('user_first_name', userData.first_name);
      localStorage.setItem('user_last_name', userData.last_name);
    } else {
      console.warn("Не вдалося отримати дані користувача (Status:", response.status, ")");
    }
  } catch (error) {
    console.error("Помилка при запиті /users/me:", error);
  }
}








// Функція для відкриття/закриття конкретного меню
window.toggleDropdown = function(event) {
  event.stopPropagation(); // Зупиняємо спливання, щоб меню не закрилося одразу

  // Закриваємо всі інші відкриті меню перед відкриттям поточного
  document.querySelectorAll('.dropdown-menu').forEach(menu => {
    if (menu !== event.currentTarget.nextElementSibling) {
      menu.classList.add('hidden');
    }
  });

  // Перемикаємо видимість меню, що знаходиться поруч з натиснутою кнопкою
  const menu = event.currentTarget.nextElementSibling;
  if (menu) {
    menu.classList.toggle('hidden');
  }
};

// Глобальний слухач кліків для закриття меню при кліку будь-де на сторінці
document.addEventListener('click', () => {
  document.querySelectorAll('.dropdown-menu').forEach(menu => {
    menu.classList.add('hidden');
  });
});

// Оновлена функція updateWelcomePanel (тепер приймає role)
function updateWelcomePanel(activeCount, completedCount, role) {
  const statsContainer = document.querySelector('.welcome-stats');

  // Якщо це лікар - повністю ховаємо блок статистики
  if (role === 'doctor') {
    if (statsContainer) statsContainer.style.display = 'none';
    return;
  }

  // Для пацієнта показуємо блок і оновлюємо цифри
  if (statsContainer) statsContainer.style.display = 'flex';

  const activeEl = document.getElementById('active-courses-count');
  const completedEl = document.getElementById('completed-courses-count');

  if (activeEl) activeEl.textContent = activeCount;
  if (completedEl) completedEl.textContent = completedCount;
}

// Функція для виходу з акаунту
function logoutUser(event) {
  event.preventDefault(); // Зупиняємо стандартний перехід за посиланням

  // Видаляємо токен доступу та інші дані користувача
  localStorage.removeItem('access_token');
  // Якщо ви зберігаєте роль або ім'я, їх також варто видалити
  localStorage.removeItem('user_role');

  // Перенаправляємо на сторінку логіну
  window.location.href = 'main_and_auth.html';
}
