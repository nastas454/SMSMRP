// --- КОНФІГУРАЦІЯ ---
const API_BASE_URL = "http://localhost:8000"; // Ваша адреса бекенду

document.addEventListener('DOMContentLoaded', () => {
  initApp();
});

// --- ІНІЦІАЛІЗАЦІЯ ---

async function initApp() {
  // 1. Перевіряємо токен
  const token = localStorage.getItem('access_token');

  if (!token) {
    console.warn("Токен відсутній. Перенаправлення на вхід.");
    window.location.href = '/login.html';
    return;
  }

  // 2. Отримуємо роль (з utils.js)
  const role = getUserRole();
  console.log("Поточна роль:", role); // Для перевірки в консолі

  // 3. Налаштовуємо кнопку (ВИПРАВЛЕНО)
  setupAddButton(role);

  // 4. Налаштовуємо модалку (тільки для пацієнта)
  if (role !== 'doctor') {
    setupModalListeners();
  }

  // 5. Завантажуємо курси
  await loadCourses(role);
}

// --- 1. ВИПРАВЛЕНА КНОПКА "ДОДАТИ" ---

function setupAddButton(role) {
  const btn = document.getElementById('add-course-btn');
  if (!btn) return;

  // Клонуємо кнопку, щоб зняти всі слухачі подій (addEventListener)
  const newBtn = btn.cloneNode(true);

  // ВАЖЛИВО: Знімаємо inline-обробники (якщо в HTML було onclick="...")
  newBtn.onclick = null;

  // Замінюємо кнопку в DOM
  btn.parentNode.replaceChild(newBtn, btn);

  // Додаємо нову подію
  newBtn.addEventListener('click', (event) => {
    event.preventDefault(); // Зупиняє відправку форми або перехід за посиланням

    if (role === 'doctor') {
      // ЛІКАР -> Перехід на сторінку створення
      console.log("Лікар: перехід на constructor_course.html");
      window.location.href = "constructor_course.html";
    } else {
      // ПАЦІЄНТ -> Відкрити модальне вікно
      console.log("Пацієнт: відкриття модального вікна");
      openJoinModal();
    }
  });
}

// --- 2. ЗАВАНТАЖЕННЯ ДАНИХ (GET) ---

async function loadCourses(role) {
  const endpoint = role === 'doctor'
    ? `${API_BASE_URL}/doctor/courses`
    : `${API_BASE_URL}/user/courses`;

  try {
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.status === 401) {
      alert("Сесія закінчилась. Будь ласка, увійдіть знову.");
      window.location.href = '/login.html';
      return;
    }

    if (!response.ok) throw new Error(`Status: ${response.status}`);

    const courses = await response.json();

    renderSidebar(courses);
    renderGrid(courses);
    updateWelcomePanel(courses.length);

  } catch (error) {
    console.error("Помилка завантаження курсів:", error);
    const grid = document.getElementById('courses-grid');
    if (grid) grid.innerHTML = `<p style="text-align: center; color: red;">Не вдалося завантажити курси.</p>`;
  }
}

// --- 3. МОДАЛЬНЕ ВІКНО (Тільки Пацієнт) ---

const modal = document.getElementById('join-modal');
const modalInput = document.getElementById('modal-course-id');
const errorText = document.getElementById('modal-error');

function openJoinModal() {
  if (!modal) return;
  modal.classList.remove('hidden');
  if (modalInput) {
    modalInput.value = '';
    modalInput.focus();
  }
  if (errorText) errorText.classList.add('hidden');
}

function closeJoinModal() {
  if (modal) modal.classList.add('hidden');
}

function showModalError(msg) {
  if (errorText) {
    errorText.textContent = msg;
    errorText.classList.remove('hidden');
  } else {
    alert(msg);
  }
}

function setupModalListeners() {
  if (!modal) return;

  // Кнопки закриття
  const closeBtn = document.getElementById('close-modal-btn');
  const cancelBtn = document.getElementById('cancel-btn');
  if (closeBtn) closeBtn.onclick = closeJoinModal;
  if (cancelBtn) cancelBtn.onclick = closeJoinModal;

  // Клік по фону
  modal.onclick = (event) => {
    if (event.target === modal) closeJoinModal();
  };

  // Підтвердження
  const confirmBtn = document.getElementById('confirm-join-btn');
  if (confirmBtn) {
    // Видаляємо старі обробники через клонування (на випадок подвійного виклику init)
    const newConfirmBtn = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);

    newConfirmBtn.addEventListener('click', async () => {
      const courseId = modalInput.value.trim();
      if (!courseId) {
        showModalError("Введіть ID курсу");
        return;
      }
      await joinCourseAsUser(courseId);
    });
  }
}

// --- 4. ЛОГІКА ПРИЄДНАННЯ (POST) ---

async function joinCourseAsUser(courseId) {
  try {
    const token = localStorage.getItem('access_token');
    const response = await fetch(`${API_BASE_URL}/user/courses/${courseId}/join`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      closeJoinModal();
      alert("Успішно приєднано!");
      loadCourses('user'); // Оновити список
    } else {
      const err = await response.json();
      showModalError(err.detail || 'Помилка приєднання');
    }
  } catch (error) {
    console.error(error);
    showModalError("Помилка з'єднання");
  }
}

// --- 5. РЕНДЕР (Відображення) ---

function renderSidebar(courses) {
  const list = document.getElementById('sidebar-list');
  if (!list) return;
  list.innerHTML = "";
  courses.forEach(course => {
    const li = document.createElement('li');
    li.textContent = course.title || `Курс #${course.id}`;
    list.appendChild(li);
  });
}

function renderGrid(courses) {
  const grid = document.getElementById('courses-grid');
  if (!grid) return;
  grid.innerHTML = "";

  if (courses.length === 0) {
    grid.innerHTML = `<p style="width: 100%; text-align: center;">Список курсів порожній.</p>`;
    return;
  }

  courses.forEach(course => {
    const progress = course.progress ?? 0;
    const doctor = course.doctor || course.doctor_name || "Не вказано";

    const card = document.createElement('div');
    card.className = 'course-card';
    card.innerHTML = `
            <div class="card-header"><h3 class="card-title">${course.title || 'Без назви'}</h3></div>
            <div class="card-body">
                <p><span class="card-label">Травми:</span> ${course.injuries || '-'}</p>
                <p><span class="card-label">Опис:</span><br>${course.description || '-'}</p>
                <div style="margin-top: 20px;">
                    <span class="progress-text">Прогрес: ${progress}%</span>
                    <div class="progress-container">
                        <div class="progress-bar" style="width: ${progress}%"></div>
                    </div>
                </div>
            </div>
            <div class="card-footer">
                <span class="doctor-name"><span class="card-label">Лікар:</span> ${doctor}</span>
                <button class="more-options-btn"><i class="fas fa-ellipsis-v"></i></button>
            </div>
        `;
    grid.appendChild(card);
  });
}

function updateWelcomePanel(count) {
  const el = document.getElementById('active-courses-count');
  if (el) el.textContent = count;
}
