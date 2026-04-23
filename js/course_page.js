const API_BASE_URL = "http://localhost:8000";

document.addEventListener('DOMContentLoaded', () => {
  initCoursePage();
});

// Ініціалізує сторінку курсу (перевіряє токен та роль (лікар/пацієнт), завантажує деталі курсу та відображає відповідний функціонал)
async function initCoursePage() {
  const token = localStorage.getItem('access_token');
  if (!token) {
    window.location.href = '/login.html';
    return;
  }
  const role = localStorage.getItem('user_role');
  const profileIcon = document.getElementById('dynamic-profile-icon');
  if (profileIcon) {
    if (role === 'doctor') {
      profileIcon.className = 'fas fa-user-md';
    } else {
      profileIcon.className = 'fas fa-user';
    }
  }
  const urlParams = new URLSearchParams(window.location.search);
  const courseId = urlParams.get('id');
  if (!courseId) {
    alert("Курс не знайдено");
    window.location.href = 'home_page.html';
    return;
  }
  await loadCourseDetails(courseId, role);
  const startButton = document.getElementById('start-course-btn');
  if (role === 'doctor') {
    if (startButton) startButton.style.display = 'none';
    const doctorSection = document.getElementById('doctor-patients-section');
    if (doctorSection) doctorSection.classList.remove('hidden');
    const doctorActions = document.getElementById('doctor-actions-container');
    const idDisplay = document.getElementById('display-course-id');
    if (doctorActions && idDisplay) {
      doctorActions.classList.remove('hidden');
      idDisplay.textContent = courseId;
    }
    await loadCoursePatients(courseId);
  } else {
    if (startButton) {
      startButton.addEventListener('click', () => {
        window.location.href = `course_completion.html?id=${courseId}`;
      });
    }
    await loadPatientCourseStatus(courseId);
    await loadPatientDifficulty(courseId);
  }
}

// Отримує з сервера та відображає статус проходження курсу для поточного пацієнта
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
      if (timerSection) timerSection.classList.remove('hidden');
      if (timerDisplay) {
        timerDisplay.textContent = `${data.time_left.hours} год. ${data.time_left.minutes} хв.`;
      }
      if (startBtn) {
        startBtn.innerHTML = `Очікування <i class="fas fa-clock"></i>`;
        startBtn.style.opacity = '0.6';
        startBtn.style.backgroundColor = '#7aaebf';
        startBtn.onclick = (e) => {
          e.preventDefault();
          e.stopPropagation();
          alert("Наступне заняття ще не відкрилося. Зачекайте закінчення таймера.");
        };
      }
    } else if (data.status === 'completed') {
      if (startBtn) {
        startBtn.innerHTML = `Пройдено <i class="fas fa-check-circle"></i>`;
        startBtn.style.backgroundColor = '#28a745';
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

// Завантажує базову інформацію про курс та заповнює нею елементи на сторінці
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
    document.getElementById('cp-title').textContent = courseData.course_name || '-';
    const injuriesText = Array.isArray(courseData.injuries)
      ? courseData.injuries.join(", ")
      : (courseData.injuries || '-');
    document.getElementById('cp-injuries').textContent = injuriesText;
    const durationEl = document.getElementById('cp-duration');
    if (durationEl) {
      if (courseData.course_length) {
        const length = courseData.course_length;
        const word = getDeclension(length, ['заняття', 'заняття', 'занять']);
        durationEl.textContent = `${length} ${word}`;
      } else {
        durationEl.textContent = "Не вказано";
      }
    }
    const docName = courseData.doctor_name || '';
    const docLastName = courseData.doctor_lastname || '';
    document.getElementById('cp-doctor').textContent = `${docName} ${docLastName}`.trim();
    document.getElementById('cp-description').textContent = courseData.description || '-';
  } catch (error) {
    console.error("Помилка:", error);
    alert("Не вдалося завантажити деталі курсу.");
  }
}

