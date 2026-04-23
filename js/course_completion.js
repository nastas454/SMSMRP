const API_BASE_URL = "http://localhost:8000";

let courseExercises = [];
let currentIndex = 0;
let isLastDay = false;

document.addEventListener('DOMContentLoaded', async () => {
  const token = localStorage.getItem('access_token');
  if (!token) {
    window.location.href = 'login.html';
    return;
  }
  const userRole = localStorage.getItem('user_role');
  if (userRole !== 'patient') {
    alert("Доступ заборонено! Лише пацієнти можуть проходити курс.");
    window.location.href = 'home_page.html';
    return;
  }
  const urlParams = new URLSearchParams(window.location.search);
  const courseId = urlParams.get('id');
  if (!courseId) {
    alert("Курс не знайдено!");
    window.location.href = 'home_page.html';
    return;
  }
  await loadCourseData(courseId);
});

// Завантажує статус проходження курсу та перелік вправ для поточного заняття. Обробляє стани очікування, завершення курсу або готовності до виконання вправ
async function loadCourseData(courseId) {
  const token = localStorage.getItem('access_token');
  try {
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
    if (data.status === "in_progress" && data.day_content) {
      document.getElementById('btn-next').dataset.session = data.current_day;
      courseExercises = [];
      isLastDay = (data.current_day >= data.total_days);
      const dayData = data.day_content;
      if (dayData.exercises && Array.isArray(dayData.exercises)) {
        dayData.exercises.forEach((ex, index) => {
          courseExercises.push({
            day: `ЗАНЯТТЯ ${data.current_day}`,
            // =====================================
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
      const statusContainer = document.getElementById('status-container');
      const exerciseContainer = document.getElementById('exercise-container');
      if (statusContainer) statusContainer.style.display = 'none';
      if (exerciseContainer) exerciseContainer.style.display = 'block';
      renderExercise(0);
    }
  } catch (error) {
    console.error("Помилка:", error);
    alert("Помилка завантаження даних курсу. Перевірте консоль.");
    goBack();
  }
}

// Приховує інтерфейс виконання вправ та відображає спеціальний екран стану
function showStatusUI(iconClass, title, message, timerText) {
  const exerciseContainer = document.getElementById('exercise-container');
  const statusContainer = document.getElementById('status-container');
  document.querySelector('.execution-card').style.display = 'none';
  document.querySelectorAll('.nav-btn-container').forEach(btn => btn.style.display = 'none');

  if (statusContainer) {
    statusContainer.style.display = 'block';
    document.getElementById('status-icon').className = iconClass;
    document.getElementById('status-title').textContent = title;
    document.getElementById('status-message').textContent = message;
    document.getElementById('timer-display').textContent = timerText;
  } else {
    alert(`${title}\n${message} ${timerText}`);
    goBack();
  }
}

let isFeedbackStep = false;

// Відображає дані конкретної вправи на екрані, оновлює стан кнопок навігації та приховує форму відгуку
function renderExercise(index) {
  document.getElementById('exercise-container').style.display = 'flex';
  document.getElementById('feedback-container').style.display = 'none';
  isFeedbackStep = false;
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
  btnNext.innerHTML = `Далі <i class="fas fa-arrow-right"></i>`;
  btnNext.disabled = false;
}

// Приховує екран із поточною вправою та відкриває форму для залишення відгуку після завершення заняття. Оновлює текст фінальної кнопки
function showFeedbackForm() {
  isFeedbackStep = true;
  document.getElementById('exercise-container').style.display = 'none';
  document.getElementById('feedback-container').style.display = 'flex';
  const btnNext = document.getElementById('btn-next');
  if (isLastDay) {
    btnNext.innerHTML = `Завершити курс <i class="fas fa-trophy"></i>`;
  } else {
    btnNext.innerHTML = `Завершити заняття <i class="fas fa-check"></i>`;
  }
}

// Кнопка "Далі / Завершити"
async function nextExercise() {
  if (!isFeedbackStep) {
    if (currentIndex < courseExercises.length - 1) {
      currentIndex++;
      renderExercise(currentIndex);
    } else {
      showFeedbackForm();
    }
  } else {
    submitDayWithFeedback();
  }
}

// Кнопка "Назад"
function prevExercise() {
  if (isFeedbackStep) {
    renderExercise(currentIndex);
  } else if (currentIndex > 0) {
    currentIndex--;
    renderExercise(currentIndex);
  }
}

// Збирає дані з форми відгуку, відправляє їх на сервер, завершує поточне заняття та перезавантажує сторінку для оновлення статусу
async function submitDayWithFeedback() {
  const urlParams = new URLSearchParams(window.location.search);
  const courseId = urlParams.get('id');
  const btnNext = document.getElementById('btn-next');

  const painLevel = parseInt(document.getElementById('pain-range').value);
  const diffLevel = parseInt(document.getElementById('difficulty-range').value);
  const noteText = document.getElementById('feedback-notes').value.trim();
  const sessionNum = parseInt(btnNext.dataset.session);
  try {
    btnNext.disabled = true;
    btnNext.innerHTML = "Збереження...";
    await sendFeedbackToBackend(courseId, painLevel, diffLevel, sessionNum, noteText);
    await completeDayOnBackend(courseId);
    window.location.reload();
  } catch (err) {
    console.error(err);
    alert(`Помилка: ${err.message}`);
    btnNext.disabled = false;
    btnNext.innerHTML = "Спробувати ще раз";
  }
}

// Відправляє POST-запит на бекенд для збереження відгуку пацієнта про пройдене заняття
async function sendFeedbackToBackend(courseId, pain, difficulty, session, note) {
  const token = localStorage.getItem('access_token');
  const payload = {
    pain_level: pain,
    difficulty_level: difficulty,
    session_number: session,
    note: note || null
  };

  const response = await fetch(`${API_BASE_URL}/feedbacks/${courseId}/feedback`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    const errData = await response.json();
    throw new Error(errData.detail || 'Не вдалося надіслати відгук');
  }
}

// Відправляє POST-запит на бекенд для позначення поточного заняття курсу як успішно пройденого
async function completeDayOnBackend(courseId) {
  const token = localStorage.getItem('access_token');
  const response = await fetch(`${API_BASE_URL}/courses/${courseId}/complete-day`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  if (!response.ok) {
    const errData = await response.json();
    throw new Error(errData.detail || errData.message || 'Не вдалося закрити заняття');
  }
}

// Видаляє дані користувача з локального сховища та перенаправляє на сторінку входу
function logoutUser(event) {
  if (event) event.preventDefault();
  localStorage.removeItem('access_token');
  localStorage.removeItem('user_role');
  window.location.href = 'main_and_auth.html';
}

// Перенаправляє користувача назад на головну сторінку курсу із відповідним ID
function goBack(event) {
  if (event) event.preventDefault();
  const urlParams = new URLSearchParams(window.location.search);
  const courseId = urlParams.get('id');
  window.location.href = `course_page.html?id=${courseId}`;
}
