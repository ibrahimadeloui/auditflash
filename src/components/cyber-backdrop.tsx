"use client";

import { useEffect, useRef } from "react";

const GLYPHS = "01<>/{}[]$#*=+-;:WB".split("");

export function CyberBackdrop() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    let frame = 0;
    let columns = 0;
    let drops: number[] = [];

    const fit = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(window.innerWidth * ratio);
      canvas.height = Math.floor(window.innerHeight * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      columns = Math.max(1, Math.floor(window.innerWidth / 18));
      drops = Array.from({ length: columns }, () => Math.random() * -30);
    };

    const draw = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      context.fillStyle = "rgba(4, 12, 24, 0.22)";
      context.fillRect(0, 0, width, height);
      context.font = "13px ui-monospace, monospace";
      for (let index = 0; index < drops.length; index += 1) {
        const glyph = GLYPHS[Math.floor(Math.random() * GLYPHS.length)] ?? "0";
        context.fillStyle = Math.random() > 0.985 ? "#ffb15a" : "rgba(90, 230, 255, 0.72)";
        context.fillText(glyph, index * 18, drops[index] * 18);
        drops[index] += 0.45;
        if (drops[index] * 18 > height && Math.random() > 0.975) drops[index] = 0;
      }
      frame = window.requestAnimationFrame(draw);
    };

    fit();
    frame = window.requestAnimationFrame(draw);
    window.addEventListener("resize", fit);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", fit);
    };
  }, []);

  return (
    <div className="cyber-stage" aria-hidden="true">
      <canvas ref={canvasRef} className="cyber-rain" />
      <div className="cyber-grid" />
      <div className="cyber-scan" />
      <div className="cyber-orb cyber-orb-a" />
      <div className="cyber-orb cyber-orb-b" />
      <div className="cyber-vignette" />
    </div>
  );
}
