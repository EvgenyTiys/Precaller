/**
 * Fragment - Унифицированная структура данных для фрагмента текста
 * Решает проблему двух несинхронизированных массивов (textFragments и currentFragments)
 */
class Fragment {
    constructor(data) {
        // Унифицированная структура данных
        this.id = data.id || null;
        this.order = data.order || data.fragment_order || null;
        this.content = data.content || '';
        this.startPos = data.startPos || data.start_position || 0;
        this.endPos = data.endPos || data.end_position || 0;
        
        // Ассоциации
        this.emoji = data.emoji || null;
        this.customWord = data.custom_word || data.customWord || null;
        this.customImage = data.custom_image || data.customImage || null;
    }
    
    /**
     * Конвертация в формат для отправки в БД
     */
    toDBFormat() {
        return {
            id: this.id,
            order: this.order,
            content: this.content,
            startPos: this.startPos,
            endPos: this.endPos,
            emoji: this.emoji,
            customWord: this.customWord,
            customImage: this.customImage
        };
    }
    
    /**
     * Конвертация в формат БД (для сохранения)
     */
    toServerFormat() {
        return {
            id: this.id,
            fragment_order: this.order,
            content: this.content,
            start_position: this.startPos,
            end_position: this.endPos,
            emoji: this.emoji,
            custom_word: this.customWord,
            custom_image: this.customImage
        };
    }
    
    /**
     * Проверка наличия ассоциации
     */
    hasAssociation() {
        return !!(this.emoji || this.customWord || this.customImage);
    }
    
    /**
     * Получение ассоциации для отображения
     */
    getAssociationDisplay() {
        if (this.emoji) return this.emoji;
        if (this.customWord) return this.customWord;
        if (this.customImage) return '🖼️';
        return '';
    }
    
    /**
     * Создание уникального ключа для дедупликации
     */
    getUniqueKey() {
        return `${this.startPos}-${this.endPos}-${this.content}`;
    }
    
    /**
     * Клонирование фрагмента
     */
    clone() {
        return new Fragment(this);
    }
    
    /**
     * Сравнение с другим фрагментом
     */
    equals(other) {
        if (!other) return false;
        return this.getUniqueKey() === other.getUniqueKey();
    }
    
    /**
     * Обновление ассоциаций из другого фрагмента
     */
    updateAssociations(source) {
        if (source.emoji) this.emoji = source.emoji;
        if (source.customWord) this.customWord = source.customWord;
        if (source.customImage) this.customImage = source.customImage;
    }
    
    /**
     * Очистка ассоциаций
     */
    clearAssociations() {
        this.emoji = null;
        this.customWord = null;
        this.customImage = null;
    }
}

// Экспорт для использования в других модулях
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Fragment;
}


