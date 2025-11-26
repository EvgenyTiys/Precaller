// JavaScript для страницы истории тренировок

let currentTextId = null;
let currentText = null;
let currentFragmentId = null;
let currentFragment = null;
let currentFragments = null; // Сохраняем загруженные фрагменты

document.addEventListener('DOMContentLoaded', function() {
    checkAuthentication();
    initializeHandlers();
    loadAvailableTexts();
});

function checkAuthentication() {
    const savedToken = localStorage.getItem('authToken');
    const savedUser = localStorage.getItem('currentUser');
    
    if (!savedToken || !savedUser) {
        window.location.href = '/';
        return;
    }
    
    const currentUser = JSON.parse(savedUser);
    
    // Обновляем интерфейс
    const username = document.getElementById('username');
    if (username) {
        username.textContent = currentUser.username;
    }
}

function initializeHandlers() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('authToken');
            localStorage.removeItem('currentUser');
            window.location.href = '/';
        });
    }

    const backToTextsBtn = document.getElementById('backToTextsBtn');
    if (backToTextsBtn) {
        backToTextsBtn.addEventListener('click', () => {
            showTextSelection();
        });
    }

    const backToFragmentsBtn = document.getElementById('backToFragmentsBtn');
    if (backToFragmentsBtn) {
        backToFragmentsBtn.addEventListener('click', () => {
            // Восстанавливаем список фрагментов из сохраненных данных
            if (currentFragments && currentText) {
                showFragmentSelection(currentFragments, currentText.title);
            } else if (currentTextId && currentText) {
                // Если фрагменты не сохранены, перезагружаем их
                selectText(currentTextId, currentText.title);
            } else {
                // Если нет данных, возвращаемся к выбору текстов
                showTextSelection();
            }
        });
    }
}

