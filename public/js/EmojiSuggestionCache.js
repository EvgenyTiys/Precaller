/**
 * Кэш для предложений эмодзи
 * Сокращает количество запросов к серверу при повторной обработке фрагментов
 */

class EmojiSuggestionCache {
    constructor() {
        this.cache = new Map();
        this.ttl = 30 * 60 * 1000; // 30 минут
        
        // Запускаем периодическую очистку
        this.startCleanup();
    }
    
    /**
     * Создает ключ для кэша
     */
    getKey(text, language) {
        return `${language}:${text.toLowerCase().trim()}`;
    }
    
    /**
     * Получить эмодзи из кэша
     */
    get(text, language) {
        const key = this.getKey(text, language);
        const cached = this.cache.get(key);
        
        if (!cached) {
            return null;
        }
        
        // Проверяем срок годности
        if (Date.now() - cached.timestamp > this.ttl) {
            this.cache.delete(key);
            return null;
        }
        
        console.log(`[CACHE] Hit for "${text}" (${language})`);
        return cached.emojis;
    }
    
    /**
     * Сохранить эмодзи в кэш
     */
    set(text, language, emojis) {
        const key = this.getKey(text, language);
        this.cache.set(key, {
            emojis: emojis,
            timestamp: Date.now(),
            text: text,
            language: language
        });
        console.log(`[CACHE] Stored for "${text}" (${language}), ${emojis.length} emojis`);
    }
    
    /**
     * Очистить кэш
     */
    clear() {
        this.cache.clear();
        console.log(`[CACHE] Cleared`);
    }
    
    /**
     * Удалить конкретный элемент
     */
    delete(text, language) {
        const key = this.getKey(text, language);
        const deleted = this.cache.delete(key);
        if (deleted) {
            console.log(`[CACHE] Deleted for "${text}" (${language})`);
        }
        return deleted;
    }
    
    /**
     * Получить статистику кэша
     */
    getStats() {
        const now = Date.now();
        let valid = 0;
        let expired = 0;
        
        for (const [key, value] of this.cache.entries()) {
            if (now - value.timestamp > this.ttl) {
                expired++;
            } else {
                valid++;
            }
        }
        
        return {
            total: this.cache.size,
            valid: valid,
            expired: expired,
            ttl: this.ttl
        };
    }
    
    /**
     * Запустить периодическую очистку устаревших записей
     */
    startCleanup() {
        // Очистка каждые 10 минут
        this.cleanupInterval = setInterval(() => {
            this.cleanup();
        }, 10 * 60 * 1000);
    }
    
    /**
     * Остановить очистку
     */
    stopCleanup() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
        }
    }
    
    /**
     * Очистить устаревшие записи
     */
    cleanup() {
        const now = Date.now();
        let removed = 0;
        
        for (const [key, value] of this.cache.entries()) {
            if (now - value.timestamp > this.ttl) {
                this.cache.delete(key);
                removed++;
            }
        }
        
        if (removed > 0) {
            console.log(`[CACHE] Cleanup: removed ${removed} expired entries`);
        }
    }
    
    /**
     * Получить размер кэша
     */
    size() {
        return this.cache.size;
    }
    
    /**
     * Проверить, есть ли элемент в кэше
     */
    has(text, language) {
        return this.get(text, language) !== null;
    }
}

// Создаем глобальный экземпляр
if (typeof window !== 'undefined') {
    window.emojiSuggestionCache = new EmojiSuggestionCache();
    
    // Очистка при закрытии страницы
    window.addEventListener('beforeunload', () => {
        if (window.emojiSuggestionCache) {
            window.emojiSuggestionCache.stopCleanup();
        }
    });
}

// Экспорт для использования в модулях
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EmojiSuggestionCache;
}


