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

    // Fonctions utilitaires
    function sauvegarderListe(liste, storageKey) {
        const items = Array.from(liste.children).map((li, index) => ({
            texte: li.querySelector('.objectif-text').textContent,
            checked: li.querySelector('input[type="checkbox"]').checked,
            date: li.querySelector('.date-picker').value,
            position: index,
            priority: li.classList.contains('priority-high') ? 'high' :
                     li.classList.contains('priority-medium') ? 'medium' :
                     li.classList.contains('priority-low') ? 'low' : null
        }));
        localStorage.setItem(storageKey, JSON.stringify(items));
    }

    function chargerListe(liste, storageKey) {
        const itemsSauvegardes = localStorage.getItem(storageKey);
        if (itemsSauvegardes) {
            const items = JSON.parse(itemsSauvegardes);
            liste.innerHTML = '';
            items.sort((a, b) => a.position - b.position)
                .forEach(item => {
                    const li = createListElement(item.texte, liste, storageKey);
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
    }

    // Création des éléments
    function createListElement(text, liste, storageKey) {
        const li = document.createElement('li');
        li.setAttribute('draggable', true);
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
                li.remove();
                sauvegarderListe(liste, storageKey);
            }
        });

        return li;
    }

    // Configuration du drag and drop
    function setupDragAndDrop(liste, storageKey) {
        let draggingElement = null;

        liste.addEventListener('dragstart', (e) => {
            if (e.target.tagName === 'LI') {
                draggingElement = e.target;
                setTimeout(() => {
                    draggingElement.classList.add('dragging');
                }, 0);
            }
        });

        liste.addEventListener('dragend', () => {
            if (draggingElement) {
                draggingElement.classList.remove('dragging');
                draggingElement = null;
                sauvegarderListe(liste, storageKey);
            }
        });

        liste.addEventListener('dragover', (e) => {
            e.preventDefault();
            if (!draggingElement) return;

            const afterElement = getDropPosition(liste, e.clientY);
            if (afterElement) {
                liste.insertBefore(draggingElement, afterElement);
            } else {
                liste.appendChild(draggingElement);
            }
        });

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
                });
                sauvegarderListe(liste, storageKey);
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
}); 