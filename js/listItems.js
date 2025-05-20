export function createListElement(text, onSave) {
    const li = document.createElement('li');
    li.setAttribute('draggable', true);
    li.dataset.id = `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Créer le contenu HTML
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

    // Configurer les événements après avoir créé l'élément
    setupPriorityButtons(li, onSave);
    setupItemEvents(li, onSave);

    return li;
}

function setupPriorityButtons(li, onSave) {
    const priorityButtons = li.querySelectorAll('.priority-btn');
    priorityButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            li.classList.remove('priority-high', 'priority-medium', 'priority-low');
            priorityButtons.forEach(b => b.classList.remove('active'));

            if (btn.classList.contains('high')) {
                li.classList.add('priority-high');
            } else if (btn.classList.contains('medium')) {
                li.classList.add('priority-medium');
            } else if (btn.classList.contains('low')) {
                li.classList.add('priority-low');
            }
            
            btn.classList.add('active');
            if (onSave) onSave();
        });
    });
}

function setupItemEvents(li, onSave) {
    // Gestionnaire de la case à cocher
    const checkbox = li.querySelector('input[type="checkbox"]');
    checkbox.addEventListener('change', () => {
        if (onSave) onSave();
    });

    // Gestionnaire de la date
    const datePicker = li.querySelector('.date-picker');
    datePicker.addEventListener('change', () => {
        if (onSave) onSave();
    });

    // Gestionnaire du bouton de suppression
    const deleteBtn = li.querySelector('.delete-btn');
    deleteBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (confirm('Voulez-vous vraiment supprimer cet élément ?')) {
            li.remove();
            if (onSave) onSave();
        }
    });

    // Gestionnaire du bouton d'édition
    const editBtn = li.querySelector('.edit-btn');
    const textSpan = li.querySelector('.objectif-text');
    const itemDate = li.querySelector('.date-picker');
    
    editBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        const editModal = document.getElementById('editTaskModal');
        const editInput = document.getElementById('editTaskInput');
        const editDate = document.getElementById('editTaskDate');
        const saveEditBtn = document.getElementById('saveEditBtn');
        const cancelEditBtn = document.getElementById('cancelEditBtn');
        const modalPriorityBtns = editModal.querySelectorAll('.priority-buttons .priority-btn');

        // Remplir les champs avec les valeurs actuelles
        editInput.value = textSpan.textContent;
        editDate.value = itemDate.value;

        // Réinitialiser et mettre à jour les boutons de priorité
        modalPriorityBtns.forEach(btn => btn.classList.remove('active'));
        if (li.classList.contains('priority-high')) {
            editModal.querySelector('.priority-btn.high').classList.add('active');
        } else if (li.classList.contains('priority-medium')) {
            editModal.querySelector('.priority-btn.medium').classList.add('active');
        } else if (li.classList.contains('priority-low')) {
            editModal.querySelector('.priority-btn.low').classList.add('active');
        }

        // Configurer les boutons de priorité de la modale
        modalPriorityBtns.forEach(btn => {
            btn.onclick = (e) => {
                e.preventDefault();
                modalPriorityBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            };
        });

        // Afficher la modale
        editModal.style.display = 'flex';
        editInput.focus();

        // Fonction pour sauvegarder les modifications
        function saveEdit() {
            const newText = editInput.value.trim();
            if (newText) {
                // Mettre à jour le texte
                textSpan.textContent = newText;
                
                // Mettre à jour la date
                itemDate.value = editDate.value;

                // Mettre à jour la priorité
                li.classList.remove('priority-high', 'priority-medium', 'priority-low');
                li.querySelectorAll('.priority-btn').forEach(b => b.classList.remove('active'));

                const activePriorityBtn = editModal.querySelector('.priority-btn.active');
                if (activePriorityBtn) {
                    const priority = activePriorityBtn.classList.contains('high') ? 'high' :
                                   activePriorityBtn.classList.contains('medium') ? 'medium' : 'low';
                    li.classList.add(`priority-${priority}`);
                    li.querySelector(`.priority-btn.${priority}`).classList.add('active');
                }

                // Sauvegarder et fermer
                if (onSave) onSave();
                editModal.style.display = 'none';
            }
        }

        // Configurer les événements de la modale
        saveEditBtn.onclick = (e) => {
            e.preventDefault();
            saveEdit();
        };

        cancelEditBtn.onclick = (e) => {
            e.preventDefault();
            editModal.style.display = 'none';
        };

        // Fermer la modale si on clique en dehors
        editModal.onclick = (e) => {
            if (e.target === editModal) {
                editModal.style.display = 'none';
            }
        };

        // Gérer la touche Entrée
        editInput.onkeypress = (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                saveEdit();
            }
        };
    });
} 