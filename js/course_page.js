const API_BASE_URL = "http://localhost:8000";

document.addEventListener('DOMContentLoaded', () => {
  initCoursePage();
});

async function initCoursePage() {
  const token = localStorage.getItem('access_token');
  if (!token) {
    window.location.href = '/login.html';
    return;
  }

  const role = localStorage.getItem('user_role');
  // --- НОВЕ: Динамічна зміна іконки профілю ---
  const profileIcon = document.getElementById('dynamic-profile-icon');
  if (profileIcon) {
    if (role === 'doctor') {
      profileIcon.className = 'fas fa-user-md'; // Іконка лікаря
    } else {
      profileIcon.className = 'fas fa-user'; // Іконка пацієнта
    }
  }
  const urlParams = new URLSearchParams(window.location.search);
  const courseId = urlParams.get('id');

  if (!courseId) {
    alert("Курс не знайдено");
    window.location.href = 'home_page.html';
    return;
  }

  // Завантажуємо загальні деталі курсу
  await loadCourseDetails(courseId, role);

  const startButton = document.getElementById('start-course-btn');

  // Розподіл логіки за ролями
  if (role === 'doctor') {
    // ЛІКАР
    if (startButton) startButton.style.display = 'none';

    const doctorSection = document.getElementById('doctor-patients-section');
    if (doctorSection) doctorSection.classList.remove('hidden');

    // === ОНОВЛЕНО: Показуємо весь рядок (ID + кнопка) ===
    const doctorActions = document.getElementById('doctor-actions-container');
    const idDisplay = document.getElementById('display-course-id');
    if (doctorActions && idDisplay) {
      doctorActions.classList.remove('hidden');
      idDisplay.textContent = courseId;
    }

    await loadCoursePatients(courseId);
  } else {
    // ПАЦІЄНТ
    if (startButton) {
      startButton.addEventListener('click', () => {
        window.location.href = `course_completion.html?id=${courseId}`;
      });
    }

    await loadPatientCourseStatus(courseId);

    // === НОВИЙ ВИКЛИК: Відображаємо складність для пацієнта ===
    await loadPatientDifficulty(courseId);
  }
}

// === НОВА ФУНКЦІЯ ДЛЯ ПЕРЕВІРКИ ТАЙМЕРА ПАЦІЄНТА ===
async function loadPatientCourseStatus(courseId) {
  const token = localStorage.getItem('access_token');
  try {
    const response = await fetch(`${API_BASE_URL}/courses/${courseId}/patient-content`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) return;

    const data = await response.json();
    const timerSection = document.getElementById('patient-timer-section');
    const timerDisplay = document.getElementById('course-timer-display');
    const startBtn = document.getElementById('start-course-btn');

    if (data.status === 'waiting') {
      // Показуємо таймер
      if (timerSection) timerSection.classList.remove('hidden');
      if (timerDisplay) {
        timerDisplay.textContent = `${data.time_left.hours} год. ${data.time_left.minutes} хв.`;
      }

      // Змінюємо вигляд кнопки "Почати", щоб було зрозуміло, що треба чекати
      if (startBtn) {
        startBtn.innerHTML = `Очікування <i class="fas fa-clock"></i>`;
        startBtn.style.opacity = '0.6';
        startBtn.style.backgroundColor = '#7aaebf'; // Робимо колір пасивним

        // Перезаписуємо клік, щоб пацієнт не міг перейти на сторінку проходження
        startBtn.onclick = (e) => {
          e.preventDefault();
          e.stopPropagation();
          alert("Наступне заняття ще не відкрилося. Зачекайте закінчення таймера.");
        };
      }
    } else if (data.status === 'completed') {
      // Якщо курс повністю пройдено
      if (startBtn) {
        startBtn.innerHTML = `Пройдено <i class="fas fa-check-circle"></i>`;
        startBtn.style.backgroundColor = '#28a745'; // Зелений колір
        startBtn.onclick = (e) => {
          e.preventDefault();
          e.stopPropagation();
        };
      }
    }
  } catch (error) {
    console.error("Помилка завантаження статусу пацієнта:", error);
  }
}
// ====================================================

