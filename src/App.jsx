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
  Info,
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

const getApiKey = () => {
  try {
    // @ts-ignore
    return import.meta.env.VITE_GEMINI_API_KEY || "";
  } catch (e) {
    return "";
  }
};
export const apiKey = getApiKey();

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
  <div className="min-h-screen p-4 md:p-8 animate-in fade-in duration-500">
    <div className="max-w-7xl mx-auto">
      <Link to="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-medium mb-6 group transition-all">
        <div className="p-2 bg-white rounded-xl shadow-sm group-hover:shadow-md transition-all">
          <ChevronLeft size={20} />
        </div>
        Retour au Dashboard
      </Link>
      {children}
    </div>
  </div>
);

import ANimageApp from './tools/AN_Image/ANimageApp';
import ANtableApp from './tools/AN_tableau/ANtableApp';
import MockupApp from './tools/Mockup_app/MockupApp';

/**
 * --- DASHBOARD PRINCIPAL ---
 */
const Home = () => (
  <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
    <header className="mb-16 animate-in fade-in slide-in-from-bottom duration-700">
      <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-full text-sm font-bold mb-6">
        <Wrench size={16} /> <span>Toolbox</span>
      </div>
      <h1 className="text-5xl font-black text-slate-900 mb-4 tracking-tight">Mes outils <span className="text-indigo-600">accessibilité numérique</span></h1>
      <p className="text-slate-500 text-lg max-w-xl mx-auto leading-relaxed">Une boite à outils pour faciliter la création de contenus accessibles suivant les directives RGAA.</p>
    </header>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-6xl">
      {[
        { to: "/tools/AN_Image", title: "Assistant Images", desc: "Accessibilité des images", icon: IconImage, color: "bg-blue-600" },
        { to: "/tools/AN_tableau", title: "Assistant Tableaux", desc: "Mise en forme accessible des tableaux", icon: IconTable, color: "bg-indigo-600" },
        { to: "/tools/Mockup_app", title: "Mock-up Studio", desc: "Convertisseur et générateur de vignettes", icon: IconLayout, color: "bg-purple-600" }
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
);

export default function App() {
  return (
    <Router>
      <div className="relative min-h-screen font-sans antialiased text-slate-900 bg-[#fbfcfd]" style={{ backgroundImage: `url(${backgroundImage})` }}>
        <div className="fixed inset-0 z-0 pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-full bg-white/60 backdrop-blur-[2px]" />
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-100/40 blur-[120px] rounded-full" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-100/40 blur-[120px] rounded-full" />
        </div>
        
        <main className="relative z-10">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/tools/AN_Image" element={<ToolWrapper><ANimageApp /></ToolWrapper>} />
            <Route path="/tools/AN_tableau" element={<ToolWrapper><ANtableApp /></ToolWrapper>} />
            <Route path="/tools/Mockup_app" element={<ToolWrapper><MockupApp /></ToolWrapper>} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
