// API запросы для тренировки
class TrainingAPI {
    constructor() {
        this.baseUrl = '/api/training';
    }
    
    // Получение списка доступных текстов
    async getAvailableTexts() {
        try {
            const response = await window.app.apiRequest(`${this.baseUrl}/available`);
            return response.texts || [];
        } catch (error) {
            console.error('Error fetching available texts:', error);
            throw error;
        }
    }
    
    // Получение данных текста для тренировки
    async getTrainingText(textId) {
        try {
            const response = await window.app.apiRequest(`${this.baseUrl}/text/${textId}`);
            return {
                text: response.text,
                fragments: response.fragments || []
            };
        } catch (error) {
            console.error('Error fetching training text:', error);
            throw error;
        }
    }
    
    // Сохранение сессии тренировки
    async saveTrainingSession(textId, durationSeconds) {
        try {
            const response = await window.app.apiRequest(`${this.baseUrl}/session`, {
                method: 'POST',
                body: JSON.stringify({
                    textId: textId,
                    durationSeconds: durationSeconds
                })
            });
            return response;
        } catch (error) {
            console.error('Error saving training session:', error);
            throw error;
        }
    }
}

// Экспорт для использования в других модулях
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TrainingAPI;
}

