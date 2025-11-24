// JavaScript для главной страницы

document.addEventListener('DOMContentLoaded', function() {
    initializeMainPage();
});

function initializeMainPage() {
    // Проверяем аутентификацию при загрузке
    checkAuthenticationOnLoad();
    
    // Инициализируем обработчики меню
    initializeMenuHandlers();
    
    // Инициализируем обработчики форм
    initializeFormHandlers();
}

// Проверка аутентификации при загрузке страницы
function checkAuthenticationOnLoad() {
    const savedToken = localStorage.getItem('authToken');
    const savedUser = localStorage.getItem('currentUser');
    
    if (savedToken && savedUser) {
        // Пользователь аутентифицирован
        currentUser = JSON.parse(savedUser);
        authToken = savedToken;
        
        const welcomeScreen = document.getElementById('welcomeScreen');
        const mainMenu = document.getElementById('mainMenu');
        
        if (welcomeScreen && mainMenu) {
            welcomeScreen.style.display = 'none';
            mainMenu.style.display = 'block';
        }
        
        window.app.updateUIForAuthenticatedUser();
    }
}

// Инициализация обработчиков меню
function initializeMenuHandlers() {
    // Опции главного меню
    const uploadTextOption = document.getElementById('uploadTextOption');
    const selectTextOption = document.getElementById('selectTextOption');
    const trainingOption = document.getElementById('trainingOption');
    const statisticsOption = document.getElementById('statisticsOption');
    const textsLink = document.getElementById('textsLink');
    const trainingLink = document.getElementById('trainingLink');
    
    if (uploadTextOption) {
        uploadTextOption.addEventListener('click', showUploadForm);
    }
    
    if (selectTextOption) {
        selectTextOption.addEventListener('click', showTextsList);
    }
    
    if (trainingOption) {
        trainingOption.addEventListener('click', function() {
            window.location.href = '/training';
        });
    }
    
    if (statisticsOption) {
        statisticsOption.addEventListener('click', function() {
            window.location.href = '/statistics';
        });
    }
    
    // Ссылки в хедере: "Мои тексты" и "Тренировка"
    if (textsLink) {
        textsLink.addEventListener('click', function(e) {
            e.preventDefault();
            showTextsList();
        });
    }
    
    if (trainingLink) {
        trainingLink.addEventListener('click', function(e) {
            // Перехватываем только пустые ссылки типа '#'
            if (trainingLink.getAttribute('href') === '#' || trainingLink.getAttribute('href') === '') {
                e.preventDefault();
                showTrainingList();
            }
        });
    }
    
    // Кнопки навигации
    const cancelUpload = document.getElementById('cancelUpload');
    const backToMenu = document.getElementById('backToMenu');
    const backToMenuFromTraining = document.getElementById('backToMenuFromTraining');
    
    if (cancelUpload) {
        cancelUpload.addEventListener('click', showMainMenu);
    }
    
    if (backToMenu) {
        backToMenu.addEventListener('click', showMainMenu);
    }
    
    if (backToMenuFromTraining) {
        backToMenuFromTraining.addEventListener('click', showMainMenu);
    }
}

// Инициализация обработчиков форм
function initializeFormHandlers() {
    const textUploadForm = document.getElementById('textUploadForm');
    
    if (textUploadForm) {
        textUploadForm.addEventListener('submit', handleTextUpload);
    }
}

// Показать форму загрузки текста
function showUploadForm() {
    const mainMenu = document.getElementById('mainMenu');
    const uploadForm = document.getElementById('uploadForm');
    
    if (mainMenu && uploadForm) {
        mainMenu.style.display = 'none';
        uploadForm.style.display = 'block';
        uploadForm.classList.add('fade-in');
        
        // Фокус на первое поле
        const titleField = document.getElementById('textTitle');
        if (titleField) {
            titleField.focus();
        }
    }
}

// Показать список текстов
async function showTextsList() {
    const mainMenu = document.getElementById('mainMenu');
    const textsList = document.getElementById('textsList');
    
    if (mainMenu && textsList) {
        mainMenu.style.display = 'none';
        textsList.style.display = 'block';
        textsList.classList.add('fade-in');
        
        // Загружаем тексты
        await loadUserTexts();
    }
}

// Показать список текстов для тренировки
async function showTrainingList() {
    const mainMenu = document.getElementById('mainMenu');
    const trainingList = document.getElementById('trainingList');
    
    if (mainMenu && trainingList) {
        mainMenu.style.display = 'none';
        trainingList.style.display = 'block';
        trainingList.classList.add('fade-in');
        
        // Загружаем тексты для тренировки
        await loadTrainingTexts();
    }
}

