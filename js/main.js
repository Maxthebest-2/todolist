import { initializeTheme } from './theme.js';
import { initializeStorage } from './storage.js';
import { initializeFilters } from './filters.js';
import { initializeCustomSections, activeList, setActiveList } from './customSections.js';
import { createListElement } from './listItems.js';
import { setupDragAndDrop } from './dragAndDrop.js';
import { setupExportImport } from './exportImport.js';
import { saveList, loadList, clearStorage } from './storage.js';

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM chargé, initialisation...');

    // Initialisation du stockage
    initializeStorage();

    // Initialisation du thème
    initializeTheme();

    // Initialisation des filtres
    const filterStatusBtn = document.getElementById('filterStatus');
    const searchInput = document.getElementById('searchInput');
    initializeFilters(filterStatusBtn, searchInput);

    // Configuration des listes principales
    setupMainList({
        listId: 'objectifsList',
        addBtnId: 'addObjectifBtn',
        exportBtnId: 'exportBtn',
        importBtnId: 'importBtn',
        resetBtnId: 'resetBtn',
        storageKey: 'objectifs'
    });

    setupMainList({
        listId: 'checklistQuotidienne',
        addBtnId: 'addChecklistBtn',
        exportBtnId: 'exportChecklistBtn',
        importBtnId: 'importChecklistBtn',
        resetBtnId: 'resetChecklistBtn',
        storageKey: 'checklist'
    });

    // Initialisation des sections personnalisées
    initializeCustomSections();

    // Configuration globale des modales
    setupModals();

    console.log('Initialisation terminée');
});

function setupModals() {
    console.log('Configuration des modales...');

    // Configuration de la modale d'objectif
    const objectifModal = document.getElementById('objectifModal');
    const objectifInput = document.getElementById('objectifInput');
    const saveBtn = document.getElementById('saveBtn');
    const cancelBtn = document.getElementById('cancelBtn');

    if (!objectifModal || !objectifInput || !saveBtn || !cancelBtn) {
        console.error('Éléments de la modale d\'objectif manquants:', {
            modal: !!objectifModal,
            input: !!objectifInput,
            saveBtn: !!saveBtn,
            cancelBtn: !!cancelBtn
        });
        return;
    }

    // Configuration de la modale de section
    const sectionModal = document.getElementById('sectionModal');
    const sectionNameInput = document.getElementById('sectionNameInput');
    const sectionIconInput = document.getElementById('sectionIconInput');
    const saveSectionBtn = document.getElementById('saveSectionBtn');
    const cancelSectionBtn = document.getElementById('cancelSectionBtn');

    // Gestionnaire pour fermer la modale d'objectif
    function closeObjectifModal() {
        console.log('Fermeture de la modale d\'objectif');
        objectifModal.style.display = 'none';
        objectifInput.value = '';
        activeList = null;
    }

    // Gestionnaire pour sauvegarder un objectif
    function saveObjectif() {
        console.log('Tentative de sauvegarde d\'objectif');
        const text = objectifInput.value.trim();
        if (text && activeList) {
            console.log('Création d\'un nouvel élément avec le texte:', text);
            const li = createListElement(text, () => saveList(activeList.liste, activeList.storageKey));
            activeList.liste.appendChild(li);
            saveList(activeList.liste, activeList.storageKey);
            closeObjectifModal();
        } else {
            console.warn('Impossible de sauvegarder:', { text, activeList });
        }
    }

    // Configuration des boutons de la modale d'objectif
    saveBtn.addEventListener('click', (e) => {
        console.log('Clic sur le bouton Sauvegarder');
        e.preventDefault();
        saveObjectif();
    });

    cancelBtn.addEventListener('click', (e) => {
        console.log('Clic sur le bouton Annuler');
        e.preventDefault();
        closeObjectifModal();
    });

    // Gestion de la touche Entrée dans la modale d'objectif
    objectifInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            console.log('Touche Entrée pressée dans l\'input');
            e.preventDefault();
            saveObjectif();
        }
    });

    // Fermer les modales si on clique en dehors
    window.addEventListener('click', (event) => {
        if (event.target === objectifModal) {
            closeObjectifModal();
        } else if (event.target === sectionModal) {
            sectionModal.style.display = 'none';
            sectionNameInput.value = '';
            sectionIconInput.value = '';
        }
    });

    console.log('Configuration des modales terminée');
}

function setupMainList({ listId, addBtnId, exportBtnId, importBtnId, resetBtnId, storageKey }) {
    console.log(`Configuration de la liste ${listId}...`);

    const liste = document.getElementById(listId);
    const addBtn = document.getElementById(addBtnId);
    const exportBtn = document.getElementById(exportBtnId);
    const importBtn = document.getElementById(importBtnId);
    const resetBtn = document.getElementById(resetBtnId);

    if (!liste || !addBtn) {
        console.error(`Éléments manquants pour ${listId}:`, {
            liste: !!liste,
            addBtn: !!addBtn,
            exportBtn: !!exportBtn,
            importBtn: !!importBtn,
            resetBtn: !!resetBtn
        });
        return;
    }

    // Charger les éléments existants
    const items = loadList(storageKey);
    items.forEach(item => {
        const li = createListElement(item.texte, () => saveList(liste, storageKey));
        li.dataset.id = item.id;
        li.querySelector('input[type="checkbox"]').checked = item.checked;
        li.querySelector('.date-picker').value = item.date;
        if (item.priority) {
            li.classList.add(`priority-${item.priority}`);
            li.querySelector(`.priority-btn.${item.priority}`).classList.add('active');
        }
        liste.appendChild(li);
    });

    // Configuration du drag and drop
    setupDragAndDrop(liste, storageKey, () => saveList(liste, storageKey));

    // Configuration de l'export/import
    if (exportBtn && importBtn) {
        setupExportImport(exportBtn, importBtn, liste, storageKey, () => saveList(liste, storageKey));
    }

    // Configuration du bouton d'ajout
    addBtn.addEventListener('click', (e) => {
        console.log(`Clic sur le bouton d'ajout pour ${listId}`);
        e.preventDefault();
        const objectifModal = document.getElementById('objectifModal');
        const objectifInput = document.getElementById('objectifInput');
        
        if (!objectifModal || !objectifInput) {
            console.error('Éléments de la modale manquants lors de l\'ajout');
            return;
        }

        objectifModal.style.display = 'flex';
        setActiveList({ liste, storageKey });
        objectifInput.value = '';
        objectifInput.focus();
        console.log('Modale ouverte avec activeList:', activeList);
    });

    // Configuration du bouton de réinitialisation
    if (resetBtn) {
        resetBtn.addEventListener('click', (e) => {
            console.log(`Clic sur le bouton de réinitialisation pour ${listId}`);
            e.preventDefault();
            if (confirm('Êtes-vous sûr de vouloir réinitialiser cette liste ?')) {
                liste.innerHTML = '';
                clearStorage(storageKey);
            }
        });
    }

    console.log(`Configuration de la liste ${listId} terminée`);
} 