import React, { useState, useEffect } from 'react';
import { Editor } from '@tinymce/tinymce-react';
import { FileText, Copy, Code, Check, RefreshCw } from 'lucide-react';

export default function TextToHtmlApp() {
  const [editorContent, setEditorContent] = useState('');
  const [processedHtml, setProcessedHtml] = useState('');
  const [copied, setCopied] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Moteur de règles Regex
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
    { find: /(\d)(?:\s|\u00A0)*(an|ans)\b/g, replace: "$1\u00A0$2" },
    { find: /(\d)(?:\s|\u00A0)*(%)\b/g, replace: "$1\u00A0%" },
    { find: /(\d)((?:<\/[a-zA-Z]+>)?)(?:\s|\u00A0)*((?:<[a-zA-Z]+>)?)(?:°|º)(?:\s|\u00A0)*[cC]\b/g, replace: "$1$2\u00A0$3°C" },
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

  useEffect(() => {
    // TinyMCE peut générer des paragraphes vides sous différentes formes (<p></p>, <p><br></p>, etc.)
    if (!editorContent || editorContent.trim() === '' || editorContent === '<p><br data-mce-bogus="1"></p>') {
      setProcessedHtml('');
      return;
    }

    setIsSyncing(true);
    
    const parser = new DOMParser();
    const doc = parser.parseFromString(editorContent, 'text/html');

    // 1. Suppression des balises <span> inutiles
    const spans = doc.querySelectorAll('span');
    spans.forEach(span => {
      const fragment = document.createDocumentFragment();
      while (span.firstChild) {
        fragment.appendChild(span.firstChild);
      }
      span.parentNode.replaceChild(fragment, span);
    });

    // 2. Nettoyage radical des attributs (styles, classes, et attributs parasites TinyMCE)
    const allElements = doc.querySelectorAll('*');
    allElements.forEach(el => {
      el.removeAttribute('style');
      el.removeAttribute('class');
      el.removeAttribute('data-mce-style');
      el.removeAttribute('data-mce-selected');
      el.removeAttribute('data-mce-bogus');
    });

    // 3. Application des REGEX sur les nœuds de texte
    const walkAndReplace = (node) => {
      if (node.nodeType === 3) { 
        let text = node.nodeValue;
        if (!text.trim() && !text.includes('\u00A0') && !text.includes(' ')) return;

        text = text.replace(/\u00A0/g, ' '); 

        rules.forEach(rule => { text = text.replace(rule.find, rule.replace); });
        
        if (text !== node.nodeValue) {
          if (text.includes('<')) {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = text;
            const parent = node.parentNode;
            while (tempDiv.firstChild) {
              parent.insertBefore(tempDiv.firstChild, node);
            }
            parent.removeChild(node);
          } else {
            node.nodeValue = text;
          }
        }
      } else if (node.nodeType === 1) { 
        Array.from(node.childNodes).forEach(walkAndReplace);
      }
    };

    Array.from(doc.body.childNodes).forEach(walkAndReplace);
    
    // 4. Suppression des tableaux fantômes restants
    const tables = doc.querySelectorAll('table');
    tables.forEach(table => {
      if (!table.textContent.trim()) {
        table.remove();
      }
    });

    // 5. Récupération et finitions du HTML
    let finalHtml = doc.body.innerHTML;
    
    finalHtml = finalHtml.replace(/\u00A0/g, '&nbsp;');
    finalHtml = finalHtml.replace(/(?:&nbsp;|\s)+<\/p>/gi, '</p>');
    
    // TinyMCE utilise souvent &nbsp; dans les paragraphes vides, on le gère ici
    finalHtml = finalHtml.replace(/(?:<p>(?:<br>|&nbsp;)?<\/p>\s*)+<p>/gi, '<p style="margin-top:1rem;">');
    finalHtml = finalHtml.replace(/(?:<p>(?:<br>|&nbsp;)?<\/p>\s*)+$/gi, '');

    finalHtml = finalHtml
      .replace(/<\/p>/g, "</p>\n")
      .replace(/<\/ul>/g, "</ul>\n")
      .replace(/<\/li>/g, "</li>\n")
      .replace(/<\/tr>/g, "</tr>\n")
      .replace(/<\/td>/g, "</td>\n")
      .replace(/<\/table>/g, "</table>\n");

    setProcessedHtml(finalHtml.trim());
    
    const timeoutId = setTimeout(() => setIsSyncing(false), 300);
    return () => clearTimeout(timeoutId);
    
  }, [editorContent]);

  const copyToClipboard = () => {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(processedHtml).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    } else {
      const textArea = document.createElement("textarea");
      textArea.value = processedHtml;
      textArea.style.position = "fixed";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        alert("Échec de la copie.");
      }
      document.body.removeChild(textArea);
    }
  };

  return (
    <div className="w-full max-w-7xl bg-white rounded-[2rem] shadow-[0_30px_100px_rgba(0,0,0,0.08)] overflow-hidden flex flex-col md:flex-row border border-slate-100 min-h-[85vh]">
      
      {/* PARTIE GAUCHE (TinyMCE) */}
      <div className="lg:w-[45%] flex flex-col border-r border-slate-100 bg-white">
        <header className="p-8 pb-4">
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 bg-blue-600 rounded-xl shadow-lg shadow-blue-200">
              <FileText className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-slate-800">Éditeur & Convertisseur</h1>
              <p className="text-blue-600 text-xs font-bold tracking-[0.2em] uppercase mt-1">Collez votre texte formaté</p>
            </div>
          </div>
        </header>

        <div className="flex-1 flex flex-col px-8 pb-8">
          <label className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2 flex justify-between items-center">
            <span>Texte source (Word, PPT, etc.)</span>
            {isSyncing && (
              <span className="flex items-center gap-1 text-blue-500">
                <RefreshCw size={12} className="animate-spin" /> 
                Synchronisation...
              </span>
            )}
          </label>
          <div className="flex-1 h-auto rounded-xl overflow-hidden transition-all flex flex-col">
            
          <Editor
            apiKey='xe5jyw4ek5te1fboouulda4i464gqhgekrcghc0xltotvq5w'
            onEditorChange={(newContent) => setEditorContent(newContent)}
            init={{
              plugins: [
                // Core editing features
                'table',
                // Premium features
                'casechange', 'permanentpen', 'powerpaste', 'advtable', 'tinycomments', 'tableofcontents',
              ],
              toolbar: 'undo redo | blocks fontfamily fontsize | bold italic underline strikethrough | link media table mergetags | addcomment showcomments | spellcheckdialog a11ycheck uploadcare | align lineheight | checklist numlist bullist indent outdent | emoticons charmap | removeformat',
              tinycomments_mode: 'embedded',
              tinycomments_author: 'Author name',
              mergetags_list: [
                { value: 'First.Name', title: 'First Name' },
                { value: 'Email', title: 'Email' },
              ],
              tinymceai_token_provider: async () => {
                await fetch(`https://demo.api.tiny.cloud/1/xe5jyw4ek5te1fboouulda4i464gqhgekrcghc0xltotvq5w/auth/random`, { method: "POST", credentials: "include" });
                return { token: await fetch(`https://demo.api.tiny.cloud/1/xe5jyw4ek5te1fboouulda4i464gqhgekrcghc0xltotvq5w/jwt/tinymceai`, { credentials: "include" }).then(r => r.text()) };
              },
              uploadcare_public_key: '42f7f71eae9b727b39f0',
            }}
            initialValue=""
          />

          </div>
        </div>
      </div>

      {/* PARTIE DROITE (Résultat HTML Live) */}
      <div className="lg:w-[55%] p-8 bg-[#f8fafc] flex flex-col">
        {processedHtml ? (
          <div className="h-full flex flex-col space-y-4 animate-fade-in">
            <div className="flex justify-between items-center pb-4 border-b border-slate-200 shrink-0">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 rounded-md text-[10px] font-black tracking-widest uppercase bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center gap-2">
                  <Check size={14} /> Code Nettoyé en Direct
                </span>
              </div>
              <button 
                onClick={copyToClipboard} 
                className="px-4 py-2 bg-blue-600 rounded-lg text-xs font-bold text-white hover:bg-blue-700 flex items-center gap-2 transition-colors shadow-md shadow-blue-200"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />} 
                {copied ? 'Copié !' : 'Copier HTML'}
              </button>
            </div>
            
            <div className="flex-1 bg-slate-800 rounded-xl p-4 overflow-hidden relative group shadow-inner flex flex-col">
              <div className="absolute top-0 left-0 w-full px-4 py-2 bg-slate-900/80 border-b border-slate-700 text-[10px] font-mono text-slate-400 flex justify-between items-center shrink-0">
                <span>Rendu HTML Purifié</span>
                <span>Règles REGEX appliquées</span>
              </div>
              <textarea 
                readOnly 
                value={processedHtml} 
                className="w-full h-full bg-transparent text-slate-300 font-mono text-sm pt-8 outline-none resize-none custom-scrollbar"
              />
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-40">
            <div className="w-24 h-24 bg-slate-200 rounded-3xl flex items-center justify-center border-4 border-white shadow-inner">
              <Code size={48} className="text-slate-500" />
            </div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 max-w-[250px]">
              Saisissez du texte à gauche pour voir le code HTML en direct
            </p>
          </div>
        )}
      </div>
      
    </div>
  );
}