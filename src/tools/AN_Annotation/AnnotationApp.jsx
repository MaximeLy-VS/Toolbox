import React, { useState, useRef, useEffect } from 'react';
import { 
  UploadCloud, 
  Wand2, 
  PenTool, 
  TextCursorInput,
  Download, 
  Trash2, 
  SquarePen,
  PenLine,
  ChevronLeft, 
  Image as ImageIcon,
  MousePointer2,
  Brain,
  ListPlus,
  Loader2,
  AlertCircle,
  GripHorizontal,
  Slash,
  Square,
  Paintbrush
} from 'lucide-react';

// --- CONFIGURATION EXPORT & API ---
const getApiKey = () => {
  try {
    // @ts-ignore
    return import.meta.env.VITE_GEMINI_API_KEY || "";
  } catch (e) {
    return "";
  }
};
const apiKey = getApiKey();
const EXPORT_CONFIG = {
  fontFamily: "Roboto, sans-serif",
  fontWeight: "600",
  fontSizeRatio: 0.04, 
  textColor: "#1e293b", // slate-800
  bgColor: "#ffffff",   // fond blanc
  lineColor: "#000000", 
  lineWidthRatio: 0.005 // Épaisseur de ligne relative à la largeur de l'image
};

// --- HELPER API RETRY ---
const fetchWithRetry = async (url, options, maxRetries = 5) => {
  let delays = [1000, 2000, 4000, 8000, 16000];
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, options);
      if (response.ok) return response;
      if (i === maxRetries - 1) {
        const errorText = await response.text();
        throw new Error(`Status: ${response.status} - ${errorText}`);
      }
    } catch (err) {
      if (i === maxRetries - 1) throw err;
      await new Promise(res => setTimeout(res, delays[i]));
    }
  }
};

