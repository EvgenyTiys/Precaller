// JavaScript для мастера запоминания

let currentTextId = null;
let currentText = null;
let currentFragments = [];
let currentFragmentIndex = 0;
let textFragments = []; // Фрагменты, созданные пользователем
let allEmojis = [];
let emojiCategories = [];
let currentCategory = 'people';
let searchTimeout = null;
let activeEmojiPosition = -1; // -1 означает новую позицию, >= 0 означает редактирование существующей

document.addEventListener('DOMContentLoaded', function() {
    initializeWizard();
});

function initializeWizard() {
    // Получаем ID текста из URL
    const urlParams = new URLSearchParams(window.location.search);
    currentTextId = urlParams.get('textId');
    
    if (!currentTextId) {
        window.app.showNotification('Не указан ID текста', 'error');
        window.location.href = '/';
        return;
    }
    
    // Проверяем аутентификацию
    checkAuthentication();
    
    // Инициализируем обработчики
    initializeWizardHandlers();
    
    // Загружаем данные текста
    loadTextData();
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

function initializeWizardHandlers() {
    // Шаг 1: Сохранение маршрута
    const saveRoute = document.getElementById('saveRoute');
    if (saveRoute) {
        saveRoute.addEventListener('click', handleSaveRoute);
    }
    
    // Шаг 2: Навигация
    const backToStep1 = document.getElementById('backToStep1');
    const proceedToStep3 = document.getElementById('proceedToStep3');
    const undoLastFragmentBtn = document.getElementById('undoLastFragment');
    
    if (backToStep1) {
        backToStep1.addEventListener('click', () => showStep(1));
    }
    
    if (proceedToStep3) {
        proceedToStep3.addEventListener('click', () => {
            if (textFragments.length > 0) {
                saveFragments().then(() => showStep(3));
            }
        });
    }

    if (undoLastFragmentBtn) {
        undoLastFragmentBtn.addEventListener('click', () => {
            undoLastFragment();
        });
        updateUndoButtonState();
    }
    
    // Шаг 3: Навигация
    const backToStep2 = document.getElementById('backToStep2');
    const finishWizard = document.getElementById('finishWizard');
    
    if (backToStep2) {
        backToStep2.addEventListener('click', () => showStep(2));
    }
    
    if (finishWizard) {
        finishWizard.addEventListener('click', handleFinishWizard);
    }

    // Редактирование текущего фрагмента (Шаг 3)
    const editFragmentBtn = document.getElementById('editFragmentBtn');
    const saveFragmentEdit = document.getElementById('saveFragmentEdit');
    const cancelFragmentEdit = document.getElementById('cancelFragmentEdit');
    const fragmentEditArea = document.getElementById('fragmentEditArea');
    const currentFragmentEdit = document.getElementById('currentFragmentEdit');
    const currentFragmentText = document.getElementById('currentFragmentText');

    if (editFragmentBtn && currentFragmentEdit && fragmentEditArea && currentFragmentText) {
        editFragmentBtn.addEventListener('click', () => {
            const fragment = currentFragments[currentFragmentIndex];
            fragmentEditArea.value = fragment ? fragment.content : '';
            currentFragmentText.style.display = 'none';
            currentFragmentEdit.style.display = 'block';
            fragmentEditArea.focus();
        });
    }

    if (cancelFragmentEdit && currentFragmentEdit && currentFragmentText) {
        cancelFragmentEdit.addEventListener('click', () => {
            currentFragmentEdit.style.display = 'none';
            currentFragmentText.style.display = 'block';
        });
    }

    if (saveFragmentEdit && fragmentEditArea) {
        saveFragmentEdit.addEventListener('click', async () => {
            await saveCurrentFragmentEdit(fragmentEditArea.value);
        });
        fragmentEditArea.addEventListener('keydown', async (e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey || !e.shiftKey)) {
                e.preventDefault();
                await saveCurrentFragmentEdit(fragmentEditArea.value);
            }
        });
    }
    
    // Кнопка "Другое"
    const showAllEmojis = document.getElementById('showAllEmojis');
    if (showAllEmojis) {
        showAllEmojis.addEventListener('click', showCustomAssociation);
    }
    
    // Подтверждение пользовательской ассоциации
    const confirmCustom = document.getElementById('confirmCustom');
    if (confirmCustom) {
        confirmCustom.addEventListener('click', handleCustomAssociation);
    }
    
    // Переключение вкладок
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('tab-btn')) {
            switchTab(e.target.dataset.tab);
        }
    });
    
    // Обработка вставки изображения
    document.addEventListener('paste', handleImagePaste);
    
    // Обработка поиска эмодзи
    const emojiSearch = document.getElementById('emojiSearch');
    if (emojiSearch) {
        emojiSearch.addEventListener('input', handleEmojiSearch);
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
}

// Загрузка данных текста
async function loadTextData() {
    try {
        window.app.showLoader();
        
        const response = await window.app.apiRequest(`/api/wizard/text/${currentTextId}`);
        currentText = response.text;
        currentFragments = response.fragments || [];
        
        // Определяем с какого шага начать
        if (!response.route) {
            showStep(1);
        } else if (currentFragments.length === 0) {
            showStep(2);
        } else {
            showStep(3);
            // Добавляем вызов initializeStep3() для случая, когда фрагменты уже существуют
            // Но сначала убеждаемся, что фрагменты правильно загружены
            if (currentFragments.length > 0) {
                initializeStep3();
            } else {
                // Если фрагменты не загружены, попробуем загрузить их заново
                console.log('No fragments found, reloading...');
                loadTextData();
            }
        }
        
        // Заполняем данные в формы
        populateTextData();
        
    } catch (error) {
        console.error('Load text data error:', error);
        window.app.showNotification(error.message || 'Ошибка загрузки данных', 'error');
        window.location.href = '/';
    } finally {
        window.app.hideLoader();
    }
}

// Заполнение данных текста в формы
function populateTextData() {
    // Шаг 2: Заполняем текст для разбиения на фрагменты
    const textContent = document.getElementById('textContent');
    if (textContent && currentText) {
        textContent.textContent = currentText.content;
        initializeTextSelection();
    }
}

// Показать определенный шаг
function showStep(stepNumber) {
    // Скрываем все шаги
    for (let i = 1; i <= 3; i++) {
        const step = document.getElementById(`wizardStep${i}`);
        const stepIndicator = document.getElementById(`step${i}`);
        
        if (step) {
            step.style.display = 'none';
        }
        
        if (stepIndicator) {
            stepIndicator.classList.remove('active', 'completed');
        }
    }
    
    // Показываем нужный шаг
    const currentStep = document.getElementById(`wizardStep${stepNumber}`);
    const currentStepIndicator = document.getElementById(`step${stepNumber}`);
    
    if (currentStep) {
        currentStep.style.display = 'block';
        currentStep.classList.add('fade-in');
    }
    
    if (currentStepIndicator) {
        currentStepIndicator.classList.add('active');
    }
    
    // Отмечаем предыдущие шаги как завершенные
    for (let i = 1; i < stepNumber; i++) {
        const stepIndicator = document.getElementById(`step${i}`);
        if (stepIndicator) {
            stepIndicator.classList.add('completed');
        }
    }
    
    // Специфичная инициализация для каждого шага
    if (stepNumber === 2) {
        initializeTextSelection();
    } else if (stepNumber === 3) {
        initializeStep3();
    }
}

