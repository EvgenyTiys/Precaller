// Утилиты для работы с текстом и позиционированием (вдохновлено Rangy)
// Кроссплатформенное решение для определения позиции клика в тексте

window.RangyUtils = {
    // Инициализация
    init: function() {
        // Проверяем поддержку различных методов
        this.features = {
            caretRangeFromPoint: typeof document.caretRangeFromPoint === 'function',
            caretPositionFromPoint: typeof document.caretPositionFromPoint === 'function',
            getSelection: typeof window.getSelection === 'function'
        };
    },

    // Получение позиции клика с высокой точностью
    getClickPosition: function(event, textElement) {
        const x = event.clientX;
        const y = event.clientY;
        
        // Пробуем разные методы в порядке предпочтения
        let range = this.getRangeFromPoint(x, y);
        
        if (!range) {
            return null;
        }
        
        // Вычисляем точную позицию в тексте
        return this.getTextPositionFromRange(range, textElement);
    },

    // Получение Range из координат точки
    getRangeFromPoint: function(x, y) {
        // Метод 1: caretRangeFromPoint (WebKit)
        if (this.features.caretRangeFromPoint) {
            try {
                return document.caretRangeFromPoint(x, y);
            } catch (e) {
                // Игнорируем ошибки и пробуем следующий метод
            }
        }
        
        // Метод 2: caretPositionFromPoint (Firefox)
        if (this.features.caretPositionFromPoint) {
            try {
                const pos = document.caretPositionFromPoint(x, y);
                if (pos) {
                    const range = document.createRange();
                    range.setStart(pos.offsetNode, pos.offset);
                    range.setEnd(pos.offsetNode, pos.offset);
                    return range;
                }
            } catch (e) {
                // Игнорируем ошибки и пробуем следующий метод
            }
        }
        
        // Метод 3: Fallback - создание range через elementFromPoint
        return this.getRangeFromElement(x, y);
    },

    // Fallback метод через elementFromPoint
    getRangeFromElement: function(x, y) {
        const element = document.elementFromPoint(x, y);
        if (!element) return null;
        
        // Если клик по текстовому узлу
        if (element.nodeType === Node.TEXT_NODE) {
            const range = document.createRange();
            range.selectNodeContents(element);
            return range;
        }
        
        // Ищем ближайший текстовый узел
        const textNodes = this.getTextNodes(element);
        if (textNodes.length === 0) return null;
        
        // Выбираем текстовый узел, который ближе всего к точке клика
        let closestNode = textNodes[0];
        let minDistance = Infinity;
        
        for (const node of textNodes) {
            const rect = this.getNodeRect(node);
            if (rect) {
                const distance = Math.sqrt(
                    Math.pow(x - (rect.left + rect.width / 2), 2) + 
                    Math.pow(y - (rect.top + rect.height / 2), 2)
                );
                if (distance < minDistance) {
                    minDistance = distance;
                    closestNode = node;
                }
            }
        }
        
        const range = document.createRange();
        range.selectNodeContents(closestNode);
        return range;
    },

    // Получение всех текстовых узлов в элементе
    getTextNodes: function(element) {
        const textNodes = [];
        const walker = document.createTreeWalker(
            element,
            NodeFilter.SHOW_TEXT,
            null,
            false
        );
        
        let node;
        while (node = walker.nextNode()) {
            if (node.textContent.trim()) {
                textNodes.push(node);
            }
        }
        
        return textNodes;
    },

    // Получение прямоугольника узла
    getNodeRect: function(node) {
        try {
            const range = document.createRange();
            range.selectNode(node);
            return range.getBoundingClientRect();
        } catch (e) {
            return null;
        }
    },

    // Вычисление позиции в тексте по Range
    getTextPositionFromRange: function(range, textElement) {
        try {
            // Создаем range для всего текстового содержимого
            const fullRange = document.createRange();
            fullRange.selectNodeContents(textElement);
            
            // Создаем range от начала текста до позиции клика
            const beforeRange = document.createRange();
            beforeRange.setStart(fullRange.startContainer, fullRange.startOffset);
            beforeRange.setEnd(range.startContainer, range.startOffset);
            
            // Получаем текст до позиции клика
            const beforeText = beforeRange.toString();
            return beforeText.length;
        } catch (e) {
            // Fallback: используем TreeWalker
            return this.getTextPositionFromRangeFallback(range, textElement);
        }
    },

    // Fallback метод для вычисления позиции
    getTextPositionFromRangeFallback: function(range, textElement) {
        let position = 0;
        
        const walker = document.createTreeWalker(
            textElement,
            NodeFilter.SHOW_TEXT,
            null,
            false
        );
        
        let node;
        while (node = walker.nextNode()) {
            if (node === range.startContainer) {
                position += range.startOffset;
                break;
            } else {
                position += node.textContent.length;
            }
        }
        
        return position;
    },

    // Создание range в определенной позиции текста
    createRangeAtPosition: function(textElement, position) {
        const range = document.createRange();
        const walker = document.createTreeWalker(
            textElement,
            NodeFilter.SHOW_TEXT,
            null,
            false
        );
        
        let currentPos = 0;
        let node;
        
        while (node = walker.nextNode()) {
            const nodeLength = node.textContent.length;
            
            if (currentPos + nodeLength >= position) {
                const offset = position - currentPos;
                range.setStart(node, Math.min(offset, nodeLength));
                range.setEnd(node, Math.min(offset, nodeLength));
                return range;
            }
            
            currentPos += nodeLength;
        }
        
        // Если позиция за пределами текста, устанавливаем в конец
        if (node) {
            range.setStart(node, node.textContent.length);
            range.setEnd(node, node.textContent.length);
        }
        
        return range;
    },

    // Выделение текста от startPos до endPos
    selectTextRange: function(textElement, startPos, endPos) {
        const range = document.createRange();
        const walker = document.createTreeWalker(
            textElement,
            NodeFilter.SHOW_TEXT,
            null,
            false
        );
        
        let currentPos = 0;
        let node;
        let startNode = null, endNode = null;
        let startOffset = 0, endOffset = 0;
        
        while (node = walker.nextNode()) {
            const nodeLength = node.textContent.length;
            
            if (!startNode && currentPos + nodeLength >= startPos) {
                startNode = node;
                startOffset = startPos - currentPos;
            }
            
            if (!endNode && currentPos + nodeLength >= endPos) {
                endNode = node;
                endOffset = endPos - currentPos;
                break;
            }
            
            currentPos += nodeLength;
        }
        
        if (startNode && endNode) {
            range.setStart(startNode, Math.min(startOffset, startNode.textContent.length));
            range.setEnd(endNode, Math.min(endOffset, endNode.textContent.length));
            
            const selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(range);
        }
    }
};

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', function() {
    window.RangyUtils.init();
});
