import React, { useState, useCallback, useEffect, useRef } from 'react';
import { HashRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import backgroundImage from './assets/Background.jpg';
import { 
  Upload as IconUpload, 
  Image as ImageIcon, 
  Copy as IconCopy, 
  Check as IconCheck, 
  AlertCircle as IconAlert, 
  Loader2 as IconLoader, 
  Info,
  Table as IconTable,
  Layout as IconLayout,
  LayoutTemplate,
  ArrowRight,
  Wrench,
  UploadCloud,
  ChevronLeft,
  Sparkles,
  Wand as IconWand,
  Wand2,
  Download,
  Loader2,
  Zap,
  Texte as IconText,
} from 'lucide-react';

const getApiKey = () => {
  try {
    // @ts-ignore
    return import.meta.env.VITE_GEMINI_API_KEY || "";
  } catch (e) {
    return "";
  }
};
  const apiKey = getApiKey();

// --- UTILS COMMUNS ---
const copyToClipboard = (text) => {
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

const CopyButton = ({ text, onClick, label = "Copier", primary = false }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    if (copyToClipboard(text)) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };
  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-500 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-all"
    >
      {copied ? <Check size={14} className="text-green-600" /> : <IconCopy size={14} />}
      {copied ? <span className="text-green-600">Copié</span> : 'Copier'}
    </button>
  );
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

// Fonction spéciale pour copier un tableau HTML de manière à ce que Word l'interprète comme un tableau.
const copyHTMLTableToClipboard = (elementId) => {
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

// Fonction utilitaire pour injecter la métadonnée 90 DPI (pHYs chunk) dans un PNG en Base64
const setDpiInPngBase64 = (base64Image, dpi) => {
  try {
    const data = atob(base64Image.split(',')[1]);
    const dataArray = new Uint8Array(data.length);
    for (let i = 0; i < data.length; i++) {
      dataArray[i] = data.charCodeAt(i);
    }

    if (dataArray[0] !== 137 || dataArray[1] !== 80 || dataArray[2] !== 78 || dataArray[3] !== 71) {
      return base64Image;
    }

    const ppm = Math.round(dpi / 0.0254);
    const physChunk = new Uint8Array(21);
    physChunk[3] = 9;
    physChunk[4] = 112; physChunk[5] = 72; physChunk[6] = 89; physChunk[7] = 115;
    
    physChunk[8] = (ppm >>> 24) & 255; physChunk[9] = (ppm >>> 16) & 255; physChunk[10] = (ppm >>> 8) & 255; physChunk[11] = ppm & 255;
    physChunk[12] = (ppm >>> 24) & 255; physChunk[13] = (ppm >>> 16) & 255; physChunk[14] = (ppm >>> 8) & 255; physChunk[15] = ppm & 255;
    physChunk[16] = 1;

    const crcTable = [];
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (0xEDB88320 ^ (c >>> 1));
      crcTable[n] = c;
    }

    let offset = 8;
    while (offset < dataArray.length) {
      const length = (dataArray[offset] << 24) | (dataArray[offset + 1] << 16) | (dataArray[offset + 2] << 8) | dataArray[offset + 3];
      const type = String.fromCharCode(dataArray[offset + 4], dataArray[offset + 5], dataArray[offset + 6], dataArray[offset + 7]);
      if (type === 'IHDR') {
        offset += 12 + length;
        break;
      }
      offset += 12 + length;
    }

    const newDataArray = new Uint8Array(dataArray.length + 21);
    newDataArray.set(dataArray.subarray(0, offset), 0);
    newDataArray.set(physChunk, offset);
    newDataArray.set(dataArray.subarray(offset), offset + 21);

    let newBase64 = '';
    for (let i = 0; i < newDataArray.length; i++) {
      newBase64 += String.fromCharCode(newDataArray[i]);
    }
    return 'data:image/png;base64,' + btoa(newBase64);
  } catch (error) {
    console.error("Erreur injection DPI:", error);
    return base64Image;
  }
};

// --- COMPOSANT LAYOUT POUR LES OUTILS ---
const ToolWrapper = ({ children, title }) => (
  <div className="min-h-screen p-4 md:p-8 animate-in fade-in duration-500">
    <div className="max-w-7xl mx-auto">
      <Link to="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-blue-600 font-medium mb-6 group transition-all">
        <div className="p-2 bg-white rounded-xl shadow-sm group-hover:shadow-md transition-all">
          <ChevronLeft size={20} />
        </div>
        Retour au Dashboard
      </Link>
      {children}
    </div>
  </div>
);

/** * --- TOOL 1: ASSISTANT IMAGES (CODE COMPLET INTÉGRÉ) --- 
 */
function ANimageApp() {
 const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const handlePaste = (e) => {
      const items = e.clipboardData.items;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile();
          handleFile(blob);
          break;
        }
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  const handleFile = (selectedFile) => {
    if (!selectedFile || !selectedFile.type.startsWith('image/')) {
      setError("Veuillez sélectionner un fichier image valide.");
      return;
    }
    setError(null);
    setFile(selectedFile);
    setResult(null);
    const objectUrl = URL.createObjectURL(selectedFile);
    setPreviewUrl(objectUrl);
  };

  const processImage = async (imageFile) => {
    if (!apiKey || apiKey === "") {
      setError("Clé API manquante. Vérifiez vos secrets sur GitHub.");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const base64Data = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result.split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(imageFile);
      });

      const response = await fetchWithRetry(base64Data, imageFile.type);
      setResult(response);
    } catch (err) {
      setError("Erreur d'analyse. Vérifiez votre clé API.");
    } finally {
      setLoading(false);
    }
  };

  const fetchWithRetry = async (base64Data, mimeType, maxRetries = 3) => {
    const delays = [1000, 2000, 4000];
    const promptText = `Tu es un expert en accessibilité numérique (RGAA 4.1.2, WCAG 2.2). Ton rôle est d'analyser cette image pour produire des textes d'accessibilité parfaits.

Étape 1 : Détermine si l'image est SIMPLE ou COMPLEXE.
- SIMPLE : L'information peut être contenue dans une phrase courte.
- COMPLEXE : Elle contient des données, une structure (liste, titres) ou trop d'informations pour une phrase courte.

Étape 2 : Rédige selon ces consignes strictes :

1. TITRE : Un titre descriptif et court.

2. ALTERNATIVE TEXTUELLE (attribut alt) :
   - Image SIMPLE : Doit indiquer le contenu visuel et textuel. Limite idéale : 80 caractères. Limite absolue : 125 caractères. Doit être une phrase courte unique.
   - Image COMPLEXE : Doit introduire l'image, préciser son titre et mentionner explicitement qu'une description détaillée est disponible (ex: "Graphique de l'évolution des ventes, description détaillée disponible ci-après").

3. DESCRIPTION DÉTAILLÉE :
   - Obligatoire pour les images COMPLEXES.
   - Doit IMPÉRATIVEMENT commencer par le titre de l'image.
   - Doit se limiter à peu près à 400 caractères, 800 maximum si nécessaire.
   - FOCUS RGAA : Concentre-toi sur le SENS et le MESSAGE. Ne décris les formes et les couleurs QUE si elles sont porteuses d'information (ex: code couleur d'une légende). Sinon, privilégie les données et la logique.
   - Si l'image est SIMPLE : Indique "Non requise pour cette image simple."

Renvoie le résultat au format JSON.`;

    const payload = {
      contents: [{
        role: "user",
        parts: [
          { text: promptText },
          { inlineData: { mimeType: mimeType, data: base64Data } }
        ]
      }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            titre: { type: "STRING" },
            alternative_textuelle: { type: "STRING" },
            description_detaillee: { type: "STRING" },
            complexite: { type: "STRING", enum: ["SIMPLE", "COMPLEXE"] }
          },
          required: ["titre", "alternative_textuelle", "description_detaillee", "complexite"]
        }
      }
    };

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemma-4-31b-it:generateContent?key=${apiKey}`;

    for (let i = 0; i < maxRetries; i++) {
      try {
        const response = await fetch(url, { method: 'POST', body: JSON.stringify(payload) });
        if (!response.ok) throw new Error();
        const data = await response.json();
        return JSON.parse(data.candidates[0].content.parts[0].text);
      } catch (err) {
        if (i === maxRetries - 1) throw err;
        await new Promise(r => setTimeout(r, delays[i]));
      }
    }
  };
  return (
    <ToolWrapper title="Assistant Images">
      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-slide-up {
          animation: fadeSlideUp 0.5s ease-in-out forwards;
        }
        .animate-fade-slide-up-delayed {
          animation: fadeSlideUp 0.5s ease-in-out 0.15s forwards;
          opacity: 0;
        }
      `}</style>

      <div className="w-full max-w-6xl bg-white rounded-[3rem] shadow-[0_30px_100px_rgba(0,0,0,0.08)] overflow-hidden flex flex-col md:flex-row border border-slate-100 animate-fade-slide-up">
        
        {/* --- PARTIE GAUCHE : IMPORT --- */}
        <div className="md:w-[42%] p-8 md:p-12 flex flex-col border-r border-slate-50 bg-white">
          <header className="mb-10 animate-fade-slide-up">
            <div className="flex items-center gap-4 mb-3">
              <div className="p-3 bg-indigo-600 rounded-2xl shadow-xl shadow-indigo-100">
                <ImageIcon className="text-white" size={24} />
              </div>
              <div className="flex flex-col">
                <h1 className="text-L font-black tracking-tight text-slate-800">Assistant d'accessibilité des images</h1>
                <p className="text-slate-500 text-[10px] tracking-[0.2em]">Générez des alternatives et descriptions</p>
              </div>
            </div>
          </header>

          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleFile(e.dataTransfer.files[0]); }}
            className={`flex-1 flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-[2.5rem] transition-all bg-white relative mb-6
              ${isDragging ? 'border-indigo-400 bg-indigo-50/30' : 'border-slate-100'}
              ${!file ? 'cursor-pointer hover:border-slate-200' : ''}
            `}
            onClick={() => !file && document.getElementById('file-input').click()}
          >
            <input id="file-input" type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e.target.files[0])} />

            {previewUrl ? (
              <div className="w-full space-y-6">
                <div className="relative group cursor-pointer" onClick={() => document.getElementById('file-input').click()}>
                  <img src={previewUrl} alt="Preview" className="max-h-[320px] mx-auto rounded-2xl shadow-lg border border-slate-50" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-2xl text-white text-xs font-bold tracking-widest">
                    Changer l'image
                  </div>
                </div>
                
                <button
                  onClick={(e) => { e.stopPropagation(); processImage(file); }}
                  disabled={loading}
                  className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl shadow-xl shadow-indigo-100 disabled:bg-slate-200 disabled:shadow-none transition-all flex items-center justify-center gap-3 text-xs tracking-widest"
                >
                  {loading ? <IconLoader size={18} /> : <IconWand size={18} />}
                  {loading ? "Analyse en cours..." : "Lancer l'analyse"}
                </button>
              </div>
            ) : (
              <div className="text-center py-16 space-y-4 pointer-events-none">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300">
                  <IconUpload size={32} />
                </div>
                <div className="space-y-1">
                  <p className="text-slate-800 font-extrabold text-lg leading-tight">Déposez votre visuel</p>
                  <p className="text-slate-400 text-xs">PNG, JPG ou WEBP • Ctrl+V supporté</p>
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="p-4 bg-red-50 text-red-600 rounded-2xl border border-red-100 text-[10px] font-bold flex gap-3 animate-fade-slide-up">
              <IconAlert size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* --- PARTIE DROITE : RÉSULTATS --- */}
        <div className="md:w-[58%] p-8 md:p-16 flex flex-col bg-[#fafbfc] justify-center">
          {result ? (
            <div className="w-full animate-fade-slide-up-delayed space-y-6">
              <div className="flex items-center gap-3 mb-4">
                <span className={`px-4 py-1.5 rounded-full text-[9px] font-black tracking-widest shadow-sm border ${
                  result.complexite === 'SIMPLE' 
                    ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                    : 'bg-indigo-50 text-indigo-600 border-indigo-100'
                }`}>
                  Image {result.complexite}
                </span>
              </div>

              <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 divide-y divide-slate-50">
                <div className="p-8 space-y-2 text-left">
                  <div className="flex justify-between items-center mb-1">
                    <h3 className="text-[10px] font-black text-slate-300 tracking-widest">1. Titre généré</h3>
                    <CopyButton text={result.titre} />
                  </div>
                  <p className="text-base font-extrabold text-slate-800">{result.titre}</p>
                </div>

                <div className="p-8 space-y-2 text-left">
                  <div className="flex justify-between items-center mb-1">
                    <h3 className="text-[10px] font-black text-slate-300 tracking-widest">2. Alternative (alt)</h3>
                    <CopyButton text={result.alternative_textuelle} />
                  </div>
                  <p className="text-sm text-slate-600 font-medium italic leading-relaxed">"{result.alternative_textuelle}"</p>
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-300 pt-1">
                    <IconCheck size={12} className={result.alternative_textuelle.length <= 125 ? "text-emerald-500" : "text-amber-500"} />
                    {result.alternative_textuelle.length} caractères 
                    {result.alternative_textuelle.length > 125 && " (Limite technique Moodle dépassée)"}
                  </div>
                </div>

                <div className="p-8 space-y-3 text-left">
                  <div className="flex justify-between items-center mb-1">
                    <h3 className="text-[10px] font-black text-slate-300 tracking-widest">3. Description détaillée</h3>
                    <CopyButton text={result.description_detaillee} />
                  </div>
                  <div className="p-5 bg-slate-50/50 rounded-2xl prose prose-slate prose-sm max-w-none text-slate-600 whitespace-pre-wrap leading-relaxed text-xs">
                    {result.description_detaillee}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center space-y-4 opacity-20">
              <div className="w-24 h-24 bg-slate-200/50 rounded-[2rem] flex items-center justify-center border-4 border-white shadow-inner">
                <ImageIcon size={48} className="text-slate-400" />
              </div>
              <p className="text-xs font-black uppercase tracking-[0.4em] text-slate-200">Maxime Lyon</p>
            </div>
          )}
        </div>
      </div>
    </ToolWrapper>
  );
}

