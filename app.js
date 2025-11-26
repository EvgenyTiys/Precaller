require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('./middleware/logger');
const authRoutes = require('./routes/auth');
const textRoutes = require('./routes/texts');
const wizardRoutes = require('./routes/wizard');
const trainingRoutes = require('./routes/training');
const Database = require('./models/database');

// Инициализация MCP Context7
const { Client } = require('@modelcontextprotocol/sdk/client/index.js');
const { StdioClientTransport } = require('@modelcontextprotocol/sdk/client/stdio.js');

const app = express();
const PORT = process.env.PORT || 3000;

// Инициализация базы данных
const db = new Database();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Увеличиваем лимит для изображений
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(logger);

// Настройка шаблонизатора EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Передача экземпляра базы данных в маршруты
app.use((req, res, next) => {
    req.db = db;
    next();
});

// API маршруты ДО статических файлов, чтобы они не перехватывали запросы
app.use('/api/auth', authRoutes);
app.use('/api/texts', textRoutes);
app.use('/api/wizard', wizardRoutes);
app.use('/api/training', trainingRoutes);

// Настройка статических файлов с заголовками для предотвращения кэширования JS
// Статические файлы ПОСЛЕ API маршрутов, чтобы не перехватывать их
app.use(express.static(path.join(__dirname, 'public'), {
    setHeaders: (res, path) => {
        if (path.endsWith('.js')) {
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
            res.setHeader('Pragma', 'no-cache');
            res.setHeader('Expires', '0');
        }
    }
}));

// Главная страница
app.get('/', (req, res) => {
    res.render('index', { title: 'Приложение для запоминания текстов' });
});

// Страница тренировки
app.get('/training', (req, res) => {
    res.render('training', { title: 'Тренировка' });
});

// Страница истории тренировок
app.get('/history', (req, res) => {
    res.render('history', { title: 'История тренировок' });
});

// Страница статистики
app.get('/statistics', (req, res) => {
    res.render('statistics', { title: 'Статистика' });
});

// Тестовая страница для эмодзи
app.get('/test-emoji.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'test-emoji.html'));
});

// Страница авторизации
app.get('/auth', (req, res) => {
    res.render('auth', { title: 'Авторизация - Приложение для запоминания текстов' });
});

// Страница мастера запоминания
app.get('/wizard', (req, res) => {
    res.render('wizard', { title: 'Мастер запоминания' });
});

// Обработка 404
app.use((req, res) => {
    res.status(404).render('error', { 
        title: 'Страница не найдена',
        error: 'Страница не найдена' 
    });
});

// Обработка ошибок
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).render('error', { 
        title: 'Ошибка сервера',
        error: 'Внутренняя ошибка сервера' 
    });
});

app.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
});

module.exports = app;