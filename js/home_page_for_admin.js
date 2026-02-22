// Мокові дані для демонстрації (заміните на завантаження з бекенду)
const usersData = {
  patients: [
    { id: 101, login: "patient_ivan", date: "2025-10-12", isActive: true },
    { id: 102, login: "maria_k", date: "2025-10-14", isActive: false },
    { id: 103, login: "user_spam99", date: "2025-11-01", isActive: false },
    { id: 104, login: "oleg_r", date: "2025-11-05", isActive: true }
  ],
  doctors: [
    { id: 1, login: "dr_kovalenko", date: "2025-01-10", isActive: true },
    { id: 2, login: "dr_shevchenko", date: "2025-02-15", isActive: true },
    { id: 3, login: "fake_doctor", date: "2025-11-10", isActive: false }
  ]
};

let currentTab = 'patients';

// Ініціалізація при завантаженні сторінки
document.addEventListener("DOMContentLoaded", () => {
  renderTable();
});

// Функція перемикання вкладок
function switchTab(tabName, btnElement) {
  currentTab = tabName;

  // Оновлюємо заголовок
  document.getElementById('page-title').innerText =
    `Користувачі: ${tabName === 'patients' ? 'Пацієнти' : 'Лікарі'}`;

  // Оновлюємо активну кнопку в меню
  document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
  btnElement.classList.add('active');

  renderTable();
}

// Функція відмальовування таблиці
function renderTable() {
  const tbody = document.getElementById('users-tbody');
  tbody.innerHTML = ''; // Очищаємо таблицю

  const data = usersData[currentTab];

  data.forEach(user => {
    const tr = document.createElement('tr');

    // Текст статусу
    const statusText = user.isActive ? "Активний" : "Неактивний";
    const statusClass = user.isActive ? "active" : "inactive";

    tr.innerHTML = `
      <td>#${user.id}</td>
      <td>
        <div class="user-info">
          <i class="far fa-user-circle"></i> ${user.login}
        </div>
      </td>
      <td>${user.date}</td>
      <td class="status-text ${statusClass}">${statusText}</td>
      <td class="actions">
        <button class="btn-action btn-unban"
                onclick="toggleBan(${user.id}, true)"
                ${user.isActive ? 'disabled' : ''}>
          розбанити
        </button>
        <button class="btn-action btn-ban"
                onclick="toggleBan(${user.id}, false)"
                ${!user.isActive ? 'disabled' : ''}>
          забанити
        </button>
      </td>
    `;

    tbody.appendChild(tr);
  });
}

// Функція для зміни статусу (імітація запиту на бекенд)
function toggleBan(userId, makeActive) {
  // Знаходимо користувача в поточному масиві
  const user = usersData[currentTab].find(u => u.id === userId);

  if (user) {
    // В реальному проєкті тут буде запит на сервер:
    // fetch(`/api/admin/users/${userId}/status`, { method: 'PUT', body: JSON.stringify({ is_active: makeActive }) })

    user.isActive = makeActive;

    // Перемальовуємо таблицю, щоб оновити кнопки та статус
    renderTable();
  }
}
