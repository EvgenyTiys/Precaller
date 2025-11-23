/**
 * FragmentManager - Менеджер для управления фрагментами текста
 * Единая точка управления состоянием фрагментов
 */
class FragmentManager {
    constructor(textId) {
        this.textId = textId;
        this.fragments = [];
        this.isDirty = false; // флаг несохраненных изменений
        this.isLoading = false;
        this.isSaving = false;
        this.operationInProgress = false; // защита от race conditions
    }
    
    /**
     * Загрузка фрагментов из БД (использует FragmentAPI с кэшированием - REF-11)
     */
    async load(forceReload = false) {
        if (this.isLoading) {
            console.warn('[FragmentManager] Load already in progress');
            return this.fragments;
        }
        
        this.isLoading = true;
        
        try {
            // Используем FragmentAPI с кэшированием
            const data = await FragmentAPI.loadText(this.textId, forceReload);
            const rawFragments = data.fragments || [];
            
            // Конвертируем в объекты Fragment и дедуплицируем
            this.fragments = this.deduplicate(
                rawFragments.map(f => new Fragment(f))
            );
            
            this.isDirty = false;
            console.log(`[FragmentManager] Loaded ${this.fragments.length} fragments`);
            return this.fragments;
        } catch (error) {
            console.error('[FragmentManager] Load error:', error);
            throw error;
        } finally {
            this.isLoading = false;
        }
    }
    
    /**
     * Сохранение фрагментов в БД (использует FragmentAPI - REF-05)
     */
    async save() {
        if (this.fragments.length === 0) {
            throw new Error('Создайте хотя бы один фрагмент');
        }
        
        if (this.isSaving) {
            console.warn('[FragmentManager] Save already in progress');
            return;
        }
        
        this.isSaving = true;
        
        try {
            // Дедуплицируем и пересчитываем порядок перед сохранением
            this.fragments = this.deduplicate(this.fragments);
            this.reorder();
            
            console.log(`[FragmentManager] Saving ${this.fragments.length} fragments`);
            
            // Конвертируем в формат для сервера
            const fragmentsData = this.fragments.map(f => f.toDBFormat());
            
            // Используем FragmentAPI
            await FragmentAPI.saveFragments(this.textId, fragmentsData);
            
            // Перезагружаем из БД чтобы получить актуальные ID (force reload)
            await this.load(true);
            
            this.isDirty = false;
            console.log(`[FragmentManager] Successfully saved ${this.fragments.length} fragments`);
        } catch (error) {
            console.error('[FragmentManager] Save error:', error);
            throw error;
        } finally {
            this.isSaving = false;
        }
    }
    
    /**
     * Добавление фрагмента
     */
    add(fragmentData) {
        if (this.operationInProgress) {
            throw new Error('Дождитесь завершения текущей операции');
        }
        
        const fragment = fragmentData instanceof Fragment 
            ? fragmentData 
            : new Fragment(fragmentData);
        
        fragment.order = this.fragments.length + 1;
        this.fragments.push(fragment);
        this.isDirty = true;
        
        console.log(`[FragmentManager] Added fragment ${fragment.order}`);
        return fragment;
    }
    
    /**
     * Удаление фрагмента с защитой от race conditions
     */
    async remove(index) {
        if (this.operationInProgress) {
            throw new Error('Дождитесь завершения текущей операции');
        }
        
        if (index < 0 || index >= this.fragments.length) {
            throw new Error('Некорректный индекс фрагмента');
        }
        
        this.operationInProgress = true;
        
        try {
            const removed = this.fragments.splice(index, 1)[0];
            this.reorder();
            this.isDirty = true;
            
            console.log(`[FragmentManager] Removed fragment at index ${index}`);
            
            // Сохраняем изменения сразу
            await this.save();
            
            return removed;
        } finally {
            this.operationInProgress = false;
        }
    }
    
    /**
     * Обновление фрагмента
     */
    update(index, data) {
        if (this.operationInProgress) {
            throw new Error('Дождитесь завершения текущей операции');
        }
        
        if (index < 0 || index >= this.fragments.length) {
            throw new Error('Некорректный индекс фрагмента');
        }
        
        const fragment = this.fragments[index];
        Object.assign(fragment, data);
        this.isDirty = true;
        
        console.log(`[FragmentManager] Updated fragment ${fragment.order}`);
        return fragment;
    }
    
    /**
     * Обновление ассоциации фрагмента (использует FragmentAPI - REF-05)
     */
    async updateAssociation(index, associationData) {
        if (index < 0 || index >= this.fragments.length) {
            throw new Error('Некорректный индекс фрагмента');
        }
        
        const fragment = this.fragments[index];
        
        if (associationData.emoji) {
            fragment.emoji = associationData.emoji;
            fragment.customWord = null;
            fragment.customImage = null;
        } else if (associationData.customWord) {
            fragment.customWord = associationData.customWord;
            fragment.emoji = null;
            fragment.customImage = null;
        } else if (associationData.customImage) {
            fragment.customImage = associationData.customImage;
            fragment.emoji = null;
            fragment.customWord = null;
        }
        
        this.isDirty = true;
        
        // Сохраняем ассоциацию на сервер
        if (!fragment.id) {
            throw new Error('Фрагмент должен быть сохранён перед добавлением ассоциации');
        }
        
        // Используем FragmentAPI
        await FragmentAPI.updateAssociation(fragment.id, associationData);
        
        console.log(`[FragmentManager] Updated association for fragment ${fragment.order}`);
        return fragment;
    }
    
    /**
     * Дедупликация фрагментов (использует FragmentUtils - REF-08)
     */
    deduplicate(fragments = null) {
        const toProcess = fragments || this.fragments;
        return FragmentUtils.deduplicate(toProcess);
    }
    
    /**
     * Пересчёт порядковых номеров (использует FragmentUtils - REF-08)
     */
    reorder() {
        this.fragments = FragmentUtils.reorder(this.fragments);
    }
    
    /**
     * Получение фрагмента по индексу
     */
    get(index) {
        if (index < 0 || index >= this.fragments.length) {
            return null;
        }
        return this.fragments[index];
    }
    
    /**
     * Получение всех фрагментов
     */
    getAll() {
        return [...this.fragments];
    }
    
    /**
     * Количество фрагментов
     */
    count() {
        return this.fragments.length;
    }
    
    /**
     * Поиск первого фрагмента без ассоциации
     */
    findFirstEmptyAssociation() {
        return this.fragments.findIndex(f => !f.hasAssociation());
    }
    
    /**
     * Проверка наличия несохранённых изменений
     */
    hasUnsavedChanges() {
        return this.isDirty;
    }
    
    /**
     * Проверка выполнения операции
     */
    isOperationInProgress() {
        return this.operationInProgress || this.isSaving || this.isLoading;
    }
    
    /**
     * Синхронизация ассоциаций из другого источника (использует FragmentUtils - REF-10)
     */
    syncAssociations(sourceFragments) {
        this.fragments = FragmentUtils.syncWithAssociations(this.fragments, sourceFragments);
        console.log('[FragmentManager] Synchronized associations');
    }
    
    /**
     * Очистка всех данных
     */
    clear() {
        this.fragments = [];
        this.isDirty = false;
        console.log('[FragmentManager] Cleared all fragments');
    }
}

// Экспорт для использования в других модулях
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FragmentManager;
}

