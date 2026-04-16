const API_BASE_URL = "http://localhost:8000";

// Пустий масив, який буде заповнений реальними даними з БД/MinIO
let courseExercises = [];
let currentIndex = 0;

document.addEventListener('DOMContentLoaded', async () => {
  const token = localStorage.getItem('access_token');
  if (!token) {
    window.location.href = '/login.html';
    return;
  }

  // 1. ПЕРЕВІРКА РОЛІ
  const userRole = localStorage.getItem('user_role');
  if (userRole !== 'patient') {
    alert("Доступ заборонено! Лише пацієнти можуть проходити курс.");
    window.location.href = 'home_page.html';
    return;
  }

  // 2. Отримуємо ID курсу з URL
  const urlParams = new URLSearchParams(window.location.search);
  const courseId = urlParams.get('id');

  if (!courseId) {
    alert("Курс не знайдено!");
    window.location.href = 'home_page.html';
    return;
  }

  // 3. Завантажуємо дані курсу
  await loadCourseData(courseId);
});

async function loadCourseData(courseId) {
  const token = localStorage.getItem('access_token');

  try {
    // РЕАЛЬНИЙ ЗАПИТ: Звертаємося до ендпоінту, який повертає вміст JSON з MinIO
    const response = await fetch(`${API_BASE_URL}/courses/${courseId}/content`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error("Не вдалося завантажити контент курсу (JSON)");
    }

    const minioJson = await response.json();

    // "Сплющуємо" складний JSON у зручний масив
    courseExercises = [];

    // Захист від помилок: перевіряємо чи існують "days"
    if (minioJson.days && Array.isArray(minioJson.days)) {
      minioJson.days.forEach(day => {
        if (day.exercises && Array.isArray(day.exercises)) {
          day.exercises.forEach((ex, index) => {
            courseExercises.push({
              day: `ДЕНЬ ${day.day_number}`,
              exerciseNum: `Вправа ${index + 1}`,
              name: ex.name || '-',
              reps: ex.reps || '-',
              sets: ex.sets || '-',
              description: ex.description || '-',
              recommendations: ex.recommendations || '-',
              videoUrl: ex.video_url || '#'
            });
          });
        }
      });
    }

    // Якщо курс виявився пустим або парсинг не вдався
    if (courseExercises.length === 0) {
      alert("У цьому курсі ще немає вправ!");
      window.location.href = `course_page.html?id=${courseId}`;
      return;
    }

    // 4. Відображаємо першу вправу
    renderExercise(0);

  } catch (error) {
    console.error("Помилка:", error);
    alert("Помилка завантаження даних курсу. Спробуйте пізніше.");
    window.location.href = `course_page.html?id=${courseId}`;
  }
}

// Функція для відображення даних вправи
function renderExercise(index) {
  const exercise = courseExercises[index];

  // Заповнюємо HTML елементи даними
  document.getElementById('display-day').textContent = exercise.day;
  document.getElementById('display-exercise-title').textContent = `${exercise.exerciseNum}: ${exercise.name}`;
  document.getElementById('display-reps').textContent = exercise.reps;
  document.getElementById('display-sets').textContent = exercise.sets;
  document.getElementById('display-desc').textContent = exercise.description;
  document.getElementById('display-rec').textContent = exercise.recommendations;

  // Обробка відео-посилання
  const videoElement = document.getElementById('display-video');
  if (videoElement) {
    videoElement.textContent = "Дивитись відео-інструкцію";
    videoElement.href = exercise.videoUrl !== '#' ? exercise.videoUrl : '#';
    // Якщо немає посилання, можна візуально "відключити" кнопку
    if (exercise.videoUrl === '#') {
      videoElement.style.pointerEvents = 'none';
      videoElement.style.opacity = '0.5';
      videoElement.textContent = "Відео відсутнє";
    } else {
      videoElement.style.pointerEvents = 'auto';
      videoElement.style.opacity = '1';
    }
  }

  // ЛОГІКА КНОПОК "Далі" / "Назад"
  const btnPrev = document.getElementById('btn-prev');
  const btnNext = document.getElementById('btn-next');

  // Якщо перша вправа - ховаємо кнопку Назад
  if (index === 0) {
    btnPrev.classList.add('invisible');
  } else {
    btnPrev.classList.remove('invisible');
  }

  // Якщо остання вправа - змінюємо кнопку "Далі" на "Завершити"
  if (index === courseExercises.length - 1) {
    btnNext.innerHTML = `Завершити <i class="fas fa-check"></i>`;
  } else {
    btnNext.innerHTML = `Далі <i class="fas fa-arrow-right"></i>`;
  }
}

// Функція для кнопки "Далі / Завершити"
function nextExercise() {
  if (currentIndex < courseExercises.length - 1) {
    currentIndex++;
    renderExercise(currentIndex);
  } else {
    // Якщо це була остання вправа, перекидаємо назад на сторінку курсу
    const urlParams = new URLSearchParams(window.location.search);
    const courseId = urlParams.get('id');
    alert("Всі вправи курсу успішно пройдено! Чудова робота!");
    window.location.href = `course_page.html?id=${courseId}`;
  }
}

// Функція для кнопки "Назад"
function prevExercise() {
  if (currentIndex > 0) {
    currentIndex--;
    renderExercise(currentIndex);
  }
}

// Функція виходу
function logoutUser(event) {
  if (event) event.preventDefault();
  localStorage.removeItem('access_token');
  localStorage.removeItem('user_role');
  window.location.href = 'main_and_auth.html';
}

// Функція "Назад" (для шапки сайту)
function goBack(event) {
  if (event) event.preventDefault();
  const urlParams = new URLSearchParams(window.location.search);
  const courseId = urlParams.get('id');
  window.location.href = `course_page.html?id=${courseId}`;
}
