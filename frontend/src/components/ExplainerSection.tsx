import { ReactNode, useState } from "react";

export function ExplainerSection({
  prompt,
  title,
  simple,
  deeper,
}: {
  prompt: string;
  title: string;
  simple: ReactNode;
  deeper: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="panel about-panel">
      <p className="terminal-prompt">{prompt}</p>
      <h2 className="about-heading">{title}</h2>
      <div className="explainer-simple">{simple}</div>
      <button className="explainer-toggle" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        {open ? "[ − ] less detail" : "[ + ] go deeper"}
      </button>
      <div className={`explainer-more ${open ? "explainer-more-open" : ""}`}>
        <div className="explainer-more-inner">
          <div className="explainer-deeper">{deeper}</div>
        </div>
      </div>
    </div>
  );
}
