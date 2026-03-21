"use client";

import React from "react";

interface LetterTileProps {
  letter: string;
  bgColor: string;
  textColor: string;
  fontFamily: string;
  rotation: number;
  fontSize: string;
  italic?: boolean;
  textureLines?: boolean;
  borderStyle?: string;
  paddingX?: string;
  paddingY?: string;
  translateY?: string;
  shadow?: boolean;
  striped?: boolean;
}

function LetterTile({
  letter,
  bgColor,
  textColor,
  fontFamily,
  rotation,
  fontSize,
  italic = false,
  textureLines = false,
  borderStyle,
  paddingX = "0.35em",
  paddingY = "0.15em",
  translateY = "0px",
  shadow = true,
  striped = false,
}: LetterTileProps) {
  const tileStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: bgColor,
    color: textColor,
    fontFamily,
    fontSize,
    fontStyle: italic ? "italic" : "normal",
    fontWeight: 900,
    transform: `rotate(${rotation}deg) translateY(${translateY})`,
    padding: `${paddingY} ${paddingX}`,
    lineHeight: 1,
    border: borderStyle || "none",
    boxShadow: shadow ? "3px 4px 10px rgba(0,0,0,0.7)" : undefined,
    position: "relative",
    zIndex: 1,
    userSelect: "none",
    letterSpacing: "-0.02em",
    minWidth: "1em",
    textAlign: "center",
  };

  return (
    <div style={tileStyle}>
      {textureLines && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "repeating-linear-gradient(0deg, transparent, transparent 4px, rgba(0,0,0,0.07) 4px, rgba(0,0,0,0.07) 5px)",
            pointerEvents: "none",
          }}
        />
      )}
      {striped && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(180,30,30,0.35) 4px, rgba(180,30,30,0.35) 8px)",
            pointerEvents: "none",
          }}
        />
      )}
      <span style={{ position: "relative", zIndex: 2 }}>{letter}</span>
    </div>
  );
}

const MURDER_LETTERS: LetterTileProps[] = [
  { letter: "M", bgColor: "#e8dfc8", textColor: "#1a1a1a", fontFamily: "'Playfair Display', serif", rotation: 3, fontSize: "clamp(1.4rem, 3.5vw, 2.8rem)", textureLines: true, paddingX: "0.3em", paddingY: "0.12em", translateY: "3px" },
  { letter: "u", bgColor: "#7a0000", textColor: "#f5e6c8", fontFamily: "'Lobster', cursive", rotation: -4, fontSize: "clamp(1.2rem, 3vw, 2.4rem)", paddingX: "0.35em", paddingY: "0.1em", translateY: "-4px", italic: true },
  { letter: "R", bgColor: "#2c2c2c", textColor: "#f0e0c0", fontFamily: "'Bebas Neue', sans-serif", rotation: -4, fontSize: "clamp(1.4rem, 3.5vw, 2.8rem)", paddingX: "0.3em", paddingY: "0.12em", translateY: "1px" },
  { letter: "D", bgColor: "#9ea8a0", textColor: "#1a1a1a", fontFamily: "'Abril Fatface', serif", rotation: 4, fontSize: "clamp(1.3rem, 3.2vw, 2.6rem)", textureLines: true, paddingX: "0.3em", paddingY: "0.1em", translateY: "-3px" },
  { letter: "E", bgColor: "#f0e8d0", textColor: "#7a0000", fontFamily: "'Oswald', sans-serif", rotation: -5, fontSize: "clamp(1.2rem, 3vw, 2.4rem)", paddingX: "0.3em", paddingY: "0.15em", translateY: "4px" },
  { letter: "R", bgColor: "#7a0000", textColor: "#f5e6c8", fontFamily: "'Alfa Slab One', serif", rotation: 4, fontSize: "clamp(1.4rem, 3.5vw, 2.8rem)", paddingX: "0.28em", paddingY: "0.1em", translateY: "-1px" },
];

const MYSTERY_LETTERS: LetterTileProps[] = [
  { letter: "M", bgColor: "#3a3530", textColor: "#f0e0c0", fontFamily: "'Special Elite', serif", rotation: 5, fontSize: "clamp(1.5rem, 3.8vw, 3.2rem)", textureLines: true, paddingX: "0.25em", paddingY: "0.1em", translateY: "3px" },
  { letter: "Y", bgColor: "#e8dfc8", textColor: "#1a1a1a", fontFamily: "'Playfair Display', serif", rotation: -3, fontSize: "clamp(1.3rem, 3.2vw, 2.7rem)", italic: true, paddingX: "0.3em", paddingY: "0.12em", translateY: "-3px" },
  { letter: "S", bgColor: "#7a0000", textColor: "#f5e6c8", fontFamily: "'Abril Fatface', serif", rotation: 5, fontSize: "clamp(1.3rem, 3.2vw, 2.7rem)", paddingX: "0.3em", paddingY: "0.1em", translateY: "2px", striped: true },
  { letter: "T", bgColor: "#f0e8d0", textColor: "#2c2c2c", fontFamily: "'Oswald', sans-serif", rotation: -6, fontSize: "clamp(1.4rem, 3.5vw, 2.8rem)", paddingX: "0.32em", paddingY: "0.12em", translateY: "-3px" },
  { letter: "E", bgColor: "#8a9a8c", textColor: "#1a1a1a", fontFamily: "'Bebas Neue', sans-serif", rotation: 4, fontSize: "clamp(1.3rem, 3.2vw, 2.6rem)", textureLines: true, paddingX: "0.3em", paddingY: "0.1em", translateY: "3px" },
  { letter: "R", bgColor: "#1a1a1a", textColor: "#7a0000", fontFamily: "'Alfa Slab One', serif", rotation: -5, fontSize: "clamp(1.4rem, 3.5vw, 2.8rem)", paddingX: "0.28em", paddingY: "0.1em", translateY: "-4px" },
  { letter: "Y", bgColor: "#e8dfc8", textColor: "#7a0000", fontFamily: "'Lobster', cursive", rotation: 6, fontSize: "clamp(1.2rem, 3vw, 2.4rem)", paddingX: "0.35em", paddingY: "0.1em", translateY: "2px" },
];

export function MurderMysteryLogo() {
  return (
    <div
      style={{
        display: "inline-flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "clamp(4px, 1vw, 10px)",
        padding: "clamp(12px, 2.5vw, 28px) clamp(16px, 3vw, 36px)",
        background: "transparent",
        borderRadius: "8px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "clamp(4px, 1vw, 10px)", flexWrap: "nowrap" }}>
        {MURDER_LETTERS.map((props, i) => (
          <LetterTile key={i} {...props} />
        ))}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "clamp(4px, 1vw, 10px)", flexWrap: "nowrap" }}>
        {MYSTERY_LETTERS.map((props, i) => (
          <LetterTile key={i} {...props} />
        ))}
      </div>
    </div>
  );
}
