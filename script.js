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

let isFullscreen = false; // Флаг полноэкранного режима
let zoomLevel = 1; // Уровень увеличения изображения
let lens = document.getElementById("zoomLens"); // Лупа
let zoomedImage = null;

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

  // Настроим жесты для свайпов
  setupImageGestures(mainImage, item.images);

  // Добавляем обработчик для перехода в полноэкранный режим
  mainImage.addEventListener("dblclick", toggleFullscreen);

  // Добавляем обработчик для пинча (но теперь не будет увеличиваться)
  setupPinchToZoom(mainImage);

  // Добавляем обработчик для перетаскивания изображения
  setupDragToMove(mainImage, imageContainer);

  // Добавляем обработчик для колесика мыши для увеличения
  mainImage.addEventListener("wheel", (e) => {
    e.preventDefault();
    if (!isFullscreen) {
      zoomImage(e); // Увеличение только если не в полноэкранном режиме
    }
  });

  // Добавляем обработчик для перемещения точки увеличения
  mainImage.addEventListener("mousemove", (e) => {
    if (!isFullscreen) {
      updateZoomPosition(e); // Обновляем точку увеличения
    }
  });
}

// Закрытие модалки
function closeModal() {
  const modal = document.getElementById("modal");
  modal.style.display = "none";
  document.body.style.overflow = "";

  exitFullscreen(); // Выйти из полноэкранного режима

  resetImageScale(); // Сбросить масштаб изображения
}

// Добавляем обработчик для кнопки закрытия модалки
document.getElementById("closeModal").addEventListener("click", closeModal);

// Добавляем поддержку стрелок клавиатуры для переключения изображений
document.addEventListener("keydown", (e) => {
  const modal = document.getElementById("modal");
  if (modal.style.display === "flex") {
    if (e.key === "ArrowLeft") {
      // Стрелка влево
      changeImage(-1, currentItemImages);
    } else if (e.key === "ArrowRight") {
      // Стрелка вправо
      changeImage(1, currentItemImages);
    }
  }
});

// Изменение изображения
function changeImage(direction, images) {
  currentImageIndex =
    (currentImageIndex + direction + images.length) % images.length;
  const mainImage = document.getElementById("mainImage");
  mainImage.src = images[currentImageIndex];
  resetImageScale(); // Сбросить масштаб изображения при смене
}

// Переключение в полноэкранный режим
function toggleFullscreen() {
  const mainImage = document.getElementById("mainImage");

  if (!isFullscreen) {
    // Переход в полноэкранный режим
    if (mainImage.requestFullscreen) {
      mainImage.requestFullscreen();
    } else if (mainImage.webkitRequestFullscreen) {
      mainImage.webkitRequestFullscreen();
    } else if (mainImage.msRequestFullscreen) {
      mainImage.msRequestFullscreen();
    }

    isFullscreen = true;
    mainImage.style.transform = "scale(1)"; // Убедимся, что масштаб сброшен
    mainImage.style.pointerEvents = "none"; // Блокируем взаимодействие с изображением
  } else {
    // Выход из полноэкранного режима
    exitFullscreen();
    isFullscreen = false;
    mainImage.style.pointerEvents = "auto"; // Восстанавливаем взаимодействие
  }
}

// Выход из полноэкранного режима
function exitFullscreen() {
  if (document.exitFullscreen) document.exitFullscreen();
  else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
  else if (document.msExitFullscreen) document.msExitFullscreen();
}

// Обработка свайпов для переключения изображений
function setupImageGestures(mainImage, images) {
  let touchStartX = 0;
  let touchEndX = 0;

  mainImage.addEventListener("touchstart", (e) => {
    touchStartX = e.touches[0].clientX;
  });

  mainImage.addEventListener("touchmove", (e) => {
    touchEndX = e.touches[0].clientX;
  });

  mainImage.addEventListener("touchend", () => {
    const swipeDistance = touchStartX - touchEndX;
    const swipeThreshold = 150; // Порог свайпа
    if (swipeDistance > swipeThreshold) changeImage(1, images); // Свайп влево
    if (swipeDistance < -swipeThreshold) changeImage(-1, images); // Свайп вправо
  });
}

// Обработчик пинча (но без возможности увеличивать)
function setupPinchToZoom(mainImage) {
  let initialDistance = 0;

  mainImage.addEventListener("touchstart", (e) => {
    if (e.touches.length === 2) {
      initialDistance = getDistanceBetweenTouches([e.touches[0], e.touches[1]]);
    }
  });

  mainImage.addEventListener("touchmove", (e) => {
    if (e.touches.length === 2) {
      const newDistance = getDistanceBetweenTouches([
        e.touches[0],
        e.touches[1],
      ]);
      const scaleChange = newDistance / initialDistance;

      // Применяем масштаб, но не даем увеличить
      mainImage.style.transform = `scale(1)`; // Ограничиваем масштаб на 1
      initialDistance = newDistance;
    }
  });

  mainImage.addEventListener("touchend", () => {
    initialDistance = 0;
  });
}

// Получаем расстояние между двумя точками (пальцами)
function getDistanceBetweenTouches(touches) {
  const xDist = touches[0].clientX - touches[1].clientX;
  const yDist = touches[0].clientY - touches[1].clientY;
  return Math.sqrt(xDist * xDist + yDist * yDist);
}

// Обработка перетаскивания изображения
function setupDragToMove(mainImage, imageContainer) {
  let startX, startY;
  let isMoving = false;

  mainImage.addEventListener("touchstart", (e) => {
    if (isFullscreen) {
      isMoving = true;
      startX = e.touches[0].clientX - dragOffsetX;
      startY = e.touches[0].clientY - dragOffsetY;
    }
  });

  mainImage.addEventListener("touchmove", (e) => {
    if (isMoving) {
      const moveX = e.touches[0].clientX - startX;
      const moveY = e.touches[0].clientY - startY;

      // Ограничиваем движение изображения внутри контейнера
      const containerRect = imageContainer.getBoundingClientRect();
      const imageRect = mainImage.getBoundingClientRect();

      dragOffsetX = Math.min(
        Math.max(moveX, containerRect.width - imageRect.width),
        0
      );
      dragOffsetY = Math.min(
        Math.max(moveY, containerRect.height - imageRect.height),
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

// Функция для увеличения изображения
function zoomImage(e) {
  const mainImage = document.getElementById("mainImage");

  // Изменение масштаба
  if (e.deltaY < 0) {
    zoomLevel += 0.1; // Увеличение
  } else {
    zoomLevel -= 0.1; // Уменьшение
  }

  // Ограничиваем максимальный и минимальный масштаб
  zoomLevel = Math.min(Math.max(zoomLevel, 1), 3);

  // Применяем масштаб
  mainImage.style.transform = `scale(${zoomLevel})`;
}

// Сброс масштаба изображения
function resetImageScale() {
  const mainImage = document.getElementById("mainImage");
  zoomLevel = 1;
  mainImage.style.transform = `scale(1)`; // Сбрасываем масштаб
}

// Обновление точки увеличения
function updateZoomPosition(e) {
  const mainImage = document.getElementById("mainImage");
  const rect = mainImage.getBoundingClientRect();
  const offsetX = e.clientX - rect.left;
  const offsetY = e.clientY - rect.top;

  mainImage.style.transformOrigin = `${(offsetX / rect.width) * 100}% ${
    (offsetY / rect.height) * 100
  }%`;
}

// Загрузка данных
loadCatalogData();
