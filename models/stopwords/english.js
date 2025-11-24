// Английские стоп-слова для фильтрации
const stopwords = require('stopwords').en;

module.exports = new Set(stopwords);


