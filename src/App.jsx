import React from 'react';
import { HashRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { 
  Image as ImageIcon, 
  Table as TableIcon, 
  Layout as LayoutIcon, 
  ArrowRight,
  Wrench,
  ChevronLeft
} from 'lucide-react';
import backgroundImage from './assets/Background.jpg';
import ANimageApp from './tools/AN_Image/ANimageApp';
import ANtableApp from './tools/AN_tableau/ANtableApp';
import MockupApp from './tools/Mockup_app/MockupApp';

const LayoutOutil = ({ titre, children }) => (
  <div className="min-h-screen bg-[#f8fafc] p-4 md:p-8">
    <div className="max-w-6xl mx-auto">
      <Link to="/" className="inline-flex items-center gap-2 text-blue-600 font-medium mb-6 hover:translate-x-[-4px] transition-transform">
        <ChevronLeft size={20} />
        Retour au Dashboard
      </Link>
      <div className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-xl shadow-blue-500/5 border border-slate-100">
        <h2 className="text-3xl font-bold mb-8 text-slate-800">{titre}</h2>
        {children}
      </div>
    </div>
  </div>
);

const ANimageApp = () => (
  <LayoutOutil titre="Assistant AN – Images">
    <div className="aspect-video bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2rem] flex flex-col items-center justify-center text-slate-400 gap-4">
      <ImageIcon size={64} className="opacity-20" />
      <p className="text-lg">Interface de l'outil Assistant Images</p>
      <span className="text-sm px-4 py-2 bg-slate-100 rounded-full text-slate-500 italic">Composant chargé avec succès</span>
    </div>
  </LayoutOutil>
);

const ANtableApp = () => (
  <LayoutOutil titre="Assistant AN – Tableaux">
    <div className="aspect-video bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2rem] flex flex-col items-center justify-center text-slate-400 gap-4">
      <TableIcon size={64} className="opacity-20" />
      <p className="text-lg">Interface de l'outil Assistant Tableaux</p>
      <span className="text-sm px-4 py-2 bg-slate-100 rounded-full text-slate-500 italic">Composant chargé avec succès</span>
    </div>
  </LayoutOutil>
);

const MockupApp = () => (
  <LayoutOutil titre="Mock-up Studio">
    <div className="aspect-video bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2rem] flex flex-col items-center justify-center text-slate-400 gap-4">
      <LayoutIcon size={64} className="opacity-20" />
      <p className="text-lg">Interface de l'outil Mock-up Images</p>
      <span className="text-sm px-4 py-2 bg-slate-100 rounded-full text-slate-500 italic">Composant chargé avec succès</span>
    </div>
  </LayoutOutil>
);

/**
 * LOGIQUE DU DASHBOARD
 */

const ToolCard = ({ to, title, description, icon: Icon, color }) => (
  <Link 
    to={to} 
    className="group relative bg-white/80 backdrop-blur-md p-8 rounded-[2.5rem] shadow-xl shadow-blue-500/5 border border-white/50 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300 flex flex-col items-start gap-4 overflow-hidden"
  >
    <div className={`p-4 rounded-2xl ${color} text-white mb-2 shadow-lg`}>
      <Icon size={28} />
    </div>
    <div>
      <h3 className="text-xl font-bold text-slate-800 mb-2 flex items-center gap-2">
        {title}
        <ArrowRight size={18} className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-blue-500" />
      </h3>
      <p className="text-slate-500 leading-relaxed text-sm">
        {description}
      </p>
    </div>
    {/* Décoration en arrière-plan */}
    <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity text-slate-900 scale-150">
      <Icon size={120} />
    </div>
  </Link>
);

const Home = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50">
      <div className="max-w-5xl w-full">
        <header className="mb-12 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-full text-sm font-medium mb-4">
            <Wrench size={16} />
            <span>Toolbox Collaborative</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-4 tracking-tight">
            Mes Outils <span className="text-blue-600">Productivité</span>
          </h1>
          <p className="text-slate-500 text-lg max-w-2xl mx-auto">
            Une suite d'applications légères conçues pour simplifier les tâches quotidiennes de gestion d'image et de données.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <ToolCard 
            to="/tools/AN_Image"
            title="Assistant Images"
            description="Génération et optimisation de contenus visuels avec l'IA Gemini."
            icon={ImageIcon}
            color="bg-blue-500"
          />
          <ToolCard 
            to="/tools/AN_tableau"
            title="Assistant Tableaux"
            description="Analyse et extraction de données depuis vos captures d'écrans."
            icon={TableIcon}
            color="bg-indigo-500"
          />
          <ToolCard 
            to="/tools/Mockup_app"
            title="Mock-up Studio"
            description="Convertissez vos visuels en rendus professionnels optimisés."
            icon={LayoutIcon}
            color="bg-purple-500"
          />
        </div>

        <footer className="mt-16 text-center text-slate-400 text-sm">
          Développé par Maxime Lyon • 2024
        </footer>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <Router>
      <div className="relative min-h-screen font-sans antialiased text-slate-900 bg-[#f8fafc]">
        {/* Cercles de fond décoratifs */}
        <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-200/30 blur-[120px] rounded-full" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-200/30 blur-[120px] rounded-full" />
        </div>

        <main className="relative z-10">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/tools/AN_Image" element={<ANimageApp />} />
            <Route path="/tools/AN_tableau" element={<ANtableApp />} />
            <Route path="/tools/Mockup_app" element={<MockupApp />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
