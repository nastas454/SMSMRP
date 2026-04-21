const API_BASE_URL = "http://localhost:8000";

// --- 1. СТАН РІВНІВ СКЛАДНОСТІ ---
let activeLevels = {
  1: false,
  2: true, // Стандартний завжди існує
  3: false
};
let currentLevel = 2;
let pendingLevelToAdd = null;

// --- ГЛОБАЛЬНИЙ СТАН ---
let isEditMode = false;
let editingCourseId = null;

document.addEventListener('DOMContentLoaded', () => {
  // Перевіряємо URL на наявність параметру edit_id
  const urlParams = new URLSearchParams(window.location.search);
  editingCourseId = urlParams.get('edit_id');

  if (editingCourseId) {
    // РЕЖИМ РЕДАГУВАННЯ
    isEditMode = true;

    // Міняємо заголовки та тексти кнопок
    const headerTitle = document.querySelector('h1') || document.querySelector('.page-title'); // Адаптуй селектор до свого HTML
    if (headerTitle) headerTitle.textContent = "Редагування курсу";

    const saveBtn = document.querySelector('.btn-save');
    if (saveBtn) saveBtn.innerHTML = '<i class="fas fa-save"></i> Оновити курс';

    // Завантажуємо дані з sessionStorage та розставляємо по полях
    loadCourseForEditing();
  } else {
    // РЕЖИМ СТВОРЕННЯ (Стандартний)
    // Додаємо перше заняття для стандартного рівня з нуля
    addDay();
    renderDifficultySelect();
  }
});

