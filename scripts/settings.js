/**
 * Settings Manager - Gère le thème sombre et les contrôles flottants
 */
const Settings = {
    init() {
        this.setupTheme();
        this.injectControls();
    },

    setupTheme() {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark');
        } else if (savedTheme === null && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            // Auto-detect system preference if not saved
            document.documentElement.setAttribute('data-theme', 'dark');
        }
    },

    toggleTheme() {
        const current = document.documentElement.getAttribute('data-theme');
        if (current === 'dark') {
            document.documentElement.removeAttribute('data-theme');
            localStorage.setItem('theme', 'light');
        } else {
            document.documentElement.setAttribute('data-theme', 'dark');
            localStorage.setItem('theme', 'dark');
        }
        this.updateButtonIcon();
    },

    injectControls() {
        // Créer un container flottant pour les réglages
        const container = document.createElement('div');
        container.className = 'settings-float';
        container.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            display: flex;
            gap: 10px;
            z-index: 1000;
        `;

        // Bouton Thème
        const themeBtn = document.createElement('button');
        themeBtn.className = 'btn btn-secondary';
        themeBtn.id = 'theme-toggle';
        themeBtn.style.padding = '0.5rem';
        themeBtn.style.fontSize = '1.2rem';
        themeBtn.style.width = '40px';
        themeBtn.style.height = '40px';
        themeBtn.style.borderRadius = '50%';
        themeBtn.style.display = 'flex';
        themeBtn.style.alignItems = 'center';
        themeBtn.style.justifyContent = 'center';
        themeBtn.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';

        themeBtn.onclick = () => this.toggleTheme();
        this.themeBtn = themeBtn;
        this.updateButtonIcon();

        // Bouton Export (uniquement sur la home pour éviter de surcharger)
        // Mais accessible partout c'est bien aussi. Mettons le juste après le theme

        const exportBtn = document.createElement('button');
        exportBtn.className = 'btn btn-secondary';
        exportBtn.innerHTML = '💾';
        exportBtn.title = 'Exporter ma progression';
        exportBtn.style.padding = '0.5rem';
        exportBtn.style.fontSize = '1.2rem';
        exportBtn.style.width = '40px';
        exportBtn.style.height = '40px';
        exportBtn.style.borderRadius = '50%';
        exportBtn.style.display = 'flex';
        exportBtn.style.alignItems = 'center';
        exportBtn.style.justifyContent = 'center';
        exportBtn.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
        exportBtn.onclick = () => Storage.exportData();

        container.appendChild(exportBtn);
        container.appendChild(themeBtn);
        document.body.appendChild(container);
    },

    updateButtonIcon() {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        this.themeBtn.innerHTML = isDark ? '☀️' : '🌙';
        this.themeBtn.title = isDark ? 'Passer en mode clair' : 'Passer en mode sombre';
    }
};

// Initialiser au chargement
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => Settings.init());
} else {
    Settings.init();
}
