/**
 * fragmentUtils.js - Утилиты для работы с фрагментами
 * Устраняет дублирование кода дедупликации и синхронизации (REF-07, REF-08, REF-09, REF-10)
 */

const FragmentUtils = {
    /**
     * Дедупликация фрагментов (REF-07)
     * Устраняет дубликаты по ключу: start_position-end_position-content
     * 
     * @param {Array} fragments - Массив фрагментов (любого формата)
     * @returns {Array} - Дедуплицированный и отсортированный массив
     */
    deduplicate(fragments) {
        if (!Array.isArray(fragments) || fragments.length === 0) {
            return [];
        }
        
        const seen = new Set();
        const unique = [];
        
        fragments.forEach(f => {
            // Универсальный ключ для любого формата
            const startPos = f.startPos || f.start_position || 0;
            const endPos = f.endPos || f.end_position || 0;
            const content = f.content || '';
            const key = `${startPos}-${endPos}-${content}`;
            
            if (!seen.has(key)) {
                seen.add(key);
                unique.push(f);
            }
        });
        
        // Сортируем по order или fragment_order
        unique.sort((a, b) => {
            const orderA = a.order || a.fragment_order || 0;
            const orderB = b.order || b.fragment_order || 0;
            return orderA - orderB;
        });
        
        console.log(`[FragmentUtils] Deduplicated: ${fragments.length} -> ${unique.length} fragments`);
        return unique;
    },
    
    /**
     * Синхронизация ассоциаций из БД в локальные фрагменты (REF-09)
     * Переносит emoji, custom_word, custom_image из dbFragments в localFragments
     * 
     * @param {Array} localFragments - Локальные фрагменты (textFragments)
     * @param {Array} dbFragments - Фрагменты из БД (currentFragments)
     * @returns {Array} - Массив объектов Fragment с синхронизированными ассоциациями
     */
    syncWithAssociations(localFragments, dbFragments) {
        if (!Array.isArray(localFragments)) {
            return [];
        }
        
        return localFragments.map(lf => {
            // Ищем соответствующий фрагмент в БД по ID или по содержимому
            const dbMatch = dbFragments.find(df => 
                (lf.id && df.id === lf.id) || 
                (df.content === lf.content && 
                 (df.start_position === lf.startPos || df.start_position === lf.start_position) &&
                 (df.end_position === lf.endPos || df.end_position === lf.end_position))
            );
            
            // Создаём Fragment с ассоциациями из БД
            return new Fragment({
                ...lf,
                emoji: dbMatch?.emoji || null,
                customWord: dbMatch?.custom_word || null,
                customImage: dbMatch?.custom_image || null
            });
        });
    },
    
    /**
     * Валидация фрагментов перед сохранением
     * 
     * @param {Array} fragments - Массив фрагментов
     * @returns {Object} - { valid: boolean, errors: Array }
     */
    validate(fragments) {
        const errors = [];
        
        if (!Array.isArray(fragments)) {
            return { valid: false, errors: ['Fragments must be an array'] };
        }
        
        if (fragments.length === 0) {
            return { valid: false, errors: ['At least one fragment is required'] };
        }
        
        // Проверяем последовательность order
        const orders = fragments.map(f => f.order || f.fragment_order || 0);
        const expectedOrders = Array.from({length: fragments.length}, (_, i) => i + 1);
        const sortedOrders = [...orders].sort((a, b) => a - b);
        
        if (JSON.stringify(sortedOrders) !== JSON.stringify(expectedOrders)) {
            errors.push(`Invalid fragment order: expected [${expectedOrders}], got [${sortedOrders}]`);
        }
        
        // Проверяем позиции
        fragments.forEach((f, i) => {
            const startPos = f.startPos || f.start_position || 0;
            const endPos = f.endPos || f.end_position || 0;
            
            if (startPos >= endPos) {
                errors.push(`Fragment ${i + 1}: startPos (${startPos}) must be < endPos (${endPos})`);
            }
            
            if (!f.content || f.content.trim() === '') {
                errors.push(`Fragment ${i + 1}: content is empty`);
            }
        });
        
        return {
            valid: errors.length === 0,
            errors
        };
    },
    
    /**
     * Пересчёт порядковых номеров фрагментов
     * 
     * @param {Array} fragments - Массив фрагментов
     * @returns {Array} - Фрагменты с обновлёнными порядковыми номерами
     */
    reorder(fragments) {
        if (!Array.isArray(fragments)) {
            return [];
        }
        
        fragments.forEach((f, i) => {
            if (f.order !== undefined) {
                f.order = i + 1;
            }
            if (f.fragment_order !== undefined) {
                f.fragment_order = i + 1;
            }
        });
        
        return fragments;
    },
    
    /**
     * Конвертация массива Fragment в формат БД
     * 
     * @param {Array} fragments - Массив объектов Fragment
     * @returns {Array} - Массив в формате БД
     */
    toDBFormat(fragments) {
        if (!Array.isArray(fragments)) {
            return [];
        }
        
        return fragments.map(f => {
            if (f instanceof Fragment) {
                return f.toDBFormat();
            }
            return {
                id: f.id || null,
                order: f.order || f.fragment_order || 0,
                content: f.content || '',
                startPos: f.startPos || f.start_position || 0,
                endPos: f.endPos || f.end_position || 0,
                emoji: f.emoji || null,
                customWord: f.custom_word || f.customWord || null,
                customImage: f.custom_image || f.customImage || null
            };
        });
    },
    
    /**
     * Конвертация массива Fragment в формат сервера
     * 
     * @param {Array} fragments - Массив объектов Fragment
     * @returns {Array} - Массив в формате сервера
     */
    toServerFormat(fragments) {
        if (!Array.isArray(fragments)) {
            return [];
        }
        
        return fragments.map(f => {
            if (f instanceof Fragment) {
                return f.toServerFormat();
            }
            return {
                id: f.id || null,
                fragment_order: f.order || f.fragment_order || 0,
                content: f.content || '',
                start_position: f.startPos || f.start_position || 0,
                end_position: f.endPos || f.end_position || 0,
                emoji: f.emoji || null,
                custom_word: f.custom_word || f.customWord || null,
                custom_image: f.custom_image || f.customImage || null
            };
        });
    },
    
    /**
     * Поиск фрагмента по ID или содержимому
     * 
     * @param {Array} fragments - Массив фрагментов
     * @param {Object} criteria - Критерии поиска {id?, content?, startPos?, endPos?}
     * @returns {Object|null} - Найденный фрагмент или null
     */
    find(fragments, criteria) {
        if (!Array.isArray(fragments) || !criteria) {
            return null;
        }
        
        return fragments.find(f => {
            if (criteria.id && f.id === criteria.id) {
                return true;
            }
            
            if (criteria.content && f.content === criteria.content) {
                const startPos = f.startPos || f.start_position || 0;
                const endPos = f.endPos || f.end_position || 0;
                
                if (criteria.startPos !== undefined && startPos !== criteria.startPos) {
                    return false;
                }
                if (criteria.endPos !== undefined && endPos !== criteria.endPos) {
                    return false;
                }
                
                return true;
            }
            
            return false;
        });
    }
};

// Экспорт для использования в других модулях
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FragmentUtils;
}


