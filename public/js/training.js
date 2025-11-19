// JavaScript для режима тренировки

let currentTextId = null;
let currentText = null;
let trainingFragments = [];
let currentFragmentIndex = 0;
let isTextHidden = false;
let isEmojisHidden = false;
let isTimerHidden = false;

// Секундомер
let timerInterval = null;
let startTime = null;
let elapsedSeconds = 0;
let isTimerRunning = false;

// Введённые пользователем фразы
let userInputs = [];

// Защита от race condition при навигации (BUG-015)
let isNavigating = false;

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
    const toggleTimer = document.getElementById('toggleTimer');
    
    if (toggleText) {
        toggleText.addEventListener('click', toggleTextVisibility);
    }
    
    if (toggleEmojis) {
        toggleEmojis.addEventListener('click', toggleEmojisVisibility);
    }
    
    if (toggleTimer) {
        toggleTimer.addEventListener('click', toggleTimerVisibility);
    }
    
    // Секундомер
    const stopTimerBtn = document.getElementById('stopTimerBtn');
    if (stopTimerBtn) {
        stopTimerBtn.addEventListener('click', stopTimer);
    }
    
    // Кнопка начала тренировки
    const startTrainingBtn = document.getElementById('startTrainingBtn');
    if (startTrainingBtn) {
        startTrainingBtn.addEventListener('click', startTraining);
    }
    
    // Кнопка завершения тренировки
    const finishBtn = document.getElementById('finishBtn');
    if (finishBtn) {
        finishBtn.addEventListener('click', () => {
            // Проверяем, нужно ли повторить сохранение
            if (finishBtn.dataset.retry === 'true') {
                retryFinishTraining();
            } else {
                finishTraining();
            }
        });
    }
    
    // Кнопка продолжения (для слайда с вводом)
    const continueBtn = document.getElementById('continueBtn');
    if (continueBtn) {
        continueBtn.addEventListener('click', continueFromInput);
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
    // Если фокус в поле ввода, обрабатываем только пробел для завершения тренировки
    if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
        // На последнем слайде пробел завершает тренировку
        if (event.key === ' ' && currentFragmentIndex >= trainingFragments.length - 1) {
            event.preventDefault();
            finishTraining();
        }
        return;
    }
    
    switch (event.key) {
        case 'ArrowLeft':
            event.preventDefault();
            goToPrevious();
            break;
        case 'ArrowRight':
            event.preventDefault();
            goToNext();
            break;
        case ' ': // Пробел
            event.preventDefault();
            // На последнем слайде завершаем тренировку, иначе следующий слайд
            if (currentFragmentIndex >= trainingFragments.length - 1) {
                finishTraining();
            } else {
                goToNext();
            }
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
        
        // Очищаем содержимое
        trainingTexts.innerHTML = '';
        
        // Создаём элементы безопасно
        texts.forEach(text => {
            const item = document.createElement('div');
            item.className = 'training-text-item';
            item.addEventListener('click', () => selectTextForTraining(text.id));
            
            const title = document.createElement('h3');
            title.textContent = text.title;
            
            const meta = document.createElement('div');
            meta.className = 'training-text-meta';
            
            const langSpan = document.createElement('span');
            langSpan.textContent = `Язык: ${getLanguageName(text.language)}`;
            
            const stats = document.createElement('div');
            stats.className = 'training-text-stats';
            
            const fragmentSpan = document.createElement('span');
            const fragmentIcon = document.createElement('i');
            fragmentIcon.className = 'fas fa-puzzle-piece';
            fragmentSpan.appendChild(fragmentIcon);
            fragmentSpan.appendChild(document.createTextNode(` ${text.fragmentCount} фрагментов`));
            
            const dateSpan = document.createElement('span');
            const dateIcon = document.createElement('i');
            dateIcon.className = 'fas fa-calendar';
            dateSpan.appendChild(dateIcon);
            dateSpan.appendChild(document.createTextNode(` ${window.app.formatDate(text.createdAt)}`));
            
            stats.appendChild(fragmentSpan);
            stats.appendChild(dateSpan);
            
            meta.appendChild(langSpan);
            meta.appendChild(stats);
            
            item.appendChild(title);
            item.appendChild(meta);
            
            trainingTexts.appendChild(item);
        });
        
    } catch (error) {
        console.error('Load available texts error:', error);
        
        // Очищаем содержимое
        trainingTexts.innerHTML = '';
        
        // Создаём элементы ошибки безопасно
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-state';
        
        const icon = document.createElement('i');
        icon.className = 'fas fa-exclamation-triangle';
        icon.style.fontSize = '4rem';
        icon.style.color = '#dc3545';
        icon.style.marginBottom = '2rem';
        
        const heading = document.createElement('h3');
        heading.textContent = 'Ошибка загрузки';
        
        const message = document.createElement('p');
        message.textContent = error.message || 'Не удалось загрузить тексты для тренировки';
        
        const retryBtn = document.createElement('button');
        retryBtn.className = 'btn btn-primary';
        retryBtn.textContent = 'Попробовать снова';
        retryBtn.addEventListener('click', loadAvailableTexts);
        
        errorDiv.appendChild(icon);
        errorDiv.appendChild(heading);
        errorDiv.appendChild(message);
        errorDiv.appendChild(retryBtn);
        
        trainingTexts.appendChild(errorDiv);
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

// Очистка предыдущей тренировки (BUG-014: Утечка памяти)
function cleanupTraining() {
    // Останавливаем таймер
    stopTimer();
    resetTimer();
    
    // Очищаем состояние
    userInputs = [];
    currentFragmentIndex = 0;
    currentText = null;
    trainingFragments = [];
}

// Загрузка текста для тренировки
async function loadTrainingText() {
    if (!currentTextId) return;
    
    // Очищаем предыдущую тренировку (BUG-014)
    cleanupTraining();
    
    try {
        window.app.showLoader();
        
        const response = await window.app.apiRequest(`/api/training/text/${currentTextId}`);
        currentText = response.text;
        trainingFragments = response.fragments;
        
        // Проверка на пустой массив фрагментов (BUG-018)
        if (trainingFragments.length === 0) {
            window.app.showNotification('Текст не содержит фрагментов для тренировки', 'error');
            showTextSelection();
            return;
        }
        
        // Инициализируем массив введённых фраз
        userInputs = new Array(trainingFragments.length).fill('');
        
        // Показываем страницу перед тренировкой
        showTrainingStart();
        
    } catch (error) {
        console.error('Load training text error:', error);
        window.app.showNotification(error.message || 'Ошибка загрузки текста для тренировки', 'error');
        
        // Возвращаемся к выбору текстов
        showTextSelection();
    } finally {
        window.app.hideLoader();
    }
}

// Показать страницу перед тренировкой
function showTrainingStart() {
    const textSelection = document.getElementById('textSelection');
    const trainingStart = document.getElementById('trainingStart');
    const trainingMode = document.getElementById('trainingMode');
    const storyChain = document.getElementById('storyChain');
    const wizardBtn = document.getElementById('wizardBtn');
    
    if (textSelection) textSelection.style.display = 'none';
    if (trainingStart) trainingStart.style.display = 'block';
    if (trainingMode) trainingMode.style.display = 'none';
    if (storyChain) storyChain.style.display = 'none';
    if (wizardBtn) wizardBtn.style.display = 'none';
    
    // Обновляем заголовок
    const startTextTitle = document.getElementById('startTextTitle');
    if (startTextTitle && currentText) {
        startTextTitle.textContent = currentText.title;
    }
    
    // Сбрасываем секундомер
    resetTimer();
    updateTimerDisplay();
}

// Показать слайд с вводом
function showInputSlide() {
    currentFragmentIndex = -1; // Специальный индекс для слайда ввода
    
    const fragmentText = document.getElementById('fragmentText');
    const userInputText = document.getElementById('userInputText');
    const fragmentInputContainer = document.getElementById('fragmentInputContainer');
    const fragmentAssociation = document.getElementById('fragmentAssociation');
    const nextBtn = document.getElementById('nextBtn');
    const continueBtn = document.getElementById('continueBtn');
    const prevBtn = document.getElementById('prevBtn');
    const nextHint = document.getElementById('nextHint');
    
    // Скрываем текст фрагмента и введённый текст
    if (fragmentText) {
        fragmentText.style.display = 'none';
    }
    if (userInputText) {
        userInputText.style.display = 'none';
    }
    
    // Показываем поле ввода
    if (fragmentInputContainer) {
        fragmentInputContainer.style.display = 'block';
        const fragmentInput = document.getElementById('fragmentInput');
        if (fragmentInput) {
            fragmentInput.value = '';
            fragmentInput.placeholder = 'Введите фразу первого слайда по памяти...';
            fragmentInput.focus();
        }
    }
    
    // Показываем ассоциацию первого фрагмента для запоминания
    if (fragmentAssociation && trainingFragments.length > 0) {
        fragmentAssociation.style.display = 'block';
        // Отображаем ассоциацию первого фрагмента (индекс 0)
        displayFragmentAssociation(trainingFragments[0], 0);
    }
    
    // Скрываем подсказку следующего фрагмента (на слайде ввода она не нужна)
    if (nextHint) {
        nextHint.style.display = 'none';
    }
    
    // Показываем кнопку продолжения, скрываем остальные
    if (continueBtn) {
        continueBtn.style.display = 'block';
    }
    if (nextBtn) {
        nextBtn.style.display = 'none';
    }
    if (prevBtn) {
        prevBtn.disabled = true;
    }
    
    // Обновляем номер фрагмента
    const currentNumber = document.getElementById('currentNumber');
    const totalNumber = document.getElementById('totalNumber');
    if (currentNumber) currentNumber.textContent = '0';
    if (totalNumber) totalNumber.textContent = trainingFragments.length;
    
    // Обновляем индикатор прогресса
    updateFragmentIndicator();
}

// Продолжить после ввода
function continueFromInput() {
    const fragmentInput = document.getElementById('fragmentInput');
    if (fragmentInput) {
        // Сохраняем введённую фразу для первого фрагмента
        userInputs[0] = fragmentInput.value.trim();
    }
    
    // Переходим к первому фрагменту
    currentFragmentIndex = 0;
    displayCurrentFragment();
    
    // Показываем цепочку рассказа
    displayStoryChain();
}

// Начать тренировку
function startTraining() {
    // Запускаем секундомер
    startTimer();
    
    // Показываем режим тренировки
    showTrainingMode();
    
    // Показываем цепочку рассказа в хэдере
    displayStoryChain();
    
    // Показываем слайд с вводом первого фрагмента
    showInputSlide();
}

// Показать режим тренировки
function showTrainingMode() {
    const textSelection = document.getElementById('textSelection');
    const trainingStart = document.getElementById('trainingStart');
    const trainingMode = document.getElementById('trainingMode');
    const storyChain = document.getElementById('storyChain');
    const wizardBtn = document.getElementById('wizardBtn');
    
    if (textSelection) textSelection.style.display = 'none';
    if (trainingStart) trainingStart.style.display = 'none';
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
    
    // Очищаем содержимое
    chainLine.innerHTML = '';
    
    trainingFragments.forEach((fragment, index) => {
        const div = document.createElement('div');
        div.className = `chain-emoji ${index === currentFragmentIndex ? 'active' : ''}`;
        
        // Безопасное отображение ассоциации
        // Используем textContent напрямую - это безопасно и поддерживает все emoji
        if (fragment.emoji) {
            div.textContent = fragment.emoji;
        } else if (fragment.customWord) {
            div.textContent = fragment.customWord;
        } else {
            div.textContent = '🖼️';
        }
        
        // Безопасная установка обработчика события
        div.addEventListener('click', () => goToFragment(index));
        chainLine.appendChild(div);
    });
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
        fragmentText.style.display = 'block';
    }
    
    // Отображаем введённую пользователем фразу
    const userInputText = document.getElementById('userInputText');
    if (userInputText) {
        const userInput = userInputs[currentFragmentIndex];
        if (userInput) {
            userInputText.textContent = userInput;
            userInputText.style.display = 'block';
        } else {
            userInputText.style.display = 'none';
        }
    }
    
    // Показываем поле ввода для следующего фрагмента (если не последний)
    const fragmentInputContainer = document.getElementById('fragmentInputContainer');
    if (fragmentInputContainer) {
        if (currentFragmentIndex < trainingFragments.length - 1) {
            fragmentInputContainer.style.display = 'block';
            const fragmentInput = document.getElementById('fragmentInput');
            if (fragmentInput) {
                fragmentInput.value = '';
                fragmentInput.placeholder = 'Введите фразу следующего слайда по памяти...';
            }
        } else {
            fragmentInputContainer.style.display = 'none';
        }
    }
    
    // Отображаем ассоциацию
    const fragmentAssociation = document.getElementById('fragmentAssociation');
    if (fragmentAssociation) {
        fragmentAssociation.style.display = 'block';
    }
    displayFragmentAssociation(fragment);
    
    // Отображаем подсказку следующего фрагмента
    const nextHint = document.getElementById('nextHint');
    if (nextHint) {
        nextHint.style.display = 'block';
    }
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
function displayFragmentAssociation(fragment, fragmentIndex = null) {
    const fragmentAssociation = document.getElementById('fragmentAssociation');
    if (!fragmentAssociation) return;
    
    // Используем переданный индекс или текущий
    const displayIndex = fragmentIndex !== null ? fragmentIndex : currentFragmentIndex;
    
    // Очищаем содержимое
    fragmentAssociation.innerHTML = '';
    
    if (isEmojisHidden) {
        // Показываем только номер
        const div = document.createElement('div');
        div.className = 'number-only';
        div.textContent = displayIndex >= 0 ? displayIndex + 1 : 1;
        fragmentAssociation.appendChild(div);
    } else if (fragment.emoji) {
        // Безопасное отображение emoji через textContent
        const div = document.createElement('div');
        div.className = 'association-emoji';
        div.textContent = fragment.emoji; // textContent безопасен и поддерживает все emoji
        div.addEventListener('click', openWizardForFragment);
        fragmentAssociation.appendChild(div);
    } else if (fragment.customImage) {
        // Валидация URL изображения
        try {
            const urlObj = new URL(fragment.customImage);
            if (['http:', 'https:'].includes(urlObj.protocol)) {
                const img = document.createElement('img');
                img.src = fragment.customImage;
                img.className = 'association-image';
                img.alt = 'Ассоциация';
                img.addEventListener('click', openWizardForFragment);
                fragmentAssociation.appendChild(img);
            } else {
                // Недопустимый протокол - показываем номер
                const div = document.createElement('div');
                div.className = 'number-only';
                div.textContent = displayIndex >= 0 ? displayIndex + 1 : 1;
                fragmentAssociation.appendChild(div);
            }
        } catch {
            // Некорректный URL - показываем номер
            const div = document.createElement('div');
            div.className = 'number-only';
            div.textContent = displayIndex >= 0 ? displayIndex + 1 : 1;
            fragmentAssociation.appendChild(div);
        }
    } else if (fragment.customWord) {
        const div = document.createElement('div');
        div.className = 'association-word';
        div.textContent = fragment.customWord; // textContent автоматически экранирует
        div.addEventListener('click', openWizardForFragment);
        fragmentAssociation.appendChild(div);
    } else {
        const div = document.createElement('div');
        div.className = 'number-only';
        div.textContent = displayIndex >= 0 ? displayIndex + 1 : 1;
        fragmentAssociation.appendChild(div);
    }
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
    
    // Очищаем содержимое
    nextAssociation.innerHTML = '';
    
    if (isEmojisHidden) {
        const div = document.createElement('div');
        div.className = 'number-only';
        div.style.fontSize = '1.5rem';
        div.style.width = '50px';
        div.style.height = '50px';
        div.textContent = currentFragmentIndex + 2;
        nextAssociation.appendChild(div);
    } else if (nextFragment.emoji) {
        // Безопасное отображение emoji через textContent
        const div = document.createElement('div');
        div.className = 'next-association-emoji';
        div.textContent = nextFragment.emoji; // textContent безопасен и поддерживает все emoji
        nextAssociation.appendChild(div);
    } else if (nextFragment.customImage) {
        // Валидация URL изображения
        try {
            const urlObj = new URL(nextFragment.customImage);
            if (['http:', 'https:'].includes(urlObj.protocol)) {
                const img = document.createElement('img');
                img.src = nextFragment.customImage;
                img.className = 'next-association-image';
                img.alt = 'Следующая ассоциация';
                nextAssociation.appendChild(img);
            } else {
                // Недопустимый протокол - показываем номер
                const div = document.createElement('div');
                div.className = 'number-only';
                div.style.fontSize = '1.5rem';
                div.style.width = '50px';
                div.style.height = '50px';
                div.textContent = currentFragmentIndex + 2;
                nextAssociation.appendChild(div);
            }
        } catch {
            // Некорректный URL - показываем номер
            const div = document.createElement('div');
            div.className = 'number-only';
            div.style.fontSize = '1.5rem';
            div.style.width = '50px';
            div.style.height = '50px';
            div.textContent = currentFragmentIndex + 2;
            nextAssociation.appendChild(div);
        }
    } else if (nextFragment.customWord) {
        const div = document.createElement('div');
        div.className = 'next-association-word';
        div.textContent = nextFragment.customWord; // textContent автоматически экранирует
        nextAssociation.appendChild(div);
    } else {
        const div = document.createElement('div');
        div.className = 'number-only';
        div.style.fontSize = '1.5rem';
        div.style.width = '50px';
        div.style.height = '50px';
        div.textContent = currentFragmentIndex + 2;
        nextAssociation.appendChild(div);
    }
}

// Обновление кнопок навигации
function updateNavigationButtons() {
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const continueBtn = document.getElementById('continueBtn');
    const restartBtn = document.getElementById('restartBtn');
    const finishBtn = document.getElementById('finishBtn');
    
    if (prevBtn) {
        prevBtn.disabled = currentFragmentIndex <= 0;
    }
    
    if (nextBtn && continueBtn && restartBtn && finishBtn) {
        if (currentFragmentIndex >= trainingFragments.length - 1) {
            nextBtn.style.display = 'none';
            continueBtn.style.display = 'none';
            restartBtn.style.display = 'none';
            finishBtn.style.display = 'block';
        } else {
            nextBtn.style.display = 'block';
            continueBtn.style.display = 'none';
            restartBtn.style.display = 'none';
            finishBtn.style.display = 'none';
        }
    }
}

// Обновление индикатора прогресса
function updateFragmentIndicator() {
    const fragmentIndicator = document.getElementById('fragmentIndicator');
    if (!fragmentIndicator) return;
    
    // Специальная обработка для слайда ввода
    if (currentFragmentIndex === -1) {
        fragmentIndicator.innerHTML = '';
        trainingFragments.forEach(() => {
            const dot = document.createElement('div');
            dot.className = 'fragment-dot';
            fragmentIndicator.appendChild(dot);
        });
        return;
    }
    
    // Очищаем содержимое
    fragmentIndicator.innerHTML = '';
    
    trainingFragments.forEach((_, index) => {
        const dot = document.createElement('div');
        let className = 'fragment-dot';
        if (index < currentFragmentIndex) {
            className += ' completed';
        } else if (index === currentFragmentIndex) {
            className += ' active';
        }
        dot.className = className;
        // Безопасная установка обработчика события
        dot.addEventListener('click', () => goToFragment(index));
        fragmentIndicator.appendChild(dot);
    });
}

// Навигация
function goToPrevious() {
    // Защита от race condition (BUG-015)
    if (isNavigating) {
        console.warn('Navigation already in progress');
        return;
    }
    
    isNavigating = true;
    
    try {
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
        } else if (currentFragmentIndex === 0) {
            // Возвращаемся к слайду ввода
            showInputSlide();
        }
    } finally {
        setTimeout(() => {
            isNavigating = false;
        }, 100);
    }
}

