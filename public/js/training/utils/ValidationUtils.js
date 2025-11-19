// Утилиты для валидации данных
class ValidationUtils {
    // Валидация emoji - упрощённая версия
    // Используем textContent для отображения, что уже безопасно
    // Проверяем только базовые вещи: не пустая строка и не содержит опасных символов
    static isValidEmoji(emoji) {
        if (!emoji || typeof emoji !== 'string') return false;
        // Проверяем, что это не HTML/JS код (базовая защита)
        // textContent сам экранирует, но на всякий случай проверяем
        return !emoji.includes('<') && !emoji.includes('>') && !emoji.includes('script');
    }
    
    // Валидация URL изображения
    static isValidImageUrl(url) {
        if (!url || typeof url !== 'string') return false;
        try {
            const urlObj = new URL(url);
            return ['http:', 'https:'].includes(urlObj.protocol);
        } catch {
            return false;
        }
    }
    
    // Санитизация emoji - просто возвращаем исходное значение
    // textContent уже безопасен, дополнительная валидация не нужна
    static sanitizeEmoji(emoji) {
        if (!emoji || typeof emoji !== 'string') return '🖼️';
        // Базовая проверка на опасные символы
        if (emoji.includes('<') || emoji.includes('>') || emoji.includes('script')) {
            return '🖼️';
        }
        return emoji;
    }
    
    // Санитизация URL изображения
    static sanitizeImageUrl(url) {
        return this.isValidImageUrl(url) ? url : null;
    }
    
    // Валидация длительности тренировки
    static isValidDuration(seconds) {
        const MAX_DURATION = 86400; // 24 hours
        return typeof seconds === 'number' && 
               seconds >= 0 && 
               seconds <= MAX_DURATION &&
               !isNaN(seconds);
    }
}

// Экспорт для использования в других модулях
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ValidationUtils;
}

