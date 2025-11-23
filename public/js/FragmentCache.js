/**
 * FragmentCache - Кэширование фрагментов на клиенте (REF-11)
 * Сокращает количество запросов к серверу
 */
class FragmentCache {
    constructor(ttl = 5 * 60 * 1000) { // 5 минут по умолчанию
        this.cache = new Map();
        this.ttl = ttl;
        this.etags = new Map(); // Хранение ETag для условных запросов
    }
    
    /**
     * Получение данных из кэша
     * 
     * @param {string} textId - ID текста
     * @returns {Object|null} - Кэшированные данные или null
     */
    get(textId) {
        const cached = this.cache.get(textId);
        
        if (!cached) {
            console.log(`[FragmentCache] Miss for textId: ${textId}`);
            return null;
        }
        
        // Проверяем TTL
        if (Date.now() - cached.timestamp > this.ttl) {
            console.log(`[FragmentCache] Expired for textId: ${textId}`);
            this.cache.delete(textId);
            this.etags.delete(textId);
            return null;
        }
        
        console.log(`[FragmentCache] Hit for textId: ${textId}`);
        return cached.data;
    }
    
    /**
     * Сохранение данных в кэш
     * 
     * @param {string} textId - ID текста
     * @param {Object} data - Данные для кэширования
     * @param {string} etag - ETag для условных запросов (опционально)
     */
    set(textId, data, etag = null) {
        this.cache.set(textId, {
            data,
            timestamp: Date.now()
        });
        
        if (etag) {
            this.etags.set(textId, etag);
        }
        
        console.log(`[FragmentCache] Cached textId: ${textId}, etag: ${etag || 'none'}`);
    }
    
    /**
     * Инвалидация кэша для конкретного текста
     * 
     * @param {string} textId - ID текста
     */
    invalidate(textId) {
        const deleted = this.cache.delete(textId);
        this.etags.delete(textId);
        
        if (deleted) {
            console.log(`[FragmentCache] Invalidated textId: ${textId}`);
        }
    }
    
    /**
     * Получение ETag для условного запроса
     * 
     * @param {string} textId - ID текста
     * @returns {string|null} - ETag или null
     */
    getETag(textId) {
        return this.etags.get(textId) || null;
    }
    
    /**
     * Полная очистка кэша
     */
    clear() {
        const size = this.cache.size;
        this.cache.clear();
        this.etags.clear();
        console.log(`[FragmentCache] Cleared ${size} entries`);
    }
    
    /**
     * Получение размера кэша
     * 
     * @returns {number} - Количество элементов в кэше
     */
    size() {
        return this.cache.size;
    }
    
    /**
     * Проверка наличия данных в кэше
     * 
     * @param {string} textId - ID текста
     * @returns {boolean} - true если данные в кэше и актуальны
     */
    has(textId) {
        return this.get(textId) !== null;
    }
    
    /**
     * Автоматическая очистка устаревших записей
     */
    cleanup() {
        const now = Date.now();
        let cleaned = 0;
        
        for (const [textId, cached] of this.cache.entries()) {
            if (now - cached.timestamp > this.ttl) {
                this.cache.delete(textId);
                this.etags.delete(textId);
                cleaned++;
            }
        }
        
        if (cleaned > 0) {
            console.log(`[FragmentCache] Cleaned up ${cleaned} expired entries`);
        }
    }
    
    /**
     * Обновление данных в кэше без изменения timestamp
     * Используется при частичных обновлениях (например, ассоциаций)
     * 
     * @param {string} textId - ID текста
     * @param {Function} updateFn - Функция обновления: (oldData) => newData
     */
    update(textId, updateFn) {
        const cached = this.cache.get(textId);
        
        if (!cached) {
            console.warn(`[FragmentCache] Cannot update - no cache for textId: ${textId}`);
            return false;
        }
        
        try {
            cached.data = updateFn(cached.data);
            console.log(`[FragmentCache] Updated textId: ${textId}`);
            return true;
        } catch (error) {
            console.error(`[FragmentCache] Update failed for textId: ${textId}`, error);
            return false;
        }
    }
    
    /**
     * Продление времени жизни записи в кэше
     * 
     * @param {string} textId - ID текста
     */
    touch(textId) {
        const cached = this.cache.get(textId);
        
        if (cached) {
            cached.timestamp = Date.now();
            console.log(`[FragmentCache] Touched textId: ${textId}`);
        }
    }
}

// Глобальный экземпляр кэша
const fragmentCache = new FragmentCache();

// Автоматическая очистка каждые 10 минут
setInterval(() => {
    fragmentCache.cleanup();
}, 10 * 60 * 1000);

// Экспорт для использования в других модулях
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { FragmentCache, fragmentCache };
}


