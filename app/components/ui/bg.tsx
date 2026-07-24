"use client";
import React, { useEffect, useRef } from "react";
import { useThemeStore } from "../../store/themeStore";
 
interface Star {
  x: number;
  y: number;
  radius: number;
  alpha: number;
  twinkleSpeed: number;
  color: string;
}
 
interface Meteor {
  x: number;
  y: number;
  length: number;
  speed: number;
  thickness: number;
  color: string;
  glowColor: string;
}
 
export default function MeteorShowerPage() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { theme } = useThemeStore();
  const isDarkRef = useRef(theme === "dark");
  useEffect(() => {
    isDarkRef.current = theme === "dark";
  }, [theme]);
 
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
 
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
 
    let width = window.innerWidth;
    let height = window.innerHeight;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let animationFrameId: number;
 
    let currentSpeedMultiplier = 1.0;
    let targetSpeedMultiplier = 1.0;
 
    const handleMouseEnter = () => {
      targetSpeedMultiplier = 1.5;
    };
    const handleMouseLeave = () => {
      targetSpeedMultiplier = 1.0;
    };
 
    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); 
    };
    handleResize();
    window.addEventListener("resize", handleResize);
 
    const stars: Star[] = [];
    const numStars = Math.floor((width * height) / 6000);
    const starColors = ["#93c5fd", "#bfdbfe", "#60a5fa", "#ffffff"];
 
    for (let i = 0; i < numStars; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 1.2 + 0.3,
        alpha: Math.random(),
        twinkleSpeed:
          (Math.random() * 0.015 + 0.005) * (Math.random() < 0.5 ? 1 : -1),
        color: starColors[Math.floor(Math.random() * starColors.length)],
      });
    }
 
    const meteors: Meteor[] = [];
    const numMeteors = 28;
    const meteorPalettes = [
      { color: "#3b82f6", glow: "rgba(59, 130, 246, 0.8)" }, 
      { color: "#06b6d4", glow: "rgba(6, 182, 212, 0.8)" }, 
      { color: "#10b981", glow: "rgba(16, 185, 129, 0.8)" }, 
      { color: "#22c55e", glow: "rgba(34, 197, 94, 0.8)" }, 
      { color: "#6366f1", glow: "rgba(99, 102, 241, 0.8)" }, 
    ];
 
    const spawnMeteor = (initialSpawn = false): Meteor => {
      const palette =
        meteorPalettes[Math.floor(Math.random() * meteorPalettes.length)];
 
      const startX = initialSpawn
        ? Math.random() * width * 1.5 - width * 0.25
        : Math.random() * width * 1.8 - width * 0.5;
 
      const startY = initialSpawn
        ? Math.random() * height * 1.5 - height * 0.25
        : -(Math.random() * 300 + 100);
 
      return {
        x: startX,
        y: startY,
        length: Math.random() * 160 + 80,
        speed: Math.random() * 2.5 + 1.5,
        thickness: Math.random() * 1.5 + 1,
        color: palette.color,
        glowColor: palette.glow,
      };
    };
 
    for (let i = 0; i < numMeteors; i++) {
      meteors.push(spawnMeteor(true));
    }
 
    const angle = Math.PI / 4;
    const cosAngle = Math.cos(angle);
    const sinAngle = Math.sin(angle);
 
    const render = () => {
      ctx.clearRect(0, 0, width, height);
 
      const isDark = isDarkRef.current;
      currentSpeedMultiplier +=
        (targetSpeedMultiplier - currentSpeedMultiplier) * 0.05;
 
      const bgGradient = ctx.createRadialGradient(
        width * 0.65,
        height * 0.65,
        50,
        width * 0.65,
        height * 0.65,
        Math.max(width, height) * 0.8,
      );
 
      if (isDark) {
        bgGradient.addColorStop(0, "#1e3a8a");
        bgGradient.addColorStop(0.5, "#090d16");
        bgGradient.addColorStop(1, "#02040a");
      } else {
        bgGradient.addColorStop(0, "#8CC0EB");
        bgGradient.addColorStop(0.6, "#f1f5f9");
        bgGradient.addColorStop(1, "#f8fafc");
      }
 
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, width, height);
 
      stars.forEach((star) => {
        star.alpha += star.twinkleSpeed;
        if (star.alpha > 1 || star.alpha < 0.2) star.twinkleSpeed *= -1;
 
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fillStyle = isDark ? star.color : "#475569";
        ctx.globalAlpha = Math.max(0.1, Math.min(1, star.alpha));
        ctx.fill();
      });
      ctx.globalAlpha = 1.0;
 
      const speedBoost = (currentSpeedMultiplier - 1) / 0.5; 
 
      meteors.forEach((meteor, index) => {
        const tailX = meteor.x - cosAngle * meteor.length;
        const tailY = meteor.y - sinAngle * meteor.length;
 
        const trailGradient = ctx.createLinearGradient(
          meteor.x,
          meteor.y,
          tailX,
          tailY,
        );
        trailGradient.addColorStop(0, meteor.color);
        trailGradient.addColorStop(1, "transparent");
 
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(meteor.x, meteor.y);
        ctx.lineTo(tailX, tailY);
        ctx.strokeStyle = trailGradient;
        ctx.lineWidth = meteor.thickness + speedBoost * 0.5;
        ctx.lineCap = "round";
 
        ctx.shadowColor = meteor.glowColor;
        ctx.shadowBlur = 15 + speedBoost * 10;
 
        ctx.stroke();
        ctx.restore();
 
        meteor.x += cosAngle * meteor.speed * currentSpeedMultiplier;
        meteor.y += sinAngle * meteor.speed * currentSpeedMultiplier;
 
        if (tailX > width || tailY > height) {
          meteors[index] = spawnMeteor(false);
        }
      });
 
      animationFrameId = requestAnimationFrame(render);
    };
 
    render();
 
    const el = containerRef.current;
    el?.addEventListener("mouseenter", handleMouseEnter);
    el?.addEventListener("mouseleave", handleMouseLeave);
 
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      el?.removeEventListener("mouseenter", handleMouseEnter);
      el?.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);
 
  return (
    <main
      ref={containerRef}
      className="relative min-h-screen w-full overflow-hidden flex-1 flex flex-col items-center justify-center h-full"
    >
      <canvas
        ref={canvasRef}
        className="pointer-events-none absolute inset-0 -z-10 h-full w-full transition-opacity duration-700"
      />
    </main>
  );
}