const natural = require('natural');
const wordnet = require('wordnet-db');
const { searchEmojis } = require('./emojiMartDatabase');

// Простой оффлайн словарь немецко-английский
const germanEnglishDict = {
    // Основные слова
    'ich': 'i', 'bin': 'am', 'gehe': 'go', 'ins': 'to', 'kino': 'cinema', 'mit': 'with',
    'meinen': 'my', 'freunden': 'friends', 'und': 'and', 'oder': 'or', 'aber': 'but',
    'das': 'the', 'der': 'the', 'die': 'the', 'ein': 'a', 'eine': 'a', 'einen': 'a',
    'ist': 'is', 'sind': 'are', 'war': 'was', 'waren': 'were', 'haben': 'have', 'hat': 'has',
    'werden': 'will', 'kann': 'can', 'muss': 'must', 'soll': 'should', 'will': 'want',
    
    // Действия
    'gehen': 'go', 'kommen': 'come', 'sehen': 'see', 'hören': 'hear', 'sprechen': 'speak',
    'arbeiten': 'work', 'lernen': 'learn', 'studieren': 'study', 'spielen': 'play',
    'essen': 'eat', 'trinken': 'drink', 'schlafen': 'sleep', 'wachen': 'wake',
    'laufen': 'run', 'gehen': 'walk', 'fahren': 'drive', 'fliegen': 'fly',
    
    // Эмоции и состояния
    'glücklich': 'happy', 'traurig': 'sad', 'wütend': 'angry', 'müde': 'tired',
    'krank': 'sick', 'gesund': 'healthy', 'stark': 'strong', 'schwach': 'weak',
    'groß': 'big', 'klein': 'small', 'alt': 'old', 'jung': 'young', 'neu': 'new',
    
    // Места
    'haus': 'house', 'schule': 'school', 'arbeit': 'work', 'stadt': 'city',
    'land': 'country', 'park': 'park', 'strand': 'beach', 'berg': 'mountain',
    'see': 'lake', 'fluss': 'river', 'wald': 'forest', 'garten': 'garden',
    
    // Еда и напитки
    'brot': 'bread', 'wasser': 'water', 'kaffee': 'coffee', 'tee': 'tea',
    'bier': 'beer', 'wein': 'wine', 'fleisch': 'meat', 'fisch': 'fish',
    'obst': 'fruit', 'gemüse': 'vegetables', 'milch': 'milk', 'käse': 'cheese',
    
    // Время
    'heute': 'today', 'gestern': 'yesterday', 'morgen': 'tomorrow', 'jetzt': 'now',
    'später': 'later', 'früher': 'earlier', 'zeit': 'time', 'stunde': 'hour',
    'minute': 'minute', 'sekunde': 'second', 'tag': 'day', 'nacht': 'night',
    'mittag': 'noon', 'mittagsschlaf': 'nap', 'schlaf': 'sleep', 'schlafen': 'sleep',
    'wachzeit': 'wake time', 'stress': 'stress', 'stressphasen': 'stress phases',
    'ressourcen': 'resources', 'körper': 'body', 'erschöpfung': 'exhaustion',
    'experimentiert': 'experimented', 'experimentieren': 'experiment',
    'buch': 'book', 'lesen': 'read', 'matthew': 'matthew', 'walker': 'walker',
    
    // Цвета
    'rot': 'red', 'blau': 'blue', 'grün': 'green', 'gelb': 'yellow',
    'schwarz': 'black', 'weiß': 'white', 'grau': 'gray', 'braun': 'brown',
    'orange': 'orange', 'lila': 'purple', 'rosa': 'pink',
    
    // Животные
    'hund': 'dog', 'katze': 'cat', 'pferd': 'horse', 'kuh': 'cow',
    'schwein': 'pig', 'huhn': 'chicken', 'vogel': 'bird', 'fisch': 'fish',
    'bär': 'bear', 'wolf': 'wolf', 'löwe': 'lion', 'tiger': 'tiger',
    
    // Семья
    'mutter': 'mother', 'vater': 'father', 'sohn': 'son', 'tochter': 'daughter',
    'bruder': 'brother', 'schwester': 'sister', 'großmutter': 'grandmother',
    'großvater': 'grandfather', 'onkel': 'uncle', 'tante': 'aunt',
    
    // Транспорт
    'auto': 'car', 'bus': 'bus', 'zug': 'train', 'flugzeug': 'airplane',
    'fahrrad': 'bicycle', 'motorrad': 'motorcycle', 'boot': 'boat', 'schiff': 'ship',
    
    // Погода
    'sonne': 'sun', 'regen': 'rain', 'schnee': 'snow', 'wind': 'wind',
    'wolke': 'cloud', 'sturm': 'storm', 'gewitter': 'thunderstorm',
    'warm': 'warm', 'kalt': 'cold', 'heiß': 'hot', 'kühl': 'cool',
    
    // Дополнительные слова из текста о сне
    'guten': 'good', 'thema': 'topic', 'themen': 'topics', 'präsentation': 'presentation',
    'erfahrungen': 'experiences', 'erfahrung': 'experience', 'situation': 'situation',
    'heimatland': 'homeland', 'erwachsene': 'adults', 'erwachsener': 'adult',
    'selten': 'rarely', 'seltenen': 'rare', 'chef': 'boss', 'chefs': 'bosses',
    'großer': 'big', 'große': 'big', 'großes': 'big', 'unternehmen': 'company',
    'tun': 'do', 'dies': 'this', 'weil': 'because', 'sie': 'they', 'viel': 'much',
    'arbeiten': 'work', 'einer': 'one', 'einen': 'one', 'von': 'from', 'ihnen': 'them',
    'hat': 'has', 'eine': 'a', 'wohnung': 'apartment', 'der': 'the', 'nähe': 'near',
    'seines': 'his', 'gemietet': 'rented', 'können': 'can', 'kann': 'can',
    'vor': 'before', 'nachteile': 'disadvantages', 'nachteil': 'disadvantage',
    'vorteile': 'advantages', 'vorteil': 'advantage', 'erfrischt': 'refreshes',
    'erfrischen': 'refresh', 'kopf': 'head', 'hilft': 'helps', 'helfen': 'help',
    'dinge': 'things', 'ding': 'thing', 'besser': 'better', 'merken': 'remember',
    'wichtig': 'important', 'berufen': 'professions', 'beruf': 'profession',
    'denen': 'which', 'man': 'one', 'denkarbeit': 'mental work', 'macht': 'makes',
    'hier': 'here', 'noch': 'still', 'für': 'for', 'richtige': 'right',
    'richtigen': 'right', 'ort': 'place', 'finden': 'find', 'immer': 'always',
    'einfach': 'simple', 'außerdem': 'besides', 'passieren': 'happen', 'dass': 'that',
    'wecker': 'alarm', 'nicht': 'not', 'hört': 'hears', 'hören': 'hear',
    'wenn': 'when', 'tief': 'deep', 'schläft': 'sleeps', 'deshalb': 'therefore',
    'besteht': 'exists', 'gefahr': 'danger', 'spät': 'late', 'später': 'later',
    'kommt': 'comes', 'kommen': 'come', 'meinung': 'opinion', 'fünfzehn': 'fifteen',
    'bis': 'until', 'dreißig': 'thirty', 'ideal': 'ideal', 'eindruck': 'impression',
    'wie': 'like', 'länger': 'longer', 'lange': 'long', 'desto': 'the more',
    'mehr': 'more', 'verbraucht': 'consumes', 'verbrauchen': 'consume',
    'weniger': 'less', 'vorhanden': 'available', 'sind': 'are', 'schwieriger': 'more difficult',
    'schwierig': 'difficult', 'es': 'it', 'wiederherstellen': 'restore',
    'verkürzt': 'shortens', 'verkürzen': 'shorten', 'schützt': 'protects',
    'schützen': 'protect', 'bevor': 'before', 'mit': 'with', 'dem': 'the',
    'experimentiert': 'experimented', 'sollte': 'should', 'große': 'big',
    'vom': 'from', 'lesen': 'read', 'alles': 'everything', 'haben': 'have',
    'fragen': 'questions', 'frage': 'question'
};

