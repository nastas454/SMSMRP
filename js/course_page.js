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

  const role = getUserRole(); // Очікується з utils.js

  // Отримуємо ID курсу з URL (наприклад, course_page.html?id=5)
  const urlParams = new URLSearchParams(window.location.search);
  const courseId = urlParams.get('id');

  if (!courseId) {
    alert("Курс не знайдено");
    window.location.href = 'home_page.html';
    return;
  }

  // --- ДОДАНА ЛОГІКА ДЛЯ КНОПКИ "ПОЧАТИ" ---
  const startButton = document.getElementById('start-course-btn');
  if (startButton) {
    startButton.addEventListener('click', () => {
      // Перенаправляємо на сторінку course_completion і передаємо ID поточного курсу
      window.location.href = `course_completion.html?id=${courseId}`;
    });
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
  // Тут має бути ваш реальний запит до API, наприклад:
  // const response = await fetch(`${API_BASE_URL}/courses/${courseId}`, { ... });

  // Для демонстрації створюємо фейкові дані
  const courseData = {
    title: "Відновлення колінного суглоба",
    injuries: "Розрив меніска, операція на ПХЗ",
    duration: "45 днів",
    doctor_name: "Іван Петренко",
    description: "Цей курс спрямований на поступове відновлення рухливості коліна після хірургічного втручання. Включає щоденні розтяжки та легкі силові навантаження."
  };

  document.getElementById('cp-title').textContent = courseData.title;
  document.getElementById('cp-injuries').textContent = courseData.injuries;
  document.getElementById('cp-duration').textContent = courseData.duration;
  document.getElementById('cp-doctor').textContent = courseData.doctor_name;
  document.getElementById('cp-description').textContent = courseData.description;
}

async function loadCoursePatients(courseId) {
  // Реальний запит до API за списком пацієнтів
  // const response = await fetch(`${API_BASE_URL}/doctor/courses/${courseId}/patients`, { ... });

  // Демо-дані для таблиці
  const patients = [
    { id: 101, firstName: "Олексій", lastName: "Коваленко", gender: "Ч", age: 34, email: "alex@test.com", stage: "Тиждень 2" },
    { id: 102, firstName: "Марія", lastName: "Бойко", gender: "Ж", age: 28, email: "maria@test.com", stage: "Тиждень 4" }
  ];

  const tbody = document.getElementById('patients-table-body');
  if (!tbody) return;

  tbody.innerHTML = "";

  patients.forEach(p => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${p.id}</td>
      <td>${p.firstName}</td>
      <td>${p.lastName}</td>
      <td>${p.gender}</td>
      <td>${p.age}</td>
      <td>${p.email}</td>
      <td>${p.stage}</td>
      <td><button class="action-btn" onclick="adjustPatient(${p.id})">кнопка</button></td>
    `;
    tbody.appendChild(tr);
  });
}

function adjustPatient(patientId) {
  console.log("Редагування пацієнта:", patientId);
  // Додайте логіку для відкриття модального вікна чи переходу
}

function logoutUser(event) {
  event.preventDefault();
  localStorage.removeItem('access_token');
  localStorage.removeItem('user_role');
  window.location.href = 'main_and_auth.html';
}