// Показать главное меню
function showMainMenu() {
    const sections = ['uploadForm', 'textsList', 'trainingList'];
    const mainMenu = document.getElementById('mainMenu');
    
    sections.forEach(sectionId => {
        const section = document.getElementById(sectionId);
        if (section) {
            section.style.display = 'none';
        }
    });
    
    if (mainMenu) {
        mainMenu.style.display = 'block';
        mainMenu.classList.add('fade-in');
    }
}

// Обработка загрузки текста
async function handleTextUpload(event) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);
    const title = formData.get('title').trim();
    const content = formData.get('content').trim();
    const language = formData.get('language');
    
    // Валидация
    if (!title) {
        window.app.showNotification('Введите название текста', 'error');
        return;
    }
    
    if (!content) {
        window.app.showNotification('Введите содержимое текста', 'error');
        return;
    }
    
    if (content.length < 50) {
        window.app.showNotification('Текст должен содержать минимум 50 символов', 'error');
        return;
    }
    
    try {
        window.app.showLoader();
        
        const response = await window.app.apiRequest('/api/texts/upload', {
            method: 'POST',
            body: JSON.stringify({ title, content, language })
        });
        
        window.app.showNotification('Текст успешно загружен!', 'success');
        
        // Переходим к мастеру
        window.location.href = `/wizard.html?textId=${response.textId}`;
        
    } catch (error) {
        console.error('Upload error:', error);
        window.app.showNotification(error.message || 'Ошибка загрузки текста', 'error');
    } finally {
        window.app.hideLoader();
    }
}

