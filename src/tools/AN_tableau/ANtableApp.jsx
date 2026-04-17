import React, { useState, useCallback, useEffect, useRef } from 'react';
import {  apiKey, copyToClipboard, CopyButton, copyHTMLTableToClipboard, setDpiInPngBase64 } from '../../App'; 
import {   Upload as IconUpload, Image as IconImage, Copy as IconCopy, Check as IconCheck, AlertCircle as IconAlert, Loader2 as IconLoader, Info, Table as IconTable, Layout as IconLayout, ArrowRight, Wrench, ChevronLeft, Sparkles, Wand2 as IconWand, Download, Zap, FileText as IconText,} from 'lucide-react';

export default function ANtableauApp() {
  const [inputType, setInputType] = useState('image');
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [rawText, setRawText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  
  // Ref pour l'input de fichier caché
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

  const processContent = async (currentApiKey) => {
    if (!currentApiKey) {
      setError("Clé API manquante. L'environnement ne l'a pas injectée.");
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

      const response = await fetchWithRetry(currentApiKey, inputType, base64Data, mimeType, rawText);
      setResult(response);
    } catch (err) {
      setError("Erreur lors de l'analyse. Vérifiez votre clé API ou votre connexion.");
    } finally {
      setLoading(false);
    }
  };

  const fetchWithRetry = async (key, type, base64Data, mimeType, textData) => {
    const promptText = `Tu es un expert en accessibilité... (votre prompt complet ici)`;
    
    const parts = [{ text: promptText }];
    if (type === 'image') {
      parts.push({ inlineData: { mimeType: mimeType, data: base64Data } });
    } else {
      parts.push({ text: `Données brutes :\n${textData}` });
    }

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ role: "user", parts: parts }] })
    });

    if (!response.ok) throw new Error("Erreur API");
    const data = await response.json();
    return JSON.parse(data.candidates[0].content.parts[0].text);
  };

  // Logique pour afficher le bouton de génération
  const canGenerate = (inputType === 'image' && file) || (inputType === 'text' && rawText.trim().length > 0);

  return (
    <div className="p-4">
      {/* Input caché pour l'explorateur de fichiers */}
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        accept="image/*" 
        onChange={(e) => handleFile(e.target.files[0])} 
      />

      <div className="w-full max-w-7xl bg-white rounded-[2rem] shadow-2xl overflow-hidden flex flex-col lg:flex-row border border-slate-100 min-h-[85vh] mx-auto">
        
        {/* --- PARTIE GAUCHE : IMPORT --- */}
        <div className="lg:w-[40%] p-8 flex flex-col border-r border-slate-100">
          <header className="mb-8">
            <div className="flex items-center gap-4 mb-2">
              <div className="p-3 bg-indigo-600 rounded-xl shadow-lg">
                <IconTable className="text-white" size={24} />
              </div>
              <h1 className="text-lg font-black text-slate-800 tracking-tight">Assistant Tableaux</h1>
            </div>
          </header>

          {/* Onglets */}
          <div className="flex p-1 bg-slate-100 rounded-xl mb-6">
            <button onClick={() => setInputType('image')} className={`flex-1 py-2 text-xs font-bold rounded-lg ${inputType === 'image' ? 'bg-white shadow-sm' : ''}`}>Image</button>
            <button onClick={() => setInputType('text')} className={`flex-1 py-2 text-xs font-bold rounded-lg ${inputType === 'text' ? 'bg-white shadow-sm' : ''}`}>Texte</button>
          </div>

          {/* Zone de contenu variable */}
          <div className="flex-1 flex flex-col min-h-[300px]">
            {inputType === 'image' ? (
              previewUrl ? (
                <div className="relative group cursor-pointer" onClick={() => fileInputRef.current.click()}>
                  <img src={previewUrl} className="max-h-[300px] mx-auto rounded-2xl shadow-md" alt="Preview" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-2xl text-white text-xs font-bold">
                    Changer l'image
                  </div>
                </div>
              ) : (
                <div 
                  onClick={() => fileInputRef.current.click()}
                  className="flex-1 border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center space-y-4 cursor-pointer hover:border-indigo-300 transition-colors"
                >
                  <IconUpload size={40} className="text-slate-300" />
                  <div className="text-center">
                    <p className="font-bold text-slate-600">Déposez votre visuel</p>
                    <p className="text-[10px] text-slate-400">Cliquez pour parcourir</p>
                  </div>
                </div>
              )
            ) : (
              <textarea
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder="Collez vos données ici..."
                className="flex-1 w-full p-4 bg-slate-50 rounded-2xl border-2 border-slate-100 focus:border-indigo-400 outline-none text-sm font-mono resize-none"
              />
            )}
          </div>

          {/* BOUTON DYNAMIQUE */}
          {canGenerate && (
            <button
              onClick={() => processContent(apiKey)}
              disabled={loading}
              className="mt-6 w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl shadow-lg transition-all flex items-center justify-center gap-3 text-xs uppercase tracking-widest animate-fade-slide-up"
            >
              {loading ? <IconLoader className="animate-spin" size={18} /> : <IconWand size={18} />}
              {loading ? "Génération..." : "Générer le tableau accessible"}
            </button>
          )}

          {error && (
            <div className="mt-4 p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 text-xs flex gap-3 animate-fade-slide-up">
              <IconAlert size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* --- PARTIE DROITE : RÉSULTATS (Simplifiée pour l'exemple) --- */}
        <div className="lg:w-[60%] p-8 bg-slate-50 overflow-y-auto">
          {result ? (
            <div className="space-y-6 animate-fade-slide-up">
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                <h3 className="text-xs font-black text-slate-400 uppercase mb-4">Aperçu du résultat</h3>
                <div dangerouslySetInnerHTML={{ __html: result.html_table }} className="overflow-x-auto" />
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center opacity-20">
              <IconTable size={64} />
              <p className="text-xs font-black uppercase mt-4">Prêt pour l'analyse</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
