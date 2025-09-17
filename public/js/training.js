// JavaScript для режима тренировки

let currentTextId = null;
let currentText = null;
let trainingFragments = [];
let currentFragmentIndex = 0;
let isTextHidden = false;
let isEmojisHidden = false;

document.addEventListener('DOMContentLoaded', function() {
    initializeTraining();
});

function initializeTraining() {
    // Получаем ID текста из URL
    const urlParams = new URLSearchParams(window.location.search);
    currentTextId = urlParams.get('textId');
    
    // Проверяем аутентификацию
    checkAuthentication();
    
    // Инициализируем обработчики
    initializeTrainingHandlers();
    
    if (currentTextId) {
        // Загружаем конкретный текст для тренировки
        loadTrainingText();
    } else {
        // Показываем список доступных текстов
        loadAvailableTexts();
    }
}

function checkAuthentication() {
    const savedToken = localStorage.getItem('authToken');
    const savedUser = localStorage.getItem('currentUser');
    
    if (!savedToken || !savedUser) {
        window.location.href = '/';
        return;
    }
    
    currentUser = JSON.parse(savedUser);
    authToken = savedToken;
    
    // Обновляем интерфейс
    const username = document.getElementById('username');
    if (username) {
        username.textContent = currentUser.username;
    }
}

function initializeTrainingHandlers() {
    // Навигация
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const restartBtn = document.getElementById('restartBtn');
    
    if (prevBtn) {
        prevBtn.addEventListener('click', goToPrevious);
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', goToNext);
    }
    
    if (restartBtn) {
        restartBtn.addEventListener('click', restartTraining);
    }
    
    // Управление видимостью
    const toggleText = document.getElementById('toggleText');
    const toggleEmojis = document.getElementById('toggleEmojis');
    
    if (toggleText) {
        toggleText.addEventListener('click', toggleTextVisibility);
    }
    
    if (toggleEmojis) {
        toggleEmojis.addEventListener('click', toggleEmojisVisibility);
    }
    
    // Выбор текста и мастер
    const selectTextBtn = document.getElementById('selectTextBtn');
    const wizardBtn = document.getElementById('wizardBtn');
    
    if (selectTextBtn) {
        selectTextBtn.addEventListener('click', showTextSelection);
    }
    
    if (wizardBtn) {
        wizardBtn.addEventListener('click', openWizard);
    }
    
    // Выход
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('authToken');
            localStorage.removeItem('currentUser');
            window.location.href = '/';
        });
    }
    
    // Клавиатурные сокращения
    document.addEventListener('keydown', handleKeyboardShortcuts);
}

// Обработка клавиатурных сокращений
function handleKeyboardShortcuts(event) {
    if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
        return; // Не обрабатываем, если фокус в поле ввода
    }
    
    switch (event.key) {
        case 'ArrowLeft':
            event.preventDefault();
            goToPrevious();
            break;
        case 'ArrowRight':
        case ' ': // Пробел
            event.preventDefault();
            goToNext();
            break;
        case 'h':
        case 'H':
            event.preventDefault();
            toggleTextVisibility();
            break;
        case 'e':
        case 'E':
            event.preventDefault();
            toggleEmojisVisibility();
            break;
        case 'r':
        case 'R':
            event.preventDefault();
            restartTraining();
            break;
    }
}

