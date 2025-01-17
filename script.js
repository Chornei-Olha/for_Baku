let catalogData = []; // Это будет массив данных каталога

// Функция для загрузки данных из JSON файла
async function loadCatalogData() {
  try {
    const response = await fetch("assets/catalogData.json"); // Путь к вашему JSON файлу
    if (!response.ok) {
      throw new Error("Не удалось загрузить файл");
    }
    const data = await response.json(); // Преобразование данных в формат JavaScript
    catalogData = data; // Сохраняем данные в переменную
    renderCatalog(data); // Вызов функции для отображения каталога
    createFilterButtons(); // Создаем кнопки фильтрации после загрузки данных
  } catch (error) {
    console.error("Ошибка загрузки данных:", error);
  }
}

// Функция для отображения каталога
function renderCatalog(items) {
  const catalog = document.getElementById("catalog");
  catalog.innerHTML = ""; // Очищаем каталог перед рендером
  items.forEach((item) => {
    const div = document.createElement("div");
    div.className = "catalog-item";
    div.innerHTML = `
      <img src="${item.images[0]}" alt="${item.name}">
      <button onclick="openModal(${item.id})">Ətraflı</button>
    `;
    catalog.appendChild(div);
  });
}

// Открытие модального окна с фото
let currentImageIndex = 0;

function openModal(id) {
  const item = catalogData.find((i) => i.id === id);
  const gallery = document.getElementById("gallery");
  const mainImage = document.getElementById("mainImage");
  const description = document.getElementById("description");

  currentImageIndex = 0; // Сбрасываем индекс при открытии модального окна
  mainImage.src = item.images[currentImageIndex];
  mainImage.onclick = () => openFullscreen(mainImage);
  description.textContent = item.description;

  gallery.innerHTML = "";
  item.images.forEach((src, index) => {
    const img = document.createElement("img");
    img.src = src;
    img.onclick = () => {
      currentImageIndex = index;
      mainImage.src = src;
      mainImage.onclick = () => openFullscreen(mainImage);
    };
    gallery.appendChild(img);
  });

  // Добавляем обработчики для стрелок
  const prevArrow = document.getElementById("prevArrow");
  const nextArrow = document.getElementById("nextArrow");

  prevArrow.onclick = () => {
    currentImageIndex =
      (currentImageIndex - 1 + item.images.length) % item.images.length;
    mainImage.src = item.images[currentImageIndex];
    mainImage.onclick = () => openFullscreen(mainImage);
  };

  nextArrow.onclick = () => {
    currentImageIndex = (currentImageIndex + 1) % item.images.length;
    mainImage.src = item.images[currentImageIndex];
    mainImage.onclick = () => openFullscreen(mainImage);
  };

  document.getElementById("modal").style.display = "flex";
}

// Функция для открытия изображения на весь экран
function openFullscreen(image) {
  if (image.requestFullscreen) {
    image.requestFullscreen();
  } else if (image.webkitRequestFullscreen) {
    // Для Safari
    image.webkitRequestFullscreen();
  } else if (image.msRequestFullscreen) {
    // Для IE/Edge
    image.msRequestFullscreen();
  }
}

// Закрытие модального окна
function closeModal() {
  document.getElementById("modal").style.display = "none";
}

// Функция для фильтрации каталога
function filterCatalog(type) {
  if (type === "all") {
    renderCatalog(catalogData); // Показываем все элементы
  } else {
    const filtered = catalogData.filter((item) => item.type === type);
    renderCatalog(filtered);
  }
}

// Создание кнопок фильтрации
function createFilterButtons() {
  const filterContainer = document.getElementById("filter-buttons");
  filterContainer.innerHTML = ""; // Очищаем контейнер перед добавлением кнопок

  // Кнопка "Показать все"
  const showAllButton = document.createElement("button");
  showAllButton.textContent = "Показать все";
  showAllButton.className = "sort-button";
  showAllButton.onclick = () => filterCatalog("all");
  filterContainer.appendChild(showAllButton);

  // Пример других кнопок (замените массив types реальными типами из JSON)
  const types = [...new Set(catalogData.map((item) => item.type))]; // Уникальные типы
  types.forEach((type) => {
    const button = document.createElement("button");
    button.textContent = type;
    button.className = "sort-button";
    button.onclick = () => filterCatalog(type);
    filterContainer.appendChild(button);
  });
}

// Инициализация каталога
loadCatalogData(); // Загружаем данные из JSON при старте страницы