// Загрузка текстов пользователя
async function loadUserTexts() {
    const container = document.getElementById('textsContainer');
    
    if (!container) return;
    
    try {
        window.app.showLoader();
        
        const response = await window.app.apiRequest('/api/texts/');
        const texts = response.texts;
        
        if (texts.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-file-text" style="font-size: 3rem; color: #ccc; margin-bottom: 1rem;"></i>
                    <h3>У вас пока нет текстов</h3>
                    <p>Загрузите первый текст, чтобы начать работу с приложением</p>
                    <button class="btn btn-primary" onclick="showUploadForm()">Загрузить текст</button>
                </div>
            `;
            return;
        }
        
        const htmlContent = texts.map(text => {
            const escapedTitle = escapeHtml(text.title);
            return `
                <div class="text-item">
                    <h3>
                        <div class="text-title-container">
                            <span class="text-title-display">${escapedTitle}</span>
                            <i class="fas fa-edit edit-title-icon" onclick="startEditTitle(${text.id}, '${escapedTitle.replace(/'/g, "\\'")}')" title="Редактировать название"></i>
                        </div>
                    </h3>
                    <div class="text-meta">
                        <span>Язык: ${getLanguageName(text.language)}</span>
                        <span>Создан: ${window.app.formatDate(text.created_at)}</span>
                    </div>
                    <div class="text-preview">
                        ${escapeHtml(text.content.substring(0, 150))}${text.content.length > 150 ? '...' : ''}
                    </div>
                    <div class="text-actions">
                        <button class="btn btn-primary" onclick="openWizard(${text.id})">
                            <i class="fas fa-magic"></i> Мастер
                        </button>
                        <button class="btn btn-secondary" onclick="viewText(${text.id})">
                            <i class="fas fa-eye"></i> Просмотр
                        </button>
                        <button class="btn btn-danger" onclick="deleteText(${text.id}, '${escapedTitle.replace(/'/g, "\\'")}')">
                            <i class="fas fa-trash"></i> Удалить
                        </button>
                    </div>
                </div>
            `;
        }).join('');
        
        container.innerHTML = htmlContent;
        
    } catch (error) {
        console.error('Load texts error:', error);
        container.innerHTML = `
            <div class="error-state">
                <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: #dc3545; margin-bottom: 1rem;"></i>
                <h3>Ошибка загрузки</h3>
                <p>${error.message || 'Не удалось загрузить тексты'}</p>
                <button class="btn btn-primary" onclick="loadUserTexts()">Попробовать снова</button>
            </div>
        `;
    } finally {
        window.app.hideLoader();
    }
}

// Загрузка текстов для тренировки
async function loadTrainingTexts() {
    const container = document.getElementById('trainingTextsContainer');
    
    if (!container) return;
    
    try {
        window.app.showLoader();
        
        const response = await window.app.apiRequest('/api/training/available');
        const texts = response.texts;
        
        if (texts.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-brain" style="font-size: 3rem; color: #ccc; margin-bottom: 1rem;"></i>
                    <h3>Нет готовых текстов для тренировки</h3>
                    <p>Сначала загрузите тексты и пройдите мастер настройки</p>
                    <button class="btn btn-primary" onclick="showUploadForm()">Загрузить текст</button>
                </div>
            `;
            return;
        }
        
        container.innerHTML = texts.map(text => `
            <div class="training-text-item" onclick="startTraining(${text.id})">
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
        console.error('Load training texts error:', error);
        container.innerHTML = `
            <div class="error-state">
                <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: #dc3545; margin-bottom: 1rem;"></i>
                <h3>Ошибка загрузки</h3>
                <p>${error.message || 'Не удалось загрузить тексты для тренировки'}</p>
                <button class="btn btn-primary" onclick="loadTrainingTexts()">Попробовать снова</button>
            </div>
        `;
    } finally {
        window.app.hideLoader();
    }
}

// Открыть мастер для текста
function openWizard(textId) {
    window.location.href = `/wizard.html?textId=${textId}`;
}

// Просмотр текста
async function viewText(textId) {
    try {
        window.app.showLoader();
        
        const response = await window.app.apiRequest(`/api/texts/${textId}`);
        const text = response.text;
        const fragments = response.fragments;
        
        let content = `
            <h3>${escapeHtml(text.title)}</h3>
            <p><strong>Язык:</strong> ${getLanguageName(text.language)}</p>
            <p><strong>Создан:</strong> ${window.app.formatDate(text.created_at)}</p>
            <div class="text-content-modal">
                ${escapeHtml(text.content).replace(/\n/g, '<br>')}
            </div>
        `;
        
        if (fragments && fragments.length > 0) {
            content += `
                <h4>Фрагменты (${fragments.length}):</h4>
                <div class="fragments-modal">
                    ${fragments.map((fragment, index) => `
                        <div class="fragment-modal">
                            <span class="fragment-number">${index + 1}</span>
                            <span class="fragment-text">${escapeHtml(fragment.content)}</span>
                            ${fragment.emoji ? `<span class="fragment-emoji">${fragment.emoji}</span>` : ''}
                            ${fragment.custom_word ? `<span class="fragment-word">${escapeHtml(fragment.custom_word)}</span>` : ''}
                        </div>
                    `).join('')}
                </div>
            `;
        }
        
        window.app.showModal(content, 'Просмотр текста');
        
    } catch (error) {
        console.error('View text error:', error);
        window.app.showNotification(error.message || 'Ошибка загрузки текста', 'error');
    } finally {
        window.app.hideLoader();
    }
}

// Начать тренировку
function startTraining(textId) {
    window.location.href = `/training.html?textId=${textId}`;
}

// Удаление текста
async function deleteText(textId, textTitle) {
    // Показываем подтверждение
    const confirmed = confirm(`Вы уверены, что хотите удалить текст "${textTitle}"?\n\nЭто действие нельзя отменить.`);
    
    if (!confirmed) {
        return;
    }
    
    try {
        window.app.showLoader();
        
        const response = await window.app.apiRequest(`/api/texts/${textId}`, {
            method: 'DELETE'
        });
        
        window.app.showNotification('Текст успешно удален', 'success');
        
        // Перезагружаем список текстов
        await loadUserTexts();
        
    } catch (error) {
        console.error('Delete text error:', error);
        window.app.showNotification(error.message || 'Ошибка удаления текста', 'error');
    } finally {
        window.app.hideLoader();
    }
}

// Утилитарные функции

// Экранирование HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Получить название языка
function getLanguageName(langCode) {
    const languages = {
        'ru': 'Русский',
        'en': 'English',
        'de': 'Deutsch'
    };
    return languages[langCode] || langCode;
}

// Добавляем стили для модальных окон с текстами
if (!document.querySelector('#text-modal-styles')) {
    const styles = document.createElement('style');
    styles.id = 'text-modal-styles';
    styles.textContent = `
        .text-content-modal {
            max-height: 300px;
            overflow-y: auto;
            padding: 1rem;
            background: #f8f9fa;
            border-radius: 8px;
            margin: 1rem 0;
            line-height: 1.6;
        }
        
        .fragments-modal {
            max-height: 200px;
            overflow-y: auto;
        }
        
        .fragment-modal {
            display: flex;
            align-items: center;
            gap: 1rem;
            padding: 0.5rem;
            margin-bottom: 0.5rem;
            background: #f8f9fa;
            border-radius: 6px;
        }
        
        .fragment-modal .fragment-number {
            background: #667eea;
            color: white;
            width: 24px;
            height: 24px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 0.8rem;
            font-weight: bold;
            flex-shrink: 0;
        }
        
        .fragment-modal .fragment-text {
            flex: 1;
            font-size: 0.9rem;
        }
        
        .fragment-modal .fragment-emoji {
            font-size: 1.5rem;
            flex-shrink: 0;
        }
        
        .fragment-modal .fragment-word {
            background: #667eea;
            color: white;
            padding: 0.25rem 0.5rem;
            border-radius: 4px;
            font-size: 0.8rem;
            font-weight: 500;
            flex-shrink: 0;
        }
        
        .empty-state,
        .error-state {
            text-align: center;
            padding: 3rem 2rem;
            color: #666;
        }
        
        .empty-state h3,
        .error-state h3 {
            margin-bottom: 1rem;
            color: #333;
        }
        
        .empty-state p,
        .error-state p {
            margin-bottom: 2rem;
            font-size: 1.1rem;
        }
    `;
    document.head.appendChild(styles);
}

// Функция для начала редактирования названия текста
function startEditTitle(textId, currentTitle) {
    const textItem = document.querySelector(`[onclick*="startEditTitle(${textId}"]`).closest('.text-item');
    const titleContainer = textItem.querySelector('.text-title-container');
    
    // Создаем форму редактирования
    titleContainer.innerHTML = `
        <input type="text" class="title-edit-input" value="${currentTitle}" maxlength="200">
        <div class="title-edit-actions">
            <button class="title-edit-btn title-edit-save" onclick="saveTitle(${textId})">
                <i class="fas fa-check"></i>
            </button>
            <button class="title-edit-btn title-edit-cancel" onclick="cancelEditTitle(${textId}, '${currentTitle.replace(/'/g, "\\'")}')">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    // Фокусируемся на поле ввода и выделяем весь текст
    const input = titleContainer.querySelector('.title-edit-input');
    input.focus();
    input.select();
    
    // Обработка нажатия Enter и Escape
    input.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            saveTitle(textId);
        } else if (e.key === 'Escape') {
            e.preventDefault();
            cancelEditTitle(textId, currentTitle);
        }
    });
}

