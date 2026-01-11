/**
 * Scratch Block Renderer Module
 * Uses scratchblocks library to render visual Scratch blocks
 */

const ScratchRenderer = {
    initialized: false,

    /**
     * Initialize scratchblocks with French language
     */
    init() {
        if (this.initialized) return;

        try {
            // Check if scratchblocks is loaded
            if (typeof scratchblocks === 'undefined') {
                console.error('scratchblocks library not loaded');
                return false;
            }

            console.log('✓ ScratchRenderer initialized');
            this.initialized = true;
            return true;
        } catch (error) {
            console.error('Failed to initialize ScratchRenderer:', error);
            return false;
        }
    },

    /**
     * Render a single Scratch script in a container
     * @param {HTMLElement} containerElement - Container to render into
     * @param {string} scriptText - Scratch script in scratchblocks format
     */
    renderScript(containerElement, scriptText) {
        if (!this.initialized && !this.init()) {
            console.error('Cannot render: ScratchRenderer not initialized');
            return;
        }

        try {
            // Create pre.blocks element
            const pre = document.createElement('pre');
            pre.className = 'blocks';
            pre.textContent = scriptText;

            // Clear container and append
            containerElement.innerHTML = '';
            containerElement.appendChild(pre);

            // Render with scratchblocks
            scratchblocks.renderMatching('pre.blocks', {
                style: 'scratch3',
                languages: ['fr'],
                scale: 1
            });

            console.log('✓ Scratch script rendered');
        } catch (error) {
            console.error('Failed to render Scratch script:', error);
            containerElement.innerHTML = `<pre>${scriptText}</pre>`;
        }
    },

    /**
     * Render all Scratch scripts on the page
     * Looks for elements with class 'scratch-blocks'
     */
    renderAll() {
        if (!this.initialized && !this.init()) {
            console.error('Cannot render: ScratchRenderer not initialized');
            return;
        }

        try {
            scratchblocks.renderMatching('pre.blocks', {
                style: 'scratch3',
                languages: ['fr'],
                scale: 1
            });
            console.log('✓ All Scratch blocks rendered');
        } catch (error) {
            console.error('Failed to render all Scratch blocks:', error);
        }
    },

    /**
     * Create a Scratch container with title and rendered blocks
     * @param {string} scriptText - Scratch script text
     * @param {string} title - Optional title (default: "📐 Script Scratch")
     * @returns {HTMLElement} - Container div element
     */
    createScratchContainer(scriptText, title = '📐 Script Scratch') {
        const container = document.createElement('div');
        container.className = 'scratch-container';

        const titleElement = document.createElement('h4');
        titleElement.textContent = title;

        const blocksContainer = document.createElement('div');
        blocksContainer.className = 'scratch-blocks';

        container.appendChild(titleElement);
        container.appendChild(blocksContainer);

        this.renderScript(blocksContainer, scriptText);

        return container;
    }
};

// Auto-initialize when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        ScratchRenderer.init();
    });
} else {
    ScratchRenderer.init();
}
