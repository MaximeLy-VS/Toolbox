import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, Check, AlertCircle, Copy, Download, Trash2, Plus, FileCode2, Loader2, X, GripVertical, ListOrdered, Eye, Code, Folder, Info, MessageCircle } from 'lucide-react';
import gabaritWord from './DA-WB_Gabarit.docx?url';

// --- IMPORTS DND-KIT ---
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { applyGrepRules } from '../typo-rules.js';

// --- COMPOSANTS SOUS-JACENT ---
function SortableItem({ item }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 50 : 'auto',
    position: 'relative',
  };

  const isCategory = item.type === 'category';

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`
        group flex items-center gap-3 p-2 rounded-xl transition-colors border
        ${isCategory 
          ? 'bg-slate-800 border-slate-700 text-white ml-6 mt-4 shadow-md cursor-grab active:cursor-grabbing' 
          : 'bg-white border-slate-200 ml-12 text-slate-600 shadow-sm hover:border-blue-300 hover:shadow-md cursor-grab active:cursor-grabbing'
        }
      `}
    >
      <GripVertical size={16} className={`${isCategory ? 'text-slate-500' : 'text-slate-400'}`} />
      <div className="flex inline-flex items-center gap-5">
        <span className={`text-[10px] font-black uppercase tracking-widest ${isCategory ? 'text-slate-400' : 'text-blue-500'}`}>
          {item.type}
        </span>
        <span className={`font-bold text-sm truncate ${isCategory ? 'text-white' : 'text-slate-700'}`}>
          {item.title}
        </span>
      </div>
    </div>
  );
}

// --- COMPOSANT DE PRÉVISUALISATION VISUELLE ---
function PreviewItem({ item }) {
  if (item.type === 'category') {
    return (
      <div className="bg-slate-800 text-white p-3 rounded-xl flex items-center gap-3 shadow-sm">
        <Folder size={18} className="text-blue-400" />
        <span className="font-bold text-sm">{item.title}</span>
      </div>
    );
  }

  if (item.type === 'description') {
    return (
      <div className="bg-blue-50 border border-blue-200 p-5 rounded-xl shadow-sm">
        <div className="flex items-center gap-2 mb-3 text-blue-700">
          <Info size={16} />
          <span className="font-black text-xs uppercase tracking-widest">Description</span>
        </div>
        <div className="text-sm text-slate-700" dangerouslySetInnerHTML={{ __html: item.data.text }} />
      </div>
    );
  }

  const { qText, qType, qPoint, fGeneral, fCorrect, fPartial, fIncorrect, props } = item.data;

  // --- NOUVEAU : Détection des feedbacks personnalisés ---
  const showCorrect = fCorrect && fCorrect !== "Votre réponse est correcte.";
  const showPartial = fPartial && fPartial !== "Votre réponse est partiellement correcte." && qType !== 'TF';
  const showIncorrect = fIncorrect && fIncorrect !== "Votre réponse est incorrecte.";
  const hasAnyFeedback = fGeneral || showCorrect || showPartial || showIncorrect;

  return (
    <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm">
      <div className="flex mb-4 border-b border-slate-100 pb-4">
        <div className="flex items-center w-full justify-between gap-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{item.title}</span>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600">{qType === 'TF' ? 'VRAI/FAUX' : qType}</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700">{qPoint} Point(s)</span>
          </div>
        </div>
      </div>
      
      <div className="text-sm text-slate-800 font-medium mb-4" dangerouslySetInnerHTML={{ __html: qText }} />
      
      <div className="space-y-2 mb-6">
        {props.map((p, i) => {
          const frac = Number(p.fraction);
          let bgColor = 'bg-slate-50 border-slate-200';
          let badgeColor = 'bg-slate-200 text-slate-600';
          
          if (frac > 0) { 
            bgColor = 'bg-emerald-50 border-emerald-200'; 
            badgeColor = 'bg-emerald-100 text-emerald-700'; 
          } else if (frac < 0) { 
            bgColor = 'bg-red-50 border-red-200'; 
            badgeColor = 'bg-red-100 text-red-700'; 
          }

          return (
            <div key={i} className={`flex items-center gap-3 pl-2 border rounded-lg ${bgColor}`}>
               <div className="">
                 {qType === 'QCM' ? (
                   <div className={`w-4 h-4 rounded border ${frac > 0 ? 'bg-emerald-500 border-emerald-600' : 'bg-white border-slate-300'}`}></div>
                 ) : (
                   <div className={`w-4 h-4 rounded-full border ${frac > 0 ? 'bg-emerald-500 border-emerald-600' : 'bg-white border-slate-300'}`}></div>
                 )}
               </div>
               <div className="flex-1 text-sm text-slate-700" dangerouslySetInnerHTML={{ __html: p.text }} />
               <span className={`text-[10px] font-bold px-2 py-1 rounded-md shrink-0 ${badgeColor}`}>{frac > 0 ? `+${p.fraction}` : p.fraction}%</span>
            </div>
          );
        })}
      </div>

      {hasAnyFeedback && (
        <div className="bg-slate-50 p-4 rounded-lg text-xs space-y-3 border border-slate-100">
          <h4 className="font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-3"><MessageCircle size={14}/> Feedbacks</h4>
          {fGeneral && <div className="grid grid-cols-[70px_1fr] gap-3"><span className="font-bold text-slate-500">Général</span><div className="text-slate-700" dangerouslySetInnerHTML={{__html: fGeneral}}/></div>}
          {showCorrect && <div className="grid grid-cols-[70px_1fr] gap-3"><span className="font-bold text-emerald-600">Correct</span><div className="text-emerald-800" dangerouslySetInnerHTML={{__html: fCorrect}}/></div>}
          {showPartial && <div className="grid grid-cols-[70px_1fr] gap-3"><span className="font-bold text-amber-600">Partiel</span><div className="text-amber-800" dangerouslySetInnerHTML={{__html: fPartial}}/></div>}
          {showIncorrect && <div className="grid grid-cols-[70px_1fr] gap-3"><span className="font-bold text-red-600">Incorrect</span><div className="text-red-800" dangerouslySetInnerHTML={{__html: fIncorrect}}/></div>}
        </div>
      )}
    </div>
  );
}

// Chargement asynchrone de JSZip
const loadJSZip = async () => {
  if (window.JSZip) return window.JSZip;
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
    script.onload = () => resolve(window.JSZip);
    script.onerror = reject;
    document.head.appendChild(script);
  });
};



// --- VALIDATEUR HTML ---
const checkHTMLTags = (html) => {
  const selfClosingTags = ['br', 'img', 'hr', 'input', 'meta', 'link', 'area', 'base', 'col', 'source'];
  const stack = [];
  const regex = /<\/?([a-z0-9]+)[^>]*>/gi;
  let match;

  while ((match = regex.exec(html)) !== null) {
    const fullTag = match[0];
    const tagName = match[1].toLowerCase();

    if (selfClosingTags.includes(tagName) || fullTag.endsWith('/>') || fullTag.endsWith('/ >')) continue;

    if (fullTag.startsWith('</')) {
      if (stack.length === 0 || stack[stack.length - 1] !== tagName) {
        return { isValid: false, message: `Balise fermante inattendue : </${tagName}>.` };
      }
      stack.pop(); 
    } else {
      stack.push(tagName); 
    }
  }

  if (stack.length > 0) {
    return { isValid: false, message: `Balise non fermée détectée : <${stack[stack.length - 1]}>.` };
  }
  return { isValid: true };
};

