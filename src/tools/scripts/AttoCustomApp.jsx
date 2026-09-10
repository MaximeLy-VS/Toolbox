import React, { useState, useRef, useEffect } from 'react';
import {
  Download as IconDownload,
  Settings as IconSettings,
  Wand2 as IconWand,
  LayoutTemplate as IconLayout,
  Maximize as IconMaximize,
  PenTool as IconPen,
  ChevronDown,
  RotateCcw,
} from 'lucide-react';

// ==========================================
// REGLES TYPO DU SCRIPT ORIGINAL
// ==========================================
const REGLES_TYPO_REMPLACEMENT = [
  { regex: /([^\s\u00A0])([?:!;»€%])/g, replace: '$1\u00A0$2' },
  { regex: / ([:?!;»€%])/g, replace: '\u00A0$1' },
  { regex: /([«])([^\s\u00A0])/g, replace: '$1\u00A0$2' },
  { regex: /([«]) /g, replace: '$1\u00A0' },
  { regex: /([:;»])(?=[^\s\u00A0])(?![\.\,\)])/g, replace: '$1 ' },
  { regex: /(\d)(?:\s|\u00A0)*(an|ans)\b/g, replace: '$1\u00A0$2' },
  { regex: /(\d)(?:\s|\u00A0)*(%)\b/g, replace: '$1\u00A0%' },
  {
    regex:
      /(\d)((?:<\/[a-zA-Z]+>)?)(?:\s|\u00A0)*((?:<[a-zA-Z]+>)?)(?:°|º)(?:\s|\u00A0)*[cC]\b/g,
    replace: '$1$2\u00A0$3°C',
  },
  {
    regex: /([\.?!]\s+)([a-z])/g,
    replace: (match, p1, p2) => p1 + p2.toUpperCase(),
  },
  { regex: /([A-Za-z0-9])([–])/g, replace: '$1\u00A0$2' },
  { regex: /([–])([A-Za-z0-9])/g, replace: '$1 $2' },
  { regex: /\s+-\s+/g, replace: ' – ' },
  { regex: /\.\.\./g, replace: ', etc.' },
  { regex: /"([^">]+)"/g, replace: '«\u00A0$1\u00A0»' },
  { regex: /(\d)\s*h\s*(\d)/gi, replace: '$1\u00A0h\u00A0$2' },
  {
    regex: /(\d)\s*(h|m|min|minute|minutes|heure|heures)\b/gi,
    replace: '$1\u00A0$2',
  },
  { regex: /(\d)\s*(er)\b/g, replace: '$1<sup>$2</sup>\u00A0' },
  { regex: /(\d)\s*(ème|eme|e)\b/g, replace: '$1<sup>e</sup>\u00A0' },
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

function appliquerTypographieSecurisee(html) {
  let parts = html.split(/(<[^>]*>)/g);
  for (let i = 0; i < parts.length; i++) {
    if (i % 2 === 0) {
      let texte = parts[i];
      texte = texte.replace(/&nbsp;/gi, '\u00A0');
      let entities = [];
      texte = texte.replace(/&[a-zA-Z0-9#]+;/g, function (match) {
        entities.push(match);
        return `__ENT_${entities.length - 1}__`;
      });
      REGLES_TYPO_REMPLACEMENT.forEach(regle => {
        texte = texte.replace(regle.regex, regle.replace);
      });
      texte = texte.replace(/ {2,}/g, ' '); // Nettoyage générique des doubles espaces
      entities.forEach((entity, index) => {
        texte = texte.replace(`__ENT_${index}__`, entity);
      });
      parts[i] = texte;
    }
  }
  return parts.join('');
}

