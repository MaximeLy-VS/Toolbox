import React, { useState } from 'react';
import { 
  Download as IconDownload, 
  Settings as IconSettings, 
  Wand2 as IconWand,
  LayoutTemplate as IconLayout,
  Maximize as IconMaximize,
  PenTool as IconPen,
  ChevronDown,
  Info
} from 'lucide-react';

export default function AttoCustomApp() {
  // Gestion de l'état des accordéons
  const [activeAccordion, setActiveAccordion] = useState('installation');

  const toggleAccordion = (id) => {
    setActiveAccordion(activeAccordion === id ? null : id);
  };

  const AccordionItem = ({ id, title, icon: Icon, children }) => {
    const isActive = activeAccordion === id;
    return (
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm mb-4 transition-all">
        <button 
          onClick={() => toggleAccordion(id)}
          className="w-full p-4 flex items-center justify-between text-left focus:outline-none hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isActive ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'}`}>
              <Icon size={18} />
            </div>
            <span className="font-bold text-sm text-slate-800">{title}</span>
          </div>
          <ChevronDown 
            size={18} 
            className={`text-slate-400 transition-transform duration-300 ${isActive ? 'rotate-180' : ''}`} 
          />
        </button>
        
        <div className={`px-4 overflow-hidden transition-all duration-300 ease-in-out ${isActive ? 'max-h-[600px] pb-4 opacity-100' : 'max-h-0 opacity-0'}`}>
          <div className="text-sm text-slate-600 leading-relaxed pl-12">
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
      `}</style>

      <div className="w-full max-w-7xl bg-white rounded-[2rem] shadow-2xl overflow-hidden flex flex-col lg:flex-row border border-slate-100 animate-fade-slide-up">
        
        {/* --- PARTIE GAUCHE : PRÉSENTATION & CTA --- */}
        <div className="lg:w-[40%] p-8 flex flex-col border-r border-slate-100 bg-white animate-fade-slide-up">
          <header className="mb-8 animate-fade-slide-up">
            <div className="flex items-center gap-4 mb-2">
              <div className="p-3 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-200">
                <IconPen className="text-white" size={24} />
              </div>
              <div className="flex flex-col">
                <h1 className="text-L font-black tracking-tight text-slate-800">Éditeur Moodle Atto+</h1>
                <p className="text-indigo-600 text-[10px] font-bold tracking-[0.2em]">SCRIPT TAMPERMONKEY</p>
              </div>
            </div>
            <p className="text-slate-500 text-xs mt-4 leading-relaxed">
              Boostez l'éditeur HTML natif de Moodle (Atto). Ce script injecte automatiquement de nouveaux outils dans votre barre d'édition : nettoyage typographique en un clic, modèles HTML et confort de lecture.
            </p>
          </header>

          {/* --- ILLUSTRATION DES FONCTIONNALITÉS (Étiquettes animées) --- */}
          <div className="flex-1 flex flex-col justify-center space-y-4 my-6">
            <div className="p-6 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2rem] flex flex-col items-center">
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.15em] mb-4">
                Outils injectés dans la barre
              </p>
              
              <div className="flex flex-wrap justify-center gap-2.5">
                <span className="flex items-center gap-1.5 px-3 py-2 bg-white text-slate-700 border border-slate-200 text-[11px] font-bold rounded-lg shadow-sm transition-all duration-300 hover:-translate-y-1 hover:scale-105 hover:shadow-md cursor-default select-none">
                  ▨ Modèles HTML
                </span>
                
                <span className="flex items-center gap-1.5 px-3 py-2 bg-white text-slate-700 border border-slate-200 text-[11px] font-bold rounded-lg shadow-sm transition-all duration-300 hover:-translate-y-1 hover:scale-105 hover:shadow-md cursor-default select-none">
                  ✎ Slots personnalisés
                </span>
                
                <span className="flex items-center gap-1.5 px-3 py-2 bg-white text-slate-700 border border-slate-200 text-[11px] font-bold rounded-lg shadow-sm transition-all duration-300 hover:-translate-y-1 hover:scale-105 hover:shadow-md cursor-default select-none">
                  ✨ Auto-Typo
                </span>
                
                <span className="flex items-center gap-1.5 px-3 py-2 bg-white text-slate-700 border border-slate-200 text-[11px] font-bold rounded-lg shadow-sm transition-all duration-300 hover:-translate-y-1 hover:scale-105 hover:shadow-md cursor-default select-none">
                  ⬍ Auto-extensible
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => window.open('LIEN_VERS_LE_FICHIER_RAW_USERJS', '_blank')}
            className="mt-6 w-full py-4 bg-indigo-900 hover:bg-indigo-800 text-white font-black rounded-xl shadow-xl transition-all flex items-center justify-center gap-3 text-xs uppercase tracking-widest shrink-0 animate-fade-slide-up"
          >
            <IconDownload size={18} />
            Installer le script
          </button>
        </div>

        {/* --- PARTIE DROITE : FONCTIONNEMENT & DETAILS (ACCORDÉONS) --- */}
        <div className="lg:w-[60%] p-8 bg-[#f8fafc] flex flex-col overflow-y-auto">
          <div className="space-y-6 animate-fade-slide-up h-full pb-10">
         
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <span className="px-3 py-1 rounded-md text-[10px] font-black tracking-widest uppercase border bg-indigo-100 text-indigo-700 border-indigo-200">
                Documentation
              </span>
            </div>

            <div className="pt-2">

              {/* Accordéon 1 : Typographie */}
              <AccordionItem id="typo" title="✨ Nettoyage Typographique" icon={IconWand}>
                <p className="mb-2">Le bouton magique applique un lot de règles strictes sur le texte</p>
                <ul className="list-disc space-y-2 pl-4 text-slate-500 marker:text-slate-300">
                  <li><strong>Espaces insécables :</strong> ajout automatique avant les ponctuations doubles (?:!;»€%) et sécurisation des entités existantes.</li>
                  <li><strong>Unités de mesure :</strong> harmonisation de la casse (ex: <i>kwh</i> devient <i>kWh</i>, <i>ug</i> devient <i>µg</i>, <i>hz</i> devient <i>Hz</i>).</li>
                  <li><strong>Exposants :</strong> conversion des abréviations (1er, 2ème) avec l'injection des balises HTML <code>&lt;sup&gt;</code>.</li>
                  <li><strong>Guillemets :</strong> remplace les guillemets anglais (" ") par des guillemets français (« »).</li>
                </ul>
              </AccordionItem>

              {/* Accordéon 2 : Modèles HTML */}
              <AccordionItem id="templates" title="▨ Modèles HTML & Slots perso" icon={IconLayout}>
                 <p className="mb-2">Un menu déroulant vous permet d'insérer des blocs HTML courant et pré-chartés directement dans l'éditeur</p>
                 <ul className="list-disc space-y-2 pl-4 text-slate-500 marker:text-slate-300">
                  <li><strong>Structures :</strong> tableaux, encadrés couleurs, grilles 2 ou 3 colonnes, accordéons.</li>
                  <li><strong>Listes :</strong> puces spécifiques et listes numérotées à la charte.</li>
                  <li><strong>Personnalisation :</strong> cliquez sur le bouton "✎" pour enregistrer vos 2 propres modèles de code. Ils seront mémorisés dans votre navigateur.</li>
                </ul>
              </AccordionItem>
              
              {/* Accordéon 3 : Editeur extensible */}
              <AccordionItem id="expand" title="⬍ Confort d'édition (Auto-resize)" icon={IconMaximize}>
                 <p className="mb-2">Fini les barres de défilement minuscules !</p>
                 <p className="text-slate-500">
                  Un clic sur le bouton "⬍" agrandit dynamiquement la zone de texte pour s'adapter à la longueur de votre contenu en désactivant les limites de hauteur de l'éditeur Moodle que vous soyez sur l'éditeur visuel classique ou sur l'éditeur de code source.
                 </p>
              </AccordionItem>
              
              {/* Accordéon 4 : Installation */}
              <AccordionItem id="installation" title="Comment l'installer ?" icon={IconSettings}>
                <ol className="list-decimal space-y-3 pl-4 marker:text-indigo-600 marker:font-bold">
                  <li>Installez l'extension <strong>Tampermonkey</strong> sur votre navigateur (Chrome, Firefox ou Edge).</li>
                  <li>Cliquez sur le bouton "Installer le script" ci-contre.</li>
                  <li>Cliquez sur <strong>Installer</strong> dans l'onglet Tampermonkey qui vient de s'ouvrir.</li>
                  <li>Rendez-vous sur une page d'édition Moodle (Ressource, Section ou Question) : un nouveau groupe de boutons apparaîtra dans la barre de l'éditeur.</li>
                </ol>
              </AccordionItem>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
