# ПЛАН РЕФАКТОРИНГА И ОПТИМИЗАЦИИ: Раздел "Тренировка"
**Подготовил:** Senior Fullstack Developer  
**Дата:** 2024  
**Версия:** Текущая

---

## 1. ПЛАН РЕФАКТОРИНГА И ОПТИМИЗАЦИИ КОДА

### 1.1. Архитектурный рефакторинг

#### 1.1.1. Разделение на модули (JavaScript)
**Приоритет:** High  
**Оценка:** 8 часов

**Проблема:**
- Весь код находится в одном файле `training.js` (902 строки)
- Нарушение принципа Single Responsibility
- Сложно тестировать и поддерживать

**Решение:**
Создать модульную структуру:
```
public/js/training/
├── training.js (главный файл, инициализация)
├── modules/
│   ├── TrainingState.js (управление состоянием)
│   ├── TrainingTimer.js (логика секундомера)
│   ├── TrainingNavigation.js (навигация между слайдами)
│   ├── TrainingUI.js (обновление UI)
│   ├── TrainingStorage.js (работа с localStorage)
│   ├── TrainingAPI.js (API запросы)
│   └── TrainingSecurity.js (безопасность, экранирование)
└── utils/
    ├── DOMUtils.js (утилиты для работы с DOM)
    └── ValidationUtils.js (валидация данных)
```

**Действия:**
1. Выделить класс `TrainingState` для управления состоянием
2. Выделить класс `TrainingTimer` для секундомера
3. Выделить класс `TrainingNavigation` для навигации
4. Выделить класс `TrainingUI` для обновления интерфейса
5. Выделить класс `TrainingStorage` для работы с localStorage
6. Выделить класс `TrainingAPI` для API запросов
7. Выделить утилиты для работы с DOM и валидации

---

#### 1.1.2. Рефакторинг функций отображения
**Приоритет:** High  
**Оценка:** 4 часа

**Проблема:**
- Дублирование кода в `displayStoryChain()`, `displayFragmentAssociation()`, `displayNextHint()`
- Множественные проверки `if (element)` по всему коду
- Использование `innerHTML` вместо безопасных методов

**Решение:**
1. Создать единую функцию `renderAssociation()` для отображения ассоциаций
2. Создать класс `DOMRenderer` с методами безопасного рендеринга
3. Использовать паттерн Template Method для унификации логики отображения

**Код:**
```javascript
class DOMRenderer {
    static safeSetText(element, text) {
        if (element) element.textContent = text;
    }
    
    static safeSetHTML(element, html) {
        if (element) {
            element.innerHTML = '';
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            element.appendChild(doc.body.firstChild);
        }
    }
    
    static createImage(src, alt, className, onClick) {
        const img = document.createElement('img');
        img.src = src;
        img.alt = alt;
        img.className = className;
        if (onClick) img.addEventListener('click', onClick);
        return img;
    }
}
```

---

#### 1.1.3. Улучшение обработки ошибок
**Приоритет:** Medium  
**Оценка:** 3 часа

**Проблема:**
- Нет централизованной обработки ошибок
- Повторяющийся код try-catch
- Нет логирования ошибок

**Решение:**
1. Создать класс `ErrorHandler` для централизованной обработки
2. Реализовать retry механизм для сетевых запросов
3. Добавить логирование ошибок (отправка на сервер в production)

**Код:**
```javascript
class ErrorHandler {
    static async handleAPIError(error, context) {
        // Логирование
        console.error(`[${context}]`, error);
        
        // Определение типа ошибки
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            return { type: 'network', retryable: true };
        }
        if (error.message.includes('403')) {
            return { type: 'auth', retryable: false };
        }
        return { type: 'unknown', retryable: false };
    }
    
    static async retryRequest(fn, maxRetries = 3, delay = 1000) {
        for (let i = 0; i < maxRetries; i++) {
            try {
                return await fn();
            } catch (error) {
                if (i === maxRetries - 1) throw error;
                await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
            }
        }
    }
}
```

