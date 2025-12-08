// Сервис для работы с онтологией через WordNet
const WordPOS = require('wordpos');
const wordpos = new WordPOS();

/**
 * Получить синонимы слова из WordNet
 * @param {string} word - Слово для поиска синонимов
 * @param {number} maxResults - Максимальное количество синонимов
 * @returns {Promise<Array<string>>} Массив синонимов
 */
async function getSynonyms(word, maxResults = 5) {
    try {
        const cleanWord = word.toLowerCase().trim();
        const synonyms = new Set();
        
        // Проверяем все части речи
        const results = await wordpos.lookup(cleanWord);
        
        for (const result of results) {
            if (result.synonyms && Array.isArray(result.synonyms)) {
                result.synonyms.forEach(syn => {
                    // Убираем подчеркивания и берём первое слово
                    const cleanSyn = syn.replace(/_/g, ' ').split(' ')[0];
                    if (cleanSyn !== cleanWord && cleanSyn.length > 2) {
                        synonyms.add(cleanSyn);
                    }
                });
            }
        }
        
        return Array.from(synonyms).slice(0, maxResults);
    } catch (error) {
        console.error(`[ONTOLOGY] Error getting synonyms for "${word}":`, error.message);
        return [];
    }
}

/**
 * Получить гипонимы (более конкретные термины)
 * @param {string} word - Слово
 * @param {number} maxResults - Максимальное количество
 * @returns {Promise<Array<string>>} Массив гипонимов
 */
async function getHyponyms(word, maxResults = 3) {
    try {
        const cleanWord = word.toLowerCase().trim();
        const hyponyms = new Set();
        
        const results = await wordpos.lookup(cleanWord);
        
        for (const result of results) {
            if (result.hyponyms && Array.isArray(result.hyponyms)) {
                result.hyponyms.forEach(hyp => {
                    const cleanHyp = hyp.replace(/_/g, ' ').split(' ')[0];
                    if (cleanHyp !== cleanWord && cleanHyp.length > 2) {
                        hyponyms.add(cleanHyp);
                    }
                });
            }
        }
        
        return Array.from(hyponyms).slice(0, maxResults);
    } catch (error) {
        console.error(`[ONTOLOGY] Error getting hyponyms for "${word}":`, error.message);
        return [];
    }
}

/**
 * Получить гиперонимы (более общие термины)
 * @param {string} word - Слово
 * @param {number} maxResults - Максимальное количество
 * @returns {Promise<Array<string>>} Массив гиперонимов
 */
async function getHypernyms(word, maxResults = 3) {
    try {
        const cleanWord = word.toLowerCase().trim();
        const hypernyms = new Set();
        
        const results = await wordpos.lookup(cleanWord);
        
        for (const result of results) {
            if (result.hypernyms && Array.isArray(result.hypernyms)) {
                result.hypernyms.forEach(hyp => {
                    const cleanHyp = hyp.replace(/_/g, ' ').split(' ')[0];
                    if (cleanHyp !== cleanWord && cleanHyp.length > 2) {
                        hypernyms.add(cleanHyp);
                    }
                });
            }
        }
        
        return Array.from(hypernyms).slice(0, maxResults);
    } catch (error) {
        console.error(`[ONTOLOGY] Error getting hypernyms for "${word}":`, error.message);
        return [];
    }
}

/**
 * Получить связанные слова (синонимы + гипонимы + гиперонимы)
 * @param {string} word - Слово
 * @param {number} maxResults - Максимальное количество
 * @returns {Promise<Array<string>>} Массив связанных слов
 */
async function getRelatedWords(word, maxResults = 10) {
    try {
        const [synonyms, hyponyms, hypernyms] = await Promise.all([
            getSynonyms(word, 5),
            getHyponyms(word, 3),
            getHypernyms(word, 2)
        ]);
        
        const related = new Set([...synonyms, ...hyponyms, ...hypernyms]);
        return Array.from(related).slice(0, maxResults);
    } catch (error) {
        console.error(`[ONTOLOGY] Error getting related words for "${word}":`, error.message);
        return [];
    }
}

/**
 * Проверить, является ли слово существительным
 */
async function isNoun(word) {
    try {
        const results = await wordpos.isNoun(word);
        return results;
    } catch (error) {
        return false;
    }
}

/**
 * Проверить, является ли слово глаголом
 */
async function isVerb(word) {
    try {
        const results = await wordpos.isVerb(word);
        return results;
    } catch (error) {
        return false;
    }
}

/**
 * Проверить, является ли слово прилагательным
 */
async function isAdjective(word) {
    try {
        const results = await wordpos.isAdjective(word);
        return results;
    } catch (error) {
        return false;
    }
}

module.exports = {
    getSynonyms,
    getHyponyms,
    getHypernyms,
    getRelatedWords,
    isNoun,
    isVerb,
    isAdjective,
    wordpos // Экспортируем для прямого использования
};