// Онтологический граф с отношениями
const ontologyGraph = {
    // Ягоды и фрукты
    'berry': {
        'is': ['strawberry', 'raspberry', 'blueberry', 'blackberry', 'cherry'],
        'part_of': ['fruit']
    },
    'strawberry': {
        'is': ['berry'],
        'related_to': ['red', 'sweet', 'summer']
    },
    'raspberry': {
        'is': ['berry'],
        'related_to': ['red', 'pink', 'sweet']
    },
    'blueberry': {
        'is': ['berry'],
        'related_to': ['blue', 'sweet', 'healthy']
    },
    'cherry': {
        'is': ['berry', 'fruit'],
        'related_to': ['red', 'sweet', 'summer']
    },
    'fruit': {
        'is': ['apple', 'orange', 'banana', 'grape', 'pineapple'],
        'part_of': ['food']
    },
    'apple': {
        'is': ['fruit'],
        'related_to': ['red', 'green', 'healthy', 'sweet']
    },
    'orange': {
        'is': ['fruit'],
        'related_to': ['orange', 'citrus', 'vitamin']
    },
    'banana': {
        'is': ['fruit'],
        'related_to': ['yellow', 'sweet', 'potassium']
    },
    
    // Транспорт
    'transport': {
        'is': ['car', 'bus', 'train', 'plane', 'bike', 'motorcycle'],
        'part_of': ['vehicle']
    },
    'car': {
        'is': ['transport', 'vehicle'],
        'related_to': ['road', 'drive', 'fast']
    },
    'bus': {
        'is': ['transport', 'vehicle'],
        'related_to': ['public', 'passengers', 'city']
    },
    'train': {
        'is': ['transport', 'vehicle'],
        'related_to': ['railway', 'fast', 'travel']
    },
    'plane': {
        'is': ['transport', 'vehicle'],
        'related_to': ['air', 'fly', 'travel', 'sky']
    },
    'bike': {
        'is': ['transport', 'vehicle'],
        'related_to': ['cycle', 'exercise', 'eco']
    },
    
    // Животные
    'animal': {
        'is': ['dog', 'cat', 'bird', 'fish', 'horse', 'cow'],
        'part_of': ['nature']
    },
    'dog': {
        'is': ['animal', 'pet'],
        'related_to': ['loyal', 'friend', 'bark']
    },
    'cat': {
        'is': ['animal', 'pet'],
        'related_to': ['independent', 'purr', 'soft']
    },
    'bird': {
        'is': ['animal'],
        'related_to': ['fly', 'feathers', 'sing', 'sky']
    },
    'fish': {
        'is': ['animal'],
        'related_to': ['swim', 'water', 'ocean']
    },
    
    // Эмоции
    'emotion': {
        'is': ['happy', 'sad', 'angry', 'excited', 'worried', 'surprised'],
        'part_of': ['feeling']
    },
    'happy': {
        'is': ['emotion'],
        'related_to': ['joy', 'smile', 'cheerful', 'positive']
    },
    'sad': {
        'is': ['emotion'],
        'related_to': ['cry', 'unhappy', 'depressed', 'negative']
    },
    'angry': {
        'is': ['emotion'],
        'related_to': ['mad', 'frustrated', 'rage', 'negative']
    },
    'excited': {
        'is': ['emotion'],
        'related_to': ['thrilled', 'enthusiastic', 'eager', 'positive']
    },
    
    // Еда
    'food': {
        'is': ['bread', 'meat', 'vegetable', 'drink', 'dessert'],
        'part_of': ['meal']
    },
    'bread': {
        'is': ['food'],
        'related_to': ['bake', 'wheat', 'breakfast']
    },
    'meat': {
        'is': ['food'],
        'related_to': ['protein', 'cook', 'dinner']
    },
    'vegetable': {
        'is': ['food'],
        'related_to': ['healthy', 'green', 'vitamin']
    },
    'drink': {
        'is': ['water', 'juice', 'coffee', 'tea', 'beer'],
        'part_of': ['food']
    },
    'water': {
        'is': ['drink'],
        'related_to': ['liquid', 'clear', 'thirst', 'healthy']
    },
    'coffee': {
        'is': ['drink'],
        'related_to': ['caffeine', 'morning', 'hot', 'brown']
    },
    
    // Природа
    'nature': {
        'is': ['tree', 'flower', 'mountain', 'ocean', 'forest'],
        'part_of': ['environment']
    },
    'tree': {
        'is': ['nature'],
        'related_to': ['green', 'leaves', 'tall', 'forest']
    },
    'flower': {
        'is': ['nature'],
        'related_to': ['beautiful', 'colorful', 'garden', 'spring']
    },
    'mountain': {
        'is': ['nature'],
        'related_to': ['high', 'climb', 'snow', 'peak']
    },
    'ocean': {
        'is': ['nature'],
        'related_to': ['water', 'blue', 'waves', 'sea']
    },
    
    // Время
    'time': {
        'is': ['morning', 'afternoon', 'evening', 'night'],
        'part_of': ['day']
    },
    'morning': {
        'is': ['time'],
        'related_to': ['sunrise', 'breakfast', 'early', 'fresh']
    },
    'afternoon': {
        'is': ['time'],
        'related_to': ['lunch', 'work', 'sunny']
    },
    'evening': {
        'is': ['time'],
        'related_to': ['sunset', 'dinner', 'relax']
    },
    'night': {
        'is': ['time'],
        'related_to': ['dark', 'sleep', 'moon', 'stars']
    },
    
    // Погода
    'weather': {
        'is': ['sun', 'rain', 'snow', 'cloud', 'wind'],
        'part_of': ['climate']
    },
    'sun': {
        'is': ['weather'],
        'related_to': ['bright', 'warm', 'yellow', 'day']
    },
    'rain': {
        'is': ['weather'],
        'related_to': ['wet', 'water', 'umbrella', 'cloudy']
    },
    'snow': {
        'is': ['weather'],
        'related_to': ['cold', 'white', 'winter', 'ice']
    },
    'cloud': {
        'is': ['weather'],
        'related_to': ['sky', 'gray', 'overcast']
    },
    
    // Спорт
    'sport': {
        'is': ['football', 'basketball', 'tennis', 'swimming', 'running'],
        'part_of': ['activity']
    },
    'football': {
        'is': ['sport'],
        'related_to': ['ball', 'team', 'goal', 'field']
    },
    'basketball': {
        'is': ['sport'],
        'related_to': ['ball', 'hoop', 'court', 'team']
    },
    'swimming': {
        'is': ['sport'],
        'related_to': ['water', 'pool', 'exercise', 'summer']
    },
    'running': {
        'is': ['sport'],
        'related_to': ['fast', 'exercise', 'track', 'marathon']
    },
    
    // Технологии
    'technology': {
        'is': ['computer', 'phone', 'internet', 'robot'],
        'part_of': ['modern']
    },
    'computer': {
        'is': ['technology'],
        'related_to': ['work', 'screen', 'keyboard', 'digital']
    },
    'phone': {
        'is': ['technology'],
        'related_to': ['call', 'mobile', 'communication', 'smart']
    },
    'robot': {
        'is': ['technology'],
        'related_to': ['artificial', 'machine', 'future', 'automation']
    }
};