// Обработка сохранения маршрута (Шаг 1)
async function handleSaveRoute() {
    try {
        window.app.showLoader();
        
        // Создаем пустое описание маршрута, так как пользователь представляет его в голове
        await window.app.apiRequest('/api/wizard/route', {
            method: 'POST',
            body: JSON.stringify({
                textId: currentTextId,
                routeDescription: 'Маршрут представлен в голове пользователя'
            })
        });
        
        window.app.showNotification('Переходим к разбиению на фрагменты!', 'success');
        showStep(2);
        
    } catch (error) {
        console.error('Save route error:', error);
        window.app.showNotification(error.message || 'Ошибка сохранения маршрута', 'error');
    } finally {
        window.app.hideLoader();
    }
}

// Инициализация выделения текста (Шаг 2)
function initializeTextSelection() {
    const textContent = document.getElementById('textContent');
    if (!textContent) return;
    
    // Если уже есть фрагменты, показываем их
    if (currentFragments.length > 0) {
        displayExistingFragments();
        return;
    }
    
    // Инициализируем автоматическое разбиение по знакам препинания
    initializePunctuationSplitting();
    
    updateFragmentInfo();
}

// Инициализация автоматического разбиения по знакам препинания
function initializePunctuationSplitting() {
    const textContent = document.getElementById('textContent');
    const fullText = currentText.content;
    
    // Знаки препинания для разбиения
    const punctuationMarks = /[.!?;:—–-]\s*/g;
    
    // Находим все позиции знаков препинания
    const splitPositions = [];
    let match;
    while ((match = punctuationMarks.exec(fullText)) !== null) {
        splitPositions.push({
            position: match.index + match[0].length,
            mark: match[0].trim(),
            originalMatch: match[0]
        });
    }
    
    // Добавляем позицию в конце текста, если текст не заканчивается знаком препинания
    if (splitPositions.length === 0 || splitPositions[splitPositions.length - 1].position < fullText.length) {
        splitPositions.push({
            position: fullText.length,
            mark: '',
            originalMatch: ''
        });
    }
    
    // Отображаем текст с маркерами
    displayTextWithMarkers(fullText, splitPositions);
}

// Отображение текста с интерактивными маркерами
function displayTextWithMarkers(fullText, splitPositions) {
    const textContent = document.getElementById('textContent');
    let html = '';
    let lastPosition = 0;
    
    splitPositions.forEach((split, index) => {
        // Добавляем текст до знака препинания
        if (split.position > lastPosition) {
            const textSegment = fullText.substring(lastPosition, split.position);
            html += escapeHtml(textSegment);
        }
        
        // Добавляем маркер фрагмента (span + FontAwesome) для единообразия стилей
        html += `<span class="fragment-marker" data-position="${split.position}" onclick="createFragmentFromMarker(${split.position}, ${index})" title="Создать фрагмент здесь"><i class="fas fa-cut"></i></span>`;
        
        lastPosition = split.position;
    });
    
    textContent.innerHTML = html;
}

// Удалены дополнительные обработчики кликов для маркеров, чтобы избежать двойного создания фрагмента

// Создание фрагмента из маркера
function createFragmentFromMarker(endPosition, splitIndex) {
    const fullText = currentText.content;
    
    // Определяем начальную позицию
    let startPosition = 0;
    if (textFragments.length > 0) {
        startPosition = textFragments[textFragments.length - 1].endPos;
    }
    
    // Проверяем, что позиция корректная
    if (endPosition <= startPosition) {
        window.app.showNotification('Выберите позицию после предыдущего фрагмента', 'error');
        return;
    }
    
    // Создаем фрагмент
    const fragmentText = fullText.substring(startPosition, endPosition).trim();
    
    if (fragmentText.length === 0) {
        window.app.showNotification('Фрагмент не может быть пустым', 'error');
        return;
    }
    
    const fragment = {
        order: textFragments.length + 1,
        content: fragmentText,
        startPos: startPosition,
        endPos: endPosition
    };
    
    textFragments.push(fragment);
    
    // Показываем уведомление
    window.app.showNotification(`Создан фрагмент ${fragment.order}: "${fragmentText.substring(0, 50)}${fragmentText.length > 50 ? '...' : ''}"`, 'success');
    
    // Обновляем отображение текста с цветными фрагментами
    displayFragments();
    updateFragmentInfo();
    
    // Проверяем, остался ли текст
    if (endPosition < fullText.length) {
        const proceedBtn = document.getElementById('proceedToStep3');
        if (proceedBtn) {
            proceedBtn.disabled = false;
        }
    } else {
        // Весь текст разбит на фрагменты
        const proceedBtn = document.getElementById('proceedToStep3');
        if (proceedBtn) {
            proceedBtn.disabled = false;
            proceedBtn.textContent = 'Перейти к ассоциациям';
        }
    }
}

// Обновление маркеров после создания фрагмента
function updateMarkersAfterFragment() {
    const lastFragmentEnd = textFragments.length > 0 ? textFragments[textFragments.length - 1].endPos : 0;
    console.log('Updating markers after fragment, lastFragmentEnd:', lastFragmentEnd);
    
    // Скрываем маркеры, которые находятся до конца последнего фрагмента
    const markers = document.querySelectorAll('.fragment-marker');
    let visibleMarkers = 0;
    
    markers.forEach(marker => {
        const position = parseInt(marker.dataset.position);
        if (position <= lastFragmentEnd) {
            marker.style.display = 'none';
        } else {
            marker.style.display = 'inline-block';
            visibleMarkers++;
        }
    });
    
    console.log('Visible markers after update:', visibleMarkers);
}

// Старая функция handleTextClick удалена - теперь используются маркеры

// Старые функции удалены - теперь используется система маркеров

// Старая функция createFragment удалена - теперь используется createFragmentFromMarker

// Отображение фрагментов
function displayFragments() {
    const textContent = document.getElementById('textContent');
    const fullText = currentText.content;
    let html = '';
    let lastPosition = 0;
    
    textFragments.forEach((fragment, index) => {
        // Добавляем текст до фрагмента
        if (fragment.startPos > lastPosition) {
            html += escapeHtml(fullText.substring(lastPosition, fragment.startPos));
        }
        
        // Добавляем фрагмент с чередующимися цветами
        const colorIndex = (index % 4) + 1;
        const colors = [
            { bg: 'rgba(102, 126, 234, 0.2)', border: '#667eea', shadow: 'rgba(102, 126, 234, 0.3)' },
            { bg: 'rgba(40, 167, 69, 0.2)', border: '#28a745', shadow: 'rgba(40, 167, 69, 0.3)' },
            { bg: 'rgba(255, 193, 7, 0.2)', border: '#ffc107', shadow: 'rgba(255, 193, 7, 0.3)' },
            { bg: 'rgba(220, 53, 69, 0.2)', border: '#dc3545', shadow: 'rgba(220, 53, 69, 0.3)' }
        ];
        const color = colors[colorIndex - 1];
        
        const isLast = index === (textFragments.length - 1);
        const actionBtn = isLast
            ? `<button class="fragment-edit-btn" onclick="undoLastFragment()" title="Отменить последний фрагмент">🗑️</button>`
            : '';
        const fragmentHtml = `<span class="text-fragment" data-fragment-number="${fragment.order}" style="background: ${color.bg}; border: 2px solid ${color.border}; box-shadow: 0 1px 3px ${color.shadow};">
            ${escapeHtml(fragment.content)}
            ${actionBtn}
        </span>`;
        html += fragmentHtml;
        
        lastPosition = fragment.endPos;
    });
    
    // Добавляем оставшийся текст с маркерами
    if (lastPosition < fullText.length) {
        const remainingText = fullText.substring(lastPosition);
        html += addMarkersToText(remainingText, lastPosition);
    }
    
    textContent.innerHTML = html;
}

