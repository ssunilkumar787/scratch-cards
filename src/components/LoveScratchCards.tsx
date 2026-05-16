import React, { useState, useRef, useEffect, useCallback } from "react";

// ── Types ──────────────────────────────────────────────────────────────────────

interface Message {
  icon: string;
  text: string;
}

interface CardState {
  revealed: boolean;
  bursting: boolean;
}

interface ConfettiPiece {
  id: number;
  x: number;
  y: number;
  color: string;
  rotation: number;
  scale: number;
  vx: number;
  vy: number;
}

// ── Data ───────────────────────────────────────────────────────────────────────

const MESSAGES: Message[] = [
  { icon: "🌹", text: "Every single day with you feels like the best day of my life." },
  { icon: "✨", text: "You make the most ordinary moments feel like pure magic." },
  { icon: "🫶", text: "I fall in love with you a little more with every passing day." },
  { icon: "🌙", text: "You are my favourite person in this entire universe." },
  { icon: "☕", text: "Even on my hardest days, you are always my favourite part." },
  { icon: "🦋", text: "Loving you is the easiest and greatest thing I have ever done." },
  { icon: "🌊", text: "Your laugh is my absolute favourite sound in the whole world." },
  { icon: "🌸", text: "You are more beautiful to me today than the day we first met." },
  { icon: "🔥", text: "You light up every room you walk into — including my heart." },
  { icon: "🌿", text: "With you, I feel at home wherever we are in the world." },
  { icon: "💫", text: "I am endlessly grateful that the universe led me straight to you." },
  { icon: "🎶", text: "You are the song I want on repeat for the rest of my life." },
  { icon: "🍃", text: "The way you care for others makes me love you more each day." },
  { icon: "🌺", text: "Watching you exist is one of my greatest joys in life." },
  { icon: "⭐", text: "You are everything I did not know I was looking for." },
  { icon: "🕊️", text: "With you, I know what true peace and belonging feel like." },
  { icon: "🍓", text: "You are my adventure, my comfort, and my greatest love." },
  { icon: "🌅", text: "Waking up next to you is a gift I never take for granted." },
  { icon: "💎", text: "You are rare and precious — and entirely, wonderfully mine." },
  { icon: "🌻", text: "Your kindness and warmth are what I admire most about you." },
  { icon: "🎁", text: "Getting to be loved by you is the greatest privilege of my life." },
  { icon: "🌈", text: "You are the colour in every single chapter of my story." },
  { icon: "🕯️", text: "In my darkest moments, your love is always the light that guides me." },
  { icon: "🐚", text: "I want to grow old with you and love every moment of it." },
  { icon: "💌", text: "I choose you — today, tomorrow, and every day after that." },
];

const CONFETTI_COLORS = ["#c0435a", "#b8963e", "#e8a0b0", "#f5e9c8", "#8b3a4f", "#d4a0b0"];
const SCRATCH_RADIUS = 28;
const REVEAL_THRESHOLD = 0.45;

// ── ScratchCard Component ──────────────────────────────────────────────────────

interface ScratchCardProps {
  message: Message;
  index: number;
  onReveal: (index: number, x: number, y: number) => void;
}

