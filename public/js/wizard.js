// JavaScript для мастера запоминания

let currentTextId = null;
let currentText = null;
let currentFragments = [];
let currentFragmentIndex = 0;
let textFragments = []; // Фрагменты, созданные пользователем
let allEmojis = [];

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
    
    // Шаг 3: Навигация
    const backToStep2 = document.getElementById('backToStep2');
    const finishWizard = document.getElementById('finishWizard');
    
    if (backToStep2) {
        backToStep2.addEventListener('click', () => showStep(2));
    }
    
    if (finishWizard) {
        finishWizard.addEventListener('click', handleFinishWizard);
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
    const routeDescription = document.getElementById('routeDescription').value.trim();
    
    if (!routeDescription) {
        window.app.showNotification('Опишите ваш маршрут', 'error');
        return;
    }
    
    if (routeDescription.length < 50) {
        window.app.showNotification('Описание маршрута должно быть более подробным (минимум 50 символов)', 'error');
        return;
    }
    
    try {
        window.app.showLoader();
        
        await window.app.apiRequest('/api/wizard/route', {
            method: 'POST',
            body: JSON.stringify({
                textId: currentTextId,
                routeDescription: routeDescription
            })
        });
        
        window.app.showNotification('Маршрут сохранен!', 'success');
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
    
    // Инициализируем выделение текста
    textContent.addEventListener('click', handleTextClick);
    textContent.style.cursor = 'text';
    
    updateFragmentInfo();
}

// Обработка клика по тексту для создания фрагментов
function handleTextClick(event) {
    const textContent = event.currentTarget;
    const selection = window.getSelection();
    const range = selection.getRangeAt(0);
    const offset = range.startOffset;
    
    // Находим позицию клика в тексте
    const clickPosition = getClickPosition(event, textContent);
    
    if (clickPosition !== null) {
        createFragment(clickPosition);
    }
}

// Получение позиции клика в тексте
function getClickPosition(event, textElement) {
    const range = document.caretRangeFromPoint(event.clientX, event.clientY);
    if (!range) return null;
    
    const textContent = textElement.textContent;
    let position = 0;
    
    // Проходим по всем текстовым узлам до позиции клика
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
}

// Создание фрагмента
function createFragment(endPosition) {
    const textContent = document.getElementById('textContent');
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
    
    // Обновляем отображение
    displayFragments();
    updateFragmentInfo();
    
    // Проверяем, остался ли текст
    if (endPosition < fullText.length) {
        // Есть еще текст
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
        
        // Добавляем фрагмент
        html += `<span class="text-fragment" data-fragment-number="${fragment.order}">
            ${escapeHtml(fragment.content)}
            <button class="fragment-edit-btn" onclick="editFragment(${index})">✎</button>
        </span>`;
        
        lastPosition = fragment.endPos;
    });
    
    // Добавляем оставшийся текст
    if (lastPosition < fullText.length) {
        html += escapeHtml(fullText.substring(lastPosition));
    }
    
    textContent.innerHTML = html;
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
        
        // Обновляем currentFragments
        currentFragments = textFragments.map(f => ({
            id: f.id || null,
            fragment_order: f.order,
            content: f.content,
            start_position: f.startPos,
            end_position: f.endPos
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
    
    // Загружаем все смайлики
    await loadAllEmojis();
    
    // Начинаем с первого фрагмента
    currentFragmentIndex = 0;
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

// Показать текущий фрагмент
async function showCurrentFragment() {
    if (currentFragmentIndex >= currentFragments.length) {
        // Все фрагменты обработаны
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
    
    if (associationInstruction) {
        if (currentFragmentIndex === 0) {
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

// Загрузка предложенных смайликов
async function loadSuggestedEmojis(fragmentText) {
    const suggestedEmojis = document.getElementById('suggestedEmojis');
    
    if (!suggestedEmojis) return;
    
    try {
        const response = await window.app.apiRequest('/api/wizard/emojis', {
            method: 'POST',
            body: JSON.stringify({
                fragmentText: fragmentText,
                language: currentText.language
            })
        });
        
        const emojis = response.emojis;
        
        suggestedEmojis.innerHTML = emojis.map(emoji => `
            <button class="emoji-btn" onclick="selectEmoji('${emoji.emoji}')">
                ${emoji.emoji}
            </button>
        `).join('');
        
    } catch (error) {
        console.error('Load suggested emojis error:', error);
        suggestedEmojis.innerHTML = '<p>Ошибка загрузки смайликов</p>';
    }
}

// Выбор смайлика
async function selectEmoji(emoji) {
    try {
        const fragment = currentFragments[currentFragmentIndex];
        
        await window.app.apiRequest('/api/wizard/associate', {
            method: 'POST',
            body: JSON.stringify({
                fragmentId: fragment.id,
                emoji: emoji
            })
        });
        
        // Добавляем смайлик в цепочку
        addToStoryChain(emoji);
        
        // Переходим к следующему фрагменту
        currentFragmentIndex++;
        showCurrentFragment();
        
    } catch (error) {
        console.error('Select emoji error:', error);
        window.app.showNotification(error.message || 'Ошибка выбора смайлика', 'error');
    }
}

// Добавление в цепочку рассказа
function addToStoryChain(association) {
    const chainLine = document.getElementById('chainLine');
    if (!chainLine) return;
    
    const chainEmoji = document.createElement('div');
    chainEmoji.className = 'chain-emoji';
    chainEmoji.textContent = association;
    chainEmoji.onclick = () => editFragmentAssociation(currentFragmentIndex - 1);
    
    chainLine.appendChild(chainEmoji);
}

// Показать пользовательские ассоциации
function showCustomAssociation() {
    const customAssociation = document.getElementById('customAssociation');
    if (customAssociation) {
        customAssociation.style.display = 'block';
        
        // Загружаем все смайлики в первую вкладку
        loadAllEmojisTab();
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
    const allEmojisContainer = document.getElementById('allEmojis');
    if (!allEmojisContainer) return;
    
    allEmojisContainer.innerHTML = allEmojis.map(emoji => `
        <button class="emoji-btn" onclick="selectCustomEmoji('${emoji.emoji}')">
            ${emoji.emoji}
        </button>
    `).join('');
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
    const activeTab = document.querySelector('.tab-content[style*="block"]');
    if (!activeTab || activeTab.id !== 'imageTab') return;
    
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
        const maxWidth = 300;
        const maxHeight = 200;
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
        
        // Сохраняем изображение
        window.selectedCustomImage = canvas.toDataURL();
    };
    
    img.src = URL.createObjectURL(blob);
}

// Обработка пользовательской ассоциации
async function handleCustomAssociation() {
    const activeTab = document.querySelector('.tab-btn.active').dataset.tab;
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
    
    try {
        const fragment = currentFragments[currentFragmentIndex];
        
        await window.app.apiRequest('/api/wizard/associate', {
            method: 'POST',
            body: JSON.stringify({
                fragmentId: fragment.id,
                ...associationData
            })
        });
        
        // Добавляем в цепочку
        const association = associationData.emoji || associationData.customWord || '🖼️';
        addToStoryChain(association);
        
        // Скрываем пользовательские ассоциации
        hideCustomAssociation();
        
        // Переходим к следующему фрагменту
        currentFragmentIndex++;
        showCurrentFragment();
        
        // Очищаем выбор
        window.selectedCustomEmoji = null;
        window.selectedCustomImage = null;
        document.getElementById('customWord').value = '';
        
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
    currentFragmentIndex = fragmentIndex;
    showCurrentFragment();
}

// Утилитарная функция экранирования HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}