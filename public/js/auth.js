// JavaScript для аутентификации

document.addEventListener('DOMContentLoaded', function() {
    initializeAuth();
});

function initializeAuth() {
    // Обработчики для переключения форм
    const showRegister = document.getElementById('showRegister');
    const showLogin = document.getElementById('showLogin');
    
    if (showRegister) {
        showRegister.addEventListener('click', function(e) {
            e.preventDefault();
            switchToRegister();
        });
    }
    
    if (showLogin) {
        showLogin.addEventListener('click', function(e) {
            e.preventDefault();
            switchToLogin();
        });
    }
    
    // Обработчики форм
    const loginForm = document.getElementById('loginFormElement');
    const registerForm = document.getElementById('registerFormElement');
    
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
    
    // Обработчики для навигационных ссылок
    const loginLink = document.getElementById('loginLink');
    const registerLink = document.getElementById('registerLink');
    
    if (loginLink) {
        loginLink.addEventListener('click', function(e) {
            e.preventDefault();
            switchToLogin();
        });
    }
    
    if (registerLink) {
        registerLink.addEventListener('click', function(e) {
            e.preventDefault();
            switchToRegister();
        });
    }
}

// Переключение на форму регистрации
function switchToRegister() {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    
    if (loginForm && registerForm) {
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
        registerForm.classList.add('fade-in');
    }
}

// Переключение на форму входа
function switchToLogin() {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    
    if (loginForm && registerForm) {
        registerForm.style.display = 'none';
        loginForm.style.display = 'block';
        loginForm.classList.add('fade-in');
    }
}

// Обработка входа
async function handleLogin(event) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);
    const email = formData.get('email');
    const password = formData.get('password');
    
    // Валидация
    if (!email || !password) {
        window.app.showNotification('Заполните все поля', 'error');
        return;
    }
    
    if (!window.app.isValidEmail(email)) {
        window.app.showNotification('Введите корректный email', 'error');
        return;
    }
    
    try {
        window.app.showLoader();
        
        const response = await window.app.apiRequest('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
        
        // Сохраняем данные аутентификации
        localStorage.setItem('authToken', response.token);
        localStorage.setItem('currentUser', JSON.stringify(response.user));
        
        
        // Обновляем глобальные переменные
        currentUser = response.user;
        authToken = response.token;
        
        // Обновляем интерфейс
        window.app.updateUIForAuthenticatedUser();
        
        window.app.showNotification('Успешный вход в систему!', 'success');
        
        // Перенаправляем на главную страницу
        setTimeout(() => {
            window.location.href = '/';
        }, 1000);
        
    } catch (error) {
        console.error('Login error:', error);
        window.app.showNotification(error.message || 'Ошибка входа в систему', 'error');
    } finally {
        window.app.hideLoader();
    }
}

// Обработка регистрации
async function handleRegister(event) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);
    const username = formData.get('username');
    const email = formData.get('email');
    const password = formData.get('password');
    
    // Валидация
    if (!username || !email || !password) {
        window.app.showNotification('Заполните все поля', 'error');
        return;
    }
    
    if (username.length < 2) {
        window.app.showNotification('Имя пользователя должно содержать минимум 2 символа', 'error');
        return;
    }
    
    if (!window.app.isValidEmail(email)) {
        window.app.showNotification('Введите корректный email', 'error');
        return;
    }
    
    if (password.length < 6) {
        window.app.showNotification('Пароль должен содержать минимум 6 символов', 'error');
        return;
    }
    
    try {
        window.app.showLoader();
        
        const response = await window.app.apiRequest('/api/auth/register', {
            method: 'POST',
            body: JSON.stringify({ username, email, password })
        });
        
        // Сохраняем данные аутентификации
        localStorage.setItem('authToken', response.token);
        localStorage.setItem('currentUser', JSON.stringify(response.user));
        
        
        // Обновляем глобальные переменные
        currentUser = response.user;
        authToken = response.token;
        
        // Обновляем интерфейс
        window.app.updateUIForAuthenticatedUser();
        
        window.app.showNotification('Регистрация прошла успешно!', 'success');
        
        // Перенаправляем на главную страницу
        setTimeout(() => {
            window.location.href = '/';
        }, 1000);
        
    } catch (error) {
        console.error('Register error:', error);
        window.app.showNotification(error.message || 'Ошибка регистрации', 'error');
    } finally {
        window.app.hideLoader();
    }
}
