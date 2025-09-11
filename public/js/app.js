// Основной JavaScript файл приложения

// Глобальные переменные
let currentUser = null;
let authToken = null;

// Инициализация приложения
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

// Инициализация
function initializeApp() {
    // Проверяем сохраненную аутентификацию
    checkSavedAuth();
    
    // Инициализируем модальные окна
    initializeModals();
    
    // Инициализируем подсказки
    initializeTooltips();
    
    // Инициализируем обработчики событий
    initializeEventListeners();
}

// Проверка сохраненной аутентификации
function checkSavedAuth() {
    const savedToken = localStorage.getItem('authToken');
    const savedUser = localStorage.getItem('currentUser');
    
    if (savedToken && savedUser) {
        authToken = savedToken;
        currentUser = JSON.parse(savedUser);
        updateUIForAuthenticatedUser();
    }
}

// Обновление интерфейса для аутентифицированного пользователя
function updateUIForAuthenticatedUser() {
    const authButtons = document.getElementById('authButtons');
    const userMenu = document.getElementById('userMenu');
    const username = document.getElementById('username');
    
    if (authButtons) authButtons.style.display = 'none';
    if (userMenu) userMenu.style.display = 'flex';
    if (username && currentUser) username.textContent = currentUser.username;
}

// Обновление интерфейса для неаутентифицированного пользователя
function updateUIForUnauthenticatedUser() {
    const authButtons = document.getElementById('authButtons');
    const userMenu = document.getElementById('userMenu');
    
    if (authButtons) authButtons.style.display = 'flex';
    if (userMenu) userMenu.style.display = 'none';
}

// Инициализация модальных окон
function initializeModals() {
    const modal = document.getElementById('modal');
    const modalClose = document.getElementById('modalClose');
    
    if (modalClose) {
        modalClose.addEventListener('click', closeModal);
    }
    
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeModal();
            }
        });
    }
    
    // Закрытие по Escape
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeModal();
        }
    });
}