---

#### 1.1.4. Рефакторинг управления состоянием
**Приоритет:** High  
**Оценка:** 6 часов

**Проблема:**
- Глобальные переменные разбросаны по коду
- Нет единой точки управления состоянием
- Сложно отследить изменения состояния

**Решение:**
1. Создать класс `TrainingState` с использованием паттерна Observer
2. Инкапсулировать все состояние в одном объекте
3. Реализовать методы для безопасного изменения состояния

**Код:**
```javascript
class TrainingState {
    constructor() {
        this.state = {
            currentTextId: null,
            currentText: null,
            trainingFragments: [],
            currentFragmentIndex: 0,
            visibility: {
                text: false,
                emojis: false,
                timer: false
            },
            timer: {
                isRunning: false,
                elapsedSeconds: 0,
                startTime: null
            },
            userInputs: []
        };
        this.observers = [];
    }
    
    subscribe(observer) {
        this.observers.push(observer);
    }
    
    setState(updates) {
        this.state = { ...this.state, ...updates };
        this.notify();
    }
    
    notify() {
        this.observers.forEach(observer => observer(this.state));
    }
    
    getState() {
        return { ...this.state };
    }
}
```

---

### 1.2. Оптимизация производительности

#### 1.2.1. Оптимизация обновления DOM
**Приоритет:** Medium  
**Оценка:** 3 часа

**Проблема:**
- Множественные обращения к `getElementById()` в каждой функции
- Перерисовка всего интерфейса при каждом изменении
- Нет батчинга обновлений DOM

**Решение:**
1. Кэшировать DOM элементы при инициализации
2. Использовать `DocumentFragment` для батчинга обновлений
3. Использовать `requestAnimationFrame` для оптимизации анимаций

**Код:**
```javascript
class DOMCache {
    constructor() {
        this.cache = new Map();
    }
    
    get(id) {
        if (!this.cache.has(id)) {
            const element = document.getElementById(id);
            if (element) this.cache.set(id, element);
        }
        return this.cache.get(id);
    }
    
    clear() {
        this.cache.clear();
    }
}
```

---

#### 1.2.2. Оптимизация работы с таймером
**Приоритет:** Low  
**Оценка:** 2 часа

**Проблема:**
- `setInterval` вызывается каждые 100ms, что избыточно
- Обновление DOM при каждом тике

**Решение:**
1. Увеличить интервал до 1000ms (обновление раз в секунду)
2. Обновлять только видимые элементы таймера
3. Использовать `performance.now()` для более точных измерений

---

### 1.3. Улучшение читаемости кода

#### 1.3.1. Извлечение магических чисел и строк
**Приоритет:** Low  
**Оценка:** 2 часа

**Проблема:**
- Магические числа: `100`, `500`, `-1`
- Хардкод строк в коде

**Решение:**
1. Создать файл `constants.js` с константами
2. Вынести все строки в файл локализации

**Код:**
```javascript
// constants.js
export const TIMER_INTERVAL = 1000; // ms
export const ANIMATION_DURATION = 500; // ms
export const INPUT_SLIDE_INDEX = -1;
export const MAX_TRAINING_DURATION = 86400; // 24 hours in seconds
```

---

#### 1.3.2. Улучшение именования
**Приоритет:** Low  
**Оценка:** 1 час

**Проблема:**
- Неочевидные имена: `goToNext()`, `showInputSlide()`
- Смешение стилей именования

**Решение:**
1. Переименовать функции для ясности: `goToNext()` → `navigateToNextFragment()`
2. Использовать единый стиль именования (camelCase для функций)
3. Добавить JSDoc комментарии ко всем публичным функциям

---

## 2. ПЛАН ИСПРАВЛЕНИЯ КРИТИЧЕСКИХ И ВЫСОКИХ БАГОВ

### 2.1. Критические баги (P0)

#### BUG-001: Потеря данных при ошибке сохранения
**Приоритет:** P0  
**Оценка:** 4 часа