export default function App() {
  // --- STATE MANAGEMENT ---
  const [imageOriginal, setImageOriginal] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageDimensions, setImageDimensions] = useState({ width: 1000, height: 1000 }); // NOUVEAU: Stocke la taille réelle
  const [isCleaning, setIsCleaning] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  
  const [annotations, setAnnotations] = useState([]);
  
  const [activeTool, setActiveTool] = useState('cursor'); // 'cursor', 'legend', 'line', 'rectangle', 'brush'
  const [currentLegendStyle, setCurrentLegendStyle] = useState('white-bg'); 
  const [currentRectStyle, setCurrentRectStyle] = useState('outline'); // NOUVEAU: 'outline', 'filled'
  const [rectColor, setRectColor] = useState('#2563eb'); // NOUVEAU: Couleur pour les zones
  const [brushConfig, setBrushConfig] = useState({ color: '#ef4444', size: 12 }); // Configuration par défaut du pinceau (rouge, taille 12)
  const [draftShape, setDraftShape] = useState(null);
  const [selectedAnnoId, setSelectedAnnoId] = useState(null);
  const [draggingAnnoId, setDraggingAnnoId] = useState(null);

  const containerRef = useRef(null);
  const imageRef = useRef(null);
  const fileInputRef = useRef(null);

  // --- ACTIONS: CHARGEMENT & NETTOYAGE IA ---
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImageOriginal(event.target.result);
        setImagePreview(event.target.result);
        setAnnotations([]);
        setActiveTool('cursor');
        setErrorMsg("");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCleanText = async () => {
    if (!imageOriginal) return;
    setIsCleaning(true);
    setErrorMsg("");

    try {
      const base64Data = imageOriginal.split(',')[1];
      const mimeType = imageOriginal.match(/data:(.*?);base64/)[1];

      const response = await fetchWithRetry(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image-preview:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              role: "user",
              parts: [
                { text: "Tu es un infographiste professionnel qui travaille sur l'édition de schémas scientifiques. En respectant scrupuleusement le visuel d'origine et les couleurs de fond, supprime uniquement les éléments textuels de ce shémas, mots et lettres ainsi que les traits noirs qui les relient au schéma. Ne renvoie que l'image nettoyée." },
                { inlineData: { mimeType, data: base64Data } }
              ]
            }],
            generationConfig: { responseModalities: ['TEXT', 'IMAGE'] }
          })
        }
      );

      const result = await response.json();
      const newImageBase64 = result.candidates?.[0]?.content?.parts?.find(p => p.inlineData)?.inlineData?.data;

      if (newImageBase64) {
        setImagePreview(`data:image/jpeg;base64,${newImageBase64}`);
      } else {
        setErrorMsg("L'IA n'a pas pu traiter l'image. Veuillez réessayer.");
      }
    } catch (error) {
      console.error(error);
      setErrorMsg("Une erreur réseau est survenue lors du nettoyage.");
    } finally {
      setIsCleaning(false);
    }
  };

  // --- ACTIONS: ANNOTATION INTERACTIVE ---
  
  // Fonction pour valider et terminer une ligne continue
  const finishLine = () => {
    setDraftShape(prevDraft => {
      if (prevDraft && prevDraft.type === 'line') {
        const rawPoints = [...prevDraft.points];
        rawPoints.pop(); // Retire le dernier point flottant lié à la souris
        const cleanedPoints = [];
        // Nettoyage des points en double (ex: double clic)
        for (const p of rawPoints) {
          if (cleanedPoints.length === 0) {
            cleanedPoints.push(p);
          } else {
            const prev = cleanedPoints[cleanedPoints.length - 1];
            const dist = Math.hypot(p.x - prev.x, p.y - prev.y);
            if (dist > 0.5) cleanedPoints.push(p);
          }
        }
        if (cleanedPoints.length > 1) {
          const newAnnotation = {
            id: Date.now().toString(),
            type: 'line',
            points: cleanedPoints
          };
          setAnnotations(prev => [...prev, newAnnotation]);
          setSelectedAnnoId(newAnnotation.id);
        }
      }
      return null;
    });
  };

  // Changement d'outil sécurisé (termine un tracé en cours si on change d'outil)
  const changeTool = (tool) => {
    finishLine();
    setActiveTool(tool);
  };

  // Écouteur pour la touche Échap
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' || e.key === 'Enter') finishLine();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const getMousePos = (e) => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100
    };
  };

  const handleMouseDown = (e) => {
    if (activeTool === 'cursor') {
      if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') setSelectedAnnoId(null);
      return;
    }
    const pos = getMousePos(e);
    
    // Logique spéciale pour la ligne continue (Polyligne)
    if (activeTool === 'line') {
      setDraftShape(prev => {
        if (!prev) return { type: 'line', points: [pos, pos] };
        return { ...prev, points: [...prev.points, pos] }; 
      });
      return;
    }

    // Logique spéciale pour le pinceau (Dessin libre)
    if (activeTool === 'brush') {
      setDraftShape({ type: 'brush', points: [pos], color: brushConfig.color, size: brushConfig.size });
      return;
    }

    setDraftShape({ 
      type: activeTool, 
      startX: pos.x, 
      startY: pos.y, 
      endX: pos.x, 
      endY: pos.y, 
      rectStyle: activeTool === 'rectangle' ? currentRectStyle : undefined,
      color: activeTool === 'rectangle' ? rectColor : undefined 
    });
  };

  const handleMouseMove = (e) => {
    if (draggingAnnoId) {
      const pos = getMousePos(e);
      setAnnotations(prev => prev.map(a => a.id === draggingAnnoId ? { ...a, endX: pos.x, endY: pos.y } : a));
      return;
    }
    if (activeTool === 'cursor' || !draftShape) return;
    const pos = getMousePos(e);

    // Mise à jour du point flottant pour la ligne continue
    if (draftShape.type === 'line') {
      setDraftShape(prev => {
        if (!prev) return prev;
        const newPoints = [...prev.points];
        newPoints[newPoints.length - 1] = pos;
        return { ...prev, points: newPoints };
      });
      return;
    }

    // Ajout fluide de points pour le pinceau (avec petite optimisation de distance)
    if (draftShape.type === 'brush') {
      setDraftShape(prev => {
        const lastPoint = prev.points[prev.points.length - 1];
        // On enregistre un point uniquement s'il y a eu un léger mouvement pour optimiser les performances
        const dist = Math.hypot(pos.x - lastPoint.x, pos.y - lastPoint.y);
        if (dist < 0.2) return prev;
        return { ...prev, points: [...prev.points, pos] };
      });
      return;
    }

    setDraftShape(prev => ({ ...prev, endX: pos.x, endY: pos.y }));
  };

  const handleMouseUp = () => {
    if (draggingAnnoId) {
      setDraggingAnnoId(null);
      return;
    }
    if (activeTool === 'cursor' || !draftShape) return;
    
    // Pour la ligne continue, on valide le point et on crée un nouveau point flottant
    if (draftShape.type === 'line') {
      setDraftShape(prev => {
        if (!prev) return prev;
        const lastPoint = prev.points[prev.points.length - 1];
        return {
          ...prev,
          points: [...prev.points, { ...lastPoint }]
        };
      });
      return;
    }
    
    // Validation du tracé libre (Pinceau)
    if (draftShape.type === 'brush') {
      if (draftShape.points.length > 1) {
        const newAnnotation = {
          id: Date.now().toString(),
          ...draftShape
        };
        setAnnotations(prev => [...prev, newAnnotation]);
        setSelectedAnnoId(newAnnotation.id);
      }
      setDraftShape(null);
      return;
    }

    if (Math.abs(draftShape.startX - draftShape.endX) > 1 || Math.abs(draftShape.startY - draftShape.endY) > 1) {
      const newAnnotation = {
        id: Date.now().toString(),
        ...draftShape,
        text: draftShape.type === 'legend' ? '' : undefined,
        style: draftShape.type === 'legend' ? currentLegendStyle : undefined,
        rectStyle: draftShape.type === 'rectangle' ? currentRectStyle : undefined
      };
      setAnnotations(prev => [...prev, newAnnotation]);
      setSelectedAnnoId(newAnnotation.id);
      
      // Auto-switch sur le curseur si on vient de créer une légende (pour taper le texte de suite)
      if (draftShape.type === 'legend') {
        changeTool('cursor');
      }
    }
    setDraftShape(null);
  };

  const handleMouseLeave = () => {
    if (draftShape && draftShape.type === 'line') return; 
    handleMouseUp();
  };

  const handleDoubleClick = (e) => {
    e.preventDefault();
    finishLine();
  };

  const updateAnnotationText = (id, text) => {
    setAnnotations(prev => prev.map(a => a.id === id ? { ...a, text } : a));
  };

  const handleStyleChange = (styleId) => {
    setCurrentLegendStyle(styleId);
    if (selectedAnnoId) {
      setAnnotations(prev => prev.map(a => (a.id === selectedAnnoId && (!a.type || a.type === 'legend')) ? { ...a, style: styleId } : a));
    }
  };

  // NOUVEAU: Gestion du changement de style pour les rectangles
  const handleRectStyleChange = (styleId) => {
    setCurrentRectStyle(styleId);
    if (selectedAnnoId) {
      setAnnotations(prev => prev.map(a => (a.id === selectedAnnoId && a.type === 'rectangle') ? { ...a, rectStyle: styleId } : a));
    }
  };

  // NOUVEAU: Gestion du changement de couleur pour les rectangles
  const handleRectColorChange = (color) => {
    setRectColor(color);
    if (selectedAnnoId) {
      setAnnotations(prev => prev.map(a => (a.id === selectedAnnoId && a.type === 'rectangle') ? { ...a, color: color } : a));
    }
  };

  const deleteAnnotation = (id) => {
    setAnnotations(prev => prev.filter(a => a.id !== id));
    if (selectedAnnoId === id) setSelectedAnnoId(null);
  };

  // Variables d'échelle dynamiques pour un rendu "Pixel Perfect" entre SVG et Canvas
  const standardStrokeWidth = Math.max(3, imageDimensions.width * EXPORT_CONFIG.lineWidthRatio);
  const getBrushStrokeWidth = (size) => Math.max(1, (size / 1000) * imageDimensions.width);
  const anchorRadius = Math.max(4, imageDimensions.width * 0.005);
  const dashArray = `${imageDimensions.width * 0.006} ${imageDimensions.width * 0.004}`;

  // --- EXPORTATION FINALE ---
  const handleExport = () => {
    if (!imagePreview || !imageRef.current) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = imageRef.current;

    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;

    // Constantes d'export basées sur la dimension réelle du canvas
    const exportStandardStrokeWidth = Math.max(3, canvas.width * EXPORT_CONFIG.lineWidthRatio);
    const getExportBrushWidth = (size) => Math.max(1, (size / 1000) * canvas.width);
    const exportAnchorRadius = Math.max(4, canvas.width * 0.005);

    // 1. Fond
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    // 2. Annotations
    annotations.forEach(anno => {
      const type = anno.type || 'legend'; // Fallback compatibilité
      
      if (type === 'legend' && (!anno.text || !anno.text.trim())) return; 

      // Pour le pinceau, le rendu est spécifique car basé sur de multiples points
      if (type === 'brush') {
        if (!anno.points || anno.points.length < 2) return;
        ctx.beginPath();
        ctx.moveTo((anno.points[0].x / 100) * canvas.width, (anno.points[0].y / 100) * canvas.height);
        for (let i = 1; i < anno.points.length; i++) {
          ctx.lineTo((anno.points[i].x / 100) * canvas.width, (anno.points[i].y / 100) * canvas.height);
        }
        ctx.strokeStyle = anno.color;
        // La taille est maintenant mathématiquement identique à la preview
        ctx.lineWidth = getExportBrushWidth(anno.size); 
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();
        return; 
      }

      const startX = (anno.startX / 100) * canvas.width;
      const startY = (anno.startY / 100) * canvas.height;
      const endX = (anno.endX / 100) * canvas.width;
      const endY = (anno.endY / 100) * canvas.height;

      // Configuration générale du tracé
      ctx.strokeStyle = EXPORT_CONFIG.lineColor;
      ctx.lineWidth = exportStandardStrokeWidth;

      // Trait continu, Rectangle ou Légende
      if (type === 'line') {
        ctx.beginPath();
        if (anno.points) {
          ctx.moveTo((anno.points[0].x / 100) * canvas.width, (anno.points[0].y / 100) * canvas.height);
          for (let i = 1; i < anno.points.length; i++) {
             ctx.lineTo((anno.points[i].x / 100) * canvas.width, (anno.points[i].y / 100) * canvas.height);
          }
        } else {
          ctx.moveTo(startX, startY);
          ctx.lineTo(endX, endY);
        }
        ctx.stroke();
      } else if (type === 'legend') {
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
      } else if (type === 'rectangle') {
        ctx.strokeStyle = anno.color || EXPORT_CONFIG.lineColor;
        ctx.beginPath();
        ctx.rect(
          Math.min(startX, endX),
          Math.min(startY, endY),
          Math.abs(startX - endX),
          Math.abs(startY - endY)
        );
        if (anno.rectStyle === 'filled') {
          ctx.fillStyle = anno.color || EXPORT_CONFIG.lineColor;
          ctx.fill();
        } else {
          ctx.stroke();
        }
      }

      // Éléments spécifiques à la Légende (Point + Champ texte)
      if (type === 'legend') {
        // Point d'ancrage
        ctx.beginPath();
        ctx.arc(startX, startY, exportAnchorRadius, 0, 2 * Math.PI);
        ctx.fillStyle = EXPORT_CONFIG.lineColor;
        ctx.fill();

        // Boîte de texte (Support Multi-lignes & Taille proportionnelle)
        const fontSize = Math.max(12, canvas.width * EXPORT_CONFIG.fontSizeRatio); 
        ctx.font = `${EXPORT_CONFIG.fontWeight} ${fontSize}px ${EXPORT_CONFIG.fontFamily}`;
        
        const lines = anno.text.split('\n');

        // Mesure de la hauteur standard avec une lettre référence
        const textMetrics = ctx.measureText("M");
        const fontHeight = textMetrics.actualBoundingBoxAscent + textMetrics.actualBoundingBoxDescent;
        const lineHeight = fontHeight * 1.5; // Espacement interligne

        // Calcul de la largeur max parmi toutes les lignes
        let maxLineWidth = 0;
        lines.forEach(line => {
          const width = ctx.measureText(line).width;
          if (width > maxLineWidth) maxLineWidth = width;
        });

        const paddingX = canvas.width * 0.015;
        const paddingY = canvas.height * 0.015;
        const rectWidth = maxLineWidth + paddingX * 2;
        const rectHeight = (lines.length * lineHeight) + paddingY * 1.5;

        const styleId = anno.style || 'white-bg';
        const isNoBg = styleId === 'no-bg';
        const isBlackBg = styleId === 'black-bg';
        
        const bgColor = isBlackBg ? '#0f172a' : EXPORT_CONFIG.bgColor; // slate-900 vs blanc
        const textColor = isBlackBg ? '#ffffff' : EXPORT_CONFIG.textColor; // blanc vs slate-800

        // Dessin du fond centré sur (endX, endY) - Sauté si "no-bg"
        if (!isNoBg) {
          ctx.fillStyle = bgColor;
          ctx.beginPath();
          ctx.roundRect(endX - rectWidth/2, endY - rectHeight/2, rectWidth, rectHeight, 4);
          ctx.fill();
        }

        // Dessin du texte (centré ligne par ligne)
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Point de départ Y pour la première ligne afin que le bloc soit centré
        let currentY = endY - (rectHeight / 2) + paddingY + (lineHeight / 2);
        
        lines.forEach(line => {
          // Habillage (Halo) pour le mode sans fond afin de cacher le trait et garantir la lisibilité
          if (isNoBg) {
            ctx.lineJoin = 'round';
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = Math.max(4, canvas.width * 0.012); // Épaisseur proportionnelle
            ctx.strokeText(line, endX, currentY);
          }
          
          ctx.fillStyle = textColor;
          ctx.fillText(line, endX, currentY);
          currentY += lineHeight;
        });
      } // Fin du if(type === 'legend')
    });

    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = 'schema_annote.png';
    link.href = dataUrl;
    link.click();
  };

  // --- RENDU UI ---
  return (
    <div className="min-h-screen bg-[#f1f5f9] text-slate-800 font-sans p-6 md:p-10 flex flex-col items-center">
      
      {/* BOUTON RETOUR (Hors carte) */}
      <div className="w-full max-w-[1400px] flex items-center justify-start mb-6">
        <button className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-medium bg-white/50 px-4 py-2 rounded-full shadow-sm backdrop-blur-sm transition-all">
          <ChevronLeft className="w-4 h-4" />
          Retour au Dashboard
        </button>
      </div>

      {/* CARTE PRINCIPALE (Split View) */}
      <div className="w-full max-w-[1400px] bg-white rounded-[2rem] shadow-xl overflow-hidden flex flex-col lg:flex-row min-h-[750px] border border-slate-100">
        
        {/* === PANNEAU GAUCHE : IMPORT & OUTILS (40%) === */}
        <div className="w-full lg:w-[40%] flex flex-col border-r border-slate-100 p-8 lg:p-12 relative bg-white z-10">
          
          {/* Header */}
          <div className="flex items-start gap-4 mb-10">
            <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-600/20 shrink-0">
              <PenLine className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 leading-tight">
                Éditeur de schémas
              </h1>
              <p className="text-blue-600 text-sm font-semibold mt-1">
                Ajoutez facilement des légendes à&nbsp;vos&nbsp;schémas scientifiques 
              </p>
            </div>
          </div>

          {/* Messages d'erreur */}
          {errorMsg && (
            <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl flex items-start gap-3 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p>{errorMsg}</p>
            </div>
          )}

          {/* Zone d'import dynamique */}
          {!imageOriginal ? (
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 border-2 border-dashed border-slate-200 rounded-[2rem] flex flex-col items-center justify-center p-8 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50/50 transition-all group"
            >
              <div className="w-16 h-16 bg-white shadow-sm border border-slate-100 text-blue-600 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <UploadCloud className="w-7 h-7" />
              </div>
              <h2 className="text-xl font-bold mb-2">Déposez votre visuel</h2>
              <p className="text-slate-400 text-sm">PNG, JPG ou WEBP • Clic ou Glisser-déposer</p>
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/png, image/jpeg, image/webp"
                className="hidden" 
              />
            </div>
          ) : (
            <div className="flex flex-col h-full">
              {/* Outils actifs une fois l'image chargée */}
              <div className="space-y-4 mb-8">
                <button 
                  onClick={handleCleanText}
                  disabled={isCleaning}
                  className="w-full flex items-center justify-center gap-3 bg-blue-50 text-blue-700 hover:bg-blue-100 px-5 py-4 rounded-2xl font-bold transition-all disabled:opacity-50"
                >
                  {isCleaning ? <Loader2 className="w-5 h-5 animate-spin" /> : <Wand2 className="w-5 h-5" />}
                  {isCleaning ? 'Nettoyage par l\'IA en cours...' : 'Effacer le texte d\'origine par IA'}
                </button>

                {/* Nouvelle barre d'outils fusionnée (5 colonnes) */}
                <div className="bg-slate-50 p-2 rounded-2xl border border-slate-200 grid grid-cols-5 gap-1">
                  <button 
                    onClick={() => changeTool('cursor')} 
                    className={`flex flex-col items-center justify-center py-3 px-1 rounded-xl transition-all ${activeTool === 'cursor' ? 'bg-white shadow-sm text-blue-600 ring-1 ring-slate-200' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'}`}
                    title="Sélectionner / Déplacer"
                  >
                    <MousePointer2 className="w-5 h-5 mb-1" />
                    <span className="text-[9px] font-bold uppercase tracking-wide">Curseur</span>
                  </button>
                  <button 
                    onClick={() => changeTool('legend')} 
                    className={`flex flex-col items-center justify-center py-3 px-1 rounded-xl transition-all ${activeTool === 'legend' ? 'bg-white shadow-sm text-blue-600 ring-1 ring-slate-200' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'}`}
                    title="Légende avec texte"
                  >
                    <TextCursorInput className="w-5 h-5 mb-1" />
                    <span className="text-[9px] font-bold uppercase tracking-wide">Légende</span>
                  </button>
                  <button 
                    onClick={() => changeTool('line')} 
                    className={`flex flex-col items-center justify-center py-3 px-1 rounded-xl transition-all ${activeTool === 'line' ? 'bg-white shadow-sm text-blue-600 ring-1 ring-slate-200' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'}`}
                    title="Ligne continue"
                  >
                    <Slash className="w-5 h-5 mb-1" />
                    <span className="text-[9px] font-bold uppercase tracking-wide">Ligne</span>
                  </button>
                  <button 
                    onClick={() => changeTool('rectangle')} 
                    className={`flex flex-col items-center justify-center py-3 px-1 rounded-xl transition-all ${activeTool === 'rectangle' ? 'bg-white shadow-sm text-blue-600 ring-1 ring-slate-200' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'}`}
                    title="Zone rectangulaire"
                  >
                    <Square className="w-5 h-5 mb-1" />
                    <span className="text-[9px] font-bold uppercase tracking-wide">Zone</span>
                  </button>
                  <button 
                    onClick={() => changeTool('brush')} 
                    className={`flex flex-col items-center justify-center py-3 px-1 rounded-xl transition-all ${activeTool === 'brush' ? 'bg-white shadow-sm text-blue-600 ring-1 ring-slate-200' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'}`}
                    title="Pinceau de retouche"
                  >
                    <Paintbrush className="w-5 h-5 mb-1" />
                    <span className="text-[9px] font-bold uppercase tracking-wide">Pinceau</span>
                  </button>
                </div>

                {/* Paramètres du pinceau (Visibles uniquement si l'outil pinceau est actif) */}
                {activeTool === 'brush' && (
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 animate-in fade-in slide-in-from-top-2 space-y-4">
                    <div className="flex items-center justify-between gap-4">
                      <label className="text-xs font-bold text-slate-600 uppercase">Couleur</label>
                      <div className="relative">
                        <input 
                          type="color" 
                          value={brushConfig.color}
                          onChange={(e) => setBrushConfig(prev => ({ ...prev, color: e.target.value }))}
                          className="w-8 h-8 rounded cursor-pointer border-0 p-0 bg-transparent"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-600 uppercase">Taille ({brushConfig.size}px)</label>
                        <div 
                          className="rounded-full bg-slate-300" 
                          style={{ width: brushConfig.size, height: brushConfig.size, backgroundColor: brushConfig.color }}
                        />
                      </div>
                      <input 
                        type="range" 
                        min="2" max="50" step="1"
                        value={brushConfig.size}
                        onChange={(e) => setBrushConfig(prev => ({ ...prev, size: parseInt(e.target.value) }))}
                        className="w-full accent-blue-600"
                      />
                    </div>
                  </div>
                )}

                {/* Sélecteur de style (Visible si outil légende actif ou si légende sélectionnée) */}
                {(activeTool === 'legend' || (selectedAnnoId && annotations.find(a => a.id === selectedAnnoId && (!a.type || a.type === 'legend')))) && (
                  <div className="bg-slate-50 p-1.5 rounded-xl border border-slate-200 flex gap-1 animate-in fade-in slide-in-from-top-2">
                    <button 
                      onClick={() => handleStyleChange('white-bg')}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all border ${currentLegendStyle === 'white-bg' ? 'bg-white shadow-sm border-slate-200 text-slate-800' : 'border-transparent text-slate-500 hover:bg-slate-200/50'}`}
                    >
                      Fond Blanc
                    </button>
                    <button 
                      onClick={() => handleStyleChange('black-bg')}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all border ${currentLegendStyle === 'black-bg' ? 'bg-slate-900 shadow-sm border-slate-900 text-white' : 'border-transparent text-slate-500 hover:bg-slate-200/50'}`}
                    >
                      Fond Noir
                    </button>
                    <button 
                      onClick={() => handleStyleChange('no-bg')}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all border ${currentLegendStyle === 'no-bg' ? 'bg-white/50 shadow-sm border-dashed border-slate-300 text-slate-800' : 'border-transparent text-slate-500 hover:bg-slate-200/50'}`}
                    >
                      Sans Fond
                    </button>
                  </div>
                )}

                {/* NOUVEAU: Sélecteur de style pour Rectangle (Zone) */}
                {(activeTool === 'rectangle' || (selectedAnnoId && annotations.find(a => a.id === selectedAnnoId && a.type === 'rectangle'))) && (
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 animate-in fade-in slide-in-from-top-2 space-y-3">
                    <div className="flex gap-1">
                      <button 
                        onClick={() => handleRectStyleChange('outline')}
                        className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all border ${currentRectStyle === 'outline' ? 'bg-white shadow-sm border-slate-200 text-slate-800' : 'border-transparent text-slate-500 hover:bg-slate-200/50'}`}
                      >
                        Contour
                      </button>
                      <button 
                        onClick={() => handleRectStyleChange('filled')}
                        className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all border ${currentRectStyle === 'filled' ? 'bg-slate-800 shadow-sm border-slate-800 text-white' : 'border-transparent text-slate-500 hover:bg-slate-200/50'}`}
                      >
                        Plein
                      </button>
                    </div>
                    <div className="flex items-center justify-between gap-4 px-1">
                      <label className="text-xs font-bold text-slate-600 uppercase">Couleur de la zone</label>
                      <div className="relative">
                        <input 
                          type="color" 
                          value={rectColor}
                          onChange={(e) => handleRectColorChange(e.target.value)}
                          className="w-8 h-8 rounded cursor-pointer border-0 p-0 bg-transparent"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Liste des annotations */}
              <div className="flex-1 max-h-60 bg-slate-50/50 rounded-2xl p-5 border border-slate-100 overflow-y-auto">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex mb-4 items-center gap-2">
                  <ListPlus className="w-4 h-4" />
                  Légendes actives ({annotations.length})
                </h3>
                
                {annotations.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-6">Ajouter une légende pour commencer</p>
                ) : (
                  <div className="space-y-3">
                    {annotations.map((anno) => (
                      <div 
                        key={anno.id} 
                        className={`flex items-center justify-between p-3 rounded-xl bg-white border transition-all ${
                          selectedAnnoId === anno.id ? 'border-blue-500 ring-2 ring-blue-100' : 'border-slate-200'
                        }`}
                        onClick={() => { 
                          setSelectedAnnoId(anno.id); 
                          changeTool('cursor'); 
                          if (!anno.type || anno.type === 'legend') setCurrentLegendStyle(anno.style || 'white-bg');
                          if (anno.type === 'rectangle') {
                            setCurrentRectStyle(anno.rectStyle || 'outline');
                            setRectColor(anno.color || '#2563eb');
                          }
                        }}
                      >
                        <span className="text-sm font-medium text-slate-700 truncate pr-4 flex items-center gap-2">
                          {(anno.type === 'brush' || anno.type === 'rectangle') && <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: anno.color || '#2563eb' }} />}
                          {anno.type === 'brush' ? 'Retouche pinceau' :
                           anno.type === 'rectangle' ? 'Zone rectangulaire' : 
                           anno.type === 'line' ? 'Ligne simple' :
                           (anno.text ? anno.text.split('\n')[0] : 'Légende vide...')}
                        </span>
                        <button 
                          onClick={(e) => { e.stopPropagation(); deleteAnnotation(anno.id); }}
                          className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Export Button */}
              <button 
                onClick={handleExport}
                className="mt-6 w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-5 py-4 rounded-2xl font-bold transition-all shadow-lg"
              >
                <Download className="w-5 h-5" />
                Exporter le schéma final
              </button>
            </div>
          )}
        </div>

        {/* === PANNEAU DROIT : VISUALISEUR & ÉDITEUR (60%) === */}
        <div className="w-full lg:w-[60%] bg-[#fafafa] relative flex items-center justify-center p-8 lg:p-12 min-h-[500px]">
          
          {!imagePreview ? (
            /* État vide */
            <div className="flex items-center gap-6 text-slate-300 opacity-60">
              <div className="w-20 h-20 rounded-[2rem] bg-slate-200/50 flex items-center justify-center">
                <ImageIcon className="w-8 h-8" />
              </div>
              <ChevronLeft className="w-6 h-6 rotate-180" />
              <div className="w-20 h-20 rounded-[2rem] bg-slate-200/50 flex items-center justify-center flex-col gap-2">
                 <div className="w-8 h-1.5 bg-slate-300 rounded-full"></div>
                 <div className="w-6 h-1.5 bg-slate-300 rounded-full"></div>
                 <div className="w-8 h-1.5 bg-slate-300 rounded-full"></div>
              </div>
              <p className="absolute bottom-1/3 text-sm font-bold tracking-widest text-slate-400 uppercase">
                En attente de données
              </p>
            </div>
          ) : (
            /* Canvas & Image Wrapper */
            <div className="w-full h-full flex items-center pt-8 overflow-hidden">
              {/* Conteneur ajusté précisément à la taille de l'image rendue */}
              <div 
                ref={containerRef}
                className={`relative inline-block max-w-full max-h-full shadow-lg rounded-xl transition-all ${
                  activeTool !== 'cursor' ? 'cursor-crosshair ring-4 ring-blue-500/20' : 'cursor-default'
                }`}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseLeave}
                onDoubleClick={handleDoubleClick}
              >
                {/* Instruction volante pour la ligne continue */}
                {activeTool === 'line' && draftShape && (
                  <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-blue-600/90 text-white px-4 py-2 rounded-full text-xs font-bold shadow-lg animate-pulse pointer-events-none z-20 whitespace-nowrap">
                    Double-cliquez ou appuyez sur Échap pour terminer
                  </div>
                )}

                <img 
                  ref={imageRef}
                  src={imagePreview} 
                  onLoad={(e) => setImageDimensions({ width: e.target.naturalWidth, height: e.target.naturalHeight })}
                  alt="Schéma en cours d'édition" 
                  className={`block max-w-full max-h-[700px] object-contain rounded-xl ${isCleaning ? 'opacity-50 blur-sm' : ''} transition-all duration-300`}
                  draggable="false"
                />

                {/* SVG Overlay unifié avec viewBox pour matcher parfaitement l'échelle de l'export */}
                <svg 
                  className="absolute inset-0 w-full h-full pointer-events-none rounded-xl" 
                  viewBox={`0 0 ${imageDimensions.width} ${imageDimensions.height}`}
                  preserveAspectRatio="none"
                  style={{ overflow: 'visible' }}
                >
                  {/* Tracé en cours (Draft) */}
                  {draftShape && (
                    <g>
                      {draftShape.type === 'brush' ? (
                        <g>
                          {draftShape.points.map((p, i) => {
                            if (i === 0) return null;
                            const prev = draftShape.points[i - 1];
                            return (
                              <line 
                                key={i}
                                x1={`${prev.x}%`} y1={`${prev.y}%`} 
                                x2={`${p.x}%`} y2={`${p.y}%`} 
                                stroke={draftShape.color}
                                strokeWidth={getBrushStrokeWidth(draftShape.size)}
                                strokeLinecap="round"
                              />
                            );
                          })}
                          <circle cx={`${draftShape.points[0].x}%`} cy={`${draftShape.points[0].y}%`} r={getBrushStrokeWidth(draftShape.size) / 2} fill={draftShape.color} />
                        </g>
                      ) : draftShape.type === 'rectangle' ? (
                        <rect 
                          x={`${Math.min(draftShape.startX, draftShape.endX)}%`} 
                          y={`${Math.min(draftShape.startY, draftShape.endY)}%`} 
                          width={`${Math.abs(draftShape.startX - draftShape.endX)}%`} 
                          height={`${Math.abs(draftShape.startY - draftShape.endY)}%`} 
                          stroke={draftShape.color || "#2563eb"} 
                          fill={draftShape.rectStyle === 'filled' ? (draftShape.color || "#2563eb") : "transparent"} 
                          strokeWidth={standardStrokeWidth} 
                          strokeDasharray={draftShape.rectStyle === 'filled' ? "none" : dashArray}
                        />
                      ) : draftShape.type === 'line' ? (
                        <g>
                          {draftShape.points.map((p, i) => {
                            if (i === 0) return null;
                            const prev = draftShape.points[i - 1];
                            return (
                              <line 
                                key={i}
                                x1={`${prev.x}%`} y1={`${prev.y}%`} 
                                x2={`${p.x}%`} y2={`${p.y}%`} 
                                stroke="#2563eb" strokeWidth={standardStrokeWidth} strokeDasharray={dashArray}
                              />
                            );
                          })}
                          <circle cx={`${draftShape.points[draftShape.points.length - 1].x}%`} cy={`${draftShape.points[draftShape.points.length - 1].y}%`} r={anchorRadius} fill="#2563eb" />
                        </g>
                      ) : (
                        <g>
                          <line 
                            x1={`${draftShape.startX}%`} y1={`${draftShape.startY}%`} 
                            x2={`${draftShape.endX}%`} y2={`${draftShape.endY}%`} 
                            stroke="#2563eb" strokeWidth={standardStrokeWidth} strokeDasharray={dashArray}
                          />
                          <circle cx={`${draftShape.startX}%`} cy={`${draftShape.startY}%`} r={anchorRadius} fill="#2563eb" />
                        </g>
                      )}
                    </g>
                  )}
                  
                  {/* Tracés finalisés */}
                  {annotations.map((anno) => {
                    const isSelected = selectedAnnoId === anno.id;
                    const strokeColor = isSelected ? "#2563eb" : "#64748b";
                    const currentStrokeWidth = isSelected ? standardStrokeWidth * 1.5 : standardStrokeWidth;
                    const type = anno.type || 'legend';
                    
                    return (
                      <g key={`shape-${anno.id}`} className={isSelected && type !== 'brush' ? 'opacity-100' : 'opacity-80'}>
                        {type === 'brush' ? (
                           <g className={isSelected ? 'drop-shadow-[0_0_4px_rgba(37,99,235,0.8)]' : ''}>
                             {anno.points.map((p, i) => {
                               if (i === 0) return null;
                               const prev = anno.points[i - 1];
                               return (
                                 <line 
                                   key={i}
                                   x1={`${prev.x}%`} y1={`${prev.y}%`} 
                                   x2={`${p.x}%`} y2={`${p.y}%`} 
                                   stroke={anno.color}
                                   strokeWidth={getBrushStrokeWidth(anno.size)}
                                   strokeLinecap="round"
                                 />
                               );
                             })}
                             {anno.points.length > 0 && (
                               <circle cx={`${anno.points[0].x}%`} cy={`${anno.points[0].y}%`} r={getBrushStrokeWidth(anno.size) / 2} fill={anno.color} />
                             )}
                           </g>
                        ) : type === 'rectangle' ? (
                          <rect 
                            x={`${Math.min(anno.startX, anno.endX)}%`} 
                            y={`${Math.min(anno.startY, anno.endY)}%`} 
                            width={`${Math.abs(anno.startX - anno.endX)}%`} 
                            height={`${Math.abs(anno.startY - anno.endY)}%`} 
                            stroke={anno.color || strokeColor} 
                            fill={anno.rectStyle === 'filled' ? (anno.color || strokeColor) : "transparent"} 
                            strokeWidth={currentStrokeWidth} 
                          />
                        ) : type === 'line' ? (
                          anno.points ? (
                            <g>
                              {anno.points.map((p, i) => {
                                if (i === 0) return null;
                                const prev = anno.points[i - 1];
                                return (
                                  <line 
                                    key={i}
                                    x1={`${prev.x}%`} y1={`${prev.y}%`} 
                                    x2={`${p.x}%`} y2={`${p.y}%`} 
                                    stroke={strokeColor} strokeWidth={currentStrokeWidth} 
                                  />
                                );
                              })}
                            </g>
                          ) : (
                            <line 
                              x1={`${anno.startX}%`} y1={`${anno.startY}%`} 
                              x2={`${anno.endX}%`} y2={`${anno.endY}%`} 
                              stroke={strokeColor} strokeWidth={currentStrokeWidth} 
                            />
                          )
                        ) : (
                          <g>
                            <line 
                              x1={`${anno.startX}%`} y1={`${anno.startY}%`} 
                              x2={`${anno.endX}%`} y2={`${anno.endY}%`} 
                              stroke={strokeColor} strokeWidth={currentStrokeWidth} 
                            />
                            <circle cx={`${anno.startX}%`} cy={`${anno.startY}%`} r={anchorRadius} fill={strokeColor} />
                          </g>
                        )}
                      </g>
                    );
                  })}
                </svg>

                {/* Overlays HTML pour les champs texte (Uniquement pour l'outil Légende) */}
                {annotations.filter(a => a.type === 'legend' || !a.type).map((anno) => {
                  const styleId = anno.style || 'white-bg';
                  const isNoBg = styleId === 'no-bg';
                  const isBlackBg = styleId === 'black-bg';
                  
                  const wrapperStyleClass = isNoBg 
                    ? `bg-transparent ${selectedAnnoId === anno.id ? 'ring-2 ring-blue-500 bg-white/20' : ''}`
                    : isBlackBg 
                      ? `bg-slate-900 shadow-md border ${selectedAnnoId === anno.id ? 'ring-2 ring-blue-500 shadow-blue-500/30 border-blue-500' : 'border-slate-900'}`
                      : `bg-white shadow-md border ${selectedAnnoId === anno.id ? 'ring-2 ring-blue-500 shadow-blue-500/30 border-blue-500' : 'border-slate-200'}`;

                  return (
                  <div 
                    key={`editor-${anno.id}`}
                    className="absolute z-10 transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group"
                    style={{ left: `${anno.endX}%`, top: `${anno.endY}%` }}
                  >
                    {/* Poignée de drag & drop sortie du flux */}
                    <div 
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        setDraggingAnnoId(anno.id);
                        setSelectedAnnoId(anno.id);
                        changeTool('cursor');
                        setCurrentLegendStyle(anno.style || 'white-bg');
                      }}
                      className={`absolute bottom-full mb-1 cursor-grab active:cursor-grabbing p-1 bg-white/80 backdrop-blur rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity ${selectedAnnoId === anno.id ? 'opacity-100' : ''}`}
                    >
                      <GripHorizontal className="w-4 h-4 text-slate-400 hover:text-blue-600" />
                    </div>

                    <div className={`rounded px-3 py-1.5 transition-shadow ${wrapperStyleClass}`}>
                      <textarea 
                        value={anno.text || ''}
                        onChange={(e) => updateAnnotationText(anno.id, e.target.value)}
                        onFocus={() => { 
                          setSelectedAnnoId(anno.id); 
                          changeTool('cursor'); 
                          setCurrentLegendStyle(anno.style || 'white-bg');
                        }}
                        placeholder="Légende"
                        rows={anno.text ? anno.text.split('\n').length : 1}
                        wrap="off"
                        style={{ 
                          width: `${Math.max(...(anno.text ? anno.text.split('\n').map(l => l.length) : [8]), 8)}ch`,
                          resize: 'none',
                          fontFamily: 'Roboto, sans-serif',
                          fontWeight: '600',
                          // Génération d'un contour blanc par projection d'ombres multidirectionnelles
                          textShadow: isNoBg ? '3px 3px 0 #fff, -3px -3px 0 #fff, 3px -3px 0 #fff, -3px 3px 0 #fff, 0 3px 0 #fff, 0 -3px 0 #fff, 3px 0 0 #fff, -3px 0 0 #fff' : 'none'
                        }}
                        className={`text-[15px] leading-tight font-medium ${isBlackBg ? 'text-white' : 'text-slate-800'} border-none outline-none bg-transparent text-center placeholder:font-normal ${isBlackBg ? 'placeholder:text-slate-500' : 'placeholder:text-slate-400'} min-w-[20px] overflow-hidden whitespace-pre block`}
                      />
                    </div>
                  </div>
                )})}
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
