// Немецкие стоп-слова для фильтрации
const stopwords = require('stopwords').de;

module.exports = new Set(stopwords);