// Завантажує список усіх пацієнтів, які проходять поточний курс (доступно лише для лікаря) та виводить їх у таблицю зі статусом і кнопкою редагування
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
    tbody.innerHTML = "";
    if (patients.length === 0) {
      tbody.innerHTML = "<tr><td colspan='7' style='text-align: center; font-weight: 500;'>Пацієнтів поки що немає</td></tr>";
      return;
    }
    patients.forEach(p => {
      const tr = document.createElement('tr');
      let stageDisplay = 'В процесі';
      if (p.is_course_active === false) {
        stageDisplay = '<span style="color: #28a745; font-weight: 600;">Завершено <i class="fas fa-check-circle"></i></span>';
      } else if (p.current_unlocked_day !== undefined && p.current_unlocked_day !== null) {
        stageDisplay = `Заняття ${p.current_unlocked_day}`;
      }
      const editButtonHtml = p.id
        ? `<button class="action-btn" onclick="adjustPatient('${p.id}')">Редагувати</button>`
        : `<span style="color:red; font-size:12px;">Помилка: немає ID</span>`;

      tr.innerHTML = `
        <td>${p.first_name || '-'}</td>
        <td>${p.last_name || '-'}</td>
        <td>${p.sex || '-'}</td>
        <td>${p.age || '-'}</td>
        <td>${p.email || '-'}</td>
        <td>${stageDisplay}</td>
        <td>${editButtonHtml}</td>
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

// Отримує з сервера поточний рівень складності курсу, призначений конкретному пацієнту
async function getCurrentPatientDifficulty(courseId, patientId) {
  const token = localStorage.getItem('access_token');
  try {
    const response = await fetch(`${API_BASE_URL}/courses/${courseId}/difficulty?patient_id=${patientId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) return null;
    const data = await response.json();
    return data.difficulty !== undefined ? data.difficulty : data;
  } catch (error) {
    console.error("Помилка отримання поточної складності:", error);
    return null;
  }
}

