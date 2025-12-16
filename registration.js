// Подгружаем форму из отдельного файла
async function loadRegistrationForm() {
    const container = document.getElementById('registrationContainer');
    if (!container) {
        return;
    }
    const response = await fetch('registration.html');
    const html = await response.text();
    container.innerHTML = html;

    // Вешаем проверку пароля
    const form = document.getElementById('registrationForm');
    if (!form) {
        return;
    }
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        const password = document.getElementById('password').value;
        const confirm = document.getElementById('confirmPassword').value;

        if (password !== confirm) {
            alert('Пароли не совпадают!');
            return;
        }
        alert('Регистрация прошла успешно!');
        form.reset();
        closeModal();
    });
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