**План исправления:**
1. Сохранять время в localStorage перед отправкой на сервер
2. Не останавливать секундомер до успешного сохранения
3. Добавить кнопку "Повторить сохранение" при ошибке
4. Реализовать механизм восстановления из localStorage

**Код:**
```javascript
async function finishTraining() {
    // Сохраняем в localStorage перед отправкой
    const sessionData = {
        textId: currentTextId,
        durationSeconds: elapsedSeconds,
        timestamp: Date.now(),
        userInputs: userInputs
    };
    localStorage.setItem('pendingTrainingSession', JSON.stringify(sessionData));
    
    try {
        window.app.showLoader();
        
        // Сохраняем время тренировки в БД
        await window.app.apiRequest('/api/training/session', {
            method: 'POST',
            body: JSON.stringify({
                textId: currentTextId,
                durationSeconds: elapsedSeconds
            })
        });
        
        // Удаляем из localStorage только после успеха
        localStorage.removeItem('pendingTrainingSession');
        
        // ТЕПЕРЬ останавливаем секундомер
        stopTimer();
        
        // Обновляем UI
        showTrainingComplete();
        updateUIAfterFinish();
        
    } catch (error) {
        // НЕ останавливаем секундомер при ошибке
        // Показываем кнопку повтора
        showRetryButton();
        throw error;
    } finally {
        window.app.hideLoader();
    }
}

function showRetryButton() {
    const finishBtn = document.getElementById('finishBtn');
    if (finishBtn) {
        finishBtn.innerHTML = '<i class="fas fa-redo"></i> Повторить сохранение';
        finishBtn.onclick = retryFinishTraining;
    }
}
```

---

#### BUG-002: XSS уязвимость
**Приоритет:** P0  
**Оценка:** 6 часов

**План исправления:**
1. Заменить все `innerHTML` на безопасные методы
2. Валидировать и санитизировать все пользовательские данные
3. Использовать `createElement` для создания DOM элементов
4. Добавить Content Security Policy (CSP) заголовки

**Код:**
```javascript
class SecurityUtils {
    static sanitizeEmoji(emoji) {
        // Проверка на валидные emoji символы
        const emojiRegex = /^[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]$/u;
        return emojiRegex.test(emoji) ? emoji : '🖼️';
    }
    
    static sanitizeImageUrl(url) {
        // Валидация URL изображения
        try {
            const urlObj = new URL(url);
            if (!['http:', 'https:'].includes(urlObj.protocol)) {
                return null;
            }
            // Проверка на допустимые домены (опционально)
            return url;
        } catch {
            return null;
        }
    }
    
    static createSafeAssociationElement(fragment) {
        const container = document.createElement('div');
        
        if (fragment.emoji) {
            const emoji = this.sanitizeEmoji(fragment.emoji);
            container.textContent = emoji;
            container.className = 'association-emoji';
        } else if (fragment.customImage) {
            const url = this.sanitizeImageUrl(fragment.customImage);
            if (url) {
                const img = document.createElement('img');
                img.src = url;
                img.alt = 'Ассоциация';
                img.className = 'association-image';
                container.appendChild(img);
            }
        } else if (fragment.customWord) {
            container.textContent = fragment.customWord;
            container.className = 'association-word';
        }
        
        container.addEventListener('click', () => openWizardForFragment());
        return container;
    }
}
```

**Изменения в routes:**
- Добавить валидацию на сервере для всех пользовательских данных
- Использовать библиотеку `validator` для санитизации

---

### 2.2. Высокие баги (P1)

#### BUG-003: Потеря введённой фразы на последнем слайде
**Приоритет:** P1  
**Оценка:** 1 час

**План исправления:**
Сохранять введённую фразу ПЕРЕД проверкой индекса

