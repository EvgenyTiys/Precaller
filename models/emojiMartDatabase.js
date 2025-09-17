// Модуль для работы с эмодзи из Emoji Mart с категориями
const emojiMartData = require('@emoji-mart/data');

// Маппинг категорий на русские названия
const categoryNames = {
    'people': 'Люди',
    'nature': 'Природа',
    'foods': 'Еда',
    'activity': 'Активность',
    'places': 'Места',
    'objects': 'Объекты',
    'symbols': 'Символы',
    'flags': 'Флаги'
};

// Маппинг категорий на иконки (Font Awesome)
const categoryIcons = {
    'people': 'fas fa-user',
    'nature': 'fas fa-leaf',
    'foods': 'fas fa-utensils',
    'activity': 'fas fa-futbol',
    'places': 'fas fa-map-marker-alt',
    'objects': 'fas fa-cube',
    'symbols': 'fas fa-hashtag',
    'flags': 'fas fa-flag'
};

// Функция для получения всех категорий
function getCategories() {
    return emojiMartData.categories.map(category => ({
        id: category.id,
        name: categoryNames[category.id] || category.id,
        icon: categoryIcons[category.id] || 'fas fa-question',
        emojiCount: category.emojis.length
    }));
}

// Функция для получения эмодзи по категории
function getEmojisByCategory(categoryId) {
    const category = emojiMartData.categories.find(cat => cat.id === categoryId);
    if (!category) return [];
    
    return category.emojis.map(emojiId => {
        const emojiData = emojiMartData.emojis[emojiId];
        if (!emojiData) return null;
        
        return {
            id: emojiId,
            name: emojiData.name,
            native: emojiData.skins[0].native,
            keywords: emojiData.keywords || [],
            category: categoryId
        };
    }).filter(Boolean);
}

// Функция для поиска эмодзи по тексту
function searchEmojis(query, language = 'ru') {
    if (!query || query.trim().length === 0) {
        return [];
    }
    
    const searchQuery = query.toLowerCase().trim();
    const results = [];
    
    // Проходим по всем категориям
    emojiMartData.categories.forEach(category => {
        category.emojis.forEach(emojiId => {
            const emojiData = emojiMartData.emojis[emojiId];
            if (!emojiData) return;
            
            // Ищем по ключевым словам и названию
            const keywordMatches = emojiData.keywords.some(keyword => 
                keyword.toLowerCase().includes(searchQuery)
            );
            
            const nameMatches = emojiData.name.toLowerCase().includes(searchQuery);
            
            // Дополнительный поиск по коротким кодам (shortcodes)
            const shortcodeMatches = emojiData.shortcodes && emojiData.shortcodes.some(shortcode => 
                shortcode.toLowerCase().includes(searchQuery)
            );
            
            const matches = keywordMatches || nameMatches || shortcodeMatches;
            
            if (matches) {
                results.push({
                    id: emojiId,
                    name: emojiData.name,
                    native: emojiData.skins[0].native,
                    keywords: emojiData.keywords,
                    shortcodes: emojiData.shortcodes || [],
                    category: category.id
                });
            }
        });
    });
    
    // Сортируем результаты по релевантности
    results.sort((a, b) => {
        // Приоритет: точное совпадение названия > совпадение в начале названия > совпадение в ключевых словах
        const aNameExact = a.name.toLowerCase() === searchQuery;
        const bNameExact = b.name.toLowerCase() === searchQuery;
        if (aNameExact && !bNameExact) return -1;
        if (!aNameExact && bNameExact) return 1;
        
        const aNameStartsWith = a.name.toLowerCase().startsWith(searchQuery);
        const bNameStartsWith = b.name.toLowerCase().startsWith(searchQuery);
        if (aNameStartsWith && !bNameStartsWith) return -1;
        if (!aNameStartsWith && bNameStartsWith) return 1;
        
        return 0;
    });
    
    return results;
}

// Функция для получения случайных эмодзи
function getRandomEmojis(count = 10) {
    const allEmojis = [];
    
    emojiMartData.categories.forEach(category => {
        category.emojis.forEach(emojiId => {
            const emojiData = emojiMartData.emojis[emojiId];
            if (emojiData) {
                allEmojis.push({
                    id: emojiId,
                    name: emojiData.name,
                    native: emojiData.skins[0].native,
                    keywords: emojiData.keywords,
                    category: category.id
                });
            }
        });
    });
    
    // Перемешиваем и берем нужное количество
    const shuffled = allEmojis.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
}

// Функция для получения эмодзи по ID
function getEmojiById(emojiId) {
    const emojiData = emojiMartData.emojis[emojiId];
    if (!emojiData) return null;
    
    return {
        id: emojiId,
        name: emojiData.name,
        native: emojiData.skins[0].native,
        keywords: emojiData.keywords,
        category: getCategoryByEmojiId(emojiId)
    };
}

// Вспомогательная функция для определения категории эмодзи
function getCategoryByEmojiId(emojiId) {
    for (const category of emojiMartData.categories) {
        if (category.emojis.includes(emojiId)) {
            return category.id;
        }
    }
    return null;
}

// Функция для получения эмодзи с переводами (совместимость со старой системой)
function getEmojisWithTranslations(categoryId = null) {
    const emojis = categoryId ? getEmojisByCategory(categoryId) : getRandomEmojis(50);
    
    return emojis.map(emoji => ({
        emoji: emoji.native,
        name: emoji.name,
        keywords: emoji.keywords,
        category: emoji.category,
        // Добавляем базовые переводы для совместимости
        ru: emoji.keywords.slice(0, 3), // Берем первые 3 ключевых слова как переводы
        de: emoji.keywords.slice(0, 3),
        en: emoji.keywords.slice(0, 3)
    }));
}

module.exports = {
    getCategories,
    getEmojisByCategory,
    searchEmojis,
    getRandomEmojis,
    getEmojiById,
    getEmojisWithTranslations,
    categoryNames,
    categoryIcons
};
