"use client";

import { useEffect, useState } from "react";

const LINES = [
  "root@wb-audiflash:~$ ./audit --mode=passif --cible=accueil",
  "[*] handshake TLS ..................... établi",
  "[!] strict-transport-security ......... absent",
  "[!] content-security-policy ........... absent",
  "[!] x-frame-options ................... absent",
  "[~] cookies Secure/HttpOnly/SameSite .. partiel",
  "[~] generator ......................... WordPress",
  "[i] surface paiement .................. FedaPay",
  "[=] score métier ...................... calculé",
];

export function ScriptTerminal() {
  const [done, setDone] = useState<string[]>([]);
  const [partial, setPartial] = useState("");

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setDone(LINES);
      return;
    }

    let line = 0;
    let char = 0;
    let timer = 0;
    let stopped = false;

    const tick = () => {
      if (stopped) return;
      const current = LINES[line] ?? "";
      char += 1;
      setPartial(current.slice(0, char));
      if (char < current.length) {
        timer = window.setTimeout(tick, current.startsWith("root@") ? 22 : 12);
        return;
      }
      setDone((previous) => [...previous, current].slice(-7));
      setPartial("");
      line = (line + 1) % LINES.length;
      char = 0;
      timer = window.setTimeout(tick, 480);
    };

    timer = window.setTimeout(tick, 280);
    return () => {
      stopped = true;
      window.clearTimeout(timer);
    };
  }, []);

  return (
    <div className="term">
      <div className="term-bar">
        <span />
        <span />
        <span />
        <p className="script">wb-audiflash.sh · flux de démonstration</p>
      </div>
      <div className="term-body script" aria-live="polite">
        {done.map((line) => (
          <p key={line}>{line}</p>
        ))}
        {partial ? (
          <p>
            {partial}
            <span className="caret">▌</span>
          </p>
        ) : (
          <p>
            <span className="caret">▌</span>
          </p>
        )}
      </div>
    </div>
  );
}
