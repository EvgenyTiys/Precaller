const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { findEmojisForText: findEmojisForTextOld, getRandomEmojis } = require('../models/emojiDatabase');
const { 
    getCategories, 
    getEmojisByCategory, 
    searchEmojis, 
    getRandomEmojis: getRandomEmojisMart,
    getEmojisWithTranslations 
} = require('../models/emojiMartDatabase');
// Функции перевода/поиска для de будут подгружаться динамически с инвалидацией кэша
const router = express.Router();

// Сохранение маршрута пользователя (Шаг 1)
router.post('/route', authenticateToken, (req, res) => {
    try {
        const { textId, routeDescription } = req.body;
        const userId = req.user.id;

        if (!textId) {
            return res.status(400).json({ error: 'ID текста обязателен' });
        }

        // Проверяем доступ к тексту
        req.db.getTextById(textId, (err, text) => {
            if (err || !text || text.user_id !== userId) {
                return res.status(403).json({ error: 'Нет доступа к этому тексту' });
            }

            // Используем переданное описание или стандартное
            const finalDescription = routeDescription || 'Маршрут представлен в голове пользователя';

            req.db.createRoute(userId, textId, finalDescription, (err, routeId) => {
                if (err) {
                    console.error('Ошибка сохранения маршрута:', err);
                    return res.status(500).json({ error: 'Ошибка сохранения маршрута' });
                }

                res.json({ 
                    message: 'Маршрут успешно сохранён',
                    routeId 
                });
            });
        });
    } catch (error) {
        console.error('Ошибка сохранения маршрута:', error);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});

// Получение смайликов для фрагмента (Шаг 3)
router.post('/emojis', authenticateToken, async (req, res) => {
    try {
        const { fragmentText, language = 'ru' } = req.body;

        if (!fragmentText) {
            return res.status(400).json({ error: 'Текст фрагмента обязателен' });
        }

        // Поиск смайликов для текста с новым алгоритмом
        let emojis = [];
        try {
            delete require.cache[require.resolve('../models/offlineTranslationService')];
        } catch (e) {}
        const { findEmojisForText: findEmojisByTranslation } = require('../models/offlineTranslationService');
        emojis = await findEmojisByTranslation(fragmentText, 10);
        
        // Если ничего не найдено, добавляем случайные смайлики
        if (emojis.length === 0) {
            emojis = getRandomEmojis(5);
        }

        res.json({ emojis });
    } catch (error) {
        console.error('Ошибка поиска смайликов:', error);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});

// Сохранение ассоциации фрагмента со смайликом/изображением/словом
router.post('/associate', authenticateToken, (req, res) => {
    try {
        const { fragmentId, emoji, customImage, customWord } = req.body;
        console.log('=== ASSOCIATE REQUEST ===');
        console.log('Fragment ID:', fragmentId);
        console.log('Emoji:', emoji);
        console.log('Custom Image length:', customImage ? customImage.length : 0);
        console.log('Custom Word:', customWord);
        console.log('User ID:', req.user.id);

        if (!fragmentId) {
            console.log('ERROR: Fragment ID missing');
            return res.status(400).json({ error: 'ID фрагмента обязателен' });
        }

        if (!emoji && !customImage && !customWord) {
            console.log('ERROR: No association data provided');
            return res.status(400).json({ error: 'Необходимо выбрать смайлик, изображение или ввести слово' });
        }

        // Сначала проверим, существует ли фрагмент
        req.db.getFragmentById(fragmentId, (err, fragment) => {
            if (err) {
                console.error('ERROR: Database error getting fragment:', err);
                return res.status(500).json({ error: 'Ошибка получения фрагмента' });
            }

            if (!fragment) {
                console.error('ERROR: Fragment not found with ID:', fragmentId);
                return res.status(404).json({ error: 'Фрагмент не найден' });
            }

            console.log('SUCCESS: Fragment found:', {
                id: fragment.id,
                content: fragment.content ? fragment.content.substring(0, 50) + '...' : 'no content',
                text_id: fragment.text_id
            });

            req.db.updateFragmentAssociation(fragmentId, emoji, customImage, customWord, (err) => {
                if (err) {
                    console.error('ERROR: Failed to save association:', err);
                    return res.status(500).json({ error: 'Ошибка сохранения ассоциации' });
                }

                console.log('SUCCESS: Association saved for fragment:', fragmentId);
                console.log('=== ASSOCIATE REQUEST COMPLETE ===');
                res.json({ message: 'Ассоциация успешно сохранена' });
            });
        });
    } catch (error) {
        console.error('ERROR: Exception in associate route:', error);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});

// Обновление текста фрагмента и сброс ассоциаций
router.post('/fragment/update', authenticateToken, (req, res) => {
    try {
        const { fragmentId, content } = req.body;
        const userId = req.user.id;

        if (!fragmentId || !content || !content.trim()) {
            return res.status(400).json({ error: 'ID фрагмента и новый текст обязательны' });
        }

        // Проверяем, что фрагмент существует и принадлежит пользователю через текст
        req.db.getFragmentById(fragmentId, (err, fragment) => {
            if (err || !fragment) {
                return res.status(404).json({ error: 'Фрагмент не найден' });
            }

            req.db.getTextById(fragment.text_id, (err2, text) => {
                if (err2 || !text || text.user_id !== userId) {
                    return res.status(403).json({ error: 'Нет доступа к этому фрагменту' });
                }

                req.db.updateFragmentContent(fragmentId, content.trim(), (err3) => {
                    if (err3) {
                        console.error('Ошибка обновления фрагмента:', err3);
                        return res.status(500).json({ error: 'Ошибка обновления фрагмента' });
                    }
                    return res.json({ message: 'Фрагмент обновлён' });
                });
            });
        });
    } catch (error) {
        console.error('Ошибка обновления фрагмента:', error);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});

// Получение всех смайликов из базы данных для выбора
router.get('/all-emojis', authenticateToken, (req, res) => {
    try {
        const { emojiDatabase } = require('../models/emojiDatabase');
        const { language = 'ru' } = req.query;
        
        const allEmojis = Object.entries(emojiDatabase).map(([emoji, translations]) => ({
            emoji,
            translations: translations[language] || translations.ru
        }));

        res.json({ emojis: allEmojis });
    } catch (error) {
        console.error('Ошибка получения смайликов:', error);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});

// Получение категорий эмодзи (временно без аутентификации для тестирования)
router.get('/categories', (req, res) => {
    try {
        const categories = getCategories();
        res.json({ categories });
    } catch (error) {
        console.error('Ошибка получения категорий:', error);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});

// Получение эмодзи по категории (временно без аутентификации для тестирования)
router.get('/emojis/category/:categoryId', (req, res) => {
    try {
        const { categoryId } = req.params;
        const emojis = getEmojisByCategory(categoryId);
        res.json({ emojis });
    } catch (error) {
        console.error('Ошибка получения эмодзи по категории:', error);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});

// Поиск эмодзи (поддержка ru/en через разные источники)
router.get('/emojis/search', async (req, res) => {
    try {
        const { q, language = 'ru' } = req.query;
        
        if (!q) {
            return res.status(400).json({ error: 'Поисковый запрос обязателен' });
        }

        let results = [];
        const isCyrillic = /[А-Яа-яЁё]/.test(q);
        const lang = isCyrillic ? 'ru' : (language || 'en').toLowerCase();
        console.log(`[emoji-search] q="${q}" lang=${lang} isCyrillic=${isCyrillic}`);

        if (lang === 'ru') {
            // Прямой поиск: сначала через findEmojisForText (ru), затем фолбэк подстроками
            // Обновляем кэш модуля, чтобы подхватывались свежие изменения без рестарта
            try {
                delete require.cache[require.resolve('../models/emojiDatabase')];
            } catch (e) {}
            const { emojiDatabase, findEmojisForText } = require('../models/emojiDatabase');
            const needle = (q || '').toLowerCase().trim();
            let ruList = [];

            try {
                const direct = findEmojisForText(needle, 'ru', 50) || [];
                ruList = direct.map(item => ({
                    id: item.emoji,
                    name: (item.translations && item.translations[0]) ? item.translations[0] : 'emoji',
                    native: item.emoji,
                    keywords: item.translations || [],
                    category: 'misc'
                }));
                console.log(`[emoji-search][ru] direct=${direct.length}`);
            } catch(e) {
                console.error('[emoji-search] findEmojisForText error:', e.message);
            }

            let fallbackAdds = 0;
            for (const [emoji, tr] of Object.entries(emojiDatabase)) {
                const ruWords = (tr && tr.ru) ? tr.ru : [];
                if (ruWords.some(w => {
                    const ww = (w || '').toLowerCase();
                    return ww.includes(needle) || needle.includes(ww);
                })) {
                    ruList.push({
                        id: emoji,
                        name: ruWords[0] || 'emoji',
                        native: emoji,
                        keywords: ruWords,
                        category: tr.category || 'misc'
                    });
                    fallbackAdds++;
                }
            }
            console.log(`[emoji-search][ru] fallbackAdds=${fallbackAdds}`);

            // Дополнительный фолбэк: простая карта ru->en для Emoji Mart (частные случаи)
            if (ruList.length === 0) {
                const ruToEn = {
                    'ванна': 'bathtub',
                    'ванная': 'bathtub',
                    'баня': 'bath',
                    'купание': 'bath'
                };
                const mapped = ruToEn[needle];
                if (mapped) {
                    const mart = searchEmojis(mapped, 'en');
                    if (Array.isArray(mart) && mart.length) {
                        console.log(`[emoji-search][ru] ru->en fallback for "${needle}" -> "${mapped}", mart=${mart.length}`);
                        ruList = ruList.concat(mart);
                    }
                }
            }

            results = ruList.slice(0, 50);
        } else if (lang === 'de') {
            // Немецкий — используем переводческий сервис + всегда добавляем прямой поиск по Emoji Mart (en)
            try {
                delete require.cache[require.resolve('../models/offlineTranslationService')];
            } catch (e) {}
            const { findEmojisForText: findEmojisByTranslation } = require('../models/offlineTranslationService');
            const emojis = await findEmojisByTranslation(q, 24);
            results = emojis.map(e => ({
                id: e.id || e.native || e.emoji || e.name,
                name: e.name || 'emoji',
                native: e.native || e.emoji || '❓',
                keywords: e.keywords || [],
                category: e.category || 'misc'
            }));

            // Добавляем результаты прямого поиска по Emoji Mart (англ.) для повышения отзывчивости
            const mart = searchEmojis(q, 'en');
            if (Array.isArray(mart) && mart.length) {
                results = results.concat(mart);
            }
        } else {
            // Английский и прочие языки — прямой поиск по Emoji Mart
            results = searchEmojis(q, 'en');
        }

        // Дедупликация результатов по native/id
        const seen = new Set();
        const deduped = [];
        for (const e of results) {
            const key = (e && (e.native || e.id || e.emoji)) || '';
            if (!seen.has(key)) {
                seen.add(key);
                deduped.push(e);
            }
        }
        console.log(`[emoji-search] results=${results.length} deduped=${deduped.length}`);
        res.json({ emojis: deduped });
    } catch (error) {
        console.error('Ошибка поиска эмодзи:', error);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});

// Получение всех эмодзи с категориями (для новой системы)
router.get('/emojis/all', authenticateToken, (req, res) => {
    try {
        const { categoryId } = req.query;
        const emojis = getEmojisWithTranslations(categoryId);
        res.json({ emojis });
    } catch (error) {
        console.error('Ошибка получения всех эмодзи:', error);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});

// Получение данных для мастера по конкретному тексту
router.get('/text/:id', authenticateToken, (req, res) => {
    try {
        const textId = req.params.id;
        const userId = req.user.id;

        req.db.getTextById(textId, (err, text) => {
            if (err) {
                console.error('Ошибка получения текста:', err);
                return res.status(500).json({ error: 'Ошибка получения текста' });
            }

            if (!text || text.user_id !== userId) {
                return res.status(403).json({ error: 'Нет доступа к этому тексту' });
            }

            // Получаем фрагменты
            req.db.getFragmentsByTextId(textId, (err, fragments) => {
                if (err) {
                    console.error('Ошибка получения фрагментов:', err);
                    return res.status(500).json({ error: 'Ошибка получения фрагментов' });
                }

                // Получаем маршрут
                req.db.getRouteByTextId(textId, (err, route) => {
                    if (err) {
                        console.error('Ошибка получения маршрута:', err);
                        return res.status(500).json({ error: 'Ошибка получения маршрута' });
                    }

                    res.json({ 
                        text, 
                        fragments, 
                        route: route || null 
                    });
                });
            });
        });
    } catch (error) {
        console.error('Ошибка получения данных мастера:', error);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});

// API для поиска эмодзи по переведенному тексту
router.get('/emojis/translate', async (req, res) => {
    try {
        const { text, maxEmojis = 10 } = req.query;
        
        if (!text) {
            return res.status(400).json({ error: 'Текст для поиска обязателен' });
        }
        
        console.log(`Searching emojis for text: "${text}"`);
        try {
            delete require.cache[require.resolve('../models/offlineTranslationService')];
        } catch (e) {}
        const { findEmojisForText: findEmojisByTranslation } = require('../models/offlineTranslationService');
        const emojis = await findEmojisByTranslation(text, parseInt(maxEmojis));
        
        res.json({
            success: true,
            text: text,
            emojis: emojis,
            count: emojis.length
        });
        
    } catch (error) {
        console.error('Ошибка поиска эмодзи по переводу:', error);
        res.status(500).json({ 
            error: 'Ошибка поиска эмодзи', 
            details: error.message 
        });
    }
});

module.exports = router;