// Добавление маркеров к тексту
function addMarkersToText(text, startPosition) {
    // Используем ту же логику поиска, что и при инициализации
    const punctuationRegex = /[.!?;:—–-]\s*/g;
    const splitPositions = [];
    let match;
    while ((match = punctuationRegex.exec(text)) !== null) {
        const absolutePosition = startPosition + match.index + match[0].length;
        // Избегаем дублей одинаковых позиций
        if (splitPositions.length === 0 || splitPositions[splitPositions.length - 1] !== absolutePosition) {
            splitPositions.push(absolutePosition);
        }
    }
    
    if (splitPositions.length === 0) {
        console.log('No split positions found in text');
        return escapeHtml(text);
    }
    
    console.log('Adding markers to text at positions:', splitPositions);
    
    let html = '';
    let lastPos = 0;
    
    splitPositions.forEach((position, index) => {
        const relativePos = position - startPosition;
        
        // Проверяем, не попадает ли маркер внутрь существующего фрагмента
        let isInsideFragment = false;
        for (const fragment of textFragments) {
            if (position > fragment.startPos && position <= fragment.endPos) {
                isInsideFragment = true;
                break;
            }
        }
        
        // Добавляем текст до маркера
        if (relativePos > lastPos) {
            html += escapeHtml(text.substring(lastPos, relativePos));
        }
        
        // Добавляем маркер только если он не внутри фрагмента
        if (!isInsideFragment) {
            html += `<span class="fragment-marker" data-position="${position}" onclick="createFragmentFromMarker(${position}, ${index})" title="Создать фрагмент здесь"><i class="fas fa-cut"></i></span>`;
            console.log(`Added marker at position ${position}`);
        } else {
            console.log(`Skipped marker at position ${position} (inside fragment)`);
        }
        
        lastPos = relativePos;
    });
    
    // Добавляем оставшийся текст
    if (lastPos < text.length) {
        html += escapeHtml(text.substring(lastPos));
    }
    
    console.log('Markers added to text');
    return html;
}

// Отображение существующих фрагментов
function displayExistingFragments() {
    textFragments = currentFragments.map(f => ({
        id: f.id,
        order: f.fragment_order,
        content: f.content,
        startPos: f.start_position,
        endPos: f.end_position
    }));
    
    displayFragments();
    updateFragmentInfo();
    
    // Автоматически ищем эмодзи для фрагментов (временно отключено для отладки)
    // setTimeout(() => {
    //     autoFindEmojisForFragments();
    // }, 1000); // Задержка для полной загрузки DOM
    
    const proceedBtn = document.getElementById('proceedToStep3');
    if (proceedBtn) {
        proceedBtn.disabled = false;
    }
}

// Обновление информации о фрагментах
function updateFragmentInfo() {
    const fragmentCount = document.getElementById('fragmentCount');
    const fragmentsList = document.getElementById('fragmentsList');
    
    if (fragmentCount) {
        fragmentCount.textContent = textFragments.length;
    }
    
    if (fragmentsList) {
        if (textFragments.length === 0) {
            fragmentsList.innerHTML = '<p>Кликните в тексте, чтобы создать фрагменты</p>';
        } else {
            fragmentsList.innerHTML = textFragments.map((fragment, index) => `
                <div class="fragment-item">
                    <div class="fragment-number">${fragment.order}</div>
                    <div class="fragment-text">${escapeHtml(fragment.content)}</div>
                    <div class="fragment-actions">
                        <button class="btn btn-secondary" onclick="editFragment(${index})">Изменить</button>
                        <button class="btn btn-secondary" onclick="removeFragment(${index})">Удалить</button>
                    </div>
                </div>
            `).join('');
        }
    }
}

// Состояние кнопки Отменить
function updateUndoButtonState() {
    const undoLastFragmentBtn = document.getElementById('undoLastFragment');
    if (!undoLastFragmentBtn) return;
    undoLastFragmentBtn.disabled = textFragments.length === 0;
}

// Отменить последний фрагмент
function undoLastFragment() {
    if (textFragments.length === 0) return;
    const removed = textFragments.pop();
    // Пере-нумеруем
    textFragments.forEach((f, i) => { f.order = i + 1; });
    window.app.showNotification(`Отменён фрагмент ${removed.order}`, 'info');
    // Перерисуем текст и список
    displayFragments();
    updateFragmentInfo();
    updateUndoButtonState();
}
// Редактирование фрагмента
function editFragment(index) {
    // Здесь можно добавить функционал редактирования
    window.app.showNotification('Функция редактирования будет добавлена в следующей версии', 'info');
}

// Удаление фрагмента
function removeFragment(index) {
    if (confirm('Удалить этот фрагмент?')) {
        textFragments.splice(index, 1);
        
        // Обновляем порядковые номера
        textFragments.forEach((fragment, i) => {
            fragment.order = i + 1;
        });
        
        displayFragments();
        updateFragmentInfo();
    }
}

// Сохранение фрагментов
async function saveFragments() {
    if (textFragments.length === 0) {
        throw new Error('Создайте хотя бы один фрагмент');
    }
    
    try {
        await window.app.apiRequest(`/api/texts/${currentTextId}/fragments`, {
            method: 'POST',
            body: JSON.stringify({ fragments: textFragments })
        });
        
        window.app.showNotification('Фрагменты сохранены!', 'success');
        
        // После сохранения обязательно загружаем фрагменты из БД,
        // чтобы получить их реальные ID
        const refreshed = await window.app.apiRequest(`/api/wizard/text/${currentTextId}`);
        currentFragments = (refreshed.fragments || []).map(f => ({
            id: f.id,
            fragment_order: f.fragment_order,
            content: f.content,
            start_position: f.start_position,
            end_position: f.end_position,
            emoji: f.emoji || null,
            custom_word: f.custom_word || null,
            custom_image: f.custom_image || null
        }));
        
    } catch (error) {
        console.error('Save fragments error:', error);
        throw error;
    }
}

// Инициализация Шага 3
async function initializeStep3() {
    // Показываем цепочку рассказа
    const storyChain = document.getElementById('storyChain');
    if (storyChain) {
        storyChain.style.display = 'block';
    }
    
    // Проверяем, есть ли локальные фрагменты, которые нужно сохранить
    if (textFragments.length > 0 && currentFragments.length === 0) {
        console.log('Saving local fragments before step 3...');
        try {
            await saveFragments();
        } catch (error) {
            console.error('Error saving fragments:', error);
            window.app.showNotification('Ошибка сохранения фрагментов', 'error');
            return;
        }
    }
    
    // Загружаем все смайлики
    await loadAllEmojis();
    
    // Загружаем существующие ассоциации в цепочку
    loadExistingAssociations();
    
    // Пытаемся восстановить фрагмент после перезагрузки
    let restoredIndex = -1;
    try {
        const stored = localStorage.getItem('wizardReturnFragmentIndex');
        if (stored !== null) {
            restoredIndex = parseInt(stored, 10);
            localStorage.removeItem('wizardReturnFragmentIndex');
        }
    } catch (e) {}

    if (restoredIndex >= 0 && restoredIndex < currentFragments.length) {
        currentFragmentIndex = restoredIndex;
        activeEmojiPosition = -1; // остаёмся на этом фрагменте, новая ассоциация
    } else {
        // Находим первый фрагмент без ассоциации или устанавливаем первый как редактируемый
        const firstEmptyIndex = findFirstEmptyAssociation();
        if (firstEmptyIndex >= 0) {
            currentFragmentIndex = firstEmptyIndex;
            activeEmojiPosition = -1; // Режим новой позиции
        } else {
            currentFragmentIndex = 0;
            activeEmojiPosition = 0; // Режим редактирования первой
        }
    }
    
    updateChainDisplay();
    showCurrentFragment();
}

