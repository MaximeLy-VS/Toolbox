import React, { useState, useCallback, useEffect, useRef } from 'react';
import { HashRouter as Router, Routes, Route, Link } from 'react-router-dom';
import backgroundImage from './assets/Background.jpg';
import { 
  Upload as IconUpload, 
  Image as IconImage, 
  Copy as IconCopy, 
  Check as IconCheck, 
  AlertCircle as IconAlert, 
  Loader2 as IconLoader, 
  Brain,
  Info,
  PenLine,
  Grid2x2Check as TableOK,
  Table as IconTable,
  Layout as IconLayout,
  ArrowRight,
  Wrench,
  ChevronLeft,
  Sparkles,
  Wand2 as IconWand,
  Download,
  Zap,
  FileText as IconText,
} from 'lucide-react';

/**
 * --- UTILS COMMUNS ---
 * Ces fonctions sont exportées pour être utilisées dans vos fichiers tools/*.jsx
 */ 

export const copyToClipboard = (text) => {
  const textArea = document.createElement("textarea");
  textArea.value = text;
  textArea.style.position = "fixed";
  document.body.appendChild(textArea);
  textArea.select();
  try {
    document.execCommand('copy');
    return true;
  } catch (err) {
    return false;
  } finally {
    document.body.removeChild(textArea);
  }
};

export const copyHTMLTableToClipboard = (elementId) => {
  const el = document.getElementById(elementId);
  if (!el) return false;
  
  let range, sel;
  if (document.createRange && window.getSelection) {
    range = document.createRange();
    sel = window.getSelection();
    sel.removeAllRanges();
    try {
      range.selectNodeContents(el);
      sel.addRange(range);
    } catch (e) {
      range.selectNode(el);
      sel.addRange(range);
    }
    try {
      document.execCommand("copy");
      sel.removeAllRanges();
      return true;
    } catch (err) {
      sel.removeAllRanges();
      return false;
    }
  }
  return false;
};

export const setDpiInPngBase64 = (base64Image, dpi) => {
  try {
    const data = atob(base64Image.split(',')[1]);
    const dataArray = new Uint8Array(data.length);
    for (let i = 0; i < data.length; i++) {
      dataArray[i] = data.charCodeAt(i);
    }
    if (dataArray[0] !== 137 || dataArray[1] !== 80 || dataArray[2] !== 78 || dataArray[3] !== 71) return base64Image;
    const ppm = Math.round(dpi / 0.0254);
    const physChunk = new Uint8Array(21);
    physChunk[3] = 9; physChunk[4] = 112; physChunk[5] = 72; physChunk[6] = 89; physChunk[7] = 115;
    physChunk[8] = (ppm >>> 24) & 255; physChunk[9] = (ppm >>> 16) & 255; physChunk[10] = (ppm >>> 8) & 255; physChunk[11] = ppm & 255;
    physChunk[12] = (ppm >>> 24) & 255; physChunk[13] = (ppm >>> 16) & 255; physChunk[14] = (ppm >>> 8) & 255; physChunk[15] = ppm & 255;
    physChunk[16] = 1;
    let offset = 8;
    while (offset < dataArray.length) {
      const length = (dataArray[offset] << 24) | (dataArray[offset + 1] << 16) | (dataArray[offset + 2] << 8) | dataArray[offset + 3];
      const type = String.fromCharCode(dataArray[offset + 4], dataArray[offset + 5], dataArray[offset + 6], dataArray[offset + 7]);
      if (type === 'IHDR') { offset += 12 + length; break; }
      offset += 12 + length;
    }
    const newDataArray = new Uint8Array(dataArray.length + 21);
    newDataArray.set(dataArray.subarray(0, offset), 0);
    newDataArray.set(physChunk, offset);
    newDataArray.set(dataArray.subarray(offset), offset + 21);
    return 'data:image/png;base64,' + btoa(String.fromCharCode.apply(null, newDataArray));
  } catch (error) {
    return base64Image;
  }
};

/**
 * --- COMPOSANTS UI PARTAGÉS ---
 */