**Код:**
```javascript
function goToNext() {
    // Сохраняем введённую фразу ДО проверки
    const fragmentInput = document.getElementById('fragmentInput');
    if (fragmentInput && fragmentInput.value.trim()) {
        // Сохраняем для следующего фрагмента (может быть последним)
        const nextIndex = currentFragmentIndex + 1;
        if (nextIndex < trainingFragments.length) {
            userInputs[nextIndex] = fragmentInput.value.trim();
        }
    }
    
    if (currentFragmentIndex < trainingFragments.length - 1) {
        currentFragmentIndex++;
        displayCurrentFragment();
        // ... анимация
    } else {
        showTrainingComplete();
    }
}
```

---

#### BUG-004: Индикатор прогресса на слайде ввода
**Приоритет:** P1  
**Оценка:** 1 час

**План исправления:**
Добавить проверку на специальный индекс слайда ввода

**Код:**
```javascript
function updateFragmentIndicator() {
    const fragmentIndicator = document.getElementById('fragmentIndicator');
    if (!fragmentIndicator) return;
    
    // Специальная обработка для слайда ввода
    if (currentFragmentIndex === -1) {
        const dots = trainingFragments.map(() => {
            return `<div class="fragment-dot"></div>`;
        }).join('');
        fragmentIndicator.innerHTML = dots;
        return;
    }
    
    const dots = trainingFragments.map((_, index) => {
        let className = 'fragment-dot';
        if (index < currentFragmentIndex) {
            className += ' completed';
        } else if (index === currentFragmentIndex) {
            className += ' active';
        }
        return `<div class="${className}" onclick="goToFragment(${index})"></div>`;
    }).join('');
    
    fragmentIndicator.innerHTML = dots;
}
```

---

#### BUG-005: Защита от повторных запросов
**Приоритет:** P1  
**Оценка:** 2 часа

**План исправления:**
Добавить флаг блокировки и дебаунсинг

**Код:**
```javascript
let isFinishing = false;

async function finishTraining() {
    // Защита от повторных вызовов
    if (isFinishing) {
        console.warn('Training finish already in progress');
        return;
    }
    
    isFinishing = true;
    
    // Блокируем кнопку
    const finishBtn = document.getElementById('finishBtn');
    if (finishBtn) {
        finishBtn.disabled = true;
        finishBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Сохранение...';
    }
    
    try {
        // ... логика сохранения
    } catch (error) {
        // Разблокируем при ошибке для возможности повтора
        isFinishing = false;
        if (finishBtn) {
            finishBtn.disabled = false;
            finishBtn.innerHTML = '<i class="fas fa-check"></i> Завершить тренировку';
        }
        throw error;
    } finally {
        // isFinishing остается true при успехе
        window.app.hideLoader();
    }
}
```

---

## 3. ДОПОЛНИТЕЛЬНЫЕ БАГИ, НАЙДЕННЫЕ ПРИ ТЕСТИРОВАНИИ

### BUG-013: N+1 проблема в endpoint /available
**Приоритет:** P1 - High  
**Серьёзность:** Medium  
**Тип:** Performance

**Описание:**
В `routes/training.js:59-111` для каждого текста выполняется отдельный запрос к БД для получения фрагментов. При 10 текстах это 11 запросов вместо 2.

**Шаги воспроизведения:**
1. Создать 10 текстов с фрагментами
2. Открыть список доступных текстов
3. Наблюдать в DevTools Network tab множественные запросы

**Ожидаемое поведение:**
- Один запрос для получения всех текстов
- Один запрос для получения всех фрагментов с JOIN

**Фактическое поведение:**
- N+1 запросов к БД

**Файлы:**
- `routes/training.js:59-111`

**Решение:**
```javascript
// Добавить метод в Database
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
```

---

### BUG-014: Утечка памяти при переключении текстов
**Приоритет:** P2 - Medium  
**Серьёзность:** Low  
**Тип:** Memory Leak

**Описание:**
При переключении между текстами не очищаются обработчики событий и интервалы. `timerInterval` может продолжать работать.

**Шаги воспроизведения:**
1. Начать тренировку (запускается таймер)
2. Выбрать другой текст
3. Наблюдать, что старый таймер может продолжать работать

