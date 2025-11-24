/**
 * ErrorHandler - Централизованная обработка ошибок
 */
class ErrorHandler {
    /**
     * Обработка ошибки
     * @param {Error|Object} error - Объект ошибки
     * @param {string} context - Контекст возникновения ошибки
     * @param {boolean} silent - Не показывать уведомление пользователю
     */
    static handle(error, context = 'Unknown', silent = false) {
        // Логируем ошибку
        console.error(`[${context}]`, error);
        
        // Не показываем уведомление если silent = true
        if (silent) return;
        
        // Определяем тип ошибки и показываем соответствующее уведомление
        if (error.status === 429) {
            window.app.showNotification('Слишком частые запросы. Подождите немного.', 'warning');
        } else if (error.status === 403 || error.status === 401) {
            window.app.showNotification('Нет доступа. Войдите в систему.', 'error');
            setTimeout(() => {
                window.location.href = '/';
            }, 2000);
        } else if (error.status === 404) {
            window.app.showNotification('Ресурс не найден', 'error');
        } else if (error.status === 400) {
            const message = error.message || 'Некорректные данные';
            window.app.showNotification(message, 'error');
        } else if (error.message) {
            window.app.showNotification(error.message, 'error');
        } else {
            window.app.showNotification('Произошла ошибка. Попробуйте позже.', 'error');
        }
    }
    
    /**
     * Обёртка для async функций с автоматической обработкой ошибок
     * @param {Function} fn - Async функция
     * @param {string} context - Контекст
     * @returns {Function} - Обёрнутая функция
     */
    static wrapAsync(fn, context = 'Async Operation') {
        return async function(...args) {
            try {
                return await fn.apply(this, args);
            } catch (error) {
                ErrorHandler.handle(error, context);
                throw error;
            }
        };
    }
    
    /**
     * Retry логика для сетевых запросов
     * @param {Function} fn - Функция для выполнения
     * @param {number} maxRetries - Максимальное количество попыток
     * @param {number} delay - Задержка между попытками (мс)
     * @param {string} context - Контекст
     */
    static async retry(fn, maxRetries = 3, delay = 1000, context = 'Retry') {
        let lastError;
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                return await fn();
            } catch (error) {
                lastError = error;
                console.warn(`[${context}] Attempt ${attempt}/${maxRetries} failed:`, error);
                
                // Не ретраим если ошибка авторизации или некорректных данных
                if (error.status === 401 || error.status === 403 || error.status === 400) {
                    throw error;
                }
                
                // Ждём перед следующей попыткой
                if (attempt < maxRetries) {
                    await new Promise(resolve => setTimeout(resolve, delay * attempt));
                }
            }
        }
        
        // Все попытки исчерпаны
        throw lastError;
    }
    
    /**
     * Graceful degradation - выполнение с фолбэком
     * @param {Function} primary - Основная функция
     * @param {Function} fallback - Фолбэк функция
     * @param {string} context - Контекст
     */
    static async withFallback(primary, fallback, context = 'Operation') {
        try {
            return await primary();
        } catch (error) {
            console.warn(`[${context}] Primary failed, using fallback:`, error);
            try {
                return await fallback();
            } catch (fallbackError) {
                console.error(`[${context}] Fallback also failed:`, fallbackError);
                throw fallbackError;
            }
        }
    }
    
    /**
     * Валидация данных с выбросом ошибки
     * @param {boolean} condition - Условие валидации
     * @param {string} message - Сообщение об ошибке
     * @param {string} context - Контекст
     */
    static assert(condition, message, context = 'Validation') {
        if (!condition) {
            const error = new Error(message);
            error.context = context;
            throw error;
        }
    }
    
    /**
     * Безопасное выполнение операции с логированием
     * @param {Function} fn - Функция
     * @param {string} context - Контекст
     * @param {any} defaultValue - Значение по умолчанию при ошибке
     */
    static safeExecute(fn, context = 'Safe Execute', defaultValue = null) {
        try {
            return fn();
        } catch (error) {
            console.error(`[${context}] Safe execute failed:`, error);
            return defaultValue;
        }
    }
}

// Экспорт для использования в других модулях
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ErrorHandler;
}



