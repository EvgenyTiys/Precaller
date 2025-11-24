// Немецко-английский словарь
// Использует существующий словарь из offlineTranslationService + расширения

const { germanEnglishDict: baseDict, wordForms } = require('../dictionaryData/germanEnglish');
const natural = require('natural');

/**
 * Переводит немецкое слово на английский
 * @param {string} germanWord - Немецкое слово
 * @returns {Promise<Array<string>>} Массив возможных переводов
 */
async function translate(germanWord) {
    const word = germanWord.toLowerCase().trim();
    const translations = new Set();
    
    // 1. Прямое совпадение в словаре
    if (baseDict[word]) {
        const trans = baseDict[word];
        if (Array.isArray(trans)) {
            trans.forEach(t => translations.add(t));
        } else {
            translations.add(trans);
        }
    }
    
    // 2. Попытка нормализации через формы слов
    const normalizedWord = normalizeGermanWord(word);
    if (normalizedWord !== word && baseDict[normalizedWord]) {
        const trans = baseDict[normalizedWord];
        if (Array.isArray(trans)) {
            trans.forEach(t => translations.add(t));
        } else {
            translations.add(trans);
        }
    }
    
    // 3. Эвристика для распространенных суффиксов
    const heuristicTranslations = applyHeuristics(word);
    heuristicTranslations.forEach(t => translations.add(t));
    
    // 4. Добавляем синонимы найденных переводов
    const translationsArray = Array.from(translations);
    for (const trans of translationsArray.slice(0, 2)) { // Только первые 2
        const synonyms = getBasicSynonyms(trans);
        synonyms.slice(0, 2).forEach(s => translations.add(s));
    }
    
    return Array.from(translations);
}

/**
 * Нормализация немецкого слова
 */
function normalizeGermanWord(word) {
    const cleanWord = word.toLowerCase().trim();
    
    // Проверяем словарь форм
    if (wordForms[cleanWord]) {
        return wordForms[cleanWord];
    }
    
    // Убираем распространенные окончания
    const endings = ['en', 'n', 'e', 's', 'er', 'es', 'em', 'ung', 'heit', 'keit', 'schaft'];
    for (const ending of endings) {
        if (cleanWord.endsWith(ending) && cleanWord.length > ending.length + 2) {
            const stem = cleanWord.slice(0, -ending.length);
            if (baseDict[stem]) {
                return stem;
            }
        }
    }
    
    return cleanWord;
}

/**
 * Применение эвристик для перевода
 */
function applyHeuristics(word) {
    const translations = [];
    
    // Суффикс -isch → -ish
    if (word.endsWith('isch')) {
        translations.push(word.replace(/isch$/, 'ish'));
    }
    
    // Суффикс -tion → -tion (одинаковый)
    if (word.endsWith('tion')) {
        translations.push(word);
    }
    
    // Суффикс -ität → -ity
    if (word.endsWith('ität')) {
        translations.push(word.replace(/ität$/, 'ity'));
    }
    
    // Распространенные случаи
    const directMappings = {
        'englisch': 'english',
        'französisch': 'french',
        'spanisch': 'spanish',
        'italienisch': 'italian',
        'russisch': 'russian',
        'chinesisch': 'chinese',
        'japanisch': 'japanese'
    };
    
    if (directMappings[word]) {
        translations.push(directMappings[word]);
    }
    
    return translations;
}

/**
 * Базовые синонимы для распространенных слов
 */
function getBasicSynonyms(word) {
    const synonymMap = {
        'sleep': ['rest', 'nap', 'slumber'],
        'work': ['job', 'labor', 'task'],
        'food': ['meal', 'dish', 'nutrition'],
        'time': ['moment', 'period', 'hour'],
        'house': ['home', 'building', 'residence'],
        'car': ['vehicle', 'automobile'],
        'book': ['publication', 'text'],
        'water': ['liquid', 'fluid'],
        'money': ['cash', 'currency'],
        'day': ['date', 'daytime'],
        'night': ['evening', 'darkness'],
        'happy': ['joy', 'glad', 'cheerful'],
        'sad': ['unhappy', 'melancholy'],
        'big': ['large', 'huge'],
        'small': ['tiny', 'little'],
        'friend': ['buddy', 'companion', 'pal'],
        'dog': ['canine', 'hound', 'puppy'],
        'cat': ['feline', 'kitten'],
        'tree': ['plant', 'wood'],
        'flower': ['blossom', 'bloom'],
        'sun': ['sunshine', 'solar'],
        'moon': ['lunar'],
        'star': ['stellar'],
        'mountain': ['peak', 'summit'],
        'ocean': ['sea', 'water'],
        'river': ['stream', 'creek'],
        'coffee': ['java', 'brew'],
        'tea': ['beverage'],
        'bread': ['loaf'],
        'child': ['kid', 'youngster'],
        'mother': ['mom', 'mama'],
        'father': ['dad', 'papa']
    };
    
    return synonymMap[word] || [];
}

/**
 * Проверить, есть ли слово в словаре
 */
function has(germanWord) {
    const word = germanWord.toLowerCase().trim();
    return baseDict[word] !== undefined || wordForms[word] !== undefined;
}

/**
 * Получить размер словаря
 */
function getSize() {
    return Object.keys(baseDict).length;
}

module.exports = {
    translate,
    has,
    getSize,
    normalizeGermanWord
};


