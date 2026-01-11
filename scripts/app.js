/**
 * Application Principale - Version Standalone
 * Les données sont chargées depuis data.js au lieu de fetch()
 */

const App = {
    chapters: [],

    /**
     * Initialisation de l'application
     */
    async init() {
        console.log('[App] Initialisation...');

        try {
            this.loadChapters();
            this.renderChapters();
            this.updateStats();

            console.log('[App] Initialisation réussie');
        } catch (error) {
            console.error('[App] Erreur:', error);
            this.showError('Impossible de charger les chapitres.');
        }
    },

    /**
     * Charge les données des chapitres (depuis data.js)
     */
    loadChapters() {
        // Les données sont déjà chargées dans window.CHAPTER_DATA
        if (!window.CHAPTER_DATA) {
            throw new Error('CHAPTER_DATA not found - make sure data.js is loaded');
        }

        this.chapters = window.CHAPTER_DATA;
        console.log(`[App] ${this.chapters.length} chapitres chargés`);
    },

    /**
     * Affiche les chapitres sur la page
     */
    renderChapters() {
        const container = document.getElementById('chapters-container');
        container.innerHTML = '';

        const chapterTitles = {
            1: 'Calculs Numériques',
            2: 'Géométrie',
            3: 'Statistiques et Probabilités',
            4: 'Fonctions',
            5: 'Exercices Type Brevet'
        };

        this.chapters.forEach(chapter => {
            const totalExercises = chapter.sections.reduce((sum, section) => {
                return sum + section.exercises.length;
            }, 0);

            const completedExercises = Storage.getChapterProgress(chapter.chapter);
            const progressPercent = totalExercises > 0
                ? Math.round((completedExercises / totalExercises) * 100)
                : 0;

            const card = `
                <div class="chapter-card" onclick="App.goToChapter(${chapter.chapter})">
                    <div class="chapter-header">
                        <div class="chapter-number">Chapitre ${chapter.chapter}</div>
                        <div class="chapter-title">${chapterTitles[chapter.chapter] || 'Chapitre ' + chapter.chapter}</div>
                    </div>
                    <div class="chapter-body">
                        <div class="chapter-stats">
                            <div class="chapter-stat">
                                <div class="chapter-stat-value">${chapter.sections.length}</div>
                                <div class="chapter-stat-label">Sections</div>
                            </div>
                            <div class="chapter-stat">
                                <div class="chapter-stat-value">${totalExercises}</div>
                                <div class="chapter-stat-label">Exercices</div>
                            </div>
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${progressPercent}%"></div>
                        </div >
                        <p style="text-align: center; margin-top: 0.5rem; font-size: 0.875rem; color: var(--gray-600);">
                            ${completedExercises} / ${totalExercises} réussis (${progressPercent}%)
                        </p>
                        <button class="btn btn-primary btn-block" style="margin-top: 1rem;">
                            Commencer →
                        </button>
                    </div >
                </div >
    `;

            container.insertAdjacentHTML('beforeend', card);
        });
    },

    /**
     * Met à jour les statistiques globales
     */
    updateStats() {
        const progress = Storage.getProgress();

        const totalSections = this.chapters.reduce((sum, ch) => sum + ch.sections.length, 0);
        const totalExercises = this.chapters.reduce((sum, ch) => {
            return sum + ch.sections.reduce((s, sec) => s + sec.exercises.length, 0);
        }, 0);

        document.getElementById('total-chapters').textContent = this.chapters.length;
        document.getElementById('total-sections').textContent = totalSections;
        document.getElementById('total-exercises').textContent = totalExercises;
        document.getElementById('completed-exercises').textContent = progress.totalCompleted;
    },

    /**
     * Navigation vers un chapitre
     */
    goToChapter(chapterId) {
        window.location.href = `chapter.html?id=${chapterId}`;
    },

    /**
     * Affiche un message d'erreur
     */
    showError(message) {
        const container = document.getElementById('chapters-container');
        container.innerHTML = `
    < div style = "text-align: center; padding: 3rem; background: white; border-radius: 1rem; grid-column: 1 / -1;" >
                <div style="font-size: 3rem; margin-bottom: 1rem;">⚠️</div>
                <h2 style="color: var(--danger); margin-bottom: 1rem;">Erreur de chargement</h2>
                <p style="color: var(--gray-600); max-width: 500px; margin: 0 auto;">${message}</p>
            </div >
    `;
    }
};

// Initialiser l'application au chargement de la page
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