export default function AttoCustomApp() {
  const [activeAccordion, setActiveAccordion] = useState('installation');

  // États de l'éditeur interactif
  const editorRef = useRef(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [typoSuccess, setTypoSuccess] = useState(false);
  // NOUVEAU : États pour le code source
  const [showSource, setShowSource] = useState(false);
  const [sourceCode, setSourceCode] = useState('');

  // Texte par défaut truffé d'erreurs typographiques et assez long pour l'overflow
  const defaultEditorHTML = `
    <p><strong>Bienvenue dans le simulateur !</strong></p>
    <p>Ce texte contient plein d'erreurs: "guillemets anglais", espaces manquantes avant le point d'interrogation?</p>
    <p>Les unités ne sont pas chartées : le processeur tourne à 50 hz, le fichier pèse 10 ko, et l'énergie est de 100 kwh.</p>
    <p>Classement : Il est arrivé 1er devant le 2ème.</p>
    <p><br></p>
    <p><em>Faites défiler pour voir la suite ou cliquez sur ⬍ pour étendre l'éditeur...</em></p>
    <p><br></p>
    <p>Ligne de remplissage 1...</p>
    <p>Ligne de remplissage 2...</p>
    <p>Ligne de remplissage 3...</p>
    <p>Bravo, vous avez atteint la fin de la zone de texte !</p>
  `;

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = defaultEditorHTML;
    }
  }, []);

  const toggleAccordion = id => {
    setActiveAccordion(activeAccordion === id ? null : id);
  };

const handleReset = () => {
    if (editorRef.current) editorRef.current.innerHTML = defaultEditorHTML;
    setIsExpanded(false);
    setTypoSuccess(false);
    setShowSource(false);
  };

  const handleResize = () => {
    setIsExpanded(true);
  };

const handleTypo = () => {
    if (!editorRef.current || showSource) return; 
    
    editorRef.current.innerHTML = appliquerTypographieSecurisee(editorRef.current.innerHTML);
    setTypoSuccess(true);
    setTimeout(() => setTypoSuccess(false), 2000);
  };

  const handleTemplateChange = e => {
    const val = e.target.value;
    if (val && editorRef.current) {
      // On insère le code HTML pur sans l'enrober d'un style générique
      editorRef.current.innerHTML += val;
      editorRef.current.scrollTop = editorRef.current.scrollHeight;
    }
    e.target.value = '';
  };