// Словарь форм слов (множественное число -> единственное число)
const wordForms = {
    // Немецкие формы
    'menschen': 'mensch', 'häuser': 'haus', 'autos': 'auto', 'bücher': 'buch',
    'hunde': 'hund', 'katzen': 'katze', 'pferde': 'pferd', 'kühe': 'kuh',
    'schweine': 'schwein', 'hühner': 'huhn', 'vögel': 'vogel', 'fische': 'fisch',
    'bären': 'bär', 'wölfe': 'wolf', 'löwen': 'löwe', 'tiger': 'tiger',
    'freunde': 'freund', 'familien': 'familie', 'kinder': 'kind', 'eltern': 'eltern',
    'brüder': 'bruder', 'schwestern': 'schwester', 'söhne': 'sohn', 'töchter': 'tochter',
    'chefs': 'chef', 'unternehmen': 'unternehmen', 'wohnungen': 'wohnung',
    'büros': 'büro', 'minuten': 'minute', 'stunden': 'stunde', 'tage': 'tag',
    'nächte': 'nacht', 'jahre': 'jahr', 'monate': 'monat', 'wochen': 'woche',
    'vorteile': 'vorteil', 'nachteile': 'nachteil', 'berufe': 'beruf',
    'ressourcen': 'ressource', 'stressphasen': 'stressphase', 'gefahren': 'gefahr',
    'fragen': 'frage', 'antworten': 'antwort', 'probleme': 'problem',
    'lösungen': 'lösung', 'ideen': 'idee', 'gedanken': 'gedanke',
    
    // Английские формы
    'people': 'person', 'men': 'man', 'women': 'woman', 'children': 'child',
    'houses': 'house', 'cars': 'car', 'books': 'book', 'dogs': 'dog',
    'cats': 'cat', 'horses': 'horse', 'cows': 'cow', 'pigs': 'pig',
    'chickens': 'chicken', 'birds': 'bird', 'fish': 'fish', 'bears': 'bear',
    'wolves': 'wolf', 'lions': 'lion', 'tigers': 'tiger', 'friends': 'friend',
    'families': 'family', 'kids': 'kid', 'parents': 'parent', 'brothers': 'brother',
    'sisters': 'sister', 'sons': 'son', 'daughters': 'daughter', 'bosses': 'boss',
    'companies': 'company', 'apartments': 'apartment', 'offices': 'office',
    'minutes': 'minute', 'hours': 'hour', 'days': 'day', 'nights': 'night',
    'years': 'year', 'months': 'month', 'weeks': 'week', 'advantages': 'advantage',
    'disadvantages': 'disadvantage', 'jobs': 'job', 'professions': 'profession',
    'resources': 'resource', 'dangers': 'danger', 'questions': 'question',
    'answers': 'answer', 'problems': 'problem', 'solutions': 'solution',
    'ideas': 'idea', 'thoughts': 'thought'
};