**Решение:**
```javascript
function loadTrainingText() {
    // Очищаем предыдущую тренировку
    cleanupTraining();
    
    // ... остальной код
}

function cleanupTraining() {
    stopTimer();
    resetTimer();
    userInputs = [];
    currentFragmentIndex = 0;
    // Очищаем обработчики если нужно
}
```

---

### BUG-015: Race condition при быстром переключении слайдов
**Приоритет:** P2 - Medium  
**Серьёзность:** Low  
**Тип:** Concurrency

**Описание:**
При быстром нажатии "Далее" несколько раз подряд может возникнуть ситуация, когда `displayCurrentFragment()` вызывается с устаревшим `currentFragmentIndex`.

**Решение:**
```javascript
let isNavigating = false;

function goToNext() {
    if (isNavigating) return;
    isNavigating = true;
    
    try {
        // ... логика навигации
    } finally {
        setTimeout(() => {
            isNavigating = false;
        }, 100);
    }
}
```

---

### BUG-016: Отсутствие валидации на сервере для durationSeconds
**Приоритет:** P2 - Medium  
**Серьёзность:** Medium  
**Тип:** Data Validation

**Описание:**
На сервере проверяется только `durationSeconds < 0`, но нет проверки на максимальное значение. Можно отправить очень большое число.

**Решение:**
```javascript
// routes/training.js
const MAX_DURATION = 86400; // 24 hours

if (!textId || !durationSeconds || durationSeconds < 0 || durationSeconds > MAX_DURATION) {
    return res.status(400).json({ 
        error: `Длительность тренировки должна быть от 0 до ${MAX_DURATION} секунд` 
    });
}
```

---

### BUG-017: Небезопасное использование onclick в innerHTML
**Приоритет:** P1 - High  
**Серьёзность:** Medium  
**Тип:** Security

**Описание:**
В `displayStoryChain()` и `updateFragmentIndicator()` используется `onclick="goToFragment(${index})"` в innerHTML. Хотя `index` - это число, это плохая практика.

**Решение:**
Использовать `addEventListener` вместо inline обработчиков:
```javascript
function displayStoryChain() {
    const chainLine = document.getElementById('chainLine');
    if (!chainLine) return;
    
    chainLine.innerHTML = ''; // Очищаем
    
    trainingFragments.forEach((fragment, index) => {
        const div = document.createElement('div');
        div.className = `chain-emoji ${index === currentFragmentIndex ? 'active' : ''}`;
        div.textContent = fragment.emoji || fragment.customWord || '🖼️';
        div.addEventListener('click', () => goToFragment(index));
        chainLine.appendChild(div);
    });
}
```

---

### BUG-018: Отсутствие проверки на пустой массив фрагментов
**Приоритет:** P2 - Medium  
**Серьёзность:** Low  
**Тип:** Edge Case

**Описание:**
Если `trainingFragments.length === 0`, приложение может работать некорректно.

**Решение:**
```javascript
async function loadTrainingText() {
    // ... загрузка данных
    
    if (trainingFragments.length === 0) {
        window.app.showNotification('Текст не содержит фрагментов для тренировки', 'error');
        showTextSelection();
        return;
    }
    
    // ... остальной код
}
```

---

## 4. НЕИСПОЛЬЗУЕМЫЙ КОД

### 4.1. Неиспользуемые методы БД

#### getTrainingSessionsByUserId
**Файл:** `models/database.js:210-213`  
**Статус:** Не используется нигде в коде  
**Действие:** Удалить или использовать для статистики

#### getTrainingSessionsByTextId
**Файл:** `models/database.js:215-218`  
**Статус:** Не используется нигде в коде  
**Действие:** Удалить или использовать для статистики

**Рекомендация:** Оставить методы для будущей функциональности статистики, но добавить TODO комментарий.

---

### 4.2. Неиспользуемые переменные и функции

