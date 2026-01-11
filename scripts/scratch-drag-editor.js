/**
 * Scratch Drag-Drop Editor
 * Interactive Scratch block editor using scratchblocks + native HTML5 drag-drop
 */

const ScratchDragEditor = {
    containers: {},

    /**
     * Initialize a Scratch drag-drop exercise
     * @param {string} containerId - Container element ID
     * @param {object} config - Exercise configuration
     */
    init(containerId, config) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error('[ScratchDrag] Container not found:', containerId);
            return null;
        }

        this.containers[containerId] = {
            config,
            userAnswers: {}
        };

        // Create the editor UI
        this.render(containerId, config);

        return this;
    },

    /**
     * Render the editor UI
     */
    render(containerId, config) {
        const container = document.getElementById(containerId);
        const isViewOnly = config.display_only === true;

        if (isViewOnly) {
            // View only mode: just the script, no drag-drop features
            const editorHTML = `
                <div class="scratch-drag-editor view-only">
                    <div class="scratch-script-area full-width">
                        <div class="scratch-script" id="${containerId}-script">
                            <pre class="blocks">${config.script}</pre>
                        </div>
                    </div>
                </div>
            `;
            container.innerHTML = editorHTML;
            this.renderScratchBlocks(containerId);
            return;
        }

        // Interactive mode
        const editorHTML = `
            <div class="scratch-drag-editor">
                <div class="scratch-script-area">
                    <h4>📝 Script à compléter</h4>
                    <div class="scratch-script" id="${containerId}-script">
                        ${this.renderScript(config.script, config.gaps)}
                    </div>
                </div>
                <div class="scratch-toolbox">
                    <h4>🧩 Blocs disponibles</h4>
                    <div class="scratch-blocks-palette" id="${containerId}-palette">
                        ${this.renderPalette(config.options)}
                    </div>
                </div>
            </div>
        `;

        container.innerHTML = editorHTML;

        // Setup drag-drop
        this.setupDragDrop(containerId);

        // Render scratchblocks
        this.renderScratchBlocks(containerId);
    },

    /**
     * Render the script with gaps (drop zones)
     */
    renderScript(script, gaps) {
        let html = script;

        // Replace gap placeholders with drop zones
        gaps.forEach((gap, index) => {
            const placeholder = gap.placeholder || '___';
            const dropZone = `<span class="scratch-drop-zone" data-gap-id="${gap.id}" data-gap-index="${index}">${placeholder}</span>`;
            html = html.replace(placeholder, dropZone);
        });

        return `<pre class="blocks">${html}</pre>`;
    },

    /**
     * Render the palette of draggable blocks/values
     */
    renderPalette(options) {
        return options.map((opt, index) => {
            const isBlock = opt.type === 'block';
            const className = isBlock ? 'scratch-draggable-block' : 'scratch-draggable-value';

            return `
                <div class="${className}" 
                     draggable="true" 
                     data-value="${opt.value}"
                     data-display="${opt.display || opt.value}"
                     data-type="${opt.type || 'value'}">
                    ${isBlock ? `<pre class="blocks">${opt.display}</pre>` : opt.display || opt.value}
                </div>
            `;
        }).join('');
    },

    /**
     * Setup drag and drop event handlers
     */
    setupDragDrop(containerId) {
        const container = document.getElementById(containerId);

        // Draggable elements
        container.querySelectorAll('[draggable="true"]').forEach(elem => {
            elem.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', JSON.stringify({
                    value: elem.dataset.value,
                    display: elem.dataset.display,
                    type: elem.dataset.type
                }));
                elem.classList.add('dragging');
            });

            elem.addEventListener('dragend', (e) => {
                elem.classList.remove('dragging');
            });
        });

        // Drop zones
        container.querySelectorAll('.scratch-drop-zone').forEach(zone => {
            zone.addEventListener('dragover', (e) => {
                e.preventDefault();
                zone.classList.add('drag-over');
            });

            zone.addEventListener('dragleave', (e) => {
                zone.classList.remove('drag-over');
            });

            zone.addEventListener('drop', (e) => {
                e.preventDefault();
                zone.classList.remove('drag-over');

                try {
                    const data = JSON.parse(e.dataTransfer.getData('text/plain'));
                    this.handleDrop(containerId, zone, data);
                } catch (err) {
                    console.error('[ScratchDrag] Drop error:', err);
                }
            });
        });
    },

    /**
     * Handle a drop event
     */
    handleDrop(containerId, zone, data) {
        const gapId = zone.dataset.gapId;

        // Store user answer
        this.containers[containerId].userAnswers[gapId] = data.value;

        // Update visual
        zone.textContent = data.display;
        zone.classList.add('filled');
        zone.dataset.filledValue = data.value;

        // Re-render if it's a block
        if (data.type === 'block') {
            zone.innerHTML = `<pre class="blocks">${data.display}</pre>`;
            this.renderScratchBlocks(containerId);
        }
    },

    /**
     * Render scratchblocks in the container
     */
    renderScratchBlocks(containerId) {
        const container = document.getElementById(containerId);
        if (typeof scratchblocks !== 'undefined') {
            setTimeout(() => {
                scratchblocks.renderMatching(`#${containerId} pre.blocks`, {
                    style: 'scratch3',
                    languages: ['fr']
                });
            }, 50);
        }
    },

    /**
     * Get user answers
     */
    getAnswers(containerId) {
        return this.containers[containerId]?.userAnswers || {};
    },

    /**
     * Validate user answers against expected values
     */
    validate(containerId) {
        const containerData = this.containers[containerId];
        if (!containerData) {
            return { isCorrect: false, message: "Éditeur non trouvé" };
        }

        const { config, userAnswers } = containerData;
        const details = [];
        let allCorrect = true;

        config.gaps.forEach(gap => {
            const userValue = userAnswers[gap.id];
            const expectedValue = gap.expected;

            // Normalize for comparison
            const userNorm = String(userValue || '').trim().toLowerCase();
            const expectedNorm = String(expectedValue).trim().toLowerCase();

            const isCorrect = userNorm === expectedNorm;
            if (!isCorrect) allCorrect = false;

            details.push({
                gapId: gap.id,
                expected: expectedValue,
                actual: userValue,
                correct: isCorrect
            });
        });

        // Visual feedback
        const container = document.getElementById(containerId);
        container.querySelectorAll('.scratch-drop-zone').forEach(zone => {
            const gapId = zone.dataset.gapId;
            const detail = details.find(d => d.gapId === gapId);
            if (detail) {
                zone.classList.remove('correct', 'incorrect');
                zone.classList.add(detail.correct ? 'correct' : 'incorrect');
            }
        });

        return {
            isCorrect: allCorrect,
            details,
            message: allCorrect
                ? "Bravo ! Le script est correct."
                : "Ce n'est pas la bonne valeur. Réessayez !"
        };
    },

    /**
     * Reset the editor
     */
    reset(containerId) {
        const containerData = this.containers[containerId];
        if (!containerData) return;

        containerData.userAnswers = {};
        this.render(containerId, containerData.config);
    }
};

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ScratchDragEditor;
}
