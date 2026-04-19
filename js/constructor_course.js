document.addEventListener('DOMContentLoaded', () => {
  // Додаємо перше заняття автоматично при завантаженні сторінки
  addDay();
});

// Функція 1: Додати заняття
function addDay() {
  const container = document.getElementById('days-container');
  const dayBlock = document.createElement('div');
  dayBlock.className = 'day-block';

  // HTML структура для дня з полем затримки
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
  // Додаємо першу порожню вправу автоматично
  addExercise(dayBlock.querySelector('.add-ex-btn'));
  renumberDays();
}

// Функція 2: Видалити заняття
function deleteDay(btn) {
  btn.closest('.day-block').remove();
  renumberDays();
}

// Функція 3: Перерахунок днів та управління відображенням затримки
function renumberDays() {
  const allDays = document.querySelectorAll('.day-block');
  allDays.forEach((day, index) => {
    day.querySelector('.day-title').innerText = `Заняття ${index + 1}`;

    // Якщо це заняття 1, приховуємо поле затримки, бо він доступний одразу
    const delayGroup = day.querySelector('.delay-group');
    if (delayGroup) {
      delayGroup.style.display = (index === 0) ? 'none' : 'flex';
    }
  });
}

// Функція 4: Додавання нової вправи
function addExercise(btn) {
  const list = btn.closest('.day-block').querySelector('.exercises-list');
  const template = document.getElementById('exercise-template');
  const exItem = template.content.cloneNode(true);

  // Обробник для кнопки видалення вправи
  const deleteBtn = exItem.querySelector('.exercise-delete-btn');
  deleteBtn.addEventListener('click', function(event) {
    event.target.closest('.exercise-item').remove();
  });

  list.appendChild(exItem);
}

// Функція 5: ЗБЕРЕЖЕННЯ ТА ВІДПРАВКА НА БЕКЕНД
async function saveCourse() {
  const saveBtn = document.querySelector('.btn-save');
  const originalBtnText = saveBtn.innerText;

  // 1. Збір базових даних
  const title = document.getElementById('course-title').value;
  const injuriesInput = document.getElementById('course-injuries').value;
  const injuries = injuriesInput ? injuriesInput.split(',').map(item => item.trim()) : [];
  const desc = document.getElementById('course-desc').value;

  // 2. Збір даних про дні та вправи
  const daysData = [];
  const dayBlocks = document.querySelectorAll('.day-block');

  // Ми більше не рахуємо паузи для загальної тривалості
  dayBlocks.forEach((block, index) => {
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

    // Отримуємо значення в днях ТІЛЬКИ для того, щоб передати в JSON
    const delayInput = block.querySelector('.day-delay');
    const delayDays = (index === 0) ? 0 : (parseInt(delayInput.value) || 0);
    const delayHours = delayDays * 24;

    daysData.push({
      day_number: index + 1,
      delay_hours_after_previous: delayHours, // Затримка летить у JSON для плеєра
      exercises: exercisesData
    });
  });

  // 3. Валідація
  if (!title) { alert("❌ Введіть назву курсу!"); return; }
  if (daysData.length === 0) { alert("❌ Додайте хоча б одне заняття!"); return; }

  // 4. Формування об'єкту
  const payload = {
    course_name: title,
    injuries: injuries,
    description: desc,
    // ЗМІНЕНО: Тепер обсяг курсу - це просто кількість створених блоків
    course_length: daysData.length,
    course_content: {
      total_days: daysData.length,
      days: daysData
    }
  };

  // 5. Відправка на сервер
  try {
    saveBtn.innerText = "Збереження...";
    saveBtn.disabled = true;

    const token = localStorage.getItem('access_token');

    if (!token) {
      alert("⚠️ Ви не авторизовані. Будь ласка, увійдіть в систему.");
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
      // Оновлено текст повідомлення
      alert(`✅ Курс успішно створено!\nЗагальна кількість занять: ${daysData.length}.`);
      window.location.href = "home_page.html";
    } else {
      const errorData = await response.json();
      console.error("Error details:", errorData);
      alert(`❌ Помилка збереження: ${JSON.stringify(errorData.detail || errorData.message)}`);
    }

  } catch (error) {
    console.error("Network error:", error);
    alert("❌ Помилка мережі. Перевірте з'єднання з бекендом.");
  } finally {
    saveBtn.innerText = originalBtnText;
    saveBtn.disabled = false;
  }
}
