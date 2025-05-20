let globalItems = {};

export function initializeStorage() {
    globalItems = JSON.parse(localStorage.getItem('globalItems') || '{}');
}

export function saveList(liste, storageKey) {
    if (!liste || !storageKey) return;

    const items = Array.from(liste.children).map((li, index) => {
        const itemId = li.dataset.id || `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        li.dataset.id = itemId;

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
        
        globalItems[itemId] = item;
        return item;
    });

    // Nettoyer les éléments supprimés
    Object.keys(globalItems).forEach(itemId => {
        if (globalItems[itemId].currentSection === storageKey && 
            !items.find(item => item.id === itemId)) {
            delete globalItems[itemId];
        }
    });

    // Sauvegarder dans le localStorage immédiatement
    localStorage.setItem('globalItems', JSON.stringify(globalItems));
    console.log('Sauvegarde effectuée:', storageKey, items);
}

export function loadList(storageKey) {
    return Object.values(globalItems)
        .filter(item => item.currentSection === storageKey)
        .sort((a, b) => a.position - b.position);
}

export function clearStorage(storageKey) {
    Object.keys(globalItems).forEach(itemId => {
        if (globalItems[itemId].currentSection === storageKey) {
            delete globalItems[itemId];
        }
    });
    localStorage.setItem('globalItems', JSON.stringify(globalItems));
} 