// Загрузка всех смайликов
async function loadAllEmojis() {
    try {
        const response = await window.app.apiRequest(`/api/wizard/all-emojis?language=${currentText.language}`);
        allEmojis = response.emojis;
    } catch (error) {
        console.error('Load emojis error:', error);
        allEmojis = [];
    }
}

// Загрузка существующих ассоциаций в цепочку
function loadExistingAssociations() {
    const chainLine = document.getElementById('chainLine');
    if (!chainLine) return;
    
    // Очищаем существующую цепочку
    chainLine.innerHTML = '';
    
    // Создаём фиксированные слоты для каждого фрагмента, чтобы сохранять порядок
    currentFragments.forEach((fragment, index) => {
        const chainEmoji = document.createElement('div');
        chainEmoji.className = 'chain-emoji';
        chainEmoji.dataset.fragmentIndex = index;
        chainEmoji.onclick = () => editFragmentAssociation(index);
        
        if (fragment.emoji || fragment.custom_word || fragment.custom_image) {
            const association = fragment.emoji || fragment.custom_word || '🖼️';
            chainEmoji.textContent = association;
        } else {
            chainEmoji.classList.add('empty');
            chainEmoji.textContent = '';
        }
        chainLine.appendChild(chainEmoji);
    });
}

// Поиск первой пустой ассоциации
function findFirstEmptyAssociation() {
    for (let i = 0; i < currentFragments.length; i++) {
        const fragment = currentFragments[i];
        if (!fragment.emoji && !fragment.custom_word && !fragment.custom_image) {
            return i;
        }
    }
    return -1; // Все ассоциации заполнены
}

// Показать текущий фрагмент
async function showCurrentFragment() {
    // Проверяем, есть ли незаполненные ассоциации
    const firstEmptyIndex = findFirstEmptyAssociation();
    
    if (firstEmptyIndex < 0 && activeEmojiPosition < 0) {
        // Все ассоциации заполнены и мы не в режиме редактирования
        showFinishButton();
        return;
    }
    
    if (currentFragmentIndex >= currentFragments.length) {
        // Выходим за границы массива
        showFinishButton();
        return;
    }
    
    const fragment = currentFragments[currentFragmentIndex];
    
    // Обновляем информацию о фрагменте
    const currentFragmentNumber = document.getElementById('currentFragmentNumber');
    const totalFragments = document.getElementById('totalFragments');
    const currentFragmentText = document.getElementById('currentFragmentText');
    const associationInstruction = document.getElementById('associationInstruction');
    
    if (currentFragmentNumber) {
        currentFragmentNumber.textContent = currentFragmentIndex + 1;
    }
    
    if (totalFragments) {
        totalFragments.textContent = currentFragments.length;
    }
    
    if (currentFragmentText) {
        currentFragmentText.textContent = fragment.content;
    }
    // При каждом показе сбрасываем режим редактирования
    const currentFragmentEdit = document.getElementById('currentFragmentEdit');
    if (currentFragmentEdit) {
        currentFragmentEdit.style.display = 'none';
    }
    const currentFragmentTextEl = document.getElementById('currentFragmentText');
    if (currentFragmentTextEl) {
        currentFragmentTextEl.style.display = 'block';
    }
    
    if (associationInstruction) {
        if (activeEmojiPosition >= 0) {
            associationInstruction.innerHTML = '<p>Редактируйте ассоциацию для этого фрагмента.</p>';
        } else if (currentFragmentIndex === 0) {
            associationInstruction.innerHTML = '<p>Разместите какой-то предмет в начале воображаемого маршрута.</p>';
        } else {
            associationInstruction.innerHTML = '<p>Представьте, как вы идете по маршруту к следующему месту и размещаете мысленно следующий предмет.</p>';
        }
    }
    
    // Загружаем предложенные смайлики для фрагмента
    await loadSuggestedEmojis(fragment.content);
    
    // Скрываем пользовательские ассоциации
    hideCustomAssociation();
}

// Сохранение изменений текущего фрагмента и перезагрузка страницы
async function saveCurrentFragmentEdit(newContent) {
    try {
        const trimmed = (newContent || '').trim();
        if (!trimmed) {
            window.app.showNotification('Текст фрагмента не может быть пустым', 'error');
            return;
        }

        const fragment = currentFragments[currentFragmentIndex];
        if (!fragment) {
            window.app.showNotification('Не удалось определить фрагмент', 'error');
            return;
        }

        window.app.showLoader();

        // Обновляем фрагмент на сервере; ассоциации сбрасываем, чтобы подбор шёл заново
        await window.app.apiRequest('/api/wizard/fragment/update', {
            method: 'POST',
            body: JSON.stringify({
                fragmentId: fragment.id,
                content: trimmed
            })
        });

        // Запоминаем индекс фрагмента, чтобы вернуться к нему после перезагрузки
        try {
            localStorage.setItem('wizardReturnFragmentIndex', String(currentFragmentIndex));
        } catch (e) {}

        window.app.showNotification('Фрагмент сохранён. Обновляем страницу...', 'success');
        // Вместо полной перезагрузки — перезагружаем данные и остаёмся на фрагменте
        const refreshed = await window.app.apiRequest(`/api/wizard/text/${currentTextId}`);
        currentText = refreshed.text;
        currentFragments = (refreshed.fragments || []).map(f => ({
            id: f.id,
            fragment_order: f.fragment_order,
            content: f.content,
            start_position: f.start_position,
            end_position: f.end_position,
            emoji: f.emoji || null,
            custom_word: f.custom_word || null,
            custom_image: f.custom_image || null
        }));

        // Убедимся, что индекс в пределах
        if (currentFragmentIndex >= currentFragments.length) {
            currentFragmentIndex = Math.max(0, currentFragments.length - 1);
        }

        // После сохранения остаёмся на текущем фрагменте и подсвечиваем его слот (курсор не должен прыгать)
        activeEmojiPosition = currentFragmentIndex;

        // Обновим цепочку и UI шага 3
        loadExistingAssociations();
        updateChainDisplay();
        showCurrentFragment();
    } catch (error) {
        console.error('Save fragment edit error:', error);
        window.app.showNotification(error.message || 'Ошибка сохранения фрагмента', 'error');
    } finally {
        window.app.hideLoader();
    }
}

// Загрузка предложенных смайликов
async function loadSuggestedEmojis(fragmentText) {
    const suggestedEmojis = document.getElementById('suggestedEmojis');
    
    if (!suggestedEmojis) return;
    
    try {
        // Используем новую функцию поиска эмодзи
        const emojis = await findEmojisByTranslation(fragmentText, 10);
        
        if (!emojis || emojis.length === 0) {
            suggestedEmojis.innerHTML = '<p>Эмодзи не найдены</p>';
            return;
        }
        
        const emojisHtml = emojis.map(emoji => {
            const emojiNative = emoji.native || '❓';
            const emojiName = emoji.name || 'Unknown';
            const tooltip = `${emojiName} (${emoji.source || 'прямой'}: ${emoji.originalWord || 'unknown'} -> ${emoji.translation || 'unknown'})`;
            
            return `
                <button class="suggested-emoji-btn" 
                        data-emoji="${emojiNative}" 
                        data-name="${emojiName}"
                        title="${tooltip}">
                    ${emojiNative}
                </button>
            `;
        }).join('');
        
        suggestedEmojis.innerHTML = `
            <div class="suggested-emojis-title">Предложенные эмодзи (${emojis.length}):</div>
            <div class="suggested-emojis-list">${emojisHtml}</div>
        `;
        
        // Добавляем обработчики клика
        suggestedEmojis.querySelectorAll('.suggested-emoji-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const emoji = this.dataset.emoji;
                const name = this.dataset.name;
                selectEmoji(emoji, name);
            });
        });
        
    } catch (error) {
        console.error('Load suggested emojis error:', error);
        suggestedEmojis.innerHTML = '<p>Ошибка загрузки смайликов</p>';
    }
}

