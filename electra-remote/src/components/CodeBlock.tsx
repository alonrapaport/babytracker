import { useEffect, useState } from 'react';

import { CheckIcon, CopyIcon } from './Icons.tsx';

interface CodeBlockProps {
  label: string;
  body: string;
  hint?: string;
  tone?: 'green' | 'cyan';
}

/** A copyable snippet. Falls back to a hidden textarea where clipboard is blocked. */
export function CodeBlock({ label, body, hint, tone = 'green' }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 1600);
    return () => clearTimeout(timer);
  }, [copied]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(body);
      setCopied(true);
    } catch {
      // Clipboard API needs a secure context; plain-http LAN use hits this.
      const area = document.createElement('textarea');
      area.value = body;
      area.style.position = 'fixed';
      area.style.opacity = '0';
      document.body.appendChild(area);
      area.select();
      try {
        document.execCommand('copy');
        setCopied(true);
      } catch {
        /* Nothing more we can do — the text is on screen to select manually. */
      }
      document.body.removeChild(area);
    }
  }

  return (
    <div>
      <div className="snippet-head">
        <label>{label}</label>
        <button
          type="button"
          className="copy"
          data-done={copied}
          onClick={copy}
          aria-label={`Copy ${label}`}
        >
          {copied ? <CheckIcon size={13} /> : <CopyIcon size={13} />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      {hint && <p className="note" style={{ marginBottom: 6 }}>{hint}</p>}
      <pre className={tone === 'cyan' ? 'code cyan' : 'code'}>{body}</pre>
    </div>
  );
}
