/**
 * JSXGraph Renderer for Interactive Geometry
 * Renders geometric figures from configuration objects
 * Supports user-placed points for interactive exercises
 */

const JSXGraphRenderer = {
    boards: {},
    userPoints: {}, // Track user-placed points for validation

    /**
     * Initialize JSXGraph on a container
     * @param {string} containerId - ID of the container element
     * @param {object} config - JSXGraph configuration object
     * @returns {object} - The JSXGraph board
     */
    render(containerId, config) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`[JSXGraph] Container ${containerId} not found`);
            return null;
        }

        // Set container dimensions
        container.style.width = '100%';
        container.style.maxWidth = '500px';
        container.style.height = '400px';
        container.style.margin = '1rem auto';

        // Default config
        const defaultConfig = {
            boundingBox: [-5, 5, 5, -5],
            axis: true,
            grid: true,
            showNavigation: false,
            showCopyright: false,
            keepAspectRatio: true
        };

        const boardConfig = { ...defaultConfig, ...config };

        // Create board
        const board = JXG.JSXGraph.initBoard(containerId, {
            boundingbox: boardConfig.boundingBox,
            axis: boardConfig.axis,
            grid: boardConfig.grid,
            showNavigation: boardConfig.showNavigation,
            showCopyright: boardConfig.showCopyright,
            keepAspectRatio: boardConfig.keepAspectRatio
        });

        // Store reference
        this.boards[containerId] = board;
        this.userPoints[containerId] = {};

        // Render elements
        if (config.elements) {
            this.renderElements(board, config.elements, containerId);
        }

        return board;
    },

    /**
     * Render all elements on a board
     * @param {object} board - JSXGraph board
     * @param {array} elements - Array of element configurations
     * @param {string} containerId - Container ID for tracking user points
     */
    renderElements(board, elements, containerId) {
        const pointRefs = {};

        elements.forEach((elem, index) => {
            try {
                switch (elem.type) {
                    case 'point':
                        const point = this.createPoint(board, elem, index, containerId);
                        if (elem.name) {
                            pointRefs[elem.name] = point;
                        }
                        break;

                    case 'segment':
                        this.createSegment(board, elem, pointRefs);
                        break;

                    case 'line':
                        this.createLine(board, elem, pointRefs);
                        break;

                    case 'circle':
                        this.createCircle(board, elem, pointRefs);
                        break;

                    case 'polygon':
                        this.createPolygon(board, elem, pointRefs);
                        break;

                    case 'angle':
                        this.createAngle(board, elem, pointRefs);
                        break;

                    default:
                        console.warn(`[JSXGraph] Unknown element type: ${elem.type}`);
                }
            } catch (e) {
                console.error(`[JSXGraph] Error rendering element:`, elem, e);
            }
        });

        return pointRefs;
    },

    /**
     * Create a point
     */
    createPoint(board, config, index, containerId) {
        const style = config.style || {};
        const isUserPlaced = config.userPlaced === true;
        const isDraggable = config.draggable === true || isUserPlaced;

        const options = {
            name: config.name || '',
            size: style.size || (isUserPlaced ? 5 : 3),
            color: isUserPlaced ? '#22c55e' : (style.color || '#3b82f6'),
            fixed: !isDraggable,
            showInfobox: isUserPlaced,
            snapToGrid: isUserPlaced,
            attractors: isUserPlaced ? [board.defaultAxes.x, board.defaultAxes.y] : [],
            attractorDistance: 0.3,
            label: {
                offset: [8, 8],
                fontSize: 14,
                color: isUserPlaced ? '#22c55e' : '#333'
            }
        };

        // For user-placed points, start at origin or specified start position
        const startCoords = isUserPlaced ? (config.startCoords || [0, 0]) : config.coords;
        const point = board.create('point', startCoords, options);

        // Track user-placed points for validation
        if (isUserPlaced && containerId) {
            this.userPoints[containerId] = this.userPoints[containerId] || {};
            this.userPoints[containerId][config.name] = {
                point: point,
                expectedCoords: config.expectedCoords || config.coords
            };

            // Add visual feedback on drag
            point.on('drag', () => {
                point.setAttribute({ color: '#f59e0b' }); // Orange while dragging
            });
            point.on('up', () => {
                point.setAttribute({ color: '#22c55e' }); // Green when released
            });
        }

        return point;
    },

    /**
     * Create a segment between two points
     */
    createSegment(board, config, pointRefs) {
        const style = config.style || {};
        let p1, p2;

        // Points can be references or coordinates
        if (Array.isArray(config.points[0])) {
            p1 = config.points[0];
            p2 = config.points[1];
        } else {
            p1 = pointRefs[config.points[0]] || config.points[0];
            p2 = pointRefs[config.points[1]] || config.points[1];
        }

        return board.create('segment', [p1, p2], {
            strokeColor: style.strokeColor || '#333',
            strokeWidth: style.strokeWidth || 2,
            fixed: true
        });
    },

    /**
     * Create a line (infinite)
     */
    createLine(board, config, pointRefs) {
        const style = config.style || {};
        const p1 = pointRefs[config.points[0]] || config.points[0];
        const p2 = pointRefs[config.points[1]] || config.points[1];

        return board.create('line', [p1, p2], {
            strokeColor: style.strokeColor || '#666',
            strokeWidth: style.strokeWidth || 1,
            dash: style.dash || 0,
            fixed: true
        });
    },

    /**
     * Create a circle
     */
    createCircle(board, config, pointRefs) {
        const style = config.style || {};
        let center, radius;

        if (typeof config.center === 'string') {
            center = pointRefs[config.center];
        } else {
            center = config.center;
        }

        radius = config.radius;

        return board.create('circle', [center, radius], {
            strokeColor: style.strokeColor || '#3b82f6',
            strokeWidth: style.strokeWidth || 2,
            fillColor: style.fillColor || 'none',
            fixed: true
        });
    },

    /**
     * Create a polygon
     */
    createPolygon(board, config, pointRefs) {
        const style = config.style || {};
        const vertices = config.vertices.map(v =>
            typeof v === 'string' ? pointRefs[v] : v
        );

        return board.create('polygon', vertices, {
            borders: {
                strokeColor: style.strokeColor || '#333',
                strokeWidth: style.strokeWidth || 2
            },
            fillColor: style.fillColor || 'rgba(59, 130, 246, 0.1)',
            fixed: true
        });
    },

    /**
     * Create an angle marker
     */
    createAngle(board, config, pointRefs) {
        const style = config.style || {};
        const points = config.points.map(p =>
            typeof p === 'string' ? pointRefs[p] : board.create('point', p, { visible: false })
        );

        return board.create('angle', points, {
            radius: style.radius || 0.5,
            fillColor: style.fillColor || 'rgba(59, 130, 246, 0.3)',
            strokeColor: style.strokeColor || '#3b82f6',
            label: {
                offset: [0, 0],
                fontSize: 12
            }
        });
    },

    /**
     * Get the current position of a user-placed point
     * @param {string} containerId - Container ID
     * @param {string} pointName - Name of the point
     * @returns {object} - {x, y} coordinates or null
     */
    getUserPointPosition(containerId, pointName) {
        const userPointData = this.userPoints[containerId]?.[pointName];
        if (!userPointData) return null;

        const point = userPointData.point;
        return {
            x: point.X(),
            y: point.Y()
        };
    },

    /**
     * Validate user-placed point positions
     * @param {string} containerId - Container ID
     * @param {number} tolerance - Allowed distance from expected position (default 0.3)
     * @returns {object} - {isCorrect, details: [{name, expected, actual, distance, correct}]}
     */
    validatePointPlacement(containerId, tolerance = 0.3) {
        const userPointsData = this.userPoints[containerId];
        if (!userPointsData || Object.keys(userPointsData).length === 0) {
            return { isCorrect: false, details: [], message: "Aucun point à placer trouvé" };
        }

        const details = [];
        let allCorrect = true;

        for (const [name, data] of Object.entries(userPointsData)) {
            const point = data.point;
            const expected = data.expectedCoords;
            const actual = { x: point.X(), y: point.Y() };

            const distance = Math.sqrt(
                Math.pow(actual.x - expected[0], 2) +
                Math.pow(actual.y - expected[1], 2)
            );

            const isCorrect = distance <= tolerance;
            if (!isCorrect) allCorrect = false;

            details.push({
                name,
                expected: { x: expected[0], y: expected[1] },
                actual,
                distance: Math.round(distance * 100) / 100,
                correct: isCorrect
            });

            // Visual feedback on the point
            point.setAttribute({
                color: isCorrect ? '#22c55e' : '#ef4444',
                size: 6
            });
        }

        return {
            isCorrect: allCorrect,
            details,
            message: allCorrect
                ? "Bravo ! Le point est correctement placé."
                : "Le point n'est pas au bon endroit. Réessayez !"
        };
    },

    /**
     * Reset user-placed points to their start positions
     * @param {string} containerId - Container ID
     */
    resetUserPoints(containerId) {
        const userPointsData = this.userPoints[containerId];
        if (!userPointsData) return;

        for (const [name, data] of Object.entries(userPointsData)) {
            data.point.moveTo([0, 0]);
            data.point.setAttribute({ color: '#22c55e', size: 5 });
        }
    },

    /**
     * Destroy a board
     */
    destroy(containerId) {
        if (this.boards[containerId]) {
            JXG.JSXGraph.freeBoard(this.boards[containerId]);
            delete this.boards[containerId];
            delete this.userPoints[containerId];
        }
    }
};

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = JSXGraphRenderer;
}

