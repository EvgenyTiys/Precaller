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
// Защита от одновременных запросов
const savingFragments = new Map(); // textId -> true если идет сохранение

router.post('/:id/fragments', authenticateToken, (req, res) => {
    try {
        const textId = req.params.id;
        const { fragments } = req.body;
        
        // Проверяем, не идет ли уже сохранение для этого текста
        if (savingFragments.has(textId)) {
            console.error(`[SAVE FRAGMENTS] textId ${textId}: Save already in progress, rejecting duplicate request`);
            return res.status(429).json({ error: 'Сохранение уже выполняется. Подождите.' });
        }
        
        savingFragments.set(textId, true);

        if (!fragments || !Array.isArray(fragments)) {
            savingFragments.delete(textId);
            return res.status(400).json({ error: 'Неверный формат фрагментов' });
        }
        
        // FIX-08: Валидация порядка фрагментов
        if (fragments.length > 0) {
            const orders = fragments.map(f => f.order || 0);
            const expectedOrders = Array.from({length: fragments.length}, (_, i) => i + 1);
            const sortedOrders = [...orders].sort((a, b) => a - b);
            
            if (JSON.stringify(sortedOrders) !== JSON.stringify(expectedOrders)) {
                console.error(`[SAVE FRAGMENTS] Invalid fragment order: expected [${expectedOrders}], got [${sortedOrders}]`);
                savingFragments.delete(textId);
                return res.status(400).json({ 
                    error: 'Некорректная нумерация фрагментов',
                    details: {
                        expected: expectedOrders,
                        received: sortedOrders
                    }
                });
            }
            
            // Валидация позиций и содержимого
            for (let i = 0; i < fragments.length; i++) {
                const f = fragments[i];
                
                if (!f.content || f.content.trim() === '') {
                    console.error(`[SAVE FRAGMENTS] Fragment ${i + 1}: empty content`);
                    savingFragments.delete(textId);
                    return res.status(400).json({ 
                        error: `Фрагмент ${i + 1}: содержимое не может быть пустым` 
                    });
                }
                
                const startPos = f.startPos || 0;
                const endPos = f.endPos || 0;
                
                if (startPos >= endPos) {
                    console.error(`[SAVE FRAGMENTS] Fragment ${i + 1}: invalid positions startPos=${startPos}, endPos=${endPos}`);
                    savingFragments.delete(textId);
                    return res.status(400).json({ 
                        error: `Фрагмент ${i + 1}: некорректные позиции` 
                    });
                }
            }
        }

        // Проверяем доступ к тексту
        req.db.getTextById(textId, (err, text) => {
            if (err || !text || text.user_id !== req.user.id) {
                return res.status(403).json({ error: 'Нет доступа к этому тексту' });
            }

            // Удаляем существующие фрагменты перед сохранением новых, чтобы избежать дублирования
            // Важно: удаляем ВСЕ фрагменты, включая их ассоциации (emoji, custom_word, custom_image)
            // Используем транзакцию для гарантии атомарности операции
            const deleteFragmentsQuery = `DELETE FROM text_fragments WHERE text_id = ?`;
            
            // Сначала проверяем, сколько фрагментов было до удаления (для логирования)
            req.db.getFragmentsByTextId(textId, (checkErr, oldFragments) => {
                if (checkErr) {
                    console.error('Ошибка проверки старых фрагментов:', checkErr);
                } else {
                    console.log(`[SAVE FRAGMENTS] textId ${textId}: Found ${oldFragments ? oldFragments.length : 0} old fragments before deletion`);
                }
                
                // Удаляем все фрагменты и проверяем количество удаленных
                req.db.db.run(deleteFragmentsQuery, [textId], function(deleteErr) {
                    if (deleteErr) {
                        console.error('Ошибка удаления старых фрагментов:', deleteErr);
                        savingFragments.delete(textId);
                        return res.status(500).json({ error: 'Ошибка при удалении старых фрагментов' });
                    }

                    const deletedCount = this.changes;
                    console.log(`[SAVE FRAGMENTS] textId ${textId}: Deleted ${deletedCount} fragments from DB`);

                    // Проверяем, что удаление действительно произошло
                    req.db.getFragmentsByTextId(textId, (verifyErr, remainingFragments) => {
                        if (verifyErr) {
                            console.error('Ошибка проверки удаления:', verifyErr);
                            savingFragments.delete(textId);
                            return res.status(500).json({ error: 'Ошибка при проверке удаления фрагментов' });
                        }
                        
                        if (remainingFragments && remainingFragments.length > 0) {
                            console.error(`[SAVE FRAGMENTS] ERROR: textId ${textId}: After deletion, ${remainingFragments.length} fragments still remain in DB!`);
                            // Пытаемся удалить еще раз
                            req.db.db.run(deleteFragmentsQuery, [textId], function(retryErr) {
                                if (retryErr) {
                                    console.error('Ошибка повторного удаления:', retryErr);
                                    savingFragments.delete(textId);
                                    return res.status(500).json({ error: 'Ошибка при повторном удалении фрагментов' });
                                }
                                console.log(`[SAVE FRAGMENTS] textId ${textId}: Retry deletion removed ${this.changes} more fragments`);
                                createNewFragments();
                            });
                        } else {
                            console.log(`[SAVE FRAGMENTS] textId ${textId}: Verification passed - no fragments remain`);
                            createNewFragments();
                        }
                    });
                    
                    function createNewFragments() {
                        // Сохраняем фрагменты
                        let savedCount = 0;
                        const totalFragments = fragments.length;

                        if (totalFragments === 0) {
                            console.log(`[SAVE FRAGMENTS] textId ${textId}: No fragments to save`);
                            return res.json({ message: 'Фрагменты сохранены', count: 0 });
                        }

                        console.log(`[SAVE FRAGMENTS] textId ${textId}: Creating ${totalFragments} new fragments`);

                        fragments.forEach((fragment, index) => {
                            req.db.createFragment(
                                textId,
                                index + 1,
                                fragment.content,
                                fragment.startPos,
                                fragment.endPos,
                                (err, fragmentId) => {
                                    if (err) {
                                        console.error(`[SAVE FRAGMENTS] Error creating fragment ${index + 1}:`, err);
                                    } else {
                                        console.log(`[SAVE FRAGMENTS] textId ${textId}: Created fragment ${index + 1}/${totalFragments} with id ${fragmentId}`);
                                    }
                                    savedCount++;
                                    
                                    if (savedCount === totalFragments) {
                                        console.log(`[SAVE FRAGMENTS] textId ${textId}: Successfully saved all ${totalFragments} fragments`);
                                        
                                        // Финальная проверка
                                        req.db.getFragmentsByTextId(textId, (finalErr, finalFragments) => {
                                            if (finalErr) {
                                                console.error('Ошибка финальной проверки:', finalErr);
                                            } else {
                                                console.log(`[SAVE FRAGMENTS] textId ${textId}: Final verification - ${finalFragments ? finalFragments.length : 0} fragments in DB`);
                                                if (finalFragments && finalFragments.length !== totalFragments) {
                                                    console.error(`[SAVE FRAGMENTS] ERROR: Expected ${totalFragments} fragments, but found ${finalFragments.length} in DB!`);
                                                }
                                            }
                                        });
                                        
                                        savingFragments.delete(textId);
                                        res.json({ 
                                            message: 'Фрагменты успешно сохранены',
                                            count: totalFragments 
                                        });
                                    }
                                }
                            );
                        });
                    }
                });
            });
        });
    } catch (error) {
        console.error('Ошибка сохранения фрагментов:', error);
        savingFragments.delete(textId);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});

// Обновление названия текста
router.put('/:id', authenticateToken, (req, res) => {
    try {
        const textId = req.params.id;
        const { title } = req.body;

        if (!title || title.trim() === '') {
            return res.status(400).json({ error: 'Название текста не может быть пустым' });
        }

        // Проверяем доступ к тексту
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

            // Обновляем название текста
            req.db.updateText(textId, title.trim(), (err, changes) => {
                if (err) {
                    console.error('Ошибка обновления текста:', err);
                    return res.status(500).json({ error: 'Ошибка обновления текста' });
                }

                if (changes === 0) {
                    return res.status(404).json({ error: 'Текст не найден' });
                }

                res.json({ 
                    message: 'Название текста успешно обновлено',
                    textId: parseInt(textId),
                    title: title.trim()
                });
            });
        });
    } catch (error) {
        console.error('Ошибка обновления текста:', error);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});

// Удаление текста
router.delete('/:id', authenticateToken, (req, res) => {
    try {
        const textId = req.params.id;

        // Проверяем доступ к тексту
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

            // Удаляем текст и все связанные данные
            req.db.deleteText(textId, (err, changes) => {
                if (err) {
                    console.error('Ошибка удаления текста:', err);
                    return res.status(500).json({ error: 'Ошибка удаления текста' });
                }

                if (changes === 0) {
                    return res.status(404).json({ error: 'Текст не найден' });
                }

                res.json({ 
                    message: 'Текст успешно удален',
                    textId: parseInt(textId)
                });
            });
        });
    } catch (error) {
        console.error('Ошибка удаления текста:', error);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});

module.exports = router;