// Выбор смайлика
async function selectEmoji(emoji, name) {
    try {
        const fragment = currentFragments[currentFragmentIndex];
        
        if (!fragment || !fragment.id) {
            window.app.showNotification('Фрагмент не найден. Попробуйте обновить страницу.', 'error');
            return;
        }
        
        await window.app.apiRequest('/api/wizard/associate', {
            method: 'POST',
            body: JSON.stringify({
                fragmentId: fragment.id,
                emoji: emoji
            })
        });
        
        // Обновляем ассоциацию в данных фрагмента
        fragment.emoji = emoji;
        fragment.custom_word = null;
        fragment.custom_image = null;
        
        const chainLine = document.getElementById('chainLine');
        const targetSlot = chainLine.querySelector(`.chain-emoji[data-fragment-index="${currentFragmentIndex}"]`);
        
        if (activeEmojiPosition >= 0 && targetSlot) {
            // Редактирование: заменяем в слоте текущего фрагмента
            targetSlot.textContent = emoji;
            targetSlot.classList.remove('empty');
            
            // Ищем следующую незаполненную позицию
            const nextEmptyIndex = findFirstEmptyAssociation();
            if (nextEmptyIndex >= 0) {
                // Есть незаполненные ассоциации - переходим к ним
                activeEmojiPosition = -1;
                currentFragmentIndex = nextEmptyIndex;
            } else {
                // Все заполнены - остаемся в режиме редактирования, переходим к следующему
                const nextIndex = (currentFragmentIndex + 1) % currentFragments.length;
                activeEmojiPosition = nextIndex;
                currentFragmentIndex = nextIndex;
            }
        } else {
            // Добавляем новый смайлик
            addToStoryChain(emoji, currentFragmentIndex);
            
            // Ищем следующую незаполненную позицию
            const nextEmptyIndex = findFirstEmptyAssociation();
            if (nextEmptyIndex >= 0) {
                // Есть незаполненные ассоциации
                activeEmojiPosition = -1;
                currentFragmentIndex = nextEmptyIndex;
            } else {
                // Все заполнены - переходим в режим редактирования первого элемента
                activeEmojiPosition = 0;
                currentFragmentIndex = 0;
            }
        }
        
        updateChainDisplay();
        showCurrentFragment();
        
    } catch (error) {
        console.error('Select emoji error:', error);
        window.app.showNotification(error.message || 'Ошибка выбора смайлика', 'error');
    }
}

// Поиск следующей незаполненной позиции
function findNextEmptyPosition() {
    for (let i = 0; i < currentFragments.length; i++) {
        const chainLine = document.getElementById('chainLine');
        const chainEmojis = chainLine.querySelectorAll('.chain-emoji');
        const emojiAtPosition = Array.from(chainEmojis).find(emoji => 
            parseInt(emoji.dataset.fragmentIndex) === i
        );
        if (!emojiAtPosition) {
            return i;
        }
    }
    return -1; // Все позиции заполнены
}

// Добавление в цепочку рассказа
function addToStoryChain(association, fragmentIndex) {
    const chainLine = document.getElementById('chainLine');
    if (!chainLine) return;
    
    // Обновляем существующий слот вместо добавления в конец
    const existingSlot = chainLine.querySelector(`.chain-emoji[data-fragment-index="${fragmentIndex}"]`);
    if (existingSlot) {
        existingSlot.textContent = association;
        existingSlot.classList.remove('empty');
    } else {
        // На всякий случай создаём, если нет
        const chainEmoji = document.createElement('div');
        chainEmoji.className = 'chain-emoji';
        chainEmoji.textContent = association;
        chainEmoji.onclick = () => editFragmentAssociation(fragmentIndex);
        chainEmoji.dataset.fragmentIndex = fragmentIndex;
        chainLine.appendChild(chainEmoji);
    }
    updateChainDisplay();
}

// Обновление отображения цепочки с кольцом-индикатором
function updateChainDisplay() {
    const chainLine = document.getElementById('chainLine');
    if (!chainLine) return;
    
    const chainEmojis = chainLine.querySelectorAll('.chain-emoji');
    const totalFragments = currentFragments.length;
    
    // Убираем активные классы со всех элементов
    chainEmojis.forEach(emoji => {
        emoji.classList.remove('active', 'next-position');
    });
    
    // Удаляем существующее кольцо-индикатор
    const existingRing = chainLine.querySelector('.position-ring');
    if (existingRing) {
        existingRing.remove();
    }
    
    // Создаем кольцо-индикатор
    const ring = document.createElement('div');
    ring.className = 'position-ring';
    
    if (activeEmojiPosition >= 0) {
        // Редактирование существующего смайлика: ищем по индексу фрагмента,
        // а не по порядку элементов в DOM
        const targetEmoji = chainLine.querySelector(`.chain-emoji[data-fragment-index="${activeEmojiPosition}"]`);
        if (targetEmoji) {
            targetEmoji.classList.add('active');
            ring.classList.add('editing');
            ring.style.display = 'none'; // Скрываем кольцо, так как подсвечиваем сам смайлик
        } else {
            // Эмодзи для этой позиции отсутствует (например, после сброса ассоциации)
            activeEmojiPosition = -1;
        }
    }

    if (activeEmojiPosition < 0) {
        // Новая позиция - показываем пустое кольцо у текущего фрагмента (а не в конце)
        ring.classList.add('empty');
        ring.onclick = () => {
            // При клике на пустое кольцо ничего не делаем
        };
        const ringIndex = Math.min(Math.max(currentFragmentIndex, 0), totalFragments);
        const targetSlot = chainLine.querySelector(`.chain-emoji[data-fragment-index="${ringIndex}"]`);
        if (targetSlot) {
            chainLine.insertBefore(ring, targetSlot);
        } else {
            chainLine.appendChild(ring);
        }
    }
}

// Показать пользовательские ассоциации
function showCustomAssociation() {
    console.log('Showing custom association...');
    const customAssociation = document.getElementById('customAssociation');
    console.log('Custom association element found:', !!customAssociation);
    
    if (customAssociation) {
        customAssociation.style.display = 'block';
        console.log('Custom association displayed');
        
        // Убеждаемся, что вкладка эмодзи активна
        const emojiTab = document.getElementById('emojiTab');
        if (emojiTab) {
            emojiTab.style.display = 'block';
            console.log('Emoji tab displayed');
        }
        
        // Активируем кнопку вкладки эмодзи
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        const emojiTabBtn = document.querySelector('[data-tab="emoji"]');
        if (emojiTabBtn) {
            emojiTabBtn.classList.add('active');
            console.log('Emoji tab button activated');
        }
        
        // Скрываем другие вкладки
        document.querySelectorAll('.tab-content').forEach(content => {
            if (content.id !== 'emojiTab') {
                content.style.display = 'none';
            }
        });
        
        // Проверяем наличие всех необходимых элементов
        const emojiSearch = document.getElementById('emojiSearch');
        const emojiCategories = document.getElementById('emojiCategories');
        const allEmojis = document.getElementById('allEmojis');
        
        console.log('Elements found:');
        console.log('- emojiSearch:', !!emojiSearch);
        console.log('- emojiCategories:', !!emojiCategories);
        console.log('- allEmojis:', !!allEmojis);
        
        // Дополнительная отладка - проверим все элементы с этими ID
        console.log('All elements with emojiSearch ID:', document.querySelectorAll('#emojiSearch').length);
        console.log('All elements with emojiCategories ID:', document.querySelectorAll('#emojiCategories').length);
        console.log('All elements with allEmojis ID:', document.querySelectorAll('#allEmojis').length);
        
        // Проверим, есть ли элементы в emojiTab
        if (emojiTab) {
            console.log('EmojiTab innerHTML length:', emojiTab.innerHTML.length);
            console.log('EmojiTab contains emojiSearch:', emojiTab.querySelector('#emojiSearch') !== null);
            console.log('EmojiTab contains emojiCategories:', emojiTab.querySelector('#emojiCategories') !== null);
        }
        
        // Если элементы не найдены, попробуем найти их через несколько миллисекунд
        if (!emojiSearch || !emojiCategories) {
            console.log('Elements not found, retrying in 100ms...');
            setTimeout(() => {
                const retryEmojiSearch = document.getElementById('emojiSearch');
                const retryEmojiCategories = document.getElementById('emojiCategories');
                console.log('Retry - emojiSearch:', !!retryEmojiSearch);
                console.log('Retry - emojiCategories:', !!retryEmojiCategories);
                
                if (retryEmojiSearch && retryEmojiCategories) {
                    loadAllEmojisTab();
                } else {
                    console.log('Elements still not found, creating them manually...');
                    createMissingElements();
                }
            }, 100);
        } else {
            // Загружаем все смайлики в первую вкладку
            loadAllEmojisTab();
        }
    } else {
        console.error('Custom association element not found!');
    }
}