export const CopyButton = ({ text, onClick, label = "Copier", primary = false }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    const success = onClick ? onClick() : copyToClipboard(text);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };
  
  const baseClass = "flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all";
  const colorClass = primary 
    ? (copied ? "bg-emerald-500 text-white" : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm")
    : (copied ? "text-emerald-600 bg-emerald-50" : "text-slate-500 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600");

  return (
    <button onClick={handleCopy} className={`${baseClass} ${colorClass}`}>
      {copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
      {copied ? <span>Copié</span> : <span>{label}</span>}
    </button>
  );
};

const ToolWrapper = ({ children }) => (
  <div className="min-h-screen flex flex-col p-4 md:p-8 animate-in fade-in duration-500">
    <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col min-h-0">
      <Link to="/" className="inline-flex items-center shrink-0 gap-2 text-slate-500 hover:text-indigo-600 font-medium mb-6 group transition-all">
        <div className="p-2 bg-white rounded-xl shadow-sm group-hover:shadow-md transition-all">
          <ChevronLeft size={20} />
        </div>
        Retour au Dashboard
      </Link>
      {children}
    </div>
   <footer className="text-center shrink-0">
     <p className="mt-8 text-slate-400 text-sm">Maxime Lyon</p>
   </footer>
  </div>
);

import ANimageApp from './tools/AN_Image/ANimageApp';
import ANtableApp from './tools/AN_tableau/ANtableApp';
import MockupApp from './tools/Mockup_app/MockupApp';
import AnnotationApp from './tools/AN_Annotation/AnnotationApp';

/**
 * --- DASHBOARD PRINCIPAL ---
 */
const Home = () => {
  const phrases = ["accessibilité numérique", "édition d'images"];
  const animationCSS = " @keyframes slide-vertical { 0%, 20% { transform: translateY(0); } 25%, 45% { transform: translateY(-33.33%); } 50%, 70% { transform: translateY(-66.66%); } 75%, 100% { transform: translateY(0); } } ";

  return (
  <div className="min-h-screen flex flex-col items-center justify-center p-6">
<style dangerouslySetInnerHTML={{ __html: animationCSS }} />

      <header className="mt-18 mb-7 text-center w-full">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-full text-sm font-bold mb-6">
          <Wrench size={16} /> <span>Toolbox</span>
        </div>

        <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-4 tracking-tight flex flex-wrap justify-center items-middle items-center gap-x-2">
          <span>Mes outils</span></h1>
        <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-4 tracking-tight flex flex-wrap justify-center items-middle items-center gap-x-2">
          <span 
            className="inline-block overflow-hidden text-indigo-600 h-[1.2em]"
            style={{ verticalAlign: 'bottom' }}
          >
            <span 
              className="flex flex-col"
              style={{ animation: 'slide-vertical 6s infinite' }}
            >
              {phrases.map((p, i) => (
                <span key={i} className="block whitespace-nowrap h-[1.2em]">{p}</span>
              ))}
              <span className="block whitespace-nowrap h-[1.2em]">{phrases[0]}</span>
            </span>
          </span>
        </h1>

        <p className="text-slate-500 text-lg max-w-xl mx-auto leading-relaxed">
          Une boite à outils pour faciliter la création de contenus accessibles suivant les directives RGAA.
        </p>
      </header>

    <div className="flex flex-col text-left">
      <h2 className="text-3xl font-bold text-slate-600 my-4 tracking-tight text-left">Outils d'analyse pour l'accessibilité numérique</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-6xl">
      {[
        { to: "/tools/AN_Image", title: "Assistant accessibilité des\u00A0images", desc: "Analyse et génération de titre, d'alternative textuelle et\u00A0description\u00A0détaillée.", icon: Brain, color: "bg-blue-600" },
        { to: "/tools/AN_tableau", title: "Assistant accessibilité des\u00A0tableaux", desc: "Mise en forme accessible des\u00A0tableaux.", icon: TableOK, color: "bg-indigo-600" },
        { to: "/", title: "À venir", desc: "D'autres outils pour l'accessibilité numérique à déveloper.", icon: IconLoader, color: "bg-cyan-800" },
      ].map((tool, i) => (
        <Link key={i} to={tool.to} className="group bg-white p-8 rounded-[2.5rem] shadow-xl shadow-indigo-500/5 border border-slate-100 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 flex flex-col items-start text-left gap-4">
          <div className={`p-4 rounded-2xl ${tool.color} text-white shadow-lg`}><tool.icon size={24} /></div>
          <div>
            <h3 className="text-xl font-bold text-slate-800 mb-1 flex items-center gap-2">
              {tool.title} <ArrowRight size={18} className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-indigo-600" />
            </h3>
            <p className="text-slate-400 text-sm">{tool.desc}</p>
          </div>
        </Link>
      ))}
        </div>
      <h2 className="text-3xl font-bold text-slate-600 my-4 tracking-tight text-left">Outils d'édition d'images</h2>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-6xl">
            {[
        { to: "/tools/Mockup_app", title: "Mock-up Studio", desc: "Convertisseur et générateur de\u00A0vignettes et\u00A0bannières.", icon: IconImage, color: "bg-sky-600" },
        { to: "/tools/AN_Annotation", title: "Éditeur de schémas", desc: "Ajoutez facilement des légendes à\u00A0vos\u00A0schémas\u00A0scientifiques ", icon: PenLine, color: "bg-cyan-600" }
      ].map((tool, i) => (
        <Link key={i} to={tool.to} className="group bg-white p-8 rounded-[2.5rem] shadow-xl shadow-indigo-500/5 border border-slate-100 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 flex flex-col items-start text-left gap-4">
          <div className={`p-4 rounded-2xl ${tool.color} text-white shadow-lg`}><tool.icon size={24} /></div>
          <div>
            <h3 className="text-xl font-bold text-slate-800 mb-1 flex items-center gap-2">
              {tool.title} <ArrowRight size={18} className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-indigo-600" />
            </h3>
            <p className="text-slate-400 text-sm">{tool.desc}</p>
          </div>
        </Link>
      ))}
    </div>
  </div>
    <footer><p className="mt-8 text-slate-400 text-sm">Maxime Lyon</p></footer>
  </div>
);
};

export default function App() {
  return (
    <Router>
      <div className="relative min-h-screen font-sans antialiased text-slate-900 bg-[#fbfcfd]" style={{ backgroundImage: `url(${backgroundImage})` }}>       
        <main className="relative z-10">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/tools/AN_Image" element={<ToolWrapper><ANimageApp /></ToolWrapper>} />
            <Route path="/tools/AN_tableau" element={<ToolWrapper><ANtableApp /></ToolWrapper>} />
            <Route path="/tools/Mockup_app" element={<ToolWrapper><MockupApp /></ToolWrapper>} />
            <Route path="/tools/AN_Annotation" element={<ToolWrapper><AnnotationApp /></ToolWrapper>} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
