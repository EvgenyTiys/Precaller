// Русско-английский словарь
// Для перевода русских названий эмодзи на английский

const { emojiDatabase } = require('../emojiDatabase');

// Создаем обратный индекс: русское слово -> английские переводы
const russianToEnglishIndex = {};

// Заполняем индекс из базы эмодзи
for (const [emoji, translations] of Object.entries(emojiDatabase)) {
    const ruWords = translations.ru || [];
    const enWords = translations.en || [];
    
    for (const ruWord of ruWords) {
        const key = ruWord.toLowerCase().trim();
        if (!russianToEnglishIndex[key]) {
            russianToEnglishIndex[key] = new Set();
        }
        enWords.forEach(enWord => {
            russianToEnglishIndex[key].add(enWord.toLowerCase());
        });
    }
}

// Дополнительный статический словарь для общих слов
const staticDict = {
    // Эмоции
    'радость': ['joy', 'happiness'],
    'счастье': ['happiness', 'joy'],
    'грусть': ['sadness', 'sorrow'],
    'печаль': ['sadness', 'grief'],
    'злость': ['anger', 'rage'],
    'гнев': ['anger', 'wrath'],
    'страх': ['fear', 'fright'],
    'любовь': ['love'],
    'ненависть': ['hate', 'hatred'],
    
    // Действия
    'идти': ['walk', 'go'],
    'бежать': ['run'],
    'прыгать': ['jump'],
    'летать': ['fly'],
    'плавать': ['swim'],
    'есть': ['eat'],
    'пить': ['drink'],
    'спать': ['sleep'],
    'работать': ['work'],
    'учиться': ['study', 'learn'],
    'читать': ['read'],
    'писать': ['write'],
    'говорить': ['speak', 'talk'],
    
    // Предметы
    'дом': ['house', 'home'],
    'машина': ['car', 'automobile'],
    'книга': ['book'],
    'еда': ['food'],
    'вода': ['water'],
    'огонь': ['fire'],
    'земля': ['earth', 'ground'],
    'небо': ['sky', 'heaven'],
    'солнце': ['sun'],
    'луна': ['moon'],
    'звезда': ['star'],
    'дерево': ['tree'],
    'цветок': ['flower'],
    
    // Животные
    'собака': ['dog'],
    'кошка': ['cat'],
    'птица': ['bird'],
    'рыба': ['fish'],
    'лошадь': ['horse'],
    'корова': ['cow'],
    'медведь': ['bear'],
    'волк': ['wolf'],
    'лиса': ['fox'],
    'заяц': ['rabbit', 'hare'],
    
    // Время
    'время': ['time'],
    'день': ['day'],
    'ночь': ['night'],
    'утро': ['morning'],
    'вечер': ['evening'],
    'час': ['hour'],
    'минута': ['minute'],
    'секунда': ['second'],
    'год': ['year'],
    'месяц': ['month'],
    'неделя': ['week'],
    
    // Природа
    'гора': ['mountain'],
    'река': ['river'],
    'море': ['sea', 'ocean'],
    'озеро': ['lake'],
    'лес': ['forest', 'woods'],
    'поле': ['field'],
    'дождь': ['rain'],
    'снег': ['snow'],
    'ветер': ['wind'],
    'облако': ['cloud'],
    
    // Семья
    'мать': ['mother', 'mom'],
    'отец': ['father', 'dad'],
    'сын': ['son'],
    'дочь': ['daughter'],
    'брат': ['brother'],
    'сестра': ['sister'],
    'друг': ['friend'],
    'ребенок': ['child', 'kid']
};

/**
 * Переводит русское слово на английский
 * @param {string} russianWord - Русское слово
 * @returns {Promise<Array<string>>} Массив возможных переводов
 */
async function translate(russianWord) {
    const word = russianWord.toLowerCase().trim();
    const translations = new Set();
    
    // 1. Проверяем индекс из базы эмодзи
    if (russianToEnglishIndex[word]) {
        russianToEnglishIndex[word].forEach(t => translations.add(t));
    }
    
    // 2. Проверяем статический словарь
    if (staticDict[word]) {
        staticDict[word].forEach(t => translations.add(t));
    }
    
    // 3. Попытка нормализации (убираем окончания)
    const normalizedWord = normalizeRussianWord(word);
    if (normalizedWord !== word) {
        if (russianToEnglishIndex[normalizedWord]) {
            russianToEnglishIndex[normalizedWord].forEach(t => translations.add(t));
        }
        if (staticDict[normalizedWord]) {
            staticDict[normalizedWord].forEach(t => translations.add(t));
        }
    }
    
    return Array.from(translations);
}

/**
 * Нормализация русского слова (убираем окончания)
 */
function normalizeRussianWord(word) {
    const endings = ['ка', 'ок', 'ик', 'ек', 'ов', 'ев', 'ий', 'ая', 'ое', 'ые', 'а', 'о', 'у', 'ы', 'и', 'е', 'ь'];
    
    for (const ending of endings) {
        if (word.endsWith(ending) && word.length > ending.length + 2) {
            return word.slice(0, -ending.length);
        }
    }
    
    return word;
}

/**
 * Проверить, есть ли слово в словаре
 */
function has(russianWord) {
    const word = russianWord.toLowerCase().trim();
    return russianToEnglishIndex[word] !== undefined || staticDict[word] !== undefined;
}

/**
 * Получить размер словаря
 */
function getSize() {
    return Object.keys(russianToEnglishIndex).length + Object.keys(staticDict).length;
}

module.exports = {
    translate,
    has,
    getSize,
    normalizeRussianWord
};


