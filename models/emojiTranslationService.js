const translate = require('google-translate-api-x');
const { searchEmojis } = require('./emojiMartDatabase');

// Функция для разбиения текста на слова
function extractWords(text) {
    // Удаляем знаки препинания и разбиваем на слова
    return text
        .toLowerCase()
        .replace(/[^\w\s]/g, ' ') // Заменяем знаки препинания на пробелы
        .split(/\s+/) // Разбиваем по пробелам
        .filter(word => word.length > 2) // Фильтруем короткие слова
        .filter(word => !/^\d+$/.test(word)); // Исключаем числа
}

// Функция для перевода слова на английский
async function translateWord(word, sourceLang = 'de') {
    try {
        const result = await translate(word, { 
            from: sourceLang, 
            to: 'en',
            tld: 'com'
        });
        
        // Возвращаем массив возможных переводов
        return [result.text, ...(result.from?.text?.value ? [result.from.text.value] : [])];
    } catch (error) {
        console.error(`Translation error for word "${word}":`, error.message);
        return [word]; // Возвращаем исходное слово, если перевод не удался
    }
}

// Функция для поиска эмодзи по переведенным словам
async function findEmojisForWord(word, maxEmojis = 3) {
    try {
        const emojis = await searchEmojis(word);
        return emojis.slice(0, maxEmojis);
    } catch (error) {
        console.error(`Emoji search error for word "${word}":`, error.message);
        return [];
    }
}

// Основная функция для поиска эмодзи по немецкому тексту
async function findEmojisForGermanText(germanText, maxEmojis = 10) {
    console.log('Finding emojis for German text:', germanText);
    
    // Извлекаем слова из текста
    const words = extractWords(germanText);
    console.log('Extracted words:', words);
    
    const foundEmojis = new Set(); // Используем Set для избежания дубликатов
    const emojiMap = new Map(); // Для отслеживания связи эмодзи с исходными словами
    
    // Обрабатываем каждое слово
    for (const word of words) {
        if (foundEmojis.size >= maxEmojis) break;
        
        try {
            // Переводим слово на английский
            const translations = await translateWord(word, 'de');
            console.log(`Translations for "${word}":`, translations);
            
            // Ищем эмодзи для каждого перевода
            for (const translation of translations) {
                if (foundEmojis.size >= maxEmojis) break;
                
                const emojis = await findEmojisForWord(translation, 2);
                console.log(`Emojis for "${translation}":`, emojis.length);
                
                // Добавляем найденные эмодзи
                for (const emoji of emojis) {
                    if (foundEmojis.size >= maxEmojis) break;
                    
                    const emojiKey = emoji.native; // Используем native как уникальный ключ
                    if (!foundEmojis.has(emojiKey)) {
                        foundEmojis.add(emojiKey);
                        emojiMap.set(emojiKey, {
                            ...emoji,
                            originalWord: word,
                            translation: translation
                        });
                    }
                }
            }
        } catch (error) {
            console.error(`Error processing word "${word}":`, error.message);
        }
    }
    
    // Преобразуем Set обратно в массив
    const result = Array.from(foundEmojis).map(emojiKey => emojiMap.get(emojiKey));
    
    console.log(`Found ${result.length} unique emojis`);
    return result;
}

// Функция для определения языка текста (простая эвристика)
function detectLanguage(text) {
    // Простая эвристика для определения языка
    const germanWords = ['der', 'die', 'das', 'und', 'ist', 'in', 'mit', 'auf', 'für', 'von', 'zu', 'an', 'als', 'nach', 'über', 'durch', 'bei', 'aus', 'um', 'am', 'im', 'zum', 'zur', 'beim', 'vom', 'zur'];
    const englishWords = ['the', 'and', 'is', 'in', 'with', 'on', 'for', 'from', 'to', 'at', 'as', 'after', 'over', 'through', 'by', 'out', 'around', 'am', 'im', 'zum', 'zur', 'beim', 'vom', 'zur'];
    
    const words = text.toLowerCase().split(/\s+/);
    const germanCount = words.filter(word => germanWords.includes(word)).length;
    const englishCount = words.filter(word => englishWords.includes(word)).length;
    
    if (germanCount > englishCount) return 'de';
    if (englishCount > germanCount) return 'en';
    return 'de'; // По умолчанию считаем немецким
}

// Универсальная функция для поиска эмодзи по тексту на любом языке
async function findEmojisForText(text, maxEmojis = 10) {
    const language = detectLanguage(text);
    console.log(`Detected language: ${language}`);
    
    if (language === 'en') {
        // Для английского текста ищем эмодзи напрямую
        const words = extractWords(text);
        const foundEmojis = new Set();
        const emojiMap = new Map();
        
        for (const word of words) {
            if (foundEmojis.size >= maxEmojis) break;
            
            const emojis = await findEmojisForWord(word, 2);
            for (const emoji of emojis) {
                if (foundEmojis.size >= maxEmojis) break;
                
                const emojiKey = emoji.native;
                if (!foundEmojis.has(emojiKey)) {
                    foundEmojis.add(emojiKey);
                    emojiMap.set(emojiKey, {
                        ...emoji,
                        originalWord: word,
                        translation: word
                    });
                }
            }
        }
        
        return Array.from(foundEmojis).map(emojiKey => emojiMap.get(emojiKey));
    } else {
        // Для других языков используем перевод
        return await findEmojisForGermanText(text, maxEmojis);
    }
}

module.exports = {
    findEmojisForGermanText,
    findEmojisForText,
    translateWord,
    extractWords,
    detectLanguage
};

