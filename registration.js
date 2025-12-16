// Подгружаем форму из отдельного файла
async function loadRegistrationForm() {
    const container = document.getElementById('registrationContainer');
    if (!container) {
        return;
    }
    const response = await fetch('registration.html');
    const html = await response.text();
    container.innerHTML = html;

    // Переключение между регистрацией и входом
    setupAuthTabs();

    // Форма регистрации
    const registrationForm = document.getElementById('registrationForm');
    if (registrationForm) {
        registrationForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const password = document.getElementById('password').value;
            const confirm = document.getElementById('confirmPassword').value;

            if (password !== confirm) {
                alert('Пароли не совпадают!');
                return;
            }

            const payload = buildRegistrationJson();
            await saveRegistrationToServer(payload);
        });
    }

    // Форма входа
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            await handleUserLogin();
        });
    }
}

// Настройка вкладок регистрация/вход
function setupAuthTabs() {
    const tabs = document.querySelectorAll('.auth-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const mode = tab.dataset.mode;
            
            // Обновляем активные вкладки
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            // Показываем/скрываем формы
            document.getElementById('registrationForm').classList.toggle('active', mode === 'register');
            document.getElementById('loginForm').classList.toggle('active', mode === 'login');
        });
    });
}

function buildRegistrationJson() {
    const fullName = document.getElementById('fullName').value.trim();
    const email = document.getElementById('email').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const password = document.getElementById('password').value;

    return {
        fullName,
        email,
        phone,
        password,
        registeredAt: new Date().toISOString()
    };
}

// Сохранение регистрации на сервере
async function saveRegistrationToServer(data) {
    try {
        const response = await fetch('http://localhost:5000/api/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (response.ok) {
            // Сохраняем также в localStorage для подстраховки
            try {
                localStorage.setItem('registrationData', JSON.stringify(data));
            } catch (e) {
                console.warn('Не удалось сохранить в localStorage', e);
            }
            
            alert('Регистрация прошла успешно!');
            document.getElementById('registrationForm').reset();
            closeModal();
        } else {
            alert(`Ошибка: ${result.error || 'Не удалось сохранить регистрацию'}`);
        }
    } catch (error) {
        console.error('Ошибка отправки данных на сервер:', error);
        alert('Не удалось отправить данные на сервер. Проверьте, запущен ли сервер на localhost:5000');
    }
}

// Обработка входа пользователя
async function handleUserLogin() {
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    if (!email || !password) {
        alert('Заполните все поля');
        return;
    }

    try {
        const response = await fetch('http://localhost:5000/api/user-login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({ email, password })
        });

        const result = await response.json();

        if (response.ok) {
            if (result.isAdmin) {
                // Если пользователь админ, перенаправляем в админ-панель
                alert('Вход выполнен! Перенаправление в админ-панель...');
                closeModal();
                window.location.href = 'admin.html';
            } else {
                // Обычный пользователь
                alert(`Добро пожаловать, ${result.fullName || email}!`);
                document.getElementById('loginForm').reset();
                closeModal();
            }
        } else {
            alert(result.error || 'Неверный email или пароль');
        }
    } catch (error) {
        console.error('Ошибка входа:', error);
        alert('Не удалось подключиться к серверу. Проверьте, запущен ли сервер на localhost:5000');
    }
}

// Вызов при загрузке страницы
document.addEventListener('DOMContentLoaded', loadRegistrationForm);

// Модальное окно
const modal = document.getElementById('registrationModal');
const ctaButtons = document.querySelectorAll('[data-register-trigger], #ctaRegister');

ctaButtons.forEach(btn => {
    btn.addEventListener('click', function(e) {
        if (!modal) {
            return;
        }
        e.preventDefault();
        modal.style.display = 'flex';
    });
});

function closeModal() {
    if (modal) {
        modal.style.display = 'none';
    }
}

window.addEventListener('click', function(e) {
    if (e.target === modal) closeModal();
});