// Функция для сохранения измененного названия
async function saveTitle(textId) {
    // Находим элемент по кнопке сохранения, а не по onclick
    const saveButton = document.querySelector(`[onclick="saveTitle(${textId})"]`);
    if (!saveButton) {
        console.error('Кнопка сохранения не найдена');
        return;
    }
    
    const textItem = saveButton.closest('.text-item');
    if (!textItem) {
        console.error('Элемент текста не найден');
        return;
    }
    
    const input = textItem.querySelector('.title-edit-input');
    if (!input) {
        console.error('Поле ввода не найдено');
        return;
    }
    
    const newTitle = input.value.trim();
    
    if (!newTitle) {
        window.app.showNotification('Название не может быть пустым', 'error');
        input.focus();
        return;
    }
    
    try {
        window.app.showLoader();
        
        const response = await window.app.apiRequest(`/api/texts/${textId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ title: newTitle })
        });
        
        if (response.message) {
            // Обновляем отображение названия
            const titleContainer = textItem.querySelector('.text-title-container');
            if (titleContainer) {
                titleContainer.innerHTML = `
                    <span class="text-title-display">${escapeHtml(newTitle)}</span>
                    <i class="fas fa-edit edit-title-icon" onclick="startEditTitle(${textId}, '${escapeHtml(newTitle).replace(/'/g, "\\'")}')" title="Редактировать название"></i>
                `;
            }
            
            window.app.showNotification('Название успешно обновлено', 'success');
        }
        
    } catch (error) {
        console.error('Ошибка обновления названия:', error);
        window.app.showNotification('Ошибка обновления названия', 'error');
    } finally {
        window.app.hideLoader();
    }
}

// Функция для отмены редактирования названия
function cancelEditTitle(textId, originalTitle) {
    // Находим элемент по кнопке отмены
    const cancelButton = document.querySelector(`[onclick*="cancelEditTitle(${textId}"]`);
    if (!cancelButton) {
        console.error('Кнопка отмены не найдена');
        return;
    }
    
    const textItem = cancelButton.closest('.text-item');
    if (!textItem) {
        console.error('Элемент текста не найден');
        return;
    }
    
    const titleContainer = textItem.querySelector('.text-title-container');
    if (!titleContainer) {
        console.error('Контейнер заголовка не найден');
        return;
    }
    
    // Возвращаем исходное отображение
    titleContainer.innerHTML = `
        <span class="text-title-display">${escapeHtml(originalTitle)}</span>
        <i class="fas fa-edit edit-title-icon" onclick="startEditTitle(${textId}, '${escapeHtml(originalTitle).replace(/'/g, "\\'")}')" title="Редактировать название"></i>
    `;
}