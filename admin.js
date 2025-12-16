// Хранилище данных
let eventsData = [];
let articlesData = [];
const API_URL = 'http://localhost:5000/api';

// Проверка аутентификации
async function checkAuth() {
    try {
        const response = await fetch(`${API_URL}/check-auth`, {
            credentials: 'include'
        });
        const data = await response.json();
        if (!data.authenticated) {
            alert('Требуется авторизация. Пожалуйста, войдите в систему через форму регистрации на главной странице.');
            window.location.href = 'Index.html';
            return false;
        }
        return true;
    } catch (error) {
        console.error('Ошибка проверки аутентификации:', error);
        alert('Не удалось подключиться к серверу. Убедитесь, что сервер запущен.');
        return false;
    }
}

// Выход из системы
async function logout() {
    try {
        await fetch(`${API_URL}/logout`, {
            method: 'POST',
            credentials: 'include'
        });
        window.location.href = 'Index.html';
    } catch (error) {
        console.error('Ошибка выхода:', error);
        window.location.href = 'Index.html';
    }
}

// Переключение вкладок
document.querySelectorAll('.admin-tab').forEach(tab => {
    tab.addEventListener('click', () => {
        const targetTab = tab.dataset.tab;
        document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById(`${targetTab}-section`).classList.add('active');
    });
});

// Загрузка событий
async function loadEvents() {
    try {
        const response = await fetch(`${API_URL}/events`, {
            credentials: 'include'
        });
        if (!response.ok) {
            if (response.status === 401) {
                alert('Требуется авторизация. Пожалуйста, войдите в систему.');
                window.location.href = 'Index.html';
                return;
            }
            throw new Error('Не удалось загрузить события');
        }
        const data = await response.json();
        eventsData = data.events || [];
        renderEvents();
    } catch (error) {
        console.error('Ошибка загрузки событий:', error);
        document.getElementById('events-list').innerHTML = '<div class="empty-state">Ошибка загрузки событий. Проверьте подключение к серверу.</div>';
    }
}

// Загрузка статей
async function loadArticles() {
    try {
        const response = await fetch(`${API_URL}/articles`, {
            credentials: 'include'
        });
        if (!response.ok) {
            if (response.status === 401) {
                alert('Требуется авторизация. Пожалуйста, войдите в систему.');
                window.location.href = 'Index.html';
                return;
            }
            throw new Error('Не удалось загрузить статьи');
        }
        const data = await response.json();
        articlesData = data.articles || [];
        renderArticles();
    } catch (error) {
        console.error('Ошибка загрузки статей:', error);
        document.getElementById('articles-list').innerHTML = '<div class="empty-state">Ошибка загрузки статей. Проверьте подключение к серверу.</div>';
    }
}

// Отображение событий
function renderEvents() {
    const list = document.getElementById('events-list');
    if (eventsData.length === 0) {
        list.innerHTML = '<div class="empty-state">Событий пока нет. Добавьте первое событие!</div>';
        return;
    }
    list.innerHTML = eventsData.map(event => `
        <div class="admin-item">
            <div class="admin-item-content">
                <div class="admin-item-title">${event.title}</div>
                <div class="admin-item-meta">
                    <span>📅 ${event.date}</span>
                    <span>📍 ${event.location}</span>
                    <span>🏷️ ${getTypeLabel(event.type)}</span>
                    ${event.articleId ? `<span>🔗 Статья ID: ${event.articleId}</span>` : ''}
                </div>
            </div>
            <div class="admin-item-actions">
                <button class="btn btn-secondary" onclick="editEvent('${event.id}')">Редактировать</button>
                <button class="btn btn-danger" onclick="deleteEvent('${event.id}')">Удалить</button>
            </div>
        </div>
    `).join('');
}

// Отображение статей
function renderArticles() {
    const list = document.getElementById('articles-list');
    if (articlesData.length === 0) {
        list.innerHTML = '<div class="empty-state">Статей пока нет. Добавьте первую статью!</div>';
        return;
    }
    list.innerHTML = articlesData.map(article => `
        <div class="admin-item">
            <div class="admin-item-content">
                <div class="admin-item-title">${article.title}</div>
                <div class="admin-item-meta">
                    <span>📅 ${article.date}</span>
                    <span>📍 ${article.location}</span>
                    <span>🏷️ ${getTypeLabel(article.type)}</span>
                    <span>📝 ${article.content?.length || 0} абзацев</span>
                    <span>🖼️ ${article.gallery?.length || 0} фото</span>
                </div>
            </div>
            <div class="admin-item-actions">
                <button class="btn btn-secondary" onclick="editArticle('${article.id}')">Редактировать</button>
                <button class="btn btn-danger" onclick="deleteArticle('${article.id}')">Удалить</button>
            </div>
        </div>
    `).join('');
}

// Получение метки типа
function getTypeLabel(type) {
    const labels = {
        'concert': 'Концерт',
        'premiere': 'Премьера',
        'street': 'Уличное мероприятие'
    };
    return labels[type] || type;
}

// Генерация ID
function generateId() {
    return Date.now().toString();
}

