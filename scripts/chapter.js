/**
 * Chapter Page - Version Standalone
 */

const ChapterPage = {
    chapterId: null,
    chapterData: null,

    /**
     * Initialisation
     */
    async init() {
        const params = new URLSearchParams(window.location.search);
        this.chapterId = parseInt(params.get('id'));

        if (!this.chapterId || this.chapterId < 1 || this.chapterId > 5) {
            this.showError('Chapitre invalide');
            return;
        }

        try {
            this.loadChapter();
            this.renderChapter();
            this.renderSections();
        } catch (error) {
            console.error('[Chapter] Erreur:', error);
            this.showError('Impossible de charger le chapitre');
        }
    },

    /**
     * Charge les données du chapitre (depuis window.CHAPTER_DATA)
     */
    loadChapter() {
        if (!window.CHAPTER_DATA) {
            throw new Error('CHAPTER_DATA not found');
        }

        this.chapterData = window.CHAPTER_DATA.find(ch => ch.chapter === this.chapterId);

        if (!this.chapterData) {
            throw new Error(`Chapter ${this.chapterId} not found`);
        }

        console.log(`[Chapter] Chargé: ${this.chapterData.sections.length} sections`);
    },

    /**
     * Affiche l'en-tête du chapitre
     */
    renderChapter() {
        const titles = {
            1: 'Calculs Numériques',
            2: 'Géométrie',
            3: 'Statistiques et Probabilités',
            4: 'Fonctions',
            5: 'Exercices Type Brevet'
        };

        document.getElementById('chapter-badge').textContent = `Chapitre ${this.chapterId}`;
        document.getElementById('chapter-title').textContent = titles[this.chapterId] || `Chapitre ${this.chapterId}`;

        const totalExercises = this.chapterData.sections.reduce((sum, s) => sum + s.exercises.length, 0);
        const completedExercises = Storage.getChapterProgress(this.chapterId);

        document.getElementById('section-count').textContent = `${this.chapterData.sections.length} sections`;
        document.getElementById('exercise-count').textContent = `${totalExercises} exercices`;
        document.getElementById('completed-count').textContent = `${completedExercises} réussis`;
    },

    /**
     * Affiche les sections
     */
    renderSections() {
        const container = document.getElementById('sections-container');
        container.innerHTML = '';

        this.chapterData.sections.forEach((section, index) => {
            const sectionCard = this.createSectionCard(section, index);
            container.appendChild(sectionCard);
        });

        // Rendre les formules mathématiques
        if (window.renderMathInElement) {
            renderMathInElement(document.body, {
                delimiters: [
                    { left: '$$', right: '$$', display: true },
                    { left: '$', right: '$', display: false },
                    { left: '\\(', right: '\\)', display: false },
                    { left: '\\[', right: '\\]', display: true }
                ]
            });
        }
    },

    /**
     * Crée une carte de section
     */
    createSectionCard(section, index) {
        const div = document.createElement('div');
        div.className = 'section-card';

        const completedCount = section.exercises.filter(ex =>
            Storage.isExerciseCompleted(this.chapterId, section.id, ex.id)
        ).length;

        div.innerHTML = `
            <div class="section-header" onclick="ChapterPage.toggleSection(${index})">
                <div class="section-title">
                    ${section.id}. ${section.title}
                </div>
                <div class="section-meta">
                    <span>📝 ${section.exercises.length} exercices</span>
                    <span>✓ ${completedCount} réussis</span>
                </div>
            </div>
            <div class="section-body" id="section-body-${index}" style="display: none;">
                ${section.courseReminder ? `
                    <div class="course-reminder">
                        <div class="course-reminder-title">
                            💡 Rappel de cours
                        </div>
                        <div class="course-reminder-content">
                            ${section.courseReminder}
                        </div>
                    </div>
                ` : ''}
                
                <div class="exercises-grid">
                    ${section.exercises.map(ex => this.createExerciseCard(ex, section.id)).join('')}
                </div>
            </div>
        `;

        return div;
    },

    /**
     * Crée une carte d'exercice
     */
    createExerciseCard(exercise, sectionId) {
        const isCompleted = Storage.isExerciseCompleted(this.chapterId, sectionId, exercise.id);

        return `
            <div class="exercise-card ${isCompleted ? 'completed' : ''}" 
                 onclick="ChapterPage.goToExercise('${sectionId}', '${exercise.id}')">
                <div class="exercise-number">Exercice ${exercise.id}</div>
                <div class="exercise-question">${exercise.question}</div>
                <div class="exercise-meta">
                    <span>⏱️ ${exercise.duration}</span>
                    <span class="difficulty-badge difficulty-${exercise.difficulty}">
                        Niveau ${exercise.difficulty}
                    </span>
                </div>
            </div>
        `;
    },

    /**
     * Toggle une section
     */
    toggleSection(index) {
        const body = document.getElementById(`section-body-${index}`);
        const isVisible = body.style.display !== 'none';

        body.style.display = isVisible ? 'none' : 'block';

        if (!isVisible && window.renderMathInElement) {
            setTimeout(() => {
                renderMathInElement(body, {
                    delimiters: [
                        { left: '$$', right: '$$', display: true },
                        { left: '$', right: '$', display: false }
                    ]
                });
            }, 100);
        }
    },

    /**
     * Navigation vers un exercice
     */
    goToExercise(sectionId, exerciseId) {
        window.location.href = `exercise.html?chapter=${this.chapterId}&section=${sectionId}&exercise=${exerciseId}`;
    },

    /**
     * Affiche une erreur
     */
    showError(message) {
        const container = document.getElementById('sections-container');
        container.innerHTML = `
            <div style="text-align: center; padding: 3rem; background: white; border-radius: 1rem;">
                <div style="font-size: 3rem; margin-bottom: 1rem;">⚠️</div>
                <h2 style="color: var(--danger); margin-bottom: 1rem;">Erreur</h2>
                <p style="color: var(--gray-600);">${message}</p>
                <a href="index.html" class="btn btn-primary" style="margin-top: 1.5rem;">
                    ← Retour à l'accueil
                </a>
            </div>
        `;
    }
};

// Initialiser au chargement
document.addEventListener('DOMContentLoaded', () => {
    ChapterPage.init();
});