export default function MoodleQuizApp() {
  const [file, setFile] = useState(null);
  const [quizId, setQuizId] = useState("X–XXX–DA–WB–XX–26");
  const [descriptions, setDescriptions] = useState(["<div class=\"FondCouleur1 p-3\">\n  <strong>Séance&nbsp;1 – Titre de la séance&nbsp;1</strong>\n</div>"]);
  const [categories, setCategories] = useState([""]);
  const [scanStatus, setScanStatus] = useState('idle'); 
  const [scanErrors, setScanErrors] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resultXml, setResultXml] = useState("");
  const [error, setError] = useState(null);
  const [auditMessages, setAuditMessages] = useState([]);
  
  const [malusChoice, setMalusChoice] = useState("-12.5");
  const [autoMalusIndex, setAutoMalusIndex] = useState(1);

  const [isSorting, setIsSorting] = useState(false);
  const [parsedItems, setParsedItems] = useState([]);
  const [viewMode, setViewMode] = useState('preview');

  const fileInputRef = useRef(null);
  const [isDraggingFile, setIsDraggingFile] = useState(false);

  // Configuration des capteurs pour Dnd-kit
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // --- DÉFINITION DES STRATÉGIES DE MALUS ---
  const autoMalusOptions = [
    { value: 20, label: "environ -20%", zone: "Encouragement", color: "bg-emerald-400", desc: "La sélection de réponses fausses nuit légèrement à la qualité de réponse. L'intention est d'encourager à répondre tout en évitant que l'apprenant ait la totalité des points s'il coche au hasard." },
    { value: 25, label: "environ -25%", zone: "Encouragement", color: "bg-emerald-400", desc: "La sélection de réponses fausses nuit légèrement à la qualité de réponse. L'intention est d'encourager à répondre tout en évitant que l'apprenant ait la totalité des points s'il coche au hasard." },
    { value: 30, label: "environ -30%", zone: "Encouragement", color: "bg-emerald-400", desc: "La sélection de réponses fausses nuit légèrement à la qualité de réponse. L'intention est d'encourager à répondre tout en évitant que l'apprenant ait la totalité des points s'il coche au hasard." },
    { value: 33.33333, label: "environ -33.3%", zone: "Encouragement", color: "bg-emerald-400", desc: "La sélection de réponses fausses nuit légèrement à la qualité de réponse. L'intention est d'encourager à répondre tout en évitant que l'apprenant ait la totalité des points s'il coche au hasard." },
    { value: 40, label: "environ -40%", zone: "Encouragement", color: "bg-emerald-400", desc: "La sélection de réponses fausses nuit légèrement à la qualité de réponse. L'intention est d'encourager à répondre tout en évitant que l'apprenant ait la totalité des points s'il coche au hasard." },
    { value: 50, label: "environ -50%", zone: "Encouragement", color: "bg-emerald-400", desc: "La sélection de réponses fausses nuit légèrement à la qualité de réponse. L'intention est d'encourager à répondre tout en évitant que l'apprenant ait la totalité des points s'il coche au hasard." },
    { value: 60, label: "environ -60%", zone: "Valorisation", color: "bg-blue-400", desc: "La sélection de propositions fausses nuit à la qualité de la réponse, mais ne l'annule pas totalement. Le fait de répondre est valorisé." },
    { value: 66.66667, label: "environ -66.6%", zone: "Valorisation", color: "bg-blue-400", desc: "La sélection de propositions fausses nuit à la qualité de la réponse, mais ne l'annule pas totalement. Le fait de répondre est valorisé." },
    { value: 70, label: "environ -70%", zone: "Valorisation", color: "bg-blue-400", desc: "La sélection de propositions fausses nuit à la qualité de la réponse, mais ne l'annule pas totalement. Le fait de répondre est valorisé." },
    { value: 75, label: "environ -75%", zone: "Valorisation", color: "bg-blue-400", desc: "La sélection de propositions fausses nuit à la qualité de la réponse, mais ne l'annule pas totalement. Le fait de répondre est valorisé." },
    { value: 80, label: "environ -80%", zone: "Valorisation", color: "bg-blue-400", desc: "La sélection de propositions fausses nuit à la qualité de la réponse, mais ne l'annule pas totalement. Le fait de répondre est valorisé." },
    { value: 83.33333, label: "environ -83.3%", zone: "Valorisation", color: "bg-blue-400", desc: "La sélection de propositions fausses nuit à la qualité de la réponse, mais ne l'annule pas totalement. Le fait de répondre est valorisé." },
    { value: 90, label: "environ -90%", zone: "Valorisation", color: "bg-blue-400", desc: "La sélection de propositions fausses nuit à la qualité de la réponse, mais ne l'annule pas totalement. Le fait de répondre est valorisé." },
    { value: 100, label: "environ -100%", zone: "Exigence", color: "bg-amber-400", desc: "La qualité de réponse est altérée au prorata du nombre de propositions fausses sélectionnées (Le total est égal à 100%)." },
    { value: "SOLIDARITE", label: "-100%/réponse fausse", zone: "Solidarité", color: "bg-red-400", desc: "La qualité de la réponse n'admet aucune proposition fausse. Chaque mauvaise réponse retire 100% des points (réponses solidaires)." }
  ];

  const escapeXML = (str) => {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  };

  const getRawCellText = (cellNode) => {
    if (!cellNode) return "";
    const textNodes = cellNode.getElementsByTagName("w:t");
    let str = "";
    for (let t = 0; t < textNodes.length; t++) { str += textNodes[t].textContent; }
    return str;
  };

  const onDragOver = (e) => {
    e.preventDefault();
    if (scanStatus !== 'scanning') setIsDraggingFile(true);
  };

  const onDragLeave = (e) => {
    e.preventDefault();
    setIsDraggingFile(false);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setIsDraggingFile(false);
    
    if (scanStatus === 'scanning') return;

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      if (droppedFile.name.toLowerCase().endsWith('.docx')) {
        handleFileScan(droppedFile);
      } else {
        setScanErrors([{ questionIndex: "Format de fichier", errors: ["Veuillez déposer un fichier Word (.docx) valide."] }]);
        setScanStatus('error');
        setIsModalOpen(true);
      }
    }
  };

  const handleFileScan = async (selectedFile) => {
    if (!selectedFile) return;
    setScanStatus('scanning');
    setScanErrors([]);
    setFile(null); 
    setResultXml("");
    setIsSorting(false);

    try {
      const JSZip = await loadJSZip();
      const zip = new JSZip();
      const loadedZip = await zip.loadAsync(selectedFile);
      const docXmlFile = loadedZip.file("word/document.xml");
      
      if (!docXmlFile) throw new Error("Impossible de lire le fichier. Est-ce bien un format .docx valide ?");
      
      const xmlString = await docXmlFile.async("text");
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlString, "text/xml");
      const tables = xmlDoc.getElementsByTagName("w:tbl");
      
      let detectedErrors = [];
      let questionCount = 0;

      for (let i = 0; i < tables.length; i++) {
        const table = tables[i];
        const rows = table.getElementsByTagName("w:tr");
        if (rows.length === 0) continue; 
        
        const cell1_1 = rows[0].getElementsByTagName("w:tc")[0];
        if (!cell1_1 || !getRawCellText(cell1_1).toLowerCase().includes("code")) continue;

        questionCount++;
        let tableErrors = [];

        const expectedHeaders = [
          { index: 0, keyword: "code", label: "Ligne 1 (Code)" },
          { index: 2, keyword: "réponse correcte", label: "Ligne 3 (Réponse correcte)" },
          { index: 3, keyword: "énoncé", label: "Ligne 4 (Énoncé)" },
          { index: 5, keyword: "propositions", label: "Ligne 6 (Propositions)" }
        ];

        let headerShifted = false;

        for (let h of expectedHeaders) {
          if (rows.length > h.index) {
            const firstCell = rows[h.index].getElementsByTagName("w:tc")[0];
            const cellText = getRawCellText(firstCell).toLowerCase();
            if (!cellText.includes(h.keyword)) {
              tableErrors.push(`Structure altérée : La ${h.label} est manquante ou a été décalée.`);
              headerShifted = true;
            }
          } else {
            tableErrors.push(`Structure altérée : La ${h.label} est introuvable (Tableau trop court).`);
            headerShifted = true;
          }
        }

        if (!headerShifted) {
          let feedbackStartIndex = -1;
          for (let r = rows.length - 1; r >= 5; r--) {
            const cells = rows[r].getElementsByTagName("w:tc");
            if (cells.length > 0 && getRawCellText(cells[0]).toLowerCase().includes("feedback")) {
              feedbackStartIndex = r;
              break;
            }
          }

          if (feedbackStartIndex === -1) {
            tableErrors.push("Zone 'Feedback' introuvable. Le mot-clé a été effacé ou la ligne a été fusionnée incorrectement.");
          } else {
            const nbPropositions = feedbackStartIndex - 6;
            if (nbPropositions < 2) {
              tableErrors.push(`Propositions insuffisantes : Seulement ${nbPropositions > 0 ? nbPropositions : 0} trouvée(s). Minimum 2 requises.`);
            }
          }
        }

        if (tableErrors.length > 0) {
          detectedErrors.push({ questionIndex: questionCount, errors: tableErrors });
        }
      }

      if (questionCount === 0) {
        detectedErrors.push({ questionIndex: "Document entier", errors: ["Aucun tableau de question détecté (Mot 'Code' introuvable)."] });
      }

      if (detectedErrors.length > 0) {
        setScanErrors(detectedErrors);
        setScanStatus('error');
        setIsModalOpen(true);
      } else {
        setScanStatus('success');
        setFile(selectedFile);
      }
    } catch (err) {
      setScanErrors([{ questionIndex: "Fichier", errors: [err.message] }]);
      setScanStatus('error');
      setIsModalOpen(true);
    }
  };

  const copyToClipboard = (text) => {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(() => {
        alert("XML copié dans le presse-papier !");
      }).catch(() => fallbackCopyTextToClipboard(text));
    } else {
      fallbackCopyTextToClipboard(text);
    }
  };

  const fallbackCopyTextToClipboard = (text) => {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed"; 
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
      alert("XML copié dans le presse-papier ! (Mode compatibilité)");
    } catch (err) {
      alert("Échec de la copie. Veuillez sélectionner et copier manuellement.");
    }
    document.body.removeChild(textArea);
  };

  const handleDownload = () => {
    if (!resultXml) return;
    const blob = new Blob([resultXml], { type: 'text/xml' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${quizId}_ImportMoodle.xml`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleMalusChange = (e) => {
    setMalusChoice(e.target.value);
  };

  const compileXML = (itemsToCompile) => {
    let finalXml = `<?xml version="1.0" encoding="UTF-8"?>\n<quiz>\n`;
    finalXml += `  <question type="category">\n    <category>\n      <text>${escapeXML(quizId)}</text>\n    </category>\n    <info format="html"><text></text></info>\n    <idnumber></idnumber>\n  </question>\n\n`;
    
    itemsToCompile.forEach(item => {
      finalXml += item.xml;
    });
    
    finalXml += `</quiz>`;
    setResultXml(finalXml);
    setViewMode('preview');
    setIsSorting(false);
  };

  const processFile = async () => {
    if (!quizId || quizId.trim() === "" || quizId === "X–XXX–DA–WB–XX–26") {
      setError("Action bloquée : Veuillez impérativement renseigner un Identifiant de Quiz valide (différent de la valeur par défaut).");
      return;
    }
    
    if (!file) {
      setError("Veuillez sélectionner un fichier gabarit Word (.docx).");
      return;
    }
    setLoading(true);
    setError(null);
    setAuditMessages([]);
    setResultXml("");

    try {
      const JSZip = await loadJSZip();
      const zip = new JSZip();
      const loadedZip = await zip.loadAsync(file);  
      const docXmlFile = loadedZip.file("word/document.xml"); 
      const xmlString = await docXmlFile.async("text");
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlString, "text/xml");
      const tables = xmlDoc.getElementsByTagName("w:tbl");

      const extractAndCleanCell = (cellNode) => {
        if (!cellNode) return "";
        let htmlContent = "";
        let inList = false;

        const paragraphs = cellNode.getElementsByTagName("w:p");
        
        let totalListItems = 0;
        for (let p = 0; p < paragraphs.length; p++) {
          if (paragraphs[p].getElementsByTagName("w:numPr").length > 0) totalListItems++;
        }

        for (let p = 0; p < paragraphs.length; p++) {
          const pNode = paragraphs[p];
          const numPr = pNode.getElementsByTagName("w:numPr");
          const isListItem = numPr.length > 0 && totalListItems > 1;
          
          let pText = "";
          const runs = pNode.getElementsByTagName("w:r");

          for (let r = 0; r < runs.length; r++) {
            const run = runs[r];
            let isBold = false;
            let isItalic = false;
            let isSub = false;
            let isSup = false;

            const rPr = run.getElementsByTagName("w:rPr")[0];
            if (rPr) {
              const b = rPr.getElementsByTagName("w:b")[0];
              if (b && b.getAttribute("w:val") !== "0" && b.getAttribute("w:val") !== "false") isBold = true;
              const i = rPr.getElementsByTagName("w:i")[0];
              if (i && i.getAttribute("w:val") !== "0" && i.getAttribute("w:val") !== "false") isItalic = true;
              const vertAlign = rPr.getElementsByTagName("w:vertAlign")[0];
              if (vertAlign) {
                const val = vertAlign.getAttribute("w:val");
                if (val === "subscript") isSub = true;
                if (val === "superscript") isSup = true;
              }
            }

            for (let c = 0; c < run.childNodes.length; c++) {
              const child = run.childNodes[c];
              if (child.nodeName === "w:t") {
                let text = child.textContent;
                if (isBold) text = `<b>${text}</b>`;
                if (isItalic) text = `<i>${text}</i>`;
                if (isSub) text = `<sub>${text}</sub>`;
                if (isSup) text = `<sup>${text}</sup>`; 
                pText += text;
              } else if (child.nodeName === "w:br") {
                pText += "\n";
              }
            }
          }

          let trimmedText = pText.trim();
          if (!trimmedText && !pText.includes("\n")) continue; 

          let cleanedText = applyGrepRules(trimmedText).replace(/\n/g, "<br>");

          if (isListItem) {
            if (!inList) {
              if (htmlContent !== "") htmlContent += "<br>"; 
              htmlContent += `<ul class="Pucecned18">\n`;
              inList = true;
            }
            htmlContent += `  <li>${cleanedText}</li>\n`;
          } else {
            if (inList) {
              htmlContent += `</ul>\n`;
              inList = false;
            }
            if (htmlContent !== "") {
              htmlContent += "<\/p><p>"; // Ajout d'un paragraphe séparé pour les paragraphes non-listés
            }
            htmlContent += cleanedText;
          }
        }
        if (inList) htmlContent += `</ul>`;
        
        let textWithoutBolds = htmlContent.replace(/<b>[\s\S]*?<\/b>/g, "");
        let remainingChars = textWithoutBolds.replace(/<[^>]+>/g, "").replace(/[^\wÀ-ÿ]/g, ""); 
        if (remainingChars.length === 0 && htmlContent.includes("<b>")) {
           htmlContent = htmlContent.replace(/<\/?b>/g, "");
        }

        return htmlContent;
      };

      let extractedItems = [];

      descriptions.forEach((desc, index) => {
        if(desc.trim() === "") return;
        const descId = `${quizId}_DES${String(index + 1).padStart(2, '0')}`;
        const xml = `  <question type="description">\n    <name>\n      <text>${escapeXML(descId)}</text>\n    </name>\n    <questiontext format="html">\n      <text><![CDATA[${desc}]]></text>\n    </questiontext>\n    <generalfeedback format="html"><text></text></generalfeedback>\n    <defaultgrade>0.0000000</defaultgrade>\n    <penalty>0.0000000</penalty>\n    <hidden>0</hidden>\n    <idnumber></idnumber>\n  </question>\n\n`;
        extractedItems.push({ id: descId, type: 'description', title: `Consigne : ${descId}`, xml, data: { text: desc } });
      });

      categories.forEach((category, index) => {
        if(category.trim() === "") return;
        const categoryId = `${quizId}/${quizId}_${category}`;
        const uniqueId = `cat_${index}_${categoryId}`;
        const xml = `  <question type="category">\n    <category>\n      <text>${escapeXML(categoryId)}</text>\n    </category>\n    <info format="html"><text></text></info>\n    <idnumber></idnumber>\n  </question>\n\n`;
        extractedItems.push({ id: uniqueId, type: 'category', title: `Catégorie : ${category}`, xml, data: { text: categoryId } });
      });

      let questionCounter = 1;
      let localAudits = [];

      for (let i = 0; i < tables.length; i++) {
        const table = tables[i];
        const rows = table.getElementsByTagName("w:tr");
        if (rows.length < 6) continue; 

        const cell1_1 = rows[0].getElementsByTagName("w:tc")[0];
        if (!getRawCellText(cell1_1).toLowerCase().includes("code")) continue;

        const qName = `${quizId}_Q${String(questionCounter).padStart(3, '0')}`;
        
        const row2Cells = rows[1].getElementsByTagName("w:tc");
        let qPoint = "1";
        if (row2Cells.length >= 4) {
           let extractedPoint = getRawCellText(row2Cells[3]).trim();
           extractedPoint = extractedPoint.replace(',', '.');
           if (extractedPoint !== "") {
               if (isNaN(Number(extractedPoint))) {
                   localAudits.push(`Question ${qName} : La note "${extractedPoint}" n'est pas un chiffre valide. Remplacée par défaut par "1".`);
                   qPoint = "1";
               } else {
                   qPoint = extractedPoint;
               }
           }
        }

        let shuffleAnswers = false;
        if (rows.length >= 3) {
            const row3Cells = rows[2].getElementsByTagName("w:tc");
            if (row3Cells.length >= 2) {
                const shuffleCell = row3Cells[row3Cells.length - 1];
                const rawShuffleText = getRawCellText(shuffleCell).toLowerCase();
                let isOuiChecked = false;
                
                const legacyCheckBoxes = shuffleCell.getElementsByTagName("w:checkBox");
                const modernCheckBoxes = shuffleCell.getElementsByTagName("w14:checkbox");
                
                if (legacyCheckBoxes.length >= 1) {
                    const cbOui = legacyCheckBoxes[0];
                    const checkedTag = cbOui.getElementsByTagName("w:checked")[0] || cbOui.getElementsByTagName("w:default")[0];
                    if (checkedTag) {
                        const val = checkedTag.getAttribute("w:val");
                        if (val === null || val === "1" || val === "true") isOuiChecked = true;
                    }
                } else if (modernCheckBoxes.length >= 1) {
                    const cbOui = modernCheckBoxes[0];
                    const checkedTag = cbOui.getElementsByTagName("w14:checked")[0];
                    if (checkedTag) {
                        const val = checkedTag.getAttribute("w14:val");
                        if (val === null || val === "1" || val === "true") isOuiChecked = true;
                    }
                }
                
                if (!isOuiChecked) {
                    const cleanText = rawShuffleText.replace(/\s+/g, ' ');
                    if (cleanText.includes("x oui") || cleanText.includes("[x] oui") || cleanText.includes("☑ oui") || cleanText.includes("☒ oui")) {
                        isOuiChecked = true;
                    }
                }
                shuffleAnswers = isOuiChecked;
            }
        }

        const row4Cells = rows[3].getElementsByTagName("w:tc");
        let qText = "";
        if (row4Cells.length >= 2) qText = extractAndCleanCell(row4Cells[1]);

        let feedbackStartIndex = -1;
        for (let r = rows.length - 1; r >= 5; r--) {
          const cells = rows[r].getElementsByTagName("w:tc");
          if (cells.length > 0 && getRawCellText(cells[0]).toLowerCase().includes("feedback")) {
            feedbackStartIndex = r;
            break;
          }
        }
        
        if (feedbackStartIndex === -1) {
          feedbackStartIndex = rows.length - 1;
        }

        let feedbackContents = [];
        
        for (let r = feedbackStartIndex; r < rows.length; r++) {
          const cells = rows[r].getElementsByTagName("w:tc");
          let label = "";
          let cellText = "";
          
          if (cells.length >= 3) {
            const rawCol2 = getRawCellText(cells[2]).trim();
            const rawCol1 = getRawCellText(cells[1]).trim();
            
            if (rawCol2.length === 0 && rawCol1.length > 40) {
              label = getRawCellText(cells[0]).toLowerCase();
              cellText = extractAndCleanCell(cells[1]);
            } else {
              label = rawCol1.toLowerCase();
              cellText = extractAndCleanCell(cells[2]);
            }
          } else if (cells.length === 2) {
            const rawCol1 = getRawCellText(cells[1]).trim();
            const rawCol0 = getRawCellText(cells[0]).trim();
            
            if (rawCol1.length === 0 && rawCol0.length > 40) {
              label = "";
              cellText = extractAndCleanCell(cells[0]);
            } else {
              label = rawCol0.toLowerCase();
              cellText = extractAndCleanCell(cells[1]);
            }
          } else if (cells.length === 1) {
            cellText = extractAndCleanCell(cells[0]);
          }
          
          if (cellText) feedbackContents.push({ label, content: cellText });
        }

        let fGeneral = "";
        let fCorrect = "Votre réponse est correcte.";
        let fPartial = "Votre réponse est partiellement correcte.";
        let fIncorrect = "Votre réponse est incorrecte.";

        if (feedbackContents.length === 1) {
          fGeneral = feedbackContents[0].content;
        } else if (feedbackContents.length > 1) {
          fGeneral = feedbackContents[0].content; 
          
          feedbackContents.forEach((fb, idx) => {
            if (fb.label.includes("partiel")) {
              fPartial = fb.content;
            } else if (fb.label.includes("incorrect") || fb.label.includes("faux")) {
              fIncorrect = fb.content;
            } else if (fb.label.includes("correct") || fb.label.includes("vrai")) {
              fCorrect = fb.content;
            } else {
              if (idx === 0) fCorrect = fb.content;
              if (idx === 1) fPartial = fb.content;
              if (idx === 2) fIncorrect = fb.content;
            }
          });
        }

        let rowData = [];
        let nbBonnesReponses = 0;
        let isTF = false;

        for (let r = 6; r < feedbackStartIndex; r++) {
          const cells = rows[r].getElementsByTagName("w:tc");
          if (cells.length < 2) continue;
          const cellNode = cells[0];
          const rawCellText = getRawCellText(cellNode);
          if (rawCellText.toLowerCase().includes("propositions")) continue; 

          const answerText = extractAndCleanCell(cells[1]);
          let isChecked = false;
          
          const checkBoxes = cellNode.getElementsByTagName("w:checkBox");
          const modernCheckBoxes = cellNode.getElementsByTagName("w14:checked");
          
          if (checkBoxes.length > 0) {
            const checkedTag = checkBoxes[0].getElementsByTagName("w:checked")[0] || checkBoxes[0].getElementsByTagName("w:default")[0];
            if (checkedTag) {
              const val = checkedTag.getAttribute("w:val");
              if (val === null || val === "1" || val === "true") isChecked = true;
            }
          }
          
          if (modernCheckBoxes.length > 0) {
            const val = modernCheckBoxes[0].getAttribute("w14:val");
            if (val === null || val === "1" || val === "true") isChecked = true;
          }

          if (!isChecked) {
              const lowText = rawCellText.toLowerCase().trim();
              if (lowText === "x" || lowText === "[x]" || rawCellText.includes("☑") || rawCellText.includes("☒")) isChecked = true;
          }

          if (!isChecked && cells.length >= 3) {
             const gradeText = getRawCellText(cells[2]).trim().replace(',', '.');
             const gradeNum = parseFloat(gradeText);
             if (!isNaN(gradeNum) && gradeNum > 0) {
                 isChecked = true;
             }
          }
          
          if (!isChecked && cells.length >= 2) {
             const cell1Xml = new XMLSerializer().serializeToString(cells[1]);
             if (cell1Xml.match(/w:color[^>]+w:val="(00B050|008000|92D050|00C000|33CC33|228B22|00FF00)"/i)) {
                 isChecked = true;
             }
          }

          if (!answerText && !isChecked) continue;

          if (isChecked) nbBonnesReponses++;
          if (answerText.toLowerCase().includes("vrai") || answerText.toLowerCase().includes("faux")) isTF = true;

          rowData.push({ text: answerText, isChecked: isChecked });
        }

        if (nbBonnesReponses === 0) {
           localAudits.push(`Question ${qName} ignorée (Aucune bonne réponse cochée ou verte détectée).`);
           continue;
        }

        let qType = isTF ? "TF" : (nbBonnesReponses > 1 ? "QCM" : "QCU");
        let qXml = "";
        let questionProps = []; 

        if (qType === "TF") {
            let scoreTrue = "0", scoreFalse = "0";
            rowData.forEach(r => {
                if (r.isChecked) {
                    if (r.text.toLowerCase().includes("vrai")) scoreTrue = "100";
                    else if (r.text.toLowerCase().includes("faux")) scoreFalse = "100";
                }
            });

           questionProps = [
              { text: "Vrai", fraction: scoreTrue, isChecked: scoreTrue === "100" },
              { text: "Faux", fraction: scoreFalse, isChecked: scoreFalse === "100" }
            ];

            qXml += `  <question type="truefalse">\n`;
            qXml += `    <name><text>${escapeXML(qName)}</text></name>\n`;
            qXml += `    <questiontext format="html"><text><![CDATA[<p>${qText}</p>]]></text></questiontext>\n`;
            qXml += `    <generalfeedback format="html"><text><![CDATA[<p>${fGeneral}</p>]]></text></generalfeedback>\n`;
            qXml += `    <defaultgrade>${qPoint}</defaultgrade>\n`;
            qXml += `    <penalty>1.0000000</penalty>\n`;
            qXml += `    <hidden>0</hidden>\n`;
            qXml += `    <answer fraction="${scoreTrue}" format="moodle_auto_format">\n      <text>true</text>\n      <feedback format="html"><text><![CDATA[<p>${scoreTrue === "100" ? fCorrect : fIncorrect}</p>]]></text></feedback>\n    </answer>\n`;
            qXml += `    <answer fraction="${scoreFalse}" format="moodle_auto_format">\n      <text>false</text>\n      <feedback format="html"><text><![CDATA[<p>${scoreFalse === "100" ? fCorrect : fIncorrect}</p>]]></text></feedback>\n    </answer>\n`;
            qXml += `  </question>\n\n`;

        } else {
            let scorePositif = "100";
            let scoreNegatif = "0";

            // --- NOUVELLE LOGIQUE DE CALCUL DES MALUS QCM ---
            if (qType === "QCM") {
                if (malusChoice === "auto") {
                    const autoOpt = autoMalusOptions[autoMalusIndex];
                    let nbMauvaises = rowData.length - nbBonnesReponses;
                    
                    if (nbMauvaises <= 0) {
                        scoreNegatif = "0";
                    } else if (autoOpt.value === "SOLIDARITE") {
                        scoreNegatif = "-100";
                    } else {
                        // Liste stricte des valeurs Moodle acceptées pour une pénalité
                        const allowedMoodleValues = [
                            { num: 100, str: "100" },
                            { num: 90, str: "90" },
                            { num: 80.33333, str: "80.33333" },
                            { num: 80, str: "80" },
                            { num: 75, str: "75" },
                            { num: 70, str: "70" },
                            { num: 66.66667, str: "66.66667" },
                            { num: 60, str: "60" },
                            { num: 50, str: "50" },
                            { num: 40, str: "40" },
                            { num: 33.33333, str: "33.33333" },
                            { num: 25, str: "30" },
                            { num: 25, str: "25" },
                            { num: 20, str: "20" },
                            { num: 16.66667, str: "16.66667" },
                            { num: 14.28571, str: "14.28571" },
                            { num: 12.5, str: "12.5" },
                            { num: 11.11111, str: "11.11111" },
                            { num: 10, str: "10" },
                            { num: 5, str: "5" }
                        ];
                        
                        let target = parseFloat(autoOpt.value);
                        
                        if (target === 100) {
                            // Cas 2 : Exigence
                            let bestV = null;
                            let maxTotal = -1;
                            for (let v of allowedMoodleValues) {
                                let total = v.num * nbMauvaises;
                                if (total <= 100.01) { // Marge pour l'arrondi
                                    if (total > maxTotal) {
                                        maxTotal = total;
                                        bestV = v.str;
                                    }
                                }
                            }
                            scoreNegatif = "-" + (bestV || "5");
                        } else {
                            // Cas 3 et 4 : Valorisation & Encouragement
                            let minBound = 0;
                            let maxBound = 100;
                            
                            if (target >= 60 && target <= 90) {
                                minBound = 60;
                                maxBound = 90;
                            } else if (target >= 20 && target <= 50) {
                                minBound = 20;
                                maxBound = 50;
                            }

                            let validOptions = [];
                            for (let v of allowedMoodleValues) {
                                let total = v.num * nbMauvaises;
                                if (total >= minBound - 0.01 && total <= maxBound + 0.01) {
                                    validOptions.push(v);
                                }
                            }

                            // Repli de sécurité si aucune fraction ne rentre dans les bornes
                            if (validOptions.length === 0) {
                                for (let v of allowedMoodleValues) {
                                    if (v.num * nbMauvaises <= 100.01) {
                                        validOptions.push(v);
                                    }
                                }
                            }

                            if (validOptions.length === 0) {
                                scoreNegatif = "-5";
                            } else {
                                // Recherche de la valeur la plus proche de la cible utilisateur
                                let bestV = null;
                                let minDiff = Infinity;
                                for (let v of validOptions) {
                                    let diff = Math.abs((v.num * nbMauvaises) - target);
                                    if (diff < minDiff) {
                                        minDiff = diff;
                                        bestV = v.str;
                                    }
                                }
                                scoreNegatif = "-" + bestV;
                            }
                        }
                    }
                } else {
                    scoreNegatif = malusChoice;
                }

                if (nbBonnesReponses === 2) scorePositif = "50";
                else if (nbBonnesReponses === 3) scorePositif = "33.33333";
                else if (nbBonnesReponses === 4) scorePositif = "25";
                else if (nbBonnesReponses === 5) scorePositif = "20";
                else if (nbBonnesReponses === 6) scorePositif = "16.66667";
                else if (nbBonnesReponses > 0) scorePositif = (100 / nbBonnesReponses).toFixed(5).replace(".00000", "");
            }

            questionProps = rowData.map(r => ({
              text: r.text,
              fraction: r.isChecked ? scorePositif : scoreNegatif,
              isChecked: r.isChecked
            }));

            qXml += `  <question type="multichoice">\n`;
            qXml += `    <name><text>${escapeXML(qName)}</text></name>\n`;
            qXml += `    <questiontext format="html"><text><![CDATA[<p>${qText}</p>]]></text></questiontext>\n`;
            qXml += `    <generalfeedback format="html"><text><![CDATA[<p>${fGeneral}</p>]]></text></generalfeedback>\n`;
            qXml += `    <defaultgrade>${qPoint}</defaultgrade>\n`;
            qXml += `    <penalty>0.3333333</penalty>\n`;
            qXml += `    <hidden>0</hidden>\n`;
            qXml += `    <single>${qType === "QCU" ? "true" : "false"}</single>\n`;
            qXml += `    <shuffleanswers>${shuffleAnswers ? "true" : "false"}</shuffleanswers>\n`;
            qXml += `    <answernumbering>none</answernumbering>\n`;
            qXml += `    <correctfeedback format="html"><text><![CDATA[<p>${fCorrect}</p>]]></text></correctfeedback>\n`;
            qXml += `    <partiallycorrectfeedback format="html"><text><![CDATA[<p>${fPartial}</p>]]></text></partiallycorrectfeedback>\n`;
            qXml += `    <incorrectfeedback format="html"><text><![CDATA[<p>${fIncorrect}</p>]]></text></incorrectfeedback>\n`;
            qXml += `    <shownumcorrect/>\n`;

            rowData.forEach(r => {
                if (r.text.length > 0) {
                    const fraction = r.isChecked ? scorePositif : scoreNegatif;
                    qXml += `    <answer fraction="${fraction}" format="html">\n`;
                    qXml += `      <text><![CDATA[<p>${r.text}</p>]]></text>\n`;
                    qXml += `      <feedback format="html"><text></text></feedback>\n`;
                    qXml += `    </answer>\n`;
                }
            });
            qXml += `  </question>\n\n`;
        }
        
        extractedItems.push({ 
          id: qName, 
          type: 'question', 
          title: `Question : ${qName}`, 
          xml: qXml,
          data: { qText, qType, qPoint, fGeneral, fCorrect, fPartial, fIncorrect, props: questionProps } // <- AJOUT
        });
        questionCounter++;
      }

      setAuditMessages(localAudits.length > 0 ? localAudits : [`Audit OK : ${questionCounter - 1} question(s) générée(s) avec succès (pondérations appliquées).`]);