// Открыть модальное окно события
function openEventModal(eventId = null) {
    const modal = document.getElementById('event-modal');
    const form = document.getElementById('event-form');
    const title = document.getElementById('event-modal-title');
    
    if (eventId) {
        const event = eventsData.find(e => e.id === eventId);
        if (event) {
            title.textContent = 'Редактировать событие';
            document.getElementById('event-id').value = event.id;
            document.getElementById('event-title').value = event.title;
            document.getElementById('event-date').value = event.date;
            document.getElementById('event-location').value = event.location;
            document.getElementById('event-type').value = event.type;
            document.getElementById('event-image').value = event.image;
            document.getElementById('event-image-alt').value = event.imageAlt || '';
            document.getElementById('event-article-id').value = event.articleId || '';
            updateImagePreview('event-image', 'event-image-preview');
        }
    } else {
        title.textContent = 'Новое событие';
        form.reset();
        document.getElementById('event-id').value = '';
        document.getElementById('event-image-preview').style.display = 'none';
    }
    
    modal.classList.add('active');
}

// Закрыть модальное окно события
function closeEventModal() {
    document.getElementById('event-modal').classList.remove('active');
}

// Сохранение события
document.getElementById('event-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const id = document.getElementById('event-id').value || generateId();
    const event = {
        id: id,
        title: document.getElementById('event-title').value,
        date: document.getElementById('event-date').value,
        location: document.getElementById('event-location').value,
        type: document.getElementById('event-type').value,
        image: document.getElementById('event-image').value,
        imageAlt: document.getElementById('event-image-alt').value || '',
        articleId: document.getElementById('event-article-id').value || undefined
    };
    
    const index = eventsData.findIndex(e => e.id === id);
    if (index >= 0) {
        eventsData[index] = event;
    } else {
        eventsData.push(event);
    }
    
    await saveEvents();
    renderEvents();
    closeEventModal();
});

// Редактирование события
function editEvent(id) {
    openEventModal(id);
}

// Удаление события
async function deleteEvent(id) {
    if (confirm('Вы уверены, что хотите удалить это событие?')) {
        eventsData = eventsData.filter(e => e.id !== id);
        await saveEvents();
        renderEvents();
    }
}

// Сохранение событий на сервер
async function saveEvents() {
    try {
        const response = await fetch(`${API_URL}/events`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({ events: eventsData })
        });
        
        if (!response.ok) {
            if (response.status === 401) {
                alert('Сессия истекла. Пожалуйста, войдите в систему снова.');
                window.location.href = 'Index.html';
                return;
            }
            throw new Error('Не удалось сохранить события');
        }
        
        const result = await response.json();
        alert('События успешно сохранены!');
    } catch (error) {
        console.error('Ошибка сохранения событий:', error);
        alert('Ошибка сохранения событий. Проверьте подключение к серверу.');
        throw error;
    }
}

// Открыть модальное окно статьи
function openArticleModal(articleId = null) {
    const modal = document.getElementById('article-modal');
    const form = document.getElementById('article-form');
    const title = document.getElementById('article-modal-title');
    const contentList = document.getElementById('article-content-list');
    const galleryList = document.getElementById('article-gallery-list');
    
    if (articleId) {
        const article = articlesData.find(a => a.id === articleId);
        if (article) {
            title.textContent = 'Редактировать статью';
            document.getElementById('article-id').value = article.id;
            document.getElementById('article-title').value = article.title;
            document.getElementById('article-date').value = article.date;
            document.getElementById('article-location').value = article.location;
            document.getElementById('article-type').value = article.type;
            document.getElementById('article-image').value = article.image;
            updateImagePreview('article-image', 'article-image-preview');
            
            // Загрузка абзацев
            contentList.innerHTML = (article.content || []).map((para, idx) => `
                <div class="content-paragraph">
                    <textarea class="content-editor" placeholder="Введите текст абзаца">${para}</textarea>
                    <button type="button" onclick="removeContentParagraph(this)">×</button>
                </div>
            `).join('');
            if (contentList.children.length === 0) {
                addContentParagraph();
            }
            
            // Загрузка галереи
            galleryList.innerHTML = (article.gallery || []).map((item, idx) => `
                <div class="gallery-item">
                    <input type="url" value="${item.src}" placeholder="URL изображения" />
                    <button type="button" onclick="removeGalleryItem(this)">×</button>
                </div>
            `).join('');
        }
    } else {
        title.textContent = 'Новая статья';
        form.reset();
        document.getElementById('article-id').value = '';
        document.getElementById('article-image-preview').style.display = 'none';
        contentList.innerHTML = `
            <div class="content-paragraph">
                <textarea class="content-editor" placeholder="Введите текст абзаца"></textarea>
                <button type="button" onclick="removeContentParagraph(this)">×</button>
            </div>
        `;
        galleryList.innerHTML = '';
    }
    
    modal.classList.add('active');
}

// Закрыть модальное окно статьи
function closeArticleModal() {
    document.getElementById('article-modal').classList.remove('active');
}