// Скрыть пользовательские ассоциации
function hideCustomAssociation() {
    const customAssociation = document.getElementById('customAssociation');
    if (customAssociation) {
        customAssociation.style.display = 'none';
    }
}

// Загрузка всех смайликов во вкладку
function loadAllEmojisTab() {
    console.log('Loading emoji categories and emojis...');
    loadEmojiCategories();
    loadEmojisByCategory(currentCategory);
}

// Загрузка категорий эмодзи
async function loadEmojiCategories() {
    try {
        console.log('Loading categories...');
        const response = await window.app.apiRequest('/api/wizard/categories');
        emojiCategories = response.categories;
        console.log('Categories loaded:', emojiCategories.length);
        
        const categoriesContainer = document.getElementById('emojiCategories');
        console.log('Categories container found:', !!categoriesContainer);
        
        if (categoriesContainer) {
            categoriesContainer.innerHTML = emojiCategories.map(category => `
                <button class="category-tab ${category.id === currentCategory ? 'active' : ''}" 
                        data-category="${category.id}" 
                        onclick="switchEmojiCategory('${category.id}')">
                    <i class="${category.icon}"></i>
                    <span>${category.name}</span>
                    <span class="category-count">${category.emojiCount}</span>
                </button>
            `).join('');
            console.log('Categories HTML inserted');
        } else {
            console.error('Categories container not found!');
        }
    } catch (error) {
        console.error('Load categories error:', error);
    }
}

// Переключение категории эмодзи
async function switchEmojiCategory(categoryId) {
    currentCategory = categoryId;
    
    // Обновляем активную вкладку
    document.querySelectorAll('.category-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelector(`[data-category="${categoryId}"]`).classList.add('active');
    
    // Загружаем эмодзи для категории
    await loadEmojisByCategory(categoryId);
}

// Загрузка эмодзи по категории
async function loadEmojisByCategory(categoryId) {
    const allEmojisContainer = document.getElementById('allEmojis');
    if (!allEmojisContainer) return;
    
    // Показываем индикатор загрузки
    allEmojisContainer.innerHTML = `
        <div class="emoji-loading">
            <i class="fas fa-spinner"></i>
            Загрузка эмодзи...
        </div>
    `;
    
    try {
        const response = await window.app.apiRequest(`/api/wizard/emojis/category/${categoryId}`);
        const emojis = response.emojis;
        
        if (emojis.length === 0) {
            allEmojisContainer.innerHTML = `
                <div class="emoji-empty">
                    <i class="fas fa-search"></i>
                    <p>Эмодзи не найдены</p>
                </div>
            `;
            return;
        }
        
        allEmojisContainer.innerHTML = emojis.map(emoji => `
            <button class="emoji-btn" onclick="selectCustomEmoji('${emoji.native}')" title="${emoji.name}">
                ${emoji.native}
            </button>
        `).join('');
        
    } catch (error) {
        console.error('Load emojis by category error:', error);
        allEmojisContainer.innerHTML = `
            <div class="emoji-empty">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Ошибка загрузки эмодзи</p>
            </div>
        `;
    }
}

// Поиск эмодзи
async function searchEmojis(query) {
    if (!query.trim()) {
        loadEmojisByCategory(currentCategory);
        return;
    }
    
    const allEmojisContainer = document.getElementById('allEmojis');
    if (!allEmojisContainer) return;
    
    // Показываем индикатор загрузки
    allEmojisContainer.innerHTML = `
        <div class="emoji-loading">
            <i class="fas fa-spinner"></i>
            Поиск эмодзи...
        </div>
    `;
    
    try {
        // Определяем язык по вводу: если есть кириллица — используем ru,
        // иначе: если язык текущего текста немецкий — используем de, иначе en
        const isCyrillic = /[А-Яа-яЁё]/.test(query);
        const lang = isCyrillic ? 'ru' : ((currentText && currentText.language === 'de') ? 'de' : 'en');
        const response = await window.app.apiRequest(`/api/wizard/emojis/search?q=${encodeURIComponent(query)}&language=${encodeURIComponent(lang)}`);
        const emojis = response.emojis;
        
        if (emojis.length === 0) {
            allEmojisContainer.innerHTML = `
                <div class="emoji-empty">
                    <i class="fas fa-search"></i>
                    <p>Эмодзи не найдены для "${query}"</p>
                </div>
            `;
            return;
        }
        
        allEmojisContainer.innerHTML = emojis.map(emoji => `
            <button class="emoji-btn" onclick="selectCustomEmoji('${emoji.native}')" title="${emoji.name}">
                ${emoji.native}
            </button>
        `).join('');
        
    } catch (error) {
        console.error('Search emojis error:', error);
        allEmojisContainer.innerHTML = `
            <div class="emoji-empty">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Ошибка поиска эмодзи</p>
            </div>
        `;
    }
}

// Выбор пользовательского смайлика
function selectCustomEmoji(emoji) {
    // Снимаем выделение с других
    document.querySelectorAll('#allEmojis .emoji-btn').forEach(btn => {
        btn.classList.remove('selected');
    });
    
    // Выделяем выбранный
    event.target.classList.add('selected');
    
    // Сохраняем выбор
    window.selectedCustomEmoji = emoji;
}

// Переключение вкладок
function switchTab(tabName) {
    // Обновляем кнопки вкладок
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Показываем нужную вкладку
    document.querySelectorAll('.tab-content').forEach(content => {
        content.style.display = 'none';
    });
    
    const targetTab = document.getElementById(tabName + 'Tab');
    if (targetTab) {
        targetTab.style.display = 'block';
    }
}

// Обработка вставки изображения
function handleImagePaste(event) {
    const imageTab = document.getElementById('imageTab');
    if (!imageTab || imageTab.style.display === 'none') return;
    
    const items = event.clipboardData.items;
    
    for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
            const blob = items[i].getAsFile();
            displayPastedImage(blob);
            break;
        }
    }
}

