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
            )`,
            
            `CREATE TABLE IF NOT EXISTS training_sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                text_id INTEGER NOT NULL,
                duration_seconds INTEGER NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id),
                FOREIGN KEY (text_id) REFERENCES texts (id)
            )`,
            
            `CREATE TABLE IF NOT EXISTS training_fragment_inputs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id INTEGER NOT NULL,
                fragment_id INTEGER NOT NULL,
                user_input TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (session_id) REFERENCES training_sessions (id) ON DELETE CASCADE,
                FOREIGN KEY (fragment_id) REFERENCES text_fragments (id)
            )`
        ];

        queries.forEach(query => {
            this.db.run(query, (err) => {
                if (err) {
                    console.error('Ошибка создания таблицы:', err.message);
                }
            });
        });
        
        // Создаём индексы для оптимизации запросов
        this.createIndexes();
    }
    
    createIndexes() {
        const indexQueries = [
            `CREATE INDEX IF NOT EXISTS idx_texts_user_id ON texts(user_id)`,
            `CREATE INDEX IF NOT EXISTS idx_text_fragments_text_id ON text_fragments(text_id)`,
            `CREATE INDEX IF NOT EXISTS idx_training_sessions_user_id ON training_sessions(user_id)`,
            `CREATE INDEX IF NOT EXISTS idx_training_sessions_text_id ON training_sessions(text_id)`,
            `CREATE INDEX IF NOT EXISTS idx_training_sessions_created_at ON training_sessions(created_at)`,
            `CREATE INDEX IF NOT EXISTS idx_training_fragment_inputs_session_id ON training_fragment_inputs(session_id)`,
            `CREATE INDEX IF NOT EXISTS idx_training_fragment_inputs_fragment_id ON training_fragment_inputs(fragment_id)`,
            
            // REF-15: Составной индекс для оптимизации запросов с сортировкой
            `CREATE INDEX IF NOT EXISTS idx_fragments_text_order ON text_fragments(text_id, fragment_order)`,
            
            // REF-16: Индекс для поиска по позициям (дедупликация)
            `CREATE INDEX IF NOT EXISTS idx_fragments_positions ON text_fragments(text_id, start_position, end_position)`,
            
            // Дополнительный индекс для поиска фрагментов с ассоциациями
            `CREATE INDEX IF NOT EXISTS idx_fragments_associations ON text_fragments(text_id, emoji, custom_word, custom_image)`
        ];
        
        indexQueries.forEach(query => {
            this.db.run(query, (err) => {
                if (err) {
                    console.error('Ошибка создания индекса:', err.message);
                } else {
                    console.log('Индекс создан успешно');
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

    // Оптимизированный метод для получения текстов с количеством фрагментов одним запросом
    getTextsWithFragmentsCount(userId, callback) {
        const query = `
            SELECT 
                t.id,
                t.title,
                t.language,
                t.created_at,
                COUNT(tf.id) as fragment_count,
                COUNT(CASE WHEN tf.emoji IS NOT NULL OR tf.custom_image IS NOT NULL OR tf.custom_word IS NOT NULL THEN 1 END) as complete_fragments
            FROM texts t
            LEFT JOIN text_fragments tf ON t.id = tf.text_id
            WHERE t.user_id = ?
            GROUP BY t.id
            HAVING fragment_count > 0 AND fragment_count = complete_fragments
            ORDER BY t.created_at DESC
        `;
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

    // Методы для работы с тренировками
    createTrainingSession(userId, textId, durationSeconds, callback) {
        const query = `INSERT INTO training_sessions (user_id, text_id, duration_seconds) VALUES (?, ?, ?)`;
        this.db.run(query, [userId, textId, durationSeconds], function(err) {
            callback(err, this.lastID);
        });
    }

    getTrainingSessionsByUserId(userId, callback) {
        const query = `SELECT * FROM training_sessions WHERE user_id = ? ORDER BY created_at DESC`;
        this.db.all(query, [userId], callback);
    }

    getTrainingSessionsByTextId(textId, callback) {
        const query = `SELECT * FROM training_sessions WHERE text_id = ? ORDER BY created_at DESC`;
        this.db.all(query, [textId], callback);
    }

    getTrainingSessionById(sessionId, callback) {
        const query = `SELECT * FROM training_sessions WHERE id = ?`;
        this.db.get(query, [sessionId], callback);
    }

    getTrainingSessionsWithTextInfo(userId, callback) {
        const query = `
            SELECT 
                ts.id,
                ts.text_id,
                ts.duration_seconds,
                ts.created_at,
                t.title as text_title
            FROM training_sessions ts
            JOIN texts t ON ts.text_id = t.id
            WHERE ts.user_id = ?
            ORDER BY ts.created_at DESC
        `;
        this.db.all(query, [userId], callback);
    }

    getTrainingSessionsByTextIdWithInfo(userId, textId, callback) {
        const query = `
            SELECT 
                ts.id,
                ts.text_id,
                ts.duration_seconds,
                ts.created_at,
                t.title as text_title
            FROM training_sessions ts
            JOIN texts t ON ts.text_id = t.id
            WHERE ts.user_id = ? AND ts.text_id = ?
            ORDER BY ts.created_at DESC
        `;
        this.db.all(query, [userId, textId], callback);
    }

    deleteTrainingSession(sessionId, callback) {
        const query = `DELETE FROM training_sessions WHERE id = ?`;
        this.db.run(query, [sessionId], function(err) {
            callback(err, this.changes);
        });
    }

    // Методы для работы с введенными фрагментами во время тренировок
    createTrainingFragmentInput(sessionId, fragmentId, userInput, callback) {
        const query = `INSERT INTO training_fragment_inputs (session_id, fragment_id, user_input) VALUES (?, ?, ?)`;
        this.db.run(query, [sessionId, fragmentId, userInput], function(err) {
            callback(err, this.lastID);
        });
    }

    getTrainingFragmentInputsByFragmentId(fragmentId, callback) {
        const query = `
            SELECT 
                tfi.id,
                tfi.session_id,
                tfi.fragment_id,
                tfi.user_input,
                tfi.created_at,
                ts.created_at as session_created_at
            FROM training_fragment_inputs tfi
            JOIN training_sessions ts ON tfi.session_id = ts.id
            WHERE tfi.fragment_id = ?
            ORDER BY ts.created_at DESC, tfi.created_at DESC
        `;
        this.db.all(query, [fragmentId], callback);
    }

    getTrainingFragmentInputsBySessionId(sessionId, callback) {
        const query = `
            SELECT 
                tfi.id,
                tfi.session_id,
                tfi.fragment_id,
                tfi.user_input,
                tfi.created_at,
                tf.content as fragment_content,
                tf.fragment_order
            FROM training_fragment_inputs tfi
            JOIN text_fragments tf ON tfi.fragment_id = tf.id
            WHERE tfi.session_id = ?
            ORDER BY tf.fragment_order
        `;
        this.db.all(query, [sessionId], callback);
    }

    // Получение всех тренировок текста с их фрагментами для графика
    getTrainingSessionsWithFragmentInputsByTextId(userId, textId, callback) {
        const query = `
            SELECT 
                ts.id as session_id,
                ts.created_at as session_created_at,
                ts.duration_seconds,
                tf.id as fragment_id,
                tf.content as fragment_content,
                tf.fragment_order,
                tfi.user_input,
                tfi.created_at as input_created_at
            FROM training_sessions ts
            LEFT JOIN training_fragment_inputs tfi ON ts.id = tfi.session_id
            LEFT JOIN text_fragments tf ON tfi.fragment_id = tf.id
            WHERE ts.user_id = ? AND ts.text_id = ?
            ORDER BY ts.created_at ASC, tf.fragment_order ASC
        `;
        this.db.all(query, [userId, textId], callback);
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