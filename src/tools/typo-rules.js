// typo-rules.js

export const rules = [
        // 1. Espaces insécables (ponctuation double, monnaies, symboles)
        { regex: /([^\s\u00A0])([?:!;»€%])/g, replace: "$1\u00A0$2" }, // Ajoute une insécable avant si collé
        { regex: / ([:?!;»€%])/g, replace: "\u00A0$1" }, // Remplace l'espace simple par une insécable
        { regex: /([«])([^\s\u00A0])/g, replace: "$1\u00A0$2" }, // Espace après guillemet ouvrant
        { regex: /([«]) /g, replace: "$1\u00A0" }, 
        { regex: /([^\s\u00A0])([»])/g, replace: '$1\u00A0$2' }, //Espace avant guillemet fermant
        { regex: / ([»])/g, replace: '\u00A0$1' }, //Espace avant guillemet fermant
        { regex: /([:;»])(?=[^\s\u00A0])(?![\.\,\)])/g, replace: "$1 " }, // Ajoute une espace après si collé
        { regex: /(\d)(?:\s|\u00A0)*(an|ans)\b/g, replace: "$1\u00A0$2" },
        { regex: /(\d)(?:\s|\u00A0)*(%)\b/g, replace: "$1\u00A0%" },
        { regex: /(\d)(?:\s|\u00A0)*(an|ans)\b/g, replace: "$1\u00A0$2" },
        { regex: /(\d)(?:\s|\u00A0)*(%)\b/g, replace: "$1\u00A0%" },
        { regex: /(\d)((?:<\/[a-zA-Z]+>)?)(?:\s|\u00A0)*((?:<[a-zA-Z]+>)?)(?:°|º)(?:\s|\u00A0)*[cC]\b/g, replace: "$1$2\u00A0$3°C" },

        //opérateurs mathématiques
        { regex: /(?<![\/\-\d])(\d+)\s*([*×x])\s*(\d+)(?![\/\-\d])/g, replace: "$1\u00A0×\u00A0$3" }, // 10*5 → 10 × 5
        { regex: /(?<![\/\-\d])(\d+)\s*([\/÷])\s*(\d+)(?![\/\-\d])/g, replace: "$1\u00A0÷\u00A0$3" }, // 10 / 5 → 10 ÷ 5
        { regex: /(?<![\/\-\d])(\d)\s*([+–\-=])\s*(\d)(?![\/\-\d])/g, replace: "$1\u00A0$2\u00A0$3" }, // 10+5 → 10 + 5
        { regex: /(?<![+*÷=])([a-zA-ZÀ-ÿ])([+*÷=])([a-zA-ZÀ-ÿ])(?![+*÷=])/g, replace: "$1\u00A0$2\u00A0$3" }, // Mot + autre → Mot + autre    
        { regex: /(\d)\s*([+\-=×])\s*(\d)/g, replace: "$1\u00A0$2\u00A0$3" }, // 10 + 5 → 10 + 5
        { regex: /(\d)\s*([+\-÷=×])\s*([^\d\s\u00A0])/g, replace: "$1\u00A0$2\u00A0$3" }, // 10 + centimètres → 10 + centimètres
        { regex: /([^\d\s\u00A0])(\s*)([+÷=])(\s*)([^\d\s\u00A0])/g, replace: "$1\u00A0$3\u00A0$5" }, // Mot + autre → Mot + autre
        { regex: /([+÷=])\s*([^\d\s\u00A0])/g, replace: "$1\u00A0$2" },
        { regex: /([a-zA-ZÀ-ÿ])\s*([\/])\s*([a-zA-ZÀ-ÿ])/g, replace: "$1$2$3" }, // mot / mot → mot/mot (pas d'espace autour du slash entre lettres)

        // 2. Majuscule après ponctuation finale
        { regex: /([\.?!]\s+)([a-z])/g, replace: (match, p1, p2) => p1 + p2.toUpperCase() },

        // 3. Tirets incises et demi-cadratins
        { regex: /([^\d])\s+(\-)\s+([^\d])/g, replace: "$1 – $3" },
        { regex: /(\d+)\s*-\s*(\d+)/g, replace: "$1\u00A0-\u00A0$2" },

        // 4. Points de suspension et guillemets anglais
        { regex: /\.\.\./g, replace: ", etc." },
        { regex: /"([^">]+)"/g, replace: "«\u00A0$1\u00A0»" }, // Ne s'applique pas aux attributs HTML grâce à notre fonction de filtre plus bas

        // 5. Chiffres, heures et exposants (Injection de balises HTML)
        { regex: /(\d)\s*h\s*(\d)/gi, replace: "$1\u00A0h\u00A0$2" },
        { regex: /(\d)\s*(h|m|min|minute|minutes|heure|heures)\b/gi, replace: "$1\u00A0$2" },
        //Exposant
        { regex: /(\d)\s*(er)\b(\s+)?/g, replace: (match, p1, p2, p3) => `${p1}<sup>${p2}</sup>${p3 ? '\u00A0' : ''}`},
        { regex: /(\d)\s*(ème|eme|e)\b(\s+)?/g, replace: (match, p1, p2, p3) => `${p1}<sup>e</sup>${p3 ? '\u00A0' : ''}`},

        { regex: /(\d)[ \u00A0]+(\d)/g, replace: "$1\u00A0$2" }, // Remplace les espaces entre chiffres sur la même ligne
        { regex: /(?<!\b(?:sur|à|en|depuis|vers|pour|année|janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)\s)(?<![\/\-\.])\b(\d{4,})\b(?![\/\-\.])/gi, 
            replace: (match) => match.replace(/\B(?=(\d{3})+(?!\d))/g, '\u00A0') }, // Ajoute des espaces insécables entre les milliers pour les nombres de 4 chiffres ou plus, sauf si précédé par certains mots ou suivi par certains caractères

        // 6. Unités de mesure (Harmonisation stricte)
        { regex: /(\d)(?:\s|\u00A0)*j\b/gi, replace: "$1\u00A0J" },
        { regex: /(\d)(?:\s|\u00A0)*kj\b/gi, replace: "$1\u00A0kJ" },
        { regex: /(\d)(?:\s|\u00A0)*cal\b/gi, replace: "$1\u00A0cal" },
        { regex: /(\d)(?:\s|\u00A0)*kcal\b/gi, replace: "$1\u00A0kcal" },
        { regex: /(\d)(?:\s|\u00A0)*wh\b/gi, replace: "$1\u00A0Wh" },
        { regex: /(\d)(?:\s|\u00A0)*(kwh|kW-h)\b/gi, replace: "$1\u00A0kWh" },
        { regex: /(\d)(?:\s|\u00A0)*ko\b/gi, replace: "$1\u00A0ko" },
        { regex: /(\d)(?:\s|\u00A0)*mo\b/gi, replace: "$1\u00A0Mo" },
        { regex: /(\d)(?:\s|\u00A0)*go\b/gi, replace: "$1\u00A0Go" },
        { regex: /(\d)(?:\s|\u00A0)*to\b/gi, replace: "$1\u00A0To" },
        { regex: /(\d)(?:\s|\u00A0)*hz\b/gi, replace: "$1\u00A0Hz" },
        { regex: /(\d)(?:\s|\u00A0)*khz\b/gi, replace: "$1\u00A0KHz" },
        { regex: /(\d)(?:\s|\u00A0)*mhz\b/gi, replace: "$1\u00A0MHz" },
        { regex: /(\d)(?:\s|\u00A0)*ghz\b/gi, replace: "$1\u00A0GHz" },
        { regex: /(\d)(?:\s|\u00A0)*kg\b/gi, replace: "$1\u00A0kg" },
        { regex: /(\d)(?:\s|\u00A0)*hg\b/gi, replace: "$1\u00A0hg" },
        { regex: /(\d)(?:\s|\u00A0)*g\b/g, replace: "$1\u00A0g" }, // Sensible à la casse (maintien du /g)
        { regex: /(\d)(?:\s|\u00A0)*(grammes|kilogrammes)\b/g, replace: "$1\u00A0$2" },
        { regex: /(\d)(?:\s|\u00A0)*dg\b/gi, replace: "$1\u00A0dg" },
        { regex: /(\d)(?:\s|\u00A0)*cg\b/gi, replace: "$1\u00A0cg" },
        { regex: /(\d)(?:\s|\u00A0)*mg\b/gi, replace: "$1\u00A0mg" },
        { regex: /(\d)(?:\s|\u00A0)*ug\b/gi, replace: "$1\u00A0µg" },
        { regex: /(\d)(?:\s|\u00A0)*km\b/gi, replace: "$1\u00A0km" },
        { regex: /(\d)(?:\s|\u00A0)*m\b/g, replace: "$1\u00A0m" }, // Sensible à la casse (maintien du /g)
        { regex: /(\d)(?:\s|\u00A0)*dm\b/gi, replace: "$1\u00A0dm" },
        { regex: /(\d)(?:\s|\u00A0)*cm\b/gi, replace: "$1\u00A0cm" },
        { regex: /(\d)(?:\s|\u00A0)*mm\b/gi, replace: "$1\u00A0mm" }
    ];

    export const applyGrepRules = (text) => {
        let str = text;

        // 1. Extraction et protection des balises HTML sensibles
        const protectedBlocks = [];
        str = str.replace(/<(sup|sub)>([\s\S]*?)<\/\1>/gi, (match) => {
            protectedBlocks.push(match);
            return `__PROTECTED_BLOCK_${protectedBlocks.length - 1}__`;
        });

        // 2. Application de vos règles typographiques
        str = str.replace(/&nbsp;/g, '\u00A0');
        if (typeof rules !== 'undefined' && Array.isArray(rules)) {
            rules.forEach(rule => { str = str.replace(rule.regex, rule.replace); });
        }
        str = str.replace(/\u00A0/g, '&nbsp;');

        // 3. Réinjection (via une fonction de rappel pour éviter les bugs de caractères spéciaux)
        protectedBlocks.forEach((block, i) => {
            str = str.replace(`__PROTECTED_BLOCK_${i}__`, () => block);
        });

        return str;
    };
