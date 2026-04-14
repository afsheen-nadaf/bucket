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

const Folder = ({
  color = "#5227FF",
  size = 1,
  items = [],
  className = "",
  isOpen,
  onToggle,
}) => {
  const maxItems = 3;
  // Only use real items — no placeholder padding
  const papers = items.slice(0, maxItems);

  const [open, setOpen] = useState(isOpen || false);
  const [paperOffsets, setPaperOffsets] = useState(
    Array.from({ length: maxItems }, () => ({ x: 0, y: 0 })),
  );

  useEffect(() => {
    if (isOpen !== undefined && isOpen !== open) {
      setOpen(isOpen);
      if (!isOpen) {
        setPaperOffsets(
          Array.from({ length: maxItems }, () => ({ x: 0, y: 0 })),
        );
      }
    }
  }, [isOpen, open]);

  const folderBackColor = darkenColor(color, 0.08);
  const paper1 = darkenColor("#ffffff", 0.1);
  const paper2 = darkenColor("#ffffff", 0.05);
  const paper3 = "#ffffff";

  const handleClick = () => {
    const newState = !open;
    if (isOpen === undefined) {
      setOpen(newState);
      if (!newState) {
        setPaperOffsets(
          Array.from({ length: maxItems }, () => ({ x: 0, y: 0 })),
        );
      }
    }
    if (onToggle) onToggle(newState);
  };

  const handlePaperMouseMove = (e, index) => {
    if (!open) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const offsetX = (e.clientX - centerX) * 0.15;
    const offsetY = (e.clientY - centerY) * 0.15;
    setPaperOffsets((prev) => {
      const newOffsets = [...prev];
      newOffsets[index] = { x: offsetX, y: offsetY };
      return newOffsets;
    });
  };

  const handlePaperMouseLeave = (e, index) => {
    setPaperOffsets((prev) => {
      const newOffsets = [...prev];
      newOffsets[index] = { x: 0, y: 0 };
      return newOffsets;
    });
  };

  const folderStyle = {
    "--folder-color": color,
    "--folder-back-color": folderBackColor,
    "--paper-1": paper1,
    "--paper-2": paper2,
    "--paper-3": paper3,
  };

  const scaleStyle = {
    transform: `scale(${size})`,
    transformOrigin: "center bottom",
  };

  // Tweaked transforms to account for the smaller paper sizes
  const getOpenTransform = (index) => {
    if (index === 0) return "translate(-110%, -65%) rotate(-15deg)";
    if (index === 1) return "translate(10%, -65%) rotate(15deg)";
    if (index === 2) return "translate(-50%, -95%) rotate(5deg)";
    return "";
  };

  return (
    <div style={scaleStyle} className={className}>
      <div
        className={`group relative transition-all duration-200 ease-in cursor-pointer ${
          !open ? "hover:-translate-y-2" : ""
        }`}
        style={{
          ...folderStyle,
          transform: open ? "translateY(-8px)" : undefined,
        }}
        onClick={handleClick}
      >
        <div
          className="relative w-[100px] h-[80px] rounded-tl-0 rounded-tr-[10px] rounded-br-[10px] rounded-bl-[10px]"
          style={{ backgroundColor: folderBackColor }}
        >
          <span
            className="absolute z-0 bottom-[98%] left-0 w-[30px] h-[10px] rounded-tl-[5px] rounded-tr-[5px] rounded-bl-0 rounded-br-0"
            style={{ backgroundColor: folderBackColor }}
          ></span>

          {/* Folder flaps — step back when open so papers are clickable */}
          <div
            className={`absolute w-full h-full origin-bottom transition-all duration-300 ease-in-out ${
              !open
                ? "z-30 group-hover:[transform:skew(15deg)_scaleY(0.6)]"
                : "z-20"
            }`}
            style={{
              backgroundColor: color,
              borderRadius: "5px 10px 10px 10px",
              ...(open && { transform: "skew(15deg) scaleY(0.6)" }),
            }}
          ></div>
          <div
            className={`absolute w-full h-full origin-bottom transition-all duration-300 ease-in-out ${
              !open
                ? "z-30 group-hover:[transform:skew(-15deg)_scaleY(0.6)]"
                : "z-20"
            }`}
            style={{
              backgroundColor: color,
              borderRadius: "5px 10px 10px 10px",
              ...(open && { transform: "skew(-15deg) scaleY(0.6)" }),
            }}
          ></div>

          {/* Papers — sizes reduced (from 70-90% to 60-80%) to fit nicely inside the folder */}
          {papers.map((item, i) => {
            let sizeClasses = "";
            if (i === 0)
              sizeClasses = open ? "w-[60%] h-[70%]" : "w-[60%] h-[70%]";
            if (i === 1)
              sizeClasses = open ? "w-[70%] h-[70%]" : "w-[70%] h-[60%]";
            if (i === 2)
              sizeClasses = open ? "w-[80%] h-[70%]" : "w-[80%] h-[50%]";

            const transformStyle = open
              ? `${getOpenTransform(i)} translate(${paperOffsets[i].x}px, ${paperOffsets[i].y}px)`
              : undefined;

            return (
              <div
                key={i}
                onMouseMove={(e) => handlePaperMouseMove(e, i)}
                onMouseLeave={(e) => handlePaperMouseLeave(e, i)}
                className={`absolute bottom-[10%] left-1/2 transition-all duration-300 ease-in-out overflow-hidden ${
                  open
                    ? "z-40 hover:scale-110"
                    : "z-20 transform -translate-x-1/2 translate-y-[10%] group-hover:translate-y-0"
                } ${sizeClasses}`}
                style={{
                  ...(!open ? {} : { transform: transformStyle }),
                  backgroundColor: i === 0 ? paper1 : i === 1 ? paper2 : paper3,
                  borderRadius: "10px",
                  cursor: item ? "pointer" : "default",
                }}
              >
                {item}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Folder;