// ================== НОВЫЕ ФУНКЦИИ С NATURAL И WORDNET ==================

// Функция для получения синонимов из WordNet
function getWordNetSynonyms(word) {
    try {
        // WordNet интеграция для получения синонимов
        // В данной реализации используем простой подход
        // Можно расширить для более сложной логики
        const synonyms = [];
        
        // Используем Natural для stemming
        const stem = natural.PorterStemmer.stem(word);
        if (stem !== word) {
            synonyms.push(stem);
        }
        
        // Добавляем базовые синонимы для часто используемых слов
        const basicSynonyms = {
            'sleep': ['rest', 'nap', 'slumber', 'doze'],
            'work': ['job', 'labor', 'employment', 'task'],
            'food': ['meal', 'dish', 'cuisine', 'nutrition'],
            'time': ['moment', 'period', 'duration', 'hour'],
            'house': ['home', 'building', 'residence'],
            'car': ['vehicle', 'automobile', 'transport'],
            'book': ['publication', 'text', 'literature'],
            'water': ['liquid', 'fluid', 'H2O'],
            'money': ['cash', 'currency', 'funds'],
            'day': ['date', 'time', 'period'],
            'night': ['evening', 'darkness', 'bedtime'],
            'happy': ['joy', 'glad', 'cheerful', 'pleased'],
            'sad': ['unhappy', 'melancholy', 'depressed'],
            'big': ['large', 'huge', 'enormous', 'massive'],
            'small': ['tiny', 'little', 'mini', 'compact']
        };
        
        if (basicSynonyms[word]) {
            synonyms.push(...basicSynonyms[word]);
        }
        
        return synonyms;
    } catch (error) {
        console.error('Error getting WordNet synonyms:', error);
        return [];
    }
}

