import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Upload, Image as ImageIcon, Copy, Check, AlertCircle, Loader2, Info } from 'lucide-react';
import backgroundImage from './assets/Background.jpg';

// --- CONFIGURATION API ---
const getApiKey = () => {
  try {
    // @ts-ignore
    return import.meta.env.VITE_GEMINI_API_KEY || "";
  } catch (e) {
    return "";
  }
};
const apiKey = getApiKey();

// --- ICÔNES SVG ---
const IconUpload = ({ size = 24, className = "" }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>;
const IconTable = ({ size = 24, className = "" }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="9" x2="9" y2="21"/><line x1="15" y1="9" x2="15" y2="21"/></svg>;
const IconCopy = ({ size = 24, className = "" }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>;
const IconCheck = ({ size = 24, className = "" }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="20 6 9 17 4 12"/></svg>;
const IconAlert = ({ size = 24, className = "" }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>;
const IconLoader = ({ size = 24, className = "" }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`animate-spin ${className}`}><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/></svg>;
const IconText = ({ size = 24, className = "" }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="4" y1="7" x2="20" y2="7"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="17" x2="12" y2="17"/></svg>;

// --- UTILS ---
const copyTextToClipboard = (text) => {
  const textArea = document.createElement("textarea");
  textArea.value = text;
  document.body.appendChild(textArea);
  textArea.select();
  try { document.execCommand('copy'); return true; } 
  catch (err) { return false; } 
  finally { document.body.removeChild(textArea); }
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

const CopyButton = ({ text, onClick, label = "Copier", primary = false }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    let success = false;
    if (onClick) {
      success = onClick();
    } else {
      success = copyTextToClipboard(text);
    }
    
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

export default function App() {
  const [inputType, setInputType] = useState('image'); // 'image' ou 'text'
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [rawText, setRawText] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const handlePaste = (e) => {
      // Seulement si on n'est pas en train d'écrire dans le textarea
      if (e.target.tagName === 'TEXTAREA') return;
      
      const items = e.clipboardData.items;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          setInputType('image');
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

  const processContent = async () => {
    if (!apiKey || apiKey === "") {
      setError("Clé API manquante. L'environnement ne l'a pas injectée.");
      return;
    }
    if (inputType === 'image' && !file) {
      setError("Veuillez ajouter une image.");
      return;
    }
    if (inputType === 'text' && rawText.trim() === "") {
      setError("Veuillez coller le texte de votre tableau.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let base64Data = null;
      let mimeType = null;

      if (inputType === 'image') {
        base64Data = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result.split(',')[1]);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        mimeType = file.type;
      }

      const response = await fetchWithRetry(inputType, base64Data, mimeType, rawText);
      setResult(response);
    } catch (err) {
      console.error(err);
      setError("Erreur lors de l'analyse ou clé API invalide.");
    } finally {
      setLoading(false);
    }
  };

  // --- PROMPT OPTIMISÉ POUR Le Guide de fabrication accessible ---
  const getOptimizedPrompt = () => `Tu es un expert en accessibilité numérique (RGAA 4.1.2, WCAG 2.2) et en conception pédagogique.
Ta mission est de transformer les données fournies (image ou texte) en un tableau HTML parfaitement accessible et structuré, destiné à être copié dans Word ou InDesign.

Règles de fabrication strictes issues du Guide de fabrication accessible :
1. ANALYSE ET TITRE : Déduis un titre pertinent et court pour le tableau.
2. RÉSUMÉ (si complexe) : Si le tableau a plusieurs niveaux d'en-tête ou des en-têtes de ligne ET de colonne, rédige un "résumé" expliquant sa structure. Sinon, laisse vide.
3. STRUCTURE HTML STRICTE :
   - Utilise UNIQUEMENT les balises <table>, <thead>, <tbody>, <tr>, <th>, <td>.
   - NE METS PAS de balise <caption> dans le HTML (le titre sera géré dans un champ à part).
   - Les cellules d'en-tête (<th>) DOIVENT avoir un attribut scope="col" (pour les colonnes) ou scope="row" (pour les lignes).
4. RÈGLE DE LA CELLULE VIDE : Si le tableau comporte à la fois des en-têtes de ligne et de colonne, la cellule à leur intersection (en haut à gauche) DOIT être une cellule de donnée vide : <td></td> (ne pas utiliser <th> pour cette intersection).
5. DONNÉES MANQUANTES : AUCUNE cellule ne doit être laissée vide si elle appartient au jeu de données. Remplaces les cases vides, les tirets ou les croix par un tiret demi cadratin "–".
6. CELLULE FUSIONNÉES : Le tableau ne doit pas comporter de cellule fusionnées, défusionnes les cellules et les cases vides generées contiendront un "–". Si les cellules fusionnées servent d'en-têtes et contiennent des sous-section, garder les sous-sections en répétant le contenu de la cellule fusionnées dans chacune des sous-sections en gardant la logique. 
7. RÈGLES TYPOGRAPHIQUES ACCESSIBLES : Garder une typographie lisible, sans surlignage, ne pas écrire des mots entiers en majuscules, sans italique.

Génère UNIQUEMENT un objet JSON valide avec cette structure précise :
{
  "titre": "Titre explicite du tableau",
  "resume": "Résumé détaillé de la structure (ou vide si tableau simple)",
  "html_table": "<table class='table-accessible'>...</table>",
  "complexite": "SIMPLE" ou "COMPLEXE"
}`;

  const fetchWithRetry = async (type, base64Data, mimeType, textData, maxRetries = 3) => {
    const delays = [1000, 2000, 4000];
    const promptText = getOptimizedPrompt();

    // Construction du payload selon la source (Image ou Texte)
    const parts = [{ text: promptText }];
    if (type === 'image') {
      parts.push({ inlineData: { mimeType: mimeType, data: base64Data } });
    } else {
      parts.push({ text: `Voici les données textuelles brutes à structurer en tableau :\n\n${textData}` });
    }

    const payload = {
      contents: [{ role: "user", parts: parts }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            titre: { type: "STRING" },
            resume: { type: "STRING" },
            html_table: { type: "STRING" },
            complexite: { type: "STRING", enum: ["SIMPLE", "COMPLEXE"] }
          },
          required: ["titre", "resume", "html_table", "complexite"]
        }
      }
    };

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemma-4-31b-it:generateContent?key=${apiKey}`;

    for (let i = 0; i < maxRetries; i++) {
      try {
        const response = await fetch(url, { method: 'POST', body: JSON.stringify(payload) });
        if (!response.ok) throw new Error("HTTP " + response.status);
        const data = await response.json();
        return JSON.parse(data.candidates[0].content.parts[0].text);
      } catch (err) {
        if (i === maxRetries - 1) throw err;
        await new Promise(r => setTimeout(r, delays[i]));
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 font-sans text-slate-900 bg-slate-100 bg-gradient-to-br from-indigo-50 to-slate-200" style={{ backgroundImage: `url(${backgroundImage})` }}>
      
      {/* Styles globaux pour le rendu du tableau généré */}
      <style>{`
        .generated-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.875rem;
          text-align: left;
        }
        .generated-table th, .generated-table td {
          border: 1px solid #cbd5e1;
          padding: 0.75rem 1rem;
        }
        .generated-table thead th {
          background-color: #f1f5f9;
          font-weight: 700;
          color: #334155;
        }
        .generated-table tbody th {
          background-color: #f8fafc;
          font-weight: 600;
          color: #475569;
        }
        .generated-table tbody tr:nth-child(even) td {
          background-color: #f8fafc;
        }
      `}</style>

      <div className="w-full max-w-7xl bg-white rounded-[2rem] shadow-2xl overflow-hidden flex flex-col lg:flex-row border border-slate-100 min-h-[85vh]">
        
        {/* --- PARTIE GAUCHE : IMPORT --- */}
        <div className="lg:w-[40%] p-8 flex flex-col border-r border-slate-100 bg-white">
          <header className="mb-8">
            <div className="flex items-center gap-4 mb-2">
              <div className="p-3 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-200">
                <IconTable className="text-white" size={24} />
              </div>
              <div className="flex flex-col">
                <h1 className="text-xl font-black tracking-tight text-slate-800">Accessibilité</h1>
                <p className="text-indigo-600 text-[10px] font-bold tracking-[0.2em] uppercase">Générateur de Tableaux</p>
              </div>
            </div>
            <p className="text-slate-500 text-xs mt-4 leading-relaxed">
              Transforme une image ou un texte brut en tableau HTML conforme aux directives RGAA (scope, cellules vides traitées, etc.)
            </p>
          </header>

          {/* Onglets de sélection du mode d'entrée */}
          <div className="flex p-1 bg-slate-100 rounded-xl mb-6 shrink-0">
            <button 
              onClick={() => setInputType('image')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${inputType === 'image' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <IconUpload size={16} /> Image
            </button>
            <button 
              onClick={() => setInputType('text')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${inputType === 'text' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <IconText size={16} /> Texte / CSV
            </button>
          </div>

          <div className="flex-1 flex flex-col relative min-h-[300px]">
            {inputType === 'image' ? (
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleFile(e.dataTransfer.files[0]); }}
                className={`flex-1 flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-2xl transition-all cursor-pointer bg-slate-50
                  ${isDragging ? 'border-indigo-400 bg-indigo-50/50' : 'border-slate-200 hover:border-indigo-300'}
                `}
                onClick={() => document.getElementById('file-input').click()}
              >
                <input id="file-input" type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e.target.files[0])} />
                {previewUrl ? (
                  <div className="w-full h-full flex flex-col items-center justify-center">
                    <img src={previewUrl} alt="Aperçu" className="max-h-[250px] object-contain rounded-lg shadow-sm mb-4" />
                    <span className="text-xs text-indigo-600 font-bold bg-indigo-50 px-3 py-1 rounded-full">Changer d'image</span>
                  </div>
                ) : (
                  <div className="text-center space-y-3 pointer-events-none">
                    <div className="w-12 h-12 bg-white shadow-sm rounded-full flex items-center justify-center mx-auto text-indigo-400">
                      <IconUpload size={24} />
                    </div>
                    <div>
                      <p className="text-slate-700 font-bold text-sm">Déposez l'image du tableau</p>
                      <p className="text-slate-400 text-xs mt-1">Ctrl+V pour coller</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <textarea
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder="Collez ici les données brutes de votre tableau (Excel, CSV, texte aligné...)"
                className="flex-1 w-full p-4 border-2 border-slate-200 rounded-2xl bg-slate-50 text-sm font-mono text-slate-700 focus:border-indigo-400 focus:ring-0 outline-none resize-none"
              />
            )}
          </div>

          <button
            onClick={processContent}
            disabled={loading}
            className="mt-6 w-full py-4 bg-indigo-900 hover:bg-indigo-800 text-white font-black rounded-xl shadow-xl shadow-indigo-200 disabled:bg-slate-300 disabled:shadow-none transition-all flex items-center justify-center gap-3 text-xs uppercase tracking-widest shrink-0"
          >
            {loading ? <IconLoader size={18} /> : <IconCheck size={18} />}
            {loading ? "Génération en cours..." : "Générer le tableau"}
          </button>

          {error && (
            <div className="mt-4 p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 text-xs font-bold flex gap-3">
              <IconAlert size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* --- PARTIE DROITE : RÉSULTATS --- */}
        <div className="lg:w-[60%] p-8 bg-[#f8fafc] flex flex-col overflow-y-auto">
          {result ? (
            <div className="space-y-6 animate-fade-slide-up h-full pb-10">
              
              {/* En-tête des résultats */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                <span className={`px-3 py-1 rounded-md text-[10px] font-black tracking-widest uppercase border ${
                  result.complexite === 'SIMPLE' 
                    ? 'bg-emerald-100 text-emerald-700 border-emerald-200' 
                    : 'bg-amber-100 text-amber-700 border-amber-200'
                }`}>
                  Tableau {result.complexite}
                </span>
              </div>

              {/* Champ : Titre */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">1. Titre (Légende)</label>
                  <CopyButton text={result.titre} />
                </div>
                <input 
                  type="text" 
                  readOnly 
                  value={result.titre} 
                  className="w-full p-3 bg-white border border-slate-200 rounded-xl text-slate-800 font-bold text-sm focus:outline-none"
                />
              </div>

              {/* Champ : Résumé (si complexe) */}
              {result.complexite === 'COMPLEXE' && result.resume && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">2. Résumé (Description)</label>
                    <CopyButton text={result.resume} />
                  </div>
                  <textarea 
                    readOnly 
                    value={result.resume} 
                    rows={3}
                    className="w-full p-3 bg-white border border-slate-200 rounded-xl text-slate-600 text-sm resize-none focus:outline-none"
                  />
                </div>
              )}

              {/* Champ : Tableau rendu */}
              <div className="space-y-2 pt-4">
                <div className="flex justify-between items-end mb-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">3. Tableau généré</label>
                    <p className="text-[10px] text-slate-400">Ce rendu respecte les balises thead, tbody, th (scope) et td.</p>
                  </div>
                  <div className="flex gap-2">
                    <CopyButton text={result.html_table} label="Copier le code HTML" />
                    <CopyButton 
                      onClick={() => copyHTMLTableToClipboard('generated-table-container')} 
                      label="Copier pour Word" 
                      primary={true}
                    />
                  </div>
                </div>
                
                <div 
                  className="bg-white border border-slate-200 rounded-xl overflow-x-auto p-1 shadow-sm"
                  id="generated-table-container"
                >
                  {/* On injecte le HTML rendu en appliquant notre classe CSS */}
                  <div 
                    className="p-4"
                    dangerouslySetInnerHTML={{ 
                      __html: result.html_table.replace('<table', '<table class="generated-table"') 
                    }} 
                  />
                </div>
              </div>

            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-30">
              <div className="w-24 h-24 bg-slate-200 rounded-3xl flex items-center justify-center border-4 border-white shadow-inner">
                <IconTable size={48} className="text-slate-500" />
              </div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 max-w-[200px]">En attente de données</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
