/**
 * Exercise Page - Version Standalone
 */

const ExercisePage = {
    chapterId: null,
    sectionId: null,
    exerciseId: null,
    chapterData: null,
    currentExercise: null,
    currentSection: null,
    hasAnswered: false,

    /**
     * Initialisation
     */
    async init() {
        const params = new URLSearchParams(window.location.search);
        this.chapterId = parseInt(params.get('chapter'));
        this.sectionId = params.get('section');
        this.exerciseId = params.get('exercise');

        if (!this.chapterId || !this.sectionId || !this.exerciseId) {
            this.showError('Paramètres invalides');
            return;
        }

        try {
            this.loadChapter();
            this.findExercise();
            this.renderExercise();
            this.setupKeyboard(this.currentExercise?.questionType || 'text');
            this.setupEventListeners();
        } catch (error) {
            console.error('[Exercise] Erreur:', error);
            this.showError('Impossible de charger l\'exercice');
        }
    },

    /**
     * Charge le chapitre (depuis window.CHAPTER_DATA)
     */
    loadChapter() {
        if (!window.CHAPTER_DATA) {
            throw new Error('CHAPTER_DATA not found');
        }

        this.chapterData = window.CHAPTER_DATA.find(ch => ch.chapter === this.chapterId);

        if (!this.chapterData) {
            throw new Error(`Chapter ${this.chapterId} not found`);
        }
    },

    /**
     * Trouve l'exercice
     */
    findExercise() {
        this.currentSection = this.chapterData.sections.find(s => s.id === this.sectionId);
        if (!this.currentSection) throw new Error('Section introuvable');

        this.currentExercise = this.currentSection.exercises.find(e => e.id === this.exerciseId);
        if (!this.currentExercise) throw new Error('Exercice introuvable');

        console.log('[Exercise] Trouvé:', this.currentExercise);
    },

    /**
     * Affiche l'exercice
     */
    renderExercise() {
        document.getElementById('back-link').href = `chapter.html?id=${this.chapterId}`;

        document.getElementById('exercise-number').textContent = `Exercice ${this.exerciseId}`;
        document.getElementById('exercise-duration').textContent = `⏱️ ${this.currentExercise.duration}`;
        document.getElementById('exercise-difficulty').textContent = `Niveau ${this.currentExercise.difficulty}`;
        document.getElementById('exercise-difficulty').className = `difficulty-badge difficulty-${this.currentExercise.difficulty}`;

        // Nettoyer le code LaTeX Scratch/TikZ de la question (pour les blocs)
        // Mais conserver et formater les éléments inline
        let questionText = this.currentExercise.question;

        // Supprimer les gros blocs qui seront remplacés par des images
        questionText = questionText.replace(/\\scalebox\{[^}]*\}\s*\{?\s*\\begin\{scratch\}[\s\S]*?\\end\{scratch\}\s*\}?/g, '');
        questionText = questionText.replace(/\\begin\{scratch\}[\s\S]*?\\end\{scratch\}/g, '');
        questionText = questionText.replace(/\\begin\{tikzpicture\}[\s\S]*?\\end\{tikzpicture\}/g, '');

        // Appliquer le formatage inline
        questionText = this.formatScratchText(questionText);

        document.getElementById('question-text').innerHTML = questionText;

        // Afficher JSXGraph si configuration présente (priorité sur images statiques)
        if (this.currentExercise.jsxgraphConfig) {
            this.displayJSXGraph('question-text', this.currentExercise.jsxgraphConfig);
        }
        // Sinon, afficher les images si présentes (TikZ ou Scratch)
        else if (this.currentExercise.images && this.currentExercise.images.length > 0) {
            this.displayImages('question-text', this.currentExercise.images, this.exerciseId);
        }

        // Afficher script Scratch si présent (format scratchblocks)
        if (this.currentExercise.scratchScript) {
            this.displayScratchScript('question-text', this.currentExercise.scratchScript);
        }

        // Afficher éditeur Scratch drag-drop si questionType est scratch_complete
        if (this.currentExercise.questionType === 'scratch_complete' && this.currentExercise.scratchConfig) {
            this.displayScratchEditor('question-text', this.currentExercise.scratchConfig);
        }
        // Afficher visualiseur Scratch si questionType est scratch_view
        else if (this.currentExercise.questionType === 'scratch_view' && this.currentExercise.scratchConfig) {
            this.displayScratchEditor('question-text', this.currentExercise.scratchConfig);
        }

        setTimeout(() => {
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
        }, 100);

        // Gestion de la navigation
        this.updateNavigationButtons();
    },

    /**
     * Met à jour les boutons de navigation
     */
    updateNavigationButtons() {
        const exercises = this.currentSection.exercises;
        const currentIndex = exercises.findIndex(ex => ex.id === this.exerciseId);

        const prevBtn = document.getElementById('prev-btn');
        const nextBtn = document.getElementById('next-btn');

        // Bouton Précédent
        if (currentIndex > 0) {
            prevBtn.style.display = 'block';
            prevBtn.onclick = () => this.goToExercise(exercises[currentIndex - 1].id);
        } else {
            prevBtn.style.display = 'none';
        }

        // Bouton Suivant
        if (currentIndex < exercises.length - 1) {
            nextBtn.style.display = 'block';
            nextBtn.onclick = () => this.goToExercise(exercises[currentIndex + 1].id);
        } else {
            nextBtn.style.display = 'none';
        }
    },

    /**
     * Navigue vers un exercice spécifique
     */
    goToExercise(exerciseId) {
        window.location.href = `exercise.html?chapter=${this.chapterId}&section=${this.sectionId}&exercise=${exerciseId}`;
    },

    /**
     * Nettoie le code LaTeX (Scratch, TikZ) d'un texte
     * Remplace par un placeholder qui sera remplacé par l'image
     */
    cleanLatexCode(text) {
        if (!text) return '';

        // Supprimer les blocs \begin{scratch}...\end{scratch} et \scalebox{...}
        let cleaned = text.replace(/\\scalebox\{[^}]*\}\s*\{?\s*\\begin\{scratch\}[\s\S]*?\\end\{scratch\}\s*\}?/g, '');
        cleaned = cleaned.replace(/\\begin\{scratch\}[\s\S]*?\\end\{scratch\}/g, '');

        // Supprimer les blocs TikZ
        cleaned = cleaned.replace(/\\begin\{tikzpicture\}[\s\S]*?\\end\{tikzpicture\}/g, '');

        // Nettoyer les commandes Scratch orphelines (\ovalvariable, \ovalnum, etc.)
        cleaned = cleaned.replace(/\\oval[a-z]+\{[^}]*\}/g, '');
        cleaned = cleaned.replace(/\\block[a-z]+\{[^}]*\}/g, '');

        cleaned = cleaned.replace(/\\block[a-z]+\{[^}]*\}/g, '');

        return cleaned.trim();
    },

    /**
     * Formate le texte contenant des commandes Scratch LaTeX en HTML stylisé
     */
    formatScratchText(text) {
        if (!text) return '';

        let formatted = text;

        // Remplacements des commandes \oval...
        formatted = formatted.replace(/\\ovalnum\{([^}]+)\}/g, '<span class="scratch-oval oval-num">$1</span>');
        formatted = formatted.replace(/\\ovalvariable\{([^}]+)\}/g, '<span class="scratch-oval oval-var">$1</span>');
        formatted = formatted.replace(/\\ovalsensing\{([^}]+)\}/g, '<span class="scratch-oval oval-sensing">$1</span>');
        formatted = formatted.replace(/\\ovaloperator\{([^}]+)\}/g, '<span class="scratch-oval oval-operator">$1</span>');
        formatted = formatted.replace(/\\booloperator\{([^}]+)\}/g, '<span class="scratch-oval oval-operator">$1</span>');

        // Remplacements des icônes
        formatted = formatted.replace(/\\turnRight\{\}/g, '<span class="scratch-icon">↻</span>');
        formatted = formatted.replace(/\\turnLeft\{\}/g, '<span class="scratch-icon">↺</span>');

        // Nettoyage final pour les autres commandes LaTeX qui pourraient rester (ex: \textit)
        // On garde le contenu mais on enlève la commande
        formatted = formatted.replace(/\\textit\{([^}]+)\}/g, '<em>$1</em>');
        formatted = formatted.replace(/\\textbf\{([^}]+)\}/g, '<strong>$1</strong>');

        return formatted;
    },

    /**
     * Convertit un tableau LaTeX simple en tableau HTML
     * Gère les cas mal formés (sans \\) comme dans le chapitre 4
     */
    formatLatexTable(text) {
        if (!text.includes('\\begin{tabularx}')) return text;

        return text.replace(/\\begin\{tabularx\}\{.*?\}(\{.*?\})([\s\S]*?)\\end\{tabularx\}/g, (match, cols, body) => {
            let html = '<div class="table-responsive"><table class="latex-table">';

            // Séparer par \hline pour identifier l'en-tête et le corps
            // La structure typique ici est: \hline Header \hline Body \hline
            let sections = body.split('\\hline');

            sections.forEach(section => {
                section = section.trim();
                if (!section) return;

                // Cas 1: Lignes explicites avec \\
                if (section.includes('\\\\')) {
                    let rows = section.split('\\\\');
                    rows.forEach(row => {
                        if (!row.trim()) return;
                        html += this._renderTableRow(row);
                    });
                }
                // Cas 2: En-tête (détecté par le mot "Bloc" ou "Description")
                else if (section.includes('Bloc') && section.includes('Description')) {
                    let cells = section.split('&');
                    html += '<thead><tr>';
                    cells.forEach(cell => {
                        // Nettoyer \hline résiduels
                        let content = cell.trim().replace(/\\hline/g, '');
                        content = content.replace(/\\textbf\{([^}]+)\}/g, '<strong>$1</strong>');
                        html += `<th>${content}</th>`;
                    });
                    html += '</tr></thead>';
                }
                // Cas 3: Corps implicite (séparé par des div scratch)
                else if (section.includes('<div class="scratch-correction">')) {
                    html += '<tbody>';
                    // On coupe devant chaque <div> qui commence une nouvelle ligne
                    let rows = section.split(/(?=<div class="scratch-correction">)/);
                    rows.forEach(row => {
                        if (!row.trim()) return;
                        html += this._renderTableRow(row);
                    });
                    html += '</tbody>';
                }
                // Cas 4: Ligne simple orpheline
                else {
                    html += this._renderTableRow(section);
                }
            });

            html += '</table></div>';
            return html;
        });
    },

    /**
     * Helper pour rendre une ligne de tableau HTML à partir d'une chaîne
     */
    _renderTableRow(rowText) {
        let html = '<tr>';
        let cells = rowText.split('&');

        cells.forEach(cell => {
            let cellContent = cell.trim().replace(/\\hline/g, '');
            // Gérer gras
            cellContent = cellContent.replace(/\\textbf\{([^}]+)\}/g, '<strong>$1</strong>');
            // Gérer scratch inline
            cellContent = this.formatScratchText(cellContent);
            // Images locales
            cellContent = cellContent.replace(/<img src="([^"]+)"/, '<img src="$1" class="img-fluid"');

            html += `<td>${cellContent}</td>`;
        });
        html += '</tr>';
        return html;
    },

    /**
     * Formate un contenu texte (correction, rappel de cours)
     * Gère: Markdown scratch, sauts de ligne, listes à puces
     */
    formatTextContent(text) {
        if (!text) return '';

        let content = text;

        // 1. Appliquer le formatage Scratch (inline)
        content = this.formatScratchText(content);

        // 1b. Formater les tableaux LaTeX
        content = this.formatLatexTable(content);

        // 2. Convertir les retours à la ligne en <br>
        content = content.replace(/\n/g, '<br>');

        // 3. Gérer les listes à puces (•)
        const lines = content.split('<br>');
        let formatted = '';
        let inList = false;

        for (let line of lines) {
            line = line.trim();
            if (line.startsWith('•')) {
                if (!inList) {
                    formatted += '<ul class="correction-list">';
                    inList = true;
                }
                // Enlever le • et mettre dans un <li>
                formatted += `<li>${line.substring(1).trim()}</li>`;
            } else {
                if (inList) {
                    formatted += '</ul>';
                    inList = false;
                }
                if (line) {
                    formatted += `<p>${line}</p>`;
                }
            }
        }

        if (inList) {
            formatted += '</ul>';
        }

        return formatted;
    },

    /**
     * Affiche les images (TikZ figures, etc.)
     */
    displayImages(containerId, images, exerciseId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        images.forEach((imageTag, index) => {
            if (imageTag === '[TIKZ_FIGURE]') {
                // Créer un conteneur pour la figure TikZ
                const figureDiv = document.createElement('div');
                figureDiv.className = 'tikz-figure-container';
                figureDiv.style.cssText = 'margin: 1.5rem 0; text-align: center;';

                // Nom du fichier image basé sur l'ID de l'exercice
                const imagePath = `assets/images/${exerciseId.replace(/\./g, '-')}.png`;

                // Vérifier si l'image existe, sinon afficher un placeholder
                const img = document.createElement('img');
                img.src = imagePath;
                img.alt = `Figure pour l'exercice ${exerciseId}`;
                img.style.cssText = 'max-width: 100%; height: auto; border-radius: 0.5rem; box-shadow: 0 2px 8px rgba(0,0,0,0.1);';

                // Si l'image n'existe pas, afficher un message
                img.onerror = function () {
                    this.style.display = 'none';
                    const placeholder = document.createElement('div');
                    placeholder.style.cssText = 'padding: 2rem; background: var(--gray-100); border-radius: 0.5rem; color: var(--gray-600);';
                    placeholder.innerHTML = `
                        <div style="font-size: 2rem; margin-bottom: 0.5rem;">📊</div>
                        <div>Figure graphique disponible dans le livre</div>
                    `;
                    figureDiv.appendChild(placeholder);
                };

                figureDiv.appendChild(img);
                container.appendChild(figureDiv);
            } else if (imageTag === '[SCRATCH_BLOCK]') {
                // Afficher l'image Scratch générée
                const figureDiv = document.createElement('div');
                figureDiv.className = 'scratch-figure-container';
                figureDiv.style.cssText = 'margin: 1.5rem 0; text-align: center;';

                // Nom du fichier: scratch-X-Y-Z.png où X.Y.Z est l'ID
                const imagePath = `assets/images/scratch-${exerciseId.replace(/\./g, '-')}.png`;

                const img = document.createElement('img');
                img.src = imagePath;
                img.alt = `Script Scratch pour l'exercice ${exerciseId}`;
                img.style.cssText = 'max-width: 100%; height: auto; border-radius: 0.5rem; box-shadow: 0 2px 8px rgba(0,0,0,0.1); background: white; padding: 1rem;';

                // Fallback si l'image n'existe pas
                img.onerror = function () {
                    this.style.display = 'none';
                    const placeholder = document.createElement('div');
                    placeholder.style.cssText = 'padding: 2rem; background: #f5f5f5; border-radius: 0.5rem; color: #666;';
                    placeholder.innerHTML = `
                        <div style="font-size: 2rem; margin-bottom: 0.5rem;">🧩</div>
                        <div>Script Scratch disponible dans le livre</div>
                    `;
                    figureDiv.appendChild(placeholder);
                };

                figureDiv.appendChild(img);
                container.appendChild(figureDiv);
            } else if (imageTag && !imageTag.startsWith('[')) {
                // Image avec chemin direct
                const figureDiv = document.createElement('div');
                figureDiv.className = 'image-container';
                figureDiv.style.cssText = 'margin: 1.5rem 0; text-align: center;';

                const img = document.createElement('img');
                img.src = imageTag;
                img.alt = `Image pour l'exercice ${exerciseId}`;
                img.style.cssText = 'max-width: 100%; height: auto; border-radius: 0.5rem; box-shadow: 0 2px 8px rgba(0,0,0,0.1);';

                figureDiv.appendChild(img);
                container.appendChild(figureDiv);
            }
        });
    },

    /**
     * Affiche une figure JSXGraph interactive
     */
    displayJSXGraph(containerId, config) {
        const container = document.getElementById(containerId);
        if (!container) return;

        // Créer un conteneur pour JSXGraph
        const jsxDiv = document.createElement('div');
        jsxDiv.className = 'jsxgraph-container';
        jsxDiv.style.cssText = 'margin: 1.5rem 0; text-align: center;';

        const boardId = `jsxgraph-${this.exerciseId.replace(/\./g, '-')}`;
        const boardDiv = document.createElement('div');
        boardDiv.id = boardId;
        boardDiv.className = 'jxgbox';
        boardDiv.style.cssText = 'width: 100%; max-width: 450px; height: 350px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 0.5rem; background: white;';

        jsxDiv.appendChild(boardDiv);
        container.appendChild(jsxDiv);

        // Rendre le graphique avec un délai pour s'assurer que le DOM est prêt
        setTimeout(() => {
            if (typeof JSXGraphRenderer !== 'undefined' && typeof JXG !== 'undefined') {
                JSXGraphRenderer.render(boardId, config);
            } else {
                console.warn('[Exercise] JSXGraph not loaded, falling back to static image');
                this.displayImages(containerId, ['[TIKZ_FIGURE]'], this.exerciseId);
            }
        }, 100);
    },

    /**
     * Affiche un script Scratch dans un conteneur
     */
    displayScratchScript(containerId, scriptText, title = '📐 Script Scratch') {
        const container = document.getElementById(containerId);
        if (!container) return;

        const scratchDiv = document.createElement('div');
        scratchDiv.className = 'scratch-container';
        scratchDiv.innerHTML = `
            <h4>${title}</h4>
            <div class="scratch-blocks">
                <pre class="blocks">${scriptText}</pre>
            </div>
        `;

        container.appendChild(scratchDiv);

        // Rendre les blocs Scratch
        if (typeof ScratchRenderer !== 'undefined') {
            setTimeout(() => {
                ScratchRenderer.renderAll();
            }, 150);
        }
    },

    /**
     * Affiche l'éditeur Scratch drag-drop interactif
     */
    displayScratchEditor(containerId, config) {
        const container = document.getElementById(containerId);
        if (!container) return;

        // Créer un conteneur pour l'éditeur
        const editorContainerId = `scratch-editor-${this.exerciseId.replace(/\./g, '-')}`;
        const editorDiv = document.createElement('div');
        editorDiv.id = editorContainerId;
        editorDiv.className = 'scratch-editor-wrapper';
        editorDiv.style.marginTop = '1.5rem';
        container.appendChild(editorDiv);

        // Initialiser l'éditeur drag-drop
        if (typeof ScratchDragEditor !== 'undefined') {
            setTimeout(() => {
                ScratchDragEditor.init(editorContainerId, config);
            }, 100);
        } else {
            console.error('[Exercise] ScratchDragEditor not loaded');
            editorDiv.innerHTML = '<p style="color: #dc2626;">Erreur: Éditeur Scratch non chargé</p>';
        }

        // Stocker l'ID pour la validation
        this.scratchEditorId = editorContainerId;
    },


    /**
     * Configure le clavier virtuel de manière adaptative selon le type de question
     * @param {string} questionType - Type de question (boolean, numeric, text, scratch_*)
     */
    setupKeyboard(questionType = 'text') {
        const keyboard = document.getElementById('virtual-keyboard');
        keyboard.innerHTML = ''; // Reset

        // Masquer le clavier pour les types qui n'en ont pas besoin
        if (questionType === 'boolean' || questionType.startsWith('scratch') || questionType === 'point_placement') {
            keyboard.style.display = 'none';
            return;
        }

        keyboard.style.display = 'block';

        // Rangée de chiffres et symboles mathématiques (toujours présente)
        const mathKeys = [
            '0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
            '+', '-', '×', '÷', '=', '<', '>',
            '/', '(', ')', ',', '.', ' ', '%',
            'π', '√', '²', '³', 'x', 'y'
        ];

        // Ajouter les lettres UNIQUEMENT pour les réponses textuelles
        if (questionType === 'text') {
            const letterKeys = 'AZERTYUIOPQSDFGHJKLMWXCVBN'.split('');
            const letterRow = document.createElement('div');
            letterRow.className = 'keyboard-row keyboard-letters';
            letterRow.style.cssText = 'display: flex; flex-wrap: wrap; gap: 0.25rem; margin-bottom: 0.5rem; justify-content: center;';

            letterKeys.forEach(key => {
                const btn = document.createElement('button');
                btn.className = 'key-btn key-letter';
                btn.textContent = key;
                btn.type = 'button';
                btn.style.cssText = 'min-width: 28px; padding: 0.4rem;';
                btn.onclick = () => this.insertKey(key.toLowerCase());
                letterRow.appendChild(btn);
            });
            keyboard.appendChild(letterRow);
        }

        // Créer le conteneur pour les chiffres/symboles
        const mathRow = document.createElement('div');
        mathRow.className = 'keyboard-row keyboard-math';
        mathRow.style.cssText = 'display: flex; flex-wrap: wrap; gap: 0.25rem; justify-content: center;';

        mathKeys.forEach(key => {
            const btn = document.createElement('button');
            btn.className = 'key-btn';
            btn.textContent = key === ' ' ? '␣' : key;
            btn.type = 'button';
            btn.onclick = () => this.insertKey(key);
            mathRow.appendChild(btn);
        });

        // Ajouter bouton Effacer (Backspace)
        const backspaceBtn = document.createElement('button');
        backspaceBtn.className = 'key-btn key-special';
        backspaceBtn.textContent = '⌫';
        backspaceBtn.title = 'Effacer';
        backspaceBtn.type = 'button';
        backspaceBtn.style.cssText = 'background: #ef4444; color: white; min-width: 40px;';
        backspaceBtn.onclick = () => this.handleBackspace();
        mathRow.appendChild(backspaceBtn);

        // Ajouter bouton Tout effacer
        const clearBtn = document.createElement('button');
        clearBtn.className = 'key-btn key-special';
        clearBtn.textContent = 'C';
        clearBtn.title = 'Tout effacer';
        clearBtn.type = 'button';
        clearBtn.style.cssText = 'background: #f97316; color: white; min-width: 40px;';
        clearBtn.onclick = () => this.handleClear();
        mathRow.appendChild(clearBtn);

        keyboard.appendChild(mathRow);
    },

    /**
     * Efface le caractère précédent (Backspace)
     */
    handleBackspace() {
        const input = document.getElementById('answer-input');
        const start = input.selectionStart;
        const end = input.selectionEnd;
        const text = input.value;

        if (start === end && start > 0) {
            // Pas de sélection, effacer le caractère avant le curseur
            input.value = text.substring(0, start - 1) + text.substring(end);
            input.focus();
            input.setSelectionRange(start - 1, start - 1);
        } else if (start !== end) {
            // Sélection active, effacer la sélection
            input.value = text.substring(0, start) + text.substring(end);
            input.focus();
            input.setSelectionRange(start, start);
        }
    },

    /**
     * Efface tout le contenu
     */
    handleClear() {
        const input = document.getElementById('answer-input');
        input.value = '';
        input.focus();
    },

    /**
     * Insère un caractère
     */
    insertKey(key) {
        const input = document.getElementById('answer-input');
        const start = input.selectionStart;
        const end = input.selectionEnd;
        const text = input.value;

        input.value = text.substring(0, start) + key + text.substring(end);
        input.focus();
        input.setSelectionRange(start + key.length, start + key.length);
    },

    /**
     * Configure les événements
     */
    setupEventListeners() {
        const input = document.getElementById('answer-input');

        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.checkAnswer();
            }
        });

        input.focus();
    },

    /**
     * Vérifie la réponse
     */
    checkAnswer() {
        // Special handling for point placement exercises
        if (this.currentExercise.questionType === 'point_placement') {
            this.checkPointPlacement();
            return;
        }

        // Special handling for Scratch complete exercises
        if (this.currentExercise.questionType === 'scratch_complete') {
            this.checkScratchAnswer();
            return;
        }

        const input = document.getElementById('answer-input');
        const userAnswer = input.value.trim();

        if (!userAnswer) {
            this.showFeedback(false, 'Veuillez entrer une réponse');
            return;
        }

        const result = Validator.validate(
            userAnswer,
            this.currentExercise.expectedAnswer,
            this.currentExercise.questionType
        );

        this.hasAnswered = true;

        if (result.isCorrect) {
            input.className = 'answer-input correct';
            this.showFeedback(true, result.message);

            Storage.markExerciseCompleted(this.chapterId, this.sectionId, this.exerciseId);
        } else {
            input.className = 'answer-input incorrect';

            // Feedback amélioré
            let feedbackMsg = result.message;
            if (this.currentExercise.questionType === 'numeric') {
                feedbackMsg = "Ce n'est pas la bonne réponse. Vérifiez votre calcul et réessayez.";
            }
            this.showFeedback(false, feedbackMsg);
        }

        // Toujours activer le bouton correction après une tentative
        document.getElementById('show-correction-btn').disabled = false;
    },

    /**
     * Vérifie le placement des points pour les exercices interactifs
     */
    checkPointPlacement() {
        const boardId = `jsxgraph-${this.exerciseId.replace(/\./g, '-')}`;
        const tolerance = this.currentExercise.jsxgraphConfig?.tolerance || 0.5;

        if (typeof JSXGraphRenderer === 'undefined') {
            this.showFeedback(false, 'Erreur: Module de figure non chargé');
            return;
        }

        const result = JSXGraphRenderer.validatePointPlacement(boardId, tolerance);
        this.hasAnswered = true;

        if (result.isCorrect) {
            this.showFeedback(true, result.message);
            Storage.markExerciseCompleted(this.chapterId, this.sectionId, this.exerciseId);
        } else {
            // Provide hint about distance
            let message = result.message;
            if (result.details.length > 0) {
                const detail = result.details[0];
                message += ` Le point ${detail.name} est à une distance de ${detail.distance} de la position attendue.`;
            }
            this.showFeedback(false, message);
        }

        // Activer le bouton correction
        document.getElementById('show-correction-btn').disabled = false;
    },

    /**
     * Vérifie la réponse Scratch drag-drop
     */
    checkScratchAnswer() {
        if (!this.scratchEditorId) {
            this.showFeedback(false, 'Erreur: Éditeur Scratch non initialisé');
            return;
        }

        if (typeof ScratchDragEditor === 'undefined') {
            this.showFeedback(false, 'Erreur: Module Scratch non chargé');
            return;
        }

        const result = ScratchDragEditor.validate(this.scratchEditorId);
        this.hasAnswered = true;

        if (result.isCorrect) {
            this.showFeedback(true, result.message);
            Storage.markExerciseCompleted(this.chapterId, this.sectionId, this.exerciseId);
        } else {
            this.showFeedback(false, result.message);
        }

        // Activer le bouton correction
        document.getElementById('show-correction-btn').disabled = false;
    },

    /**
     * Affiche un feedback
     */
    showFeedback(isSuccess, message) {
        const container = document.getElementById('feedback-container');
        container.innerHTML = `
            <div class="feedback ${isSuccess ? 'success' : 'error'}">
                <span class="feedback-icon">${isSuccess ? '✓' : '✗'}</span>
                ${message}
            </div>
        `;
    },

    /**
     * Affiche la correction
     */
    showCorrection() {
        const container = document.getElementById('correction-container');

        // Formater la correction pour l'affichage HTML
        let correctionHTML = this.currentExercise.correction || 'Correction non disponible.';
        let formatted = this.formatTextContent(correctionHTML);

        container.innerHTML = `
            <div class="correction-box">
                <div class="correction-header">
                    ✓ Correction détaillée
                </div>
                <div class="correction-content">
                    ${formatted}
                </div>
            </div>
        `;

        container.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

        // Afficher script Scratch dans la correction si présent
        if (this.currentExercise.correctionScratchScript) {
            this.displayScratchScript('correction-container', this.currentExercise.correctionScratchScript, '📐 Script de la correction');
        }

        setTimeout(() => {
            if (window.renderMathInElement) {
                renderMathInElement(container, {
                    delimiters: [
                        { left: '$$', right: '$$', display: true },
                        { left: '$', right: '$', display: false }
                    ]
                });
            }
        }, 100);
    },

    /**
     * Affiche le rappel de cours
     */
    showCourseReminder() {
        const courseContent = this.currentSection.courseReminder || 'Aucun rappel de cours disponible.';
        const formattedContent = this.formatTextContent(courseContent);

        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            padding: 1rem;
        `;

        modal.innerHTML = `
            <div style="background: white; padding: 2rem; border-radius: 1rem; max-width: 700px; max-height: 80vh; overflow-y: auto;">
                <h2 style="color: var(--primary); margin-bottom: 1rem;">💡 Rappel de cours</h2>
                <div style="line-height: 1.8; color: var(--gray-700);">
                    ${formattedContent}
                </div>
                <button class="btn btn-primary" style="margin-top: 1.5rem;" onclick="this.closest('div[style*=fixed]').remove()">
                    Fermer
                </button>
            </div>
        `;

        document.body.appendChild(modal);

        setTimeout(() => {
            if (window.renderMathInElement) {
                renderMathInElement(modal, {
                    delimiters: [
                        { left: '$$', right: '$$', display: true },
                        { left: '$', right: '$', display: false }
                    ]
                });
            }
        }, 100);

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    },

    /**
     * Affiche une erreur
     */
    showError(message) {
        document.querySelector('.exercise-page').innerHTML = `
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

// Initialiser
document.addEventListener('DOMContentLoaded', () => {
    ExercisePage.init();
});
