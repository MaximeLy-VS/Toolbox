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
  ScanText,
} from 'lucide-react';


export default function GiottoeditorApp() {
  const [activeAccordion, setActiveAccordion] = useState('installation');
  const defaultDemoText = '<p><strong>Bienvenue dans le simulateur !</strong></p><p>Ce texte contient plein d\'erreurs: "guillemets anglais", espaces manquantes avant le point d\'interrogation?</p>    <p>Les unités ne sont pas chartées : le processeur tourne à 50 hz, le fichier pèse 10 ko, et l\'énergie est de 100 kwh.<p><br></p>Classement : Il est arrivé 1er devant le 2ème.</p><p><br></p><p>Vous pouvez maintenant tester le bouton "Nettoyer & Copier" pour voir le résultat.</p>';
  const editorContainerRef = useRef(null);
  const editorInstanceRef = useRef(null);
  const isInitializingRef = useRef(false);
  const [copyStatus, setCopyStatus] = useState({ text: '✨ Nettoyer & Copier', bg: 'bg-[#215d85]' });
  const [isEditorLoaded, setIsEditorLoaded] = useState(false);

  const toggleAccordion = id => {
    setActiveAccordion(activeAccordion === id ? null : id);
  };

  // --- RÈGLES DE NETTOYAGE ---
  const rules = [
    { regex: /([^\s\u00A0])([?:!;»€%])/g, replace: "$1\u00A0$2" },
    { regex: / ([:?!;»€%])/g, replace: "\u00A0$1" },
    { regex: /([«])([^\s\u00A0])/g, replace: "$1\u00A0$2" },
    { regex: /([«]) /g, replace: "$1\u00A0" },
    { regex: /([:;»])(?=[^\s\u00A0])(?![\.\,\)])/g, replace: "$1 " },
    { find: /(\d)(?:\s|\u00A0)*(an|ans)\b/g, replace: "$1\u00A0$2" },
    { find: /(\d)(?:\s|\u00A0)*(%)\b/g, replace: "$1\u00A0%" },
    { regex: /(\d)((?:<\/[a-zA-Z]+>)?)(?:\s|\u00A0)*((?:<[a-zA-Z]+>)?)(?:°|º)(?:\s|\u00A0)*[cC]\b/g, replace: "$1$2\u00A0$3°C" },
    { regex: /([\.?!]\s+)([a-z])/g, replace: (match, p1, p2) => p1 + p2.toUpperCase() },
    { regex: /([A-Za-z0-9])([–])/g, replace: "$1\u00A0$2" },
    { regex: /([–])([A-Za-z0-9])/g, replace: "$1 $2" },
    { regex: /\s+-\s+/g, replace: " – " },
    { regex: /\.\.\./g, replace: ", etc." },
    { regex: /"([^">]+)"/g, replace: "«\u00A0$1\u00A0»" },
    { regex: /(\d)\s*h\s*(\d)/gi, replace: "$1\u00A0h\u00A0$2" },
    { regex: /(\d)\s*(h|m|min|minute|minutes|heure|heures)\b/gi, replace: "$1\u00A0$2" },
    { regex: /(\d)\s*(er)\b/g, replace: "$1<sup>$2</sup>\u00A0" },
    { regex: /(\d)\s*(ème|eme|e)\b/g, replace: "$1<sup>e</sup>\u00A0" },
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
    { regex: /(\d)(?:\s|\u00A0)*g\b/g, replace: "$1\u00A0g" },
    { find: /(\d)(?:\s|\u00A0)*(grammes|kilogrammes)\b/g, replace: "$1\u00A0$2" },
    { regex: /(\d)(?:\s|\u00A0)*dg\b/gi, replace: "$1\u00A0dg" },
    { regex: /(\d)(?:\s|\u00A0)*cg\b/gi, replace: "$1\u00A0cg" },
    { regex: /(\d)(?:\s|\u00A0)*mg\b/gi, replace: "$1\u00A0mg" },
    { regex: /(\d)(?:\s|\u00A0)*ug\b/gi, replace: "$1\u00A0µg" },
    { regex: /(\d)(?:\s|\u00A0)*km\b/gi, replace: "$1\u00A0km" },
    { regex: /(\d)(?:\s|\u00A0)*m\b/g, replace: "$1\u00A0m" },
    { regex: /(\d)(?:\s|\u00A0)*dm\b/gi, replace: "$1\u00A0dm" },
    { regex: /(\d)(?:\s|\u00A0)*cm\b/gi, replace: "$1\u00A0cm" },
    { regex: /(\d)(?:\s|\u00A0)*mm\b/gi, replace: "$1\u00A0mm" }
  ];

    const cleanHtmlContent = (rawHtml) => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(rawHtml, 'text/html');

        doc.querySelectorAll('*').forEach(el => {
        el.removeAttribute('style');
        el.removeAttribute('class');
        });

        const walkAndReplace = (node) => {
        if (node.nodeType === 3) {
            let text = node.nodeValue;
            if (!text.trim() && !text.includes('\u00A0') && !text.includes(' ')) return;

            text = text.replace(/\u00A0/g, ' ');
            rules.forEach(rule => {
            const pattern = rule.regex || rule.find;
            if (pattern) {
                text = text.replace(pattern, rule.replace);
            }
            });

            if (text !== node.nodeValue && text.includes('<')) {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = text;
            const parent = node.parentNode;
            while (tempDiv.firstChild) {
                parent.insertBefore(tempDiv.firstChild, node);
            }
            parent.removeChild(node);
            } else {
            node.nodeValue = text;
            }
        } else if (node.nodeType === 1) {
            Array.from(node.childNodes).forEach(walkAndReplace);
        }
    };

    Array.from(doc.body.childNodes).forEach(walkAndReplace);
    
    let finalHtml = doc.body.innerHTML;
    finalHtml = finalHtml.replace(/\u00A0/g, '&nbsp;');
    finalHtml = finalHtml.replace(/(?:&nbsp;|\s)+<\/p>/gi, '</p>');
    finalHtml = finalHtml.replace(/(?:<p>(?:<br>|&nbsp;)?<\/p>\s*)+<p>/gi, '<p style="margin-top:1rem;">');
    finalHtml = finalHtml.replace(/(?:<p>(?:<br>|&nbsp;)?<\/p>\s*)+$/gi, '');
    finalHtml = finalHtml
      .replace(/<\/p>/g, "</p>\n")
      .replace(/<\/ul>/g, "</ul>\n")
      .replace(/<\/li>/g, "</li>\n")
      .replace(/<\/tr>/g, "</tr>\n")
      .replace(/<\/td>/g, "</td>\n")
      .replace(/<\/table>/g, "</table>\n");

    return finalHtml.trim();
  };

  const handleCleanAndCopy = async () => {
    if (!editorInstanceRef.current) return;

    const rawContent = editorInstanceRef.current.getData();
    const cleanedHtml = cleanHtmlContent(rawContent);
    editorInstanceRef.current.setData(cleanedHtml);

    try {
      const blob = new Blob([cleanedHtml], { type: 'text/html' });
      const clipboardItem = new window.ClipboardItem({ 'text/html': blob });
      await navigator.clipboard.write([clipboardItem]);
      
      setCopyStatus({ text: '✅ Copié ! (Presse-papier riche)', bg: 'bg-emerald-500' });
      setTimeout(() => {
        setCopyStatus({ text: '✨ Nettoyer & Copier', bg: 'bg-[#215d85]' });
      }, 3000);
    } catch (err) {
      console.error('Erreur de copie:', err);
      setCopyStatus({ text: '❌ Erreur de copie', bg: 'bg-red-500' });
    }
  };

  useEffect(() => {
    const initEditor = () => {
      // Sécurité : on empêche la double initialisation
      if (!window.CKEDITOR || !editorContainerRef.current || isInitializingRef.current || editorInstanceRef.current) {
        return;
      }
      
      isInitializingRef.current = true;
      
      window.CKEDITOR.ClassicEditor
        .create(editorContainerRef.current, {
          removePlugins: [
            'RealTimeCollaborativeComments', 'RealTimeCollaborativeTrackChanges', 'RealTimeCollaborativeRevisionHistory',
            'PresenceList', 'Comments', 'TrackChanges', 'TrackChangesData', 'RevisionHistory', 'Pagination', 'WProofreader',
            'MathType', 'ExportPdf', 'ExportWord', 'ImportWord', 'FormatPainter', 'TableOfContents', 'PasteFromOfficeEnhanced',
            'CaseChange', 'Template', 'DocumentOutline', 'CKBox', 'CKFinder', 'AIAssistant', 'SlashCommand'
          ],
          toolbar: [
            'sourceEditing', '|', 'undo', 'redo', '|', 'heading', '|', 'bold', 'italic', 'underline', 
            'fontColor', 'fontBackgroundColor', 'strikethrough', 'link', 'bulletedList',
            'numberedList', 'blockQuote', '|', 'insertTable'
          ],
          table: {
            contentToolbar: ['tableColumn', 'tableRow', 'mergeTableCells', 'tableProperties', 'tableCellProperties', 'toggleTableCaption']
          },
          htmlSupport: {
            allow: [
              { name: 'p', styles: { 'margin-top': true } },
              { name: /.*/, styles: true, classes: true }
            ]
          }
        })
        .then(editor => {
          editorInstanceRef.current = editor;
          setIsEditorLoaded(true);
          isInitializingRef.current = false;
          // Texte de démo par défaut
          editor.setData(defaultDemoText);
        })
        .catch(error => {
          console.error('Erreur CKEditor:', error);
          isInitializingRef.current = false;
        });
    };

    const scriptId = 'ckeditor-cdn-script';
    let script = document.getElementById(scriptId);

    // Injection unique du script
    if (!script) {
      script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://cdn.ckeditor.com/ckeditor5/40.0.0/super-build/ckeditor.js";
      script.async = true;
      script.onload = initEditor;
      document.body.appendChild(script);
    } else if (window.CKEDITOR) {
      // Si le script est déjà là et chargé (ex: navigation sur le site)
      initEditor();
    } else {
      // Si le script est en cours de chargement
      script.addEventListener('load', initEditor);
    }

    // Fonction de nettoyage exécutée par React au démontage
    return () => {
      if (script) {
        script.removeEventListener('load', initEditor);
      }
      if (editorInstanceRef.current) {
        editorInstanceRef.current.destroy().then(() => {
          editorInstanceRef.current = null;
        }).catch(err => console.warn('Destruction éditeur:', err));
      }
    };
  }, []);

    const handleReset = () => {
    if (editorInstanceRef.current) {
      editorInstanceRef.current.setData(defaultDemoText);
      // Optionnel : on réinitialise aussi l'état du bouton de copie au cas où
      setCopyStatus({ text: '✨ Nettoyer & Copier', bg: 'bg-[#215d85]' });
    }
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
          .ck-editor__editable_inline { min-height: 200px !important; max-height: 400px !important; overflow-y: auto; }
      `}</style>

      <div className='w-full max-w-7xl bg-white rounded-[2rem] shadow-2xl overflow-hidden flex flex-col lg:flex-row border border-slate-100 animate-fade-slide-up'>
{/* --- PARTIE GAUCHE --- */}
        <div className='lg:w-[45%] p-8 flex flex-col border-r border-slate-100 bg-white animate-fade-slide-up'>
          <header className='mb-6 animate-fade-slide-up'>
            <div className='flex items-center gap-4 mb-2'>
              <div className='p-3 bg-red-400 rounded-xl shadow-lg shadow-pink-100'>
                <ScanText className='text-white' size={24} />
              </div>
              <div className='flex flex-col'>
                <h1 className='text-L font-black tracking-tight text-slate-800'>Éditeur Giotto enrichi</h1>
                <p className='text-red-600 text-[10px] font-bold tracking-[0.2em]'>SCRIPT TAMPERMONKEY</p>
              </div>
            </div>
            <p className='text-slate-500 text-xs mt-4 leading-relaxed'>
              Intégrez un éditeur enrichi dans Giotto qui vous permettra de mettre en forme les contenus où l'éditeur avancé n'est pas disponible.
            </p>
          </header>

          {/* --- SIMULATEUR INTERACTIF --- */}
          <div className='flex-1 flex flex-col my-2'>
            <div className='flex items-center justify-between mb-4 px-1'>
                <h3 className='font-bold text-slate-800 flex items-center gap-2'>
                  <IconWand size={18} className="text-indigo-600" /> Mon Application
                </h3>
                 <button
                    onClick={handleReset}
                    className='flex items-center gap-1.5 text-[10px] font-bold text-slate-500 hover:text-indigo-600 transition-colors bg-slate-100 hover:bg-indigo-50 px-2 py-1 rounded-md'
                 >
                 <RotateCcw size={12} /> RAZ
                 </button>
            </div>
            
            {/* Conteneur CKEditor */}
            <div className="rounded-xl overflow-hidden shadow-sm border border-slate-200">
               {!isEditorLoaded && <div className="p-8 text-center text-slate-400 text-sm">Chargement de l'éditeur...</div>}
               <div ref={editorContainerRef}></div>
            </div>

            <button
              onClick={handleCleanAndCopy}
              disabled={!isEditorLoaded}
              className={`mt-4 w-full py-3 ${copyStatus.bg} text-white font-bold rounded-lg shadow-md transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50 hover:-translate-y-0.5`}
            >
              {copyStatus.text}
            </button>

            <button
              onClick={() => window.open('https://gist.github.com/MaximeLy-VS/bfac90ca5abeff18541de04ecc6843b8/raw/GiottoeditorApp.user.js', '_blank')}
            className='mt-6 w-full py-4 bg-indigo-900 hover:bg-indigo-800 text-white font-black rounded-xl shadow-xl transition-all flex items-center justify-center gap-3 text-xs uppercase tracking-widest shrink-0 animate-fade-slide-up'
            >
            <IconDownload size={16} /> Installer le script
            </button>
          </div>
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
                title='Nettoyage Typographique ✨ et copie dans le presse-papier'
                icon={IconWand}
              >
                <p className='mb-2'>
                  Le bouton magique applique un lot de règles strictes sur le
                  texte, vous n'avez plus qu'à la coller dans l'éditeur Giotto. Les règles appliquées sont les suivantes :
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