// Добавить абзац содержимого
function addContentParagraph() {
    const list = document.getElementById('article-content-list');
    const div = document.createElement('div');
    div.className = 'content-paragraph';
    div.innerHTML = `
        <textarea class="content-editor" placeholder="Введите текст абзаца"></textarea>
        <button type="button" onclick="removeContentParagraph(this)">×</button>
    `;
    list.appendChild(div);
}

// Удалить абзац содержимого
function removeContentParagraph(btn) {
    const list = document.getElementById('article-content-list');
    if (list.children.length > 1) {
        btn.closest('.content-paragraph').remove();
    } else {
        alert('Должен остаться хотя бы один абзац');
    }
}

// Добавить элемент галереи
function addGalleryItem() {
    const list = document.getElementById('article-gallery-list');
    const div = document.createElement('div');
    div.className = 'gallery-item';
    div.innerHTML = `
        <input type="url" placeholder="URL изображения" />
        <button type="button" onclick="removeGalleryItem(this)">×</button>
    `;
    list.appendChild(div);
}

// Удалить элемент галереи
function removeGalleryItem(btn) {
    btn.closest('.gallery-item').remove();
}

// Сохранение статьи
document.getElementById('article-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const id = document.getElementById('article-id').value || generateId();
    
    // Собираем абзацы
    const content = Array.from(document.querySelectorAll('#article-content-list textarea'))
        .map(ta => ta.value.trim())
        .filter(v => v);
    
    if (content.length === 0) {
        alert('Добавьте хотя бы один абзац содержимого');
        return;
    }
    
    // Собираем галерею
    const gallery = Array.from(document.querySelectorAll('#article-gallery-list input'))
        .map(inp => inp.value.trim())
        .filter(v => v)
        .map(src => ({ src }));
    
    const article = {
        id: id,
        title: document.getElementById('article-title').value,
        date: document.getElementById('article-date').value,
        location: document.getElementById('article-location').value,
        type: document.getElementById('article-type').value,
        image: document.getElementById('article-image').value,
        content: content,
        gallery: gallery.length > 0 ? gallery : undefined
    };
    
    const index = articlesData.findIndex(a => a.id === id);
    if (index >= 0) {
        articlesData[index] = article;
    } else {
        articlesData.push(article);
    }
    
    await saveArticles();
    renderArticles();
    closeArticleModal();
});

// Редактирование статьи
function editArticle(id) {
    openArticleModal(id);
}

// Удаление статьи
async function deleteArticle(id) {
    if (confirm('Вы уверены, что хотите удалить эту статью?')) {
        articlesData = articlesData.filter(a => a.id !== id);
        await saveArticles();
        renderArticles();
    }
}

// Сохранение статей на сервер
async function saveArticles() {
    try {
        const response = await fetch(`${API_URL}/articles`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({ articles: articlesData })
        });
        
        if (!response.ok) {
            if (response.status === 401) {
                alert('Сессия истекла. Пожалуйста, войдите в систему снова.');
                window.location.href = 'Index.html';
                return;
            }
            throw new Error('Не удалось сохранить статьи');
        }
        
        const result = await response.json();
        alert('Статьи успешно сохранены!');
    } catch (error) {
        console.error('Ошибка сохранения статей:', error);
        alert('Ошибка сохранения статей. Проверьте подключение к серверу.');
        throw error;
    }
}

// Обновление превью изображения
function updateImagePreview(inputId, previewId) {
    const input = document.getElementById(inputId);
    const preview = document.getElementById(previewId);
    
    input.addEventListener('input', () => {
        if (input.value) {
            preview.src = input.value;
            preview.style.display = 'block';
            preview.onerror = () => {
                preview.style.display = 'none';
            };
        } else {
            preview.style.display = 'none';
        }
    });
    
    if (input.value) {
        preview.src = input.value;
        preview.style.display = 'block';
    }
}

// Экспорт событий (удалено - теперь сохраняется напрямую на сервер)
function exportEvents() {
    alert('Данные сохраняются автоматически на сервер при изменении.');
}

// Экспорт статей (удалено - теперь сохраняется напрямую на сервер)
function exportArticles() {
    alert('Данные сохраняются автоматически на сервер при изменении.');
}

// Закрытие модальных окон по клику вне области
document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
        }
    });
});

// Инициализация
document.addEventListener('DOMContentLoaded', async () => {
    // Проверка аутентификации
    const isAuthenticated = await checkAuth();
    if (!isAuthenticated) {
        return;
    }
    
    // Добавляем кнопку выхода
    const adminHeader = document.querySelector('.admin-header');
    if (adminHeader) {
        const logoutBtn = document.createElement('button');
        logoutBtn.className = 'btn btn-secondary';
        logoutBtn.textContent = 'Выйти';
        logoutBtn.style.marginLeft = '1rem';
        logoutBtn.onclick = logout;
        adminHeader.appendChild(logoutBtn);
    }
    
    loadEvents();
    loadArticles();
    
    // Инициализация превью изображений
    updateImagePreview('event-image', 'event-image-preview');
    updateImagePreview('article-image', 'article-image-preview');
});


