import React, { useState, useCallback, useEffect, useRef } from 'react';
import { CopyButton, copyHTMLTableToClipboard, setDpiInPngBase64 } from '../../App';
import { Upload as IconUpload, AlertCircle as IconAlert, Loader2 as IconLoader, Info, Table as IconTable, Wand2 as IconWand, FileText as IconText, Check as IconCheck } from 'lucide-react';

const getApiKey = () => {
  try {
    // @ts-ignore
    return import.meta.env.VITE_GEMINI_API_KEY || "";
  } catch (e) {
    return "";
  }
};
const apiKey = getApiKey();

const copyToClipboard = (text) => {
  const textArea = document.createElement("textarea");
  textArea.value = text;
  document.body.appendChild(textArea);
  textArea.select();
  try { document.execCommand('copy'); return true; } 
  catch (err) { return false; } 
  finally { document.body.removeChild(textArea); }
};

export default function ANtableauApp() {
  const [inputType, setInputType] = useState('image');
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [rawText, setRawText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  
  const fileInputRef = useRef(null);

  useEffect(() => {
    const handlePaste = (e) => {
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

  // Logique du prompt et fetch (Inchangée)
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

  const fetchWithRetry = async (key, type, base64Data, mimeType, textData, maxRetries = 3) => {
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
  
  // Condition pour afficher le bouton
  const canGenerate = (inputType === 'image' && file) || (inputType === 'text' && rawText.trim() !== "");

  return (
    <div>
      <style>{`
        .generated-table { width: 100%; border-collapse: collapse; font-size: 0.875rem; text-align: left; }
        .generated-table th, .generated-table td { border: 1px solid #cbd5e1; padding: 0.75rem 1rem; }
        .generated-table thead th { background-color: #f1f5f9; font-weight: 700; color: #334155; }
        .generated-table tbody th { background-color: #f8fafc; font-weight: 600; color: #475569; }
        @keyframes fadeSlideUp { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-slide-up { animation: fadeSlideUp 0.5s ease-in-out forwards; }
      `}</style>

      {/* Input de fichier masqué */}
      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => handleFile(e.target.files[0])} />

      <div className="w-full max-w-7xl bg-white rounded-[2rem] shadow-2xl overflow-hidden flex flex-col lg:flex-row border border-slate-100 min-h-[85vh] animate-fade-slide-up">
        
        {/* --- PARTIE GAUCHE : IMPORT --- */}
        <div className="lg:w-[40%] p-8 flex flex-col border-r border-slate-100 bg-white animate-fade-slide-up">
          <header className="mb-8 animate-fade-slide-up">
            <div className="flex items-center gap-4 mb-2">
              <div className="p-3 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-200">
                <IconTable className="text-white" size={24} />
              </div>
              <div className="flex flex-col">
                <h1 className="text-L font-black tracking-tight text-slate-800">Assistant d'accessibilité des tableaux</h1>
                <p className="text-indigo-600 text-[10px] font-bold tracking-[0.2em]">Générateur de tableaux accessibles</p>
              </div>
            </div>
            <p className="text-slate-500 text-xs mt-4 leading-relaxed">
              Transforme une image ou un texte brut en tableau HTML conforme aux directives RGAA (scope, cellules vides traitées, etc.)
            </p>
          </header>

          <div className="flex p-1 bg-slate-100 rounded-xl mb-6 shrink-0">
            <button onClick={() => setInputType('image')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${inputType === 'image' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500'}`}><IconUpload size={16} /> Image</button>
            <button onClick={() => setInputType('text')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${inputType === 'text' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500'}`}><IconText size={16} /> Texte / CSV</button>
          </div>

          <div className="flex-1 flex flex-col relative min-h-[300px]">
            {inputType === 'image' ? (
              previewUrl ? (
                <div className="w-full space-y-6 animate-fade-slide-up">
                  <div className="relative group cursor-pointer" onClick={() => fileInputRef.current.click()}>
                    <img src={previewUrl} alt="Preview" className="max-h-[320px] mx-auto rounded-2xl shadow-lg border border-slate-50" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-2xl text-white text-xs font-bold tracking-widest">Changer l'image</div>
                  </div>
                </div>
              ) : (
                <div onClick={() => fileInputRef.current.click()} className="flex-1 border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center space-y-4 cursor-pointer hover:border-indigo-300 transition-colors">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300"><IconUpload size={32} /></div>
                  <div className="text-center"><p className="text-slate-800 font-extrabold text-lg leading-tight">Déposez votre visuel</p><p className="text-slate-400 text-xs">PNG, JPG ou WEBP • Ctrl+V supporté</p></div>
                </div>
              )
            ) : (
              <textarea value={rawText} onChange={(e) => setRawText(e.target.value)} placeholder="Collez ici les données brutes..." className="flex-1 w-full p-4 border-2 border-slate-200 rounded-2xl bg-slate-50 text-sm font-mono text-slate-700 focus:border-indigo-400 outline-none resize-none" />
            )}
          </div>

          {/* Affichage du bouton uniquement si données présentes */}
          {canGenerate && (
            <button
              onClick={() => processContent()}
              disabled={loading}
              className="mt-6 w-full py-4 bg-indigo-900 hover:bg-indigo-800 text-white font-black rounded-xl shadow-xl transition-all flex items-center justify-center gap-3 text-xs uppercase tracking-widest shrink-0 animate-fade-slide-up"
            >
              {loading ? <IconLoader className="animate-spin" size={18} /> : <IconCheck size={18} />}
              {loading ? "Génération en cours..." : "Générer le tableau"}
            </button>
          )}

          {error && (
            <div className="mt-4 p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 text-xs font-bold flex gap-3 animate-fade-slide-up">
              <IconAlert size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* --- PARTIE DROITE : RÉSULTATS --- */}
        <div className="lg:w-[60%] p-8 bg-[#f8fafc] flex flex-col overflow-y-auto">
          {result ? (
            <div className="space-y-6 animate-fade-slide-up h-full pb-10">
              {/* Le rendu de tes résultats (Titre, Résumé, Tableau) reste ici tel quel */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                 <span className={`px-3 py-1 rounded-md text-[10px] font-black tracking-widest uppercase border ${result.complexite === 'SIMPLE' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>Tableau {result.complexite}</span>
              </div>
              {/* ... reste de ton bloc résultat ... */}
              <div id="generated-table-container" dangerouslySetInnerHTML={{ __html: result.html_table.replace('<table', '<table class="generated-table"') }} />
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-30">
              <div className="w-24 h-24 bg-slate-200 rounded-3xl flex items-center justify-center border-4 border-white shadow-inner"><IconTable size={48} className="text-slate-500" /></div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 max-w-[200px]">En attente de données</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
