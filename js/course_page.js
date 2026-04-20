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

    await loadCoursePatients(courseId);
  } else {
    // ПАЦІЄНТ
    // Спочатку вішаємо стандартний перехід на кнопку
    if (startButton) {
      startButton.addEventListener('click', () => {
        window.location.href = `course_completion.html?id=${courseId}`;
      });
    }
    // Потім перевіряємо статус (може треба показати таймер і заблокувати кнопку)
    await loadPatientCourseStatus(courseId);
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
      // Перевіряємо, чи є значення. Якщо є - додаємо слово "днів", якщо ні - "Не вказано"
      durationEl.textContent = courseData.course_length
        ? `${courseData.course_length} днів`
        : "Не вказано";
    }
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
        <td>${p.id ? p.id.substring(0, 8) + '...' : '-'}</td>
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
    tbody.innerHTML = "<tr><td colspan='8' style='text-align: center; color: red;'>Помилка завантаження даних</td></tr>";
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
 * Завантажує кількість рівнів складності та заповнює select
 */
/**
 * Завантажує кількість рівнів складності та заповнює select текстовими назвами
 */
/**
 * Завантажує кількість рівнів складності та заповнює select текстовими назвами
 */
/**
 * Завантажує кількість рівнів складності та заповнює select
 */
/**
 * Завантажує кількість рівнів складності та заповнює select
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
    const response = await fetch(`${API_BASE_URL}/courses/${courseId}/number-of-difficulty`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) throw new Error("Помилка завантаження складностей");

    const data = await response.json();
    const maxDifficulty = typeof data === 'object' ? (data.count || data.length) : data;

    select.innerHTML = ""; // Очищаємо список

    // Створюємо реальні рівні складності
    for (let i = 1; i <= maxDifficulty; i++) {
      const option = document.createElement('option');
      option.value = i;
      option.textContent = difficultyNames[i] || `Рівень ${i}`;

      // Якщо поточний рівень збігається з тим, що прийшов з бекенду - РОБИМО ЙОГО ОБРАНИМ
      if (currentDifficulty && Number(currentDifficulty) === i) {
        option.selected = true;
      }

      select.appendChild(option);
    }

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

  try {
    const response = await fetch(`${API_BASE_URL}/courses/${currentModalCourseId}/change-difficulty?patient_id=${currentModalPatientId}&new_difficulty=${newDifficulty}`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) throw new Error("Не вдалося змінити складність");

    alert("Складність успішно змінено!");
  } catch (error) {
    console.error("Помилка:", error);
    alert("Помилка при зміні складності");
  }
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
