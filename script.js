document.addEventListener('DOMContentLoaded', function() {
    // Configuration du thème
    const themeButtons = document.querySelectorAll('.theme-btn');
    const root = document.documentElement;
    
    // Charger le thème sauvegardé
    const savedTheme = localStorage.getItem('theme') || 'dark';
    root.setAttribute('data-theme', savedTheme);
    themeButtons.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.theme === savedTheme);
    });

    // Gestionnaire de changement de thème
    themeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const theme = btn.dataset.theme;
            root.setAttribute('data-theme', theme);
            localStorage.setItem('theme', theme);
            
            // Animation des boutons
            themeButtons.forEach(b => {
                if (b === btn) {
                    b.classList.add('active');
                    b.style.transform = 'rotate(360deg)';
                } else {
                    b.classList.remove('active');
                    b.style.transform = 'rotate(0deg)';
                }
            });
        });
    });

    // État global
    let editingIndex = -1;
    let currentList = null;
    let filterState = 'all'; // 'all', 'done', 'notDone'

    // Éléments DOM
    const objectifsList = document.getElementById('objectifsList');
    const checklistQuotidienne = document.getElementById('checklistQuotidienne');
    const objectifModal = document.getElementById('objectifModal');
    const importModal = document.getElementById('importModal');
    const objectifInput = document.getElementById('objectifInput');
    const searchInput = document.getElementById('searchInput');
    const filterStatusBtn = document.getElementById('filterStatus');

    // Gestion du filtre de statut
    filterStatusBtn.addEventListener('click', () => {
        switch(filterState) {
            case 'all':
                filterState = 'done';
                filterStatusBtn.innerHTML = '<span>✅</span><span>Tâches faites</span>';
                break;
            case 'done':
                filterState = 'notDone';
                filterStatusBtn.innerHTML = '<span>📝</span><span>Tâches à faire</span>';
                break;
            case 'notDone':
                filterState = 'all';
                filterStatusBtn.innerHTML = '<span>🔄</span><span>Tout afficher</span>';
                break;
        }
        filterStatusBtn.classList.toggle('active', filterState !== 'all');
        filterItems(searchInput.value);
    });

    // Fonction de recherche modifiée
    function filterItems(searchText) {
        const items = document.querySelectorAll('.checklist li');
        const searchTerms = searchText.toLowerCase().split(' ').filter(term => term.length > 0);
        
        items.forEach(item => {
            const text = item.querySelector('.objectif-text').textContent.toLowerCase();
            const date = item.querySelector('.date-picker').value;
            const isChecked = item.querySelector('input[type="checkbox"]').checked;
            
            const matchesSearch = searchTerms.length === 0 || searchTerms.every(term => 
                text.includes(term) || (date && date.includes(term))
            );

            const matchesFilter = filterState === 'all' || 
                (filterState === 'done' && isChecked) || 
                (filterState === 'notDone' && !isChecked);
            
            item.classList.toggle('hidden', !matchesSearch || !matchesFilter);
        });
    }

    // Événement de recherche
    searchInput.addEventListener('input', (e) => {
        filterItems(e.target.value);
    });

    // Structure de données globale pour tous les éléments
    let globalItems = JSON.parse(localStorage.getItem('globalItems') || '{}');

    // Fonctions utilitaires
    function sauvegarderListe(liste, storageKey) {
        if (!liste || !storageKey) return;

        const items = Array.from(liste.children).map((li, index) => {
            const itemId = li.dataset.id || `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            li.dataset.id = itemId; // S'assurer que l'élément a un ID

            const item = {
                id: itemId,
                texte: li.querySelector('.objectif-text').textContent,
                checked: li.querySelector('input[type="checkbox"]').checked,
                date: li.querySelector('.date-picker').value,
                position: index,
                currentSection: storageKey,
                priority: li.classList.contains('priority-high') ? 'high' :
                         li.classList.contains('priority-medium') ? 'medium' :
                         li.classList.contains('priority-low') ? 'low' : null
            };
            
            // Mettre à jour dans la structure globale
            globalItems[itemId] = item;
            return item;
        });

        // Nettoyer les éléments qui ne sont plus dans cette section
        Object.keys(globalItems).forEach(itemId => {
            if (globalItems[itemId].currentSection === storageKey && 
                !items.find(item => item.id === itemId)) {
                delete globalItems[itemId];
            }
        });

        // Sauvegarder la structure globale
        localStorage.setItem('globalItems', JSON.stringify(globalItems));
    }

    function chargerListe(liste, storageKey) {
        // Filtrer les éléments qui appartiennent à cette section
        const sectionItems = Object.values(globalItems)
            .filter(item => item.currentSection === storageKey)
            .sort((a, b) => a.position - b.position);

        liste.innerHTML = '';
        sectionItems.forEach(item => {
            const li = createListElement(item.texte, liste, storageKey);
            li.dataset.id = item.id;
            li.querySelector('input[type="checkbox"]').checked = item.checked;
            if (item.date) {
                li.querySelector('.date-picker').value = item.date;
            }
            if (item.priority) {
                li.classList.add(`priority-${item.priority}`);
                li.querySelector(`.priority-btn.${item.priority}`).classList.add('active');
            }
            liste.appendChild(li);
        });
    }

    // Création des éléments
    function createListElement(text, liste, storageKey) {
        const li = document.createElement('li');
        li.setAttribute('draggable', true);
        li.dataset.id = `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        li.innerHTML = `
            <input type="checkbox">
            <span class="objectif-text">${text}</span>
            <div class="objectif-actions">
                <div class="priority-buttons">
                    <button class="priority-btn high" title="Priorité haute"></button>
                    <button class="priority-btn medium" title="Priorité moyenne"></button>
                    <button class="priority-btn low" title="Priorité basse"></button>
                </div>
                <input type="date" class="date-picker">
                <button class="edit-btn">✏️</button>
                <button class="delete-btn">🗑️</button>
            </div>
        `;

        // Gestionnaire pour la case à cocher
        const checkbox = li.querySelector('input[type="checkbox"]');
        const datePicker = li.querySelector('.date-picker');
        
        checkbox.addEventListener('change', () => {
            if (checkbox.checked) {
                datePicker.value = ''; // Effacer la date
                datePicker.disabled = true; // Désactiver le sélecteur de date
            } else {
                datePicker.disabled = false; // Réactiver le sélecteur de date
            }
            sauvegarderListe(liste, storageKey);
            filterItems(searchInput.value);
        });

        // Gestionnaire pour les boutons de priorité
        const priorityButtons = li.querySelectorAll('.priority-btn');
        priorityButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                // Supprimer toutes les classes de priorité
                li.classList.remove('priority-high', 'priority-medium', 'priority-low');
                priorityButtons.forEach(b => b.classList.remove('active'));

                // Ajouter la nouvelle classe de priorité
                if (btn.classList.contains('high')) {
                    li.classList.add('priority-high');
                } else if (btn.classList.contains('medium')) {
                    li.classList.add('priority-medium');
                } else if (btn.classList.contains('low')) {
                    li.classList.add('priority-low');
                }
                
                btn.classList.add('active');
                sauvegarderListe(liste, storageKey);
            });
        });

        // Événements
        li.querySelector('input[type="checkbox"]').addEventListener('change', () => {
            sauvegarderListe(liste, storageKey);
            filterItems(searchInput.value);
        });

        li.querySelector('.date-picker').addEventListener('change', () => {
            sauvegarderListe(liste, storageKey);
        });

        li.querySelector('.edit-btn').addEventListener('click', () => {
            editingIndex = Array.from(liste.children).indexOf(li);
            currentList = liste;
            objectifInput.value = li.querySelector('.objectif-text').textContent;
            objectifModal.style.display = 'flex';
            const titre = liste === objectifsList ? 'Modifier l\'objectif' : 'Modifier la tâche';
            objectifModal.querySelector('h3').textContent = titre;
        });

        li.querySelector('.delete-btn').addEventListener('click', () => {
            const message = liste === objectifsList ? 
                'Voulez-vous vraiment supprimer cet objectif ?' : 
                'Voulez-vous vraiment supprimer cette tâche ?';
            if (confirm(message)) {
                // Supprimer l'élément du globalItems avant de le retirer du DOM
                const itemId = li.dataset.id;
                if (itemId && globalItems[itemId]) {
                    delete globalItems[itemId];
                    localStorage.setItem('globalItems', JSON.stringify(globalItems));
                }
                li.remove();
                sauvegarderListe(liste, storageKey);
            }
        });

        return li;
    }

    // Configuration du drag and drop
    function setupDragAndDrop(liste, storageKey) {
        let draggingElement = null;

        // Permettre le drag & drop sur toutes les listes
        document.querySelectorAll('.checklist').forEach(checklist => {
            checklist.addEventListener('dragenter', (e) => {
                e.preventDefault();
                checklist.classList.add('drag-over');
            });

            checklist.addEventListener('dragleave', (e) => {
                e.preventDefault();
                if (e.relatedTarget && !checklist.contains(e.relatedTarget)) {
                    checklist.classList.remove('drag-over');
                }
            });

            checklist.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                checklist.classList.add('drag-over');
                
                if (!draggingElement) return;

                const afterElement = getDropPosition(checklist, e.clientY);
                if (afterElement) {
                    checklist.insertBefore(draggingElement, afterElement);
                } else {
                    checklist.appendChild(draggingElement);
                }
            });

            checklist.addEventListener('drop', (e) => {
                e.preventDefault();
                checklist.classList.remove('drag-over');
                if (!draggingElement) return;

                const targetList = checklist;
                const sourceList = draggingElement.parentElement;
                const itemId = draggingElement.dataset.id;

                // Déterminer les clés de stockage
                const targetKey = getStorageKey(targetList);
                const sourceKey = getStorageKey(sourceList);

                if (globalItems[itemId]) {
                    globalItems[itemId].currentSection = targetKey;
                    
                    // Mettre à jour les positions dans la liste cible
                    Array.from(targetList.children).forEach((li, index) => {
                        const id = li.dataset.id;
                        if (globalItems[id]) {
                            globalItems[id].position = index;
                        }
                    });

                    // Sauvegarder les changements
                    localStorage.setItem('globalItems', JSON.stringify(globalItems));

                    // Sauvegarder les deux listes
                    if (sourceList !== targetList) {
                        sauvegarderListe(sourceList, sourceKey);
                    }
                    sauvegarderListe(targetList, targetKey);
                }
            });
        });

        // Configuration des événements de l'élément traîné
        liste.addEventListener('dragstart', (e) => {
            if (e.target.tagName === 'LI') {
                draggingElement = e.target;
                draggingElement.classList.add('dragging');
                e.dataTransfer.effectAllowed = 'move';
                
                // Ajouter un délai pour l'effet visuel
                setTimeout(() => {
                    draggingElement.classList.add('dragging-started');
                }, 0);
            }
        });

        liste.addEventListener('dragend', (e) => {
            if (draggingElement) {
                draggingElement.classList.remove('dragging', 'dragging-started');
                document.querySelectorAll('.checklist').forEach(list => {
                    list.classList.remove('drag-over');
                });
                draggingElement = null;
            }
        });

        // Fonction utilitaire pour obtenir la clé de stockage d'une liste
        function getStorageKey(list) {
            if (list === objectifsList) return 'objectifs';
            if (list === checklistQuotidienne) return 'checklist';
            return list.id; // Pour les sections personnalisées
        }

        // Fonction utilitaire pour déterminer la position de drop
        function getDropPosition(container, y) {
            const draggableElements = [...container.querySelectorAll('li:not(.dragging)')];
            return draggableElements.reduce((closest, child) => {
                const box = child.getBoundingClientRect();
                const offset = y - box.top - box.height / 2;
                if (offset < 0 && offset > closest.offset) {
                    return { offset: offset, element: child };
                } else {
                    return closest;
                }
            }, { offset: Number.NEGATIVE_INFINITY }).element;
        }
    }

    // Configuration des boutons d'ajout
    document.getElementById('addObjectifBtn').addEventListener('click', () => {
        editingIndex = -1;
        currentList = objectifsList;
        objectifInput.value = '';
        objectifModal.style.display = 'flex';
        objectifModal.querySelector('h3').textContent = 'Ajouter un objectif';
    });

    document.getElementById('addChecklistBtn').addEventListener('click', () => {
        editingIndex = -1;
        currentList = checklistQuotidienne;
        objectifInput.value = '';
        objectifModal.style.display = 'flex';
        objectifModal.querySelector('h3').textContent = 'Ajouter une tâche';
    });

    // Gestion des modales
    document.getElementById('saveBtn').addEventListener('click', () => {
        const text = objectifInput.value.trim();
        if (!text || !currentList) return;

        const storageKey = currentList === objectifsList ? 'objectifs' : 'checklist';
        if (editingIndex === -1) {
            const li = createListElement(text, currentList, storageKey);
            currentList.appendChild(li);
        } else {
            const item = currentList.children[editingIndex];
            item.querySelector('.objectif-text').textContent = text;
        }

        sauvegarderListe(currentList, storageKey);
        objectifModal.style.display = 'none';
        objectifInput.value = '';
        editingIndex = -1;
        currentList = null;
    });

    document.getElementById('cancelBtn').addEventListener('click', () => {
        objectifModal.style.display = 'none';
        objectifInput.value = '';
        editingIndex = -1;
        currentList = null;
    });

    // Gestion de l'export/import
    function setupExportImport(exportBtn, importBtn, liste, storageKey) {
        exportBtn.addEventListener('click', async () => {
            const items = Array.from(liste.children).map(li => ({
                texte: li.querySelector('.objectif-text').textContent,
                checked: li.querySelector('input[type="checkbox"]').checked,
                date: li.querySelector('.date-picker').value,
                position: Array.from(liste.children).indexOf(li)
            }));
            try {
                await navigator.clipboard.writeText(JSON.stringify(items, null, 2));
                alert('Données exportées avec succès !');
            } catch (err) {
                alert('Erreur lors de l\'exportation.');
            }
        });

        importBtn.addEventListener('click', () => {
            document.getElementById('importTextarea').value = '';
            importModal.style.display = 'flex';
            document.getElementById('confirmImportBtn').dataset.targetList = storageKey;
        });
    }

    // Configuration des boutons de réinitialisation
    function setupResetButton(resetBtn, liste, storageKey) {
        resetBtn.addEventListener('click', () => {
            if (confirm('Voulez-vous vraiment réinitialiser toutes les cases ?')) {
                liste.querySelectorAll('input[type="checkbox"]').forEach(cb => {
                    cb.checked = false;
                    const li = cb.closest('li');
                    if (li && li.dataset.id && globalItems[li.dataset.id]) {
                        globalItems[li.dataset.id].checked = false;
                    }
                });
                localStorage.setItem('globalItems', JSON.stringify(globalItems));
            }
        });
    }

    // Gestion de l'importation
    document.getElementById('confirmImportBtn').addEventListener('click', () => {
        const importText = document.getElementById('importTextarea').value.trim();
        if (!importText) {
            alert('Veuillez coller des données à importer.');
            return;
        }

        try {
            const importedData = JSON.parse(importText);
            const targetKey = document.getElementById('confirmImportBtn').dataset.targetList;
            const targetList = targetKey === 'objectifs' ? objectifsList : checklistQuotidienne;

            importedData.forEach(item => {
                const li = createListElement(item.texte, targetList, targetKey);
                li.querySelector('input[type="checkbox"]').checked = item.checked;
                if (item.date) {
                    li.querySelector('.date-picker').value = item.date;
                }
                targetList.appendChild(li);
            });

            sauvegarderListe(targetList, targetKey);
            importModal.style.display = 'none';
            document.getElementById('importTextarea').value = '';
            alert('Importation réussie !');
        } catch (error) {
            alert('Erreur lors de l\'importation. Vérifiez le format des données.');
        }
    });

    document.getElementById('cancelImportBtn').addEventListener('click', () => {
        importModal.style.display = 'none';
        document.getElementById('importTextarea').value = '';
    });

    // Fermeture des modales en cliquant en dehors
    window.addEventListener('click', (e) => {
        if (e.target === objectifModal) {
            objectifModal.style.display = 'none';
            objectifInput.value = '';
            editingIndex = -1;
            currentList = null;
        }
        if (e.target === importModal) {
            importModal.style.display = 'none';
            document.getElementById('importTextarea').value = '';
        }
    });

    // Initialisation
    setupDragAndDrop(objectifsList, 'objectifs');
    setupDragAndDrop(checklistQuotidienne, 'checklist');

    setupExportImport(
        document.getElementById('exportBtn'),
        document.getElementById('importBtn'),
        objectifsList,
        'objectifs'
    );

    setupExportImport(
        document.getElementById('exportChecklistBtn'),
        document.getElementById('importChecklistBtn'),
        checklistQuotidienne,
        'checklist'
    );

    setupResetButton(document.getElementById('resetBtn'), objectifsList, 'objectifs');
    setupResetButton(document.getElementById('resetChecklistBtn'), checklistQuotidienne, 'checklist');

    // Chargement initial des données
    chargerListe(objectifsList, 'objectifs');
    chargerListe(checklistQuotidienne, 'checklist');

    // Gestion des sections personnalisées
    let customSections = JSON.parse(localStorage.getItem('customSections')) || [];
    const sectionModal = document.getElementById('sectionModal');
    const addSectionBtn = document.getElementById('addSectionBtn');
    const cancelSectionBtn = document.getElementById('cancelSectionBtn');
    const saveSectionBtn = document.getElementById('saveSectionBtn');
    const sectionNameInput = document.getElementById('sectionNameInput');
    const sectionIconInput = document.getElementById('sectionIconInput');

    function createCustomSection(name, icon, id) {
        const section = document.createElement('div');
        section.className = 'section custom-section';
        section.dataset.sectionId = id;
        section.innerHTML = `
            <div class="section-header">
                <h2>${icon} ${name}</h2>
                <div class="section-actions">
                    <button class="edit-section-btn" title="Modifier la section">✏️</button>
                    <button class="delete-section-btn" title="Supprimer la section">🗑️</button>
                </div>
            </div>
            <ul class="checklist" id="section-${id}"></ul>
            <button class="add-objectif-btn">+ Ajouter un élément</button>
            <div class="export-import-buttons">
                <button class="export-btn">📋 Exporter</button>
                <button class="import-btn">📥 Importer</button>
                <button class="reset-btn">🔄 Réinitialiser</button>
            </div>
        `;

        // Ajouter avant le bouton "Nouvelle Section"
        const addSectionContainer = document.querySelector('.add-section-container');
        addSectionContainer.parentNode.insertBefore(section, addSectionContainer);

        // Configuration du drag and drop
        const sectionList = section.querySelector('.checklist');

        // Permettre le drag & drop sur cette section
        sectionList.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
        });

        sectionList.addEventListener('drop', (e) => {
            e.preventDefault();
            const draggingElement = document.querySelector('.dragging');
            if (!draggingElement) return;

            const sourceList = draggingElement.parentElement;
            const itemId = draggingElement.dataset.id;

            // Ajouter l'élément à la nouvelle section
            sectionList.appendChild(draggingElement);

            if (globalItems[itemId]) {
                globalItems[itemId].currentSection = `section-${id}`;
                
                // Mettre à jour les positions
                Array.from(sectionList.children).forEach((li, index) => {
                    const id = li.dataset.id;
                    if (globalItems[id]) {
                        globalItems[id].position = index;
                    }
                });

                // Sauvegarder les changements
                localStorage.setItem('globalItems', JSON.stringify(globalItems));

                // Sauvegarder les deux listes
                if (sourceList) {
                    const sourceKey = sourceList === objectifsList ? 'objectifs' :
                                    sourceList === checklistQuotidienne ? 'checklist' :
                                    sourceList.id;
                    sauvegarderListe(sourceList, sourceKey);
                }
                sauvegarderListe(sectionList, `section-${id}`);
            }
        });

        // Configuration des boutons
        setupExportImport(
            section.querySelector('.export-btn'),
            section.querySelector('.import-btn'),
            sectionList,
            `section-${id}`
        );
        setupResetButton(section.querySelector('.reset-btn'), sectionList, `section-${id}`);

        // Ajouter un élément
        section.querySelector('.add-objectif-btn').addEventListener('click', () => {
            editingIndex = -1;
            currentList = sectionList;
            objectifInput.value = '';
            objectifModal.style.display = 'flex';
            objectifModal.querySelector('h3').textContent = `Ajouter un élément dans ${name}`;
        });

        // Modifier la section
        section.querySelector('.edit-section-btn').addEventListener('click', () => {
            sectionModal.style.display = 'flex';
            sectionNameInput.value = name;
            sectionIconInput.value = icon;
            sectionModal.querySelector('h3').textContent = 'Modifier la section';
            saveSectionBtn.textContent = 'Modifier';
            sectionModal.dataset.editingId = id;
        });

        // Supprimer la section
        section.querySelector('.delete-section-btn').addEventListener('click', () => {
            if (confirm('Voulez-vous vraiment supprimer cette section et tout son contenu ?')) {
                // Supprimer tous les éléments de cette section de globalItems
                Object.keys(globalItems).forEach(itemId => {
                    if (globalItems[itemId].currentSection === `section-${id}`) {
                        delete globalItems[itemId];
                    }
                });
                localStorage.setItem('globalItems', JSON.stringify(globalItems));
                
                section.remove();
                customSections = customSections.filter(s => s.id !== id);
                localStorage.setItem('customSections', JSON.stringify(customSections));
            }
        });

        // Charger les éléments existants
        chargerListe(sectionList, `section-${id}`);
        
        // Configurer le drag & drop pour cette section
        setupDragAndDrop(sectionList, `section-${id}`);
        
        return section;
    }

    function loadCustomSections() {
        customSections.forEach(section => {
            createCustomSection(section.name, section.icon, section.id);
        });
    }

    addSectionBtn.addEventListener('click', () => {
        sectionModal.style.display = 'flex';
        sectionNameInput.value = '';
        sectionIconInput.value = '📚';
        sectionModal.dataset.editingId = '';
        saveSectionBtn.textContent = 'Créer';
        sectionModal.querySelector('h3').textContent = 'Nouvelle Section';
    });

    cancelSectionBtn.addEventListener('click', () => {
        sectionModal.style.display = 'none';
        sectionModal.dataset.editingId = '';
        saveSectionBtn.textContent = 'Créer';
        sectionModal.querySelector('h3').textContent = 'Nouvelle Section';
    });

    saveSectionBtn.addEventListener('click', () => {
        const name = sectionNameInput.value.trim();
        const icon = sectionIconInput.value.trim() || '📚';
        const editingId = sectionModal.dataset.editingId;

        if (name) {
            if (editingId) {
                // Mode édition
                const sectionToEdit = document.querySelector(`[data-section-id="${editingId}"]`);
                if (sectionToEdit) {
                    sectionToEdit.querySelector('h2').textContent = `${icon} ${name}`;
                    const sectionIndex = customSections.findIndex(s => s.id === editingId);
                    if (sectionIndex !== -1) {
                        customSections[sectionIndex].name = name;
                        customSections[sectionIndex].icon = icon;
                        localStorage.setItem('customSections', JSON.stringify(customSections));
                    }
                }
            } else {
                // Mode création
                const id = Date.now().toString();
                const newSection = { id, name, icon };
                customSections.push(newSection);
                localStorage.setItem('customSections', JSON.stringify(customSections));
                createCustomSection(name, icon, id);
            }

            // Réinitialiser la modale
            sectionModal.style.display = 'none';
            sectionModal.dataset.editingId = '';
            saveSectionBtn.textContent = 'Créer';
            sectionModal.querySelector('h3').textContent = 'Nouvelle Section';
        }
    });

    // Fermeture de la modale de section en cliquant en dehors
    window.addEventListener('click', (e) => {
        if (e.target === sectionModal) {
            sectionModal.style.display = 'none';
        }
    });

    // Chargement initial des sections personnalisées
    loadCustomSections();

    function updateReminder() {
        const now = new Date();
        const reminderElement = document.getElementById('reminder');
        let reminderText = '';

        // Récupérer tous les éléments de toutes les listes
        const allLists = document.querySelectorAll('.checklist');
        allLists.forEach(list => {
            const items = list.querySelectorAll('li');
            items.forEach(item => {
                const datePicker = item.querySelector('.date-picker');
                const isChecked = item.querySelector('input[type="checkbox"]').checked;
                
                // Ne pas afficher le timer si l'élément est coché
                if (datePicker && datePicker.value && !isChecked) {
                    // Créer une date avec l'heure de fin de journée (23:59:59)
                    const taskDate = new Date(datePicker.value);
                    taskDate.setHours(23, 59, 59, 999);
                    
                    const timeLeft = taskDate - now;
                    
                    if (timeLeft < 0) {
                        // La date est dépassée
                        const taskText = item.querySelector('.objectif-text').textContent;
                        const daysOverdue = Math.abs(Math.floor(timeLeft / (1000 * 60 * 60 * 24)));
                        reminderText += `<div class="reminder-item overdue">⚠️ ${taskText}: En retard de ${daysOverdue} jour${daysOverdue > 1 ? 's' : ''}</div>`;
                        
                        // Ajouter une classe visuelle pour les tâches en retard
                        item.classList.add('overdue');
                    } else {
                        // La date n'est pas dépassée
                        item.classList.remove('overdue');
                        const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
                        const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                        const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
                        const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
                        
                        let timeString = '';
                        if (days > 0) timeString += `${days}j `;
                        timeString += `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
                        
                        const taskText = item.querySelector('.objectif-text').textContent;
                        reminderText += `<div class="reminder-item">${taskText}: ${timeString}</div>`;
                    }
                } else {
                    // Retirer la classe overdue si l'élément est coché
                    item.classList.remove('overdue');
                }
            });
        });

        reminderElement.innerHTML = reminderText;
    }

    // Appeler updateReminder toutes les secondes pour un chronomètre en temps réel
    updateReminder();
    setInterval(updateReminder, 1000);
}); 