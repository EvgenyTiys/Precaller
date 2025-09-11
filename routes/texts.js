const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// Загрузка нового текста
router.post('/upload', authenticateToken, (req, res) => {
    try {
        const { title, content, language = 'ru' } = req.body;
        const userId = req.user.id;

        if (!title || !content) {
            return res.status(400).json({ error: 'Название и содержимое текста обязательны' });
        }

        req.db.createText(userId, title, content, language, (err, textId) => {
            if (err) {
                console.error('Ошибка создания текста:', err);
                return res.status(500).json({ error: 'Ошибка сохранения текста' });
            }

            res.status(201).json({
                message: 'Текст успешно загружен',
                textId,
                title,
                language
            });
        });
    } catch (error) {
        console.error('Ошибка загрузки текста:', error);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});

// Получение всех текстов пользователя
router.get('/', authenticateToken, (req, res) => {
    try {
        const userId = req.user.id;

        req.db.getTextsByUserId(userId, (err, texts) => {
            if (err) {
                console.error('Ошибка получения текстов:', err);
                return res.status(500).json({ error: 'Ошибка получения текстов' });
            }

            res.json({ texts });
        });
    } catch (error) {
        console.error('Ошибка получения текстов:', error);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});

// Получение конкретного текста
router.get('/:id', authenticateToken, (req, res) => {
    try {
        const textId = req.params.id;

        req.db.getTextById(textId, (err, text) => {
            if (err) {
                console.error('Ошибка получения текста:', err);
                return res.status(500).json({ error: 'Ошибка получения текста' });
            }

            if (!text) {
                return res.status(404).json({ error: 'Текст не найден' });
            }

            // Проверяем, что текст принадлежит пользователю
            if (text.user_id !== req.user.id) {
                return res.status(403).json({ error: 'Нет доступа к этому тексту' });
            }

            // Получаем фрагменты текста
            req.db.getFragmentsByTextId(textId, (err, fragments) => {
                if (err) {
                    console.error('Ошибка получения фрагментов:', err);
                    return res.status(500).json({ error: 'Ошибка получения фрагментов' });
                }

                res.json({ text, fragments });
            });
        });
    } catch (error) {
        console.error('Ошибка получения текста:', error);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});

// Сохранение фрагментов текста
router.post('/:id/fragments', authenticateToken, (req, res) => {
    try {
        const textId = req.params.id;
        const { fragments } = req.body;

        if (!fragments || !Array.isArray(fragments)) {
            return res.status(400).json({ error: 'Неверный формат фрагментов' });
        }

        // Проверяем доступ к тексту
        req.db.getTextById(textId, (err, text) => {
            if (err || !text || text.user_id !== req.user.id) {
                return res.status(403).json({ error: 'Нет доступа к этому тексту' });
            }

            // Сохраняем фрагменты
            let savedCount = 0;
            const totalFragments = fragments.length;

            if (totalFragments === 0) {
                return res.json({ message: 'Фрагменты сохранены', count: 0 });
            }

            fragments.forEach((fragment, index) => {
                req.db.createFragment(
                    textId,
                    index + 1,
                    fragment.content,
                    fragment.startPos,
                    fragment.endPos,
                    (err, fragmentId) => {
                        savedCount++;
                        
                        if (savedCount === totalFragments) {
                            res.json({ 
                                message: 'Фрагменты успешно сохранены',
                                count: totalFragments 
                            });
                        }
                    }
                );
            });
        });
    } catch (error) {
        console.error('Ошибка сохранения фрагментов:', error);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});

module.exports = router;