#### Пустые блоки кода
**Файл:** `public/js/training.js:722-727`  
**Описание:** Пустой блок if с комментарием  
**Действие:** Удалить или реализовать логику

```javascript
// УДАЛИТЬ:
const completeTitle = document.getElementById('completeTitle');
if (completeTitle && !completeTitle.dataset.completed) {
    // Если тренировка еще не завершена через finishTraining, оставляем "Конец"
    // Это для случая, когда пользователь просто дошел до конца без нажатия кнопки
}
```

---

### 4.3. Дублирование кода

#### Повторяющаяся логика показа/скрытия элементов
**Файлы:** Множественные функции  
**Описание:** Повторяется паттерн `if (element) element.style.display = 'block/none'`  
**Действие:** Вынести в утилиту

```javascript
// Создать утилиту
class DOMUtils {
    static show(elementId) {
        const el = document.getElementById(elementId);
        if (el) el.style.display = 'block';
    }
    
    static hide(elementId) {
        const el = document.getElementById(elementId);
        if (el) el.style.display = 'none';
    }
    
    static toggle(elementId, show) {
        if (show) this.show(elementId);
        else this.hide(elementId);
    }
}
```

---

## 5. ОПТИМИЗАЦИЯ РАБОТЫ С БАЗОЙ ДАННЫХ

### 5.1. Индексы БД
**Приоритет:** High  
**Оценка:** 1 час

**Проблема:**
Отсутствуют индексы на часто используемых полях.

**Решение:**
```sql
-- Добавить индексы
CREATE INDEX IF NOT EXISTS idx_texts_user_id ON texts(user_id);
CREATE INDEX IF NOT EXISTS idx_text_fragments_text_id ON text_fragments(text_id);
CREATE INDEX IF NOT EXISTS idx_training_sessions_user_id ON training_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_training_sessions_text_id ON training_sessions(text_id);
CREATE INDEX IF NOT EXISTS idx_training_sessions_created_at ON training_sessions(created_at);
```

**Файл:** `models/database.js` - добавить в `createTables()`

---

### 5.2. Оптимизация запросов

#### 5.2.1. Исправление N+1 проблемы в /available
**Приоритет:** High  
**Оценка:** 2 часа

**Текущий код:**
```javascript
texts.forEach(text => {
    req.db.getFragmentsByTextId(text.id, (err, fragments) => {
        // N запросов
    });
});
```

**Оптимизированный код:**
```javascript
// Вариант 1: Один запрос с JOIN
router.get('/available', authenticateToken, (req, res) => {
    const userId = req.user.id;
    
    req.db.getTextsWithFragmentsCount(userId, (err, texts) => {
        if (err) {
            return res.status(500).json({ error: 'Ошибка получения текстов' });
        }
        
        // Фильтруем только готовые тексты
        const availableTexts = texts.filter(t => 
            t.fragment_count > 0 && t.fragment_count === t.complete_fragments
        );
        
        res.json({ texts: availableTexts });
    });
});
```

---

#### 5.2.2. Кэширование результатов запросов
**Приоритет:** Medium  
**Оценка:** 4 часа

**Проблема:**
Список доступных текстов загружается каждый раз заново, даже если данные не изменились.

**Решение:**
1. Реализовать кэширование на клиенте (localStorage)
2. Добавить ETag на сервере для проверки изменений
3. Использовать HTTP кэширование

**Код:**
```javascript
// Клиент
class TrainingCache {
    static getAvailableTexts() {
        const cached = localStorage.getItem('availableTexts');
        if (cached) {
            const { data, timestamp } = JSON.parse(cached);
            // Кэш действителен 5 минут
            if (Date.now() - timestamp < 5 * 60 * 1000) {
                return data;
            }
        }
        return null;
    }
    
    static setAvailableTexts(texts) {
        localStorage.setItem('availableTexts', JSON.stringify({
            data: texts,
            timestamp: Date.now()
        }));
    }
}

// Сервер - добавить ETag
router.get('/available', authenticateToken, (req, res) => {
    // ... получение данных
    
    const etag = generateETag(texts);
    res.set('ETag', etag);
    
    if (req.headers['if-none-match'] === etag) {
        return res.status(304).end();
    }
    
    res.json({ texts });
});
```

