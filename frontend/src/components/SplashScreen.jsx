import { useEffect, useState } from "react";

export default function SplashScreen({ onComplete }) {
  const [isSwiping, setIsSwiping] = useState(false);
  const [fontReady, setFontReady] = useState(false);

  useEffect(() => {
    document.fonts.ready.then(() => setFontReady(true));
  }, []);

  useEffect(() => {
    // Start swipe up after 2.5 seconds
    const swipeTimer = setTimeout(() => {
      setIsSwiping(true);
    }, 2500);

    // Completely remove the component after the swipe finishes (700ms transition)
    const removeTimer = setTimeout(() => {
      onComplete();
    }, 3200);

    return () => {
      clearTimeout(swipeTimer);
      clearTimeout(removeTimer);
    };
  }, [onComplete]);

  const letters = ["B", "U", "C", "K", "E", "T"];
  const delays = ["0ms", "150ms", "50ms", "250ms", "100ms", "200ms"];

  return (
    <div
      className={`fixed inset-0 z-[100] bg-cornflower flex flex-col items-center justify-center transition-transform duration-700 ease-in-out ${
        isSwiping ? "-translate-y-full" : "translate-y-0"
      }`}
    >
      <div className="flex overflow-visible">
        {letters.map((letter, i) => (
          <span
            key={i}
            className="text-white font-sniglet font-extrabold text-7xl md:text-9xl inline-block"
            // FIX: explicitly break down the shorthand to prevent the React warning
            style={{
              animationName: fontReady ? "dump" : "none",
              animationDuration: "0.8s",
              animationTimingFunction: "cubic-bezier(0.2, 0.8, 0.2, 1)",
              animationFillMode: "both",
              animationDelay: delays[i],
              opacity: fontReady ? 1 : 0,
              transition: "opacity 0.2s",
            }}
          >
            {letter}
          </span>
        ))}
      </div>

      <div className="absolute bottom-12 animate-fade-in-delayed">
        <p className="text-white/90 font-dmsans tracking-[0.2em] text-sm md:text-base uppercase font-semibold">
          Keep track of what you love
        </p>
      </div>
    </div>
  );
}
