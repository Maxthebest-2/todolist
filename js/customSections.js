import { createListElement } from './listItems.js';
import { setupDragAndDrop } from './dragAndDrop.js';
import { setupExportImport } from './exportImport.js';
import { saveList, loadList, clearStorage } from './storage.js';

// Variable globale pour la liste active
export let activeList = null;

export function setActiveList(list) {
    activeList = list;
}

export function initializeCustomSections() {
    loadCustomSections();
    setupAddSectionButton();
}

function loadCustomSections() {
    const savedSections = JSON.parse(localStorage.getItem('customSections') || '[]');
    savedSections.forEach(section => {
        createCustomSection(section.name, section.icon, section.id);
    });
}

function setupAddSectionButton() {
    const addSectionBtn = document.getElementById('addSectionBtn');
    const sectionModal = document.getElementById('sectionModal');
    const sectionNameInput = document.getElementById('sectionNameInput');
    const sectionIconInput = document.getElementById('sectionIconInput');
    const saveSectionBtn = document.getElementById('saveSectionBtn');
    const cancelSectionBtn = document.getElementById('cancelSectionBtn');
    const emojiPicker = document.querySelector('.emoji-picker');
    const emojiButtons = document.querySelectorAll('.emoji-btn');

    // Afficher/masquer le sélecteur d'émojis
    sectionIconInput.addEventListener('click', () => {
        emojiPicker.classList.toggle('show');
    });

    // Fermer le sélecteur d'émojis si on clique en dehors
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.emoji-picker-container')) {
            emojiPicker.classList.remove('show');
        }
    });

    // Gérer la sélection d'un émoji
    emojiButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            sectionIconInput.value = btn.textContent;
            emojiPicker.classList.remove('show');
        });
    });

    addSectionBtn.addEventListener('click', () => {
        sectionModal.style.display = 'flex';
        sectionNameInput.value = '';
        sectionIconInput.value = '';
        emojiPicker.classList.remove('show');
    });

    saveSectionBtn.addEventListener('click', () => {
        const name = sectionNameInput.value.trim();
        const icon = sectionIconInput.value.trim();
        
        if (name && icon) {
            const id = `section_${Date.now()}`;
            createCustomSection(name, icon, id);
            
            // Sauvegarder la section
            const savedSections = JSON.parse(localStorage.getItem('customSections') || '[]');
            savedSections.push({ name, icon, id });
            localStorage.setItem('customSections', JSON.stringify(savedSections));
            
            sectionModal.style.display = 'none';
        } else {
            alert('Veuillez remplir tous les champs');
        }
    });

    cancelSectionBtn.addEventListener('click', () => {
        sectionModal.style.display = 'none';
    });

    // Fermer la modale si on clique en dehors
    window.onclick = function(event) {
        if (event.target === sectionModal) {
            sectionModal.style.display = 'none';
        }
    };
}

function createCustomSection(name, icon, id) {
    const section = document.createElement('div');
    section.className = 'section';
    section.dataset.sectionId = id;
    section.innerHTML = `
        <div class="section-header">
            <h2>${icon} ${name}</h2>
            <div class="section-actions">
                <button class="edit-section-btn">✏️</button>
                <button class="delete-section-btn">🗑️</button>
            </div>
        </div>
        <ul class="checklist" id="checklist_${id}"></ul>
        <button class="add-objectif-btn">+ Ajouter une tâche</button>
        <div class="export-import-buttons">
            <button class="export-btn">📋 Exporter</button>
            <button class="import-btn">📥 Importer</button>
            <button class="reset-btn">🔄 Réinitialiser</button>
        </div>
    `;

    const addSectionContainer = document.querySelector('.add-section-container');
    document.body.insertBefore(section, addSectionContainer);

    const liste = section.querySelector('.checklist');
    const addBtn = section.querySelector('.add-objectif-btn');
    const exportBtn = section.querySelector('.export-btn');
    const importBtn = section.querySelector('.import-btn');
    const resetBtn = section.querySelector('.reset-btn');
    const deleteBtn = section.querySelector('.delete-section-btn');
    const editBtn = section.querySelector('.edit-section-btn');

    // Charger les éléments existants
    const items = loadList(id);
    items.forEach(item => {
        const li = createListElement(item.texte, () => saveList(liste, id));
        li.dataset.id = item.id;
        li.querySelector('input[type="checkbox"]').checked = item.checked;
        li.querySelector('.date-picker').value = item.date;
        if (item.priority) {
            li.classList.add(`priority-${item.priority}`);
            li.querySelector(`.priority-btn.${item.priority}`).classList.add('active');
        }
        liste.appendChild(li);
    });

    // Configuration des événements
    setupDragAndDrop(liste, id, () => saveList(liste, id));
    setupExportImport(exportBtn, importBtn, liste, id, () => saveList(liste, id));

    addBtn.addEventListener('click', () => {
        const objectifModal = document.getElementById('objectifModal');
        objectifModal.style.display = 'flex';
        setActiveList({ liste, storageKey: id });
        document.getElementById('objectifInput').focus();
    });

    resetBtn.addEventListener('click', () => {
        if (confirm('Êtes-vous sûr de vouloir réinitialiser cette section ?')) {
            liste.innerHTML = '';
            clearStorage(id);
        }
    });

    deleteBtn.addEventListener('click', () => {
        if (confirm('Êtes-vous sûr de vouloir supprimer cette section ?')) {
            section.remove();
            clearStorage(id);
            
            // Supprimer la section de la liste sauvegardée
            const savedSections = JSON.parse(localStorage.getItem('customSections') || '[]');
            const updatedSections = savedSections.filter(s => s.id !== id);
            localStorage.setItem('customSections', JSON.stringify(updatedSections));
        }
    });

    editBtn.addEventListener('click', () => {
        const sectionModal = document.getElementById('sectionModal');
        const sectionNameInput = document.getElementById('sectionNameInput');
        const sectionIconInput = document.getElementById('sectionIconInput');
        const saveSectionBtn = document.getElementById('saveSectionBtn');
        const cancelSectionBtn = document.getElementById('cancelSectionBtn');

        // Pré-remplir les champs avec les valeurs actuelles
        sectionNameInput.value = name;
        sectionIconInput.value = icon;
        sectionModal.style.display = 'flex';

        // Sauvegarder temporairement l'ancien bouton de sauvegarde
        const oldSaveHandler = saveSectionBtn.onclick;

        // Configurer le nouveau gestionnaire de sauvegarde
        saveSectionBtn.onclick = () => {
            const newName = sectionNameInput.value.trim();
            const newIcon = sectionIconInput.value.trim();
            
            if (newName && newIcon) {
                // Mettre à jour le titre de la section
                section.querySelector('h2').textContent = `${newIcon} ${newName}`;
                
                // Mettre à jour dans le localStorage
                const savedSections = JSON.parse(localStorage.getItem('customSections') || '[]');
                const sectionIndex = savedSections.findIndex(s => s.id === id);
                if (sectionIndex !== -1) {
                    savedSections[sectionIndex] = { ...savedSections[sectionIndex], name: newName, icon: newIcon };
                    localStorage.setItem('customSections', JSON.stringify(savedSections));
                }
                
                sectionModal.style.display = 'none';
            } else {
                alert('Veuillez remplir tous les champs');
            }
        };

        // Restaurer l'ancien gestionnaire lors de l'annulation
        cancelSectionBtn.onclick = () => {
            sectionModal.style.display = 'none';
            saveSectionBtn.onclick = oldSaveHandler;
        };
    });

    return section;
} 