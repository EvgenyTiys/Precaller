// Работа с localStorage
class TrainingStorage {
    static PENDING_SESSION_KEY = 'pendingTrainingSession';
    static AVAILABLE_TEXTS_KEY = 'availableTexts';
    static CACHE_TTL = 5 * 60 * 1000; // 5 минут
    
    // Сохранение незавершённой сессии
    static savePendingSession(sessionData) {
        try {
            localStorage.setItem(this.PENDING_SESSION_KEY, JSON.stringify({
                ...sessionData,
                timestamp: Date.now()
            }));
            return true;
        } catch (error) {
            console.error('Error saving pending session:', error);
            return false;
        }
    }
    
    // Получение незавершённой сессии
    static getPendingSession() {
        try {
            const data = localStorage.getItem(this.PENDING_SESSION_KEY);
            if (!data) return null;
            
            const sessionData = JSON.parse(data);
            return sessionData;
        } catch (error) {
            console.error('Error getting pending session:', error);
            return null;
        }
    }
    
    // Удаление незавершённой сессии
    static removePendingSession() {
        try {
            localStorage.removeItem(this.PENDING_SESSION_KEY);
            return true;
        } catch (error) {
            console.error('Error removing pending session:', error);
            return false;
        }
    }
    
    // Кэширование списка доступных текстов
    static getCachedAvailableTexts() {
        try {
            const cached = localStorage.getItem(this.AVAILABLE_TEXTS_KEY);
            if (!cached) return null;
            
            const { data, timestamp } = JSON.parse(cached);
            // Проверяем срок действия кэша
            if (Date.now() - timestamp < this.CACHE_TTL) {
                return data;
            }
            
            // Кэш устарел, удаляем
            localStorage.removeItem(this.AVAILABLE_TEXTS_KEY);
            return null;
        } catch (error) {
            console.error('Error getting cached texts:', error);
            return null;
        }
    }
    
    // Сохранение списка доступных текстов в кэш
    static setCachedAvailableTexts(texts) {
        try {
            localStorage.setItem(this.AVAILABLE_TEXTS_KEY, JSON.stringify({
                data: texts,
                timestamp: Date.now()
            }));
            return true;
        } catch (error) {
            console.error('Error caching texts:', error);
            return false;
        }
    }
    
    // Очистка кэша
    static clearCache() {
        try {
            localStorage.removeItem(this.AVAILABLE_TEXTS_KEY);
            return true;
        } catch (error) {
            console.error('Error clearing cache:', error);
            return false;
        }
    }
}

// Экспорт для использования в других модулях
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TrainingStorage;
}

