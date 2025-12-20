import React from "react";

interface GradientTextProps {
  children: React.ReactNode;
  className?: string;
  colors?: string[];
  animationSpeed?: number;
  showBorder?: boolean;
}

export default function GradientText({
  children,
  className = "",
  colors = ["#40ffaa", "#4079ff", "#40ffaa", "#4079ff", "#40ffaa"],
  animationSpeed = 8,
  showBorder = false,
}: GradientTextProps) {
  const gradientStyle = {
    backgroundImage: `linear-gradient(to right, ${colors.join(", ")})`,
    "--animation-speed": `${animationSpeed}s`,
  } as React.CSSProperties;

  return (
    <div className={`relative flex max-w-fit items-center justify-center rounded-[1.25rem] font-medium ${className}`}>
      {/* Optional Border Glow */}
      {showBorder && (
        <div
          className="absolute inset-0 bg-cover z-0 pointer-events-none animate-gradient-text blur-sm"
          style={{ ...gradientStyle, opacity: 0.5 }}
        ></div>
      )}
      
      {/* The Text Itself */}
      <span
        className="z-10 bg-clip-text text-transparent animate-gradient-text"
        style={gradientStyle}
      >
        {children}
      </span>
    </div>
  );
}