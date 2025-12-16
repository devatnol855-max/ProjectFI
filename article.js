// Хранилище данных статей
let articlesData = {};

// Загрузка данных из JSON файла
async function loadArticlesData() {
    try {
        const response = await fetch('articles.json');
        if (!response.ok) {
            throw new Error('Не удалось загрузить данные статей');
        }
        const data = await response.json();
        
        // Преобразуем массив статей в объект для удобного доступа по ID
        articlesData = {};
        data.articles.forEach(article => {
            // Преобразуем массив content в HTML строку
            const contentHTML = article.content.map(paragraph => `<p>${paragraph}</p>`).join('\n            ');
            articlesData[article.id] = {
                ...article,
                content: contentHTML
            };
        });
        
        return articlesData;
    } catch (error) {
        console.error('Ошибка загрузки данных:', error);
        return {};
    }
}

// Загрузка и отображение статьи
async function loadArticle() {
    const urlParams = new URLSearchParams(window.location.search);
    const articleId = urlParams.get('id');
    const articleContent = document.getElementById('article-content');

    // Показываем индикатор загрузки
    articleContent.innerHTML = '<div class="loading">Загрузка статьи...</div>';

    if (!articleId) {
        articleContent.innerHTML = '<div class="error">Статья не найдена. <a href="events.html">Вернуться к мероприятиям</a></div>';
        return;
    }

    // Загружаем данные статей, если ещё не загружены
    if (Object.keys(articlesData).length === 0) {
        await loadArticlesData();
    }

    const article = articlesData[articleId];

    if (!article) {
        articleContent.innerHTML = '<div class="error">Статья не найдена. <a href="events.html">Вернуться к мероприятиям</a></div>';
        return;
    }

    const galleryHTML = Array.isArray(article.gallery) && article.gallery.length
        ? `
            <div class="article-gallery">
                <h3>Фотогалерея</h3>
                <div class="gallery-grid">
                    ${article.gallery.map((photo, index) => `
                        <button class="gallery-card" type="button" data-index="${index}">
                            <img src="${photo.src}" alt="${photo.alt || article.title}" loading="lazy" />
                        </button>
                    `).join('')}
                </div>
                <div class="gallery-hint">Нажмите на фото, чтобы увеличить карточку</div>
            </div>
        `
        : '';

    // Формируем HTML статьи
    const articleHTML = `
        <div class="article-header">
            <a href="events.html" class="article-back">← Назад к мероприятиям</a>
            <div class="article-date">${article.date}</div>
            <h1 class="article-title">${article.title}</h1>
            <div class="article-location">📍 ${article.location}</div>
        </div>
        <img src="${article.image}" alt="${article.title}" class="article-image" />
        <div class="article-content">
            ${article.content}
        </div>
        ${galleryHTML}
        <div class="article-meta">
            <div class="article-meta-item">
                <span>📅</span>
                <span>${article.date}</span>
            </div>
            <div class="article-meta-item">
                <span>📍</span>
                <span>${article.location}</span>
            </div>
            <div class="article-meta-item">
                <span>🏷️</span>
                <span>${getTypeLabel(article.type)}</span>
            </div>
        </div>
    `;

    articleContent.innerHTML = articleHTML;

    setupGalleryInteractions();
    setupLightbox();

    // Обновляем title страницы
    document.title = `${article.title} — Молодёжный культурный центр ВГТК`;
}

// Получение метки типа события
function getTypeLabel(type) {
    const labels = {
        'concert': 'Концерт',
        'premiere': 'Премьера',
        'street': 'Уличное мероприятие'
    };
    return labels[type] || 'Мероприятие';
}

// Обработчики для карточек галереи
function setupGalleryInteractions() {
    const grid = document.querySelector('.gallery-grid');
    if (!grid) return;

    grid.addEventListener('click', (event) => {
        const card = event.target.closest('.gallery-card');
        if (!card) return;

        const img = card.querySelector('img');
        if (!img) return;

        openLightbox(img.src, img.alt || '');
    });
}

// Настройка лайтбокса
function setupLightbox() {
    const lightbox = document.getElementById('gallery-lightbox');
    const lightboxImg = document.getElementById('lightbox-image');
    const lightboxCaption = document.getElementById('lightbox-caption');
    if (!lightbox || !lightboxImg || !lightboxCaption) return;

    lightbox.addEventListener('click', (event) => {
        if (event.target.dataset.close === 'true') {
            closeLightbox();
        }
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            closeLightbox();
        }
    });
}

function openLightbox(src, alt) {
    const lightbox = document.getElementById('gallery-lightbox');
    const lightboxImg = document.getElementById('lightbox-image');
    const lightboxCaption = document.getElementById('lightbox-caption');
    if (!lightbox || !lightboxImg || !lightboxCaption) return;

    lightboxImg.src = src;
    lightboxImg.alt = alt;
    lightboxCaption.textContent = alt || '';

    lightbox.classList.add('active');
    lightbox.setAttribute('aria-hidden', 'false');
}

function closeLightbox() {
    const lightbox = document.getElementById('gallery-lightbox');
    if (!lightbox) return;

    lightbox.classList.remove('active');
    lightbox.setAttribute('aria-hidden', 'true');
}

// Загружаем статью при загрузке страницы
document.addEventListener('DOMContentLoaded', loadArticle);