const ScratchCard: React.FC<ScratchCardProps> = ({ message, index, onReveal }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDrawing = useRef(false);
  const isRevealed = useRef(false);
  const [revealed, setRevealed] = useState(false);

  const drawSilver = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const dpr = window.devicePixelRatio || 1;
    const w = container.clientWidth;
    const h = container.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);

    // Silver gradient
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, "#d4ceda");
    grad.addColorStop(0.3, "#c0bac8");
    grad.addColorStop(0.65, "#cdc8d5");
    grad.addColorStop(1, "#b8b2c0");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Shimmer lines
    ctx.strokeStyle = "rgba(255,255,255,0.18)";
    ctx.lineWidth = 1;
    for (let i = 0; i < w + h; i += 18) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(0, i);
      ctx.stroke();
    }

    // Hearts pattern
    ctx.font = "13px serif";
    ctx.fillStyle = "rgba(180,160,175,0.28)";
    for (let row = 0; row < h; row += 24) {
      for (let col = row % 48 === 0 ? 0 : 12; col < w; col += 24) {
        ctx.fillText("♥", col, row + 14);
      }
    }

    // Centre hint
    ctx.fillStyle = "rgba(100,85,108,0.6)";
    ctx.font = "300 12px 'Lato', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("scratch to reveal ♥", w / 2, h / 2 + 5);
    ctx.textAlign = "left";
  }, []);

  useEffect(() => {
    drawSilver();
  }, [drawSilver]);

  useEffect(() => {
    const handleResize = () => {
      if (!isRevealed.current) drawSilver();
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [drawSilver]);

  const getPos = (e: React.MouseEvent | React.TouchEvent): { x: number; y: number } => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    if ("touches" in e) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const scratchAt = (x: number, y: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.arc(x, y, SCRATCH_RADIUS, 0, Math.PI * 2);
    ctx.fill();
    checkReveal(canvas);
  };

  const checkReveal = (canvas: HTMLCanvasElement) => {
    if (isRevealed.current) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let transparent = 0;
    for (let i = 3; i < data.length; i += 4) {
      if (data[i] < 128) transparent++;
    }

    if (transparent / (data.length / 4) > REVEAL_THRESHOLD) {
      ctx.globalCompositeOperation = "destination-out";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      isRevealed.current = true;
      setRevealed(true);

      const rect = canvas.getBoundingClientRect();
      onReveal(index, rect.left + rect.width / 2, rect.top + rect.height / 2);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    isDrawing.current = true;
    const pos = getPos(e);
    scratchAt(pos.x, pos.y);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing.current) return;
    const pos = getPos(e);
    scratchAt(pos.x, pos.y);
  };

  const handleMouseUp = () => { isDrawing.current = false; };

  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    isDrawing.current = true;
    const pos = getPos(e);
    scratchAt(pos.x, pos.y);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawing.current) return;
    const pos = getPos(e);
    scratchAt(pos.x, pos.y);
  };

  const handleTouchEnd = () => { isDrawing.current = false; };

  return (
    <div style={styles.cardWrap}>
      <div style={styles.cardNumber}>
        No. {String(index + 1).padStart(2, "0")}
      </div>
      <div ref={containerRef} style={styles.scratchCard}>
        {/* Message layer */}
        <div style={styles.messageLayer}>
          <div style={styles.msgIcon}>{message.icon}</div>
          <p style={styles.msgText}>{message.text}</p>
          <span style={styles.msgBadge}>{index + 1} / 25</span>
        </div>

        {/* Scratch canvas */}
        <canvas
          ref={canvasRef}
          style={{
            ...styles.scratchCanvas,
            cursor: revealed ? "default" : "crosshair",
            pointerEvents: revealed ? "none" : "auto",
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        />
      </div>

      {/* Revealed pill */}
      <div style={{
        ...styles.revealedPill,
        opacity: revealed ? 1 : 0,
        transform: revealed ? "translateY(0)" : "translateY(4px)",
      }}>
        ✦ revealed
      </div>
    </div>
  );
};

// ── Confetti ───────────────────────────────────────────────────────────────────

const ConfettiLayer: React.FC<{ pieces: ConfettiPiece[] }> = ({ pieces }) => (
  <div style={styles.confettiLayer} aria-hidden="true">
    {pieces.map((p) => (
      <div
        key={p.id}
        style={{
          position: "fixed",
          left: p.x,
          top: p.y,
          width: 8,
          height: 8,
          borderRadius: 2,
          background: p.color,
          transform: `rotate(${p.rotation}deg) scale(${p.scale})`,
          pointerEvents: "none",
          animation: `confettiFall 1.3s ease-in forwards`,
        }}
      />
    ))}
  </div>
);

// ── Main App ───────────────────────────────────────────────────────────────────

export default function LoveScratchCards() {
  const [, setCardStates] = useState<CardState[]>(
    MESSAGES.map(() => ({ revealed: false, bursting: false }))
  );
  const [revealedCount, setRevealedCount] = useState(0);
  const [confetti, setConfetti] = useState<ConfettiPiece[]>([]);
  const [resetKey, setResetKey] = useState(0);
  const confettiId = useRef(0);

  const handleReveal = useCallback((index: number, x: number, y: number) => {
    setCardStates((prev) => {
      if (prev[index].revealed) return prev;
      const next = [...prev];
      next[index] = { ...next[index], revealed: true };
      return next;
    });
    setRevealedCount((c) => c + 1);

    // Spawn confetti
    const pieces: ConfettiPiece[] = Array.from({ length: 20 }, () => ({
      id: confettiId.current++,
      x: x + (Math.random() - 0.5) * 80,
      y: y + (Math.random() - 0.5) * 40,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      rotation: Math.random() * 360,
      scale: 0.6 + Math.random() * 0.8,
      vx: (Math.random() - 0.5) * 4,
      vy: -(2 + Math.random() * 3),
    }));
    setConfetti((prev) => [...prev, ...pieces]);
    setTimeout(() => {
      setConfetti((prev) => prev.filter((p) => !pieces.find((q) => q.id === p.id)));
    }, 1400);
  }, []);

  const handleReset = () => {
    setCardStates(MESSAGES.map(() => ({ revealed: false, bursting: false })));
    setRevealedCount(0);
    setConfetti([]);
    setResetKey((k) => k + 1);
  };

  const progress = (revealedCount / MESSAGES.length) * 100;
  const allRevealed = revealedCount === MESSAGES.length;

  return (
    <>
      <style>{globalStyles}</style>
      <div style={styles.page}>
        <ConfettiLayer pieces={confetti} />

        {/* Hero */}
        <header style={styles.hero}>
          <p style={styles.eyebrow}>A little something for you</p>
          <h1 style={styles.title}>
            25 reasons I love <em style={styles.titleEm}>you</em>
          </h1>
          <p style={styles.subtitle}>
            Scratch each card with your finger or mouse to reveal a hidden love note, just for you.
          </p>

          <div style={styles.divider}>
            <span style={styles.dividerLine} />
            <span style={styles.dividerHeart}>♥</span>
            <span style={styles.dividerLine} />
          </div>

          {/* Progress */}
          <div style={styles.progressWrap}>
            <p style={styles.progressLabel}>Cards revealed</p>
            <div style={styles.progressTrack}>
              <div style={{ ...styles.progressFill, width: `${progress}%` }} />
            </div>
            <p style={styles.progressCount}>
              {revealedCount} of {MESSAGES.length}
              {allRevealed && " 🎉"}
            </p>
          </div>

          {allRevealed && (
            <p style={styles.allRevealedMsg}>
              You found them all! Every single one is true. ♥
            </p>
          )}
        </header>

        {/* Cards grid */}
        <main style={styles.grid}>
          {MESSAGES.map((msg, i) => (
            <ScratchCard
              key={`${resetKey}-${i}`}
              message={msg}
              index={i}
              onReveal={handleReveal}
            />
          ))}
        </main>

        {/* Footer */}
        <footer style={styles.footer}>
          <button style={styles.resetBtn} onClick={handleReset}>
            ↺ &nbsp; Scratch again
          </button>
          <div style={styles.divider}>
            <span style={styles.dividerLine} />
            <span style={styles.dividerHeart}>SIREMI ♥</span>
            <span style={styles.dividerLine} />
          </div>
          <p style={styles.footerSig}>With all my heart, always &amp; forever.</p>
        </footer>
      </div>
    </>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Lato:wght@300;400;700&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    background: #fdf8f0;
    font-family: 'Lato', sans-serif;
  }

  @keyframes confettiFall {
    0%   { transform: translateY(0) rotate(0deg);   opacity: 1; }
    100% { transform: translateY(220px) rotate(720deg); opacity: 0; }
  }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }
`;

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#fdf8f0",
    backgroundImage: `
      radial-gradient(circle at 15% 15%, rgba(192,67,90,0.06) 0%, transparent 50%),
      radial-gradient(circle at 85% 85%, rgba(184,150,62,0.06) 0%, transparent 50%)
    `,
    overflowX: "hidden",
  },

  confettiLayer: {
    position: "fixed",
    inset: 0,
    pointerEvents: "none",
    zIndex: 999,
  },

  // Hero
  hero: {
    textAlign: "center",
    padding: "56px 24px 36px",
    maxWidth: 640,
    margin: "0 auto",
  },
  eyebrow: {
    fontFamily: "'Lato', sans-serif",
    fontWeight: 300,
    fontSize: 11,
    letterSpacing: "0.3em",
    textTransform: "uppercase",
    color: "#c0435a",
    marginBottom: 14,
  },
  title: {
    fontFamily: "'Playfair Display', serif",
    fontSize: "clamp(34px, 8vw, 58px)",
    fontWeight: 400,
    lineHeight: 1.1,
    color: "#2a1a1f",
    marginBottom: 16,
  },
  titleEm: {
    fontStyle: "italic",
    color: "#c0435a",
  },
  subtitle: {
    fontSize: 15,
    fontWeight: 300,
    color: "#7a5560",
    lineHeight: 1.7,
    maxWidth: 420,
    margin: "0 auto 24px",
  },

  // Divider
  divider: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    margin: "0 auto 20px",
    maxWidth: 200,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    background: "linear-gradient(to right, transparent, #f0c8d0, transparent)",
  },
  dividerHeart: {
    color: "#c0435a",
    fontSize: 18,
  },

  // Progress
  progressWrap: {
    maxWidth: 300,
    margin: "0 auto",
  },
  progressLabel: {
    fontSize: 11,
    color: "#b89aa0",
    letterSpacing: "0.12em",
    marginBottom: 6,
    textTransform: "uppercase",
  },
  progressTrack: {
    height: 3,
    background: "#f7dde2",
    borderRadius: 99,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    background: "linear-gradient(to right, #c0435a, #b8963e)",
    borderRadius: 99,
    transition: "width 0.5s ease",
  },
  progressCount: {
    fontSize: 12,
    color: "#b89aa0",
    marginTop: 5,
  },
  allRevealedMsg: {
    fontFamily: "'Playfair Display', serif",
    fontStyle: "italic",
    fontSize: 15,
    color: "#c0435a",
    marginTop: 16,
    animation: "fadeUp 0.6s ease forwards",
  },

  // Grid
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
    gap: 20,
    maxWidth: 980,
    margin: "0 auto",
    padding: "0 16px 56px",
  },

  // Card
  cardWrap: {
    display: "flex",
    flexDirection: "column",
    alignItems: "stretch",
    gap: 6,
  },
  cardNumber: {
    fontSize: 10,
    letterSpacing: "0.2em",
    color: "#b89aa0",
    fontWeight: 300,
    textTransform: "uppercase",
    paddingLeft: 2,
  },
  scratchCard: {
    position: "relative",
    width: "100%",
    aspectRatio: "14 / 9",
    borderRadius: 14,
    overflow: "hidden",
    boxShadow: "0 2px 20px rgba(42,26,31,0.08), 0 0 0 1px rgba(192,67,90,0.1)",
  },
  messageLayer: {
    position: "absolute",
    inset: 0,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    padding: 18,
    background: "linear-gradient(135deg, #fff8f9 0%, #fff5f0 100%)",
  },
  msgIcon: {
    fontSize: 26,
    marginBottom: 8,
    lineHeight: 1,
  },
  msgText: {
    fontFamily: "'Playfair Display', serif",
    fontStyle: "italic",
    fontSize: 13,
    lineHeight: 1.55,
    color: "#2a1a1f",
  },
  msgBadge: {
    position: "absolute",
    bottom: 8,
    right: 10,
    fontSize: 10,
    color: "#c0435a",
    opacity: 0.6,
    fontWeight: 300,
  } as React.CSSProperties,
  scratchCanvas: {
    position: "absolute",
    inset: 0,
    touchAction: "none",
    display: "block",
  },
  revealedPill: {
    fontSize: 10,
    letterSpacing: "0.12em",
    color: "#c0435a",
    fontWeight: 400,
    textTransform: "uppercase",
    height: 14,
    transition: "opacity 0.4s ease, transform 0.4s ease",
    paddingLeft: 2,
  },

  // Footer
  footer: {
    textAlign: "center",
    padding: "0 24px 64px",
  },
  resetBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    border: "1px solid #f7dde2",
    background: "white",
    color: "#c0435a",
    fontFamily: "'Lato', sans-serif",
    fontSize: 13,
    letterSpacing: "0.08em",
    padding: "12px 28px",
    borderRadius: 99,
    cursor: "pointer",
    marginBottom: 28,
    transition: "all 0.2s",
  },
  footerSig: {
    fontFamily: "'Playfair Display', serif",
    fontStyle: "italic",
    fontSize: 15,
    color: "#7a5560",
    marginTop: 16,
  },
};