const toggleSource = () => {
  if (!showSource) {
    // Passage en mode HTML : on convertit l'unicode en &nbsp;
    let html = editorRef.current.innerHTML;
    html = html.replace(/\u00A0/g, '&nbsp;'); 
    setSourceCode(html);
  } else {
    // Retour en mode Visuel : on réinjecte le texte modifié dans la div
    if (editorRef.current) {
      editorRef.current.innerHTML = sourceCode;
    }
  }
  setShowSource(!showSource);
};

  const AccordionItem = ({ id, title, icon: Icon, children }) => {
    const isActive = activeAccordion === id;
    return (
      <div className='bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm mb-4 transition-all'>
        <button
          onClick={() => toggleAccordion(id)}
          className='w-full p-4 flex items-center justify-between text-left focus:outline-none hover:bg-slate-50 transition-colors'
        >
          <div className='flex items-center gap-3'>
            <div
              className={`p-2 rounded-lg ${
                isActive
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'bg-slate-100 text-slate-500'
              }`}
            >
              <Icon size={18} />
            </div>
            <span className='font-bold text-sm text-slate-800'>{title}</span>
          </div>
          <ChevronDown
            size={18}
            className={`text-slate-400 transition-transform duration-300 ${
              isActive ? 'rotate-180' : ''
            }`}
          />
        </button>
        <div
          className={`px-4 overflow-hidden transition-all duration-300 ease-in-out ${
            isActive ? 'max-h-[600px] pb-4 opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div className='text-sm text-slate-600 leading-relaxed pl-12'>
            {children}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div>
      <style>{`
          @keyframes fadeSlideUp { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
          .animate-fade-slide-up { animation: fadeSlideUp 0.5s ease-in-out forwards; }
          .mock-editor-content p { margin-bottom: 0.5em; }
          .mock-editor-content sup { vertical-align: super; font-size: smaller; }

          /* --- CLASSES DE VOTRE CHARTE MOODLE (À adapter avec vos vraies couleurs) --- */
          .mock-editor-content .FondCouleur1 { background-color: #E5F1F2; border: none; padding: 15px; margin: 5px; overflow: hidden; width: 99%; flex: 1;}
          .mock-editor-content .FondCouleur2 { background-color: #F7E8F1; border: none; padding: 15px; margin: 5px; overflow: hidden; width: 99%; flex: 1; }
          .mock-editor-content .FondGris {#F6F6F6; border: none; padding: 15px; margin: 5px; overflow: hidden; width: 99%; flex: 1;  }
          .mock-editor-content .CadreCouleur1 { border: 1px solid #007681; padding: 1rem; margin: 8px 0; }
          .mock-editor-content .Pucecned18 { vertical-align: middle; color: #000000ff; padding-left: 20px; }
          .mock-editor-content .Pucecned18>li::before { padding-right : 5px; content: "•"; color: #4fb3aeff;}
          .mock-editor-content .Puce2cned18 { vertical-align: middle; color: #000000ff; padding-left: 20px; }
          .mock-editor-content .Puce2cned18>li::before { padding-right : 5px; content: "•"; color: #AE2573;}
        `}</style>

      <div className='w-full max-w-7xl bg-white rounded-[2rem] shadow-2xl overflow-hidden flex flex-col lg:flex-row border border-slate-100 animate-fade-slide-up'>
        {/* --- PARTIE GAUCHE : PRÉSENTATION, SIMULATEUR & CTA --- */}
        <div className='lg:w-[40%] p-8 flex flex-col border-r border-slate-100 bg-white animate-fade-slide-up'>
          <header className='mb-6 animate-fade-slide-up'>
            <div className='flex items-center gap-4 mb-2'>
              <div className='p-3 bg-pink-200 rounded-xl shadow-lg shadow-pink-100'>
                <IconPen className='text-pink-700' size={24} />
              </div>
              <div className='flex flex-col'>
                <h1 className='text-L font-black tracking-tight text-slate-800'>
                  Éditeur Moodle Atto+
                </h1>
                <p className='text-pink-600 text-[10px] font-bold tracking-[0.2em]'>
                  SCRIPT TAMPERMONKEY
                </p>
              </div>
            </div>
            <p className='text-slate-500 text-xs mt-4 leading-relaxed'>
              Boostez l'éditeur HTML natif de Moodle (Atto). Ce script injecte
              de nouveaux outils dans votre barre d'édition : nettoyage
              typographique, modèles et confort de lecture.
            </p>
          </header>

          {/* --- ILLUSTRATION DES FONCTIONNALITÉS (Étiquettes animées) --- */}
          <div className='flex-1 flex flex-col space-y-4 my-6'>
            <div className='p-6 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2rem] flex flex-col items-center'>
              <p className='text-slate-400 text-[10px] font-black uppercase tracking-[0.15em] mb-4'>
                Outils injectés dans la barre
              </p>

              <div className='flex flex-wrap justify-center gap-2.5'>
                <span className='flex items-center gap-1.5 px-3 py-2 bg-white text-slate-700 border border-slate-200 text-[11px] font-bold rounded-lg shadow-sm transition-all duration-300 hover:-translate-y-1 hover:scale-105 hover:shadow-md cursor-default select-none'>
                  ▨ Modèles HTML
                </span>

                <span className='flex items-center gap-1.5 px-3 py-2 bg-white text-slate-700 border border-slate-200 text-[11px] font-bold rounded-lg shadow-sm transition-all duration-300 hover:-translate-y-1 hover:scale-105 hover:shadow-md cursor-default select-none'>
                  ✎ Slots personnalisés
                </span>

                <span className='flex items-center gap-1.5 px-3 py-2 bg-white text-slate-700 border border-slate-200 text-[11px] font-bold rounded-lg shadow-sm transition-all duration-300 hover:-translate-y-1 hover:scale-105 hover:shadow-md cursor-default select-none'>
                  ✨ Auto-Typo
                </span>

                <span className='flex items-center gap-1.5 px-3 py-2 bg-white text-slate-700 border border-slate-200 text-[11px] font-bold rounded-lg shadow-sm transition-all duration-300 hover:-translate-y-1 hover:scale-105 hover:shadow-md cursor-default select-none'>
                  ⬍ Auto-extensible
                </span>
              </div>
            </div>
          </div>

          {/* --- SIMULATEUR INTERACTIF --- */}
          <div className='flex-1 flex flex-col my-2'>
            <div className='flex items-center justify-between mb-2 px-1'>
              <span className='text-slate-400 text-[10px] font-black uppercase tracking-[0.1em]'>
                Testez les nouveaux outils ajoutés
              </span>
              <button
                onClick={handleReset}
                className='flex items-center gap-1.5 text-[10px] font-bold text-slate-500 hover:text-indigo-600 transition-colors bg-slate-100 hover:bg-indigo-50 px-2 py-1 rounded-md'
              >
                <RotateCcw size={12} /> RAZ
              </button>
            </div>

            <div className='border border-slate-300 rounded-lg overflow-hidden bg-white shadow-inner flex flex-col transition-all duration-300'>
              <div className='bg-[#f0f0f0] border-b border-slate-300 p-1 flex items-center gap-1'>
                <select
                  onChange={handleTemplateChange}
                  className='bg-transparent w-12 border border-transparent hover:bg-[#e2e2e2] rounded px-1 py-1 text-sm cursor-pointer outline-none text-slate-700 font-bold'
                  title='Insérer un modèle HTML'
                >
                  <option value=''>▨</option>
                  <option value='<div>Titre de la liste :<ul class="Pucecned18"><li>Point 1</li><li>Point 2</li></ul></div><p><br></p>'>
                    ⏺︎ Liste à puces 1
                  </option>
                  <option value='<div>Titre de la liste :<ul class="Puce2cned18"><li>Point 1</li><li>Point 2</li></ul></div><p><br></p>'>
                    ⏺︎ Liste à puces 2
                  </option>
                  <option value='<div class="FondCouleur1 my-2 p-3"><p>Votre texte ici...</p></div><p><br></p>'>
                    ⏹ Encadré plein 1
                  </option>
                  <option value='<div class="FondCouleur2 my-2 p-3"><p>Votre texte ici...</p></div><p><br></p>'>
                    ⏹ Encadré plein 2
                  </option>
                  <option value='<div class="FondGris my-2 p-3"><p>Votre texte ici...</p></div><p><br></p>'>
                    ⏹ Encadré Gris
                  </option>
                  <option value='<div class="CadreCouleur1 my-2 p-3"><p>Votre texte ici...</p></div><p><br></p>'>
                    ☐ Encadré vide
                  </option>
                  <option value=''>Etc. (Accordéon, bloc)</option>
                </select>

                <div className='w-px h-5 bg-slate-300 mx-1'></div>

                <button
                  title="Modifier les slots personnalisés (désactivé dans l'aperçu)"
                  className='p-1.5 text-sm hover:bg-[#e2e2e2] rounded text-slate-600 border border-transparent'
                >
                  ✎
                </button>

                <button
                  onClick={handleTypo}
                  title='Nettoyage typographique'
                  className={`p-1.5 text-sm rounded border transition-colors duration-300 ${
                    typoSuccess
                      ? 'bg-[#d4edda] border-[#28a745] text-[#155724]'
                      : 'hover:bg-[#e2e2e2] border-transparent text-slate-600'
                  }`}
                >
                  ✨
                </button>

                <button
                  onClick={handleResize}
                  title='Rendre auto-extensible'
                  className={`p-1.5 text-sm rounded border transition-colors duration-300 ${
                    isExpanded
                      ? 'bg-[#d4edda] border-[#28a745] text-[#155724]'
                      : 'hover:bg-[#e2e2e2] border-transparent text-slate-600'
                  }`}
                >
                  ⬍
                </button>
                <button 
                  onClick={toggleSource}
                  title="Basculer en code HTML"
                  className={`p-1.5 text-sm rounded border transition-colors duration-300 font-mono font-bold ${showSource ? 'bg-[#d4edda] border-[#28a745] text-[#155724]' : 'hover:bg-[#e2e2e2] border-transparent text-slate-600'}`}
                >
                  &lt;/&gt;
                </button>
              </div>
              {/* L'éditeur visuel (toujours présent, masqué si showSource est true) */}
              <div 
                ref={editorRef}
                contentEditable="true"
                suppressContentEditableWarning={true}
                className={`mock-editor-content p-3 text-sm text-slate-700 outline-none transition-all duration-300 ease-in-out ${isExpanded ? 'h-auto min-h-[140px]' : 'h-[140px] overflow-y-auto'} ${showSource ? 'hidden' : 'block'}`}
              >
              </div>

              {/* L'éditeur code source (affiché uniquement si showSource est true) */}
              {showSource && (
                <textarea
                  value={sourceCode}
                  onChange={(e) => setSourceCode(e.target.value)}
                  className={`w-full p-3 text-sm font-mono text-slate-700 outline-none resize-none bg-slate-50 transition-all duration-300 ease-in-out ${isExpanded ? 'h-[300px]' : 'h-[140px]'}`}
                />
              )}
            </div>
          </div>

          <button
            onClick={() =>
              window.open('https://gist.github.com/MaximeLy-VS/8a838be0ca64137e4396664ecb2d511b/raw/ResizeATTO.user.js', '_blank')
            }
            className='mt-6 w-full py-4 bg-indigo-900 hover:bg-indigo-800 text-white font-black rounded-xl shadow-xl transition-all flex items-center justify-center gap-3 text-xs uppercase tracking-widest shrink-0 animate-fade-slide-up'
          >
            <IconDownload size={18} />
            Installer le script
          </button>
        </div>

        {/* --- PARTIE DROITE : FONCTIONNEMENT & DETAILS (ACCORDÉONS) --- */}
        <div className='lg:w-[60%] p-8 bg-[#f8fafc] flex flex-col overflow-y-auto'>
          <div className='space-y-6 animate-fade-slide-up h-full pb-10'>
            <div className='flex items-center justify-between pb-4 border-b border-slate-200'>
              <span className='px-3 py-1 rounded-md text-[10px] font-black tracking-widest uppercase border bg-indigo-100 text-indigo-700 border-indigo-200'>
                Documentation
              </span>
            </div>

            <div className='pt-2'>
              <AccordionItem
                id='typo'
                title='Nettoyage Typographique ✨'
                icon={IconWand}
              >
                <p className='mb-2'>
                  Le bouton magique applique un lot de règles strictes sur le
                  texte :
                </p>
                <ul className='list-disc space-y-2 pl-4 text-slate-500 marker:text-slate-300'>
                  <li>
                    <strong>Espaces insécables :</strong> ajout automatique
                    avant les ponctuations doubles (?:!;»€%) et sécurisation des
                    entités existantes.
                  </li>
                  <li>
                    <strong>Unités de mesure :</strong> harmonisation de la
                    casse (ex: <i>kwh</i> devient <i>kWh</i>, <i>ug</i> devient{' '}
                    <i>µg</i>, <i>hz</i> devient <i>Hz</i>).
                  </li>
                  <li>
                    <strong>Exposants :</strong> conversion des abréviations
                    (1er, 2ème) avec l'injection des balises HTML{' '}
                    <code>&lt;sup&gt;</code>.
                  </li>
                  <li>
                    <strong>Guillemets :</strong> remplace les guillemets
                    anglais (" ") par des guillemets français (« »).
                  </li>
                </ul>
              </AccordionItem>

              <AccordionItem
                id='templates'
                title='Modèles HTML chartés & Slots perso ▨'
                icon={IconLayout}
              >
                <p className='mb-2'>
                  Un menu déroulant vous permet d'insérer des blocs HTML courant
                  et pré-chartés directement dans l'éditeur :
                </p>
                <ul className='list-disc space-y-2 pl-4 text-slate-500 marker:text-slate-300'>
                  <li>
                    <strong>Structures :</strong> tableaux, encadrés couleurs,
                    grilles 2 ou 3 colonnes, accordéons.
                  </li>
                  <li>
                    <strong>Listes :</strong> puces spécifiques et listes
                    numérotées à la charte.
                  </li>
                  <li>
                    <strong>Personnalisation :</strong> cliquez sur le bouton
                    "✎" pour enregistrer vos 2 propres modèles de code. Ils
                    seront mémorisés dans votre navigateur.
                  </li>
                </ul>
              </AccordionItem>

              <AccordionItem
                id='expand'
                title="Confort d'édition (Auto-resize) ⬍"
                icon={IconMaximize}
              >
                <p className='mb-2'>
                  Fini les barres de défilement minuscules !
                </p>
                <p className='text-slate-500'>
                  Un clic sur le bouton "⬍" agrandit dynamiquement la zone de
                  texte pour s'adapter à la longueur de votre contenu en
                  désactivant les limites de hauteur de l'éditeur Moodle que
                  vous soyez sur l'éditeur visuel classique ou sur l'éditeur de
                  code source.
                </p>
              </AccordionItem>

              <AccordionItem
                id='installation'
                title="Comment l'installer ?"
                icon={IconSettings}
              >
                <ol className='list-decimal space-y-3 pl-4 marker:text-indigo-600 marker:font-bold'>
                  <li>
                    Installez l'extension <strong>Tampermonkey</strong> sur
                    votre navigateur (Chrome, Firefox ou Edge).
                    <div className='mt-2 mb-2'>
                      <div className='flex flex-wrap gap-2'>
                        <a
                          href='https://www.tampermonkey.net/index.php?browser=chrome'
                          target='_blank'
                          rel='noreferrer'
                          className='px-3 py-1.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 text-xs font-bold rounded-lg transition-colors border border-transparent hover:border-indigo-100'
                        >
                          Chrome
                        </a>
                        <a
                          href='https://www.tampermonkey.net/index.php?browser=edge'
                          target='_blank'
                          rel='noreferrer'
                          className='px-3 py-1.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 text-xs font-bold rounded-lg transition-colors border border-transparent hover:border-indigo-100'
                        >
                          Edge
                        </a>
                        <a
                          href='https://www.tampermonkey.net/index.php?browser=firefox'
                          target='_blank'
                          rel='noreferrer'
                          className='px-3 py-1.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 text-xs font-bold rounded-lg transition-colors border border-transparent hover:border-indigo-100'
                        >
                          Firefox
                        </a>
                        <a
                          href='https://www.tampermonkey.net/index.php?browser=safari'
                          target='_blank'
                          rel='noreferrer'
                          className='px-3 py-1.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 text-xs font-bold rounded-lg transition-colors border border-transparent hover:border-indigo-100'
                        >
                          Safari
                        </a>
                      </div>
                    </div>
                  </li>
                  <li>
                    Cliquez sur le bouton "Installer le script" ci-contre.
                  </li>
                  <li>
                    Cliquez sur <strong>Installer</strong> dans l'onglet
                    Tampermonkey qui vient de s'ouvrir.
                  </li>
                  <li>
                    Rendez-vous sur une page d'édition Moodle (Ressource,
                    Section ou Question) : un nouveau groupe de boutons
                    apparaîtra dans la barre de l'éditeur.
                  </li>
                </ol>
              </AccordionItem>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
