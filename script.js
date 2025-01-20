let catalogData = []; // Данные каталога

// Загрузка данных
async function loadCatalogData() {
  try {
    const response = await fetch("assets/catalogData.json");
    if (!response.ok) {
      throw new Error("Не удалось загрузить файл");
    }
    const data = await response.json();
    catalogData = data;
    renderCatalog(data);
  } catch (error) {
    console.error("Ошибка загрузки данных:", error);
  }
}

// Рендер каталога
function renderCatalog(items) {
  const catalog = document.getElementById("catalog");
  catalog.innerHTML = "";
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

// Управление модалкой
let currentImageIndex = 0;
let currentItemImages = []; // Хранение изображений текущего элемента

let isFullscreen = false;
let touchStartX = 0;
let touchEndX = 0;
let initialDistance = 0;
let currentScale = 1;
let isPinch = false;
let isDragging = false;
let dragStartX = 0;
let dragStartY = 0;
let dragOffsetX = 0;
let dragOffsetY = 0;

// Открытие модалки
function openModal(id) {
  const item = catalogData.find((i) => i.id === id); // Находим текущий элемент
  const modal = document.getElementById("modal");
  const mainImage = document.getElementById("mainImage");
  const description = document.getElementById("description");
  const gallery = document.getElementById("gallery");
  const imageContainer = document.querySelector(".modal-main-image-container");

  document.body.style.overflow = "hidden"; // Отключение прокрутки

  currentImageIndex = 0; // Начальный индекс изображения
  currentItemImages = item.images; // Сохраняем изображения текущего элемента

  mainImage.src = item.images[currentImageIndex];
  description.textContent = item.description;
  gallery.innerHTML = "";

  // Заполняем галерею
  item.images.forEach((src, index) => {
    const img = document.createElement("img");
    img.src = src;
    img.onclick = () => {
      currentImageIndex = index;
      mainImage.src = src;
      resetImageScale(); // Сбросить масштаб при переключении
    };
    gallery.appendChild(img);
  });

  modal.style.display = "flex";

  // Настроим действия для стрелок
  document.getElementById("prevArrow").onclick = () =>
    changeImage(-1, item.images);
  document.getElementById("nextArrow").onclick = () =>
    changeImage(1, item.images);

  // Настроим жесты для свайпов и двойного нажатия
  setupImageGestures(mainImage, item.images);

  // Добавляем поддержку полноэкранного режима
  mainImage.addEventListener("dblclick", toggleFullscreen);
  document.addEventListener("keydown", handleKeyboard); // Обработчик клавиш

  // Добавляем обработчик для пинча
  setupPinchToZoom(mainImage, imageContainer);

  // Добавляем обработчик для перемещения изображения
  setupDragToMove(mainImage, imageContainer);

  // Добавляем поддержку масштабирования изображения колесиком мыши (для десктопа)
  if (window.innerWidth > 768) {
    // Только для десктопа
    setupMouseWheelZoom(mainImage);
  }
}

// Закрытие модалки
function closeModal() {
  const modal = document.getElementById("modal");
  modal.style.display = "none";
  document.body.style.overflow = "";
  exitFullscreen(); // Выйти из полноэкранного режима
  document.removeEventListener("keydown", handleKeyboard); // Убираем обработчик клавиш
  resetImageScale(); // Сбросить масштаб изображения
}
// Добавьте обработчик событий на кнопку закрытия модалки
document.getElementById("closeModal").addEventListener("click", closeModal);

// Изменение изображения
function changeImage(direction, images) {
  currentImageIndex =
    (currentImageIndex + direction + images.length) % images.length;
  document.getElementById("mainImage").src = images[currentImageIndex];
  resetImageScale(); // Сбросить масштаб изображения при смене
}

// Полноэкранный режим
function toggleFullscreen() {
  const mainImage = document.getElementById("mainImage");
  if (!isFullscreen) {
    if (mainImage.requestFullscreen) mainImage.requestFullscreen();
    else if (mainImage.webkitRequestFullscreen)
      mainImage.webkitRequestFullscreen();
    else if (mainImage.msRequestFullscreen) mainImage.msRequestFullscreen();
    isFullscreen = true;
  } else {
    exitFullscreen();
    isFullscreen = false;
  }
}

function exitFullscreen() {
  if (document.exitFullscreen) document.exitFullscreen();
  else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
  else if (document.msExitFullscreen) document.msExitFullscreen();
}

// Обработка свайпов (только для переключения изображений)
function setupImageGestures(mainImage, images) {
  mainImage.addEventListener("touchstart", (e) => {
    touchStartX = e.touches[0].clientX;
    if (e.touches.length === 2) {
      isPinch = true; // Начинаем пинч
      initialDistance = getDistanceBetweenTouches([e.touches[0], e.touches[1]]);
    }
  });

  mainImage.addEventListener("touchmove", (e) => {
    if (isPinch && e.touches.length === 2) {
      // Только если два пальца, мы будем обрабатывать пинч
      const newDistance = getDistanceBetweenTouches([
        e.touches[0],
        e.touches[1],
      ]);
      const scaleChange = newDistance / initialDistance;

      currentScale = Math.min(Math.max(currentScale * scaleChange, 1), 3); // Ограничиваем масштаб от 1x до 3x
      mainImage.style.transform = `scale(${currentScale})`;

      initialDistance = newDistance; // Обновляем начальное расстояние для дальнейших движений
    } else if (e.touches.length === 1) {
      // Обработка свайпов для одного пальца
      touchEndX = e.touches[0].clientX;
    }
  });

  mainImage.addEventListener("touchend", () => {
    if (isPinch) {
      isPinch = false; // Завершаем пинч
      initialDistance = 0;
    } else {
      const swipeDistance = touchStartX - touchEndX;
      const swipeThreshold = 150; // Увеличиваем порог для свайпа до 150 пикселей
      if (swipeDistance > swipeThreshold) changeImage(1, images); // Свайп влево
      if (swipeDistance < -swipeThreshold) changeImage(-1, images); // Свайп вправо
    }
  });
}

// Получаем расстояние между двумя точками (пальцами)
function getDistanceBetweenTouches(touches) {
  const xDist = touches[0].clientX - touches[1].clientX;
  const yDist = touches[0].clientY - touches[1].clientY;
  return Math.sqrt(xDist * xDist + yDist * yDist);
}

// Сбросить масштаб изображения
function resetImageScale() {
  const mainImage = document.getElementById("mainImage");
  currentScale = 1;
  mainImage.style.transform = "scale(1)";
  mainImage.style.transition = "transform 0.3s ease"; // Плавное возвращение к нормальному масштабу
  dragOffsetX = 0;
  dragOffsetY = 0;
  mainImage.style.left = "0px";
  mainImage.style.top = "0px";
}

// Обработка перетаскивания изображения
function setupDragToMove(mainImage, imageContainer) {
  let startX, startY;
  let isMoving = false;

  mainImage.addEventListener("touchstart", (e) => {
    if (currentScale > 1) {
      // Только если изображение увеличено
      isMoving = true;
      startX = e.touches[0].clientX - dragOffsetX;
      startY = e.touches[0].clientY - dragOffsetY;
    }
  });

  mainImage.addEventListener("touchmove", (e) => {
    if (isMoving && currentScale > 1) {
      const moveX = e.touches[0].clientX - startX;
      const moveY = e.touches[0].clientY - startY;

      // Ограничиваем движение изображения внутри контейнера
      const containerRect = imageContainer.getBoundingClientRect();
      const imageRect = mainImage.getBoundingClientRect();

      // Двигаем изображение внутри контейнера, ограничиваем его движением
      dragOffsetX = Math.min(
        Math.max(moveX, containerRect.width - imageRect.width * currentScale),
        0
      );
      dragOffsetY = Math.min(
        Math.max(moveY, containerRect.height - imageRect.height * currentScale),
        0
      );

      mainImage.style.left = `${dragOffsetX}px`;
      mainImage.style.top = `${dragOffsetY}px`;
    }
  });

  mainImage.addEventListener("touchend", () => {
    isMoving = false;
  });
}

// Управление клавишами
function handleKeyboard(e) {
  // Используем только изображения текущего блока, на котором открыта модалка
  if (e.key === "ArrowLeft") changeImage(-1, currentItemImages);
  if (e.key === "ArrowRight") changeImage(1, currentItemImages);
  if (e.key === "Escape") closeModal();
}

// Масштабирование изображения колесиком мыши (для десктопа)
function setupMouseWheelZoom(mainImage) {
  mainImage.addEventListener("wheel", (e) => {
    if (e.deltaY < 0) {
      // Увеличение
      currentScale = Math.min(currentScale + 0.1, 3); // Ограничиваем масштаб от 1x до 3x
    } else {
      // Уменьшение
      currentScale = Math.max(currentScale - 0.1, 1); // Ограничиваем масштаб от 1x до 3x
    }

    mainImage.style.transform = `scale(${currentScale})`;
    e.preventDefault();
  });
}

// Обработка жестов пинч для масштабирования
function setupPinchToZoom(mainImage, imageContainer) {
  mainImage.addEventListener("touchstart", (e) => {
    touchStartX = e.touches[0].clientX;
    if (e.touches.length === 2) {
      isPinch = true; // Начинаем пинч
      initialDistance = getDistanceBetweenTouches([e.touches[0], e.touches[1]]);
    }
  });

  mainImage.addEventListener("touchmove", (e) => {
    if (isPinch && e.touches.length === 2) {
      const newDistance = getDistanceBetweenTouches([
        e.touches[0],
        e.touches[1],
      ]);
      const scaleChange = newDistance / initialDistance;

      currentScale = Math.min(Math.max(currentScale * scaleChange, 1), 3); // Ограничиваем масштаб от 1x до 3x
      mainImage.style.transform = `scale(${currentScale})`;

      initialDistance = newDistance;
    }
  });

  mainImage.addEventListener("touchend", () => {
    if (isPinch) {
      isPinch = false; // Завершаем пинч
      initialDistance = 0;
    }
  });
}

// Открытие ссылки на YouTube
function openYouTube(button) {
  const youtubeLink = button.getAttribute("data-link"); // Получаем ссылку из атрибута
  if (youtubeLink) {
    window.open(youtubeLink, "_blank"); // Открываем ссылку в новой вкладке
  }
}

// Инициализация
loadCatalogData();