---

#### 5.2.3. Подготовленные запросы (Prepared Statements)
**Приоритет:** Medium  
**Оценка:** 2 часа

**Проблема:**
Хотя используются prepared statements, можно оптимизировать повторное использование.

**Решение:**
Кэшировать подготовленные запросы:
```javascript
class Database {
    constructor() {
        // ...
        this.preparedStatements = new Map();
    }
    
    prepareStatement(query) {
        if (!this.preparedStatements.has(query)) {
            const stmt = this.db.prepare(query);
            this.preparedStatements.set(query, stmt);
        }
        return this.preparedStatements.get(query);
    }
}
```

---

### 5.3. Оптимизация сохранения сессий

#### 5.3.1. Батчинг запросов
**Приоритет:** Low  
**Оценка:** 3 часа

**Проблема:**
Если пользователь быстро завершает несколько тренировок, каждый запрос выполняется отдельно.

**Решение:**
Реализовать очередь запросов с батчингом:
```javascript
class RequestBatcher {
    constructor(batchSize = 5, delay = 1000) {
        this.queue = [];
        this.batchSize = batchSize;
        this.delay = delay;
        this.timer = null;
    }
    
    add(request) {
        this.queue.push(request);
        this.scheduleBatch();
    }
    
    scheduleBatch() {
        if (this.timer) return;
        
        this.timer = setTimeout(() => {
            this.processBatch();
        }, this.delay);
    }
    
    async processBatch() {
        const batch = this.queue.splice(0, this.batchSize);
        // Обработка батча
        this.timer = null;
        if (this.queue.length > 0) {
            this.scheduleBatch();
        }
    }
}
```

---

## 6. ПЛАН ВНЕДРЕНИЯ

### Фаза 1: Критические исправления (1-2 недели)
1. BUG-001: Потеря данных при ошибке
2. BUG-002: XSS уязвимость
3. BUG-005: Защита от дублирования
4. BUG-017: Безопасные обработчики событий

### Фаза 2: Высокие приоритеты (2-3 недели)
1. BUG-003: Потеря фразы на последнем слайде
2. BUG-004: Индикатор прогресса
3. BUG-013: N+1 проблема
4. Рефакторинг на модули (начало)

### Фаза 3: Оптимизация и рефакторинг (3-4 недели)
1. Завершение модульного рефакторинга
2. Оптимизация БД (индексы, кэширование)
3. Исправление средних багов
4. Удаление неиспользуемого кода

### Фаза 4: Полировка (1 неделя)
1. Улучшение обработки ошибок
2. Оптимизация производительности
3. Финальное тестирование
4. Документация

---

## 7. МЕТРИКИ УСПЕХА

### Производительность
- Время загрузки списка текстов: < 500ms (сейчас ~2-3s при 10 текстах)
- Время отклика навигации: < 100ms
- Использование памяти: стабильное, без утечек

### Безопасность
- 0 XSS уязвимостей
- Все пользовательские данные валидируются и санитизируются
- CSP заголовки настроены

### Качество кода
- Покрытие тестами: > 80%
- Цикломатическая сложность: < 10 для каждой функции
- Дублирование кода: < 5%

---

## 8. РИСКИ И МИТИГАЦИЯ

### Риск 1: Регрессии при рефакторинге
**Митигация:** 
- Постепенный рефакторинг с тестированием после каждого шага
- Покрытие тестами перед рефакторингом

### Риск 2: Производительность при модулизации
**Митигация:**
- Использование tree-shaking
- Ленивая загрузка модулей

### Риск 3: Совместимость с существующим кодом
**Митигация:**
- Сохранение публичного API
- Версионирование изменений

---

**Подготовил:** Senior Fullstack Developer  
**Дата:** 2024  
**Общая оценка времени:** ~60-80 часов