// Загрузка доступных текстов
async function loadAvailableTexts() {
    const textsList = document.getElementById('textsList');
    if (!textsList) return;

    try {
        if (!window.app) {
            throw new Error('Приложение не загружено. Перезагрузите страницу.');
        }

        window.app.showLoader();

        const response = await window.app.apiRequest('/api/training/available');
        const texts = response.texts;

        if (texts.length === 0) {
            textsList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-file-text" style="font-size: 3rem; color: #ccc; margin-bottom: 1rem;"></i>
                    <h3>У вас пока нет текстов</h3>
                    <p>Загрузите тексты и пройдите тренировки, чтобы увидеть историю</p>
                    <a href="/" class="btn btn-primary">Перейти к загрузке</a>
                </div>
            `;
            return;
        }

        textsList.innerHTML = '';
        texts.forEach(text => {
            const item = document.createElement('div');
            item.className = 'text-item';
            item.addEventListener('click', () => selectText(text.id, text.title));

            const title = document.createElement('h3');
            title.textContent = text.title;

            const stats = document.createElement('div');
            stats.className = 'text-stats';
            stats.innerHTML = `
                <span><i class="fas fa-puzzle-piece"></i> ${text.fragmentCount} фрагментов</span>
                <span><i class="fas fa-calendar"></i> ${formatDate(text.createdAt)}</span>
            `;

            item.appendChild(title);
            item.appendChild(stats);
            textsList.appendChild(item);
        });

    } catch (error) {
        console.error('Ошибка загрузки текстов:', error);
        if (window.app && window.app.showNotification) {
            window.app.showNotification(error.message || 'Ошибка загрузки текстов', 'error');
        }
    } finally {
        if (window.app && window.app.hideLoader) {
            window.app.hideLoader();
        }
    }
}

// Выбор текста
async function selectText(textId, textTitle) {
    currentTextId = textId;
    currentText = { id: textId, title: textTitle };

    try {
        if (!window.app) {
            throw new Error('Приложение не загружено. Перезагрузите страницу.');
        }

        window.app.showLoader();

        // Загружаем фрагменты текста
        const response = await window.app.apiRequest(`/api/wizard/text/${textId}`);
        const fragments = response.fragments || [];

        if (fragments.length === 0) {
            if (window.app && window.app.showNotification) {
                window.app.showNotification('У этого текста нет фрагментов', 'error');
            }
            return;
        }

        // Сохраняем фрагменты для последующего использования
        currentFragments = fragments;
        showFragmentSelection(fragments, textTitle);

    } catch (error) {
        console.error('Ошибка загрузки фрагментов:', error);
        if (window.app && window.app.showNotification) {
            window.app.showNotification(error.message || 'Ошибка загрузки фрагментов', 'error');
        }
    } finally {
        if (window.app && window.app.hideLoader) {
            window.app.hideLoader();
        }
    }
}

// Показать выбор фрагментов
function showFragmentSelection(fragments, textTitle) {
    const textSelection = document.getElementById('textSelection');
    const fragmentSelection = document.getElementById('fragmentSelection');
    const historyView = document.getElementById('historyView');

    if (textSelection) textSelection.style.display = 'none';
    if (fragmentSelection) fragmentSelection.style.display = 'block';
    if (historyView) historyView.style.display = 'none';

    const selectedTextTitle = document.getElementById('selectedTextTitle');
    if (selectedTextTitle) {
        selectedTextTitle.textContent = textTitle;
    }

    const fragmentsList = document.getElementById('fragmentsList');
    if (!fragmentsList) return;

    fragmentsList.innerHTML = '';

    fragments.forEach((fragment, index) => {
        const item = document.createElement('div');
        item.className = 'fragment-item';
        item.addEventListener('click', () => selectFragment(fragment.id, fragment.content, index + 1));

        const number = document.createElement('div');
        number.className = 'fragment-number';
        number.textContent = `Фрагмент ${index + 1}`;

        const preview = document.createElement('div');
        preview.className = 'fragment-preview';
        const previewText = fragment.content.length > 100 
            ? fragment.content.substring(0, 100) + '...' 
            : fragment.content;
        preview.textContent = previewText;

        item.appendChild(number);
        item.appendChild(preview);
        fragmentsList.appendChild(item);
    });
}

// Выбор фрагмента
async function selectFragment(fragmentId, fragmentContent, fragmentNumber) {
    currentFragmentId = fragmentId;
    currentFragment = { id: fragmentId, content: fragmentContent, number: fragmentNumber };

    try {
        if (!window.app) {
            throw new Error('Приложение не загружено. Перезагрузите страницу.');
        }

        window.app.showLoader();

        // Загружаем историю ввода фрагмента
        const response = await window.app.apiRequest(`/api/training/fragment/${fragmentId}/history`);
        const inputs = response.inputs || [];
        const originalText = response.fragment?.content || fragmentContent;

        showHistoryView(originalText, fragmentNumber, inputs);

    } catch (error) {
        console.error('Ошибка загрузки истории:', error);
        if (window.app && window.app.showNotification) {
            window.app.showNotification(error.message || 'Ошибка загрузки истории', 'error');
        }
    } finally {
        if (window.app && window.app.hideLoader) {
            window.app.hideLoader();
        }
    }
}

// Показать историю ввода
function showHistoryView(originalText, fragmentNumber, inputs) {
    const fragmentSelection = document.getElementById('fragmentSelection');
    const historyView = document.getElementById('historyView');

    if (fragmentSelection) fragmentSelection.style.display = 'none';
    if (historyView) historyView.style.display = 'block';

    // Обновляем заголовок
    const historyFragmentTitle = document.getElementById('historyFragmentTitle');
    const fragmentNumberSpan = document.getElementById('fragmentNumber');
    if (historyFragmentTitle && fragmentNumberSpan) {
        fragmentNumberSpan.textContent = fragmentNumber;
    }

    // Отображаем оригинальный текст
    const originalTextElement = document.getElementById('originalText');
    if (originalTextElement) {
        originalTextElement.textContent = originalText;
    }

    // Отображаем историю ввода
    const inputsHistory = document.getElementById('inputsHistory');
    if (!inputsHistory) return;

    inputsHistory.innerHTML = '';

    if (inputs.length === 0) {
        inputsHistory.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-history" style="font-size: 3rem; color: #ccc; margin-bottom: 1rem;"></i>
                <h3>История пуста</h3>
                <p>Для этого фрагмента пока нет истории ввода</p>
            </div>
        `;
        return;
    }

    // Сортируем по дате (от последней к первой)
    const sortedInputs = [...inputs].sort((a, b) => {
        return new Date(b.sessionCreatedAt || b.createdAt) - new Date(a.sessionCreatedAt || a.createdAt);
    });

    sortedInputs.forEach((input, index) => {
        const inputItem = document.createElement('div');
        inputItem.className = 'input-item';

        // Вычисляем Манхэттенское расстояние
        const distance = HistoryUtils.manhattanDistance(originalText, input.userInput);

        // Выравниваем тексты на уровне слов (слова не разрываются)
        const aligned = HistoryUtils.wordLevelAlign(originalText, input.userInput);

        // Заголовок с датой и расстоянием
        const header = document.createElement('div');
        header.className = 'input-header';
        header.innerHTML = `
            <span class="input-date">${formatDate(input.sessionCreatedAt || input.createdAt)}</span>
            <span class="input-distance">Манхэттенское расстояние: <strong>${distance}</strong></span>
        `;

        // Выровненный текст
        const alignedContainer = document.createElement('div');
        alignedContainer.className = 'aligned-text-container';

        // Оригинал (для сравнения)
        const originalAligned = document.createElement('div');
        originalAligned.className = 'aligned-text original-aligned';
        originalAligned.textContent = aligned.alignedOriginal;

        // Введенный текст с подсветкой различий
        const inputAligned = document.createElement('div');
        inputAligned.className = 'aligned-text input-aligned';
        
        // Создаем элементы для каждого символа с подсветкой
        const inputChars = Array.from(aligned.alignedInput);
        aligned.operations.forEach((op, i) => {
            const span = document.createElement('span');
            span.textContent = inputChars[i] || ' ';
            
            if (op.type === 'match') {
                span.className = 'char-match';
            } else if (op.type === 'delete') {
                span.className = 'char-delete';
            } else if (op.type === 'insert') {
                span.className = 'char-insert';
            } else if (op.type === 'replace') {
                span.className = 'char-replace';
            }
            
            inputAligned.appendChild(span);
        });

        alignedContainer.appendChild(originalAligned);
        alignedContainer.appendChild(inputAligned);

        inputItem.appendChild(header);
        inputItem.appendChild(alignedContainer);
        inputsHistory.appendChild(inputItem);
    });
}

// Показать выбор текстов
function showTextSelection() {
    const textSelection = document.getElementById('textSelection');
    const fragmentSelection = document.getElementById('fragmentSelection');
    const historyView = document.getElementById('historyView');

    if (textSelection) textSelection.style.display = 'block';
    if (fragmentSelection) fragmentSelection.style.display = 'none';
    if (historyView) historyView.style.display = 'none';

    currentTextId = null;
    currentText = null;
    currentFragmentId = null;
    currentFragment = null;
    currentFragments = null; // Очищаем сохраненные фрагменты
}

// Форматирование даты
function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

