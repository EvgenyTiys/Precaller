const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// Функция расчета Манхеттенского расстояния (аналогично клиентской версии)
function manhattanDistance(str1, str2) {
    if (!str1 && !str2) {
        return 0;
    }
    if (!str1) {
        return str2.length;
    }
    if (!str2) {
        return str1.length;
    }

    // Используем алгоритм Левенштейна для оптимального выравнивания
    const m = str1.length;
    const n = str2.length;
    const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
    const path = Array(m + 1).fill(null).map(() => Array(n + 1).fill(null));

    // Инициализация
    for (let i = 0; i <= m; i++) {
        dp[i][0] = i;
        if (i > 0) {
            path[i][0] = { op: 'delete', i: i - 1, j: 0 };
        }
    }
    for (let j = 0; j <= n; j++) {
        dp[0][j] = j;
        if (j > 0) {
            path[0][j] = { op: 'insert', i: 0, j: j - 1 };
        }
    }

    // Заполнение матрицы
    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
            const replace = dp[i - 1][j - 1] + cost;
            const del = dp[i - 1][j] + 1;
            const ins = dp[i][j - 1] + 1;

            if (replace <= del && replace <= ins) {
                dp[i][j] = replace;
                path[i][j] = { op: 'replace', i: i - 1, j: j - 1 };
            } else if (del <= ins) {
                dp[i][j] = del;
                path[i][j] = { op: 'delete', i: i - 1, j: j };
            } else {
                dp[i][j] = ins;
                path[i][j] = { op: 'insert', i: i, j: j - 1 };
            }
        }
    }

    // Восстановление пути и подсчет различий
    let distance = 0;
    let i = m, j = n;
    while (i > 0 || j > 0) {
        const p = path[i][j];
        
        if (!p) {
            // Обработка оставшихся символов
            if (i > 0) {
                distance++;
                i--;
            } else if (j > 0) {
                distance++;
                j--;
            } else {
                break;
            }
            continue;
        }

        if (p.op === 'replace') {
            const char1 = i > 0 ? str1[i - 1] : '';
            const char2 = j > 0 ? str2[j - 1] : '';
            if (char1 !== char2) {
                distance++;
            }
            i = p.i;
            j = p.j;
        } else if (p.op === 'delete') {
            distance++;
            i = p.i;
        } else if (p.op === 'insert') {
            distance++;
            j = p.j;
        } else {
            break;
        }
    }

    return distance;
}

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

// Получение данных для графика суммарного Манхеттенского расстояния по всем тренировкам текста
router.get('/text/:textId/distance-chart', authenticateToken, (req, res) => {
    try {
        const textId = req.params.textId;
        const userId = req.user.id;

        // Проверяем доступ к тексту
        req.db.getTextById(textId, (err, text) => {
            if (err) {
                console.error('Ошибка получения текста:', err);
                return res.status(500).json({ error: 'Ошибка получения текста' });
            }

            if (!text || text.user_id !== userId) {
                return res.status(403).json({ error: 'Нет доступа к этому тексту' });
            }

            // Получаем все фрагменты текста
            req.db.getFragmentsByTextId(textId, (err, fragments) => {
                if (err) {
                    console.error('Ошибка получения фрагментов:', err);
                    return res.status(500).json({ error: 'Ошибка получения фрагментов' });
                }

                // Получаем все тренировки с их фрагментами
                req.db.getTrainingSessionsWithFragmentInputsByTextId(userId, textId, (err, sessionData) => {
                    if (err) {
                        console.error('Ошибка получения данных тренировок:', err);
                        return res.status(500).json({ error: 'Ошибка получения данных тренировок' });
                    }

                    // Группируем данные по сессиям
                    const sessionsMap = new Map();
                    sessionData.forEach(row => {
                        if (!sessionsMap.has(row.session_id)) {
                            sessionsMap.set(row.session_id, {
                                sessionId: row.session_id,
                                createdAt: row.session_created_at,
                                durationSeconds: row.duration_seconds,
                                fragmentInputs: []
                            });
                        }
                        // Добавляем фрагмент только если он был введен
                        if (row.fragment_id && row.user_input !== null && row.user_input !== undefined) {
                            sessionsMap.get(row.session_id).fragmentInputs.push({
                                fragmentId: row.fragment_id,
                                fragmentContent: row.fragment_content,
                                fragmentOrder: row.fragment_order,
                                userInput: row.user_input
                            });
                        }
                    });

                    // Вычисляем суммарное расстояние для каждой тренировки
                    const chartData = [];
                    sessionsMap.forEach((session, sessionId) => {
                        let totalDistance = 0;

                        // Для каждого фрагмента текста
                        fragments.forEach(fragment => {
                            // Ищем введенный текст для этого фрагмента в данной тренировке
                            const input = session.fragmentInputs.find(
                                inp => inp.fragmentId === fragment.id
                            );

                            if (input) {
                                // Если фрагмент был введен, вычисляем расстояние
                                const distance = manhattanDistance(fragment.content, input.userInput);
                                totalDistance += distance;
                            } else {
                                // Если фрагмент не был записан, расстояние = 0
                                totalDistance += 0;
                            }
                        });

                        chartData.push({
                            sessionId: session.sessionId,
                            createdAt: session.createdAt,
                            totalDistance: totalDistance
                        });
                    });

                    // Сортируем по времени создания
                    chartData.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

                    res.json({
                        textId: textId,
                        data: chartData
                    });
                });
            });
        });
    } catch (error) {
        console.error('Ошибка получения данных графика:', error);
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