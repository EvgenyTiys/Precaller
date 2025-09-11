const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// Получение данных для тренировки конкретного текста
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

            // Получаем фрагменты с ассоциациями
            req.db.getFragmentsByTextId(textId, (err, fragments) => {
                if (err) {
                    console.error('Ошибка получения фрагментов:', err);
                    return res.status(500).json({ error: 'Ошибка получения фрагментов' });
                }

                // Проверяем, что все фрагменты имеют ассоциации
                const incompleteFragments = fragments.filter(f => !f.emoji && !f.custom_image && !f.custom_word);
                
                if (incompleteFragments.length > 0) {
                    return res.status(400).json({ 
                        error: 'Не все фрагменты имеют ассоциации. Завершите настройку в мастере.',
                        incompleteFragments: incompleteFragments.map(f => f.id)
                    });
                }

                res.json({ 
                    text, 
                    fragments: fragments.map(fragment => ({
                        id: fragment.id,
                        content: fragment.content,
                        order: fragment.fragment_order,
                        emoji: fragment.emoji,
                        customImage: fragment.custom_image,
                        customWord: fragment.custom_word,
                        association: fragment.emoji || fragment.custom_image || fragment.custom_word
                    }))
                });
            });
        });
    } catch (error) {
        console.error('Ошибка получения данных тренировки:', error);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});

// Получение списка всех готовых для тренировки текстов пользователя
router.get('/available', authenticateToken, (req, res) => {
    try {
        const userId = req.user.id;

        req.db.getTextsByUserId(userId, (err, texts) => {
            if (err) {
                console.error('Ошибка получения текстов:', err);
                return res.status(500).json({ error: 'Ошибка получения текстов' });
            }

            // Для каждого текста проверяем наличие фрагментов с ассоциациями
            let processedTexts = 0;
            const availableTexts = [];

            if (texts.length === 0) {
                return res.json({ texts: [] });
            }

            texts.forEach(text => {
                req.db.getFragmentsByTextId(text.id, (err, fragments) => {
                    processedTexts++;
                    
                    if (!err && fragments.length > 0) {
                        const completeFragments = fragments.filter(f => 
                            f.emoji || f.custom_image || f.custom_word
                        );
                        
                        if (completeFragments.length === fragments.length) {
                            availableTexts.push({
                                id: text.id,
                                title: text.title,
                                language: text.language,
                                fragmentCount: fragments.length,
                                createdAt: text.created_at
                            });
                        }
                    }
                    
                    if (processedTexts === texts.length) {
                        res.json({ 
                            texts: availableTexts.sort((a, b) => 
                                new Date(b.createdAt) - new Date(a.createdAt)
                            )
                        });
                    }
                });
            });
        });
    } catch (error) {
        console.error('Ошибка получения доступных текстов:', error);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});

module.exports = router;