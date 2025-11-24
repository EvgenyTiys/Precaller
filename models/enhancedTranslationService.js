/**
 * Улучшенный сервис автоподбора эмодзи для фрагментов текста
 * 
 * Особенности:
 * - Использует язык текста из БД (не автоопределение)
 * - Полноценный словарь для перевода
 * - Онтологию WordNet для расширения
 * - Интеграцию с русской базой эмодзи
 * - Фильтрацию стоп-слов
 * - Лемматизацию
 */

const WordPOS = require('wordpos');
const wordpos = new WordPOS();
const winkLemmatizer = require('wink-lemmatizer');

const ontologyService = require('./ontologyService');
const germanEnglishDict = require('./dictionaries/germanEnglishDict');
const russianEnglishDict = require('./dictionaries/russianEnglishDict');

// Словари переводов
const dictionaryServices = {
    'de': germanEnglishDict,
    'ru': russianEnglishDict,
    'en': null // Для английского перевод не нужен
};

/**
 * Главная функция автоподбора эмодзи для фрагмента
 * @param {string} fragmentText - Текст фрагмента
 * @param {string} language - Язык текста (из БД): 'de', 'en', 'ru'
 * @param {number} maxEmojis - Максимум эмодзи
 * @returns {Promise<Array>} Массив объектов эмодзи
 */
async function findEmojisForFragment(fragmentText, language, maxEmojis = 10) {
    console.log(`\n[AUTO-EMOJI] ========================================`);
    console.log(`[AUTO-EMOJI] Fragment: "${fragmentText}"`);
    console.log(`[AUTO-EMOJI] Language: ${language}`);
    console.log(`[AUTO-EMOJI] Max emojis: ${maxEmojis}`);
    
    try {
        // 1. Извлекаем ключевые слова
        const keywords = await extractKeywords(fragmentText, language);
        console.log(`[AUTO-EMOJI] Keywords (${keywords.length}):`, keywords);
        
        if (keywords.length === 0) {
            console.log(`[AUTO-EMOJI] No keywords found, returning empty`);
            return [];
        }
        
        // 2. Переводим слова на английский (если не английский)
        const englishWords = language === 'en' 
            ? keywords 
            : await translateToEnglish(keywords, language);
        console.log(`[AUTO-EMOJI] English words (${englishWords.length}):`, englishWords);
        
        if (englishWords.length === 0) {
            console.log(`[AUTO-EMOJI] No translations found, returning empty`);
            return [];
        }
        
        // 3. Расширяем через онтологию/синонимы
        const expandedWords = await expandWithOntology(englishWords);
        console.log(`[AUTO-EMOJI] Expanded (${expandedWords.length}):`, expandedWords.slice(0, 10), '...');
        
        // 4. Ищем эмодзи по всем источникам
        const emojis = await searchEmojisMultiSource(expandedWords, maxEmojis, language);
        console.log(`[AUTO-EMOJI] Found ${emojis.length} emojis`);
        console.log(`[AUTO-EMOJI] ========================================\n`);
        
        return emojis;
    } catch (error) {
        console.error(`[AUTO-EMOJI] Error in findEmojisForFragment:`, error);
        return [];
    }
}

/**
 * Извлекает ключевые слова из текста
 */
async function extractKeywords(text, language) {
    // Очищаем текст от пунктуации
    const cleanText = text.toLowerCase()
        .replace(/[^\p{L}\s]/gu, ' ')
        .trim();
    
    const words = cleanText.split(/\s+/)
        .filter(word => word.length >= 3);
    
    if (words.length === 0) return [];
    
    // Загружаем стоп-слова для языка
    const stopWords = getStopWords(language);
    
    // Фильтруем стоп-слова
    const filtered = words.filter(word => !stopWords.has(word));
    
    console.log(`[AUTO-EMOJI] After stopwords filter: ${words.length} -> ${filtered.length}`);
    
    if (filtered.length === 0) return words.slice(0, 5); // Берём первые 5 если все стоп-слова
    
    // Лемматизация для английского
    let lemmatized = filtered;
    if (language === 'en') {
        lemmatized = filtered.map(word => {
            // Пробуем как существительное, затем как глагол
            const noun = winkLemmatizer.noun(word);
            if (noun !== word) return noun;
            const verb = winkLemmatizer.verb(word);
            if (verb !== word) return verb;
            return word;
        });
    }
    
    // Фильтруем по частям речи (только для английского с WordNet)
    let keywords = lemmatized;
    if (language === 'en') {
        keywords = await filterByPartOfSpeech(lemmatized);
        if (keywords.length === 0) keywords = lemmatized; // Fallback
    }
    
    // Убираем дубликаты и ограничиваем
    return [...new Set(keywords)].slice(0, 10);
}

/**
 * Переводит слова на английский язык
 */
