const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

class Database {
    constructor() {
        this.dbPath = path.join(__dirname, '..', 'data', 'app.db');
        this.init();
    }

    init() {
        // Создаем папку data если её нет
        const dataDir = path.dirname(this.dbPath);
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }

        this.db = new sqlite3.Database(this.dbPath, (err) => {
            if (err) {
                console.error('Ошибка подключения к базе данных:', err.message);
            } else {
                console.log('Подключение к SQLite базе данных установлено');
                this.createTables();
            }
        });
    }

    createTables() {
        const queries = [
            `CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,
            
            `CREATE TABLE IF NOT EXISTS texts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                title TEXT NOT NULL,
                content TEXT NOT NULL,
                language TEXT DEFAULT 'ru',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id)
            )`,
            
            `CREATE TABLE IF NOT EXISTS text_fragments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                text_id INTEGER NOT NULL,
                fragment_order INTEGER NOT NULL,
                content TEXT NOT NULL,
                start_position INTEGER NOT NULL,
                end_position INTEGER NOT NULL,
                emoji TEXT,
                custom_image TEXT,
                custom_word TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (text_id) REFERENCES texts (id)
            )`,
            
            `CREATE TABLE IF NOT EXISTS user_routes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                text_id INTEGER NOT NULL,
                route_description TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id),
                FOREIGN KEY (text_id) REFERENCES texts (id)
            )`
        ];

        queries.forEach(query => {
            this.db.run(query, (err) => {
                if (err) {
                    console.error('Ошибка создания таблицы:', err.message);
                }
            });
        });
    }

    // Методы для работы с пользователями
    createUser(username, email, passwordHash, callback) {
        const query = `INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)`;
        this.db.run(query, [username, email, passwordHash], function(err) {
            callback(err, this.lastID);
        });
    }

    getUserByEmail(email, callback) {
        const query = `SELECT * FROM users WHERE email = ?`;
        this.db.get(query, [email], callback);
    }

    getUserById(id, callback) {
        const query = `SELECT * FROM users WHERE id = ?`;
        this.db.get(query, [id], callback);
    }

    // Методы для работы с текстами
    createText(userId, title, content, language, callback) {
        const query = `INSERT INTO texts (user_id, title, content, language) VALUES (?, ?, ?, ?)`;
        this.db.run(query, [userId, title, content, language], function(err) {
            callback(err, this.lastID);
        });
    }

    getTextsByUserId(userId, callback) {
        const query = `SELECT * FROM texts WHERE user_id = ? ORDER BY created_at DESC`;
        this.db.all(query, [userId], callback);
    }

    getTextById(textId, callback) {
        const query = `SELECT * FROM texts WHERE id = ?`;
        this.db.get(query, [textId], callback);
    }

    updateText(textId, title, callback) {
        const query = `UPDATE texts SET title = ? WHERE id = ?`;
        this.db.run(query, [title, textId], function(err) {
            callback(err, this.changes);
        });
    }

    // Удаление текста и всех связанных данных
    deleteText(textId, callback) {
        // Сначала удаляем фрагменты
        const deleteFragmentsQuery = `DELETE FROM text_fragments WHERE text_id = ?`;
        this.db.run(deleteFragmentsQuery, [textId], (err) => {
            if (err) {
                return callback(err);
            }
            
            // Затем удаляем маршруты
            const deleteRoutesQuery = `DELETE FROM user_routes WHERE text_id = ?`;
            this.db.run(deleteRoutesQuery, [textId], (err) => {
                if (err) {
                    return callback(err);
                }
                
                // Наконец удаляем сам текст
                const deleteTextQuery = `DELETE FROM texts WHERE id = ?`;
                this.db.run(deleteTextQuery, [textId], function(err) {
                    callback(err, this.changes);
                });
            });
        });
    }

    // Методы для работы с фрагментами
    createFragment(textId, fragmentOrder, content, startPos, endPos, callback) {
        const query = `INSERT INTO text_fragments (text_id, fragment_order, content, start_position, end_position) 
                      VALUES (?, ?, ?, ?, ?)`;
        this.db.run(query, [textId, fragmentOrder, content, startPos, endPos], function(err) {
            callback(err, this.lastID);
        });
    }

    getFragmentById(fragmentId, callback) {
        const query = `SELECT * FROM text_fragments WHERE id = ?`;
        this.db.get(query, [fragmentId], callback);
    }

    updateFragmentAssociation(fragmentId, emoji, customImage, customWord, callback) {
        const query = `UPDATE text_fragments SET emoji = ?, custom_image = ?, custom_word = ? WHERE id = ?`;
        this.db.run(query, [emoji, customImage, customWord, fragmentId], callback);
    }

    updateFragmentContent(fragmentId, newContent, callback) {
        const query = `UPDATE text_fragments SET content = ? WHERE id = ?`;
        this.db.run(query, [newContent, fragmentId], callback);
    }

    getFragmentsByTextId(textId, callback) {
        const query = `SELECT * FROM text_fragments WHERE text_id = ? ORDER BY fragment_order`;
        this.db.all(query, [textId], callback);
    }

    // Методы для работы с маршрутами
    createRoute(userId, textId, routeDescription, callback) {
        const query = `INSERT INTO user_routes (user_id, text_id, route_description) VALUES (?, ?, ?)`;
        this.db.run(query, [userId, textId, routeDescription], function(err) {
            callback(err, this.lastID);
        });
    }

    getRouteByTextId(textId, callback) {
        const query = `SELECT * FROM user_routes WHERE text_id = ?`;
        this.db.get(query, [textId], callback);
    }

    close() {
        this.db.close((err) => {
            if (err) {
                console.error('Ошибка закрытия базы данных:', err.message);
            } else {
                console.log('Соединение с базой данных закрыто');
            }
        });
    }
}

module.exports = Database;