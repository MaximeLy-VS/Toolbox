import React, { useState, useCallback, useEffect, useRef } from 'react';
import { HashRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { 
  Upload, 
  Image as ImageIcon, 
  Copy, 
  Check, 
  AlertCircle, 
  Loader2, 
  Info,
  Table as TableIcon,
  Layout as LayoutIcon,
  ArrowRight,
  Wrench,
  ChevronLeft,
  Sparkles
} from 'lucide-react';

const getApiKey = () => {
  try {
    // @ts-ignore
    return import.meta.env.VITE_GEMINI_API_KEY || "";
  } catch (e) {
    return "";
  }

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

const CopyButton = ({ text }) => {
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
      {copied ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
      {copied ? <span className="text-green-600">Copié</span> : 'Copier'}
    </button>
  );
};

// --- COMPOSANT LAYOUT POUR LES OUTILS ---
const ToolWrapper = ({ children, title }) => (
  <div className="min-h-screen bg-[#f8fafc] p-4 md:p-8 animate-in fade-in duration-500">
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
      setError("Erreur d'analyse. Vérifiez la connexion ou la clé API.");
    } finally {
      setLoading(false);
    }
  };

  const fetchWithRetry = async (base64Data, mimeType) => {
    const promptText = `Analyse cette image pour l'accessibilité (RGAA/WCAG). Renvoie un JSON avec: titre, alternative_textuelle (max 125 car.), description_detaillee, complexite (SIMPLE ou COMPLEXE).`;
    
    const payload = {
      contents: [{
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

    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    const data = await res.json();
    return JSON.parse(data.candidates[0].content.parts[0].text);
  };

  return (
    <ToolWrapper title="Assistant Images">
      <div className="bg-white rounded-[3rem] shadow-2xl shadow-blue-500/5 overflow-hidden flex flex-col md:flex-row border border-slate-100">
        <div className="md:w-1/2 p-8 md:p-12 border-r border-slate-50">
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-blue-600 rounded-2xl shadow-lg shadow-blue-200">
              <ImageIcon className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">Assistant Accessibilité</h1>
              <p className="text-slate-400 text-xs tracking-wider uppercase">Analyse IA des visuels</p>
            </div>
          </div>

          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleFile(e.dataTransfer.files[0]); }}
            className={`aspect-video flex flex-col items-center justify-center border-2 border-dashed rounded-[2rem] transition-all relative mb-6
              ${isDragging ? 'border-blue-400 bg-blue-50/30' : 'border-slate-100 bg-slate-50/30'}
              ${!file ? 'cursor-pointer hover:border-slate-200' : ''}`}
            onClick={() => !file && document.getElementById('file-input').click()}
          >
            <input id="file-input" type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e.target.files[0])} />
            {previewUrl ? (
              <img src={previewUrl} alt="Preview" className="h-full w-full object-contain rounded-[1.5rem] p-2" />
            ) : (
              <div className="text-center space-y-3">
                <Upload size={32} className="mx-auto text-slate-300" />
                <p className="text-slate-500 font-medium">Déposez votre image ici</p>
              </div>
            )}
          </div>

          {file && (
            <button
              onClick={() => processImage(file)}
              disabled={loading}
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-xl shadow-blue-100 disabled:bg-slate-200 transition-all flex items-center justify-center gap-3"
            >
              {loading ? <Loader2 className="animate-spin" /> : <Sparkles size={20} />}
              {loading ? "Analyse..." : "Lancer l'analyse"}
            </button>
          )}

          {error && <div className="mt-4 p-4 bg-red-50 text-red-600 rounded-xl text-xs font-bold border border-red-100 flex gap-2"><AlertCircle size={16}/>{error}</div>}
        </div>

        <div className="md:w-1/2 p-8 md:p-12 bg-slate-50/50 flex flex-col justify-center">
          {result ? (
            <div className="space-y-6 animate-in slide-in-from-right duration-500">
              <span className="px-3 py-1 bg-white border border-slate-200 rounded-full text-[10px] font-black uppercase tracking-widest text-blue-600">Image {result.complexite}</span>
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-1"><label className="text-[10px] font-bold text-slate-400 uppercase">Titre</label><CopyButton text={result.titre}/></div>
                  <p className="font-bold text-slate-800">{result.titre}</p>
                </div>
                <div className="pt-4 border-t border-slate-50">
                  <div className="flex justify-between items-center mb-1"><label className="text-[10px] font-bold text-slate-400 uppercase">Alternative (Alt)</label><CopyButton text={result.alternative_textuelle}/></div>
                  <p className="text-sm text-slate-600 italic">"{result.alternative_textuelle}"</p>
                </div>
                <div className="pt-4 border-t border-slate-50">
                  <div className="flex justify-between items-center mb-1"><label className="text-[10px] font-bold text-slate-400 uppercase">Description détaillée</label><CopyButton text={result.description_detaillee}/></div>
                  <div className="text-xs text-slate-500 leading-relaxed bg-slate-50 p-4 rounded-xl">{result.description_detaillee}</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center opacity-20"><ImageIcon size={64} className="mx-auto mb-2 text-slate-300"/><p className="text-xs font-bold uppercase tracking-widest">En attente d'analyse</p></div>
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
          { to: "/tools/AN_tableau", title: "Assistant Tableaux", desc: "Extraction de données complexes depuis vos écrans.", icon: TableIcon, color: "bg-indigo-600" },
          { to: "/tools/Mockup_app", title: "Mock-up Studio", desc: "Rendus professionnels et exports optimisés.", icon: LayoutIcon, color: "bg-purple-600" }
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
      <div className="relative min-h-screen font-sans antialiased text-slate-900 bg-[#fbfcfd]">
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