async function loadCourseDetails(courseId, role) {
  const token = localStorage.getItem('access_token');

  try {
    const response = await fetch(`${API_BASE_URL}/courses/${courseId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) {
      throw new Error("Помилка отримання даних курсу");
    }

    const courseData = await response.json();

    // Заповнюємо дані на сторінці згідно з моделлю
    document.getElementById('cp-title').textContent = courseData.course_name || '-';

    // Обробка масиву травм
    const injuriesText = Array.isArray(courseData.injuries)
      ? courseData.injuries.join(", ")
      : (courseData.injuries || '-');
    document.getElementById('cp-injuries').textContent = injuriesText;

    // === ОНОВЛЕНО: ТЕПЕР ВІДОБРАЖАЄМО ОБСЯГ КУРСУ ===
    const durationEl = document.getElementById('cp-duration');
    if (durationEl) {
      if (courseData.course_length) {
        const length = courseData.course_length;
        // Використовуємо нашу функцію для підбору правильного слова
        const word = getDeclension(length, ['заняття', 'заняття', 'занять']);
        durationEl.textContent = `${length} ${word}`;
      } else {
        durationEl.textContent = "Не вказано";
      }
    }
    // ===============================================
    // ===============================================

    // Об'єднуємо ім'я та прізвище лікаря
    const docName = courseData.doctor_name || '';
    const docLastName = courseData.doctor_lastname || '';
    document.getElementById('cp-doctor').textContent = `${docName} ${docLastName}`.trim();

    document.getElementById('cp-description').textContent = courseData.description || '-';

  } catch (error) {
    console.error("Помилка:", error);
    alert("Не вдалося завантажити деталі курсу.");
  }
}

async function loadCoursePatients(courseId) {
  const token = localStorage.getItem('access_token');
  const tbody = document.getElementById('patients-table-body');
  if (!tbody) return;

  try {
    const response = await fetch(`${API_BASE_URL}/courses/${courseId}/patients`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) {
      throw new Error("Помилка отримання списку пацієнтів");
    }

    const patients = await response.json();
    tbody.innerHTML = ""; // Очищаємо таблицю

    if (patients.length === 0) {
      tbody.innerHTML = "<tr><td colspan='8' style='text-align: center;'>Пацієнтів на цьому курсі немає</td></tr>";
      return;
    }

    // Перебираємо реальні дані пацієнтів
    patients.forEach(p => {
      const tr = document.createElement('tr');
      // ПРИМІТКА: перевірте, чи ключі p.first_name, p.sex, p.age збігаються з вашою моделлю пацієнта, яку повертає бекенд
      tr.innerHTML = `
        <td>${p.first_name || p.firstName || '-'}</td>
        <td>${p.last_name || p.lastName || '-'}</td>
        <td>${p.sex || p.gender || '-'}</td>
        <td>${p.age || '-'}</td>
        <td>${p.email || '-'}</td>
        <td>${p.stage || 'В процесі'}</td>
        <td><button class="action-btn" onclick="adjustPatient('${p.id}')">Редагувати</button></td>
      `;
      tbody.appendChild(tr);
    });

  } catch (error) {
    console.error("Помилка:", error);
    tbody.innerHTML = "<tr><td colspan='7' style='text-align: center; color: red;'>Помилка завантаження даних</td></tr>";
  }
}

// Глобальні змінні для зберігання поточного стану модалки
let currentModalPatientId = null;
let currentModalCourseId = null;

/**
 * Отримує поточну складність курсу для конкретного пацієнта
 */
async function getCurrentPatientDifficulty(courseId, patientId) {
  const token = localStorage.getItem('access_token');
  try {
    const response = await fetch(`${API_BASE_URL}/courses/${courseId}/difficulty?patient_id=${patientId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) return null;

    const data = await response.json();
    // FastAPI може повертати просто число або об'єкт типу { "difficulty": 2 }.
    // Підтримуємо обидва варіанти:
    return data.difficulty !== undefined ? data.difficulty : data;
  } catch (error) {
    console.error("Помилка отримання поточної складності:", error);
    return null; // Якщо сталася помилка, повернемо null, щоб спрацював fallback на 2
  }
}

/**
 * Завантажує та відображає складність курсу для поточного пацієнта
 */
async function loadPatientDifficulty(courseId) {
  const token = localStorage.getItem('access_token');
  const diffRow = document.getElementById('patient-difficulty-row');
  const diffSpan = document.getElementById('cp-patient-difficulty');

  if (!diffRow || !diffSpan) return;

  // Робимо рядок видимим, оскільки зараз зайшов пацієнт
  diffRow.classList.remove('hidden');

  try {
    // 1. Отримуємо ID поточного користувача (пацієнта)
    const meResp = await fetch(`${API_BASE_URL}/users/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!meResp.ok) throw new Error("Не вдалося отримати дані користувача");
    const meData = await meResp.json();
    // 2. Викликаємо твою функцію для отримання поточної складності
    const diffNum = await getCurrentPatientDifficulty(courseId, meData.id);

    // 3. Перетворюємо число на зрозумілий текст
    const difficultyNames = {
      1: "Легкий",
      2: "Стандартний",
      3: "Просунутий"
    };

    if (diffNum) {
      diffSpan.textContent = difficultyNames[diffNum] || `Рівень ${diffNum}`;

    } else {
      diffSpan.textContent = "Не визначено";
    }
  } catch (error) {
    console.error("Помилка відображення складності:", error);
    diffSpan.textContent = "Помилка завантаження";
  }
}

async function adjustPatient(patientId) {
  currentModalPatientId = patientId;

  const urlParams = new URLSearchParams(window.location.search);
  currentModalCourseId = urlParams.get('id');

  const modal = document.getElementById('patient-modal');
  modal.classList.remove('hidden');

  // 1. Спочатку отримуємо поточну складність з нового ендпоінту
  const currentDifficulty = await getCurrentPatientDifficulty(currentModalCourseId, currentModalPatientId);

  // 2. Передаємо її у функцію завантаження select'а
  // Якщо запит впаде, currentDifficulty буде null, і loadDifficultyOptions встановить 2 за замовчуванням
  await loadDifficultyOptions(currentModalCourseId, currentDifficulty);

  // 3. Завантажуємо відгуки
  await loadPatientFeedbacks(currentModalCourseId, currentModalPatientId);
}

/**
 * Закриває модальне вікно
 */
function closePatientModal() {
  const modal = document.getElementById('patient-modal');
  modal.classList.add('hidden');
  currentModalPatientId = null;
}


/**
 * Завантажує реальні рівні складності курсу та заповнює select
 */
async function loadDifficultyOptions(courseId, currentDifficulty) {
  const token = localStorage.getItem('access_token');
  const select = document.getElementById('course-difficulty-select');
  select.innerHTML = "<option value=''>Завантаження...</option>";

  const difficultyNames = {
    1: "Легкий",
    2: "Стандартний",
    3: "Просунутий"
  };

  try {
    // 1. Беремо розгортку курсу, щоб ТОЧНО знати, які рівні створив лікар
    const response = await fetch(`${API_BASE_URL}/courses/${courseId}/content`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) throw new Error("Помилка завантаження контенту курсу");

    const courseData = await response.json();
    const levels = courseData.levels || [];

    select.innerHTML = ""; // Очищаємо список

    if (levels.length === 0) {
      select.innerHTML = "<option value=''>Немає рівнів</option>";
      return;
    }

    // 2. Безпечне значення (якщо бекенд ще не присвоїв рівень пацієнту, ставимо 2)
    const safeDifficulty = currentDifficulty ? Number(currentDifficulty) : 2;

    // 3. Створюємо опції ТІЛЬКИ для тих рівнів, які реально існують
    levels.forEach(levelObj => {
      const diffLevel = levelObj.difficulty; // Наприклад, 2
      const option = document.createElement('option');

      option.value = diffLevel;
      option.textContent = difficultyNames[diffLevel] || `Рівень ${diffLevel}`;

      // Якщо це поточний рівень пацієнта - робимо його обраним
      if (safeDifficulty === diffLevel) {
        option.selected = true;
      }

      select.appendChild(option);
    });

  } catch (error) {
    console.error("Помилка:", error);
    select.innerHTML = "<option value=''>Помилка завантаження</option>";
  }
}

/**
 * Відправляє запит на зміну складності
 */
async function changePatientDifficulty() {
  if (!currentModalPatientId || !currentModalCourseId) return;

  const select = document.getElementById('course-difficulty-select');
  const newDifficulty = select.value;
  const token = localStorage.getItem('access_token');
  const btn = document.querySelector('.save-diff-btn'); // Знаходимо кнопку

  try {
    // Робимо кнопку неактивною під час запиту
    btn.disabled = true;
    btn.textContent = "Збереження...";

    const response = await fetch(`${API_BASE_URL}/courses/${currentModalCourseId}/change-difficulty?patient_id=${currentModalPatientId}&new_difficulty=${newDifficulty}`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) throw new Error("Не вдалося змінити складність");

    // Замість alert - показуємо зелений текст успіху
    showDiffMessage("✅ Успішно збережено", true);

  } catch (error) {
    console.error("Помилка:", error);
    // Замість alert - показуємо червоний текст помилки
    showDiffMessage("❌ Помилка збереження", false);
  } finally {
    // Повертаємо кнопку в нормальний стан
    btn.disabled = false;
    btn.textContent = "Змінити";
  }
}

/**
 * Допоміжна функція для показу повідомлень у модалці
 */
function showDiffMessage(text, isSuccess) {
  const msgEl = document.getElementById('diff-status-message');
  if (!msgEl) return;

  // Встановлюємо текст та колір
  msgEl.textContent = text;
  msgEl.style.color = isSuccess ? '#28a745' : '#dc3545';

  // Робимо видимим (анімація через CSS transition)
  msgEl.style.opacity = '1';

  // Ховаємо через 2 секунди
  setTimeout(() => {
    msgEl.style.opacity = '0';
  }, 2000);
}

/**
 * Завантажує та відображає відгуки пацієнта
 */
async function loadPatientFeedbacks(courseId, patientId) {
  const token = localStorage.getItem('access_token');
  const listContainer = document.getElementById('feedbacks-list');
  listContainer.innerHTML = "<p>Завантаження відгуків...</p>";

  try {
    // Звертаємося до ендпоінту з префіксом /feedbacks (patient_id передається як query параметр)
    const response = await fetch(`${API_BASE_URL}/feedbacks/${courseId}/feedback?patient_id=${patientId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) throw new Error("Помилка завантаження відгуків");

    const feedbacks = await response.json();
    listContainer.innerHTML = "";

    if (feedbacks.length === 0) {
      listContainer.innerHTML = "<p style='text-align:center; color:#7aaebf;'>Пацієнт ще не залишив жодного відгуку.</p>";
      return;
    }

    // Сортуємо відгуки за номером заняття або датою (від найновіших)
    feedbacks.sort((a, b) => b.session_number - a.session_number);

    feedbacks.forEach(fb => {
      // Підтримуємо обидва формати назв (залежно від того, як бекенд віддає дату)
      const dateRaw = fb.create_at || fb.created_at;
      const dateFormatted = dateRaw ? new Date(dateRaw).toLocaleDateString('uk-UA') : 'Невідома дата';

      const fbEl = document.createElement('div');
      fbEl.className = 'feedback-card';
      fbEl.innerHTML = `
        <div class="fb-header">
          <span>Заняття #${fb.session_number}</span>
          <span class="fb-date">${dateFormatted}</span>
        </div>
        <div class="fb-stats">
          <span><i class="fas fa-heartbeat" style="color:#d9534f"></i> Біль: ${fb.pain_level}/10</span>
          <span><i class="fas fa-dumbbell" style="color:#f0ad4e"></i> Складність: ${fb.difficulty_level}/10</span>
        </div>
        <div class="fb-note">${fb.note ? `"${fb.note}"` : '<i>Без коментарів</i>'}</div>
      `;
      listContainer.appendChild(fbEl);
    });

  } catch (error) {
    console.error("Помилка:", error);
    listContainer.innerHTML = "<p style='color:red;'>Не вдалося завантажити відгуки.</p>";
  }
}

function logoutUser(event) {
  if(event) event.preventDefault();
  localStorage.removeItem('access_token');
  localStorage.removeItem('user_role');
  window.location.href = 'main_and_auth.html';
}

/**
 * Розумна функція для кнопки "Назад".
 */
function goBack(event) {
  if (event) event.preventDefault();
  const referrer = document.referrer;
  const currentHost = window.location.hostname;
  if (referrer && referrer.includes(currentHost)) {
    window.history.back();
  } else {
    window.location.href = 'home_page.html';
  }
}

/**
 * Функція для копіювання ID курсу в буфер обміну
 */
async function copyCourseId() {
  const urlParams = new URLSearchParams(window.location.search);
  const courseId = urlParams.get('id');
  if (!courseId) return;

  const icon = document.querySelector('.doctor-course-id .copy-icon');

  try {
    // Копіюємо текст у буфер обміну
    await navigator.clipboard.writeText(courseId);

    // Змінюємо іконку на зелену галочку
    icon.classList.remove('fa-copy', 'far');
    icon.classList.add('fa-check', 'fas', 'copied');
    icon.title = "Скопійовано!";

    // Повертаємо оригінальну іконку через 1.5 секунди
    setTimeout(() => {
      icon.classList.remove('fa-check', 'fas', 'copied');
      icon.classList.add('fa-copy', 'far');
      icon.title = "Скопіювати ID";
    }, 1500);

  } catch (err) {
    console.error('Помилка копіювання: ', err);
    alert('Не вдалося скопіювати ID. Можливо, ваш браузер блокує цю дію.');
  }
}

/**
 * Функція для переходу на сторінку редагування курсу
 */
function editCourse() {
  // 1. Беремо ID поточного курсу з URL
  const urlParams = new URLSearchParams(window.location.search);
  const courseId = urlParams.get('id');

  if (!courseId) {
    alert("Помилка: не знайдено ID курсу.");
    return;
  }

  // 2. Показуємо анімацію на кнопці (опціонально)
  const btn = document.querySelector('.edit-course-btn');
  if (btn) {
    btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Перехід...`;
    btn.disabled = true;
  }

  // 3. Переходимо на сторінку конструктора, передаючи ID у параметрі edit_id
  window.location.href = `constructor_course.html?edit_id=${courseId}`;
}
