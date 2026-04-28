import { useState, useEffect } from "react";

const darkenColor = (hex, percent) => {
  let color = hex.startsWith("#") ? hex.slice(1) : hex;
  if (color.length === 3) {
    color = color
      .split("")
      .map((c) => c + c)
      .join("");
  }
  const num = parseInt(color, 16);
  let r = (num >> 16) & 0xff;
  let g = (num >> 8) & 0xff;
  let b = num & 0xff;
  r = Math.max(0, Math.min(255, Math.floor(r * (1 - percent))));
  g = Math.max(0, Math.min(255, Math.floor(g * (1 - percent))));
  b = Math.max(0, Math.min(255, Math.floor(b * (1 - percent))));
  return (
    "#" +
    ((1 << 24) + (r << 16) + (g << 8) + b)
      .toString(16)
      .padStart(6, "0")
      .toUpperCase()
  );
};

/**
 * Folder — natively 200×160px.
 * Papers carry content passed via `items`. Max 3 items.
 * At this size, content inside papers is legible without any scaling tricks.
 */
const Folder = ({
  color = "#5227FF",
  size = 1,
  items = [],
  className = "",
  isOpen,
  onToggle,
}) => {
  const maxItems = 3;
  const papers = items.slice(0, maxItems);

  const [open, setOpen] = useState(isOpen || false);
  const [paperOffsets, setPaperOffsets] = useState(
    Array.from({ length: maxItems }, () => ({ x: 0, y: 0 })),
  );

  useEffect(() => {
    if (isOpen !== undefined && isOpen !== open) {
      setOpen(isOpen);
      if (!isOpen)
        setPaperOffsets(
          Array.from({ length: maxItems }, () => ({ x: 0, y: 0 })),
        );
    }
  }, [isOpen, open]);

  // Changed to match the exact color instead of darkening, preventing the "transparent" illusion
  const folderBackColor = color;
  const paperColors = [
    darkenColor("#ffffff", 0.08),
    darkenColor("#ffffff", 0.04),
    "#ffffff",
  ];

  const handleClick = (e) => {
    if (e) e.stopPropagation();
    const newState = !open;
    if (isOpen === undefined) {
      setOpen(newState);
      if (!newState)
        setPaperOffsets(
          Array.from({ length: maxItems }, () => ({ x: 0, y: 0 })),
        );
    }
    if (onToggle) onToggle(newState);
  };

  const handlePaperMouseMove = (e, index) => {
    if (!open) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const offsetX = (e.clientX - (rect.left + rect.width / 2)) * 0.12;
    const offsetY = (e.clientY - (rect.top + rect.height / 2)) * 0.12;
    setPaperOffsets((prev) => {
      const next = [...prev];
      next[index] = { x: offsetX, y: offsetY };
      return next;
    });
  };

  const handlePaperMouseLeave = (_, index) => {
    if (!open) return;
    setPaperOffsets((prev) => {
      const next = [...prev];
      next[index] = { x: 0, y: 0 };
      return next;
    });
  };

  // Fan positions when open — papers spread above the folder at native size
  const openTransforms = [
    "translate(-115%, -58%) rotate(-16deg)",
    "translate(-50%,  -80%) rotate(3deg)",
    "translate(  15%, -56%) rotate(17deg)",
  ];

  const W = 200;
  const H = 160;

  return (
    <div
      style={{
        transform: `scale(${size})`,
        transformOrigin: "center bottom",
        overflow: "visible",
        display: "inline-block",
      }}
      className={className}
    >
      <div
        className={`group relative cursor-pointer transition-all duration-300 ease-out ${
          !open ? "hover:-translate-y-2" : ""
        }`}
        style={{
          width: W,
          height: H,
          overflow: "visible",
          transform: open ? "translateY(-12px)" : undefined,
        }}
        onClick={handleClick}
      >
        {/* Back body */}
        <div
          className="absolute bottom-0 left-0 right-0"
          style={{
            height: H,
            backgroundColor: folderBackColor,
            borderRadius: "0 16px 16px 16px",
            overflow: "visible",
          }}
        >
          {/* Tab */}
          <span
            className="absolute"
            style={{
              bottom: "100%",
              left: 0,
              width: 60,
              height: 18,
              backgroundColor: folderBackColor,
              borderRadius: "8px 8px 0 0",
            }}
          />

          {/* Papers */}
          {papers.map((item, i) => {
            const pw = [0.62, 0.72, 0.82][i] * W;
            const ph = [0.64, 0.6, 0.56][i] * H;

            const baseStyle = {
              position: "absolute",
              bottom: "8%",
              left: "50%",
              width: pw,
              height: ph,
              backgroundColor: paperColors[i],
              borderRadius: 12,
              transition: "all 0.38s cubic-bezier(0.34,1.3,0.64,1)",
              overflow: "visible",
              zIndex: open ? 40 : 20,
            };

            const openOffset = `translate(${paperOffsets[i].x}px, ${paperOffsets[i].y}px)`;

            const inlineTransform = open
              ? {
                  transform: `${openTransforms[i]} ${openOffset}`,
                  boxShadow: "0 10px 32px rgba(0,0,0,0.14)",
                  cursor: item ? "pointer" : "default",
                }
              : {};

            let hoverClasses = "";
            if (!open) {
              // Stacking papers vertically on hover to make them easily countable
              if (i === 0)
                hoverClasses =
                  "transform -translate-x-1/2 translate-y-[10%] group-hover:-translate-x-1/2 group-hover:-translate-y-[25%] group-hover:rotate-0";
              if (i === 1)
                hoverClasses =
                  "transform -translate-x-1/2 translate-y-[5%] group-hover:-translate-x-1/2 group-hover:-translate-y-[50%] group-hover:rotate-0";
              if (i === 2)
                hoverClasses =
                  "transform -translate-x-1/2 translate-y-[0%] group-hover:-translate-x-1/2 group-hover:-translate-y-[75%] group-hover:rotate-0";
            }

            return (
              <div
                key={i}
                className={hoverClasses}
                style={{ ...baseStyle, ...inlineTransform }}
                onMouseMove={(e) => handlePaperMouseMove(e, i)}
                onMouseLeave={(e) => handlePaperMouseLeave(e, i)}
              >
                {/* Inner clip so content stays within paper shape */}
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    overflow: "hidden",
                    borderRadius: 12,
                  }}
                >
                  {item}
                </div>
              </div>
            );
          })}

          {/* Front flap (opens a bit more on hover now) */}
          <div
            className={`absolute inset-0 origin-bottom transition-all duration-300 ease-in-out ${
              !open
                ? "z-30 group-hover:[transform:skew(-10deg)_scaleY(0.82)]"
                : "z-[25]"
            }`}
            style={{
              backgroundColor: color,
              borderRadius: "0 16px 16px 16px",
              ...(open && { transform: "skew(-15deg) scaleY(0.55)" }),
            }}
          />

          {/* Gloss */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              borderRadius: "0 16px 16px 16px",
              background:
                "linear-gradient(155deg, rgba(255,255,255,0.2) 0%, transparent 50%)",
              zIndex: 31,
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default Folder;
