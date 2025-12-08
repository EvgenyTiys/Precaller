// Базовый немецко-английский словарь (извлечен из offlineTranslationService)

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
    'laufen': 'run', 'fahren': 'drive', 'fliegen': 'fly',
    
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
    
    // Ванная / гигиена
    'bad': 'bath', 'badewanne': 'bathtub', 'badezimmer': 'bathroom',
    
    // Животные
    'hund': 'dog', 'katze': 'cat', 'pferd': 'horse', 'kuh': 'cow',
    'schwein': 'pig', 'huhn': 'chicken', 'vogel': 'bird',
    'bär': 'bear', 'wolf': 'wolf', 'löwe': 'lion', 'tiger': 'tiger',
    
    // Семья
    'mutter': 'mother', 'vater': 'father', 'sohn': 'son', 'tochter': 'daughter',
    'bruder': 'brother', 'schwester': 'sister', 'großmutter': 'grandmother',
    'großvater': 'grandfather', 'onkel': 'uncle', 'tante': 'aunt',
    'freund': 'friend',
    
    // Транспорт
    'auto': 'car', 'bus': 'bus', 'zug': 'train', 'flugzeug': 'airplane',
    'fahrrad': 'bicycle', 'motorrad': 'motorcycle', 'boot': 'boat', 'schiff': 'ship',
    
    // Погода
    'sonne': 'sun', 'regen': 'rain', 'schnee': 'snow', 'wind': 'wind',
    'wolke': 'cloud', 'sturm': 'storm', 'gewitter': 'thunderstorm',
    'warm': 'warm', 'kalt': 'cold', 'heiß': 'hot', 'kühl': 'cool',
    
    // Дополнительные слова
    'guten': 'good', 'thema': 'topic', 'themen': 'topics', 'präsentation': 'presentation',
    'erfahrungen': 'experiences', 'erfahrung': 'experience', 'situation': 'situation',
    'heimatland': 'homeland', 'erwachsene': 'adults', 'erwachsener': 'adult',
    'selten': 'rarely', 'seltenen': 'rare', 'chef': 'boss', 'chefs': 'bosses',
    'großer': 'big', 'große': 'big', 'großes': 'big', 'unternehmen': 'company',
    'tun': 'do', 'dies': 'this', 'weil': 'because', 'sie': 'they', 'viel': 'much',
    'einer': 'one', 'von': 'from', 'ihnen': 'them',
    'wohnung': 'apartment', 'nähe': 'near',
    'seines': 'his', 'gemietet': 'rented', 'können': 'can',
    'vor': 'before', 'nachteile': 'disadvantages', 'nachteil': 'disadvantage',
    'vorteile': 'advantages', 'vorteil': 'advantage', 'erfrischt': 'refreshes',
    'erfrischen': 'refresh', 'kopf': 'head', 'hilft': 'helps', 'helfen': 'help',
    'dinge': 'things', 'ding': 'thing', 'besser': 'better', 'merken': 'remember',
    'wichtig': 'important', 'berufen': 'professions', 'beruf': 'profession',
    'denen': 'which', 'man': 'one', 'denkarbeit': 'mental work', 'macht': 'makes',
    'hier': 'here', 'noch': 'still', 'für': 'for', 'richtige': 'right',
    'richtigen': 'right', 'ort': 'place', 'finden': 'find', 'immer': 'always',
    'einfach': 'simple', 'außerdem': 'besides', 'passieren': 'happen', 'dass': 'that',
    'wecker': 'alarm', 'nicht': 'not', 'hört': 'hears',
    'wenn': 'when', 'tief': 'deep', 'schläft': 'sleeps', 'deshalb': 'therefore',
    'besteht': 'exists', 'gefahr': 'danger', 'spät': 'late',
    'kommt': 'comes', 'meinung': 'opinion', 'fünfzehn': 'fifteen',
    'bis': 'until', 'dreißig': 'thirty', 'ideal': 'ideal', 'eindruck': 'impression',
    'wie': 'like', 'länger': 'longer', 'lange': 'long', 'desto': 'the more',
    'mehr': 'more', 'verbraucht': 'consumes', 'verbrauchen': 'consume',
    'weniger': 'less', 'vorhanden': 'available', 'schwieriger': 'more difficult',
    'schwierig': 'difficult', 'es': 'it', 'wiederherstellen': 'restore',
    'verkürzt': 'shortens', 'verkürzen': 'shorten', 'schützt': 'protects',
    'schützen': 'protect', 'bevor': 'before', 'dem': 'the',
    'sollte': 'should', 'vom': 'from', 'alles': 'everything',
    'fragen': 'questions', 'frage': 'question',
    'englisch': 'english',
    'kind': 'child', 'kinder': 'children'
};

// Словарь форм слов (множественное число -> единственное число)
const wordForms = {
    // Немецкие формы
    'menschen': 'mensch', 'häuser': 'haus', 'autos': 'auto', 'bücher': 'buch',
    'hunde': 'hund', 'katzen': 'katze', 'pferde': 'pferd', 'kühe': 'kuh',
    'schweine': 'schwein', 'hühner': 'huhn', 'vögel': 'vogel', 'fische': 'fisch',
    'bären': 'bär', 'wölfe': 'wolf', 'löwen': 'löwe',
    'freunde': 'freund', 'familien': 'familie', 'eltern': 'eltern',
    'brüder': 'bruder', 'schwestern': 'schwester', 'söhne': 'sohn', 'töchter': 'tochter',
    'unternehmen': 'unternehmen', 'wohnungen': 'wohnung',
    'büros': 'büro', 'minuten': 'minute', 'stunden': 'stunde', 'tage': 'tag',
    'nächte': 'nacht', 'jahre': 'jahr', 'monate': 'monat', 'wochen': 'woche',
    'vorteile': 'vorteil', 'nachteile': 'nachteil', 'berufe': 'beruf',
    'ressourcen': 'ressource', 'stressphasen': 'stressphase', 'gefahren': 'gefahr',
    'fragen': 'frage', 'antworten': 'antwort', 'probleme': 'problem',
    'lösungen': 'lösung', 'ideen': 'idee', 'gedanken': 'gedanke',
    'gelernt': 'lernen'
};

module.exports = {
    germanEnglishDict,
    wordForms
};