// Отримує поточний рівень складності для залогіненого пацієнта та відображає його текстом на сторінці курсу
async function loadPatientDifficulty(courseId) {
  const token = localStorage.getItem('access_token');
  const diffRow = document.getElementById('patient-difficulty-row');
  const diffSpan = document.getElementById('cp-patient-difficulty');
  if (!diffRow || !diffSpan) return;
  diffRow.classList.remove('hidden');
  try {
    const meResp = await fetch(`${API_BASE_URL}/users/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!meResp.ok) throw new Error("Не вдалося отримати дані користувача");
    const meData = await meResp.json();
    const diffNum = await getCurrentPatientDifficulty(courseId, meData.id);
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

// Відкриває модальне вікно редагування пацієнта для лікаря (завантажує поточну складність, доступні рівні та список залишених відгуків)
async function adjustPatient(patientId) {
  currentModalPatientId = patientId;
  const urlParams = new URLSearchParams(window.location.search);
  currentModalCourseId = urlParams.get('id');
  const modal = document.getElementById('patient-modal');
  modal.classList.remove('hidden');
  const currentDifficulty = await getCurrentPatientDifficulty(currentModalCourseId, currentModalPatientId);
  await loadDifficultyOptions(currentModalCourseId, currentDifficulty);
  await loadPatientFeedbacks(currentModalCourseId, currentModalPatientId);
}

// Закриває модальне вікно редагування пацієнта та очищає збережений ідентифікатор
function closePatientModal() {
  const modal = document.getElementById('patient-modal');
  modal.classList.add('hidden');
  currentModalPatientId = null;
}

// Отримує всі доступні рівні складності, які були створені для цього курсу і заповнює ними випадаючий список у модальному вікні лікаря
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
    const response = await fetch(`${API_BASE_URL}/courses/${courseId}/content`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error("Помилка завантаження контенту курсу");
    const courseData = await response.json();
    const levels = courseData.levels || [];
    select.innerHTML = "";
    if (levels.length === 0) {
      select.innerHTML = "<option value=''>Немає рівнів</option>";
      return;
    }
    const safeDifficulty = currentDifficulty ? Number(currentDifficulty) : 2;
    levels.forEach(levelObj => {
      const diffLevel = levelObj.difficulty;
      const option = document.createElement('option');
      option.value = diffLevel;
      option.textContent = difficultyNames[diffLevel] || `Рівень ${diffLevel}`;
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

// Відправляє POST/PATCH запит на сервер для зміни рівня складності курсу для обраного пацієнта та відображає статус операції
async function changePatientDifficulty() {
  if (!currentModalPatientId || !currentModalCourseId) return;
  const select = document.getElementById('course-difficulty-select');
  const newDifficulty = select.value;
  const token = localStorage.getItem('access_token');
  const btn = document.querySelector('.save-diff-btn');
  try {
    btn.disabled = true;
    btn.textContent = "Збереження...";
    const response = await fetch(`${API_BASE_URL}/courses/${currentModalCourseId}/change-difficulty?patient_id=${currentModalPatientId}&new_difficulty=${newDifficulty}`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error("Не вдалося змінити складність");
    showDiffMessage("✅ Успішно збережено", true);
  } catch (error) {
    console.error("Помилка:", error);
    showDiffMessage("❌ Помилка збереження", false);
  } finally {
    btn.disabled = false;
    btn.textContent = "Змінити";
  }
}

// Відображає тимчасове повідомлення про результат спроби зміни складності у модальному вікні
function showDiffMessage(text, isSuccess) {
  const msgEl = document.getElementById('diff-status-message');
  if (!msgEl) return;
  msgEl.textContent = text;
  msgEl.style.color = isSuccess ? '#28a745' : '#dc3545';
  msgEl.style.opacity = '1';
  setTimeout(() => {
    msgEl.style.opacity = '0';
  }, 2000);
}

// Завантажує та відображає список відгуків, залишених конкретним пацієнтом під час проходження курсу
async function loadPatientFeedbacks(courseId, patientId) {
  const token = localStorage.getItem('access_token');
  const listContainer = document.getElementById('feedbacks-list');
  listContainer.innerHTML = "<p>Завантаження відгуків...</p>";
  try {
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
    feedbacks.sort((a, b) => b.session_number - a.session_number);
    feedbacks.forEach(fb => {
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

// Видаляє дані сесії з локального сховища та перенаправляє користувача на сторінку входу
function logoutUser(event) {
  if(event) event.preventDefault();
  localStorage.removeItem('access_token');
  localStorage.removeItem('user_role');
  window.location.href = 'main_and_auth.html';
}

// Повертає користувача на попередню сторінку в історії браузера або перенаправляє на головну
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

// Копіює унікальний ID курсу в буфер обміну браузера та тимчасово змінює іконку на галочку для підтвердження
async function copyCourseId() {
  const urlParams = new URLSearchParams(window.location.search);
  const courseId = urlParams.get('id');
  if (!courseId) return;
  const icon = document.querySelector('.doctor-course-id .copy-icon');
  try {
    await navigator.clipboard.writeText(courseId);
    icon.classList.remove('fa-copy', 'far');
    icon.classList.add('fa-check', 'fas', 'copied');
    icon.title = "Скопійовано!";
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

// Перенаправляє лікаря на сторінку конструктора курсу, передаючи в URL параметр edit_id для завантаження поточного курсу в режим редагування
function editCourse() {
  const urlParams = new URLSearchParams(window.location.search);
  const courseId = urlParams.get('id');
  if (!courseId) {
    alert("Помилка: не знайдено ID курсу.");
    return;
  }
  const btn = document.querySelector('.edit-course-btn');
  if (btn) {
    btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Перехід...`;
    btn.disabled = true;
  }
  window.location.href = `constructor_course.html?edit_id=${courseId}`;
}