async function translateToEnglish(words, sourceLanguage) {
    const dictService = dictionaryServices[sourceLanguage];
    
    if (!dictService) {
        console.warn(`[AUTO-EMOJI] No dictionary for ${sourceLanguage}, returning words as-is`);
        return words;
    }
    
    const translations = [];
    
    for (const word of words) {
        try {
            const wordTranslations = await dictService.translate(word);
            if (wordTranslations.length > 0) {
                translations.push(...wordTranslations);
                console.log(`[AUTO-EMOJI] "${word}" -> [${wordTranslations.join(', ')}]`);
            } else {
                // Если перевод не найден, пробуем использовать само слово
                // (может быть интернациональное слово)
                translations.push(word);
                console.log(`[AUTO-EMOJI] "${word}" -> [no translation, using as-is]`);
            }
        } catch (error) {
            console.error(`[AUTO-EMOJI] Error translating "${word}":`, error.message);
        }
    }
    
    return [...new Set(translations)];
}

/**
 * Расширяет слова через онтологию WordNet
 */
async function expandWithOntology(words) {
    const expanded = new Set(words);
    
    for (const word of words.slice(0, 5)) { // Расширяем только первые 5 слов
        try {
            // Получаем связанные слова
            const related = await ontologyService.getRelatedWords(word, 5);
            related.forEach(r => expanded.add(r));
            
            if (related.length > 0) {
                console.log(`[AUTO-EMOJI] Ontology "${word}" -> [${related.slice(0, 3).join(', ')}...]`);
            }
        } catch (error) {
            console.error(`[AUTO-EMOJI] Error expanding "${word}":`, error.message);
        }
    }
    
    return Array.from(expanded);
}

/**
 * Ищет эмодзи по словам из разных источников
 */
async function searchEmojisMultiSource(words, maxEmojis, originalLanguage) {
    const { searchEmojis: searchEmojiMart } = require('./emojiMartDatabase');
    const { emojiDatabase } = require('./emojiDatabase');
    
    const foundEmojis = new Map(); // key: emoji native, value: data
    
    for (const word of words) {
        if (foundEmojis.size >= maxEmojis) break;
        
        // Источник 1: Emoji Mart (английские названия и keywords)
        try {
            const emojiMartResults = await searchEmojiMart(word);
            for (const emoji of emojiMartResults.slice(0, 2)) {
                if (foundEmojis.size >= maxEmojis) break;
                if (!foundEmojis.has(emoji.native)) {
                    foundEmojis.set(emoji.native, {
                        native: emoji.native,
                        name: emoji.name,
                        keywords: emoji.keywords || [],
                        searchWord: word,
                        source: 'emoji-mart'
                    });
                }
            }
        } catch (error) {
            console.error(`[AUTO-EMOJI] Error searching EmojiMart for "${word}":`, error.message);
        }
        
        // Источник 2: Русская база (многоязычная)
        try {
            const russianResults = searchInRussianDatabase(word, emojiDatabase);
            for (const emoji of russianResults.slice(0, 2)) {
                if (foundEmojis.size >= maxEmojis) break;
                if (!foundEmojis.has(emoji)) {
                    foundEmojis.set(emoji, {
                        native: emoji,
                        name: word,
                        keywords: [word],
                        searchWord: word,
                        source: 'russian-db'
                    });
                }
            }
        } catch (error) {
            console.error(`[AUTO-EMOJI] Error searching Russian DB for "${word}":`, error.message);
        }
    }
    
    return Array.from(foundEmojis.values());
}

/**
 * Ищет эмодзи в русской базе по английскому слову
 */
function searchInRussianDatabase(englishWord, emojiDatabase) {
    const results = [];
    const searchLower = englishWord.toLowerCase();
    
    for (const [emoji, translations] of Object.entries(emojiDatabase)) {
        // Проверяем английские переводы
        const enWords = translations.en || [];
        const match = enWords.some(enWord => 
            enWord.toLowerCase() === searchLower || 
            enWord.toLowerCase().includes(searchLower)
        );
        
        if (match) {
            results.push(emoji);
            if (results.length >= 3) break;
        }
    }
    
    return results;
}

/**
 * Загружает стоп-слова для языка
 */
function getStopWords(language) {
    try {
        const stopWordsMap = {
            'de': require('./stopwords/german'),
            'en': require('./stopwords/english'),
            'ru': require('./stopwords/russian')
        };
        
        return stopWordsMap[language] || new Set();
    } catch (error) {
        console.error(`[AUTO-EMOJI] Error loading stopwords for ${language}:`, error.message);
        return new Set();
    }
}

/**
 * Фильтрует слова по части речи (существительные, глаголы, прилагательные)
 */
async function filterByPartOfSpeech(words) {
    const filtered = [];
    
    for (const word of words) {
        try {
            const results = await wordpos.getPOS(word);
            
            // Берём существительные, глаголы, прилагательные
            if (results.nouns.length > 0 || 
                results.verbs.length > 0 || 
                results.adjectives.length > 0) {
                filtered.push(word);
            }
        } catch (error) {
            // В случае ошибки включаем слово
            filtered.push(word);
        }
    }
    
    return filtered;
}

module.exports = {
    findEmojisForFragment,
    extractKeywords,
    translateToEnglish,
    expandWithOntology
};


