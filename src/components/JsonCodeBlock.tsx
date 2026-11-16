import React from 'react';

interface JsonCodeBlockProps {
  data: unknown;
}

function renderHighlightedLine(line: string, lineIndex: number): React.ReactNode {
  // Match JSON key-value or standalone tokens cleanly
  const keyValueMatch = line.match(/^(\s*)"([^"]+)"(\s*:\s*)(.*)$/);
  if (keyValueMatch) {
    const [, indent, key, colon, rest] = keyValueMatch;
    return (
      <div key={lineIndex} className="leading-relaxed">
        <span>{indent}</span>
        <span className="text-sky-300">"{key}"</span>
        <span className="text-slate-400">{colon}</span>
        {renderJsonValue(rest)}
      </div>
    );
  }

  return (
    <div key={lineIndex} className="leading-relaxed">
      {renderJsonValue(line)}
    </div>
  );
}

function renderJsonValue(valueToken: string): React.ReactNode {
  const trimmed = valueToken.trim();
  const trailingComma = trimmed.endsWith(',') ? ',' : '';
  const core = trailingComma ? trimmed.slice(0, -1) : trimmed;
  const leadingSpace = valueToken.slice(0, valueToken.indexOf(trimmed));

  if (core.startsWith('"') && core.endsWith('"')) {
    return (
      <>
        <span>{leadingSpace}</span>
        <span className="text-emerald-300">{core}</span>
        {trailingComma && <span className="text-slate-400">,</span>}
      </>
    );
  }

  if (/^-?\d+(\.\d+)?$/.test(core)) {
    return (
      <>
        <span>{leadingSpace}</span>
        <span className="text-amber-300">{core}</span>
        {trailingComma && <span className="text-slate-400">,</span>}
      </>
    );
  }

  if (core === 'true' || core === 'false' || core === 'null') {
    return (
      <>
        <span>{leadingSpace}</span>
        <span className="text-indigo-300">{core}</span>
        {trailingComma && <span className="text-slate-400">,</span>}
      </>
    );
  }

  return <span className="text-slate-300">{valueToken}</span>;
}

export const JsonCodeBlock: React.FC<JsonCodeBlockProps> = ({ data }) => {
  const formatted = JSON.stringify(data, null, 2);
  const lines = formatted.split('\n');

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950 p-4 font-mono-tabular text-xs text-slate-200 shadow-inner max-h-[460px] overflow-y-auto">
      <pre className="whitespace-pre">
        <code>{lines.map((line, idx) => renderHighlightedLine(line, idx))}</code>
      </pre>
    </div>
  );
};
