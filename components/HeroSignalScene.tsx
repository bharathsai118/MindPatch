"use client";

import { useEffect, useRef } from "react";

type NodePoint = {
  x: number;
  y: number;
  r: number;
  label: string;
};

const nodes: NodePoint[] = [
  { x: 0.14, y: 0.28, r: 5, label: "transcript" },
  { x: 0.36, y: 0.18, r: 4, label: "trace" },
  { x: 0.57, y: 0.36, r: 6, label: "bug" },
  { x: 0.78, y: 0.22, r: 4, label: "memory" },
  { x: 0.28, y: 0.62, r: 5, label: "repair" },
  { x: 0.66, y: 0.72, r: 5, label: "plan" },
  { x: 0.88, y: 0.58, r: 4, label: "progress" }
];

export function HeroSignalScene() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    let animationFrame = 0;
    let pointerX = 0.5;
    let pointerY = 0.5;

    const resize = () => {
      const ratio = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * ratio;
      canvas.height = rect.height * ratio;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
    };

    const draw = (time: number) => {
      const rect = canvas.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;
      context.clearRect(0, 0, width, height);

      context.fillStyle = "#020617";
      context.fillRect(0, 0, width, height);

      context.strokeStyle = "rgba(148, 163, 184, 0.12)";
      context.lineWidth = 1;
      for (let x = 0; x < width; x += 38) {
        context.beginPath();
        context.moveTo(x, 0);
        context.lineTo(x, height);
        context.stroke();
      }
      for (let y = 0; y < height; y += 38) {
        context.beginPath();
        context.moveTo(0, y);
        context.lineTo(width, y);
        context.stroke();
      }

      const resolvedNodes = nodes.map((node, index) => {
        const pulse = Math.sin(time / 700 + index) * 5;
        const driftX = (pointerX - 0.5) * 18 * (index % 2 === 0 ? 1 : -1);
        const driftY = (pointerY - 0.5) * 14 * (index % 3 === 0 ? -1 : 1);
        return {
          ...node,
          px: node.x * width + pulse + driftX,
          py: node.y * height + pulse * 0.55 + driftY
        };
      });

      context.lineWidth = 1.4;
      for (let index = 0; index < resolvedNodes.length - 1; index += 1) {
        const start = resolvedNodes[index];
        const end = resolvedNodes[index + 1];
        const gradient = context.createLinearGradient(start.px, start.py, end.px, end.py);
        gradient.addColorStop(0, "rgba(96, 165, 250, 0.22)");
        gradient.addColorStop(1, "rgba(45, 212, 191, 0.18)");
        context.strokeStyle = gradient;
        context.beginPath();
        context.moveTo(start.px, start.py);
        context.lineTo(end.px, end.py);
        context.stroke();
      }

      resolvedNodes.forEach((node, index) => {
        const glow = 0.45 + Math.sin(time / 500 + index) * 0.18;
        context.beginPath();
        context.fillStyle = `rgba(96, 165, 250, ${glow})`;
        context.arc(node.px, node.py, node.r + 4, 0, Math.PI * 2);
        context.fill();

        context.beginPath();
        context.fillStyle = index === 2 ? "#fbbf24" : "#dbeafe";
        context.arc(node.px, node.py, node.r, 0, Math.PI * 2);
        context.fill();

        context.font = "600 12px Inter, system-ui, sans-serif";
        context.fillStyle = "rgba(226, 232, 240, 0.76)";
        context.fillText(node.label, node.px + 11, node.py + 4);
      });

      animationFrame = requestAnimationFrame(draw);
    };

    const onPointerMove = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointerX = (event.clientX - rect.left) / rect.width;
      pointerY = (event.clientY - rect.top) / rect.height;
    };

    resize();
    window.addEventListener("resize", resize);
    canvas.addEventListener("pointermove", onPointerMove);
    animationFrame = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("pointermove", onPointerMove);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />;
}
