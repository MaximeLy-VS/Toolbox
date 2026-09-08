import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, Check, AlertCircle, Copy, Download, Trash2, Plus, FileCode2 } from 'lucide-react';
import gabaritWord from './DA-WB_Gabarit.docx?url';

// Chargement asynchrone de JSZip depuis un CDN pour garantir la compatibilité sans npm install
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
export default function MoodleQuizApp() {
  const [file, setFile] = useState(null);
  const [quizId, setQuizId] = useState("MonQuiz");
  const [descriptions, setDescriptions] = useState(["<div class=\"FondCouleur1 p-3\">\n  <strong>Mission 1</strong>\n</div>"]);
  const [loading, setLoading] = useState(false);
  const [resultXml, setResultXml] = useState("");
  const [error, setError] = useState(null);
  const [auditMessages, setAuditMessages] = useState([]);
  
  const fileInputRef = useRef(null);

  const escapeXML = (str) => {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  };

  const applyGrepRules = (text) => {
    let str = text;
    
    // 1. Transformer temporairement les entités &nbsp; existantes en vrais espaces insécables Unicode
    str = str.replace(/&nbsp;/g, '\u00A0');

    // Définition de toutes les règles
    const rules = [
      { find: /\s*\u00A0\s*/g, replace: '\u00A0' },
      { find: /(?<!\u00A0)([^\s\u00A0])\s*([:?!%€»]|(?<!\u00A0);)/g, replace: "$1\u00A0$2" },
      { find: /(«)\s*(?!\u00A0)([^\s\u00A0])/g, replace: "$1\u00A0$2" },
      { find: /([:?!€»]|(?<!\u00A0);)(?!\u00A0)([^\s\u00A0\.,\)])/g, replace: "$1 $2" },
      { find: /"([^">]+)"/g, replace: "«\u00A0$1\u00A0»" },
      { find: /\.\.\./g, replace: ", etc." },
      { find: /\s+-\s+/g, replace: " – " },
      { find: /(\d)(?:\s|\u00A0)*[hH](?:\s|\u00A0)*(\d)/g, replace: "$1\u00A0h\u00A0$2" },
      { find: /(\d)(?:\s|\u00A0)*([hH]|[mM]|[mM][iI][nN]|[mM][iI][nN][uU][tT][eE][sS]?|[hH][eE][uU][rR][eE][sS]?)\b/g, replace: "$1\u00A0$2" },
      { find: /(\d)(?:\s|\u00A0)*(er)\b/g, replace: "$1<sup>er</sup>\u00A0" },
      { find: /(\d)(?:\s|\u00A0)*(ème|eme|e)\b/g, replace: "$1<sup>e</sup>\u00A0" },
      { find: /(\d)(?:\s|\u00A0)*[jJ]\b/g, replace: "$1\u00A0J" },
      { find: /(\d)(?:\s|\u00A0)*[kK][jJ]\b/g, replace: "$1\u00A0kJ" },
      { find: /(\d)(?:\s|\u00A0)*[cC][aA][lL]\b/g, replace: "$1\u00A0cal" },
      { find: /(\d)(?:\s|\u00A0)*[kK][cC][aA][lL]\b/g, replace: "$1\u00A0kcal" },
      { find: /(\d)(?:\s|\u00A0)*[wW][hH]\b/g, replace: "$1\u00A0Wh" },
      { find: /(\d)(?:\s|\u00A0)*([kK][wW][hH]|[kK][wW]-[hH])\b/g, replace: "$1\u00A0kWh" },
      { find: /(\d)(?:\s|\u00A0)*[kK][oO]\b/g, replace: "$1\u00A0ko" },
      { find: /(\d)(?:\s|\u00A0)*[mM][oO]\b/g, replace: "$1\u00A0Mo" },
      { find: /(\d)(?:\s|\u00A0)*[gG][oO]\b/g, replace: "$1\u00A0Go" },
      { find: /(\d)(?:\s|\u00A0)*[tT][oO]\b/g, replace: "$1\u00A0To" },
      { find: /(\d)(?:\s|\u00A0)*[hH][zZ]\b/g, replace: "$1\u00A0Hz" },
      { find: /(\d)(?:\s|\u00A0)*[kK][hH][zZ]\b/g, replace: "$1\u00A0kHz" },
      { find: /(\d)(?:\s|\u00A0)*[mM][hH][zZ]\b/g, replace: "$1\u00A0MHz" },
      { find: /(\d)(?:\s|\u00A0)*[gG][hH][zZ]\b/g, replace: "$1\u00A0GHz" },
      { find: /(\d)(?:\s|\u00A0)*[kK][gG]\b/g, replace: "$1\u00A0kg" },
      { find: /(\d)(?:\s|\u00A0)*[hH][gG]\b/g, replace: "$1\u00A0hg" },
      { find: /(\d)(?:\s|\u00A0)*g\b/g, replace: "$1\u00A0g" },
      { find: /(\d)(?:\s|\u00A0)*[dD][gG]\b/g, replace: "$1\u00A0dg" },
      { find: /(\d)(?:\s|\u00A0)*[cC][gG]\b/g, replace: "$1\u00A0cg" },
      { find: /(\d)(?:\s|\u00A0)*[mM][gG]\b/g, replace: "$1\u00A0mg" },
      { find: /(\d)(?:\s|\u00A0)*[uUµ][gG]\b/g, replace: "$1\u00A0µg" },
      { find: /(\d)(?:\s|\u00A0)*[kK][mM]\b/g, replace: "$1\u00A0km" },
      { find: /(\d)(?:\s|\u00A0)*m\b/g, replace: "$1\u00A0m" },
      { find: /(\d)(?:\s|\u00A0)*[dD][mM]\b/g, replace: "$1\u00A0dm" },
      { find: /(\d)(?:\s|\u00A0)*[cC][mM]\b/g, replace: "$1\u00A0cm" },
      { find: /(\d)(?:\s|\u00A0)*[mM][mM]\b/g, replace: "$1\u00A0mm" }
    ];

    rules.forEach(rule => {
      str = str.replace(rule.find, rule.replace);
    });

    // 2. Reconvertir le vrai espace insécable \u00A0 en entité HTML &nbsp; pour Moodle
    str = str.replace(/\u00A0/g, '&nbsp;');
    
    return str;
  };

  const copyToClipboard = (text) => {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(() => {
        alert("XML copié dans le presse-papier !");
      }).catch((err) => {
        fallbackCopyTextToClipboard(text);
      });
    } else {
      fallbackCopyTextToClipboard(text);
    }
  };

  const fallbackCopyTextToClipboard = (text) => {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";  // Évite de scroller vers le bas
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

  const processFile = async () => {
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
      if (!docXmlFile) {
        throw new Error("Fichier document.xml introuvable. Est-ce bien un format .docx valide ?");
      }
      
      const xmlString = await docXmlFile.async("text");
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlString, "text/xml");
      
      const tables = xmlDoc.getElementsByTagName("w:tbl");
      if (tables.length === 0) {
        throw new Error("Aucun tableau trouvé dans le document.");
      }

      const getRawCellText = (cellNode) => {
        if (!cellNode) return "";
        const textNodes = cellNode.getElementsByTagName("w:t");
        let str = "";
        for (let t = 0; t < textNodes.length; t++) {
          str += textNodes[t].textContent;
        }
        return str;
      };

      const extractAndCleanCell = (cellNode) => {
        if (!cellNode) return "";
        let htmlContent = "";
        let inList = false;

        const paragraphs = cellNode.getElementsByTagName("w:p");
        for (let p = 0; p < paragraphs.length; p++) {
          const pNode = paragraphs[p];
          
          const numPr = pNode.getElementsByTagName("w:numPr");
          const isListItem = numPr.length > 0;

          let pText = "";
          const runs = pNode.getElementsByTagName("w:r");
          for (let r = 0; r < runs.length; r++) {
            const run = runs[r];
            for (let c = 0; c < run.childNodes.length; c++) {
              const child = run.childNodes[c];
              if (child.nodeName === "w:t") {
                pText += child.textContent;
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
              htmlContent += "<br>";
            }
            htmlContent += cleanedText;
          }
        }

        if (inList) {
          htmlContent += `</ul>`;
        }

        return htmlContent;
      };

      let generatedXml = `<?xml version="1.0" encoding="UTF-8"?>\n<quiz>\n`;
      
      generatedXml += `  <question type="category">\n    <category>\n      <text>${escapeXML(quizId)}</text>\n    </category>\n    <info format="html"><text></text></info>\n    <idnumber></idnumber>\n  </question>\n\n`;

      descriptions.forEach((desc, index) => {
        if(desc.trim() === "") return;
        const descId = `${quizId}_DES${String(index + 1).padStart(2, '0')}`;
        generatedXml += `  <question type="description">\n    <name>\n      <text>${escapeXML(descId)}</text>\n    </name>\n    <questiontext format="html">\n      <text><![CDATA[${desc}]]></text>\n    </questiontext>\n    <generalfeedback format="html"><text></text></generalfeedback>\n    <defaultgrade>0.0000000</defaultgrade>\n    <penalty>0.0000000</penalty>\n    <hidden>0</hidden>\n    <idnumber></idnumber>\n  </question>\n\n`;
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
           
           // On remplace la virgule par un point au cas où (ex: "1,5" -> "1.5")
           extractedPoint = extractedPoint.replace(',', '.');
           
           if (extractedPoint !== "") {
               // On vérifie si la conversion en nombre échoue
               if (isNaN(Number(extractedPoint))) {
                   localAudits.push(`Question ${qName} : La note "${extractedPoint}" n'est pas un chiffre valide. Remplacée par défaut par "1".`);
                   qPoint = "1";
               } else {
                   qPoint = extractedPoint;
               }
           }
        }

        const row4Cells = rows[3].getElementsByTagName("w:tc");
        let qText = "";
        if (row4Cells.length >= 2) qText = extractAndCleanCell(row4Cells[1]);

        // 1. DÉTECTION DYNAMIQUE DE LA ZONE FEEDBACK
        let feedbackStartIndex = -1;
        for (let r = rows.length - 1; r >= 5; r--) {
          const cells = rows[r].getElementsByTagName("w:tc");
          if (cells.length > 0) {
            const firstCellText = getRawCellText(cells[0]).toLowerCase();
            if (firstCellText.includes("feedback")) {
              feedbackStartIndex = r;
              break;
            }
          }
        }
        
        if (feedbackStartIndex === -1) {
          feedbackStartIndex = rows.length - 1;
        }

        // 2. EXTRACTION DU FEEDBACK
        let gFeedback = "";
        for (let r = feedbackStartIndex; r < rows.length; r++) {
          const cells = rows[r].getElementsByTagName("w:tc");
          let cellText = "";
          
          if (cells.length >= 3) {
            cellText = extractAndCleanCell(cells[2]);
          } else if (cells.length >= 2) {
            cellText = extractAndCleanCell(cells[1]);
          } else if (cells.length === 1) {
            cellText = extractAndCleanCell(cells[0]);
          }
          
          if (cellText) {
            if (gFeedback !== "") gFeedback += "<br><br>";
            gFeedback += cellText;
          }
        }

        let rowData = [];
        let nbBonnesReponses = 0;
        let isTF = false;

        // 3. LECTURE DES PROPOSITIONS
        for (let r = 5; r < feedbackStartIndex; r++) {
          const cells = rows[r].getElementsByTagName("w:tc");
          if (cells.length < 2) continue;

          const cellNode = cells[0];
          const rawCellText = getRawCellText(cellNode);
          const answerText = extractAndCleanCell(cells[1]);

          let isChecked = false;
          
          const checkBoxes = cellNode.getElementsByTagName("w:checkBox");
          if (checkBoxes.length > 0) {
            const checkedTag = checkBoxes[0].getElementsByTagName("w:checked")[0];
            const defaultTag = checkBoxes[0].getElementsByTagName("w:default")[0];
            
            if (checkedTag) {
              const val = checkedTag.getAttribute("w:val");
              if (val === null || val === "1" || val === "true") isChecked = true;
            } else if (defaultTag) {
              const val = defaultTag.getAttribute("w:val");
              if (val === null || val === "1" || val === "true") isChecked = true;
            }
          }
          
          const modernCheckBoxes = cellNode.getElementsByTagName("w14:checked");
          if (modernCheckBoxes.length > 0) {
            const val = modernCheckBoxes[0].getAttribute("w14:val");
            if (val === null || val === "1" || val === "true") isChecked = true;
          }

          if (!isChecked) {
              const lowText = rawCellText.toLowerCase().trim();
              if (lowText === "x" || lowText === "[x]" || rawCellText.includes("☑") || rawCellText.includes("☒")) {
                  isChecked = true;
              }
          }

          if (!answerText && !isChecked) continue;

          if (isChecked) nbBonnesReponses++;
          if (answerText.toLowerCase().includes("vrai") || answerText.toLowerCase().includes("faux")) isTF = true;

          rowData.push({ text: answerText, isChecked: isChecked });
        }

        if (nbBonnesReponses === 0) {
           localAudits.push(`Question ${qName} ignorée (Aucune bonne réponse cochée détectée).`);
           continue;
        }

        let qType = isTF ? "TF" : (nbBonnesReponses > 1 ? "QCM" : "QCU");

        if (qType === "TF") {
            let scoreTrue = "0", scoreFalse = "0";
            rowData.forEach(r => {
                if (r.isChecked) {
                    if (r.text.toLowerCase().includes("vrai")) scoreTrue = "100";
                    else if (r.text.toLowerCase().includes("faux")) scoreFalse = "100";
                }
            });

            generatedXml += `  <question type="truefalse">\n`;
            generatedXml += `    <name><text>${escapeXML(qName)}</text></name>\n`;
            generatedXml += `    <questiontext format="html"><text><![CDATA[<p>${qText}</p>]]></text></questiontext>\n`;
            generatedXml += `    <generalfeedback format="html"><text><![CDATA[<p>${gFeedback}</p>]]></text></generalfeedback>\n`;
            generatedXml += `    <defaultgrade>${qPoint}</defaultgrade>\n`;
            generatedXml += `    <penalty>1.0000000</penalty>\n`;
            generatedXml += `    <hidden>0</hidden>\n`;
            generatedXml += `    <answer fraction="${scoreTrue}" format="moodle_auto_format">\n      <text>true</text>\n      <feedback format="html"><text></text></feedback>\n    </answer>\n`;
            generatedXml += `    <answer fraction="${scoreFalse}" format="moodle_auto_format">\n      <text>false</text>\n      <feedback format="html"><text></text></feedback>\n    </answer>\n`;
            generatedXml += `  </question>\n\n`;
            questionCounter++;

        } else {
            let scorePositif = "100";
            let scoreNegatif = "0";

            if (qType === "QCM") {
                scoreNegatif = "-12.5";
                if (nbBonnesReponses === 2) scorePositif = "50";
                else if (nbBonnesReponses === 3) scorePositif = "33.33333";
                else if (nbBonnesReponses === 4) scorePositif = "25";
                else if (nbBonnesReponses === 5) scorePositif = "20";
                else if (nbBonnesReponses === 6) scorePositif = "16.66667";
                else if (nbBonnesReponses > 0) scorePositif = (100 / nbBonnesReponses).toFixed(5).replace(".00000", "");
            }

            generatedXml += `  <question type="multichoice">\n`;
            generatedXml += `    <name><text>${escapeXML(qName)}</text></name>\n`;
            generatedXml += `    <questiontext format="html"><text><![CDATA[<p>${qText}</p>]]></text></questiontext>\n`;
            generatedXml += `    <generalfeedback format="html"><text><![CDATA[<p>${gFeedback}</p>]]></text></generalfeedback>\n`;
            generatedXml += `    <defaultgrade>${qPoint}</defaultgrade>\n`;
            generatedXml += `    <penalty>0.3333333</penalty>\n`;
            generatedXml += `    <hidden>0</hidden>\n`;
            generatedXml += `    <single>${qType === "QCU" ? "true" : "false"}</single>\n`;
            generatedXml += `    <shuffleanswers>true</shuffleanswers>\n`;
            generatedXml += `    <answernumbering>none</answernumbering>\n`;
            generatedXml += `    <correctfeedback format="html"><text>Votre réponse est correcte.</text></correctfeedback>\n`;
            generatedXml += `    <partiallycorrectfeedback format="html"><text>Votre réponse est partiellement correcte.</text></partiallycorrectfeedback>\n`;
            generatedXml += `    <incorrectfeedback format="html"><text>Votre réponse est incorrecte.</text></incorrectfeedback>\n`;
            generatedXml += `    <shownumcorrect/>\n`;

            rowData.forEach(r => {
                if (r.text.length > 0) {
                    const fraction = r.isChecked ? scorePositif : scoreNegatif;
                    generatedXml += `    <answer fraction="${fraction}" format="html">\n`;
                    generatedXml += `      <text><![CDATA[<p>${r.text}</p>]]></text>\n`;
                    generatedXml += `      <feedback format="html"><text></text></feedback>\n`;
                    generatedXml += `    </answer>\n`;
                }
            });
            generatedXml += `  </question>\n\n`;
            questionCounter++;
        }
      }

      generatedXml += `</quiz>`;
      setResultXml(generatedXml);
      setAuditMessages(localAudits.length > 0 ? localAudits : [`Audit OK : ${questionCounter - 1} question(s) générée(s) avec succès (pondérations appliquées).`]);

    } catch (err) {
      console.error(err);
      setError(err.message || "Erreur critique lors de l'analyse du fichier.");
    } finally {
      setLoading(false);
    }
  };

  const addDescription = () => {
    setDescriptions([...descriptions, ""]);
  };

  const updateDescription = (index, value) => {
    const newDesc = [...descriptions];
    newDesc[index] = value;
    setDescriptions(newDesc);
  };

  const removeDescription = (index) => {
    if (descriptions.length > 1) {
      const newDesc = descriptions.filter((_, i) => i !== index);
      setDescriptions(newDesc);
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

      <div className="w-full max-w-7xl bg-white rounded-[2rem] shadow-[0_30px_100px_rgba(0,0,0,0.08)] overflow-hidden flex flex-col md:flex-row border border-slate-100 animate-fade-slide-up">
        {/* PARTIE GAUCHE : Configuration & Import */}
        <div className="lg:w-[45%] p-8 flex flex-col border-r border-slate-100 bg-white overflow-y-auto max-h-[90vh]">
          <header className="mb-8">
            <div className="flex items-center gap-4 mb-2">
              <div className="p-3 bg-blue-600 rounded-xl shadow-lg shadow-blue-200">
                <FileCode2 className="text-white" size={24} />
              </div>
              <div>
                <h1 className="text-xl font-black tracking-tight text-slate-800">Générateur XML Moodle</h1>
                <p className="text-blue-600 text-xs font-bold tracking-[0.2em] uppercase mt-1">Gabarit Word → Moodle</p>
              </div>
            </div>
          </header>

          <div className="space-y-6">
            
            {/* ID Quiz */}
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Identifiant du Quiz (Racine)</label>
              <input 
                type="text" 
                value={quizId} 
                onChange={(e) => setQuizId(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
                placeholder="Ex: UE01_Chap2"
              />
            </div>

            {/* Consignes dynamiques */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Consignes / Missions</label>
                <button onClick={addDescription} className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 bg-blue-50 px-2 py-1 rounded-md transition-colors">
                  <Plus size={14} /> Ajouter
                </button>
              </div>
              
              <div className="space-y-3">
                {descriptions.map((desc, index) => (
                  <div key={index} className="relative group">
                    <div className="absolute -left-2 -top-2 bg-slate-800 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-sm z-10">
                      {quizId}_DES{String(index + 1).padStart(2, '0')}
                    </div>
                    <textarea 
                      value={desc}
                      onChange={(e) => updateDescription(index, e.target.value)}
                      rows={3}
                      className="w-full p-4 pt-5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono text-slate-600 focus:outline-none focus:border-blue-400 transition-all resize-y"
                      placeholder={`Texte HTML pour la consigne ${index + 1}...`}
                    />
                    {descriptions.length > 1 && (
                      <button onClick={() => removeDescription(index)} className="absolute top-4 right-3 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Upload Zone */}
            <div className="space-y-2 pt-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Gabarit Word Rempli</label>
                <button className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 bg-blue-50 px-2 py-1 rounded-md transition-colors" size={14}>
                  <Download size={14}/><a href={gabaritWord} download="DA-WB_Gabarit.docx">
                  Gabarit vierge
                  </a>
                </button>
              </div>
              <input type="file" ref={fileInputRef} className="hidden" accept=".docx" onChange={(e) => setFile(e.target.files[0])} />
              <div 
                onClick={() => fileInputRef.current.click()} 
                className={`w-full p-8 border-2 border-dashed rounded-[1.5rem] flex flex-col items-center justify-center cursor-pointer transition-all duration-300 ${file ? 'border-emerald-400 bg-emerald-50' : 'border-slate-200 bg-slate-50 hover:border-blue-300'}`}
              >
                <div className={`w-14 h-14 rounded-2xl shadow-sm border flex items-center justify-center mb-4 transition-transform ${file ? 'bg-emerald-500 border-emerald-600 text-white scale-110' : 'bg-white border-slate-100 text-blue-600'}`}>
                  {file ? <Check size={28} /> : <UploadCloud size={28} />}
                </div>
                <p className={`font-bold text-sm ${file ? 'text-emerald-700' : 'text-slate-700'}`}>
                  {file ? file.name : "Cliquez pour importer le .docx"}
                </p>
                {!file && <p className="text-slate-400 text-xs mt-2 font-medium">Seul le format Word moderne (.docx) est supporté</p>}
              </div>
            </div>

            {/* Bouton Générer */}
            <button
              onClick={processFile}
              disabled={loading || !file}
              className={`w-full py-4 text-white font-black rounded-xl shadow-xl transition-all flex items-center justify-center gap-3 text-sm uppercase tracking-widest ${loading || !file ? 'bg-slate-300 cursor-not-allowed shadow-none' : 'bg-slate-800 hover:bg-slate-900 shadow-slate-200'}`}
            >
              {loading ? "Traitement en cours..." : "Générer l'export Moodle"}
            </button>
            
            {error && (
              <div className="p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 text-sm font-bold flex gap-3">
                <AlertCircle size={18} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>
        </div>

        {/* PARTIE DROITE : Résultats */}
        <div className="lg:w-[55%] p-8 bg-[#f8fafc] flex flex-col overflow-y-auto max-h-[90vh]">
          {resultXml ? (
            <div className="h-full flex flex-col space-y-4 animate-fade-in">
              <div className="flex justify-between items-center pb-4 border-b border-slate-200 shrink-0">
                <span className="px-3 py-1 rounded-md text-[10px] font-black tracking-widest uppercase bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center gap-2">
                  <Check size={14} /> Conversion Réussie
                </span>
                <div className="flex gap-2">
                  <button onClick={() => copyToClipboard(resultXml)} className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 flex items-center gap-2 transition-colors shadow-sm">
                    <Copy size={14} /> Copier
                  </button>
                  <button onClick={handleDownload} className="px-4 py-2 bg-blue-600 rounded-lg text-xs font-bold text-white hover:bg-blue-700 flex items-center gap-2 transition-colors shadow-md shadow-blue-200">
                    <Download size={14} /> Télécharger .xml
                  </button>
                </div>
              </div>

              {auditMessages.length > 0 && (
                <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-xl text-xs font-medium text-blue-800 space-y-1 shrink-0">
                  {auditMessages.map((msg, i) => <p key={i}>• {msg}</p>)}
                </div>
              )}

              <div className="flex-1 bg-slate-800 rounded-xl p-4 overflow-hidden relative group shadow-inner flex flex-col">
                 <div className="absolute top-0 left-0 w-full px-4 py-2 bg-slate-900/80 border-b border-slate-700 text-[10px] font-mono text-slate-400 flex justify-between items-center shrink-0">
                    <span>Moodle XML (Aperçu)</span>
                    <span>GREP appliqué</span>
                 </div>
                 <textarea 
                    readOnly
                    value={resultXml}
                    className="w-full h-full bg-transparent text-slate-300 font-mono text-xs pt-8 outline-none resize-none custom-scrollbar"
                 />
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-40">
              <div className="w-24 h-24 bg-slate-200 rounded-3xl flex items-center justify-center border-4 border-white shadow-inner">
                <FileText size={48} className="text-slate-500" />
              </div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 max-w-[250px]">En attente de traitement du gabarit Word</p>
            </div>
          )}
        </div>
   </div>
   </div>
  );
}