// Загрузка доступных текстов
async function loadAvailableTexts() {
    const textSelection = document.getElementById('textSelection');
    const trainingMode = document.getElementById('trainingMode');
    
    if (textSelection) textSelection.style.display = 'block';
    if (trainingMode) trainingMode.style.display = 'none';
    
    const trainingTexts = document.getElementById('trainingTexts');
    if (!trainingTexts) return;
    
    try {
        window.app.showLoader();
        
        const response = await window.app.apiRequest('/api/training/available');
        const texts = response.texts;
        
        if (texts.length === 0) {
            trainingTexts.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-brain" style="font-size: 4rem; color: #ccc; margin-bottom: 2rem;"></i>
                    <h3>Нет готовых текстов для тренировки</h3>
                    <p>Сначала загрузите тексты и пройдите мастер настройки</p>
                    <a href="/" class="btn btn-primary">Перейти к загрузке</a>
                </div>
            `;
            return;
        }
        
        trainingTexts.innerHTML = texts.map(text => `
            <div class="training-text-item" onclick="selectTextForTraining(${text.id})">
                <h3>${escapeHtml(text.title)}</h3>
                <div class="training-text-meta">
                    <span>Язык: ${getLanguageName(text.language)}</span>
                    <div class="training-text-stats">
                        <span><i class="fas fa-puzzle-piece"></i> ${text.fragmentCount} фрагментов</span>
                        <span><i class="fas fa-calendar"></i> ${window.app.formatDate(text.createdAt)}</span>
                    </div>
                </div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Load available texts error:', error);
        trainingTexts.innerHTML = `
            <div class="error-state">
                <i class="fas fa-exclamation-triangle" style="font-size: 4rem; color: #dc3545; margin-bottom: 2rem;"></i>
                <h3>Ошибка загрузки</h3>
                <p>${error.message || 'Не удалось загрузить тексты для тренировки'}</p>
                <button class="btn btn-primary" onclick="loadAvailableTexts()">Попробовать снова</button>
            </div>
        `;
    } finally {
        window.app.hideLoader();
    }
}

// Выбор текста для тренировки
function selectTextForTraining(textId) {
    currentTextId = textId;
    window.history.pushState({}, '', `?textId=${textId}`);
    loadTrainingText();
}

// Загрузка текста для тренировки
async function loadTrainingText() {
    if (!currentTextId) return;
    
    try {
        window.app.showLoader();
        
        const response = await window.app.apiRequest(`/api/training/text/${currentTextId}`);
        currentText = response.text;
        trainingFragments = response.fragments;
        
        // Показываем режим тренировки
        showTrainingMode();
        
        // Начинаем с первого фрагмента
        currentFragmentIndex = 0;
        displayCurrentFragment();
        
        // Показываем цепочку рассказа
        displayStoryChain();
        
    } catch (error) {
        console.error('Load training text error:', error);
        window.app.showNotification(error.message || 'Ошибка загрузки текста для тренировки', 'error');
        
        // Возвращаемся к выбору текстов
        showTextSelection();
    } finally {
        window.app.hideLoader();
    }
}

// Показать режим тренировки
function showTrainingMode() {
    const textSelection = document.getElementById('textSelection');
    const trainingMode = document.getElementById('trainingMode');
    const storyChain = document.getElementById('storyChain');
    const wizardBtn = document.getElementById('wizardBtn');
    
    if (textSelection) textSelection.style.display = 'none';
    if (trainingMode) trainingMode.style.display = 'block';
    if (storyChain) storyChain.style.display = 'block';
    if (wizardBtn) wizardBtn.style.display = 'block';
    
    // Обновляем заголовок
    const textTitle = document.getElementById('textTitle');
    if (textTitle && currentText) {
        textTitle.textContent = currentText.title;
    }
}

// Показать выбор текста
function showTextSelection() {
    const textSelection = document.getElementById('textSelection');
    const trainingMode = document.getElementById('trainingMode');
    const storyChain = document.getElementById('storyChain');
    const wizardBtn = document.getElementById('wizardBtn');
    
    if (textSelection) textSelection.style.display = 'block';
    if (trainingMode) trainingMode.style.display = 'none';
    if (storyChain) storyChain.style.display = 'none';
    if (wizardBtn) wizardBtn.style.display = 'none';
    
    // Очищаем URL
    window.history.pushState({}, '', window.location.pathname);
    
    // Загружаем список текстов
    loadAvailableTexts();
}

// Отображение цепочки рассказа
function displayStoryChain() {
    const chainLine = document.getElementById('chainLine');
    if (!chainLine) return;
    
    chainLine.innerHTML = trainingFragments.map((fragment, index) => {
        const association = fragment.emoji || fragment.customWord || '🖼️';
        const isActive = index === currentFragmentIndex;
        
        return `<div class="chain-emoji ${isActive ? 'active' : ''}" onclick="goToFragment(${index})">
            ${association}
        </div>`;
    }).join('');
}

// Отображение текущего фрагмента
function displayCurrentFragment() {
    if (currentFragmentIndex >= trainingFragments.length) {
        showTrainingComplete();
        return;
    }
    
    const fragment = trainingFragments[currentFragmentIndex];
    const nextFragment = trainingFragments[currentFragmentIndex + 1];
    
    // Обновляем номер фрагмента
    const currentNumber = document.getElementById('currentNumber');
    const totalNumber = document.getElementById('totalNumber');
    
    if (currentNumber) currentNumber.textContent = currentFragmentIndex + 1;
    if (totalNumber) totalNumber.textContent = trainingFragments.length;
    
    // Отображаем текст фрагмента
    const fragmentText = document.getElementById('fragmentText');
    if (fragmentText) {
        fragmentText.textContent = fragment.content;
        fragmentText.className = isTextHidden ? 'hidden' : '';
    }
    
    // Отображаем ассоциацию
    displayFragmentAssociation(fragment);
    
    // Отображаем подсказку следующего фрагмента
    displayNextHint(nextFragment);
    
    // Обновляем кнопки навигации
    updateNavigationButtons();
    
    // Обновляем индикатор прогресса
    updateFragmentIndicator();
    
    // Обновляем цепочку рассказа
    displayStoryChain();
    
    // Скрываем сообщение о завершении
    const trainingComplete = document.getElementById('trainingComplete');
    if (trainingComplete) trainingComplete.style.display = 'none';
}

// Отображение ассоциации фрагмента
function displayFragmentAssociation(fragment) {
    const fragmentAssociation = document.getElementById('fragmentAssociation');
    if (!fragmentAssociation) return;
    
    let content = '';
    
    if (isEmojisHidden) {
        // Показываем только номер
        content = `<div class="number-only">${currentFragmentIndex + 1}</div>`;
    } else if (fragment.emoji) {
        content = `<div class="association-emoji" onclick="openWizardForFragment()">${fragment.emoji}</div>`;
    } else if (fragment.customImage) {
        content = `<img src="${fragment.customImage}" class="association-image" onclick="openWizardForFragment()" alt="Ассоциация">`;
    } else if (fragment.customWord) {
        content = `<div class="association-word" onclick="openWizardForFragment()">${escapeHtml(fragment.customWord)}</div>`;
    } else {
        content = `<div class="number-only">${currentFragmentIndex + 1}</div>`;
    }
    
    fragmentAssociation.innerHTML = content;
}

// Отображение подсказки следующего фрагмента
function displayNextHint(nextFragment) {
    const nextHint = document.getElementById('nextHint');
    const nextAssociation = document.getElementById('nextAssociation');
    
    if (!nextHint || !nextAssociation) return;
    
    if (!nextFragment) {
        nextHint.style.display = 'none';
        return;
    }
    
    nextHint.style.display = 'block';
    
    let content = '';
    
    if (isEmojisHidden) {
        content = `<div class="number-only" style="font-size: 1.5rem; width: 50px; height: 50px;">${currentFragmentIndex + 2}</div>`;
    } else if (nextFragment.emoji) {
        content = `<div class="next-association-emoji">${nextFragment.emoji}</div>`;
    } else if (nextFragment.customImage) {
        content = `<img src="${nextFragment.customImage}" class="next-association-image" alt="Следующая ассоциация">`;
    } else if (nextFragment.customWord) {
        content = `<div class="next-association-word">${escapeHtml(nextFragment.customWord)}</div>`;
    } else {
        content = `<div class="number-only" style="font-size: 1.5rem; width: 50px; height: 50px;">${currentFragmentIndex + 2}</div>`;
    }
    
    nextAssociation.innerHTML = content;
}

// Обновление кнопок навигации
function updateNavigationButtons() {
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const restartBtn = document.getElementById('restartBtn');
    
    if (prevBtn) {
        prevBtn.disabled = currentFragmentIndex === 0;
    }
    
    if (nextBtn && restartBtn) {
        if (currentFragmentIndex >= trainingFragments.length - 1) {
            nextBtn.style.display = 'none';
            restartBtn.style.display = 'block';
        } else {
            nextBtn.style.display = 'block';
            restartBtn.style.display = 'none';
        }
    }
}

// Обновление индикатора прогресса
function updateFragmentIndicator() {
    const fragmentIndicator = document.getElementById('fragmentIndicator');
    if (!fragmentIndicator) return;
    
    const dots = trainingFragments.map((_, index) => {
        let className = 'fragment-dot';
        if (index < currentFragmentIndex) {
            className += ' completed';
        } else if (index === currentFragmentIndex) {
            className += ' active';
        }
        
        return `<div class="${className}" onclick="goToFragment(${index})"></div>`;
    }).join('');
    
    fragmentIndicator.innerHTML = dots;
}

// Навигация
function goToPrevious() {
    if (currentFragmentIndex > 0) {
        currentFragmentIndex--;
        displayCurrentFragment();
        
        // Анимация
        const currentFragment = document.querySelector('.current-fragment');
        if (currentFragment) {
            currentFragment.classList.add('slide-in-left');
            setTimeout(() => {
                currentFragment.classList.remove('slide-in-left');
            }, 500);
        }
    }
}

function goToNext() {
    if (currentFragmentIndex < trainingFragments.length - 1) {
        currentFragmentIndex++;
        displayCurrentFragment();
        
        // Анимация
        const currentFragment = document.querySelector('.current-fragment');
        if (currentFragment) {
            currentFragment.classList.add('slide-in-right');
            setTimeout(() => {
                currentFragment.classList.remove('slide-in-right');
            }, 500);
        }
    } else {
        showTrainingComplete();
    }
}

function goToFragment(index) {
    if (index >= 0 && index < trainingFragments.length) {
        currentFragmentIndex = index;
        displayCurrentFragment();
    }
}

function restartTraining() {
    currentFragmentIndex = 0;
    displayCurrentFragment();
    
    window.app.showNotification('Тренировка начата сначала', 'info');
}

// Показать завершение тренировки
function showTrainingComplete() {
    const trainingComplete = document.getElementById('trainingComplete');
    if (trainingComplete) {
        trainingComplete.style.display = 'block';
    }
    
    // Обновляем кнопки
    updateNavigationButtons();
    
    // Анимация
    const completeMessage = document.querySelector('.complete-message');
    if (completeMessage) {
        completeMessage.classList.add('bounce');
        setTimeout(() => {
            completeMessage.classList.remove('bounce');
        }, 1000);
    }
}

// Управление видимостью
function toggleTextVisibility() {
    isTextHidden = !isTextHidden;
    
    const toggleText = document.getElementById('toggleText');
    if (toggleText) {
        const span = toggleText.querySelector('span');
        if (span) {
            span.textContent = isTextHidden ? 'Показать текст' : 'Скрыть текст';
        }
        toggleText.classList.toggle('active', isTextHidden);
    }
    
    displayCurrentFragment();
}

function toggleEmojisVisibility() {
    isEmojisHidden = !isEmojisHidden;
    
    const toggleEmojis = document.getElementById('toggleEmojis');
    if (toggleEmojis) {
        const span = toggleEmojis.querySelector('span');
        if (span) {
            span.textContent = isEmojisHidden ? 'Показать смайлики' : 'Скрыть смайлики';
        }
        toggleEmojis.classList.toggle('active', isEmojisHidden);
    }
    
    displayCurrentFragment();
}

// Открыть мастер
function openWizard() {
    if (currentTextId) {
        window.location.href = `/wizard.html?textId=${currentTextId}`;
    }
}

// Открыть мастер для конкретного фрагмента
function openWizardForFragment() {
    if (currentTextId) {
        window.location.href = `/wizard.html?textId=${currentTextId}&step=3&fragment=${currentFragmentIndex}`;
    }
}

// Утилитарные функции

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function getLanguageName(langCode) {
    const languages = {
        'ru': 'Русский',
        'en': 'English',
        'de': 'Deutsch'
    };
    return languages[langCode] || langCode;
}