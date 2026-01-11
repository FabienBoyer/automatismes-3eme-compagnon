/**
 * Storage Manager - Gère la sauvegarde et le chargement des données utilisateur
 */

const Storage = {
    KEY_PREFIX: 'automatismes_',

    /**
     * Récupère la progression de l'utilisateur
     */
    getProgress() {
        const data = localStorage.getItem(this.KEY_PREFIX + 'progress');
        return data ? JSON.parse(data) : this.initProgress();
    },

    /**
     * Initialise une nouvelle progression
     */
    initProgress() {
        const progress = {
            chapters: {},
            lastAccess: new Date().toISOString(),
            totalCompleted: 0
        };
        this.saveProgress(progress);
        return progress;
    },

    /**
     * Sauvegarde la progression
     */
    saveProgress(progress) {
        progress.lastAccess = new Date().toISOString();
        localStorage.setItem(this.KEY_PREFIX + 'progress', JSON.stringify(progress));
    },

    /**
     * Marque un exercice comme réussi
     */
    markExerciseCompleted(chapterId, sectionId, exerciseId) {
        const progress = this.getProgress();

        if (!progress.chapters[chapterId]) {
            progress.chapters[chapterId] = { sections: {} };
        }

        if (!progress.chapters[chapterId].sections[sectionId]) {
            progress.chapters[chapterId].sections[sectionId] = { exercises: {} };
        }

        if (!progress.chapters[chapterId].sections[sectionId].exercises[exerciseId]) {
            progress.totalCompleted++;
        }

        progress.chapters[chapterId].sections[sectionId].exercises[exerciseId] = {
            completed: true,
            timestamp: new Date().toISOString()
        };

        this.saveProgress(progress);
        return progress;
    },

    /**
     * Vérifie si un exercice est complété
     */
    isExerciseCompleted(chapterId, sectionId, exerciseId) {
        const progress = this.getProgress();

        return progress.chapters[chapterId]?.sections[sectionId]?.exercises[exerciseId]?.completed || false;
    },

    /**
     * Obtient le nombre d'exercices complétés pour un chapitre
     */
    getChapterProgress(chapterId) {
        const progress = this.getProgress();
        const chapterData = progress.chapters[chapterId];

        if (!chapterData) return 0;

        let completed = 0;
        Object.values(chapterData.sections).forEach(section => {
            completed += Object.keys(section.exercises).length;
        });

        return completed;
    },

    /**
     * Réinitialise toute la progression
     */
    resetProgress() {
        if (confirm('Êtes-vous sûr de vouloir réinitialiser toute votre progression ?')) {
            localStorage.removeItem(this.KEY_PREFIX + 'progress');
            location.reload();
        }
    },

    /**
     * Exporte les données en fichier JSON
     */
    exportData() {
        const data = this.getProgress();
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", "sauvegarde_automatismes_" + new Date().toISOString().slice(0, 10) + ".json");
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    }
};

// Rendre disponible globalement
window.Storage = Storage;
