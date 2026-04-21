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
    event.preventDefault();

    if (role === 'doctor') {
      // ЛІКАР -> Перехід на сторінку створення
      console.log("Лікар: перехід на constructor_course.html");

      // === ОЧИЩАЄМО ДАНІ РЕДАГУВАННЯ ПЕРЕД СТВОРЕННЯМ НОВОГО ===
      sessionStorage.removeItem('course_edit_data');
      sessionStorage.removeItem('course_edit_id');

      // Відправляємо БЕЗ параметру edit_id
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
const successText = document.getElementById('modal-success');

// Змінні для контролю таймерів (щоб вони не збивалися при швидких кліках)
let messageTimer;

// 1. Покращена функція очищення повідомлень
function hideAllMessages() {
  const errorText = document.getElementById('modal-error');
  const successText = document.getElementById('modal-success');

  if (errorText) {
    errorText.classList.add('hidden');
    errorText.textContent = ''; // Примусово стираємо текст помилки з HTML
  }
  if (successText) {
    successText.classList.add('hidden');
    successText.textContent = ''; // Примусово стираємо текст успіху з HTML
  }

  // Зупиняємо таймери, якщо вони були запущені
  if (typeof messageTimer !== 'undefined') {
    clearTimeout(messageTimer);
  }
}

// 3. Оновлена функція відкриття вікна
function openJoinModal() {
  const modal = document.getElementById('join-modal');
  const modalInput = document.getElementById('modal-course-id');

  if (!modal) return;
  modal.classList.remove('hidden');

  // Про всяк випадок перестраховуємось і стираємо тексти при відкритті
  hideAllMessages();

  if (modalInput) {
    modalInput.value = '';
    modalInput.focus();
  }
}

// 2. Оновлена функція закриття вікна
function closeJoinModal() {
  const modal = document.getElementById('join-modal');
  const modalInput = document.getElementById('modal-course-id');

  if (modal) modal.classList.add('hidden');

  // Обов'язково стираємо всі тексти при закритті
  hideAllMessages();

  if (modalInput) modalInput.value = '';
}

function showModalError(msg) {
  hideAllMessages(); // 1. Гарантовано ховаємо зелений текст успіху

  if (errorText) {
    errorText.textContent = msg;
    errorText.classList.remove('hidden'); // 2. Показуємо червону помилку

    // 3. Таймер: ховаємо текст помилки через 2.5 секунди
    messageTimer = setTimeout(() => {
      errorText.classList.add('hidden');
    }, 2500);
  } else {
    alert(msg);
  }
}

function showModalSuccess(message) {
  hideAllMessages(); // 1. Гарантовано ховаємо червону помилку

  if (successText) {
    successText.textContent = message;
    successText.classList.remove('hidden'); // 2. Показуємо зелений успіх

    // 3. Таймер: ховаємо текст успіху і закриваємо вікно через 1.2 секунди
    messageTimer = setTimeout(() => {
      successText.classList.add('hidden');
      closeJoinModal();
      loadCourses('user'); // Оновлюємо список курсів
    }, 1200);
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
  hideAllMessages(); // Зачищаємо старі написи перед новим запитом

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
      if (modalInput) modalInput.value = ''; // Очищаємо поле вводу
      // Викликаємо функцію успіху (вона сама покаже текст і через секунду закриє вікно)
      showModalSuccess("Успішно приєднано!");
    } else {
      const err = await response.json();

      // Базове повідомлення з бекенду
      let errorMessage = err.detail || err.message || 'Помилка приєднання';

      // === ПЕРЕХОПЛЮЄМО ПОМИЛКУ ДУБЛЮВАННЯ ===
      // Якщо бекенд повертає текст про те, що пацієнт вже є, змінюємо його на зрозуміле українське
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

// --- 6. ЛОГІКА ВИДАЛЕННЯ / ВІД'ЄДНАННЯ ---
async function handleCourseAction(courseId, role) {
  const isDoctor = role === 'doctor';

  // Визначаємо правильний ендпоінт
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
      // Успішне видалення: просто тихо оновлюємо список курсів
      // без жодних alert-віконець
      loadCourses(role);
    } else {
      const err = await response.json();
      console.error("Помилка видалення:", err);
      // Залишаємо сповіщення лише для реальних помилок з бекенду
      alert(`Помилка: ${err.detail || 'Не вдалося виконати дію'}`);
    }
  } catch (error) {
    console.error("Помилка при видаленні/від'єднанні:", error);
    alert("Помилка з'єднання з сервером.");
  }
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
              <button class="dropdown-item ${actionClass}" data-id="${course.id}" onclick="handleCourseAction('${course.id}', '${role}')">${actionText}</button>
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


