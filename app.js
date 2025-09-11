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
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(logger);

// Настройка шаблонизатора EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Передача экземпляра базы данных в маршруты
app.use((req, res, next) => {
    req.db = db;
    next();
});

// Маршруты
app.use('/api/auth', authRoutes);
app.use('/api/texts', textRoutes);
app.use('/api/wizard', wizardRoutes);
app.use('/api/training', trainingRoutes);

// Главная страница
app.get('/', (req, res) => {
    res.render('index', { title: 'Приложение для запоминания текстов' });
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