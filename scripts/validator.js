/**
 * Math Validator - Validation intelligente des réponses mathématiques
 */

const Validator = {
    /**
     * Valide une réponse
     */
    validate(userAnswer, expectedAnswer, questionType) {
        if (!userAnswer || userAnswer.trim() === '') {
            return {
                isCorrect: false,
                message: 'Veuillez entrer une réponse'
            };
        }

        // Normaliser la réponse utilisateur
        userAnswer = this.normalize(userAnswer);

        switch (questionType) {
            case 'numeric':
                return this.validateNumeric(userAnswer, expectedAnswer);
            case 'comparison':
                return this.validateComparison(userAnswer, expectedAnswer);
            case 'boolean':
                return this.validateBoolean(userAnswer, expectedAnswer);
            case 'ordering':
                return this.validateOrdering(userAnswer, expectedAnswer);
            case 'algebraic':
                return this.validateAlgebraic(userAnswer, expectedAnswer);
            default:
                return this.validateText(userAnswer, expectedAnswer);
        }
    },

    /**
     * Normalise une réponse
     */
    normalize(answer) {
        return answer
            .trim()
            .toLowerCase()
            .replace(/\s+/g, ' ')            // Espaces multiples
            .replace(/,/g, '.')              // Virgules en points
            .replace(/×/g, '*')              // Symbole multiplication
            .replace(/÷/g, '/')              // Symbole division
            .replace(/−/g, '-');             // Tiret long en tiret court
    },

    /**
     * Validation numérique AMÉLIORÉE avec support LaTeX
     */
    validateNumeric(userAnswer, expectedAnswer) {
        // Si pas de réponse attendue, mode entraînement
        if (!expectedAnswer || expectedAnswer === null) {
            return {
                isCorrect: true,
                message: `Réponse enregistrée : ${userAnswer}. Vérifiez la correction.`,
                value: userAnswer
            };
        }

        // NOUVEAU: Support pour LaTeX et expressions complexes
        if (this.isLatexOrComplexAnswer(expectedAnswer)) {
            return this.validateLatexOrComplex(userAnswer, expectedAnswer);
        }

        // Validation numérique classique
        const userNum = this.parseNumber(userAnswer);
        const expectedNum = this.parseNumber(expectedAnswer.toString());

        if (userNum === null) {
            return {
                isCorrect: false,
                message: 'Format de réponse invalide.'
            };
        }

        if (expectedNum === null) {
            // Expected non numérique mais pas LaTeX - accepter si match texte
            if (this.normalizeAnswer(userAnswer) === this.normalizeAnswer(expectedAnswer)) {
                return { isCorrect: true, message: 'Correct !' };
            }
            return { isCorrect: false, message: 'Incorrect.' };
        }

        // Tolérance pour les calculs
        const tolerance = 0.01;
        const isClose = Math.abs(userNum - expectedNum) < tolerance;

        if (isClose) {
            return {
                isCorrect: true,
                message: `Correct ! La réponse est ${expectedAnswer}.`,
                value: userNum
            };
        } else {
            return {
                isCorrect: false,
                message: `Incorrect. Réessayez ou consultez la correction.`,
                value: userNum
            };
        }
    },

    /**
     * Validation de comparaison (>, <, =)
     */
    validateComparison(userAnswer, expectedAnswer) {
        const validComparisons = ['>', '<', '=', '≥', '≤', '>=', '<='];
        const hasComparison = validComparisons.some(op => userAnswer.includes(op));

        if (!hasComparison) {
            return {
                isCorrect: false,
                message: 'Utilisez un symbole de comparaison (>, <, =)'
            };
        }

        // Si pas de réponse attendue, validation format uniquement
        if (!expectedAnswer) {
            return {
                isCorrect: true,
                message: 'Réponse enregistrée. Vérifiez avec la correction.',
                value: userAnswer
            };
        }

        // Comparaison stricte normalisée
        const userNorm = this.normalizeAnswer(userAnswer);
        const expectedNorm = this.normalizeAnswer(expectedAnswer);

        if (userNorm === expectedNorm) {
            return {
                isCorrect: true,
                message: 'Correct !',
                value: userAnswer
            };
        }

        return {
            isCorrect: false,
            message: 'Incorrect. Vérifiez le sens de l\'inégalité.',
            value: userAnswer
        };
    },

    /**
     * Validation Vrai/Faux
     */
    validateBoolean(userAnswer, expectedAnswer) {
        const isTrue = /^(vrai|true|oui|yes|v|1)$/i.test(userAnswer);
        const isFalse = /^(faux|false|non|no|f|0)$/i.test(userAnswer);

        if (!isTrue && !isFalse) {
            return {
                isCorrect: false,
                message: 'Répondez par Vrai ou Faux'
            };
        }

        // Si réponse attendue
        if (expectedAnswer) {
            // Déterminer si l'attendu est vrai ou faux
            const expectedIsTrue = /^(vrai|true|oui|yes|v|1|l.?affirmationestvraie)$/i.test(this.normalizeAnswer(expectedAnswer));
            const userIsTrue = isTrue; // si isTrue, alors true. Sinon false car isFalse validé

            if (expectedIsTrue === userIsTrue) {
                return {
                    isCorrect: true,
                    message: 'Correct !',
                    value: isTrue
                };
            } else {
                return {
                    isCorrect: false,
                    message: 'Incorrect.',
                    value: isTrue
                };
            }
        }

        return {
            isCorrect: true,
            message: `Réponse enregistrée : ${isTrue ? 'Vrai' : 'Faux'}`,
            value: isTrue
        };
    },

    /**
     * Validation de classement/ordre
     */
    validateOrdering(userAnswer, expectedAnswer) {
        // Vérifier qu'il y a des symboles < ou >
        if (!userAnswer.includes('<') && !userAnswer.includes('>')) {
            return {
                isCorrect: false,
                message: 'Utilisez les symboles < ou > pour ordonner'
            };
        }

        if (!expectedAnswer) {
            return {
                isCorrect: true,
                message: 'Réponse enregistrée. Vérifiez avec la correction.',
                value: userAnswer
            };
        }

        const userNorm = this.normalizeAnswer(userAnswer);
        const expectedNorm = this.normalizeAnswer(expectedAnswer);

        if (userNorm === expectedNorm) {
            return {
                isCorrect: true,
                message: 'Correct !',
                value: userAnswer
            };
        }

        return {
            isCorrect: false,
            message: 'L\'ordre est incorrect.',
            value: userAnswer
        };
    },

    /**
     * Validation algébrique (ignore l'ordre des termes)
     */
    validateAlgebraic(userAnswer, expectedAnswer) {
        if (!expectedAnswer) return { isCorrect: false, message: 'Erreur de configuration (réponse manquante)' };

        if (this.compareAlgebraic(userAnswer, expectedAnswer)) {
            return {
                isCorrect: true,
                message: 'Correct !',
                value: userAnswer
            };
        }

        return {
            isCorrect: false,
            message: 'Incorrect. Vérifiez votre expression.',
            value: userAnswer
        };
    },

    /**
     * Validation texte libre AMÉLIORÉE avec tolérance flexible
     */
    validateText(userAnswer, expectedAnswer) {
        if (userAnswer.length < 1) {
            return {
                isCorrect: false,
                message: 'La réponse est trop courte'
            };
        }

        // Si pas de réponse attendue, mode entraînement
        if (!expectedAnswer) {
            return {
                isCorrect: true,
                message: 'Réponse enregistrée. Vérifiez avec la correction.',
                value: userAnswer
            };
        }

        // Comparaison avec tolérance améliorée
        const userNorm = this.normalizeAnswer(userAnswer);
        const expectedNorm = this.normalizeAnswer(expectedAnswer);

        // Match exact
        if (userNorm === expectedNorm) {
            return { isCorrect: true, message: 'Correct !', value: userAnswer };
        }

        // Tolérance pour les articles français (un/une/le/la/les/l')
        const userNoArticle = this.stripFrenchArticles(userNorm);
        const expectedNoArticle = this.stripFrenchArticles(expectedNorm);
        if (userNoArticle === expectedNoArticle) {
            return { isCorrect: true, message: 'Correct !', value: userAnswer };
        }

        // Support réponses multiples ("A et B" ou "A, B" ou "A ou B")
        if (expectedAnswer.includes(' et ') || expectedAnswer.includes(',') || expectedAnswer.includes(' ou ')) {
            const expectedParts = expectedAnswer.split(/\s+et\s+|,\s*|\s+ou\s+/).map(p => this.normalizeAnswer(p.trim()));
            const userParts = userAnswer.split(/\s+et\s+|,\s*|\s+ou\s+/).map(p => this.normalizeAnswer(p.trim()));

            // Vérifier si toutes les parties attendues sont présentes (ordre flexible)
            const allPartsMatch = expectedParts.every(ep => userParts.some(up => up === ep || this.stripFrenchArticles(up) === this.stripFrenchArticles(ep)));
            if (allPartsMatch && userParts.length === expectedParts.length) {
                return { isCorrect: true, message: 'Correct !', value: userAnswer };
            }

            // Accepter si l'utilisateur donne l'une des réponses attendues
            if (expectedParts.includes(userNorm) || expectedParts.includes(userNoArticle)) {
                return { isCorrect: true, message: 'Correct ! (Une des réponses attendues)', value: userAnswer };
            }
        }

        return {
            isCorrect: false,
            message: 'Incorrect. Réessayez ou consultez la correction.',
            value: userAnswer
        };
    },

    /**
     * Supprime les articles français courants d'une réponse
     */
    stripFrenchArticles(text) {
        return text.replace(/^(un|une|le|la|les|l'|l)\s*/gi, '').trim();
    },

    /**
     * Parse un nombre de différents formats
     */
    parseNumber(str) {
        // Enlever les espaces
        str = str.replace(/\s/g, '');

        // Essayer directement
        const num = parseFloat(str);
        if (!isNaN(num)) return num;

        // Essayer avec √ (racine carrée)
        if (str.includes('√')) {
            const match = str.match(/√(\d+(?:\.\d+)?)/);
            if (match) {
                return Math.sqrt(parseFloat(match[1]));
            }
        }

        // Frac tion
        const fracMatch = str.match(/^(-?\d+(?:\.\d+)?)\/(-?\d+(?:\.\d+)?)$/);
        if (fracMatch) {
            const numerator = parseFloat(fracMatch[1]);
            const denominator = parseFloat(fracMatch[2]);
            if (denominator !== 0) {
                return numerator / denominator;
            }
        }

        return null;
    },

    /**
     * Parse une fraction
     */
    parseFraction(str) {
        const match = str.match(/^(-?\d+)\/(-?\d+)$/);
        if (match) {
            const num = parseInt(match[1]);
            const den = parseInt(match[2]);
            if (den !== 0) {
                return { numerator: num, denominator: den, value: num / den };
            }
        }
        return null;
    },

    /**
     * Compare deux expressions algébriques (robuste)
     * Gère l'ordre des termes, les signes, et les coefficients implicites (x vs 1x)
     */
    compareAlgebraic(expr1, expr2) {
        // Normaliser les expressions
        const norm1 = this.normalizeAlgebraicExpression(expr1);
        const norm2 = this.normalizeAlgebraicExpression(expr2);

        return norm1 === norm2;
    },

    /**
     * Normalise une expression algébrique pour comparaison
     * "2x + 3" -> "+2x+3" (trié)
     */
    normalizeAlgebraicExpression(expr) {
        if (!expr) return '';

        // 1. Nettoyage de base
        let clean = expr.toString()
            .replace(/\s+/g, '')       // Enlever espaces
            .replace(/,/g, '.')        // Virgule -> point
            .replace(/−/g, '-');       // Normaliser tiret

        // 2. Ajouter signe + au début si manquant
        if (!clean.startsWith('+') && !clean.startsWith('-')) {
            clean = '+' + clean;
        }

        // 3. Gérer les coefficients implicites (x -> 1x)
        // Cas: +x..., -x..., ou fin de chaîne
        clean = clean.replace(/([+-])x/g, '$11x');

        // 4. Extraire les termes (tout ce qui est [+-] suivi de non-[+-])
        const terms = clean.match(/[+-][^+-]+/g) || [];

        // 5. Normaliser chaque terme (ex: 1x -> 1x, 0.5 -> 0.5)
        // Si on veut aller plus loin (ex: 0.5x vs 1/2x), il faudrait plus de parsing.
        // Pour l'instant on trie juste les chaînes.
        terms.sort();

        return terms.join('');
    },

    /**
     * Extrait les termes d'une expression (Legacy, gardé pour compatibilité si utilisé ailleurs)
     */
    extractTerms(expr) {
        return expr.split(/(?=[+-])/).map(t => t.trim()).filter(t => t);
    },

    /**
     * NOUVEAU: Détecte si une réponse contient du LaTeX ou est complexe
     */
    isLatexOrComplexAnswer(answer) {
        const str = answer.toString();
        return str.includes('\\') ||
            str.includes('(') && str.includes(',') && str.includes(')') || // coordinates
            str.includes('sqrt') ||
            str.includes('=') && str.match(/[A-Z]\s*=/); // equations like P = ...
    },

    /**
     * NOUVEAU: Validation pour LaTeX et expressions complexes
     */
    validateLatexOrComplex(userAnswer, expectedAnswer) {
        const userNorm = this.normalizeAnswer(userAnswer);
        const expectedNorm = this.normalizeAnswer(expectedAnswer);

        if (userNorm === expectedNorm) {
            return {
                isCorrect: true,
                message: 'Correct !',
                value: userAnswer
            };
        }

        // Essayer correspondance flexible (ignorer espaces, etc.)
        const userSimple = userNorm.replace(/\s+/g, '').replace(/[{}]/g, '');
        const expectedSimple = expectedNorm.replace(/\s+/g, '').replace(/[{}]/g, '');

        if (userSimple === expectedSimple) {
            return {
                isCorrect: true,
                message: 'Correct !',
                value: userAnswer
            };
        }

        return {
            isCorrect: false,
            message: 'Incorrect. Réessayez ou consultez la correction.',
            value: userAnswer
        };
    },

    /**
     * NOUVEAU: Normalise une réponse pour comparaison
     */
    normalizeAnswer(answer) {
        if (!answer) return '';
        return answer.toString()
            .toLowerCase()
            .trim()
            .replace(/\s+/g, '')
            .replace(/;/g, ',')   // point-virgule → virgule (standard FR)
            .replace(/,/g, '.')   // virgule → point décimal
            .replace(/×/g, '*')
            .replace(/÷/g, '/')
            .replace(/−/g, '-')
            .replace(/π/g, 'pi')   // Treat π symbol as pi
            .replace(/\\pi/g, 'pi'); // Treat \pi as pi
    }
};

// Rendre disponible globalement
window.Validator = Validator;
