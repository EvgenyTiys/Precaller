// JavaScript для страницы истории тренировок

let currentTextId = null;
let currentText = null;
let currentFragmentId = null;
let currentFragment = null;
let currentFragments = null; // Сохраняем загруженные фрагменты
let distanceChartInstance = null; // Экземпляр графика расстояний

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
async function showFragmentSelection(fragments, textTitle) {
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

    // Загружаем и отображаем график расстояний
    await loadAndDisplayDistanceChart();
}

// Загрузка и отображение графика суммарного Манхеттенского расстояния
async function loadAndDisplayDistanceChart() {
    if (!currentTextId) return;

    try {
        if (!window.app) {
            throw new Error('Приложение не загружено. Перезагрузите страницу.');
        }

        // Уничтожаем предыдущий график, если он существует
        if (distanceChartInstance) {
            distanceChartInstance.destroy();
            distanceChartInstance = null;
        }

        // Загружаем данные графика
        const response = await window.app.apiRequest(`/api/training/text/${currentTextId}/distance-chart`);
        const chartData = response.data || [];

        const chartContainer = document.getElementById('distanceChartContainer');
        const chartCanvas = document.getElementById('distanceChart');
        
        if (!chartContainer || !chartCanvas) return;

        if (chartData.length === 0) {
            chartContainer.innerHTML = '<p>Нет данных для отображения графика</p>';
            return;
        }

        // Подготавливаем данные для графика
        const labels = chartData.map(item => new Date(item.createdAt));
        const distances = chartData.map(item => item.totalDistance);

        // Создаем график
        const ctx = chartCanvas.getContext('2d');
        distanceChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Суммарное Манхеттенское расстояние',
                    data: distances,
                    borderColor: '#667eea',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        callbacks: {
                            title: function(context) {
                                return new Date(context[0].label).toLocaleString('ru-RU');
                            },
                            label: function(context) {
                                return `Расстояние: ${context.parsed.y}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        type: 'time',
                        time: {
                            unit: 'day',
                            displayFormats: {
                                day: 'dd.MM.yyyy'
                            }
                        },
                        title: {
                            display: true,
                            text: 'Дата тренировки'
                        }
                    },
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Суммарное расстояние'
                        }
                    }
                }
            }
        });

    } catch (error) {
        console.error('Ошибка загрузки графика расстояний:', error);
        const chartContainer = document.getElementById('distanceChartContainer');
        if (chartContainer) {
            chartContainer.innerHTML = '<p>Ошибка загрузки данных графика</p>';
        }
    }
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

    // Множественное выравнивание всех текстов
    const alignedTexts = HistoryUtils.multipleAlignment(originalText, inputs);

    // Создаем контейнер с горизонтальной прокруткой
    const scrollContainer = document.createElement('div');
    scrollContainer.className = 'alignment-scroll-container';

    // Создаем таблицу для выравнивания
    const alignmentTable = document.createElement('div');
    alignmentTable.className = 'alignment-table';

    // Добавляем строки для каждого текста
    alignedTexts.forEach((aligned, index) => {
        const row = document.createElement('div');
        row.className = 'alignment-row';

        // Левая часть с меткой
        const labelContainer = document.createElement('div');
        labelContainer.className = 'alignment-label-container';

        const label = document.createElement('div');
        label.className = 'alignment-label';
        if (aligned.isOriginal) {
            label.textContent = 'Оригинал';
            label.classList.add('label-original');
        } else {
            label.textContent = formatDate(aligned.sessionCreatedAt || aligned.createdAt);
            label.classList.add('label-input');
        }

        labelContainer.appendChild(label);

        // Средняя часть с выровненным текстом
        const textContainer = document.createElement('div');
        textContainer.className = 'alignment-text-container';

        if (aligned.isOriginal) {
            // Оригинальный текст без подсветки (все символы совпадают)
            const textSpan = document.createElement('span');
            textSpan.className = 'aligned-text-line original-line';
            textSpan.textContent = aligned.aligned;
            textContainer.appendChild(textSpan);
        } else {
            // Введенный текст с подсветкой различий
            const textSpan = document.createElement('span');
            textSpan.className = 'aligned-text-line input-line';
            
            // Создаем элементы для каждого символа с подсветкой
            const textChars = Array.from(aligned.aligned);
            aligned.operations.forEach((op, i) => {
                const charSpan = document.createElement('span');
                charSpan.textContent = textChars[i] || ' ';
                
                if (op.type === 'match' || op.type === 'space') {
                    charSpan.className = 'char-match';
                } else if (op.type === 'delete') {
                    charSpan.className = 'char-delete';
                } else if (op.type === 'insert') {
                    charSpan.className = 'char-insert';
                } else if (op.type === 'replace') {
                    charSpan.className = 'char-replace';
                }
                
                textSpan.appendChild(charSpan);
            });

            textContainer.appendChild(textSpan);
        }

        // Правая часть с расстоянием
        const distanceContainer = document.createElement('div');
        distanceContainer.className = 'alignment-distance-container';
        
        if (aligned.isOriginal) {
            // Для оригинального текста добавляем заголовок "d"
            const distanceHeader = document.createElement('div');
            distanceHeader.className = 'alignment-distance-header';
            distanceHeader.textContent = 'd';
            distanceContainer.appendChild(distanceHeader);
            
            const distanceValue = document.createElement('div');
            distanceValue.className = 'alignment-distance-value';
            distanceValue.textContent = '—';
            distanceContainer.appendChild(distanceValue);
        } else {
            // Для остальных строк добавляем только значение
            const distanceValue = document.createElement('div');
            distanceValue.className = 'alignment-distance-value';
            distanceValue.textContent = aligned.distance;
            distanceContainer.appendChild(distanceValue);
        }

        row.appendChild(labelContainer);
        row.appendChild(textContainer);
        row.appendChild(distanceContainer);
        alignmentTable.appendChild(row);
    });

    scrollContainer.appendChild(alignmentTable);
    inputsHistory.appendChild(scrollContainer);
}

// Показать выбор текстов
function showTextSelection() {
    const textSelection = document.getElementById('textSelection');
    const fragmentSelection = document.getElementById('fragmentSelection');
    const historyView = document.getElementById('historyView');

    if (textSelection) textSelection.style.display = 'block';
    if (fragmentSelection) fragmentSelection.style.display = 'none';
    if (historyView) historyView.style.display = 'none';

    // Уничтожаем график при возврате к выбору текстов
    if (distanceChartInstance) {
        distanceChartInstance.destroy();
        distanceChartInstance = null;
    }

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

