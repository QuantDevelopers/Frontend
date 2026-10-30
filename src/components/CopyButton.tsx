import { useState } from 'react';
import { Check, Copy } from 'lucide-react';

interface CopyButtonProps {
  text: string;
  label?: string;
  className?: string;
}

export function CopyButton({ text, label, className = '' }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      type="button"
      className={`inline-flex items-center gap-1 text-slate-400 hover:text-slate-700 transition-colors p-0.5 rounded hover:bg-slate-200/60 cursor-pointer ${className}`}
      title={copied ? 'کپی شد!' : (label || 'کپی در حافظه')}
    >
      {copied ? (
        <>
          <Check size={11} className="text-emerald-600 stroke-[2.5]" />
          <span className="text-[10px] text-emerald-700 font-bold">کپی شد</span>
        </>
      ) : (
        <Copy size={11} className="stroke-[1.75]" />
      )}
    </button>
  );
}
