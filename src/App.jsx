import React from 'react';
import { HashRouter as Router, Routes, Route, Link } from 'react-router-dom';
import backgroundImage from './assets/Background.jpg';
import { 
  Image as ImageIcon, 
  Table as TableIcon, 
  Layout as LayoutIcon, 
  ArrowRight,
  Wrench,
  ChevronLeft
} from 'lucide-react';

/**
 * COMPOSANTS TEMPORAIRES (Placeholder)
 * Pour résoudre les erreurs de compilation, nous définissons les composants ici.
 * Dans votre projet local, vous remplacerez ces imports par vos vrais fichiers.
 */

const ToolLayout = ({ title, children }) => (
  <div className="min-h-screen p-8 bg-slate-50">
    <Link to="/" className="inline-flex items-center gap-2 text-blue-600 font-medium mb-8 hover:gap-3 transition-all">
      <ChevronLeft size={20} />
      Retour au Dashboard
    </Link>
    <div className="bg-white rounded-[2.5rem] p-12 shadow-xl border border-slate-100 max-w-6xl mx-auto">
      <h2 className="text-3xl font-bold mb-6 text-slate-800">{title}</h2>
      {children}
    </div>
  </div>
);

const ANimageApp = () => (
  <ToolLayout title="Assistant AN – Images">
    <div className="p-20 border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center text-slate-400">
      <ImageIcon size={48} className="mb-4" />
      <p>Interface de l'Assistant Images (Gemini IA)</p>
    </div>
  </ToolLayout>
);

const ANtableauApp = () => (
  <ToolLayout title="Assistant AN – Tableaux">
    <div className="p-20 border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center text-slate-400">
      <TableIcon size={48} className="mb-4" />
      <p>Interface de l'Assistant Tableaux (Extraction de données)</p>
    </div>
  </ToolLayout>
);

const MockupApp = () => (
  <ToolLayout title="Mock-up Studio">
    <div className="p-20 border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center text-slate-400">
      <LayoutIcon size={48} className="mb-4" />
      <p>Interface Mock-up Images (Rendu optimisé)</p>
    </div>
  </ToolLayout>
);

/**
 * COMPOSANTS DU DASHBOARD
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
            <Route path="/tools/AN_Image/" element={<ANimageApp />} />
            <Route path="/tools/AN_tableau" element={<ANtableauApp />} />
            <Route path="/tools/Mockup_app" element={<MockupApp />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