/** * --- PLACEHOLDERS POUR LES AUTRES OUTILS --- 
 */
const ANtableauApp = () => <ToolWrapper title="Assistant Tableaux"><div className="bg-white p-20 rounded-[3rem] text-center text-slate-400 border border-dashed border-slate-200">Interface Assistant Tableaux (en développement)</div></ToolWrapper>;
const MockupApp = () => <ToolWrapper title="Mock-up Studio"><div className="bg-white p-20 rounded-[3rem] text-center text-slate-400 border border-dashed border-slate-200">Interface Mock-up Studio (en développement)</div></ToolWrapper>;

// --- DASHBOARD ---
const Home = () => (
  <div className="min-h-screen flex flex-col items-center justify-center p-6">
    <div className="max-w-5xl w-full">
      <header className="mb-16 text-center animate-in fade-in slide-in-from-bottom duration-700">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-full text-sm font-semibold mb-6 shadow-sm">
          <Wrench size={16} /> <span>Toolbox Collaborative</span>
        </div>
        <h1 className="text-5xl md:text-6xl font-black text-slate-900 mb-6 tracking-tight">
          Simplifiez votre <span className="text-blue-600">Workflow</span>
        </h1>
        <p className="text-slate-500 text-lg max-w-2xl mx-auto leading-relaxed">
          Une suite d'outils intelligents pour l'accessibilité numérique et la préparation de vos supports visuels.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { to: "/tools/AN_Image", title: "Assistant Images", desc: "Alternatives textuelles et descriptions par IA.", icon: ImageIcon, color: "bg-blue-600" },
          { to: "/tools/AN_tableau", title: "Assistant Tableaux", desc: "Extraction de données complexes depuis vos écrans.", icon: IconTable, color: "bg-indigo-600" },
          { to: "/tools/Mockup_app", title: "Mock-up Studio", desc: "Rendus professionnels et exports optimisés.", icon: IconLayout, color: "bg-purple-600" }
        ].map((tool, i) => (
          <Link 
            key={i} 
            to={tool.to} 
            className="group bg-white p-8 rounded-[2.5rem] shadow-xl shadow-blue-500/5 border border-slate-100 hover:shadow-2xl transition-all duration-300 flex flex-col items-start gap-4 animate-in fade-in zoom-in duration-500"
            style={{ animationDelay: `${i * 100}ms` }}
          >
            <div className={`p-4 rounded-2xl ${tool.color} text-white shadow-lg group-hover:scale-110 transition-transform`}>
              <tool.icon size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-800 mb-2 flex items-center gap-2">
                {tool.title} <ArrowRight size={18} className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-blue-600" />
              </h3>
              <p className="text-slate-500 text-sm leading-relaxed">{tool.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  </div>
);

// --- APP MAIN ---
export default function App() {
  return (
    <Router>
      <div className="relative min-h-screen font-sans antialiased text-slate-900" style={{ backgroundImage: `url(${backgroundImage})` }}>
        <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none opacity-50">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-200/40 blur-[120px] rounded-full" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-200/40 blur-[120px] rounded-full" />
        </div>
        <main className="relative z-10">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/tools/AN_Image" element={<ANimageApp />} />
            <Route path="/tools/AN_tableau" element={<ANtableauApp />} />
            <Route path="/tools/Mockup_app" element={<MockupApp />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
