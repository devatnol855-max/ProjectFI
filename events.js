// Загрузка и отображение событий из JSON
let eventsData = [];

async function loadEvents() {
    try {
        const response = await fetch('events.json');
        if (!response.ok) {
            throw new Error('Не удалось загрузить данные событий');
        }
        const data = await response.json();
        eventsData = data.events;
        renderEvents(eventsData);
        return eventsData;
    } catch (error) {
        console.error('Ошибка загрузки данных:', error);
        const eventsList = document.getElementById('events-list');
        if (eventsList) {
            eventsList.innerHTML = '<div class="error">Не удалось загрузить события. Пожалуйста, обновите страницу.</div>';
        }
        return [];
    }
}

// Отображение событий
function renderEvents(events) {
    const eventsList = document.getElementById('events-list');
    if (!eventsList) return;

    if (events.length === 0) {
        eventsList.innerHTML = '<div class="muted">События не найдены</div>';
        return;
    }

    eventsList.innerHTML = events.map(event => `
        <article class="event" data-type="${event.type}">
            <img src="${event.image}" alt="${event.imageAlt || event.title}" class="event-img">
            <div class="date">${event.date}</div>
            <div class="title" style="font-weight:700">${event.title}</div>
            <div class="muted location">${event.location}</div>
            <a href="article.html?id=${event.articleId}" class="event-btn">Подробнее</a>
        </article>
    `).join('');

    // Обновляем обработчики поиска и фильтрации
    setupSearchAndFilter();
}

// Настройка поиска и фильтрации
function setupSearchAndFilter() {
    const search = document.getElementById('search');
    const filter = document.getElementById('filter');
    const eventsList = document.querySelectorAll('.event');

    function updateEvents() {
        const query = search ? search.value.toLowerCase() : '';
        const type = filter ? filter.value : 'all';

        eventsList.forEach(ev => {
            const titleElement = ev.querySelector('.title');
            if (!titleElement) return;
            
            const title = titleElement.textContent.toLowerCase();
            const matchesSearch = !query || title.includes(query);
            const matchesFilter = type === 'all' || ev.dataset.type === type;

            ev.style.display = matchesSearch && matchesFilter ? 'block' : 'none';
        });
    }

    if (search) {
        search.addEventListener('input', updateEvents);
    }
    if (filter) {
        filter.addEventListener('change', updateEvents);
    }
}

// Загружаем события при загрузке страницы
document.addEventListener('DOMContentLoaded', loadEvents);


