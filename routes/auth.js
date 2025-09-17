const express = require('express');
const bcrypt = require('bcrypt');
const { generateToken } = require('../middleware/auth');
const router = express.Router();

// Регистрация пользователя
router.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Валидация данных
        if (!username || !email || !password) {
            return res.status(400).json({ error: 'Все поля обязательны для заполнения' });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'Пароль должен содержать минимум 6 символов' });
        }

        // Проверка существования пользователя
        req.db.getUserByEmail(email, async (err, existingUser) => {
            if (err) {
                return res.status(500).json({ error: 'Ошибка базы данных' });
            }

            if (existingUser) {
                return res.status(409).json({ error: 'Пользователь с таким email уже существует' });
            }

            // Хэширование пароля
            const saltRounds = 10;
            const passwordHash = await bcrypt.hash(password, saltRounds);

            // Создание пользователя
            req.db.createUser(username, email, passwordHash, (err, userId) => {
                if (err) {
                    return res.status(500).json({ error: 'Ошибка создания пользователя' });
                }

                const user = { id: userId, username, email };
                const token = generateToken(user);

                res.status(201).json({
                    message: 'Пользователь успешно зарегистрирован',
                    token,
                    user: { id: userId, username, email }
                });
            });
        });
    } catch (error) {
        console.error('Ошибка регистрации:', error);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});

// Авторизация пользователя
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email и пароль обязательны' });
        }

        req.db.getUserByEmail(email, async (err, user) => {
            if (err) {
                return res.status(500).json({ error: 'Ошибка базы данных' });
            }

            if (!user) {
                return res.status(401).json({ error: 'Неверный email или пароль' });
            }

            const passwordMatch = await bcrypt.compare(password, user.password_hash);
            if (!passwordMatch) {
                return res.status(401).json({ error: 'Неверный email или пароль' });
            }

            const token = generateToken(user);
            res.json({
                message: 'Успешная авторизация',
                token,
                user: { id: user.id, username: user.username, email: user.email }
            });
        });
    } catch (error) {
        console.error('Ошибка авторизации:', error);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});

module.exports = router;