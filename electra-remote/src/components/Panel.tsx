import { type ReactNode, useId, useState } from 'react';

import { ChevronDownIcon, ChevronUpIcon } from './Icons.tsx';

interface PanelProps {
  icon: ReactNode;
  title: string;
  defaultOpen?: boolean;
  children: ReactNode;
}

/** A collapsible section. Collapsed by default so the remote stays the star. */
export function Panel({ icon, title, defaultOpen = false, children }: PanelProps) {
  const [open, setOpen] = useState(defaultOpen);
  const bodyId = useId();

  return (
    <section className="panel">
      <button
        type="button"
        className="panel-head"
        aria-expanded={open}
        aria-controls={bodyId}
        onClick={() => setOpen((value) => !value)}
      >
        {icon}
        <span>{title}</span>
        <span className="chevron">
          {open ? <ChevronUpIcon size={16} /> : <ChevronDownIcon size={16} />}
        </span>
      </button>

      {open && (
        <div className="panel-body" id={bodyId}>
          {children}
        </div>
      )}
    </section>
  );
}

interface ToggleRowProps {
  title: string;
  description?: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}

export function ToggleRow({
  title,
  description,
  checked,
  onChange,
  disabled,
}: ToggleRowProps) {
  return (
    <div className="toggle-row">
      <span className="text">
        <strong>{title}</strong>
        {description && <span>{description}</span>}
      </span>
      <button
        type="button"
        className="switch"
        role="switch"
        aria-checked={checked}
        aria-label={title}
        data-on={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
      />
    </div>
  );
}
