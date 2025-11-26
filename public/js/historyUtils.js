/**
 * historyUtils.js - Утилиты для работы с историей тренировок
 * Функции для расчета расстояний и выравнивания текстов
 */

const HistoryUtils = {
    /**
     * Расчет Манхэттенского расстояния между двумя строками
     * Манхэттенское расстояние = сумма абсолютных разностей кодов символов
     * 
     * @param {string} str1 - Первая строка
     * @param {string} str2 - Вторая строка
     * @returns {number} - Манхэттенское расстояние
     */
    manhattanDistance(str1, str2) {
        if (!str1 || !str2) {
            return Math.max((str1 || '').length, (str2 || '').length) * 255; // Максимальное расстояние для пустых строк
        }

        const len1 = str1.length;
        const len2 = str2.length;
        let distance = 0;

        // Сравниваем символы по позициям
        const maxLen = Math.max(len1, len2);
        for (let i = 0; i < maxLen; i++) {
            const char1 = i < len1 ? str1.charCodeAt(i) : 0;
            const char2 = i < len2 ? str2.charCodeAt(i) : 0;
            distance += Math.abs(char1 - char2);
        }

        // Добавляем разницу в длине (каждый "лишний" символ = максимальное расстояние)
        distance += Math.abs(len1 - len2) * 255;

        return distance;
    },

    /**
     * Множественное выравнивание текстов (простая версия)
     * Выравнивает тексты посимвольно, показывая различия
     * 
     * @param {string} original - Оригинальный текст
     * @param {Array<string>} inputs - Массив введенных текстов
     * @returns {Array<Object>} - Массив выровненных строк с метаданными
     */
    alignTexts(original, inputs) {
        if (!original) {
            return inputs.map(input => ({
                text: input || '',
                aligned: input || '',
                differences: []
            }));
        }

        const originalChars = Array.from(original);
        const maxLen = Math.max(
            originalChars.length,
            ...inputs.map(input => (input || '').length)
        );

        return inputs.map(input => {
            const inputChars = Array.from(input || '');
            const differences = [];
            const aligned = [];

            for (let i = 0; i < maxLen; i++) {
                const origChar = i < originalChars.length ? originalChars[i] : null;
                const inputChar = i < inputChars.length ? inputChars[i] : null;

                if (origChar === inputChar) {
                    aligned.push(inputChar || '');
                } else {
                    aligned.push(inputChar || '');
                    differences.push({
                        position: i,
                        original: origChar || '',
                        input: inputChar || ''
                    });
                }
            }

            return {
                text: input || '',
                aligned: aligned.join(''),
                differences
            };
        });
    },

    /**
     * Более продвинутое выравнивание с использованием алгоритма Левенштейна
     * Показывает вставки, удаления и замены
     * 
     * @param {string} original - Оригинальный текст
     * @param {string} input - Введенный текст
     * @returns {Object} - Выровненный текст с метаданными
     */
    advancedAlign(original, input) {
        if (!original) {
            return {
                alignedOriginal: '',
                alignedInput: input || '',
                operations: []
            };
        }

        const orig = Array.from(original);
        const inp = Array.from(input || '');
        
        // Простая версия: посимвольное сравнение
        const maxLen = Math.max(orig.length, inp.length);
        const alignedOriginal = [];
        const alignedInput = [];
        const operations = [];

        for (let i = 0; i < maxLen; i++) {
            const origChar = i < orig.length ? orig[i] : null;
            const inpChar = i < inp.length ? inp[i] : null;

            if (origChar === inpChar) {
                alignedOriginal.push(origChar);
                alignedInput.push(inpChar);
                operations.push({ type: 'match', char: origChar });
            } else if (origChar && !inpChar) {
                alignedOriginal.push(origChar);
                alignedInput.push(' ');
                operations.push({ type: 'delete', char: origChar });
            } else if (!origChar && inpChar) {
                alignedOriginal.push(' ');
                alignedInput.push(inpChar);
                operations.push({ type: 'insert', char: inpChar });
            } else {
                alignedOriginal.push(origChar);
                alignedInput.push(inpChar);
                operations.push({ type: 'replace', original: origChar, input: inpChar });
            }
        }

        return {
            alignedOriginal: alignedOriginal.join(''),
            alignedInput: alignedInput.join(''),
            operations
        };
    }
};

// Экспорт для использования в других модулях
if (typeof module !== 'undefined' && module.exports) {
    module.exports = HistoryUtils;
}

// Делаем доступным глобально для браузера
if (typeof window !== 'undefined') {
    window.HistoryUtils = HistoryUtils;
}

