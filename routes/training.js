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

        // Используем оптимизированный метод с одним запросом вместо N+1
        req.db.getTextsWithFragmentsCount(userId, (err, texts) => {
            if (err) {
                console.error('Ошибка получения текстов:', err);
                return res.status(500).json({ error: 'Ошибка получения текстов' });
            }

            // Преобразуем результат в нужный формат
            const availableTexts = texts.map(text => ({
                id: text.id,
                title: text.title,
                language: text.language,
                fragmentCount: text.fragment_count,
                createdAt: text.created_at
            }));

            res.json({ texts: availableTexts });
        });
    } catch (error) {
        console.error('Ошибка получения доступных текстов:', error);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});

// Сохранение времени тренировки
router.post('/session', authenticateToken, (req, res) => {
    try {
        const { textId, durationSeconds, fragmentInputs } = req.body;
        const userId = req.user.id;
        
        const MAX_DURATION = 86400; // 24 hours in seconds

        if (!textId || !durationSeconds || durationSeconds < 0 || durationSeconds > MAX_DURATION) {
            return res.status(400).json({ 
                error: `Длительность тренировки должна быть от 0 до ${MAX_DURATION} секунд (24 часа)` 
            });
        }

        // Проверяем доступ к тексту
        req.db.getTextById(textId, (err, text) => {
            if (err) {
                console.error('Ошибка получения текста:', err);
                return res.status(500).json({ error: 'Ошибка получения текста' });
            }

            if (!text || text.user_id !== userId) {
                return res.status(403).json({ error: 'Нет доступа к этому тексту' });
            }

            // Сохраняем сессию тренировки
            req.db.createTrainingSession(userId, textId, durationSeconds, (err, sessionId) => {
                if (err) {
                    console.error('Ошибка сохранения сессии тренировки:', err);
                    return res.status(500).json({ error: 'Ошибка сохранения сессии тренировки' });
                }

                // Сохраняем введенные фрагменты, если они есть
                if (fragmentInputs && Array.isArray(fragmentInputs) && fragmentInputs.length > 0) {
                    // Получаем фрагменты текста для сопоставления
                    req.db.getFragmentsByTextId(textId, (err, fragments) => {
                        if (err) {
                            console.error('Ошибка получения фрагментов:', err);
                            // Не прерываем сохранение, просто возвращаем успех без фрагментов
                            return res.json({ 
                                success: true, 
                                sessionId,
                                message: 'Время тренировки сохранено (фрагменты не сохранены из-за ошибки)'
                            });
                        }

                        // Сохраняем введенные фрагменты
                        const savePromises = [];
                        let savedCount = 0;
                        
                        fragmentInputs.forEach((input, index) => {
                            if (input && input.trim() !== '' && fragments[index]) {
                                const promise = new Promise((resolve) => {
                                    req.db.createTrainingFragmentInput(
                                        sessionId,
                                        fragments[index].id,
                                        input.trim(),
                                        (err) => {
                                            if (err) {
                                                console.error(`Ошибка сохранения введенного фрагмента ${index}:`, err);
                                            } else {
                                                savedCount++;
                                            }
                                            resolve();
                                        }
                                    );
                                });
                                savePromises.push(promise);
                            }
                        });

                        // Ждем завершения всех сохранений
                        Promise.all(savePromises).then(() => {
                            res.json({ 
                                success: true, 
                                sessionId,
                                message: savedCount > 0 
                                    ? `Время тренировки и ${savedCount} введенных фрагментов сохранены`
                                    : 'Время тренировки сохранено',
                                savedInputs: savedCount
                            });
                        }).catch((error) => {
                            console.error('Ошибка при сохранении фрагментов:', error);
                            res.json({ 
                                success: true, 
                                sessionId,
                                message: 'Время тренировки сохранено (некоторые фрагменты не сохранены)',
                                savedInputs: savedCount
                            });
                        });
                    });
                } else {
                    res.json({ 
                        success: true, 
                        sessionId,
                        message: 'Время тренировки сохранено'
                    });
                }
            });
        });
    } catch (error) {
        console.error('Ошибка сохранения сессии тренировки:', error);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});

// Получение статистики пользователя
router.get('/statistics', authenticateToken, (req, res) => {
    try {
        const userId = req.user.id;
        const textId = req.query.textId;

        // Если указан textId, получаем статистику только для этого текста
        if (textId) {
            // Проверяем доступ к тексту
            req.db.getTextById(textId, (err, text) => {
                if (err) {
                    console.error('Ошибка получения текста:', err);
                    return res.status(500).json({ error: 'Ошибка получения текста' });
                }

                if (!text || text.user_id !== userId) {
                    return res.status(403).json({ error: 'Нет доступа к этому тексту' });
                }

                req.db.getTrainingSessionsByTextIdWithInfo(userId, textId, (err, sessions) => {
                    if (err) {
                        console.error('Ошибка получения статистики:', err);
                        return res.status(500).json({ error: 'Ошибка получения статистики' });
                    }

                    res.json({ sessions, text });
                });
            });
        } else {
            // Получаем общую статистику
            req.db.getTrainingSessionsWithTextInfo(userId, (err, sessions) => {
                if (err) {
                    console.error('Ошибка получения статистики:', err);
                    return res.status(500).json({ error: 'Ошибка получения статистики' });
                }

                res.json({ sessions });
            });
        }
    } catch (error) {
        console.error('Ошибка получения статистики:', error);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});

// Получение истории ввода фрагмента
router.get('/fragment/:fragmentId/history', authenticateToken, (req, res) => {
    try {
        const fragmentId = req.params.fragmentId;
        const userId = req.user.id;

        // Проверяем доступ к фрагменту
        req.db.getFragmentById(fragmentId, (err, fragment) => {
            if (err) {
                console.error('Ошибка получения фрагмента:', err);
                return res.status(500).json({ error: 'Ошибка получения фрагмента' });
            }

            if (!fragment) {
                return res.status(404).json({ error: 'Фрагмент не найден' });
            }

            // Проверяем доступ к тексту
            req.db.getTextById(fragment.text_id, (err, text) => {
                if (err) {
                    console.error('Ошибка получения текста:', err);
                    return res.status(500).json({ error: 'Ошибка получения текста' });
                }

                if (!text || text.user_id !== userId) {
                    return res.status(403).json({ error: 'Нет доступа к этому фрагменту' });
                }

                // Получаем историю ввода фрагмента
                req.db.getTrainingFragmentInputsByFragmentId(fragmentId, (err, inputs) => {
                    if (err) {
                        console.error('Ошибка получения истории ввода:', err);
                        return res.status(500).json({ error: 'Ошибка получения истории ввода' });
                    }

                    res.json({
                        fragment: {
                            id: fragment.id,
                            content: fragment.content,
                            order: fragment.fragment_order
                        },
                        inputs: inputs.map(input => ({
                            id: input.id,
                            userInput: input.user_input,
                            sessionId: input.session_id,
                            createdAt: input.created_at,
                            sessionCreatedAt: input.session_created_at
                        }))
                    });
                });
            });
        });
    } catch (error) {
        console.error('Ошибка получения истории ввода фрагмента:', error);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});

// Удаление сессии тренировки
router.delete('/session/:sessionId', authenticateToken, (req, res) => {
    try {
        const sessionId = req.params.sessionId;
        const userId = req.user.id;

        // Проверяем, что сессия принадлежит пользователю
        req.db.getTrainingSessionById(sessionId, (err, session) => {
            if (err) {
                console.error('Ошибка получения сессии:', err);
                return res.status(500).json({ error: 'Ошибка получения сессии' });
            }

            if (!session || session.user_id !== userId) {
                return res.status(403).json({ error: 'Нет доступа к этой сессии' });
            }

            // Удаляем сессию
            req.db.deleteTrainingSession(sessionId, (err) => {
                if (err) {
                    console.error('Ошибка удаления сессии:', err);
                    return res.status(500).json({ error: 'Ошибка удаления сессии' });
                }

                res.json({ 
                    success: true, 
                    message: 'Сессия удалена'
                });
            });
        });
    } catch (error) {
        console.error('Ошибка удаления сессии:', error);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});

module.exports = router;