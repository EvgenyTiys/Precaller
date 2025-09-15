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
const { findEmojisForText: findEmojisByTranslation } = require('../models/offlineTranslationService');
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
        let emojis = await findEmojisByTranslation(fragmentText, 10);
        
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

        if (!fragmentId) {
            return res.status(400).json({ error: 'ID фрагмента обязателен' });
        }

        if (!emoji && !customImage && !customWord) {
            return res.status(400).json({ error: 'Необходимо выбрать смайлик, изображение или ввести слово' });
        }

        req.db.updateFragmentAssociation(fragmentId, emoji, customImage, customWord, (err) => {
            if (err) {
                console.error('Ошибка сохранения ассоциации:', err);
                return res.status(500).json({ error: 'Ошибка сохранения ассоциации' });
            }

            res.json({ message: 'Ассоциация успешно сохранена' });
        });
    } catch (error) {
        console.error('Ошибка сохранения ассоциации:', error);
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

// Поиск эмодзи (временно без аутентификации для тестирования)
router.get('/emojis/search', (req, res) => {
    try {
        const { q, language = 'ru' } = req.query;
        
        if (!q) {
            return res.status(400).json({ error: 'Поисковый запрос обязателен' });
        }
        
        const emojis = searchEmojis(q, language);
        res.json({ emojis });
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