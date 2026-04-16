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

  // Очікується з utils.js, або можете використовувати localStorage.getItem('user_role')
  const role = localStorage.getItem('user_role');

  // Отримуємо ID курсу з URL (наприклад, course_page.html?id=5)
  const urlParams = new URLSearchParams(window.location.search);
  const courseId = urlParams.get('id');

  if (!courseId) {
    alert("Курс не знайдено");
    window.location.href = 'home_page.html';
    return;
  }

  // --- ЛОГІКА ДЛЯ КНОПКИ "ПОЧАТИ" ---
  const startButton = document.getElementById('start-course-btn');
  if (startButton) {
    if (role === 'doctor') {
      // Якщо це лікар, повністю приховуємо кнопку
      startButton.style.display = 'none';
    } else {
      // Якщо це пацієнт, кнопка залишається видимою і працює
      startButton.addEventListener('click', () => {
        window.location.href = `course_completion.html?id=${courseId}`;
      });
    }
  }
  // -----------------------------------------

  // Завантажуємо деталі курсу
  await loadCourseDetails(courseId, role);

  // Якщо лікар, показуємо нижню секцію і вантажимо пацієнтів
  if (role === 'doctor') {
    const doctorSection = document.getElementById('doctor-patients-section');
    if (doctorSection) {
      doctorSection.classList.remove('hidden');
    }
    await loadCoursePatients(courseId);
  }
}

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

    // Заповнюємо дані на сторінці згідно з моделлю CoursesResponse
    document.getElementById('cp-title').textContent = courseData.course_name || '-';

    // Обробка масиву травм (якщо це список, з'єднуємо через кому)
    const injuriesText = Array.isArray(courseData.injuries)
      ? courseData.injuries.join(", ")
      : (courseData.injuries || '-');
    document.getElementById('cp-injuries').textContent = injuriesText;

    // У вашій Pydantic моделі немає поля "duration", тому залишаємо заглушку
    const durationEl = document.getElementById('cp-duration');
    if (durationEl) {
      durationEl.textContent = "Не вказано";
    }

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
