// --- 1. СТАН РІВНІВ СКЛАДНОСТІ ---
let activeLevels = {
  1: false,
  2: true, // Стандартний завжди існує
  3: false
};
let currentLevel = 2;
let pendingLevelToAdd = null;

document.addEventListener('DOMContentLoaded', () => {
  // Додаємо перше заняття для стандартного рівня
  addDay();
  renderDifficultySelect();
});

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



// --- 6. ЗБЕРЕЖЕННЯ ТА ВІДПРАВКА ---
async function saveCourse() {
  const saveBtn = document.querySelector('.btn-save');
  const originalBtnText = saveBtn.innerText;

  const title = document.getElementById('course-title').value;
  const injuriesInput = document.getElementById('course-injuries').value;
  const injuries = injuriesInput ? injuriesInput.split(',').map(item => item.trim()) : [];
  const desc = document.getElementById('course-desc').value;

  if (!title) { alert("❌ Введіть назву курсу!"); return; }

  // Збираємо дані з УСІХ активних рівнів складності
  const difficultiesData = [];
  let standardLevelLength = 0; // Змінна для базової довжини курсу

  // Проходимось по рівнях [1, 2, 3]
  [1, 2, 3].forEach(level => {
    if (activeLevels[level]) {
      const container = document.getElementById('days-container-' + level);
      const daysData = [];

      container.querySelectorAll('.day-block').forEach((block, index) => {
        const exercisesData = [];
        block.querySelectorAll('.exercise-item').forEach(ex => {
          exercisesData.push({
            name: ex.querySelector('.ex-name')?.value || "",
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

      // Запам'ятовуємо довжину стандартного курсу для головного поля
      if (level === 2) {
        standardLevelLength = daysData.length;
      }

      // Додаємо рівень у масив
      difficultiesData.push({
        difficulty: level,
        total_days: daysData.length,
        days: daysData
      });
    }
  });

  if (difficultiesData.length === 0 || standardLevelLength === 0) {
    alert("❌ Додайте хоча б одне заняття у стандартний рівень!");
    return;
  }

  // СТРОГО за схемою бекенду
  const payload = {
    course_name: title,
    description: desc,
    injuries: injuries,
    course_length: standardLevelLength, // Бекенд очікує int
    course_content: {                   // Бекенд очікує dict
      levels: difficultiesData          // Всі наші рівні тепер живуть тут
    }
  };

  try {
    saveBtn.innerText = "Збереження...";
    saveBtn.disabled = true;

    const token = localStorage.getItem('access_token');
    if (!token) {
      alert("⚠️ Ви не авторизовані.");
      window.location.href = "login.html";
      return;
    }

    const response = await fetch('http://localhost:8000/courses/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      alert(`✅ Курс успішно створено! Збережено рівнів: ${difficultiesData.length}`);
      window.location.href = "home_page.html";
    } else {
      const errorData = await response.json();
      alert(`❌ Помилка збереження: ${JSON.stringify(errorData)}`);
    }

  } catch (error) {
    alert("❌ Помилка мережі. Перевірте з'єднання.");
  } finally {
    saveBtn.innerText = originalBtnText;
    saveBtn.disabled = false;
  }
}
