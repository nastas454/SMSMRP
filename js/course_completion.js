// ДЕМОНСТРАЦІЙНІ ДАНІ: Масив вправ курсу для конкретного дня
const courseExercises = [
  {
    day: "ДЕНЬ 1",
    exerciseNum: "Вправа 1",
    name: "Тяга гумової стрічки до поясу",
    reps: "15",
    sets: "3",
    description: "Сядьте рівно, ноги витягніть вперед. Зачепіть стрічку за стопи і тягніть на себе до пояса, зводячи лопатки.",
    recommendations: "Зверніть увагу на спину - вона має бути абсолютно рівною. Не робіть ривків.",
    videoUrl: "https://youtube.com/watch?v=example1"
  },
  {
    day: "ДЕНЬ 1",
    exerciseNum: "Вправа 2",
    name: "Махи руками в сторони",
    reps: "12",
    sets: "4",
    description: "Стоячи прямо, піднімайте руки через сторони до рівня плечей. Повільно опускайте.",
    recommendations: "Не піднімайте плечі до вух. Тримайте шию розслабленою.",
    videoUrl: "https://youtube.com/watch?v=example2"
  },
  {
    day: "ДЕНЬ 1",
    exerciseNum: "Вправа 3",
    name: "Розтяжка м'язів грудей",
    reps: "30 сек",
    sets: "2",
    description: "Підійдіть до стіни, обіпріться передпліччям і злегка поверніть корпус в протилежну сторону.",
    recommendations: "Ви маєте відчувати приємний натяг, без різкого болю.",
    videoUrl: "https://youtube.com/watch?v=example3"
  }
];

let currentIndex = 0;

document.addEventListener('DOMContentLoaded', () => {
  // 1. ПЕРЕВІРКА РОЛІ
  // Якщо користувач не 'patient', перекидаємо його на головну сторінку або сторінку курсу
  const userRole = localStorage.getItem('user_role');
  if (userRole !== 'patient') {
    alert("Доступ заборонено! Лише пацієнти можуть проходити курс.");
    window.location.href = 'home_page.html'; // або course_page.html
    return;
  }

  // 2. Ініціалізація першої вправи
  renderExercise(currentIndex);
});

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

  // Обробка посилання
  const videoElement = document.getElementById('display-video');
  videoElement.textContent = exercise.videoUrl;
  videoElement.href = exercise.videoUrl;

  // ЛОГІКА КНОПОК
  const btnPrev = document.getElementById('btn-prev');
  const btnNext = document.getElementById('btn-next');

  // Якщо перша вправа - ховаємо кнопку Назад (але зберігаємо місце через visibility: hidden)
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
    alert("Курс на сьогодні завершено! Чудова робота!");
    window.location.href = 'course_page.html';
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
