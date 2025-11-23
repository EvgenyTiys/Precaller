/**
 * fragmentAPI.js - API для работы с фрагментами (REF-05)
 * Централизует все запросы к серверу
 */

const FragmentAPI = {
    /**
     * Загрузка текста и фрагментов с использованием кэша
     * 
     * @param {string} textId - ID текста
     * @param {boolean} forceReload - Принудительная перезагрузка без кэша
     * @returns {Promise<Object>} - {text, fragments, route}
     */
    async loadText(textId, forceReload = false) {
        // Проверяем кэш
        if (!forceReload) {
            const cached = fragmentCache.get(textId);
            if (cached) {
                console.log(`[FragmentAPI] Using cached data for textId: ${textId}`);
                return cached;
            }
        }
        
        try {
            // Получаем ETag для условного запроса
            const etag = fragmentCache.getETag(textId);
            const headers = etag ? { 'If-None-Match': etag } : {};
            
            const response = await window.app.apiRequest(`/api/wizard/text/${textId}`, {
                headers
            });
            
            // Кэшируем результат
            const data = {
                text: response.text,
                fragments: response.fragments || [],
                route: response.route || null
            };
            
            // Извлекаем ETag из заголовков если есть
            const responseETag = response.etag || null;
            fragmentCache.set(textId, data, responseETag);
            
            console.log(`[FragmentAPI] Loaded and cached textId: ${textId}`);
            return data;
        } catch (error) {
            // Если 304 Not Modified - используем кэш
            if (error.status === 304) {
                const cached = fragmentCache.get(textId);
                if (cached) {
                    console.log(`[FragmentAPI] Using cached data (304 Not Modified)`);
                    return cached;
                }
            }
            
            throw error;
        }
    },
    
    /**
     * Сохранение фрагментов
     * 
     * @param {string} textId - ID текста
     * @param {Array} fragments - Массив фрагментов
     * @returns {Promise<Object>} - Результат сохранения
     */
    async saveFragments(textId, fragments) {
        try {
            const response = await window.app.apiRequest(`/api/texts/${textId}/fragments`, {
                method: 'POST',
                body: JSON.stringify({ fragments })
            });
            
            // Инвалидируем кэш после сохранения
            fragmentCache.invalidate(textId);
            
            console.log(`[FragmentAPI] Saved ${fragments.length} fragments for textId: ${textId}`);
            return response;
        } catch (error) {
            console.error(`[FragmentAPI] Save failed for textId: ${textId}`, error);
            throw error;
        }
    },
    
    /**
     * Обновление ассоциации фрагмента
     * 
     * @param {number} fragmentId - ID фрагмента
     * @param {Object} association - {emoji?, customWord?, customImage?}
     * @returns {Promise<Object>} - Результат обновления
     */
    async updateAssociation(fragmentId, association) {
        try {
            const response = await window.app.apiRequest('/api/wizard/associate', {
                method: 'POST',
                body: JSON.stringify({
                    fragmentId,
                    ...association
                })
            });
            
            console.log(`[FragmentAPI] Updated association for fragmentId: ${fragmentId}`);
            return response;
        } catch (error) {
            console.error(`[FragmentAPI] Association update failed for fragmentId: ${fragmentId}`, error);
            throw error;
        }
    },
    
    /**
     * Обновление содержимого фрагмента
     * 
     * @param {number} fragmentId - ID фрагмента
     * @param {string} content - Новое содержимое
     * @returns {Promise<Object>} - Результат обновления
     */
    async updateFragmentContent(fragmentId, content) {
        try {
            const response = await window.app.apiRequest('/api/wizard/fragment/update', {
                method: 'POST',
                body: JSON.stringify({
                    fragmentId,
                    content
                })
            });
            
            console.log(`[FragmentAPI] Updated content for fragmentId: ${fragmentId}`);
            return response;
        } catch (error) {
            console.error(`[FragmentAPI] Content update failed for fragmentId: ${fragmentId}`, error);
            throw error;
        }
    },
    
    /**
     * Сохранение маршрута
     * 
     * @param {string} textId - ID текста
     * @param {string} routeDescription - Описание маршрута
     * @returns {Promise<Object>} - Результат сохранения
     */
    async saveRoute(textId, routeDescription) {
        try {
            const response = await window.app.apiRequest('/api/wizard/route', {
                method: 'POST',
                body: JSON.stringify({
                    textId,
                    routeDescription
                })
            });
            
            // Инвалидируем кэш после сохранения маршрута
            fragmentCache.invalidate(textId);
            
            console.log(`[FragmentAPI] Saved route for textId: ${textId}`);
            return response;
        } catch (error) {
            console.error(`[FragmentAPI] Route save failed for textId: ${textId}`, error);
            throw error;
        }
    },
    
    /**
     * Batch обновление ассоциаций (REF-13)
     * Сохранение нескольких ассоциаций одним запросом
     * 
     * @param {Array} associations - [{fragmentId, emoji?, customWord?, customImage?}, ...]
     * @returns {Promise<Object>} - Результат обновления
     */
    async batchUpdateAssociations(associations) {
        try {
            const response = await window.app.apiRequest('/api/wizard/batch-associate', {
                method: 'POST',
                body: JSON.stringify({ associations })
            });
            
            console.log(`[FragmentAPI] Batch updated ${associations.length} associations`);
            return response;
        } catch (error) {
            // Если batch endpoint не существует, падаем на индивидуальные запросы
            if (error.status === 404) {
                console.warn('[FragmentAPI] Batch endpoint not available, falling back to individual requests');
                const results = [];
                
                for (const assoc of associations) {
                    const { fragmentId, ...data } = assoc;
                    try {
                        const result = await this.updateAssociation(fragmentId, data);
                        results.push(result);
                    } catch (err) {
                        console.error(`[FragmentAPI] Failed to update fragmentId: ${fragmentId}`, err);
                    }
                }
                
                return { success: true, results };
            }
            
            throw error;
        }
    }
};

// Экспорт для использования в других модулях
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FragmentAPI;
}