// Функция для получения множественных переводов немецкого слова
function getMultipleTranslations(germanWord) {
    const translations = [];
    const normalizedWord = normalizeWord(germanWord);
    
    // Основной перевод из словаря
    const primaryTranslation = germanEnglishDict[normalizedWord] || germanEnglishDict[germanWord];
    if (primaryTranslation) {
        translations.push(primaryTranslation);
        
        // Добавляем синонимы основного перевода
        const synonyms = getWordNetSynonyms(primaryTranslation);
        translations.push(...synonyms);
    }
    
    // Дополнительные переводы для многозначных слов
    const multiMeanings = {
        'schlaf': ['sleep', 'nap', 'rest', 'slumber'],
        'zeit': ['time', 'period', 'moment', 'hour'],
        'haus': ['house', 'home', 'building', 'residence'],
        'auto': ['car', 'vehicle', 'automobile'],
        'buch': ['book', 'publication', 'text'],
        'wasser': ['water', 'liquid', 'fluid'],
        'geld': ['money', 'cash', 'currency'],
        'tag': ['day', 'date', 'daytime'],
        'nacht': ['night', 'evening', 'darkness'],
        'glück': ['happiness', 'joy', 'luck', 'fortune'],
        'arbeit': ['work', 'job', 'labor', 'employment'],
        'essen': ['food', 'meal', 'eat', 'dish'],
        'trinken': ['drink', 'beverage', 'liquid'],
        'kopf': ['head', 'mind', 'brain'],
        'herz': ['heart', 'love', 'emotion'],
        'hand': ['hand', 'palm', 'finger'],
        'fuß': ['foot', 'leg', 'step'],
        'auge': ['eye', 'sight', 'vision'],
        'ohr': ['ear', 'hearing', 'sound'],
        'mund': ['mouth', 'lips', 'speak'],
        'nase': ['nose', 'smell', 'scent']
    };
    
    if (multiMeanings[normalizedWord] || multiMeanings[germanWord]) {
        const additionalMeanings = multiMeanings[normalizedWord] || multiMeanings[germanWord];
        additionalMeanings.forEach(meaning => {
            if (!translations.includes(meaning)) {
                translations.push(meaning);
            }
        });
    }
    
    // Удаляем дубликаты и возвращаем уникальные переводы
    return [...new Set(translations)];
}

// Улучшенная функция для определения языка с использованием Natural
function detectLanguageAdvanced(text) {
    try {
        // Используем Natural для более точного определения языка
        const germanWords = ['ich', 'bin', 'der', 'die', 'das', 'und', 'oder', 'aber', 'mit', 'von', 'zu', 'in', 'auf', 'für', 'ist', 'sind', 'haben', 'hatte', 'wird', 'werden', 'kann', 'könnte', 'soll', 'sollte', 'würde', 'wäre'];
        const englishWords = ['i', 'am', 'the', 'and', 'or', 'but', 'with', 'from', 'to', 'in', 'on', 'for', 'is', 'are', 'have', 'had', 'will', 'would', 'can', 'could', 'should', 'shall'];
        
        const words = text.toLowerCase().split(/\s+/);
        let germanCount = 0;
        let englishCount = 0;
        
        for (const word of words) {
            if (germanWords.includes(word)) germanCount++;
            if (englishWords.includes(word)) englishCount++;
        }
        
        // Проверяем специфические немецкие символы
        const hasGermanChars = /[äöüß]/.test(text.toLowerCase());
        if (hasGermanChars) germanCount += 2;
        
        return germanCount > englishCount ? 'de' : 'en';
    } catch (error) {
        console.error('Error in advanced language detection:', error);
        return detectLanguage(text); // Fallback к старой функции
    }
}

// ================== КОНЕЦ НОВЫХ ФУНКЦИЙ ==================

// Функция для нормализации слова (приведение к единственному числу)
function normalizeWord(word) {
    const cleanWord = word.toLowerCase().trim();
    
    // Если слово уже в единственном числе в словаре
    if (germanEnglishDict[cleanWord] || ontologyGraph[cleanWord]) {
        return cleanWord;
    }
    
    // Пытаемся найти форму в словаре форм
    return wordForms[cleanWord] || cleanWord;
}