const validCategories = categories.filter(c => c.trim() !== "");
      // pour que l'onglet Aperçu ait des données à afficher.
      setParsedItems(extractedItems);
      if (validCategories.length > 0) {
        setIsSorting(true);s
      } else {
        compileXML(extractedItems);
      }

    } catch (err) {
      console.error(err);
      setError("Erreur critique lors de l'analyse du fichier.");
    } finally {
      setLoading(false);
    }
  };

  const addDescription = () => setDescriptions([...descriptions, ""]);
  const updateDescription = (index, value) => {
    const newDesc = [...descriptions];
    newDesc[index] = value;
    setDescriptions(newDesc);
  };
  const addCategory = () => setCategories([...categories, ""]);
  const updateCategory = (index, value) => {
    const newCat = [...categories];
    newCat[index] = value;
    setCategories(newCat);
  };
  const removeDescription = (index) => setDescriptions(descriptions.filter((_, i) => i !== index));
  const removeCategory = (index) => setCategories(categories.filter((_, i) => i !== index));

  let htmlValidationError = null;
  for (let i = 0; i < descriptions.length; i++) {
    if (descriptions[i].trim() !== "") {
      const validation = checkHTMLTags(descriptions[i]);
      if (!validation.isValid) {
        htmlValidationError = `Consigne ${i + 1} : ${validation.message}`;
        break;
      }
    }
  }

  const handleDragEndDndKit = (event) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setParsedItems((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  return (
   <div>
      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-slide-up { animation: fadeSlideUp 0.5s ease-in-out forwards; }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-5px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fadeIn 0.3s ease-out forwards; }
        
        .custom-slider {
          -webkit-appearance: none;
          background: transparent;
          width: 100%;
          height: 100%;
        }
        .custom-slider:focus {
          outline: none;
        }
        .custom-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          height: 24px;
          width: 24px;
          border-radius: 50%;
          background: white;
          border: 4px solid #3b82f6; 
          cursor: pointer;
          box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        }
          ul.Pucecned18 {
          list-style-type: disc;
          padding-left: 1.5rem;
          margin-top: 0.5rem;
          margin-bottom: 0.5rem;
        }
        ul.Pucecned18 li {
          margin-bottom: 0.25rem;
        }
      `}</style>
      
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-slide-up">
          <div className="bg-white rounded-[2rem] shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-red-50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-full"><AlertCircle className="text-red-600" size={24} /></div>
                <h2 className="text-lg font-black text-red-900">Échec de l'analyse du gabarit</h2>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-red-400 hover:text-red-600 transition-colors"><X size={24} /></button>
            </div>
            <div className="p-6 overflow-y-auto space-y-4">
              <p className="text-sm font-medium text-slate-600">Votre fichier ne respecte pas la structure du gabarit attendu.</p>
              <div className="space-y-4">
                {scanErrors.map((errItem, index) => (
                  <div key={index} className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                    <h3 className="text-sm font-black text-slate-800 mb-2">Tableau de question {errItem.questionIndex}</h3>
                    <ul className="space-y-2">
                      {errItem.errors.map((msg, i) => (
                        <li key={i} className="text-xs text-red-600 flex items-start gap-2">
                          <span className="mt-0.5">•</span><span>{msg}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 bg-slate-800 hover:bg-slate-900 text-white text-sm font-bold rounded-xl shadow-md transition-colors">Confirmer et fermer</button>
            </div>
          </div>
        </div>
      )}

      <div className="w-full max-w-7xl bg-white rounded-[2rem] shadow-[0_30px_100px_rgba(0,0,0,0.08)] overflow-hidden flex flex-col md:flex-row border border-slate-100 animate-fade-slide-up">
        {/* PARTIE GAUCHE */}
        <div className="lg:w-[45%] p-8 flex flex-col border-r border-slate-100 bg-white overflow-y-auto max-h-[90vh]">
          <header className="mb-8">
            <div className="flex items-center gap-4 mb-2">
              <div className="p-3 bg-blue-600 rounded-xl shadow-lg shadow-blue-200"><FileCode2 className="text-white" size={24} /></div>
              <div>
                <h1 className="text-xl font-black tracking-tight text-slate-800">Générateur XML Moodle</h1>
                <p className="text-blue-600 text-xs font-bold tracking-[0.2em] uppercase mt-1">Gabarit Word → Moodle</p>
              </div>
            </div>
          </header>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest">
                Identifiant du Quiz (Racine) <span className="text-red-500">*</span>
              </label>
              <input type="text" value={quizId} onChange={(e) => setQuizId(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all" placeholder="Ex: 3-0421-DA-WB-06-26"/>
            </div>

            {/* --- NOUVEAU SÉLECTEUR DE MALUS --- */}
            <div className="space-y-3 pt-2">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest w-16">
                    Malus
                  </label>
                  <div className="flex flex-wrap gap-4 items-center">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input type="radio" name="malus" value="-10" checked={malusChoice === "-10"} onChange={handleMalusChange} className="accent-blue-600" />
                      <span className="text-sm font-bold text-slate-700">-10&nbsp;%</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input type="radio" name="malus" value="-12.5" checked={malusChoice === "-12.5"} onChange={handleMalusChange} className="accent-blue-600" />
                      <span className="text-sm font-bold text-slate-700">-12.5&nbsp;%</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input type="radio" name="malus" value="-14.2857142857143" checked={malusChoice === "-14.2857142857143"} onChange={handleMalusChange} className="accent-blue-600" />
                      <span className="text-sm font-bold text-slate-700">-14.3&nbsp;%</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input type="radio" name="malus" value="-16.6666666666667" checked={malusChoice === "-16.6666666666667"} onChange={handleMalusChange} className="accent-blue-600" />
                      <span className="text-sm font-bold text-slate-700">-16.6&nbsp;%</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input type="radio" name="malus" value="auto" checked={malusChoice === "auto"} onChange={handleMalusChange} className="accent-blue-600" />
                      <span className="text-sm font-bold text-slate-700">Auto</span>
                    </label>
                  </div>
                </div>

                {/* CONTENEUR DU SLIDER AUTO */}
                {malusChoice === "auto" && (
                   <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-sm animate-fade-in">
                      <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">
                        <span className="flex-[6] text-center">Encouragement</span>
                        <span className="flex-[7] text-center">Valorisation</span>
                        <span className="flex-[1] text-center" title="Exigence">Exig.</span>
                        <span className="flex-[1] text-center" title="Solidarité">Solid.</span>
                      </div>
                      
                      <div className="relative py-3">
                        <div className="absolute inset-0 flex items-center px-2 pointer-events-none">
                          <div className="w-full h-4 rounded-full flex overflow-hidden shadow-inner opacity-80">
                            <div className="flex-[6] bg-emerald-400"></div>
                            <div className="flex-[7] bg-blue-400 border-l border-white/30"></div>
                            <div className="flex-[1] bg-amber-400 border-l border-white/30"></div>
                            <div className="flex-[1] bg-red-400 border-l border-white/30"></div>
                          </div>
                        </div>
                        
                        <input 
                          type="range" 
                          min="0" 
                          max="14" 
                          step="1" 
                          value={autoMalusIndex}
                          onChange={(e) => setAutoMalusIndex(Number(e.target.value))}
                          className="custom-slider relative w-full h-4 z-10"
                        />
                      </div>

                      <div className="mt-4 p-4 bg-slate-50 border border-slate-100 rounded-xl flex items-start gap-4">
                        <div className={`mt-1 w-4 h-4 rounded-full shrink-0 shadow-sm ${autoMalusOptions[autoMalusIndex].color}`}></div>
                        <div>
                          <div className="text-sm font-black text-slate-800">
                            Cas {autoMalusIndex <= 5 ? "4" : autoMalusIndex <= 12 ? "3" : autoMalusIndex === 13 ? "2" : "1"} : {autoMalusOptions[autoMalusIndex].zone} 
                            <span className="text-blue-700 ml-2 bg-blue-100 px-2 py-0.5 rounded-md text-xs border border-blue-200">Total du malus : {autoMalusOptions[autoMalusIndex].label}</span>
                          </div>
                          <div className="text-xs font-medium text-slate-600 mt-2 leading-relaxed">
                            {autoMalusOptions[autoMalusIndex].desc}
                          </div>
                        </div>
                      </div>
                   </div>
                )}
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Descriptions</label>
              </div>
              <div className="space-y-3">
                {descriptions.map((desc, index) => (
                  <div key={index} className="relative group">
                    <div className="absolute -left-2 -top-2 bg-slate-800 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-sm z-10">{quizId}_DES{String(index + 1).padStart(2, '0')}</div>
                    <textarea value={desc} onChange={(e) => updateDescription(index, e.target.value)} rows={3} className="w-full p-4 pt-5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono text-slate-600 focus:outline-none focus:border-blue-400 transition-all resize-y" placeholder={`Texte HTML pour la consigne ${index + 1}...`} />
                    <button onClick={() => removeDescription(index)} className="absolute top-4 right-6 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"><Trash2 size={16} /></button>
                  </div>
                ))}
              </div>
              <button onClick={addDescription} className="relative bottom-[30px] right-6 float-right text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 bg-blue-50 px-2 py-1 rounded-md transition-colors"><Plus size={14} /> Ajouter</button>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Sous-catégories</label>
              </div>
              <div className="space-y-3">
                {categories.map((category, index) => (
                  <div key={index} className="relative group">
                    <div className="absolute -left-2 -top-2 bg-slate-800 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-sm z-10">{quizId}/{quizId}_{category || '...'}</div>
                    <textarea value={category} onChange={(e) => updateCategory(index, e.target.value)} rows={1} className="w-full p-4 pt-5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono text-slate-600 focus:outline-none focus:border-blue-400 transition-all resize-y" placeholder={`Nom de la sous-catégorie...`} />
                    <button onClick={() => removeCategory(index)} className="absolute top-4 right-6 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"><Trash2 size={16} /></button>
                  </div>
                ))}
              </div>
              <button onClick={addCategory} className="relative bottom-[30px] right-6 float-right text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 bg-blue-50 px-2 py-1 rounded-md transition-colors"><Plus size={14} /> Ajouter</button>
            </div>

            <div className="space-y-2 pt-5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Gabarit Word Rempli</label>
                <button className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 bg-blue-50 px-2 py-1 rounded-md transition-colors"><Download size={14}/><a href={gabaritWord} download="DA-WB_Gabarit.docx">Gabarit vierge</a></button>
              </div>
              <input type="file" ref={fileInputRef} className="hidden" accept=".docx" onChange={(e) => handleFileScan(e.target.files[0])} />
<div 
                onClick={() => scanStatus !== 'scanning' && fileInputRef.current.click()} 
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                className={`w-full p-4 border-2 border-dashed rounded-[1.5rem] flex flex-col items-center justify-center cursor-pointer transition-all duration-300 
                  ${isDraggingFile ? 'border-blue-500 bg-blue-50 scale-[1.02]' : ''}
                  ${!isDraggingFile && scanStatus === 'success' ? 'border-emerald-400 bg-emerald-50' : ''} 
                  ${!isDraggingFile && scanStatus === 'error' ? 'border-red-400 bg-red-50' : ''} 
                  ${!isDraggingFile && (scanStatus === 'idle' || scanStatus === 'scanning') ? 'border-slate-200 bg-slate-50 hover:border-blue-300' : ''}
                `}
              >
                <div className={`w-14 h-14 rounded-2xl shadow-sm border flex items-center justify-center mb-4 transition-transform 
                  ${isDraggingFile ? 'bg-blue-500 border-blue-600 text-white scale-110' : ''}
                  ${!isDraggingFile && scanStatus === 'success' ? 'bg-emerald-500 border-emerald-600 text-white scale-110' : ''} 
                  ${!isDraggingFile && scanStatus === 'error' ? 'bg-red-500 border-red-600 text-white scale-110' : ''} 
                  ${!isDraggingFile && scanStatus === 'scanning' ? 'bg-blue-500 border-blue-600 text-white' : ''} 
                  ${!isDraggingFile && scanStatus === 'idle' ? 'bg-white border-slate-100 text-blue-600' : ''}
                `}>
                  {scanStatus === 'idle' && !isDraggingFile && <UploadCloud size={28} />}
                  {isDraggingFile && <Download size={28} />}
                  {scanStatus === 'scanning' && <Loader2 size={28} className="animate-spin" />}
                  {scanStatus === 'success' && !isDraggingFile && <Check size={28} />}
                  {scanStatus === 'error' && !isDraggingFile && <AlertCircle size={28} />}
                </div>
                <p className={`font-bold text-sm text-center 
                  ${isDraggingFile ? 'text-blue-700' : ''}
                  ${!isDraggingFile && scanStatus === 'success' ? 'text-emerald-700' : ''} 
                  ${!isDraggingFile && scanStatus === 'error' ? 'text-red-700' : ''} 
                  ${!isDraggingFile && (scanStatus === 'idle' || scanStatus === 'scanning') ? 'text-slate-700' : ''}
                `}>
                  {scanStatus === 'idle' && !isDraggingFile && "Cliquez ou glissez-déposez le .docx ici"}
                  {isDraggingFile && "Relâchez le fichier pour l'importer"}
                  {scanStatus === 'scanning' && "Analyse en cours..."}
                  {scanStatus === 'success' && !isDraggingFile && `Validé : ${file?.name}`}
                  {scanStatus === 'error' && !isDraggingFile && "Des erreurs ont été détectées."}
                </p>
                {scanStatus === 'error' && !isDraggingFile && (<button onClick={(e) => { e.stopPropagation(); setIsModalOpen(true); }} className="mt-3 text-xs font-bold text-red-600 underline">Voir le rapport</button>)}
              </div>
            </div>

            {htmlValidationError && (
              <div className="p-3 bg-orange-50 text-orange-700 rounded-xl border border-orange-200 text-sm font-bold flex gap-3 animate-fade-in">
                <AlertCircle size={18} className="shrink-0" />
                <span>{htmlValidationError} Corrigez le code HTML pour débloquer la génération.</span>
              </div>
            )}

            <button 
              onClick={processFile} 
              disabled={loading || !file || scanStatus !== 'success' || htmlValidationError !== null} 
              className={`w-full py-4 text-white font-black rounded-xl shadow-xl transition-all flex items-center justify-center gap-3 text-sm uppercase tracking-widest 
                ${loading || !file || scanStatus !== 'success' || htmlValidationError !== null 
                  ? 'bg-slate-300 cursor-not-allowed shadow-none' 
                  : 'bg-slate-800 hover:bg-slate-900 shadow-slate-200'
                }`}
            >
              {loading ? "Traitement en cours..." : "Générer l'export Moodle"}
            </button>
            
            {error && <div className="p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 text-sm font-bold flex gap-3"><AlertCircle size={18} className="shrink-0" /><span>{error}</span></div>}
            </div>
        </div>

        {/* PARTIE DROITE */}
        <div className="lg:w-[55%] p-8 bg-[#f8fafc] flex flex-col overflow-y-auto max-h-[90vh]">
          {isSorting ? (
            <div className="h-full flex flex-col animate-fade-in">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-blue-100 rounded-lg"><ListOrdered size={20} className="text-blue-700" /></div>
                <div>
                  <h3 className="font-black text-slate-800">Classement des questions</h3>
                  <p className="text-xs font-medium text-slate-500">Glissez les questions dans leur sous-catégorie. L'ordre des questions n'est pas conservé à l'importation.</p>
                </div>
              </div>
              
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEndDndKit}>
                <SortableContext items={parsedItems.map(i => i.id)} strategy={verticalListSortingStrategy}>
                  <div className="flex-1 overflow-y-auto pr-2 space-y-2 pb-6 custom-scrollbar">
                    {parsedItems.map((item) => (
                      <SortableItem key={item.id} item={item} />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>

              <button 
                onClick={() => compileXML(parsedItems)} 
                className="mt-auto w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl shadow-xl shadow-blue-200 transition-all flex items-center justify-center gap-3 text-sm uppercase tracking-widest shrink-0"
              >
                Valider le tri et compiler le XML
              </button>
            </div>

          ) : resultXml ? (
          <div className="h-full flex flex-col animate-fade-in">
              {/* HEADER RÉSULTAT */}
              <div className="flex justify-between items-center pb-4 border-b border-slate-200 shrink-0 mb-4">
                <div className="flex items-center gap-4">
                  <span className="px-3 py-1 rounded-md text-[10px] font-black tracking-widest uppercase bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center gap-2">
                    <Check size={14} /> Conversion Réussie
                  </span>
                </div>
                
                <div className="flex gap-2">
                  <button onClick={() => copyToClipboard(resultXml)} className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 flex items-center gap-2 transition-colors shadow-sm"><Copy size={14} /> Copier</button>
                  <button onClick={handleDownload} className="px-4 py-2 bg-blue-600 rounded-lg text-xs font-bold text-white hover:bg-blue-700 flex items-center gap-2 transition-colors shadow-md shadow-blue-200"><Download size={14} /> Télécharger .xml</button>
                </div>
              </div>

              {/* ONGLET DE NAVIGATION */}
              <div className="flex gap-4 border-b border-slate-200 pb-4 mb-4 shrink-0">
                <button
                  onClick={() => setViewMode('preview')}
                  className={`px-4 py-2 font-bold text-sm rounded-lg transition-colors flex items-center gap-2 ${viewMode === 'preview' ? 'bg-slate-800 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100'}`}
                >
                  <Eye size={16} /> Aperçu Visuel
                </button>
                <button
                  onClick={() => setViewMode('xml')}
                  className={`px-4 py-2 font-bold text-sm rounded-lg transition-colors flex items-center gap-2 ${viewMode === 'xml' ? 'bg-slate-800 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100'}`}
                >
                  <Code size={16} /> Code XML
                </button>
              </div>

              {/* VUES DYNAMIQUES */}
              {viewMode === 'preview' ? (
                <div className="flex-1 overflow-y-auto space-y-4 pr-2 pb-6 custom-scrollbar">
                   {parsedItems.map(item => <PreviewItem key={item.id} item={item} />)}
                </div>
              ) : (
                <div className="flex-1 bg-slate-800 rounded-xl p-4 overflow-hidden relative group shadow-inner flex flex-col">
                   <div className="absolute top-0 left-0 w-full px-4 py-2 bg-slate-900/80 border-b border-slate-700 text-[10px] font-mono text-slate-400 flex justify-between items-center shrink-0">
                      <span>Moodle XML (Aperçu)</span><span>GREP appliqué</span>
                   </div>
                   <textarea readOnly value={resultXml} className="w-full h-full bg-transparent text-slate-300 font-mono text-xs pt-8 outline-none resize-none custom-scrollbar"/>
                </div>
              )}

            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-40">
              <div className="w-24 h-24 bg-slate-200 rounded-3xl flex items-center justify-center border-4 border-white shadow-inner"><FileText size={48} className="text-slate-500" /></div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 max-w-[250px]">En attente de traitement du gabarit Word</p>
            </div>
          )}
        </div>
   </div>
   </div>
  );
}