// Показать модальное окно
function showModal(content, title = '') {
    const modal = document.getElementById('modal');
    const modalBody = document.getElementById('modalBody');
    
    if (title) {
        modalBody.innerHTML = `<h3>${title}</h3>${content}`;
    } else {
        modalBody.innerHTML = content;
    }
    
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

// Закрыть модальное окно
function closeModal() {
    const modal = document.getElementById('modal');
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

// Инициализация подсказок
function initializeTooltips() {
    const tooltip = document.getElementById('tooltip');
    const tooltipContent = document.getElementById('tooltipContent');
    
    document.addEventListener('mouseover', function(e) {
        const helpIcon = e.target.closest('[data-tooltip]');
        if (helpIcon) {
            const tooltipText = helpIcon.getAttribute('data-tooltip');
            showTooltip(e, tooltipText);
        }
    });
    
    document.addEventListener('mouseout', function(e) {
        const helpIcon = e.target.closest('[data-tooltip]');
        if (helpIcon) {
            hideTooltip();
        }
    });
    
    document.addEventListener('mousemove', function(e) {
        const helpIcon = e.target.closest('[data-tooltip]');
        if (helpIcon && tooltip.classList.contains('show')) {
            updateTooltipPosition(e);
        }
    });
}

// Показать подсказку
function showTooltip(event, text) {
    const tooltip = document.getElementById('tooltip');
    const tooltipContent = document.getElementById('tooltipContent');
    
    tooltipContent.textContent = text;
    tooltip.classList.add('show');
    updateTooltipPosition(event);
}

// Скрыть подсказку
function hideTooltip() {
    const tooltip = document.getElementById('tooltip');
    tooltip.classList.remove('show');
}

// Обновить позицию подсказки
function updateTooltipPosition(event) {
    const tooltip = document.getElementById('tooltip');
    const tooltipRect = tooltip.getBoundingClientRect();
    
    let left = event.pageX + 10;
    let top = event.pageY - tooltipRect.height - 10;
    
    // Проверяем границы экрана
    if (left + tooltipRect.width > window.innerWidth) {
        left = event.pageX - tooltipRect.width - 10;
    }
    
    if (top < window.pageYOffset) {
        top = event.pageY + 10;
    }
    
    tooltip.style.left = left + 'px';
    tooltip.style.top = top + 'px';
}

// Инициализация обработчиков событий
function initializeEventListeners() {
    // Кнопка выхода
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
}

// Выход из системы
function logout() {
    // Очищаем локальные данные
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    
    // Сбрасываем глобальные переменные
    currentUser = null;
    authToken = null;
    
    // Обновляем интерфейс
    updateUIForUnauthenticatedUser();
    
    // Перенаправляем на главную
    window.location.href = '/';
}

// Утилитарные функции

// API запросы
async function apiRequest(url, options = {}) {
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
        },
    };
    
    // Добавляем токен авторизации если есть
    if (authToken) {
        defaultOptions.headers['Authorization'] = `Bearer ${authToken}`;
    }
    
    const mergedOptions = {
        ...defaultOptions,
        ...options,
        headers: {
            ...defaultOptions.headers,
            ...options.headers,
        },
    };
    
    try {
        const response = await fetch(url, mergedOptions);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Ошибка сервера');
        }
        
        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// Показать уведомление
function showNotification(message, type = 'info') {
    // Создаем элемент уведомления
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-message">${message}</span>
            <button class="notification-close">&times;</button>
        </div>
    `;
    
    // Добавляем стили если их еще нет
    if (!document.querySelector('#notification-styles')) {
        const styles = document.createElement('style');
        styles.id = 'notification-styles';
        styles.textContent = `
            .notification {
                position: fixed;
                top: 20px;
                right: 20px;
                background: white;
                border-radius: 8px;
                box-shadow: 0 4px 25px rgba(0, 0, 0, 0.15);
                z-index: 9999;
                max-width: 400px;
                animation: slideInRight 0.3s ease-out;
            }
            
            .notification-info {
                border-left: 4px solid #667eea;
            }
            
            .notification-success {
                border-left: 4px solid #28a745;
            }
            
            .notification-error {
                border-left: 4px solid #dc3545;
            }
            
            .notification-warning {
                border-left: 4px solid #ffc107;
            }
            
            .notification-content {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 1rem;
            }
            
            .notification-message {
                flex: 1;
                margin-right: 1rem;
                color: #333;
            }
            
            .notification-close {
                background: none;
                border: none;
                font-size: 1.5rem;
                cursor: pointer;
                color: #999;
                padding: 0;
                width: 24px;
                height: 24px;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .notification-close:hover {
                color: #666;
            }
            
            @keyframes slideInRight {
                from {
                    opacity: 0;
                    transform: translateX(100%);
                }
                to {
                    opacity: 1;
                    transform: translateX(0);
                }
            }
            
            @keyframes slideOutRight {
                from {
                    opacity: 1;
                    transform: translateX(0);
                }
                to {
                    opacity: 0;
                    transform: translateX(100%);
                }
            }
        `;
        document.head.appendChild(styles);
    }
    
    // Добавляем на страницу
    document.body.appendChild(notification);
    
    // Обработчик закрытия
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.addEventListener('click', () => {
        notification.style.animation = 'slideOutRight 0.3s ease-in';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    });
    
    // Автоматическое закрытие через 5 секунд
    setTimeout(() => {
        if (notification.parentNode) {
            closeBtn.click();
        }
    }, 5000);
}

// Показать лоадер
function showLoader() {
    const loader = document.createElement('div');
    loader.id = 'loader';
    loader.innerHTML = `
        <div class="loader-overlay">
            <div class="loader-spinner">
                <div class="spinner"></div>
                <p>Загрузка...</p>
            </div>
        </div>
    `;
    
    // Добавляем стили если их еще нет
    if (!document.querySelector('#loader-styles')) {
        const styles = document.createElement('style');
        styles.id = 'loader-styles';
        styles.textContent = `
            .loader-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.5);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 9998;
                backdrop-filter: blur(2px);
            }
            
            .loader-spinner {
                background: white;
                padding: 2rem;
                border-radius: 12px;
                text-align: center;
                box-shadow: 0 4px 25px rgba(0, 0, 0, 0.15);
            }
            
            .spinner {
                width: 40px;
                height: 40px;
                border: 4px solid #f3f3f3;
                border-top: 4px solid #667eea;
                border-radius: 50%;
                animation: spin 1s linear infinite;
                margin: 0 auto 1rem auto;
            }
            
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            
            .loader-spinner p {
                margin: 0;
                color: #333;
                font-weight: 500;
            }
        `;
        document.head.appendChild(styles);
    }
    
    document.body.appendChild(loader);
}

// Скрыть лоадер
function hideLoader() {
    const loader = document.getElementById('loader');
    if (loader) {
        loader.parentNode.removeChild(loader);
    }
}

// Форматирование даты
function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    
    // Меньше минуты
    if (diff < 60000) {
        return 'только что';
    }
    
    // Меньше часа
    if (diff < 3600000) {
        const minutes = Math.floor(diff / 60000);
        return `${minutes} мин. назад`;
    }
    
    // Меньше дня
    if (diff < 86400000) {
        const hours = Math.floor(diff / 3600000);
        return `${hours} ч. назад`;
    }
    
    // Меньше недели
    if (diff < 604800000) {
        const days = Math.floor(diff / 86400000);
        return `${days} дн. назад`;
    }
    
    // Обычное форматирование
    return date.toLocaleDateString('ru-RU', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// Валидация email
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Экспорт функций для использования в других скриптах
window.app = {
    apiRequest,
    showNotification,
    showLoader,
    hideLoader,
    showModal,
    closeModal,
    formatDate,
    isValidEmail,
    currentUser: () => currentUser,
    authToken: () => authToken,
    updateUIForAuthenticatedUser,
    updateUIForUnauthenticatedUser
};