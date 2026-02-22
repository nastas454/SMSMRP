// Функція 1: Додати день
function addDay() {
  const container = document.getElementById('days-container');

  const dayBlock = document.createElement('div');
  dayBlock.className = 'day-block';

  dayBlock.innerHTML = `
    <div class="day-header">
      <h4 class="day-title">День X</h4>
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
    day.querySelector('.day-title').innerText = `День ${index + 1}`;
  });
  // Більше не шукаємо document.getElementById('course-duration')
}

function addExercise(btn) {
  // 1. Знаходимо контейнер для списку вправ у поточному дні
  const list = btn.closest('.day-block').querySelector('.exercises-list');

  // 2. Отримуємо шаблон та клонуємо його вміст
  const template = document.getElementById('exercise-template');
  const exItem = template.content.cloneNode(true);

  // 3. Знаходимо кнопку видалення в клонованому елементі і додаємо обробник події
  const deleteBtn = exItem.querySelector('.exercise-delete-btn');
  deleteBtn.addEventListener('click', function(event) {
    // Видаляємо найближчий батьківський елемент з класом .exercise-item
    event.target.closest('.exercise-item').remove();
  });

  // 4. Додаємо готову вправу в список
  list.appendChild(exItem);
}

// Функція 5: ЗБЕРЕЖЕННЯ
// Функція 5: ЗБЕРЕЖЕННЯ ТА ВІДПРАВКА НА БЕКЕНД
async function saveCourse() {
  const saveBtn = document.querySelector('button[onclick="saveCourse()"]');
  const originalBtnText = saveBtn.innerText;

  // 1. Збір базових даних
  const title = document.getElementById('course-title').value;
  const injuriesInput = document.getElementById('course-injuries').value;
  const injuries = injuriesInput ? injuriesInput.split(',').map(item => item.trim()) : [];
  const desc = document.getElementById('course-desc').value;

  // 2. Збір даних про дні та вправи
  const daysData = [];

  const dayBlocks = document.querySelectorAll('.day-block'); // Отримуємо всі блоки днів

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

    daysData.push({
      day_number: index + 1,
      exercises: exercisesData
    });
  });

  // 3. Валідація (використовуємо реальну кількість блоків)
  if (!title) { alert("❌ Введіть назву курсу!"); return; }
  if (daysData.length === 0) { alert("❌ Додайте хоча б один день!"); return; }

  // 4. Формування об'єкту
  const payload = {
    course_name: title,
    injuries: injuries,
    description: desc,
    course_content: {
      total_days: daysData.length, // <-- Автоматично підставляємо кількість днів
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
      return;
    }

    const response = await fetch('http://localhost:8000/doctor/courses/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      const result = await response.json();
      console.log("Server response:", result);
      alert(`✅ Курс "${result.course_name}" успішно створено!`);
    } else {
      const errorData = await response.json();
      console.error("Error details:", errorData);
      alert(`❌ Помилка збереження: ${JSON.stringify(errorData.detail)}`);
    }

  } catch (error) {
    console.error("Network error:", error);
    alert("❌ Помилка мережі. Перевірте консоль.");
  } finally {
    saveBtn.innerText = originalBtnText;
    saveBtn.disabled = false;
  }
}