// --- ФУНКЦІЯ ЗАВАНТАЖЕННЯ ДАНИХ З БЕКЕНДУ ДЛЯ РЕДАГУВАННЯ ---
async function loadCourseForEditing() {
  if (!editingCourseId) return;

  try {
    const token = localStorage.getItem('access_token');

    // 1. Завантажуємо загальні дані (назва, опис, травми)
    const detailsResponse = await fetch(`${API_BASE_URL}/courses/${editingCourseId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!detailsResponse.ok) throw new Error("Не вдалося завантажити деталі курсу");
    const courseDetails = await detailsResponse.json();

    // 2. Завантажуємо розгортку (рівні та вправи)
    const contentResponse = await fetch(`${API_BASE_URL}/courses/${editingCourseId}/content`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!contentResponse.ok) throw new Error("Не вдалося завантажити контент курсу");
    const courseContent = await contentResponse.json();

    // === РОЗСТАВЛЯЄМО ДАНІ ПО ПОЛЯХ ===

    // 1. Базові поля
    if (courseDetails.course_name) document.getElementById('course-title').value = courseDetails.course_name;
    if (courseDetails.description) document.getElementById('course-desc').value = courseDetails.description;
    if (courseDetails.injuries) {
      document.getElementById('course-injuries').value = Array.isArray(courseDetails.injuries)
        ? courseDetails.injuries.join(', ')
        : courseDetails.injuries;
    }

    // 2. Очищаємо стандартний рівень перед заповненням
    const standardContainer = document.getElementById('days-container-2');
    if (standardContainer) standardContainer.innerHTML = '';

    // 3. Розбираємо рівні складності
    const levelsArr = courseContent.levels || [];

    levelsArr.forEach(levelData => {
      const difficulty = levelData.difficulty; // 1, 2, або 3

      // Активуємо рівень
      activeLevels[difficulty] = true;
      currentLevel = difficulty;

      const container = document.getElementById('days-container-' + difficulty);
      if (container) container.innerHTML = ''; // Очищаємо перед додаванням

      // Розбираємо дні всередині рівня
      const daysArr = levelData.days || [];

      daysArr.forEach((dayData, dayIndex) => {
        // Програмно додаємо день
        addDayToContainer(container);

        const dayBlocks = container.querySelectorAll('.day-block');
        const currentDayBlock = dayBlocks[dayBlocks.length - 1];

        // Встановлюємо затримку
        if (dayIndex > 0 && dayData.delay_hours_after_previous !== undefined) {
          const delayInput = currentDayBlock.querySelector('.day-delay');
          if (delayInput) {
            delayInput.value = dayData.delay_hours_after_previous / 24;
          }
        }

        // Розбираємо вправи
        const exercisesArr = dayData.exercises || [];
        const exercisesList = currentDayBlock.querySelector('.exercises-list');
        exercisesList.innerHTML = ''; // Видаляємо пусту першу вправу

        exercisesArr.forEach(exData => {
          // Програмно додаємо вправу
          addExerciseToBlock(currentDayBlock);

          const exItems = currentDayBlock.querySelectorAll('.exercise-item');
          const currentExItem = exItems[exItems.length - 1];

          if (currentExItem) {
            currentExItem.querySelector('.ex-name').value = exData.name || '';
            currentExItem.querySelector('.ex-reps').value = exData.reps || '';
            currentExItem.querySelector('.ex-sets').value = exData.sets || '';
            currentExItem.querySelector('.ex-desc').value = exData.description || '';
            currentExItem.querySelector('.ex-rec').value = exData.recommendations || '';
            currentExItem.querySelector('.ex-video').value = exData.video_url || '';
          }
        });

        renumberExercises(currentDayBlock);
      });
    });

    // Перемикаємо вигляд на Стандартний рівень після завантаження
    switchLevel(2);
    renderDifficultySelect();

  } catch (error) {
    console.error("Помилка завантаження курсу для редагування:", error);
    alert("Помилка завантаження даних. Спробуйте оновити сторінку.");
  }
}

// ДОПОМІЖНІ ФУНКЦІЇ ДЛЯ РЕДАГУВАННЯ (Злегка модифіковані версії твоїх addDay та addExercise)
// Вони потрібні, щоб мати змогу додавати елементи в конкретний контейнер, а не тільки в currentLevel
function addDayToContainer(container) {
  const dayBlock = document.createElement('div');
  dayBlock.className = 'day-block';
  dayBlock.innerHTML = `
    <div class="day-header">
      <h4 class="day-title">Заняття X</h4>
      <div class="delay-group">
        <i class="far fa-clock"></i> Відкрити через:
        <input type="number" class="day-delay" min="0" value="1" style="width: 60px;">
        днів
      </div>
      <button class="delete-btn" onclick="deleteDay(this)"><i class="fas fa-trash-alt"></i> Видалити</button>
    </div>
    <div class="exercises-list"></div>
    <button class="add-ex-btn" onclick="addExercise(this)"><i class="fas fa-dumbbell"></i> Додати вправу</button>
  `;
  container.appendChild(dayBlock);
  // Ми навмисно не викликаємо addExercise тут, бо ми самі наповнимо exercises-list
}

function addExerciseToBlock(dayBlock) {
  const list = dayBlock.querySelector('.exercises-list');
  const template = document.getElementById('exercise-template');
  const exItem = template.content.cloneNode(true);

  const deleteBtn = exItem.querySelector('.exercise-delete-btn');
  deleteBtn.addEventListener('click', function(event) {
    const itemToRemove = event.target.closest('.exercise-item');
    const currentDayBlock = itemToRemove.closest('.day-block');
    itemToRemove.remove();
    renumberExercises(currentDayBlock);
  });
  list.appendChild(exItem);
}

// --- 2. УПРАВЛІННЯ ВИПАДАЮЧИМ СПИСКОМ ТА КОНТЕЙНЕРАМИ ---
function renderDifficultySelect() {
  const select = document.getElementById('difficulty-select');
  select.innerHTML = '';

  if (activeLevels[1]) select.add(new Option('Легкий', '1'));
  else select.add(new Option('Додати легкий', 'add_1'));

  select.add(new Option('Стандартний', '2'));

  if (activeLevels[3]) select.add(new Option('Просунутий', '3'));
  else select.add(new Option('Додати просунутий', 'add_3'));

  select.value = currentLevel;

  const deleteBtn = document.getElementById('delete-difficulty-btn');
  deleteBtn.style.display = (currentLevel === 2) ? 'none' : 'block';
}

function handleDifficultyChange(select) {
  const value = select.value;

  if (value.startsWith('add_')) {
    pendingLevelToAdd = parseInt(value.replace('add_', ''));
    const levelName = pendingLevelToAdd === 1 ? 'Легкий' : 'Просунутий';
    document.getElementById('modal-level-name').innerText = levelName;
    document.getElementById('difficulty-modal').style.display = 'flex';
  } else {
    switchLevel(parseInt(value));
    renderDifficultySelect();
  }
}

// Функція для перемикання видимості контейнерів
function switchLevel(newLevel) {
  document.getElementById('days-container-' + currentLevel).style.display = 'none';
  currentLevel = newLevel;
  document.getElementById('days-container-' + currentLevel).style.display = 'block';
  renumberDays();
}

// --- 3. МОДАЛКИ: ДОДАВАННЯ ---
function confirmAddDifficulty() {
  if (pendingLevelToAdd) {
    activeLevels[pendingLevelToAdd] = true;

    // Очищаємо контейнер, щоб він був абсолютно пустим
    const targetContainer = document.getElementById('days-container-' + pendingLevelToAdd);
    targetContainer.innerHTML = '';

    // Перемикаємось на новий рівень
    switchLevel(pendingLevelToAdd);

    // Автоматично додаємо перше пусте заняття для зручності
    addDay();

    pendingLevelToAdd = null;
  }
  document.getElementById('difficulty-modal').style.display = 'none';
  renderDifficultySelect();
}

function cancelAddDifficulty() {
  pendingLevelToAdd = null;
  document.getElementById('difficulty-modal').style.display = 'none';
  renderDifficultySelect(); // Повертаємо селект на поточний рівень
}

// --- 4. МОДАЛКИ: ВИДАЛЕННЯ ---
function deleteCurrentDifficulty() {
  const levelName = currentLevel === 1 ? 'Легкий' : 'Просунутий';
  document.getElementById('delete-modal-level-name').innerText = levelName;
  document.getElementById('delete-modal').style.display = 'flex';
}

function confirmDeleteDifficulty() {
  if (currentLevel !== 2) {
    activeLevels[currentLevel] = false;

    // Очищаємо HTML видаленого рівня
    document.getElementById('days-container-' + currentLevel).innerHTML = '';
    document.getElementById('days-container-' + currentLevel).style.display = 'none';

    // Повертаємось на Стандартний рівень
    currentLevel = 2;
    document.getElementById('days-container-2').style.display = 'block';

    renderDifficultySelect();
  }
  document.getElementById('delete-modal').style.display = 'none';
}

function cancelDeleteDifficulty() {
  document.getElementById('delete-modal').style.display = 'none';
}

// --- 5. ФУНКЦІЇ ДНІВ ТА ВПРАВ ---
function addDay() {
  // Додаємо заняття тільки у ПОТОЧНИЙ активний контейнер
  const container = document.getElementById('days-container-' + currentLevel);
  const dayBlock = document.createElement('div');
  dayBlock.className = 'day-block';

  dayBlock.innerHTML = `
    <div class="day-header">
      <h4 class="day-title">Заняття X</h4>
      <div class="delay-group">
        <i class="far fa-clock"></i> Відкрити через:
        <input type="number" class="day-delay" min="0" value="1" style="width: 60px;">
        днів
      </div>
      <button class="delete-btn" onclick="deleteDay(this)">
        <i class="fas fa-trash-alt"></i> Видалити
      </button>
    </div>
    <div class="exercises-list"></div>
    <button class="add-ex-btn" onclick="addExercise(this)">
      <i class="fas fa-dumbbell"></i> Додати вправу
    </button>
  `;

  container.appendChild(dayBlock);
  addExercise(dayBlock.querySelector('.add-ex-btn'));
  renumberDays();
}

function deleteDay(btn) {
  btn.closest('.day-block').remove();
  renumberDays();
}

function renumberDays() {
  const container = document.getElementById('days-container-' + currentLevel);
  const allDays = container.querySelectorAll('.day-block');

  allDays.forEach((day, index) => {
    day.querySelector('.day-title').innerText = `Заняття ${index + 1}`;
    const delayGroup = day.querySelector('.delay-group');
    if (delayGroup) {
      delayGroup.style.display = (index === 0) ? 'none' : 'flex';
    }
  });
}

function addExercise(btn) {
  const dayBlock = btn.closest('.day-block'); // Отримуємо блок поточного дня
  const list = dayBlock.querySelector('.exercises-list');
  const template = document.getElementById('exercise-template');
  const exItem = template.content.cloneNode(true);

  const deleteBtn = exItem.querySelector('.exercise-delete-btn');
  deleteBtn.addEventListener('click', function(event) {
    const itemToRemove = event.target.closest('.exercise-item');
    const currentDayBlock = itemToRemove.closest('.day-block'); // Зберігаємо посилання на блок дня

    itemToRemove.remove(); // Видаляємо вправу

    renumberExercises(currentDayBlock); // Перераховуємо залишені вправи
  });

  list.appendChild(exItem);

  renumberExercises(dayBlock); // Перераховуємо вправи після додавання нової
}

function renumberExercises(dayBlock) {
  // Знаходимо всі вправи всередині конкретного заняття
  const exercises = dayBlock.querySelectorAll('.exercise-item');

  exercises.forEach((ex, index) => {
    // Шукаємо елемент, де має відображатися номер (наприклад, <span> або <label>)
    const numberElement = ex.querySelector('.exercise-number');
    if (numberElement) {
      numberElement.innerText = index + 1;
    }

    // Опціонально: оновлюємо плейсхолдер назви або інші атрибути
    const nameInput = ex.querySelector('.ex-name');

  });
}

function showCourseMessage(text, className) {
  const messageEl = document.getElementById('course-status-message');
  if (!messageEl) return;

  messageEl.textContent = text;
  messageEl.className = className;

  // Якщо це помилка (не success-text), прибираємо її через 3 секунди
  if (className !== 'success-text') {
    setTimeout(() => {
      messageEl.textContent = "";
      messageEl.className = "";
    }, 3000);
  }
}

// --- ФУНКЦІЇ ДЛЯ ВАЛІДАЦІЇ ПОЛІВ ---

function showFieldError(inputElement, message) {
  let errorDiv = inputElement.nextElementSibling;
  if (!errorDiv || !errorDiv.classList.contains('field-error-text')) {
    errorDiv = document.createElement('div');
    errorDiv.className = 'field-error-text';
    inputElement.after(errorDiv);
  }

  errorDiv.textContent = message;
  inputElement.classList.add('input-error-highlight');

  // Трохи затримки для скролу, якщо довелося перемикати рівні складності
  setTimeout(() => {
    inputElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    inputElement.focus();
  }, 50);
}

function clearFieldError(inputElement) {
  if (inputElement.classList.contains('input-error-highlight')) {
    inputElement.classList.remove('input-error-highlight');
    const errorDiv = inputElement.nextElementSibling;
    if (errorDiv && errorDiv.classList.contains('field-error-text')) {
      errorDiv.remove();
    }
  }
}

// Автоматичне очищення помилки при введенні тексту
document.addEventListener('input', (event) => {
  if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
    clearFieldError(event.target);
  }
});

// --- 6. ЗБЕРЕЖЕННЯ ТА ВІДПРАВКА ---
async function saveCourse() {
  const saveBtn = document.querySelector('.btn-save');
  const originalBtnText = saveBtn.innerText;

  // Отримуємо самі елементи, щоб мати змогу їх підсвітити
  const titleInput = document.getElementById('course-title');
  const injuriesInput = document.getElementById('course-injuries');
  const descInput = document.getElementById('course-desc');

  // 1. ВАЛІДАЦІЯ ОСНОВНИХ ПОЛІВ
  let hasErrors = false;

  if (!titleInput.value.trim()) {
    showFieldError(titleInput, "Введіть назву курсу!");
    hasErrors = true;
  }

  if (!injuriesInput.value.trim()) {
    showFieldError(injuriesInput, "Вкажіть тип хірургічного втручання!");
    hasErrors = true;
  }

  if (hasErrors) return; // Зупиняємо, якщо є помилки в шапці

  const title = titleInput.value.trim();
  const injuries = injuriesInput.value.split(',').map(item => item.trim()).filter(i => i);
  const desc = descInput.value.trim();

  // 2. ЗБІР ДАНИХ ТА ВАЛІДАЦІЯ ВПРАВ
  const difficultiesData = [];
  let standardLevelLength = 0;
  let hasExerciseErrors = false;

  // Проходимось по рівнях [1, 2, 3]
  [1, 2, 3].forEach(level => {
    if (activeLevels[level]) {
      const container = document.getElementById('days-container-' + level);
      const daysData = [];

      container.querySelectorAll('.day-block').forEach((block, index) => {
        const exercisesData = [];

        block.querySelectorAll('.exercise-item').forEach(ex => {
          const exNameInput = ex.querySelector('.ex-name');

          // ВАЛІДАЦІЯ НАЗВИ ВПРАВИ
          if (!exNameInput.value.trim()) {
            // Якщо помилка на прихованому рівні - перемикаємось на нього
            if (currentLevel !== level) {
              document.getElementById('difficulty-select').value = level;
              switchLevel(level);
            }
            showFieldError(exNameInput, "Введіть назву вправи!");
            hasExerciseErrors = true;
          }

          exercisesData.push({
            name: exNameInput.value.trim(),
            reps: ex.querySelector('.ex-reps')?.value || "",
            sets: ex.querySelector('.ex-sets')?.value || "",
            description: ex.querySelector('.ex-desc')?.value || "",
            recommendations: ex.querySelector('.ex-rec')?.value || "",
            video_url: ex.querySelector('.ex-video')?.value || ""
          });
        });

        const delayInput = block.querySelector('.day-delay');
        const delayDays = (index === 0) ? 0 : (parseInt(delayInput.value) || 0);

        daysData.push({
          day_number: index + 1,
          delay_hours_after_previous: delayDays * 24,
          exercises: exercisesData
        });
      });

      if (level === 2) {
        standardLevelLength = daysData.length;
      }

      difficultiesData.push({
        difficulty: level,
        total_days: daysData.length,
        days: daysData
      });
    }
  });

  // Якщо знайшли пусті вправи - зупиняємо збереження
  if (hasExerciseErrors) return;

  if (difficultiesData.length === 0 || standardLevelLength === 0) {
    // ЗАМІСТЬ ALERT:
    showCourseMessage("❌ Додайте хоча б одне заняття у стандартний рівень!", "field-error-text");
    return;
  }

  // СТРОГО за схемою бекенду (цей код у тебе вже є)
  const payload = {
    course_name: title,
    description: desc,
    injuries: injuries,
    course_length: standardLevelLength,
    course_content: {
      levels: difficultiesData
    }
  };

  try {
    saveBtn.innerText = "Збереження...";
    saveBtn.disabled = true;

    const token = localStorage.getItem('access_token');

    // === РОЗДІЛЕННЯ ЛОГІКИ: СТВОРЕННЯ чи РЕДАГУВАННЯ ===
    if (isEditMode) {

      // СТАН 2: ОНОВЛЕННЯ (Реальний запит на бекенд)
      const response = await fetch(`${API_BASE_URL}/courses/${editingCourseId}/update`, {
        method: 'PUT', // Використовуємо PUT, як вказали в роутері
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        showCourseMessage(`✅ Курс успішно оновлено!`, "success-text");

        // ОЧИЩАЄМО ТИМЧАСОВІ ДАНІ (щоб наступного разу відкрився чистий конструктор)
        sessionStorage.removeItem('course_edit_data');
        sessionStorage.removeItem('course_edit_id');

        // Повертаємо лікаря на головну сторінку через 1.5 сек
        setTimeout(() => { window.location.href = "home_page.html"; }, 1500);
      } else {
        const errorData = await response.json();
        showCourseMessage(`❌ Помилка оновлення: ${errorData.detail || 'Невідома помилка'}`, "field-error-text");
      }

    } else {

      // СТАН 1: СТВОРЕННЯ (Твій старий код)
      const response = await fetch(`${API_BASE_URL}/courses/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        showCourseMessage(`✅ Курс успішно створено! Збережено рівнів: ${difficultiesData.length}`, "success-text");
        setTimeout(() => { window.location.href = "home_page.html"; }, 1500);
      } else {
        const errorData = await response.json();
        showCourseMessage(`❌ Помилка збереження: ${JSON.stringify(errorData)}`, "field-error-text");
      }
    }

  } catch (error) {
    showCourseMessage("❌ Помилка мережі. Перевірте з'єднання.", "field-error-text");
  } finally {
    // Відновлюємо кнопку
    setTimeout(() => {
      saveBtn.innerHTML = isEditMode ? '<i class="fas fa-save"></i> Оновити курс' : '<i class="fas fa-save"></i> Створити курс';
      saveBtn.disabled = false;
    }, 500);
  }
}