// Функция для перевода немецкого слова на английский
function translateGermanWord(germanWord) {
    const cleanWord = germanWord.toLowerCase().trim();
    
    // Сначала нормализуем слово (приводим к единственному числу)
    const normalizedWord = normalizeWord(cleanWord);
    
    // Ищем перевод нормализованного слова
    return germanEnglishDict[normalizedWord] || null;
}

// Функция для поиска в онтологическом графе
function findInOntology(word, maxResults = 10) {
    const cleanWord = word.toLowerCase().trim();
    const results = [];
    
    // Если слово есть в графе напрямую
    if (ontologyGraph[cleanWord]) {
        const node = ontologyGraph[cleanWord];
        
        // Добавляем все связанные слова
        if (node.is) {
            results.push(...node.is.slice(0, maxResults));
        }
        if (node.part_of) {
            results.push(...node.part_of.slice(0, maxResults));
        }
        if (node.related_to) {
            results.push(...node.related_to.slice(0, maxResults));
        }
    }
    
    // Ищем слово в других узлах графа
    for (const [key, node] of Object.entries(ontologyGraph)) {
        if (results.length >= maxResults) break;
        
        // Проверяем все типы связей
        const allRelations = [
            ...(node.is || []),
            ...(node.part_of || []),
            ...(node.related_to || [])
        ];
        
        if (allRelations.includes(cleanWord)) {
            // Добавляем ключевое слово и его связи
            if (!results.includes(key)) {
                results.push(key);
            }
            
            // Добавляем связанные слова
            if (node.is) {
                results.push(...node.is.filter(r => !results.includes(r)).slice(0, maxResults - results.length));
            }
            if (node.part_of) {
                results.push(...node.part_of.filter(r => !results.includes(r)).slice(0, maxResults - results.length));
            }
            if (node.related_to) {
                results.push(...node.related_to.filter(r => !results.includes(r)).slice(0, maxResults - results.length));
            }
        }
    }
    
    return results.slice(0, maxResults);
}

// Функция для поиска эмодзи по слову
async function findEmojisForWord(word, maxEmojis = 3) {
    try {
        const emojis = await searchEmojis(word);
        return emojis.slice(0, maxEmojis);
    } catch (error) {
        console.error(`Error searching emojis for "${word}":`, error);
        return [];
    }
}

// Новый алгоритм: итеративный поиск по всем словам с онтологией
async function findEmojisWithIterativeOntology(text, maxEmojis = 10) {
    console.log(`Finding emojis with iterative ontology for text: "${text}"`);
    
    // Извлекаем ВСЕ слова из текста, фильтруем короткие слова, фрагменты и абстрактные слова
    // Исправлено: используем правильный regex для немецких символов
    const words = text.toLowerCase()
        .replace(/[^a-zA-ZäöüßÄÖÜ\s]/g, ' ') // Поддерживаем немецкие символы
        .split(/\s+/)
        .filter(word => word.length >= 3) // Минимум 3 символа
        .filter(word => !/^[a-zäöüß]{1,2}$/.test(word)) // Исключаем короткие фрагменты, включая немецкие
        .filter(word => !abstractWords.has(word)) // Исключаем абстрактные слова
        .filter(word => word.trim() !== ''); // Убираем пустые строки
    
    console.log(`Processing all ${words.length} words:`, words);
    
    const foundEmojis = new Set();
    const emojiMap = new Map();
    
    // Итеративный поиск по всем словам
    for (const word of words) {
        if (foundEmojis.size >= maxEmojis) {
            console.log(`Reached max emojis (${maxEmojis}), stopping search`);
            break;
        }
        
        console.log(`Processing word: "${word}"`);
        
        // 1. Сначала проверяем, не является ли слово абстрактным
        if (abstractWords.has(word)) {
            console.log(`Skipping abstract word: "${word}"`);
            continue;
        }
        
        // 2. Получаем множественные переводы слова на английский
        const translations = getMultipleTranslations(word);
        if (translations.length === 0) {
            console.log(`No translation found for "${word}", skipping word`);
            continue; // Пропускаем слово, если не можем его перевести
        }
        console.log(`Multiple translations for "${word}": [${translations.join(', ')}]`);
        
        // 3. Ищем эмодзи для каждого перевода
        let wordEmojisFound = false;
        for (const translation of translations) {
            // Проверяем, что переведенное слово не является абстрактным
            if (abstractWords.has(translation)) {
                console.log(`Skipping abstract translated word: "${translation}"`);
                continue;
            }
            
            // 4. Прямой поиск эмодзи для переведенного слова
            const directEmojis = await findEmojisForWord(translation, 3);
            console.log(`Direct emojis for "${translation}":`, directEmojis.length);
            
            for (const emoji of directEmojis) {
                if (foundEmojis.size >= maxEmojis) break;
                const emojiKey = emoji.native;
                if (!foundEmojis.has(emojiKey)) {
                    foundEmojis.add(emojiKey);
                    emojiMap.set(emojiKey, {
                        ...emoji,
                        originalWord: word,
                        translation: translation,
                        source: 'direct'
                    });
                    wordEmojisFound = true;
                }
            }
            
            // 5. Если эмодзи недостаточно, ищем через онтологический граф
            if (foundEmojis.size < maxEmojis) {
                console.log(`Searching ontology graph for "${translation}"`);
                const ontologyWords = findInOntology(translation, 8);
                console.log(`Found ontology words:`, ontologyWords);
                
                for (const ontologyWord of ontologyWords) {
                    if (foundEmojis.size >= maxEmojis) break;
                    
                    const ontologyEmojis = await findEmojisForWord(ontologyWord, 2);
                    console.log(`Emojis for ontology word "${ontologyWord}":`, ontologyEmojis.length);
                    
                    for (const emoji of ontologyEmojis) {
                        if (foundEmojis.size >= maxEmojis) break;
                        const emojiKey = emoji.native;
                        if (!foundEmojis.has(emojiKey)) {
                            foundEmojis.add(emojiKey);
                            emojiMap.set(emojiKey, {
                                ...emoji,
                                originalWord: word,
                                translation: translation,
                                ontologyWord: ontologyWord,
                                source: 'ontology'
                            });
                            wordEmojisFound = true;
                        }
                    }
                }
            }
            
            // Если нашли достаточно эмодзи для этого слова, прерываем перебор переводов
            if (foundEmojis.size >= maxEmojis) break;
        }
        
        // Если нашли эмодзи для текущего слова, можем перейти к следующему слову
        if (wordEmojisFound && foundEmojis.size >= Math.min(5, maxEmojis)) {
            console.log(`Found sufficient emojis for word "${word}", moving to next word`);
        }
    }
    
    const result = Array.from(foundEmojis).map(emojiKey => emojiMap.get(emojiKey));
    console.log(`Found ${result.length} unique emojis with iterative ontology`);
    return result;
}

