// Утилиты для работы с DOM
class DOMUtils {
    static getElement(id) {
        return document.getElementById(id);
    }
    
    static show(elementId) {
        const el = this.getElement(elementId);
        if (el) el.style.display = 'block';
    }
    
    static hide(elementId) {
        const el = this.getElement(elementId);
        if (el) el.style.display = 'none';
    }
    
    static toggle(elementId, show) {
        if (show) this.show(elementId);
        else this.hide(elementId);
    }
    
    static setText(elementId, text) {
        const el = this.getElement(elementId);
        if (el) el.textContent = text;
    }
    
    static safeSetText(element, text) {
        if (element) element.textContent = text;
    }
    
    static safeSetHTML(element, html) {
        if (element) {
            element.innerHTML = '';
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            if (doc.body.firstChild) {
                element.appendChild(doc.body.firstChild);
            }
        }
    }
    
    static createImage(src, alt, className, onClick) {
        const img = document.createElement('img');
        img.src = src;
        img.alt = alt;
        img.className = className;
        if (onClick) img.addEventListener('click', onClick);
        return img;
    }
    
    static clearElement(elementId) {
        const el = this.getElement(elementId);
        if (el) el.innerHTML = '';
    }
}

// Экспорт для использования в других модулях
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DOMUtils;
}