function goToNext() {
    // Защита от race condition (BUG-015)
    if (isNavigating) {
        console.warn('Navigation already in progress');
        return;
    }
    
    isNavigating = true;
    
    try {
        // Сохраняем введённую фразу ДО проверки индекса
        const fragmentInput = document.getElementById('fragmentInput');
        if (fragmentInput && fragmentInput.value.trim()) {
            // Сохраняем для следующего фрагмента (может быть последним)
            const nextIndex = currentFragmentIndex + 1;
            if (nextIndex < trainingFragments.length) {
                userInputs[nextIndex] = fragmentInput.value.trim();
            }
        }
        
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
    } finally {
        // Снимаем блокировку после небольшой задержки
        setTimeout(() => {
            isNavigating = false;
        }, 100);
    }
}

function goToFragment(index) {
    // Защита от race condition (BUG-015)
    if (isNavigating) {
        console.warn('Navigation already in progress');
        return;
    }
    
    if (index >= 0 && index < trainingFragments.length) {
        isNavigating = true;
        try {
            currentFragmentIndex = index;
            displayCurrentFragment();
        } finally {
            setTimeout(() => {
                isNavigating = false;
            }, 100);
        }
    }
}

function restartTraining() {
    // Очищаем тренировку (BUG-014)
    cleanupTraining();
    
    // Возвращаемся на страницу перед тренировкой
    showTrainingStart();
    
    window.app.showNotification('Тренировка сброшена', 'info');
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

function toggleTimerVisibility() {
    isTimerHidden = !isTimerHidden;
    
    const toggleTimer = document.getElementById('toggleTimer');
    const timerDisplaySmall = document.getElementById('timerDisplaySmall');
    
    if (toggleTimer) {
        const span = toggleTimer.querySelector('span');
        if (span) {
            span.textContent = isTimerHidden ? 'Показать секундомер' : 'Скрыть секундомер';
        }
        toggleTimer.classList.toggle('active', isTimerHidden);
    }
    
    if (timerDisplaySmall) {
        timerDisplaySmall.style.display = isTimerHidden ? 'none' : 'flex';
    }
}

// Функции секундомера
function startTimer() {
    if (isTimerRunning) return;
    
    isTimerRunning = true;
    startTime = Date.now() - (elapsedSeconds * 1000);
    
    timerInterval = setInterval(() => {
        elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
        updateTimerDisplay();
    }, 100);
}

function stopTimer() {
    if (!isTimerRunning) return;
    
    isTimerRunning = false;
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

function resetTimer() {
    stopTimer();
    elapsedSeconds = 0;
    startTime = null;
    updateTimerDisplay();
}

function updateTimerDisplay() {
    const minutes = Math.floor(elapsedSeconds / 60);
    const seconds = elapsedSeconds % 60;
    const timeString = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    
    const timerValue = document.getElementById('timerValue');
    if (timerValue) {
        timerValue.textContent = timeString;
    }
    
    const timerValueSmall = document.getElementById('timerValueSmall');
    if (timerValueSmall) {
        timerValueSmall.textContent = timeString;
    }
}

// Защита от повторных запросов
let isFinishing = false;

// Завершить тренировку
async function finishTraining() {
    // Защита от повторных вызовов
    if (isFinishing) {
        console.warn('Training finish already in progress');
        return;
    }
    
    isFinishing = true;
    
    // Блокируем кнопку
    const finishBtn = document.getElementById('finishBtn');
    if (finishBtn) {
        finishBtn.disabled = true;
        finishBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Сохранение...';
    }
    
    // Обновляем elapsedSeconds перед остановкой таймера (вычисляем актуальное время)
    if (isTimerRunning && startTime) {
        elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
        updateTimerDisplay(); // Обновляем отображение с актуальным временем
    }
    
    // Останавливаем таймер СРАЗУ при нажатии кнопки
    stopTimer();
    
    // Сохраняем в localStorage перед отправкой
    const sessionData = {
        textId: currentTextId,
        durationSeconds: elapsedSeconds,
        timestamp: Date.now(),
        userInputs: userInputs
    };
    localStorage.setItem('pendingTrainingSession', JSON.stringify(sessionData));
    
    try {
        window.app.showLoader();
        
        // Сохраняем время тренировки в БД
        await window.app.apiRequest('/api/training/session', {
            method: 'POST',
            body: JSON.stringify({
                textId: currentTextId,
                durationSeconds: elapsedSeconds
            })
        });
        
        // Удаляем из localStorage только после успеха
        localStorage.removeItem('pendingTrainingSession');
        
        window.app.showNotification('Тренировка завершена! Время сохранено.', 'success');
        
        // Показываем сообщение о завершении
        showTrainingComplete();
        
        // Меняем текст заголовка
        const completeTitle = document.getElementById('completeTitle');
        if (completeTitle) {
            completeTitle.textContent = 'Тренировка завершена';
            completeTitle.dataset.completed = 'true';
        }
        
        // Показываем кнопку "В начало" вместо "Завершить тренировку"
        const restartBtn = document.getElementById('restartBtn');
        if (finishBtn) {
            finishBtn.style.display = 'none';
        }
        if (restartBtn) {
            restartBtn.style.display = 'block';
        }
        
    } catch (error) {
        console.error('Finish training error:', error);
        // При ошибке таймер уже остановлен, но нужно разблокировать кнопку для повтора
        // Разблокируем кнопку для возможности повтора
        isFinishing = false;
        if (finishBtn) {
            finishBtn.disabled = false;
            finishBtn.innerHTML = '<i class="fas fa-redo"></i> Повторить сохранение';
            finishBtn.dataset.retry = 'true';
        }
        window.app.showNotification(error.message || 'Ошибка сохранения времени тренировки. Нажмите "Повторить сохранение"', 'error');
    } finally {
        window.app.hideLoader();
    }
}

// Повторить сохранение тренировки
async function retryFinishTraining() {
    const finishBtn = document.getElementById('finishBtn');
    
    // Восстанавливаем данные из localStorage если есть
    const pendingData = localStorage.getItem('pendingTrainingSession');
    if (pendingData) {
        try {
            const sessionData = JSON.parse(pendingData);
            // Обновляем elapsedSeconds если прошло время
            if (isTimerRunning && startTime) {
                elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
            }
        } catch (error) {
            console.error('Error parsing pending session data:', error);
        }
    }
    
    // Сбрасываем флаг retry
    if (finishBtn) {
        finishBtn.dataset.retry = 'false';
    }
    
    // Вызываем finishTraining снова
    await finishTraining();
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