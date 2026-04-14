import { useEffect, useState } from "react";

export default function SplashScreen({ onComplete }) {
  const [isSwiping, setIsSwiping] = useState(false);

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

  // Lowercase as requested
  const letters = ["B", "U", "C", "K", "E", "T"];

  // Chaotic, staggered delays to make it look "dumped" rather than perfectly typed
  const delays = ["0ms", "150ms", "50ms", "250ms", "100ms", "200ms"];

  return (
    <div
      className={`fixed inset-0 z-[100] bg-cornflower flex flex-col items-center justify-center transition-transform duration-700 ease-in-out ${
        isSwiping ? "-translate-y-full" : "translate-y-0"
      }`}
    >
      {/* The Logo Letters */}
      <div className="flex overflow-visible">
        {letters.map((letter, i) => (
          <span
            key={i}
            className="text-white font-sniglet font-extrabold text-7xl md:text-9xl animate-dump inline-block"
            style={{ animationDelay: delays[i] }}
          >
            {letter}
          </span>
        ))}
      </div>

      {/* The Tagline */}
      <div className="absolute bottom-12 animate-fade-in-delayed">
        <p className="text-white/90 font-dmsans tracking-[0.2em] text-sm md:text-base uppercase font-semibold">
          Keep track of what you love
        </p>
      </div>
    </div>
  );
}