// Отображение вставленного изображения
function displayPastedImage(blob) {
    const canvas = document.getElementById('imageCanvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = function() {
        // Масштабируем изображение
        const maxWidth = 200;
        const maxHeight = 150;
        let { width, height } = img;
        
        if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
        }
        
        if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        ctx.drawImage(img, 0, 0, width, height);
        canvas.style.display = 'block';
        
        // Сохраняем изображение с качеством 0.7 для уменьшения размера
        const dataURL = canvas.toDataURL('image/jpeg', 0.7);
        console.log('Image data URL length:', dataURL.length);
        
        // Проверяем размер изображения
        if (dataURL.length > 100000) { // 100KB
            window.app.showNotification('Изображение слишком большое. Попробуйте изображение меньшего размера.', 'error');
            return;
        }
        
        window.selectedCustomImage = dataURL;
        console.log('Image saved, length:', dataURL.length);
    };
    
    img.src = URL.createObjectURL(blob);
}

// Обработка пользовательской ассоциации
async function handleCustomAssociation() {
    const activeTabBtn = document.querySelector('.tab-btn.active');
    if (!activeTabBtn) {
        window.app.showNotification('Выберите тип ассоциации', 'error');
        return;
    }
    
    const activeTab = activeTabBtn.dataset.tab;
    let associationData = {};
    
    if (activeTab === 'emoji' && window.selectedCustomEmoji) {
        associationData.emoji = window.selectedCustomEmoji;
    } else if (activeTab === 'image' && window.selectedCustomImage) {
        associationData.customImage = window.selectedCustomImage;
    } else if (activeTab === 'word') {
        const customWord = document.getElementById('customWord').value.trim();
        if (customWord) {
            associationData.customWord = customWord;
        }
    }
    
    if (Object.keys(associationData).length === 0) {
        window.app.showNotification('Выберите или введите ассоциацию', 'error');
        return;
    }
    
    console.log('Saving association:', associationData);
    
    try {
        const fragment = currentFragments[currentFragmentIndex];
        console.log('Current fragment index:', currentFragmentIndex);
        console.log('Total fragments:', currentFragments.length);
        console.log('Fragment:', fragment);
        console.log('Fragment ID:', fragment ? fragment.id : 'undefined');
        
        if (!fragment || !fragment.id) {
            console.error('Fragment not found or missing ID:', fragment);
            window.app.showNotification('Фрагмент не найден. Попробуйте обновить страницу.', 'error');
            return;
        }
        
        await window.app.apiRequest('/api/wizard/associate', {
            method: 'POST',
            body: JSON.stringify({
                fragmentId: fragment.id,
                ...associationData
            })
        });
        
        // Обновляем ассоциацию в данных фрагмента
        if (associationData.emoji) {
            fragment.emoji = associationData.emoji;
            fragment.custom_word = null;
            fragment.custom_image = null;
        } else if (associationData.customWord) {
            fragment.custom_word = associationData.customWord;
            fragment.emoji = null;
            fragment.custom_image = null;
        } else if (associationData.customImage) {
            fragment.custom_image = associationData.customImage;
            fragment.emoji = null;
            fragment.custom_word = null;
        }
        
        // Добавляем в цепочку или обновляем существующий
        const association = associationData.emoji || associationData.customWord || '🖼️';
        const chainLine = document.getElementById('chainLine');
        const chainEmojis = chainLine.querySelectorAll('.chain-emoji');
        
        if (activeEmojiPosition >= 0 && activeEmojiPosition < chainEmojis.length) {
            // Заменяем существующий
            chainEmojis[activeEmojiPosition].textContent = association;
        } else {
            // Добавляем новый
            addToStoryChain(association, currentFragmentIndex);
        }
        
        // Скрываем пользовательские ассоциации
        hideCustomAssociation();
        
        // Ищем следующую незаполненную позицию
        const nextEmptyIndex = findFirstEmptyAssociation();
        if (nextEmptyIndex >= 0) {
            // Есть незаполненные ассоциации
            activeEmojiPosition = -1;
            currentFragmentIndex = nextEmptyIndex;
        } else {
            // Все заполнены - переходим в режим редактирования первого элемента
            activeEmojiPosition = 0;
            currentFragmentIndex = 0;
        }
        
        updateChainDisplay();
        showCurrentFragment();
        
        // Очищаем выбор
        window.selectedCustomEmoji = null;
        window.selectedCustomImage = null;
        const customWordInput = document.getElementById('customWord');
        if (customWordInput) {
            customWordInput.value = '';
        }
        
    } catch (error) {
        console.error('Custom association error:', error);
        window.app.showNotification(error.message || 'Ошибка сохранения ассоциации', 'error');
    }
}

// Показать кнопку завершения
function showFinishButton() {
    const finishWizard = document.getElementById('finishWizard');
    if (finishWizard) {
        finishWizard.style.display = 'block';
    }
    
    // Скрываем секцию выбора смайликов
    const emojiSelection = document.querySelector('.emoji-selection');
    if (emojiSelection) {
        emojiSelection.style.display = 'none';
    }
    
    // Показываем сообщение о завершении
    const currentFragment = document.querySelector('.current-fragment');
    if (currentFragment) {
        currentFragment.innerHTML = `
            <div class="completion-message">
                <i class="fas fa-check-circle" style="font-size: 4rem; color: #28a745; margin-bottom: 1rem;"></i>
                <h3>Отлично!</h3>
                <p>Вы создали ассоциации для всех фрагментов текста. Теперь можно перейти к тренировке.</p>
            </div>
        `;
    }
}

// Завершение мастера
function handleFinishWizard() {
    window.app.showNotification('Мастер завершен! Переходим к тренировке...', 'success');
    setTimeout(() => {
        window.location.href = `/training.html?textId=${currentTextId}`;
    }, 1500);
}

// Редактирование ассоциации фрагмента
function editFragmentAssociation(fragmentIndex) {
    activeEmojiPosition = fragmentIndex;
    currentFragmentIndex = fragmentIndex;
    updateChainDisplay();
    showCurrentFragment();
}

// Обработка поиска эмодзи
function handleEmojiSearch(event) {
    const query = event.target.value.trim();
    
    // Очищаем предыдущий таймаут
    if (searchTimeout) {
        clearTimeout(searchTimeout);
    }
    
    // Устанавливаем новый таймаут для поиска
    searchTimeout = setTimeout(() => {
        searchEmojis(query);
    }, 300); // Задержка 300мс для избежания частых запросов
}

// Создание недостающих элементов
function createMissingElements() {
    const emojiTab = document.getElementById('emojiTab');
    if (!emojiTab) {
        console.error('EmojiTab not found, cannot create elements');
        return;
    }
    
    console.log('Creating missing elements in emojiTab...');
    
        // Создаем поле поиска, если его нет
        if (!document.getElementById('emojiSearch')) {
            const searchDiv = document.createElement('div');
            searchDiv.className = 'emoji-search';
            searchDiv.innerHTML = '<input type="text" id="emojiSearch" placeholder="Поиск эмодзи..." class="search-input">';
            emojiTab.insertBefore(searchDiv, emojiTab.firstChild);
            console.log('Created emojiSearch element');
            
            // Добавляем обработчик поиска
            const searchInput = document.getElementById('emojiSearch');
            if (searchInput) {
                searchInput.addEventListener('input', function() {
                    searchEmojis(this.value);
                });
                console.log('Added search event listener');
            }
        }
    
    // Создаем контейнер категорий, если его нет
    if (!document.getElementById('emojiCategories')) {
        const categoriesDiv = document.createElement('div');
        categoriesDiv.className = 'emoji-categories';
        categoriesDiv.id = 'emojiCategories';
        categoriesDiv.innerHTML = '<!-- Категории будут загружены динамически -->';
        
        // Вставляем после поля поиска
        const searchElement = document.getElementById('emojiSearch');
        if (searchElement && searchElement.parentNode) {
            // Вставляем после родительского элемента поля поиска
            searchElement.parentNode.parentNode.insertBefore(categoriesDiv, searchElement.parentNode.nextSibling);
        } else {
            // Если не можем найти правильное место, просто добавляем в конец
            emojiTab.appendChild(categoriesDiv);
        }
        console.log('Created emojiCategories element');
    }
    
    // Теперь попробуем загрузить данные
    setTimeout(() => {
        loadAllEmojisTab();
    }, 50);
}

