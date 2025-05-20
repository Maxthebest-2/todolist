let currentFilterState = 'all';

export function initializeFilters(filterStatusBtn, searchInput) {
    filterStatusBtn.addEventListener('click', () => {
        updateFilterState(filterStatusBtn);
        filterItems(searchInput.value);
    });

    searchInput.addEventListener('input', (e) => {
        filterItems(e.target.value);
    });
}

function updateFilterState(filterStatusBtn) {
    switch(currentFilterState) {
        case 'all':
            currentFilterState = 'done';
            filterStatusBtn.innerHTML = '<span>✅</span><span>Tâches faites</span>';
            break;
        case 'done':
            currentFilterState = 'notDone';
            filterStatusBtn.innerHTML = '<span>📝</span><span>Tâches à faire</span>';
            break;
        case 'notDone':
            currentFilterState = 'all';
            filterStatusBtn.innerHTML = '<span>🔄</span><span>Tout afficher</span>';
            break;
    }
    filterStatusBtn.classList.toggle('active', currentFilterState !== 'all');
}

export function filterItems(searchText) {
    const items = document.querySelectorAll('.checklist li');
    const searchTerms = searchText.toLowerCase().split(' ').filter(term => term.length > 0);
    
    items.forEach(item => {
        const text = item.querySelector('.objectif-text').textContent.toLowerCase();
        const date = item.querySelector('.date-picker').value;
        const isChecked = item.querySelector('input[type="checkbox"]').checked;
        
        const matchesSearch = searchTerms.length === 0 || searchTerms.every(term => 
            text.includes(term) || (date && date.includes(term))
        );

        const matchesFilter = currentFilterState === 'all' || 
            (currentFilterState === 'done' && isChecked) || 
            (currentFilterState === 'notDone' && !isChecked);
        
        item.classList.toggle('hidden', !matchesSearch || !matchesFilter);
    });
} 