// Функція 1: Додати день
function addDay() {
  const container = document.getElementById('days-container');

  const dayBlock = document.createElement('div');
  dayBlock.className = 'day-block';

  dayBlock.innerHTML = `
    <div class="day-header">
      <h4 class="day-title">📅 День X</h4>
      <button class="delete-btn" onclick="deleteDay(this)">
        <i class="fas fa-trash-alt"></i> Видалити день
      </button>
    </div>

    <div class="exercises-list"></div>

    <button class="add-ex-btn" onclick="addExercise(this)">
      <i class="fas fa-dumbbell"></i> Додати вправу
    </button>
  `;

  container.appendChild(dayBlock);
  addExercise(dayBlock.querySelector('.add-ex-btn')); // Авто-додавання першої вправи
  renumberDays();
}

// Функція 2: Видалити день
function deleteDay(btn) {
  btn.closest('.day-block').remove();
  renumberDays();
}

// Функція 3: Перерахунок днів
function renumberDays() {
  const allDays = document.querySelectorAll('.day-block');
  allDays.forEach((day, index) => {
    day.querySelector('.day-title').innerText = `📅 День ${index + 1}`;
  });
  document.getElementById('course-duration').value = allDays.length;
}

// Функція 4: Додати вправу (ТЕПЕР З ПОВТОРАМИ І ПІДХОДАМИ)
function addExercise(btn) {
  const list = btn.closest('.day-block').querySelector('.exercises-list');
  const exItem = document.createElement('div');
  exItem.className = 'exercise-item';

  exItem.innerHTML = `
    <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
      <span style="font-size:12px; font-weight:700; color:#60a7bd;">ВПРАВА</span>
      <button class="delete-btn" onclick="this.closest('.exercise-item').remove()" style="font-size:12px;">✕ Видалити</button>
    </div>

    <div class="form-group">
      <label>Назва вправи</label>
      <input type="text" class="ex-name" placeholder="Напр: Згинання коліна">
    </div>

    <div class="form-row">
      <div class="form-group">
        <label>Повтори</label>
        <input type="text" class="ex-reps" placeholder="Напр: 10-15">
      </div>
      <div class="form-group">
        <label>Підходи</label>
        <input type="text" class="ex-sets" placeholder="Напр: 3">
      </div>
    </div>

    <div class="form-group">
      <label>Опис виконання</label>
      <textarea class="ex-desc" rows="2" placeholder="Як правильно робити вправу..."></textarea>
    </div>

    <div class="form-group">
      <label>Рекомендації</label>
      <textarea class="ex-rec" rows="2" placeholder="На що звернути увагу..."></textarea>
    </div>

    <div class="form-group">
      <label>Посилання на відео</label>
      <input type="text" class="ex-video" placeholder="https://youtube.com/...">
    </div>
  `;

  list.appendChild(exItem);
}

// Функція 5: ЗБЕРЕЖЕННЯ
function saveCourse() {
  const title = document.getElementById('course-title').value;
  const injuries = document.getElementById('course-injuries').value;
  const desc = document.getElementById('course-desc').value;
  const duration = document.getElementById('course-duration').value;

  if (!title) { alert("❌ Введіть назву курсу!"); return; }
  if (duration == 0) { alert("❌ Додайте хоча б один день!"); return; }

  const daysData = [];
  document.querySelectorAll('.day-block').forEach((block, index) => {
    const exercisesData = [];

    block.querySelectorAll('.exercise-item').forEach(ex => {
      exercisesData.push({
        name: ex.querySelector('.ex-name').value,
        reps: ex.querySelector('.ex-reps').value,   // Зберігаємо повтори
        sets: ex.querySelector('.ex-sets').value,   // Зберігаємо підходи
        description: ex.querySelector('.ex-desc').value,
        recommendations: ex.querySelector('.ex-rec').value,
        video_url: ex.querySelector('.ex-video').value
      });
    });

    daysData.push({
      day_number: index + 1,
      exercises: exercisesData
    });
  });

  const courseJSON = {
    title: title,
    target_injuries: injuries,
    description: desc,
    total_days: parseInt(duration),
    program: daysData
  };

  console.log(courseJSON);
  alert("✅ Курс готовий! (JSON у консолі)");
}
