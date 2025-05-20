import { saveList } from './storage.js';

export function setupDragAndDrop(liste, storageKey, onSave) {
    let draggedItem = null;
    let draggedItemIndex = null;
    let originalList = null;

    liste.addEventListener('dragstart', (e) => {
        draggedItem = e.target;
        originalList = liste;
        draggedItemIndex = Array.from(liste.children).indexOf(draggedItem);
        e.target.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
    });

    liste.addEventListener('dragend', (e) => {
        e.target.classList.remove('dragging');
        if (originalList && originalList !== draggedItem.parentNode) {
            saveList(originalList, storageKey);
        }
        draggedItem = null;
        draggedItemIndex = null;
        originalList = null;
    });

    // Gérer le dragover au niveau du document
    document.addEventListener('dragover', (e) => {
        e.preventDefault();
        if (!draggedItem) return;

        // Trouver la liste la plus proche
        const checklist = e.target.closest('.checklist');
        if (!checklist) return;

        const closestItem = getClosestItem(checklist, e.clientY);
        if (closestItem) {
            const rect = closestItem.getBoundingClientRect();
            const threshold = rect.top + rect.height / 2;
            
            if (e.clientY < threshold) {
                checklist.insertBefore(draggedItem, closestItem);
            } else {
                checklist.insertBefore(draggedItem, closestItem.nextSibling);
            }
            // Sauvegarder après chaque déplacement
            const newStorageKey = getStorageKeyFromList(checklist);
            if (newStorageKey) {
                saveList(checklist, newStorageKey);
            }
        } else if (checklist.children.length === 0) {
            // Si la liste est vide
            checklist.appendChild(draggedItem);
            // Sauvegarder après l'ajout
            const newStorageKey = getStorageKeyFromList(checklist);
            if (newStorageKey) {
                saveList(checklist, newStorageKey);
            }
        }
    });

    liste.addEventListener('drop', (e) => {
        e.preventDefault();
        const newList = draggedItem.parentNode;
        const newStorageKey = getStorageKeyFromList(newList);
        
        if (newStorageKey) {
            saveList(newList, newStorageKey);
        }
        if (originalList && originalList !== newList) {
            saveList(originalList, storageKey);
        }
    });
}

function getClosestItem(container, y) {
    const draggableItems = [...container.querySelectorAll('li:not(.dragging)')];
    
    return draggableItems.reduce((closest, item) => {
        const box = item.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        
        if (offset < 0 && offset > closest.offset) {
            return { offset, element: item };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

function getStorageKeyFromList(list) {
    if (!list) return null;
    
    // Pour les listes principales
    if (list.id === 'objectifsList') return 'objectifs';
    if (list.id === 'checklistQuotidienne') return 'checklist';
    
    // Pour les sections personnalisées
    const section = list.closest('.section');
    if (section && section.dataset.sectionId) {
        return section.dataset.sectionId;
    }
    
    return null;
} 