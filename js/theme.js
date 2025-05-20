export function initializeTheme() {
    const themeButtons = document.querySelectorAll('.theme-btn');
    const root = document.documentElement;
    
    // Charger le thème sauvegardé
    const savedTheme = localStorage.getItem('theme') || 'dark';
    applyTheme(savedTheme);

    // Gestionnaire de changement de thème
    themeButtons.forEach(btn => {
        btn.addEventListener('click', () => handleThemeChange(btn));
    });
}

function applyTheme(theme) {
    const root = document.documentElement;
    const themeButtons = document.querySelectorAll('.theme-btn');
    
    root.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    
    themeButtons.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.theme === theme);
    });
}

function handleThemeChange(btn) {
    const theme = btn.dataset.theme;
    applyTheme(theme);
    
    // Animation des boutons
    const themeButtons = document.querySelectorAll('.theme-btn');
    themeButtons.forEach(b => {
        if (b === btn) {
            b.classList.add('active');
            b.style.transform = 'rotate(360deg)';
        } else {
            b.classList.remove('active');
            b.style.transform = 'rotate(0deg)';
        }
    });
} 