// Абстрактные слова, которые нужно исключить из поиска эмодзи
const abstractWords = new Set([
    // Немецкие абстрактные слова
    'der', 'die', 'das', 'und', 'ist', 'in', 'mit', 'auf', 'für', 'von', 'zu', 'an', 'als', 'nach', 'über', 'durch', 'bei', 'aus', 'um', 'am', 'im', 'zum', 'zur', 'beim', 'vom', 'zur', 'ich', 'bin', 'gehe', 'ins', 'kino', 'mit', 'meinen', 'freunden',
    'mir', 'mich', 'dir', 'dich', 'ihm', 'ihn', 'ihr', 'uns', 'euch', 'ihnen', 'sich',
    'mein', 'meine', 'mein', 'dein', 'deine', 'dein', 'sein', 'seine', 'sein', 'ihr', 'ihre', 'ihr', 'unser', 'unsere', 'unser', 'euer', 'eure', 'euer', 'ihr', 'ihre', 'ihr',
    'dies', 'diese', 'dieses', 'jener', 'jene', 'jenes', 'welcher', 'welche', 'welches',
    'ein', 'eine', 'einen', 'einer', 'einem', 'eines', 'kein', 'keine', 'keinen', 'keiner', 'keinem', 'keines',
    'alle', 'aller', 'alles', 'jeder', 'jede', 'jedes', 'manche', 'manche', 'manches',
    'viel', 'viele', 'vieles', 'wenig', 'wenige', 'weniges', 'mehr', 'mehrere', 'mehreres',
    'weniger', 'wenigere', 'wenigeres', 'meiste', 'meist', 'meistes', 'wenigste', 'wenigst', 'wenigstes',
    'hier', 'dort', 'da', 'dann', 'wenn', 'als', 'weil', 'dass', 'obwohl', 'damit', 'sodass',
    'aber', 'oder', 'sondern', 'denn', 'jedoch', 'trotzdem', 'deshalb', 'darum', 'deswegen',
    'nicht', 'kein', 'nie', 'niemals', 'immer', 'oft', 'manchmal', 'selten', 'meistens',
    'sehr', 'zu', 'zu', 'sehr', 'ganz', 'total', 'komplett', 'vollständig', 'teilweise',
    'schon', 'noch', 'erst', 'nur', 'auch', 'sogar', 'besonders', 'hauptsächlich',
    'etwas', 'nichts', 'alles', 'jemand', 'niemand', 'irgendetwas', 'irgendjemand',
    'wo', 'wann', 'wie', 'warum', 'weshalb', 'wohin', 'woher', 'womit', 'wodurch',
    'wer', 'was', 'welcher', 'welche', 'welches', 'wessen', 'wem', 'wen',
    'kann', 'können', 'muss', 'müssen', 'soll', 'sollen', 'will', 'wollen', 'darf', 'dürfen',
    'mag', 'mögen', 'möchte', 'möchten', 'sollte', 'sollten', 'würde', 'würden',
    'hat', 'haben', 'hatte', 'hatten', 'habe', 'hast', 'habt', 'haben', 'hat',
    'ist', 'sind', 'war', 'waren', 'bin', 'bist', 'seid', 'sind', 'ist',
    'wird', 'werden', 'wurde', 'wurden', 'werde', 'wirst', 'werdet', 'werden', 'wird',
    'wurde', 'wurden', 'wurde', 'wurden', 'wurde', 'wurden', 'wurde', 'wurden',
    'habe', 'hast', 'hat', 'haben', 'habt', 'haben', 'hat', 'haben',
    'bin', 'bist', 'ist', 'sind', 'seid', 'sind', 'ist', 'sind',
    'werde', 'wirst', 'wird', 'werden', 'werdet', 'werden', 'wird', 'werden',
    
    // Английские абстрактные слова
    'the', 'and', 'is', 'in', 'with', 'on', 'for', 'from', 'to', 'at', 'as', 'after', 'over', 'through', 'by', 'out', 'around',
    'i', 'me', 'my', 'mine', 'you', 'your', 'yours', 'he', 'him', 'his', 'she', 'her', 'hers', 'it', 'its', 'we', 'us', 'our', 'ours', 'they', 'them', 'their', 'theirs',
    'this', 'that', 'these', 'those', 'which', 'who', 'whom', 'whose', 'what', 'where', 'when', 'why', 'how',
    'a', 'an', 'some', 'any', 'no', 'every', 'each', 'all', 'both', 'either', 'neither', 'one', 'ones', 'other', 'others', 'another',
    'much', 'many', 'more', 'most', 'little', 'less', 'least', 'few', 'fewer', 'fewest', 'several', 'enough', 'too', 'very', 'quite', 'rather', 'pretty',
    'here', 'there', 'where', 'everywhere', 'somewhere', 'nowhere', 'anywhere', 'then', 'now', 'when', 'before', 'after', 'during', 'while', 'since', 'until',
    'can', 'could', 'may', 'might', 'must', 'shall', 'should', 'will', 'would', 'do', 'does', 'did', 'have', 'has', 'had', 'be', 'am', 'is', 'are', 'was', 'were',
    'not', 'no', 'never', 'always', 'often', 'sometimes', 'usually', 'rarely', 'seldom', 'hardly', 'barely', 'scarcely', 'almost', 'nearly', 'quite', 'rather',
    'so', 'such', 'too', 'very', 'really', 'truly', 'actually', 'indeed', 'certainly', 'surely', 'definitely', 'absolutely', 'completely', 'totally', 'entirely',
    'something', 'anything', 'nothing', 'everything', 'someone', 'anyone', 'no one', 'everyone', 'somebody', 'anybody', 'nobody', 'everybody',
    'somewhere', 'anywhere', 'nowhere', 'everywhere', 'sometime', 'anytime', 'never', 'always', 'somehow', 'anyhow', 'no way', 'anyway'
]);

