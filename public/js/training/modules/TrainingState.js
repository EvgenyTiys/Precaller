// Управление состоянием тренировки
class TrainingState {
    constructor() {
        this.state = {
            currentTextId: null,
            currentText: null,
            trainingFragments: [],
            currentFragmentIndex: 0,
            visibility: {
                text: false,
                emojis: false,
                timer: false
            },
            timer: {
                isRunning: false,
                elapsedSeconds: 0,
                startTime: null
            },
            userInputs: []
        };
        this.observers = [];
    }
    
    subscribe(observer) {
        if (typeof observer === 'function') {
            this.observers.push(observer);
        }
    }
    
    unsubscribe(observer) {
        this.observers = this.observers.filter(obs => obs !== observer);
    }
    
    setState(updates) {
        // Глубокое слияние для вложенных объектов
        const newState = { ...this.state };
        Object.keys(updates).forEach(key => {
            if (typeof updates[key] === 'object' && updates[key] !== null && !Array.isArray(updates[key])) {
                newState[key] = { ...this.state[key], ...updates[key] };
            } else {
                newState[key] = updates[key];
            }
        });
        this.state = newState;
        this.notify();
    }
    
    notify() {
        this.observers.forEach(observer => {
            try {
                observer(this.state);
            } catch (error) {
                console.error('Error in state observer:', error);
            }
        });
    }
    
    getState() {
        return { ...this.state };
    }
    
    // Геттеры для удобного доступа
    getCurrentTextId() {
        return this.state.currentTextId;
    }
    
    getCurrentText() {
        return this.state.currentText;
    }
    
    getTrainingFragments() {
        return [...this.state.trainingFragments];
    }
    
    getCurrentFragmentIndex() {
        return this.state.currentFragmentIndex;
    }
    
    getUserInputs() {
        return [...this.state.userInputs];
    }
    
    // Сеттеры для удобного изменения
    setCurrentTextId(textId) {
        this.setState({ currentTextId: textId });
    }
    
    setCurrentText(text) {
        this.setState({ currentText: text });
    }
    
    setTrainingFragments(fragments) {
        this.setState({ trainingFragments: fragments });
        // Инициализируем массив введённых фраз
        this.setState({ userInputs: new Array(fragments.length).fill('') });
    }
    
    setCurrentFragmentIndex(index) {
        this.setState({ currentFragmentIndex: index });
    }
    
    setUserInput(index, value) {
        const userInputs = [...this.state.userInputs];
        userInputs[index] = value;
        this.setState({ userInputs });
    }
    
    setVisibility(key, value) {
        this.setState({
            visibility: {
                ...this.state.visibility,
                [key]: value
            }
        });
    }
    
    reset() {
        this.state = {
            currentTextId: null,
            currentText: null,
            trainingFragments: [],
            currentFragmentIndex: 0,
            visibility: {
                text: false,
                emojis: false,
                timer: false
            },
            timer: {
                isRunning: false,
                elapsedSeconds: 0,
                startTime: null
            },
            userInputs: []
        };
        this.notify();
    }
}

// Экспорт для использования в других модулях
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TrainingState;
}

