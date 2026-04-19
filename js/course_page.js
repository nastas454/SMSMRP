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

function adjustPatient(patientId) {
  console.log("Редагування пацієнта:", patientId);
  // Додайте логіку для відкриття модального вікна чи переходу на сторінку пацієнта
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