// Функция для определения языка текста
function detectLanguage(text) {
    const germanWords = ['der', 'die', 'das', 'und', 'ist', 'in', 'mit', 'auf', 'für', 'von', 'zu', 'an', 'als', 'nach', 'über', 'durch', 'bei', 'aus', 'um', 'am', 'im', 'zum', 'zur', 'beim', 'vom', 'zur', 'ich', 'bin', 'gehe', 'ins', 'kino', 'mit', 'meinen', 'freunden'];
    const englishWords = ['the', 'and', 'is', 'in', 'with', 'on', 'for', 'from', 'to', 'at', 'as', 'after', 'over', 'through', 'by', 'out', 'around', 'hello', 'world', 'good', 'bad', 'yes', 'no', 'can', 'will', 'have', 'has', 'was', 'were', 'are', 'am'];
    
    const words = text.toLowerCase().split(/\s+/);
    const germanCount = words.filter(word => germanWords.includes(word)).length;
    const englishCount = words.filter(word => englishWords.includes(word)).length;
    
    // Если есть явные английские слова, считаем английским
    if (englishCount > 0) return 'en';
    if (germanCount > 0) return 'de';
    
    // Если нет явных индикаторов, проверяем по словарю
    const hasGermanTranslation = words.some(word => germanEnglishDict[word.toLowerCase()]);
    if (hasGermanTranslation) return 'de';
    
    return 'en'; // По умолчанию считаем английским
}

// Универсальная функция для поиска эмодзи по тексту (новый итеративный алгоритм)
async function findEmojisForText(text, maxEmojis = 10) {
    const language = detectLanguageAdvanced(text);
    console.log(`Detected language: ${language}`);
    
    // Используем новый итеративный алгоритм для всех языков
    return await findEmojisWithIterativeOntology(text, maxEmojis);
}

module.exports = {
    findEmojisForText,
    findEmojisWithIterativeOntology,
    translateGermanWord,
    findInOntology,
    detectLanguage
};
