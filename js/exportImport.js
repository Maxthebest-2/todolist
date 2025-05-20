import { createListElement } from './listItems.js';

export function setupExportImport(exportBtn, importBtn, liste, storageKey, onSave) {
    exportBtn.addEventListener('click', () => {
        const items = Array.from(liste.children).map(li => ({
            texte: li.querySelector('.objectif-text').textContent,
            checked: li.querySelector('input[type="checkbox"]').checked,
            date: li.querySelector('.date-picker').value,
            priority: li.classList.contains('priority-high') ? 'high' :
                     li.classList.contains('priority-medium') ? 'medium' :
                     li.classList.contains('priority-low') ? 'low' : null
        }));
        
        const dataStr = JSON.stringify(items, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `${storageKey}_export.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });

    importBtn.addEventListener('click', () => {
        const importModal = document.getElementById('importModal');
        const importTextarea = document.getElementById('importTextarea');
        const confirmImportBtn = document.getElementById('confirmImportBtn');
        const cancelImportBtn = document.getElementById('cancelImportBtn');

        importModal.style.display = 'flex';
        importTextarea.value = '';

        const handleImport = () => {
            try {
                const importedData = JSON.parse(importTextarea.value);
                if (Array.isArray(importedData)) {
                    liste.innerHTML = '';
                    importedData.forEach(item => {
                        const li = createListElement(item.texte, onSave);
                        li.querySelector('input[type="checkbox"]').checked = item.checked;
                        li.querySelector('.date-picker').value = item.date || '';
                        
                        if (item.priority) {
                            li.classList.add(`priority-${item.priority}`);
                            li.querySelector(`.priority-btn.${item.priority}`).classList.add('active');
                        }
                        
                        liste.appendChild(li);
                    });
                    onSave();
                }
            } catch (error) {
                console.error('Erreur lors de l\'importation:', error);
                alert('Format de données invalide');
            }
            importModal.style.display = 'none';
        };

        confirmImportBtn.onclick = handleImport;
        cancelImportBtn.onclick = () => {
            importModal.style.display = 'none';
        };
    });
} 