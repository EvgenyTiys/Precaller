// Логика секундомера
class TrainingTimer {
    constructor(stateManager) {
        this.stateManager = stateManager;
        this.timerInterval = null;
    }
    
    start() {
        const state = this.stateManager.getState();
        if (state.timer.isRunning) return;
        
        const startTime = Date.now() - (state.timer.elapsedSeconds * 1000);
        this.stateManager.setState({
            timer: {
                isRunning: true,
                elapsedSeconds: state.timer.elapsedSeconds,
                startTime: startTime
            }
        });
        
        this.timerInterval = setInterval(() => {
            const currentState = this.stateManager.getState();
            if (currentState.timer.startTime) {
                const elapsedSeconds = Math.floor((Date.now() - currentState.timer.startTime) / 1000);
                this.stateManager.setState({
                    timer: {
                        ...currentState.timer,
                        elapsedSeconds: elapsedSeconds
                    }
                });
            }
        }, 1000); // Обновляем раз в секунду вместо 100ms
    }
    
    stop() {
        const state = this.stateManager.getState();
        if (!state.timer.isRunning) return;
        
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        
        this.stateManager.setState({
            timer: {
                ...state.timer,
                isRunning: false
            }
        });
    }
    
    reset() {
        this.stop();
        this.stateManager.setState({
            timer: {
                isRunning: false,
                elapsedSeconds: 0,
                startTime: null
            }
        });
    }
    
    getElapsedSeconds() {
        return this.stateManager.getState().timer.elapsedSeconds;
    }
    
    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    
    cleanup() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }
}

// Экспорт для использования в других модулях
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TrainingTimer;
}

