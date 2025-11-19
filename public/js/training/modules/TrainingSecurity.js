// Безопасность и санитизация данных
class TrainingSecurity {
    constructor(validationUtils) {
        this.validationUtils = validationUtils;
    }
    
    // Создание безопасного элемента ассоциации
    createSafeAssociationElement(fragment, onClick) {
        const container = document.createElement('div');
        
        if (fragment.emoji) {
            const emoji = this.validationUtils.sanitizeEmoji(fragment.emoji);
            container.textContent = emoji;
            container.className = 'association-emoji';
        } else if (fragment.customImage) {
            const url = this.validationUtils.sanitizeImageUrl(fragment.customImage);
            if (url) {
                const img = document.createElement('img');
                img.src = url;
                img.alt = 'Ассоциация';
                img.className = 'association-image';
                container.appendChild(img);
            } else {
                // Недопустимый URL - показываем placeholder
                container.textContent = '🖼️';
                container.className = 'association-emoji';
            }
        } else if (fragment.customWord) {
            container.textContent = fragment.customWord; // textContent автоматически экранирует
            container.className = 'association-word';
        } else {
            container.textContent = '🖼️';
            container.className = 'association-emoji';
        }
        
        if (onClick) {
            container.addEventListener('click', onClick);
        }
        
        return container;
    }
    
    // Создание безопасного элемента для цепочки рассказа
    createSafeChainElement(fragment, index, isActive, onClick) {
        const div = document.createElement('div');
        div.className = `chain-emoji ${isActive ? 'active' : ''}`;
        
        if (fragment.emoji) {
            div.textContent = this.validationUtils.sanitizeEmoji(fragment.emoji);
        } else if (fragment.customWord) {
            div.textContent = fragment.customWord;
        } else {
            div.textContent = '🖼️';
        }
        
        if (onClick) {
            div.addEventListener('click', () => onClick(index));
        }
        
        return div;
    }
    
    // Создание безопасного элемента для подсказки следующего фрагмента
    createSafeHintElement(fragment) {
        if (fragment.emoji) {
            const div = document.createElement('div');
            div.className = 'next-association-emoji';
            div.textContent = this.validationUtils.sanitizeEmoji(fragment.emoji);
            return div;
        } else if (fragment.customImage) {
            const url = this.validationUtils.sanitizeImageUrl(fragment.customImage);
            if (url) {
                const img = document.createElement('img');
                img.src = url;
                img.className = 'next-association-image';
                img.alt = 'Следующая ассоциация';
                return img;
            }
        } else if (fragment.customWord) {
            const div = document.createElement('div');
            div.className = 'next-association-word';
            div.textContent = fragment.customWord;
            return div;
        }
        
        // Fallback
        const div = document.createElement('div');
        div.className = 'number-only';
        div.style.fontSize = '1.5rem';
        div.style.width = '50px';
        div.style.height = '50px';
        return div;
    }
}

// Экспорт для использования в других модулях
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TrainingSecurity;
}

