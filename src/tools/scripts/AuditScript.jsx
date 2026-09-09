import React, { useState } from 'react';
import { 
  Download as IconDownload, 
  ShieldCheck, 
  Settings as IconSettings, 
  ListChecks as IconList, 
  Wrench as IconWrench,
  ChevronDown,
  Info
} from 'lucide-react';

export default function AuditEditorialApp() {
  // Gestion de l'état des accordéons pour une UI épurée
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
        
        {/* Contenu masqué affiché conditionnellement */}
        <div className={`px-4 overflow-hidden transition-all duration-300 ease-in-out ${isActive ? 'max-h-[500px] pb-4 opacity-100' : 'max-h-0 opacity-0'}`}>
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
                <ShieldCheck className="text-white" size={24} />
              </div>
              <div className="flex flex-col">
                <h1 className="text-L font-black tracking-tight text-slate-800">Audit Éditorial</h1>
                <p className="text-indigo-600 text-[10px] font-bold tracking-[0.2em]">SCRIPT TAMPERMONKEY</p>
              </div>
            </div>
            <p className="text-slate-500 text-xs mt-4 leading-relaxed">
              Un outil d'assistance pour les intégrateurs et concepteurs. Ce script s'intègre directement sur vos pages Moodle pour analyser en temps réel la qualité typographique, l'état des liens, des fichiers et des modules SCORM.
            </p>
          </header>

          <div className="flex-1 flex flex-col relative justify-center space-y-6">
             <div className="p-6 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2rem] text-center">
                <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-slate-50 flex items-center justify-center mb-4 mx-auto">
                    <IconWrench className="text-indigo-600" size={28} />
                </div>
                <h3 className="text-slate-800 font-bold mb-2">Audit en temps réel</h3>
                <p className="text-slate-500 text-xs">Affiche un panneau flottant discret avec vos outils d'analyse directement sur votre environnement de travail (pre-prod/prod).</p>
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
         
            {/* En-tête des résultats */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <span className="px-3 py-1 rounded-md text-[10px] font-black tracking-widest uppercase border bg-indigo-100 text-indigo-700 border-indigo-200">
                Documentation
              </span>
            </div>

            <div className="pt-2">
              
              {/* Accordéon 1 : Installation */}
              <AccordionItem id="installation" title="Comment l'installer ?" icon={IconSettings}>
                <ol className="list-decimal space-y-3 pl-4 marker:text-indigo-600 marker:font-bold">
                  <li>Installez l'extension <strong>Tampermonkey</strong> sur votre navigateur (Chrome, Firefox ou Edge).</li>
                  <li>Cliquez sur le bouton "Installer le script" ci-contre. Tampermonkey s'ouvrira automatiquement.</li>
                  <li>Cliquez sur <strong>Installer</strong> dans l'onglet Tampermonkey.</li>
                  <li>Rendez-vous sur une page de cours Moodle : un bouton apparaîtra en bas à droite pour ouvrir le panneau d'audit.</li>
                </ol>
              </AccordionItem>

              {/* Accordéon 2 : Usages & Fonctionnement Typo */}
              <AccordionItem id="typo" title="Analyse Éditoriale & Typographique" icon={IconList}>
                <p className="mb-2">Le script surligne visuellement les erreurs directement dans le texte de la page. Passez votre souris sur un surlignage pour voir le correctif suggéré.</p>
                <ul className="list-disc space-y-2 pl-4 text-slate-500 marker:text-slate-300">
                  <li><strong>Outil de recherche multiple :</strong> permet de rechercher plusieurs termes simultanément sur une page et de les mettre en évidence.</li>
                  <li><strong>Espaces & Ponctuation :</strong> détection des espaces insécables manquantes (avant :, ?, !).</li>
                  <li><strong>Unités de mesure :</strong> contrôle de la syntaxe conforme (kg, MHz, kWh, etc.).</li>
                  <li><strong>Outil Hn :</strong> affiche des badges (H1, H2, H3...) directement sur les titres pour contrôler la structure sémantique.</li>
                </ul>
              </AccordionItem>

              {/* Accordéon 3 : Liens, Fichiers et SCORM */}
              <AccordionItem id="tech" title="Vérification technique (Liens, Fichiers, SCORM)" icon={Info}>
                 <p className="mb-2">Des boutons dédiés permettent de lancer des audits ciblés sur les médias de la page.</p>
                 <ul className="list-disc space-y-2 pl-4 text-slate-500 marker:text-slate-300">
                  <li><strong>Liens :</strong> surligne les liens orphelins (vides) ou les liens externes qui ne respectent pas l'accessibilité.</li>
                  <li><strong>Fichiers :</strong> repère les fichiers corrompus, les doublons, et les discordances de nommage entre le lien et le fichier hébergé.</li>
                  <li><strong>SCORM :</strong> analyse l'intégrité des paquets SCORM (cassés, temporaires, doublons) et compare les titres internes avec l'intitulé du cours.</li>
                </ul>
              </AccordionItem>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
