// Тестові дані (імітуємо базу даних)
const coursesData = [
  {
    id: 1,
    title: "Курс 1",
    injuries: "Розрив меніска",
    description: "Відновлення рухливості коліна, зняття набряків.",
    doctor: "Ім'я Прізвище лікаря"
  },
  {
    id: 2,
    title: "Курс 2",
    injuries: "Перелом променевої кістки",
    description: "Вправи для розробки кисті та передпліччя.",
    doctor: "Др. Хаус"
  },
  {
    id: 3,
    title: "Курс 3",
    injuries: "Артроскопія плеча",
    description: "Повернення тонусу м'язів плечового поясу.",
    doctor: "Ім'я Прізвище лікаря"
  },
  {
    id: 4,
    title: "Курс 4",
    injuries: "Грижа попереку",
    description: "Зміцнення м'язового корсету спини.",
    doctor: "Др. Стрендж"
  }
];

document.addEventListener('DOMContentLoaded', () => {
  renderSidebar();
  renderGrid();
});

// 1. Рендеринг бокової панелі (список)
function renderSidebar() {
  const sidebarList = document.getElementById('sidebar-list');

  coursesData.forEach(course => {
    const li = document.createElement('li');
    li.textContent = course.title;
    li.onclick = () => {
      alert(`Перехід до ${course.title}`);
      // Тут можна зробити скрол до картки або фільтрацію
    };
    sidebarList.appendChild(li);
  });
}

// 2. Рендеринг основної сітки (картки)
function renderGrid() {
  const grid = document.getElementById('courses-grid');

  coursesData.forEach(course => {
    const card = document.createElement('div');
    card.className = 'course-card';

    card.innerHTML = `
      <div class="card-header">
        <h3 class="card-title">${course.title}</h3>
      </div>

      <div class="card-body">
        <p>
          <span class="card-label">травми:</span> ${course.injuries}
        </p>
        <p>
          <span class="card-label">травм для проходження цього курсу:</span> <br>
          ${course.description}
        </p>
      </div>

      <div class="card-footer">
        <span class="doctor-name">
          <span class="card-label">лікар:</span> ${course.doctor}
        </span>

        <button class="more-options-btn" style="margin-left: 10px;">
          <i class="fas fa-ellipsis-v"></i>
        </button>
      </div>
    `;

    grid.appendChild(card);
  });
}
