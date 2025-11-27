/**
 * historyUtils.js - Утилиты для работы с историей тренировок
 * Функции для расчета расстояний и выравнивания текстов
 */

const HistoryUtils = {
    /**
     * Расчет Манхэттенского расстояния между двумя строками
     * Расстояние = количество различающихся символов на соответствующих позициях после оптимального выравнивания
     * 
     * @param {string} str1 - Первая строка
     * @param {string} str2 - Вторая строка
     * @returns {number} - Манхэттенское расстояние (количество различий)
     */
    manhattanDistance(str1, str2) {
        if (!str1 && !str2) {
            return 0;
        }
        if (!str1) {
            return str2.length;
        }
        if (!str2) {
            return str1.length;
        }

        // Используем алгоритм Левенштейна для оптимального выравнивания
        const m = str1.length;
        const n = str2.length;
        const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
        const path = Array(m + 1).fill(null).map(() => Array(n + 1).fill(null));

        // Инициализация
        for (let i = 0; i <= m; i++) {
            dp[i][0] = i;
            if (i > 0) {
                path[i][0] = { op: 'delete', i: i - 1, j: 0 };
            }
        }
        for (let j = 0; j <= n; j++) {
            dp[0][j] = j;
            if (j > 0) {
                path[0][j] = { op: 'insert', i: 0, j: j - 1 };
            }
        }

        // Заполнение матрицы
        for (let i = 1; i <= m; i++) {
            for (let j = 1; j <= n; j++) {
                const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
                const replace = dp[i - 1][j - 1] + cost;
                const del = dp[i - 1][j] + 1;
                const ins = dp[i][j - 1] + 1;

                if (replace <= del && replace <= ins) {
                    dp[i][j] = replace;
                    path[i][j] = { op: 'replace', i: i - 1, j: j - 1 };
                } else if (del <= ins) {
                    dp[i][j] = del;
                    path[i][j] = { op: 'delete', i: i - 1, j: j };
                } else {
                    dp[i][j] = ins;
                    path[i][j] = { op: 'insert', i: i, j: j - 1 };
                }
            }
        }

        // Восстановление пути и подсчет различий
        let distance = 0;
        let i = m, j = n;
        while (i > 0 || j > 0) {
            const p = path[i][j];
            
            if (!p) {
                // Обработка оставшихся символов
                if (i > 0) {
                    distance++;
                    i--;
                } else if (j > 0) {
                    distance++;
                    j--;
                } else {
                    break;
                }
                continue;
            }

            if (p.op === 'replace') {
                const char1 = i > 0 ? str1[i - 1] : '';
                const char2 = j > 0 ? str2[j - 1] : '';
                if (char1 !== char2) {
                    distance++;
                }
                i = p.i;
                j = p.j;
            } else if (p.op === 'delete') {
                distance++;
                i = p.i;
            } else if (p.op === 'insert') {
                distance++;
                j = p.j;
            } else {
                break;
            }
        }

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
    },

    /**
     * Выравнивание на уровне слов с возможностью добавления пробелов
     * Слова не разрываются, но между словами можно добавлять пробелы для выравнивания
     * Использует алгоритм Левенштейна на уровне слов, затем посимвольное сравнение внутри слов
     * 
     * @param {string} original - Оригинальный текст
     * @param {string} input - Введенный текст
     * @returns {Object} - Выровненный текст с метаданными
     */
    wordLevelAlign(original, input) {
        if (!original) {
            return {
                alignedOriginal: '',
                alignedInput: input || '',
                operations: []
            };
        }

        // Разбиваем на слова (сохраняем пробелы)
        const splitIntoWords = (text) => {
            if (!text || !text.trim()) return [];
            // Разбиваем по пробелам, но сохраняем информацию о пробелах
            const words = [];
            const parts = text.split(/(\s+)/);
            
            for (let i = 0; i < parts.length; i++) {
                if (parts[i].trim()) {
                    words.push({ type: 'word', content: parts[i] });
                } else if (parts[i]) {
                    // Пробелы между словами
                    words.push({ type: 'space', content: parts[i] });
                }
            }
            return words;
        };

        const origWords = splitIntoWords(original);
        const inpWords = splitIntoWords(input || '');

        // Функция для вычисления расстояния между словами
        const wordDistance = (word1, word2) => {
            if (!word1 || !word2) return 1000;
            const len1 = word1.length;
            const len2 = word2.length;
            let diff = 0;
            const maxLen = Math.max(len1, len2);
            for (let i = 0; i < maxLen; i++) {
                const c1 = i < len1 ? word1[i] : '';
                const c2 = i < len2 ? word2[i] : '';
                if (c1 !== c2) diff++;
            }
            return diff;
        };

        // Левенштейн на уровне слов
        const levenshteinWords = (words1, words2) => {
            const m = words1.length;
            const n = words2.length;
            
            // Создаем матрицу для динамического программирования
            const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
            const path = Array(m + 1).fill(null).map(() => Array(n + 1).fill(null));

            // Инициализация
            for (let i = 0; i <= m; i++) {
                dp[i][0] = i;
                if (i > 0) {
                    path[i][0] = { op: 'delete', i: i - 1, j: 0 };
                }
            }
            for (let j = 0; j <= n; j++) {
                dp[0][j] = j;
                if (j > 0) {
                    path[0][j] = { op: 'insert', i: 0, j: j - 1 };
                }
            }

            // Заполнение матрицы
            for (let i = 1; i <= m; i++) {
                for (let j = 1; j <= n; j++) {
                    const word1 = words1[i - 1];
                    const word2 = words2[j - 1];
                    
                    // Стоимость замены
                    let cost = 0;
                    if (word1.type === 'word' && word2.type === 'word') {
                        cost = wordDistance(word1.content, word2.content);
                    } else if (word1.type === 'space' && word2.type === 'space') {
                        cost = Math.abs(word1.content.length - word2.content.length);
                    } else if (word1.type !== word2.type) {
                        cost = 1000; // Большая стоимость для разных типов
                    } else {
                        cost = Math.abs(word1.content.length - word2.content.length);
                    }

                    const replace = dp[i - 1][j - 1] + cost;
                    const del = dp[i - 1][j] + 1;
                    const ins = dp[i][j - 1] + 1;

                    if (replace <= del && replace <= ins) {
                        dp[i][j] = replace;
                        path[i][j] = { op: 'replace', i: i - 1, j: j - 1 };
                    } else if (del <= ins) {
                        dp[i][j] = del;
                        path[i][j] = { op: 'delete', i: i - 1, j: j };
                    } else {
                        dp[i][j] = ins;
                        path[i][j] = { op: 'insert', i: i, j: j - 1 };
                    }
                }
            }

            // Восстановление пути
            const alignment = [];
            let i = m, j = n;
            while (i > 0 || j > 0) {
                const p = path[i][j];
                
                // Если нет пути, обрабатываем оставшиеся элементы
                if (!p) {
                    if (i > 0) {
                        alignment.unshift({
                            type: 'delete',
                            orig: words1[i - 1],
                            inp: null
                        });
                        i--;
                    } else if (j > 0) {
                        alignment.unshift({
                            type: 'insert',
                            orig: null,
                            inp: words2[j - 1]
                        });
                        j--;
                    } else {
                        break;
                    }
                    continue;
                }
                
                if (p.op === 'replace') {
                    alignment.unshift({
                        type: 'replace',
                        orig: i > 0 ? words1[i - 1] : null,
                        inp: j > 0 ? words2[j - 1] : null
                    });
                    i = p.i;
                    j = p.j;
                } else if (p.op === 'delete') {
                    alignment.unshift({
                        type: 'delete',
                        orig: i > 0 ? words1[i - 1] : null,
                        inp: null
                    });
                    i = p.i;
                } else if (p.op === 'insert') {
                    alignment.unshift({
                        type: 'insert',
                        orig: null,
                        inp: j > 0 ? words2[j - 1] : null
                    });
                    j = p.j;
                } else {
                    break;
                }
            }

            return alignment;
        };

        // Выравнивание слов
        const wordAlignment = levenshteinWords(origWords, inpWords);

        // Построение результата с выравниванием
        const alignedOriginal = [];
        const alignedInput = [];
        const operations = [];

        wordAlignment.forEach((align, alignIndex) => {
            const nextAlign = wordAlignment[alignIndex + 1];
            const isNextSpace = nextAlign && (
                (nextAlign.type === 'replace' && nextAlign.orig?.type === 'space' && nextAlign.inp?.type === 'space') ||
                (nextAlign.type === 'delete' && nextAlign.orig?.type === 'space') ||
                (nextAlign.type === 'insert' && nextAlign.inp?.type === 'space')
            );

            if (align.type === 'replace') {
                const origWord = align.orig?.content || '';
                const inpWord = align.inp?.content || '';
                
                // Если это пробелы, используем минимальное количество пробелов (обычно 1)
                if (align.orig?.type === 'space' && align.inp?.type === 'space') {
                    // Используем минимальное количество пробелов (обычно 1)
                    const minSpaceLen = Math.min(origWord.length, inpWord.length) || 1;
                    for (let i = 0; i < minSpaceLen; i++) {
                        alignedOriginal.push(' ');
                        alignedInput.push(' ');
                        operations.push({ type: 'space', char: ' ' });
                    }
                } else if (align.orig?.type === 'word' && align.inp?.type === 'word') {
                    // Выравнивание символов внутри слова с использованием Левенштейна
                    // Сначала находим наибольшую общую подстроку для лучшего выравнивания
                    const findLongestCommonSubstring = (str1, str2) => {
                        const m = str1.length;
                        const n = str2.length;
                        let maxLen = 0;
                        let endIndex = -1;
                        const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

                        for (let i = 1; i <= m; i++) {
                            for (let j = 1; j <= n; j++) {
                                if (str1[i - 1] === str2[j - 1]) {
                                    dp[i][j] = dp[i - 1][j - 1] + 1;
                                    if (dp[i][j] > maxLen) {
                                        maxLen = dp[i][j];
                                        endIndex = i - 1;
                                    }
                                } else {
                                    dp[i][j] = 0;
                                }
                            }
                        }

                        if (maxLen > 0 && endIndex >= 0) {
                            return {
                                length: maxLen,
                                startInStr1: endIndex - maxLen + 1,
                                endInStr1: endIndex,
                                substring: str1.substring(endIndex - maxLen + 1, endIndex + 1)
                            };
                        }
                        return null;
                    };

                    // Находим наибольшую общую подстроку
                    const lcs = findLongestCommonSubstring(origWord, inpWord);
                    
                    // Если есть значимая общая подстрока (больше 1 символа), выравниваем по ней
                    let adjustedOrigWord = origWord;
                    let adjustedInpWord = inpWord;

                    if (lcs && lcs.length > 1) {
                        // Находим все позиции этой подстроки во втором слове
                        const lcsInOrig = lcs.startInStr1;
                        let lcsInInp = -1;
                        
                        // Ищем первое вхождение подстроки во вводе
                        for (let i = 0; i <= inpWord.length - lcs.length; i++) {
                            if (inpWord.substring(i, i + lcs.length) === lcs.substring) {
                                lcsInInp = i;
                                break;
                            }
                        }

                        if (lcsInInp >= 0) {
                            // Вычисляем, сколько пробелов нужно добавить в оригинал
                            if (lcsInInp > lcsInOrig) {
                                // Нужно добавить пробелы в начало оригинала
                                const prefixSpaces = lcsInInp - lcsInOrig;
                                adjustedOrigWord = ' '.repeat(prefixSpaces) + origWord;
                            }

                            // Выравниваем по длине после общей подстроки
                            const origAfterLcs = adjustedOrigWord.substring(lcsInOrig + lcs.length + (lcsInInp > lcsInOrig ? lcsInInp - lcsInOrig : 0));
                            const inpAfterLcs = inpWord.substring(lcsInInp + lcs.length);
                            const maxAfterLen = Math.max(origAfterLcs.length, inpAfterLcs.length);
                            const suffixSpaces = maxAfterLen - origAfterLcs.length;
                            
                            if (suffixSpaces > 0) {
                                adjustedOrigWord = adjustedOrigWord + ' '.repeat(suffixSpaces);
                            }
                        }
                    }

                    const alignChars = (str1, str2) => {
                        const m = str1.length;
                        const n = str2.length;
                        const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
                        const path = Array(m + 1).fill(null).map(() => Array(n + 1).fill(null));

                        // Инициализация
                        for (let i = 0; i <= m; i++) {
                            dp[i][0] = i;
                            if (i > 0) path[i][0] = { op: 'delete', i: i - 1, j: 0 };
                        }
                        for (let j = 0; j <= n; j++) {
                            dp[0][j] = j;
                            if (j > 0) path[0][j] = { op: 'insert', i: 0, j: j - 1 };
                        }

                        // Заполнение матрицы
                        for (let i = 1; i <= m; i++) {
                            for (let j = 1; j <= n; j++) {
                                const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
                                const replace = dp[i - 1][j - 1] + cost;
                                const del = dp[i - 1][j] + 1;
                                const ins = dp[i][j - 1] + 1;

                                if (replace <= del && replace <= ins) {
                                    dp[i][j] = replace;
                                    path[i][j] = { op: 'replace', i: i - 1, j: j - 1 };
                                } else if (del <= ins) {
                                    dp[i][j] = del;
                                    path[i][j] = { op: 'delete', i: i - 1, j: j };
                                } else {
                                    dp[i][j] = ins;
                                    path[i][j] = { op: 'insert', i: i, j: j - 1 };
                                }
                            }
                        }

                        // Восстановление пути
                        const alignment = [];
                        let i = m, j = n;
                        while (i > 0 || j > 0) {
                            const p = path[i][j];
                            if (!p) {
                                if (i > 0) {
                                    alignment.unshift({ type: 'delete', char: str1[i - 1] });
                                    i--;
                                } else if (j > 0) {
                                    alignment.unshift({ type: 'insert', char: str2[j - 1] });
                                    j--;
                                } else break;
                                continue;
                            }

                            if (p.op === 'replace') {
                                const char1 = i > 0 ? str1[i - 1] : '';
                                const char2 = j > 0 ? str2[j - 1] : '';
                                if (char1 === char2) {
                                    alignment.unshift({ type: 'match', char: char1 });
                                } else {
                                    alignment.unshift({ type: 'replace', original: char1, input: char2 });
                                }
                                i = p.i;
                                j = p.j;
                            } else if (p.op === 'delete') {
                                alignment.unshift({ type: 'delete', char: i > 0 ? str1[i - 1] : '' });
                                i = p.i;
                            } else if (p.op === 'insert') {
                                alignment.unshift({ type: 'insert', char: j > 0 ? str2[j - 1] : '' });
                                j = p.j;
                            } else {
                                break;
                            }
                        }
                        return alignment;
                    };

                    const charAlignment = alignChars(adjustedOrigWord, adjustedInpWord);
                    charAlignment.forEach(op => {
                        if (op.type === 'match') {
                            alignedOriginal.push(op.char);
                            alignedInput.push(op.char);
                            operations.push({ type: 'match', char: op.char });
                        } else if (op.type === 'delete') {
                            alignedOriginal.push(op.char);
                            alignedInput.push(' ');
                            operations.push({ type: 'delete', char: op.char });
                        } else if (op.type === 'insert') {
                            alignedOriginal.push(' ');
                            alignedInput.push(op.char);
                            operations.push({ type: 'insert', char: op.char });
                        } else if (op.type === 'replace') {
                            alignedOriginal.push(op.original);
                            alignedInput.push(op.input);
                            operations.push({ type: 'replace', original: op.original, input: op.input });
                        }
                    });
                } else {
                    // Разные типы - обрабатываем отдельно
                    if (align.orig) {
                        align.orig.content.split('').forEach(char => {
                            alignedOriginal.push(char);
                            alignedInput.push(' ');
                            operations.push({ type: 'delete', char });
                        });
                    }
                    if (align.inp) {
                        align.inp.content.split('').forEach(char => {
                            alignedOriginal.push(' ');
                            alignedInput.push(char);
                            operations.push({ type: 'insert', char });
                        });
                    }
                }
                
            } else if (align.type === 'delete') {
                // Удаленное слово из оригинала
                const origWord = align.orig?.content || '';
                origWord.split('').forEach(char => {
                    alignedOriginal.push(char);
                    alignedInput.push(' ');
                    operations.push({ type: 'delete', char });
                });
                
            } else if (align.type === 'insert') {
                // Вставленное слово во вводе
                const inpWord = align.inp?.content || '';
                inpWord.split('').forEach(char => {
                    alignedOriginal.push(' ');
                    alignedInput.push(char);
                    operations.push({ type: 'insert', char });
                });
            }
            
            // Добавляем пробел после слова только если следующий элемент - не пробел
            // Это предотвращает дублирование пробелов
            const isLast = align === wordAlignment[wordAlignment.length - 1];
            const isSpace = (align.type === 'replace' && align.orig?.type === 'space' && align.inp?.type === 'space') ||
                           (align.type === 'delete' && align.orig?.type === 'space') ||
                           (align.type === 'insert' && align.inp?.type === 'space');
            
            // Добавляем пробел только после слов, если следующий элемент - не пробел
            if (!isLast && !isSpace && !isNextSpace && 
                (align.type === 'replace' && align.orig?.type === 'word' && align.inp?.type === 'word' ||
                 align.type === 'delete' && align.orig?.type === 'word' ||
                 align.type === 'insert' && align.inp?.type === 'word')) {
                alignedOriginal.push(' ');
                alignedInput.push(' ');
                operations.push({ type: 'space', char: ' ' });
            }
        });

        return {
            alignedOriginal: alignedOriginal.join(''),
            alignedInput: alignedInput.join(''),
            operations
        };
    },

    /**
     * Множественное выравнивание текстов относительно оригинала
     * Выравнивает все тексты относительно оригинального текста, как при сравнении аминокислотных последовательностей
     * 
     * @param {string} original - Оригинальный текст
     * @param {Array<Object>} inputs - Массив объектов с полями userInput, createdAt, sessionCreatedAt
     * @returns {Array<Object>} - Массив выровненных текстов с метаданными
     */
    multipleAlignment(original, inputs) {
        if (!original) {
            return inputs.map((input, index) => ({
                text: input.userInput || '',
                aligned: input.userInput || '',
                alignedOriginal: '',
                operations: [],
                distance: input.userInput ? input.userInput.length : 0,
                createdAt: input.createdAt || input.sessionCreatedAt,
                sessionCreatedAt: input.sessionCreatedAt
            }));
        }

        // Сортируем входы по дате (от нового к старому)
        const sortedInputs = [...inputs].sort((a, b) => {
            const dateA = new Date(a.sessionCreatedAt || a.createdAt || 0);
            const dateB = new Date(b.sessionCreatedAt || b.createdAt || 0);
            return dateB - dateA; // Новые первыми
        });

        // Выравниваем каждый текст относительно оригинала
        const alignedTexts = sortedInputs.map(input => {
            const aligned = this.wordLevelAlign(original, input.userInput || '');
            const distance = this.manhattanDistance(original, input.userInput || '');
            
            return {
                text: input.userInput || '',
                aligned: aligned.alignedInput,
                alignedOriginal: aligned.alignedOriginal,
                operations: aligned.operations,
                distance: distance,
                createdAt: input.createdAt,
                sessionCreatedAt: input.sessionCreatedAt
            };
        });

        // Находим максимальную длину среди всех выровненных текстов
        let maxLength = 0;
        alignedTexts.forEach(aligned => {
            maxLength = Math.max(maxLength, aligned.aligned.length, aligned.alignedOriginal.length);
        });

        // Находим самый длинный выровненный оригинал - это будет базовый оригинал
        // Он содержит все пробелы, необходимые для выравнивания
        let baseAlignedOriginal = '';
        let baseAlignedOriginalLength = 0;
        alignedTexts.forEach(aligned => {
            if (aligned.alignedOriginal.length > baseAlignedOriginalLength) {
                baseAlignedOriginal = aligned.alignedOriginal;
                baseAlignedOriginalLength = aligned.alignedOriginal.length;
            }
        });

        // Если нет выровненных текстов, используем оригинал как есть
        if (baseAlignedOriginalLength === 0) {
            baseAlignedOriginal = original;
            baseAlignedOriginalLength = original.length;
        }

        // Обновляем maxLength с учетом базового оригинала
        maxLength = Math.max(maxLength, baseAlignedOriginalLength);

        // Дополняем все тексты до максимальной длины пробелами справа
        const padToLength = (str, len) => {
            if (str.length >= len) return str;
            return str + ' '.repeat(len - str.length);
        };

        // Создаем оригинальный текст на основе самого длинного выровненного оригинала
        // Это гарантирует, что оригинал содержит все пробелы, необходимые для выравнивания
        const originalPadded = padToLength(baseAlignedOriginal, maxLength);
        const originalOperations = Array.from(originalPadded).map((char, i) => {
            // Если это пробел, который был добавлен для выравнивания, помечаем как space
            if (i >= baseAlignedOriginalLength && char === ' ') {
                return { type: 'space', char: ' ' };
            }
            // Если это пробел в базовом оригинале (для выравнивания), помечаем как space
            if (char === ' ' && i < baseAlignedOriginal.length && baseAlignedOriginal[i] === ' ') {
                return { type: 'space', char: ' ' };
            }
            return { type: 'match', char: char };
        });

        // Добавляем оригинальный текст в начало
        const originalResult = {
            text: original,
            aligned: originalPadded,
            alignedOriginal: originalPadded,
            operations: originalOperations,
            distance: 0,
            isOriginal: true
        };

        // Для каждого введенного текста пересчитываем выравнивание относительно базового оригинала
        // Используем оригинальный текст для выравнивания, затем применяем пробелы из baseAlignedOriginal
        const paddedTexts = alignedTexts.map(aligned => {
            // Сначала выравниваем относительно оригинального текста (без пробелов выравнивания)
            const realigned = this.wordLevelAlign(original, aligned.text);
            
            // Теперь применяем пробелы из baseAlignedOriginal к realigned.alignedOriginal
            // Находим позиции пробелов в baseAlignedOriginal и вставляем их в realigned
            let syncedOriginal = '';
            let syncedInput = '';
            let syncedOperations = [];
            
            let realignedIdx = 0; // Индекс в realigned.alignedOriginal (без пробелов выравнивания)
            let baseIdx = 0; // Индекс в baseAlignedOriginal
            
            // Проходим по baseAlignedOriginal и синхронизируем с realigned
            while (baseIdx < baseAlignedOriginal.length || realignedIdx < realigned.alignedOriginal.length) {
                const baseChar = baseIdx < baseAlignedOriginal.length ? baseAlignedOriginal[baseIdx] : null;
                const realignedOrigChar = realignedIdx < realigned.alignedOriginal.length ? realigned.alignedOriginal[realignedIdx] : null;
                
                // Если в базовом оригинале пробел, а в realigned - не пробел, добавляем пробел
                if (baseChar === ' ' && realignedOrigChar !== ' ' && realignedOrigChar !== null) {
                    syncedOriginal += ' ';
                    syncedInput += ' ';
                    syncedOperations.push({ type: 'space', char: ' ' });
                    baseIdx++;
                } else if (realignedOrigChar === ' ' && baseChar !== ' ' && baseChar !== null) {
                    // Если в realigned пробел, а в базовом - не пробел, пропускаем пробел в realigned
                    realignedIdx++;
                } else if (baseChar !== null && realignedOrigChar !== null) {
                    // Оба символа не пробелы, добавляем из realigned
                    syncedOriginal += realignedOrigChar;
                    syncedInput += realigned.alignedInput[realignedIdx] || ' ';
                    syncedOperations.push(realigned.operations[realignedIdx] || { type: 'match', char: realignedOrigChar });
                    realignedIdx++;
                    baseIdx++;
                } else if (baseChar === ' ') {
                    // Только пробел в базовом
                    syncedOriginal += ' ';
                    syncedInput += ' ';
                    syncedOperations.push({ type: 'space', char: ' ' });
                    baseIdx++;
                } else if (realignedOrigChar !== null) {
                    // Только символ в realigned
                    syncedOriginal += realignedOrigChar;
                    syncedInput += realigned.alignedInput[realignedIdx] || ' ';
                    syncedOperations.push(realigned.operations[realignedIdx] || { type: 'match', char: realignedOrigChar });
                    realignedIdx++;
                } else {
                    break;
                }
            }
            
            // Дополняем до maxLength
            const paddedAligned = padToLength(syncedInput, maxLength);
            const paddedOriginal = padToLength(syncedOriginal, maxLength);
            
            // Дополняем операции
            const paddedOperations = [...syncedOperations];
            while (paddedOperations.length < maxLength) {
                paddedOperations.push({ type: 'match', char: ' ' });
            }

            return {
                ...aligned,
                aligned: paddedAligned,
                alignedOriginal: paddedOriginal,
                operations: paddedOperations.slice(0, maxLength)
            };
        });

        return [originalResult, ...paddedTexts];
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

