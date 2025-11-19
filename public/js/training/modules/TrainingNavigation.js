// Навигация между слайдами
class TrainingNavigation {
    constructor(stateManager, uiManager) {
        this.stateManager = stateManager;
        this.uiManager = uiManager;
        this.isNavigating = false; // Защита от race condition
    }
    
    goToNext() {
        // Защита от race condition
        if (this.isNavigating) {
            console.warn('Navigation already in progress');
            return;
        }
        
        this.isNavigating = true;
        
        try {
            const state = this.stateManager.getState();
            
            // Сохраняем введённую фразу ДО проверки индекса
            const fragmentInput = document.getElementById('fragmentInput');
            if (fragmentInput && fragmentInput.value.trim()) {
                const nextIndex = state.currentFragmentIndex + 1;
                if (nextIndex < state.trainingFragments.length) {
                    this.stateManager.setUserInput(nextIndex, fragmentInput.value.trim());
                }
            }
            
            if (state.currentFragmentIndex < state.trainingFragments.length - 1) {
                this.stateManager.setCurrentFragmentIndex(state.currentFragmentIndex + 1);
                this.uiManager.displayCurrentFragment();
                
                // Анимация
                this.uiManager.animateSlide('right');
            } else {
                this.uiManager.showTrainingComplete();
            }
        } finally {
            // Снимаем блокировку после небольшой задержки
            setTimeout(() => {
                this.isNavigating = false;
            }, 100);
        }
    }
    
    goToPrevious() {
        if (this.isNavigating) {
            console.warn('Navigation already in progress');
            return;
        }
        
        this.isNavigating = true;
        
        try {
            const state = this.stateManager.getState();
            
            if (state.currentFragmentIndex > 0) {
                this.stateManager.setCurrentFragmentIndex(state.currentFragmentIndex - 1);
                this.uiManager.displayCurrentFragment();
                
                // Анимация
                this.uiManager.animateSlide('left');
            } else if (state.currentFragmentIndex === 0) {
                // Возвращаемся к слайду ввода
                this.uiManager.showInputSlide();
            }
        } finally {
            setTimeout(() => {
                this.isNavigating = false;
            }, 100);
        }
    }
    
    goToFragment(index) {
        if (this.isNavigating) {
            console.warn('Navigation already in progress');
            return;
        }
        
        const state = this.stateManager.getState();
        if (index >= 0 && index < state.trainingFragments.length) {
            this.isNavigating = true;
            try {
                this.stateManager.setCurrentFragmentIndex(index);
                this.uiManager.displayCurrentFragment();
            } finally {
                setTimeout(() => {
                    this.isNavigating = false;
                }, 100);
            }
        }
    }
    
    reset() {
        this.isNavigating = false;
    }
}

// Экспорт для использования в других модулях
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TrainingNavigation;
}

