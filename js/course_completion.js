const API_BASE_URL = "http://localhost:8000";

let courseExercises = [];
let currentIndex = 0;
let isLastDay = false; // Змінна, щоб знати, чи це фінал курсу

document.addEventListener('DOMContentLoaded', async () => {
  const token = localStorage.getItem('access_token');
  if (!token) {
    window.location.href = 'login.html';
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
    // Звертаємося до НОВОГО ендпоінту для пацієнтів
    const response = await fetch(`${API_BASE_URL}/courses/${courseId}/patient-content`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error("Не вдалося завантажити контент курсу");
    }

    const data = await response.json();

    // РОЗПОДІЛ ЛОГІКИ ЗАЛЕЖНО ВІД СТАТУСУ БЕКЕНДУ
    if (data.status === "completed") {
      showStatusUI(
        "fas fa-trophy",
        "Вітаємо!",
        "Ви успішно пройшли всі дні цього курсу. Чудова робота!",
        ""
      );
      return;
    }

    if (data.status === "waiting") {
      const hours = data.time_left.hours;
      const minutes = data.time_left.minutes;
      showStatusUI(
        "fas fa-hourglass-half",
        "Час відпочити!",
        "Наступне заняття курсу відкриється через:",
        `${hours} год. ${minutes} хв.`
      );
      return;
    }

    // Якщо статус "in_progress", значить ми отримали дані поточного дня
    if (data.status === "in_progress" && data.day_content) {
      courseExercises = [];

      // Перевіряємо, чи це останнє заняття всього курсу
      isLastDay = (data.current_day >= data.total_days);

      const dayData = data.day_content;
      if (dayData.exercises && Array.isArray(dayData.exercises)) {
        dayData.exercises.forEach((ex, index) => {
          courseExercises.push({
            day: `ЗАНЯТТЯ ${dayData.day_number}`,
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

      if (courseExercises.length === 0) {
        alert("У цьому дні немає вправ!");
        goBack();
        return;
      }

      // Показуємо блок з вправами (якщо він був прихований)
      const statusContainer = document.getElementById('status-container');
      const exerciseContainer = document.getElementById('exercise-container');
      if (statusContainer) statusContainer.style.display = 'none';
      if (exerciseContainer) exerciseContainer.style.display = 'block';

      // Відображаємо першу вправу
      renderExercise(0);
    }

  } catch (error) {
    console.error("Помилка:", error);
    alert("Помилка завантаження даних курсу. Перевірте консоль.");
    goBack();
  }
}

// Функція для приховування вправ і показу таймера/повідомлення
// (Працює, якщо ви додали <div id="status-container"> у ваш HTML)
function showStatusUI(iconClass, title, message, timerText) {
  const exerciseContainer = document.getElementById('exercise-container');
  const statusContainer = document.getElementById('status-container');

  if (exerciseContainer) exerciseContainer.style.display = 'none';
  if (statusContainer) {
    statusContainer.style.display = 'block';
    document.getElementById('status-icon').className = iconClass;
    document.getElementById('status-title').textContent = title;
    document.getElementById('status-message').textContent = message;
    document.getElementById('timer-display').textContent = timerText;
  } else {
    // Резервний варіант, якщо ви забули оновити HTML
    alert(`${title}\n${message} ${timerText}`);
    goBack();
  }
}

// Функція для відображення даних вправи
function renderExercise(index) {
  const exercise = courseExercises[index];

  document.getElementById('display-day').textContent = exercise.day;
  document.getElementById('display-exercise-title').textContent = `${exercise.exerciseNum}: ${exercise.name}`;
  document.getElementById('display-reps').textContent = exercise.reps;
  document.getElementById('display-sets').textContent = exercise.sets;
  document.getElementById('display-desc').textContent = exercise.description;
  document.getElementById('display-rec').textContent = exercise.recommendations;

  const videoElement = document.getElementById('display-video');
  if (videoElement) {
    videoElement.textContent = "Дивитись відео-інструкцію";
    videoElement.href = exercise.videoUrl !== '#' ? exercise.videoUrl : '#';
    if (exercise.videoUrl === '#') {
      videoElement.style.pointerEvents = 'none';
      videoElement.style.opacity = '0.5';
      videoElement.textContent = "Відео відсутнє";
    } else {
      videoElement.style.pointerEvents = 'auto';
      videoElement.style.opacity = '1';
    }
  }

  const btnPrev = document.getElementById('btn-prev');
  const btnNext = document.getElementById('btn-next');

  if (index === 0) {
    btnPrev.classList.add('invisible');
  } else {
    btnPrev.classList.remove('invisible');
  }

  // Якщо остання вправа у масиві ПОТОЧНОГО дня
  if (index === courseExercises.length - 1) {
    if (isLastDay) {
      btnNext.innerHTML = `Завершити курс <i class="fas fa-trophy"></i>`;
    } else {
      btnNext.innerHTML = `Завершити заняття <i class="fas fa-check"></i>`;
    }
  } else {
    btnNext.innerHTML = `Далі <i class="fas fa-arrow-right"></i>`;
  }
}

// Функція для кнопки "Далі / Завершити"
async function nextExercise() {
  if (currentIndex < courseExercises.length - 1) {
    currentIndex++;
    renderExercise(currentIndex);
  } else {
    // Якщо це остання вправа - відправляємо запит на завершення дня
    const urlParams = new URLSearchParams(window.location.search);
    const courseId = urlParams.get('id');
    const token = localStorage.getItem('access_token');
    const btnNext = document.getElementById('btn-next');

    try {
      btnNext.disabled = true;
      btnNext.innerHTML = "Збереження...";

      const response = await fetch(`${API_BASE_URL}/courses/${courseId}/complete-day`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        // Перезавантажуємо сторінку. Бекенд сам вирішить, що показати:
        // таймер до наступного дня чи повідомлення про фінал курсу.
        window.location.reload();
      } else {
        const errData = await response.json();
        alert(`Помилка: ${errData.message || 'Не вдалося завершити заняття'}`);
        btnNext.disabled = false;
        renderExercise(currentIndex);
      }
    } catch (err) {
      console.error(err);
      alert("Помилка мережі при спробі завершити заняття.");
      btnNext.disabled = false;
      renderExercise(currentIndex);
    }
  }
}

function prevExercise() {
  if (currentIndex > 0) {
    currentIndex--;
    renderExercise(currentIndex);
  }
}

function logoutUser(event) {
  if (event) event.preventDefault();
  localStorage.removeItem('access_token');
  localStorage.removeItem('user_role');
  window.location.href = 'main_and_auth.html';
}

function goBack(event) {
  if (event) event.preventDefault();
  const urlParams = new URLSearchParams(window.location.search);
  const courseId = urlParams.get('id');
  window.location.href = `course_page.html?id=${courseId}`;
}
