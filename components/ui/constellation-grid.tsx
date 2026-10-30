"use client";

import { useEffect, useRef, useState } from "react";

type ConstellationNode = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  baseX: number;
  baseY: number;
  radius: number;
  label: string;
  pulse: number;
};

export default function ConstellationGrid() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [reducedMotion, setReducedMotion] = useState<boolean | null>(null);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setReducedMotion(mediaQuery.matches);

    updatePreference();
    mediaQuery.addEventListener("change", updatePreference);
    return () => mediaQuery.removeEventListener("change", updatePreference);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || reducedMotion === null) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    let width = 0;
    let height = 0;
    let frameId = 0;
    let previousTime = performance.now();
    let nodes: ConstellationNode[] = [];

    const pointer = {
      x: -1000,
      y: -1000,
      previousX: -1000,
      previousY: -1000,
      speed: 0,
      radius: 185,
    };

    const initializeNodes = () => {
      const spacing = window.innerWidth < 680 ? 88 : 82;
      const columns = Math.ceil(width / spacing) + 1;
      const rows = Math.ceil(height / spacing) + 1;
      nodes = [];

      for (let column = 0; column < columns; column += 1) {
        for (let row = 0; row < rows; row += 1) {
          const x = column * spacing;
          const y = row * spacing;
          nodes.push({
            x,
            y,
            vx: 0,
            vy: 0,
            baseX: x,
            baseY: y,
            radius: Math.random() * 1.1 + 1,
            label: `${(column * 7).toString(16).toUpperCase()}:${(row * 11).toString(16).toUpperCase()}`,
            pulse: Math.random() * Math.PI * 2,
          });
        }
      }
    };

    const resizeCanvas = () => {
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.round(width * pixelRatio);
      canvas.height = Math.round(height * pixelRatio);
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      initializeNodes();
    };

    const handlePointerMove = (event: PointerEvent) => {
      pointer.x = event.clientX;
      pointer.y = event.clientY;
    };

    const handlePointerLeave = () => {
      pointer.x = -1000;
      pointer.y = -1000;
      pointer.speed = 0;
    };

    const render = (now: number) => {
      const deltaTime = Math.min((now - previousTime) / 1000, 0.05);
      previousTime = now;
      context.clearRect(0, 0, width, height);

      pointer.speed = Math.hypot(
        pointer.x - pointer.previousX,
        pointer.y - pointer.previousY,
      ) / (deltaTime * 1000 || 1);
      pointer.previousX = pointer.x;
      pointer.previousY = pointer.y;

      if (!reducedMotion) {
        for (const node of nodes) {
          node.pulse += deltaTime * 2.4;
          const dx = pointer.x - node.x;
          const dy = pointer.y - node.y;
          const distance = Math.hypot(dx, dy);

          if (distance < pointer.radius && distance > 0) {
            const strength = 1 - distance / pointer.radius;
            const force = strength * (570 + Math.min(pointer.speed, 2) * 150);
            node.vx -= (dx / distance) * force * deltaTime;
            node.vy -= (dy / distance) * force * deltaTime;
          }

          node.vx += (node.baseX - node.x) * 17 * deltaTime;
          node.vy += (node.baseY - node.y) * 17 * deltaTime;
          node.vx *= 0.84;
          node.vy *= 0.84;
          node.x += node.vx * deltaTime * 60;
          node.y += node.vy * deltaTime * 60;
        }
      }

      const maxConnectionDistance = 118;
      const maxConnectionDistanceSquared = maxConnectionDistance ** 2;
      for (let index = 0; index < nodes.length; index += 1) {
        const node = nodes[index];
        if (!node) continue;

        for (let nextIndex = index + 1; nextIndex < nodes.length; nextIndex += 1) {
          const nextNode = nodes[nextIndex];
          if (!nextNode) continue;
          const dx = node.x - nextNode.x;
          const dy = node.y - nextNode.y;
          const distanceSquared = dx * dx + dy * dy;

          if (distanceSquared < maxConnectionDistanceSquared) {
            const distance = Math.sqrt(distanceSquared);
            const alpha = (1 - distance / maxConnectionDistance) * 0.2;
            context.strokeStyle = `rgba(133, 153, 255, ${alpha})`;
            context.lineWidth = 0.7;
            context.beginPath();
            context.moveTo(node.x, node.y);
            context.lineTo(nextNode.x, nextNode.y);
            context.stroke();
          }
        }
      }

      for (const node of nodes) {
        const dx = pointer.x - node.x;
        const dy = pointer.y - node.y;
        const distance = Math.hypot(dx, dy);
        const nearPointer = distance < pointer.radius;
        const alpha = nearPointer ? 0.88 : 0.2 + Math.sin(node.pulse) * 0.07;
        context.fillStyle = nearPointer
          ? `rgba(119, 164, 255, ${alpha})`
          : `rgba(190, 197, 230, ${alpha})`;

        const radius = nearPointer
          ? node.radius * 2.1
          : node.radius + Math.sin(node.pulse) * 0.25;
        context.beginPath();
        context.arc(node.x, node.y, Math.max(0.5, radius), 0, Math.PI * 2);
        context.fill();

        if (nearPointer && distance < 82) {
          const ringRadius = ((node.pulse * 14) % 25) + 5;
          context.strokeStyle = `rgba(135, 125, 255, ${(1 - ringRadius / 31) * 0.42})`;
          context.lineWidth = 1;
          context.beginPath();
          context.arc(node.x, node.y, ringRadius, 0, Math.PI * 2);
          context.stroke();

          context.font = "8px ui-monospace, SFMono-Regular, Consolas, monospace";
          context.fillStyle = "rgba(155, 176, 255, 0.78)";
          context.fillText(node.label, node.x + 9, node.y - 9);
        }
      }

      if (!reducedMotion) frameId = window.requestAnimationFrame(render);
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("pointerleave", handlePointerLeave);
    frameId = window.requestAnimationFrame(render);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("resize", resizeCanvas);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerleave", handlePointerLeave);
    };
  }, [reducedMotion]);

  return <canvas ref={canvasRef} className="constellation-background" aria-hidden="true" />;
}
