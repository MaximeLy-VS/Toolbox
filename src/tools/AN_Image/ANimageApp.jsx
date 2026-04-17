import React, { useState, useCallback, useEffect, useRef } from 'react';
import { copyToClipboard, CopyButton, apiKey } from '../../App'; 
import {   Upload as IconUpload, Image as IconImage, Copy as IconCopy, Check as IconCheck, AlertCircle as IconAlert, Loader2 as IconLoader, Info, Table as IconTable, Layout as IconLayout, ArrowRight, Wrench, ChevronLeft, Sparkles, Wand2 as IconWand, Download, Zap, FileText as IconText,} from 'lucide-react';

export default function ANimageApp() {
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
   <div>
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
                <IconImage className="text-white" size={24} />
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
                <IconImage size={48} className="text-slate-400" />
              </div>
              <p className="text-xs font-black uppercase tracking-[0.4em] text-slate-200">Maxime Lyon</p>
            </div>
          )}
        </div>
      </div>
         </div>
  );
}