// Функция для поиска эмодзи по переведенному тексту
async function findEmojisByTranslation(text, maxEmojis = 10) {
    try {
        console.log(`Searching emojis for translated text: "${text}"`);
        
        const response = await fetch(`/api/wizard/emojis/translate?text=${encodeURIComponent(text)}&maxEmojis=${maxEmojis}`);
        const data = await response.json();
        
        if (data.success) {
            console.log(`Found ${data.emojis.length} emojis for text: "${text}"`);
            return data.emojis;
        } else {
            console.error('Translation search failed:', data.error);
            return [];
        }
    } catch (error) {
        console.error('Error in translation search:', error);
        return [];
    }
}

// Функция для автоматического поиска эмодзи по фрагментам текста (новый итеративный алгоритм)
async function autoFindEmojisForFragments() {
    const fragments = document.querySelectorAll('.text-fragment');
    if (fragments.length === 0) {
        console.log('No fragments found for auto emoji search');
        return;
    }
    
    console.log(`Auto-searching emojis for ${fragments.length} fragments using iterative algorithm`);
    
    for (const fragment of fragments) {
        const text = fragment.textContent.trim();
        if (!text) continue;
        
        console.log(`Processing fragment: "${text}"`);
        
        // Используем новый итеративный алгоритм для всего текста фрагмента
        const emojis = await findEmojisByTranslation(text, 10);
        
        console.log(`Found ${emojis.length} emojis for fragment:`, emojis);
        
        if (emojis.length > 0) {
            // Создаем контейнер для предложенных эмодзи
            let suggestedContainer = fragment.querySelector('.suggested-emojis');
            if (!suggestedContainer) {
                suggestedContainer = document.createElement('div');
                suggestedContainer.className = 'suggested-emojis';
                fragment.appendChild(suggestedContainer);
            }
            
            // Создаем подробный tooltip для каждого эмодзи
            const emojisHtml = emojis.map(emoji => {
                console.log('Processing emoji:', emoji);
                console.log('emoji.native:', emoji.native);
                console.log('emoji.name:', emoji.name);
                
                let tooltip = `${emoji.name || 'Unknown'}`;
                if (emoji.source === 'direct') {
                    tooltip += ` (прямой: ${emoji.originalWord} -> ${emoji.translation})`;
                } else if (emoji.source === 'ontology') {
                    tooltip += ` (онтология: ${emoji.originalWord} -> ${emoji.translation} -> ${emoji.ontologyWord})`;
                }
                
                // Временно используем простые символы для тестирования
                const emojiNative = emoji.native || '❓';
                const emojiName = emoji.name || 'Unknown';
                
                // Используем только базовые эмодзи для надежности
                const testEmoji = emojiNative === '🎂' ? '🎂' : 
                                 emojiNative === '🎈' ? '🎈' : 
                                 emojiNative === '🎉' ? '🎉' : 
                                 emojiNative === '⏲️' ? '⏲️' : 
                                 emojiNative === '⌛' ? '⌛' : 
                                 emojiNative === '👿' ? '👿' : 
                                 emojiNative === '☝️' ? '☝️' : 
                                 emojiNative === '🫵' ? '🫵' : 
                                 emojiNative === '🇧🇲' ? '🇧🇲' : 
                                 emojiNative === '👨‍🔧' ? '👨‍🔧' : 
                                 emojiNative === '⛷️' ? '⛷️' : 
                                 emojiNative === '🏂' ? '🏂' : 
                                 emojiNative === '🎿' ? '🎿' : 
                                 emojiNative === '🇧🇦' ? '🇧🇦' : 
                                 emojiNative === '🏊‍♂️' ? '🏊‍♂️' : 
                                 emojiNative === '☄️' ? '☄️' : 
                                 emojiNative === '🛜' ? '🛜' : 
                                 emojiNative === '🍥' ? '🍥' : 
                                 emojiNative === '🌀' ? '🌀' : 
                                 emojiNative === '😋' ? '😋' : 
                                 emojiNative === '🏺' ? '🏺' : 
                                 emojiNative === '🏈' ? '🏈' : 
                                 emojiNative === '🚑' ? '🚑' : 
                                 emojiNative === '🌡️' ? '🌡️' : 
                                 emojiNative === '🤣' ? '🤣' : 
                                 emojiNative === '🤒' ? '🤒' : 
                                 emojiNative === '🍧' ? '🍧' : 
                                 emojiNative === '🈶' ? '🈶' : 
                                 '❓';
                
                console.log('Final emojiNative:', emojiNative);
                console.log('Final emojiName:', emojiName);
                
                return `
                    <button class="suggested-emoji-btn" 
                            data-emoji="${emojiNative}" 
                            data-name="${emojiName}"
                            title="${tooltip}">
                        ${emojiNative}
                    </button>
                `;
            }).join('');
            
            suggestedContainer.innerHTML = `
                <div class="suggested-emojis-title">Предложенные эмодзи (${emojis.length}):</div>
                <div class="suggested-emojis-list">${emojisHtml}</div>
            `;
            
            console.log('Generated HTML:', suggestedContainer.innerHTML);
            
            // Добавляем обработчики клика
            suggestedContainer.querySelectorAll('.suggested-emoji-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    const emoji = this.dataset.emoji;
                    const name = this.dataset.name;
                    console.log(`Selected emoji: ${emoji} (${name})`);
                    
                    // Добавляем эмодзи к фрагменту
                    const currentEmojis = fragment.dataset.emojis ? fragment.dataset.emojis.split(',') : [];
                    if (!currentEmojis.includes(emoji)) {
                        currentEmojis.push(emoji);
                        fragment.dataset.emojis = currentEmojis.join(',');
                        
                        // Обновляем отображение эмодзи фрагмента
                        updateFragmentEmojis(fragment);
                    }
                    
                    // Удаляем предложения после выбора
                    suggestedContainer.remove();
                });
            });
        }
    }
}

// Функция для обновления отображения эмодзи фрагмента
function updateFragmentEmojis(fragment) {
    const emojis = fragment.dataset.emojis ? fragment.dataset.emojis.split(',') : [];
    
    // Находим контейнер для эмодзи фрагмента
    let emojiContainer = fragment.querySelector('.fragment-emojis');
    if (!emojiContainer) {
        emojiContainer = document.createElement('div');
        emojiContainer.className = 'fragment-emojis';
        fragment.appendChild(emojiContainer);
    }
    
    // Обновляем содержимое
    if (emojis.length > 0) {
        emojiContainer.innerHTML = `
            <div class="fragment-emojis-title">Эмодзи:</div>
            <div class="fragment-emojis-list">
                ${emojis.map(emoji => `
                    <span class="fragment-emoji" title="Удалить">${emoji}</span>
                `).join('')}
            </div>
        `;
        
        // Добавляем обработчики для удаления эмодзи
        emojiContainer.querySelectorAll('.fragment-emoji').forEach(emojiSpan => {
            emojiSpan.addEventListener('click', () => {
                const emojiToRemove = emojiSpan.textContent;
                const currentEmojis = fragment.dataset.emojis ? fragment.dataset.emojis.split(',') : [];
                const updatedEmojis = currentEmojis.filter(emoji => emoji !== emojiToRemove);
                fragment.dataset.emojis = updatedEmojis.join(',');
                updateFragmentEmojis(fragment);
            });
        });
    } else {
        emojiContainer.innerHTML = '';
    }
}

// Утилитарная функция экранирования HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}