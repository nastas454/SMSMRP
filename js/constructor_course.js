const API_BASE_URL = "http://localhost:8000";

let activeLevels = {
  1: false,
  2: true,
  3: false
};
let currentLevel = 2;
let pendingLevelToAdd = null;

let isEditMode = false;
let editingCourseId = null;

document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  editingCourseId = urlParams.get('edit_id');
  if (editingCourseId) {
    isEditMode = true;
    const headerTitle = document.querySelector('h1') || document.querySelector('.page-title');
    if (headerTitle) headerTitle.textContent = "Редагування курсу";
    const saveBtn = document.querySelector('.btn-save');
    if (saveBtn) saveBtn.innerHTML = '<i class="fas fa-save"></i> Оновити курс';
    loadCourseForEditing();
  } else {
    addDay();
    renderDifficultySelect();
  }
});

// Завантажує дані курсу з бекенду та розставляє їх по відповідних полях на сторінці для редагування
async function loadCourseForEditing() {
  if (!editingCourseId) return;
  try {
    const token = localStorage.getItem('access_token');
    const detailsResponse = await fetch(`${API_BASE_URL}/courses/${editingCourseId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!detailsResponse.ok) throw new Error("Не вдалося завантажити деталі курсу");
    const courseDetails = await detailsResponse.json();
    const contentResponse = await fetch(`${API_BASE_URL}/courses/${editingCourseId}/content`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!contentResponse.ok) throw new Error("Не вдалося завантажити контент курсу");
    const courseContent = await contentResponse.json();

    if (courseDetails.course_name) document.getElementById('course-title').value = courseDetails.course_name;
    if (courseDetails.description) document.getElementById('course-desc').value = courseDetails.description;
    if (courseDetails.injuries) {
      document.getElementById('course-injuries').value = Array.isArray(courseDetails.injuries)
        ? courseDetails.injuries.join(', ')
        : courseDetails.injuries;
    }

    const standardContainer = document.getElementById('days-container-2');
    if (standardContainer) standardContainer.innerHTML = '';
    const levelsArr = courseContent.levels || [];
    levelsArr.forEach(levelData => {
      const difficulty = levelData.difficulty;
      activeLevels[difficulty] = true;
      currentLevel = difficulty;
      const container = document.getElementById('days-container-' + difficulty);
      if (container) container.innerHTML = '';
      const daysArr = levelData.days || [];

      daysArr.forEach((dayData, dayIndex) => {
        addDayToContainer(container);

        const dayBlocks = container.querySelectorAll('.day-block');
        const currentDayBlock = dayBlocks[dayBlocks.length - 1];

        if (dayIndex > 0 && dayData.delay_hours_after_previous !== undefined) {
          const delayInput = currentDayBlock.querySelector('.day-delay');
          if (delayInput) {
            delayInput.value = dayData.delay_hours_after_previous / 24;
          }
        }

        const exercisesArr = dayData.exercises || [];
        const exercisesList = currentDayBlock.querySelector('.exercises-list');
        exercisesList.innerHTML = '';

        exercisesArr.forEach(exData => {
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
    switchLevel(2);
    renderDifficultySelect();
  } catch (error) {
    console.error("Помилка завантаження курсу для редагування:", error);
    alert("Помилка завантаження даних. Спробуйте оновити сторінку.");
  }
}

// Допоміжна функція для додавання блоку нового заняття у вказаний контейнер
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
}

// Допоміжна функція для додавання блоку нової вправи у вказаний день
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

// Оновлює випадаючий список рівнів складності, показуючи лише доступні рівні та опції їх додавання
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

// Обробляє зміну обраного рівня у випадаючому списку
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

// Перемикає видимість контейнерів із заняттями залежно від обраного рівня складності та блокує/розблоковує загальні поля курсу
function switchLevel(newLevel) {
  document.getElementById('days-container-' + currentLevel).style.display = 'none';
  currentLevel = newLevel;
  document.getElementById('days-container-' + currentLevel).style.display = 'block';
  renumberDays();

  const titleInput = document.getElementById('course-title');
  const injuriesInput = document.getElementById('course-injuries');
  const descInput = document.getElementById('course-desc');

  if (currentLevel === 2) {
    titleInput.disabled = false;
    injuriesInput.disabled = false;
    descInput.disabled = false;
  } else {
    titleInput.disabled = true;
    injuriesInput.disabled = true;
    descInput.disabled = true;
  }
}

// Підтверджує додавання нового рівня складності, перемикає на нього інтерфейс та створює перше порожнє заняття
function confirmAddDifficulty() {
  if (pendingLevelToAdd) {
    activeLevels[pendingLevelToAdd] = true;
    const targetContainer = document.getElementById('days-container-' + pendingLevelToAdd);
    targetContainer.innerHTML = '';
    switchLevel(pendingLevelToAdd);
    addDay();
    pendingLevelToAdd = null;
  }
  document.getElementById('difficulty-modal').style.display = 'none';
  renderDifficultySelect();
}

// Скасовує додавання нового рівня складності та закриває відповідне модальне вікно
function cancelAddDifficulty() {
  pendingLevelToAdd = null;
  document.getElementById('difficulty-modal').style.display = 'none';
  renderDifficultySelect(); // Повертаємо селект на поточний рівень
}

// Відкриває модальне вікно підтвердження видалення поточного рівня складності
function deleteCurrentDifficulty() {
  const levelName = currentLevel === 1 ? 'Легкий' : 'Просунутий';
  document.getElementById('delete-modal-level-name').innerText = levelName;
  document.getElementById('delete-modal').style.display = 'flex';
}

// Підтверджує видалення поточного рівня складності, очищає його дані та повертає інтерфейс до Стандартного рівня
function confirmDeleteDifficulty() {
  if (currentLevel !== 2) {
    activeLevels[currentLevel] = false;
    document.getElementById('days-container-' + currentLevel).innerHTML = '';
    document.getElementById('days-container-' + currentLevel).style.display = 'none';
    currentLevel = 2;
    document.getElementById('days-container-2').style.display = 'block';
    renderDifficultySelect();
  }
  document.getElementById('delete-modal').style.display = 'none';
}

// Скасовує видалення рівня складності та закриває модальне вікно
function cancelDeleteDifficulty() {
  document.getElementById('delete-modal').style.display = 'none';
}

// Додає нове порожнє заняття в поточний активний рівень складності та одразу створює в ньому першу вправу
function addDay() {
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

// Видаляє вказане заняття з поточного рівня складності та перераховує номери решти занять
function deleteDay(btn) {
  btn.closest('.day-block').remove();
  renumberDays();
}

// Перераховує номери всіх занять у поточному рівні складності для правильного їх відображення
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

// Додає нову порожню вправу у вказане заняття та прив'язує до неї кнопку видалення
function addExercise(btn) {
  const dayBlock = btn.closest('.day-block');
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
  renumberExercises(dayBlock);
}

// Перераховує номери всіх вправ всередині конкретного заняття після додавання або видалення
function renumberExercises(dayBlock) {
  const exercises = dayBlock.querySelectorAll('.exercise-item');
  exercises.forEach((ex, index) => {
    const numberElement = ex.querySelector('.exercise-number');
    if (numberElement) {
      numberElement.innerText = index + 1;
    }
    const nameInput = ex.querySelector('.ex-name');
  });
}

// Відображає тимчасове повідомлення (успіх або помилка) щодо статусу збереження/оновлення курсу
function showCourseMessage(text, className) {
  const messageEl = document.getElementById('course-status-message');
  if (!messageEl) return;
  messageEl.textContent = text;
  messageEl.className = className;
  if (className !== 'success-text') {
    setTimeout(() => {
      messageEl.textContent = "";
      messageEl.className = "";
    }, 3000);
  }
}

// Показує повідомлення про помилку під конкретним полем вводу та підсвічує його червоним
function showFieldError(inputElement, message) {
  let errorDiv = inputElement.nextElementSibling;
  if (!errorDiv || !errorDiv.classList.contains('field-error-text')) {
    errorDiv = document.createElement('div');
    errorDiv.className = 'field-error-text';
    inputElement.after(errorDiv);
  }
  errorDiv.textContent = message;
  inputElement.classList.add('input-error-highlight');
  setTimeout(() => {
    inputElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    inputElement.focus();
  }, 50);
}

// Прибирає підсвічування помилки та повідомлення під полем вводу
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

// Збирає всі дані з форм, проводить їх валідацію та відправляє запит на бекенд для створення нового або оновлення існуючого курсу
async function saveCourse() {
  const saveBtn = document.querySelector('.btn-save');
  const originalBtnText = saveBtn.innerText;
  const titleInput = document.getElementById('course-title');
  const injuriesInput = document.getElementById('course-injuries');
  const descInput = document.getElementById('course-desc');
  let hasErrors = false;

  if (!titleInput.value.trim()) {
    showFieldError(titleInput, "Введіть назву курсу!");
    hasErrors = true;
  }
  if (!injuriesInput.value.trim()) {
    showFieldError(injuriesInput, "Вкажіть тип хірургічного втручання!");
    hasErrors = true;
  }
  if (hasErrors) return;

  const title = titleInput.value.trim();
  const injuries = injuriesInput.value.split(',').map(item => item.trim()).filter(i => i);
  const desc = descInput.value.trim();
  const difficultiesData = [];
  let standardLevelLength = 0;
  let hasExerciseErrors = false;

  [1, 2, 3].forEach(level => {
    if (activeLevels[level]) {
      const container = document.getElementById('days-container-' + level);
      const daysData = [];
      container.querySelectorAll('.day-block').forEach((block, index) => {
        const exercisesData = [];
        block.querySelectorAll('.exercise-item').forEach(ex => {
          const exNameInput = ex.querySelector('.ex-name');
          const exRepsInput = ex.querySelector('.ex-reps');
          const exSetsInput = ex.querySelector('.ex-sets');
          const exNameVal = exNameInput.value.trim();
          const repsVal = exRepsInput ? exRepsInput.value.trim() : "";
          const setsVal = exSetsInput ? exSetsInput.value.trim() : "";

          if (exNameVal.length < 2) {
            if (currentLevel !== level) {
              document.getElementById('difficulty-select').value = level;
              switchLevel(level);
            }
            showFieldError(exNameInput, "Назва має містити мінімум 2 символи!");
            hasExerciseErrors = true;
          }

          if (!/^\d+$/.test(repsVal) || parseInt(repsVal, 10) < 1) {
            if (currentLevel !== level) {
              document.getElementById('difficulty-select').value = level;
              switchLevel(level);
            }
            showFieldError(exRepsInput, "Обов'язково (лише цифри від 1)!");
            hasExerciseErrors = true;
          }

          if (!/^\d+$/.test(setsVal) || parseInt(setsVal, 10) < 1) {
            if (currentLevel !== level) {
              document.getElementById('difficulty-select').value = level;
              switchLevel(level);
            }
            showFieldError(exSetsInput, "Обов'язково (лише цифри від 1)!");
            hasExerciseErrors = true;
          }

          exercisesData.push({
            name: exNameVal,
            reps: repsVal,
            sets: setsVal,
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
  if (hasExerciseErrors) return;
  if (difficultiesData.length === 0 || standardLevelLength === 0) {
    showCourseMessage("❌ Додайте хоча б одне заняття у стандартний рівень!", "field-error-text");
    return;
  }
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

    if (isEditMode) {
      const response = await fetch(`${API_BASE_URL}/courses/${editingCourseId}/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        showCourseMessage(`✅ Курс успішно оновлено!`, "success-text");
        sessionStorage.removeItem('course_edit_data');
        sessionStorage.removeItem('course_edit_id');
        setTimeout(() => { window.location.href = "home_page.html"; }, 1500);
      } else {
        const errorData = await response.json();
        showCourseMessage(`❌ Помилка оновлення: ${errorData.detail || 'Невідома помилка'}`, "field-error-text");
      }
    } else {
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
    setTimeout(() => {
      saveBtn.innerHTML = isEditMode ? '<i class="fas fa-save"></i> Оновити курс' : '<i class="fas fa-save"></i> Створити курс';
      saveBtn.disabled = false;
    }, 500);
  }
}
