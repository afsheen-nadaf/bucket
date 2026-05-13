import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { Plus, X, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import Folder from "../components/Folder";

const CATEGORY_FOLDERS = [
  { id: "Movies", label: "MOVIES & TV", color: "#F0607E" },
  { id: "Books", label: "BOOKS", color: "#F5A623" },
  { id: "Music", label: "MUSIC", color: "#A855F7" },
  { id: "Places", label: "PLACES", color: "#72B30E" },
];

const glassStyle = {
  background: "rgba(255,255,255,0.72)",
  backdropFilter: "blur(32px) saturate(200%)",
  border: "1.5px solid rgba(255,255,255,0.9)",
  boxShadow:
    "0 12px 48px rgba(80,100,200,0.18), 0 2px 8px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.98)",
};

function CarouselItem({
  index,
  trackItemOffset,
  x,
  centerOffset,
  onClick,
  children,
}) {
  const itemScreenX = useTransform(x, (v) => v + index * trackItemOffset);
  const distanceFromCenter = useTransform(
    itemScreenX,
    (pos) => pos - centerOffset,
  );
  const rotateY = useTransform(
    distanceFromCenter,
    [-trackItemOffset * 1.5, 0, trackItemOffset * 1.5],
    [50, 0, -50],
  );
  const scale = useTransform(
    distanceFromCenter,
    [-trackItemOffset * 2, 0, trackItemOffset * 2],
    [0.6, 1, 0.6],
  );
  const opacity = useTransform(
    distanceFromCenter,
    [-trackItemOffset * 2, 0, trackItemOffset * 2],
    [0.1, 1, 0.1],
  );

  return (
    <div
      style={{ perspective: 1200, width: 320, height: 280 }}
      className="shrink-0 flex items-end justify-center"
      onClick={onClick}
    >
      <motion.div
        style={{ rotateY, scale, opacity, zIndex: 20 }}
        className="w-full flex items-center justify-center origin-bottom cursor-pointer pb-2"
      >
        {children}
      </motion.div>
    </div>
  );
}

export default function Lists() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Movies");
  const [description, setDescription] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [is_public, setIsPublic] = useState(false);
  const [activeCategory, setActiveCategory] = useState(null);
  const [focusedIdx, setFocusedIdx] = useState(0);
  const wrapperRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    const handleResize = () => {
      if (wrapperRef.current)
        setContainerWidth(wrapperRef.current.getBoundingClientRect().width);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [loading]);

  useEffect(() => {
    if (user?.id) fetchLists();
  }, [user?.id]);

  const fetchLists = async () => {
    const { data, error } = await supabase
      .from("lists")
      .select("*")
      .eq("user_id", user?.id)
      .order("created_at", { ascending: false });
    if (!error) setLists(data || []);
    setLoading(false);
  };

  const createList = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    const { data, error } = await supabase
      .from("lists")
      .insert([{ user_id: user.id, title, category, description, is_public }])
      .select();
    if (!error && data) {
      setLists([data[0], ...lists]);
      setTitle("");
      setDescription("");
      setIsPublic(false);
      setIsCreateOpen(false);
      setActiveCategory(category);
    }
  };

  const groupedLists = {
    Movies: lists.filter((l) => l.category === "Movies"),
    Books: lists.filter((l) => l.category === "Books"),
    Music: lists.filter((l) => l.category === "Music"),
    Places: lists.filter((l) => l.category === "Places"),
  };

  const focusedCat = CATEGORY_FOLDERS[focusedIdx];
  const activeFolderObj = CATEGORY_FOLDERS.find((c) => c.id === activeCategory);
  const trackItemOffset = 320;
  const centerOffset = containerWidth > 0 ? containerWidth / 2 - 160 : 0;
  const x = useMotionValue(0);

  useEffect(() => {
    if (loading || containerWidth === 0) return;
    const targetX = centerOffset - focusedIdx * trackItemOffset;
    if (x.get() === 0) x.set(targetX);
    const controls = animate(x, targetX, {
      type: "spring",
      stiffness: 300,
      damping: 30,
    });
    return controls.stop;
  }, [focusedIdx, centerOffset, trackItemOffset, loading, containerWidth, x]);

  return (
    <div className="relative lowercase w-full h-screen flex flex-col overflow-hidden font-poppins selection:bg-blue-200">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800;900&display=swap');
        @keyframes overlayIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp   { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fabPop    { 0% { transform: scale(0.7); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
        ${isCreateOpen || activeCategory ? `nav, header, .navbar { display: none !important; }` : ""}
      `}</style>

      <div
        className="fixed inset-0 pointer-events-none z-0 transition-all duration-700"
        style={{
          background: `radial-gradient(ellipse at 50% 65%, ${focusedCat.color}25 0%, transparent 60%)`,
        }}
      />

      {loading ? (
        <div
          className="flex-1 flex flex-col items-center justify-center relative z-10"
          style={{ color: "rgba(26,26,46,0.4)" }}
        >
          <div
            className="w-8 h-8 rounded-full border-2 animate-spin"
            style={{
              borderColor: "rgba(100,149,237,0.2)",
              borderTopColor: "#6495ed",
            }}
          />
          <span className="text-sm font-bold uppercase">
            loading folders...
          </span>
        </div>
      ) : (
        <div
          ref={wrapperRef}
          className="flex-1 flex flex-col items-center justify-center pb-4 relative z-10 w-full overflow-hidden transition-opacity duration-300"
          style={{
            opacity: activeCategory ? 0 : containerWidth > 0 ? 1 : 0,
            pointerEvents: activeCategory ? "none" : "auto",
            marginTop: "-4vh",
          }}
        >
          <div className="w-full h-[280px] flex items-center relative">
            {/* NEW: Left Arrow */}
            <button
              onClick={() => setFocusedIdx(Math.max(0, focusedIdx - 1))}
              className={`absolute left-2 sm:left-4 md:left-8 z-30 p-2 sm:p-2.5 md:p-3 rounded-full bg-white/40 hover:bg-white/70 backdrop-blur-md transition-all duration-300 border border-white/50 shadow-sm ${
                focusedIdx === 0
                  ? "opacity-0 pointer-events-none"
                  : "opacity-100"
              }`}
              style={{ color: focusedCat.color }}
            >
              <ChevronLeft size={28} strokeWidth={2.5} />
            </button>

            <motion.div
              drag="x"
              dragConstraints={{
                left:
                  centerOffset -
                  (CATEGORY_FOLDERS.length - 1) * trackItemOffset,
                right: centerOffset,
              }}
              onDragEnd={(e, { offset, velocity }) => {
                const direction =
                  offset.x < -40 || velocity.x < -400
                    ? 1
                    : offset.x > 40 || velocity.x > 400
                      ? -1
                      : 0;
                if (direction !== 0)
                  setFocusedIdx((prev) =>
                    Math.max(
                      0,
                      Math.min(prev + direction, CATEGORY_FOLDERS.length - 1),
                    ),
                  );
                else
                  animate(x, centerOffset - focusedIdx * trackItemOffset, {
                    type: "spring",
                    stiffness: 300,
                    damping: 30,
                  });
              }}
              style={{ x, display: "flex" }}
              className="cursor-grab active:cursor-grabbing items-end h-full w-full"
            >
              {CATEGORY_FOLDERS.map((cat, catIdx) => {
                const catLists = groupedLists[cat.id] || [];
                const isFocused = focusedIdx === catIdx;
                const folderItems =
                  catLists.length === 0
                    ? []
                    : [
                        ...catLists.slice(0, 2).map((l) => (
                          <div
                            key={l.id}
                            onClick={(e) => {
                              if (!isFocused) return;
                              e.stopPropagation();
                              navigate(`/lists/${l.id}`);
                            }}
                            onPointerDownCapture={(e) => e.stopPropagation()}
                            className="w-full h-full flex flex-col justify-center p-3 hover:bg-slate-50 transition-colors"
                            style={{ background: "rgba(255,255,255,1)" }}
                          >
                            <span
                              style={{
                                fontSize: 8,
                                fontWeight: 800,
                                color: cat.color,
                                textTransform: "uppercase",
                              }}
                            >
                              {cat.label}
                            </span>
                            <span
                              style={{
                                fontSize: 11,
                                fontWeight: 700,
                                color: "#1a1a2e",
                                lineHeight: 1.35,
                                display: "-webkit-box",
                                WebkitLineClamp: 3,
                                WebkitBoxOrient: "vertical",
                                overflow: "hidden",
                              }}
                            >
                              {l.title}
                            </span>
                          </div>
                        )),
                        ...(catLists.length > 2
                          ? [
                              <div
                                key="more"
                                onClick={(e) => {
                                  if (!isFocused) return;
                                  e.stopPropagation();
                                  setActiveCategory(cat.id);
                                }}
                                onPointerDownCapture={(e) =>
                                  e.stopPropagation()
                                }
                                className="w-full h-full flex flex-col items-center justify-center hover:bg-slate-50 transition-colors"
                                style={{ background: "rgba(255,255,255,1)" }}
                              >
                                <span
                                  style={{
                                    fontSize: 12,
                                    fontWeight: 800,
                                    color: cat.color,
                                    letterSpacing: "0.05em",
                                  }}
                                >
                                  <span style={{ fontSize: 10 }}>+</span>
                                  {catLists.length - 2} MORE
                                </span>
                              </div>,
                            ]
                          : []),
                      ];
                return (
                  <CarouselItem
                    key={cat.id}
                    index={catIdx}
                    trackItemOffset={trackItemOffset}
                    x={x}
                    centerOffset={centerOffset}
                    onClick={() =>
                      isFocused
                        ? setActiveCategory(cat.id)
                        : setFocusedIdx(catIdx)
                    }
                  >
                    <div
                      style={{
                        filter: `drop-shadow(0 10px 36px ${cat.color}80) drop-shadow(0 2px 8px rgba(0,0,0,0.22))`,
                      }}
                    >
                      <Folder
                        color={cat.color}
                        size={1.6}
                        items={folderItems}
                        isOpen={isFocused ? undefined : false}
                      />
                    </div>
                  </CarouselItem>
                );
              })}
            </motion.div>

            {/* NEW: Right Arrow */}
            <button
              onClick={() =>
                setFocusedIdx(
                  Math.min(CATEGORY_FOLDERS.length - 1, focusedIdx + 1),
                )
              }
              className={`absolute right-2 sm:right-4 md:right-8 z-30 p-2 sm:p-2.5 md:p-3 rounded-full bg-white/40 hover:bg-white/70 backdrop-blur-md transition-all duration-300 border border-white/50 shadow-sm ${
                focusedIdx === CATEGORY_FOLDERS.length - 1
                  ? "opacity-0 pointer-events-none"
                  : "opacity-100"
              }`}
              style={{ color: focusedCat.color }}
            >
              <ChevronRight size={28} strokeWidth={2.5} />
            </button>
          </div>

          <div className="flex flex-col items-center gap-4 mt-2 z-20">
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: `${focusedCat.color}cc`,
                letterSpacing: "0.1em",
              }}
            >
              {(groupedLists[focusedCat.id] || []).length} LIST
              {(groupedLists[focusedCat.id] || []).length !== 1 ? "S" : ""}
            </span>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setActiveCategory(focusedCat.id)}
                className="flex items-center gap-2 px-8 py-3 rounded-full transition-all hover:scale-105 active:scale-95 font-extrabold text-sm"
                style={{
                  background: `${focusedCat.color}20`,
                  border: `2px solid ${focusedCat.color}`,
                  color: focusedCat.color,
                  fontWeight: 800,
                }}
              >
                OPEN {focusedCat.label} <ArrowRight size={14} strokeWidth={3} />
              </button>
              <button
                onClick={() => {
                  setCategory(focusedCat.id);
                  setIsCreateOpen(true);
                }}
                className="flex items-center justify-center w-11 h-11 rounded-full transition-all hover:scale-110 active:scale-95"
                style={{
                  background: focusedCat.color,
                  color: "#fff",
                  boxShadow: `0 8px 24px ${focusedCat.color}60`,
                }}
              >
                <Plus size={16} strokeWidth={3.5} />
              </button>
            </div>
          </div>
        </div>
      )}

      {!loading && !activeCategory && (
        <div className="absolute bottom-6 left-0 right-0 z-20 flex items-center justify-center">
          <div className="flex items-center gap-3">
            {CATEGORY_FOLDERS.map((cat, i) => (
              <button
                key={cat.id}
                onClick={() => setFocusedIdx(i)}
                style={{
                  width: focusedIdx === i ? 28 : 8,
                  height: 8,
                  borderRadius: 99,
                  background:
                    focusedIdx === i ? cat.color : "rgba(26,26,46,0.15)",
                  transition: "all 0.35s cubic-bezier(0.34,1.56,0.64,1)",
                }}
              />
            ))}
          </div>
        </div>
      )}

      {isCreateOpen && (
        <div
          className="fixed inset-0 z-[999999] flex items-center justify-center p-4"
          style={{
            background: "rgba(255,255,255,0.15)",
            backdropFilter: "blur(24px) saturate(180%)",
            animation: "overlayIn 0.2s ease both",
          }}
          onClick={() => setIsCreateOpen(false)}
        >
          <div
            className="w-full max-w-md p-8 rounded-[2rem] relative"
            style={{ ...glassStyle, animation: "slideUp 0.25s ease both" }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setIsCreateOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-600"
            >
              <X size={16} strokeWidth={2.5} />
            </button>
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              new list
            </h2>
            <form onSubmit={createList} className="flex flex-col gap-4">
              <input
                type="text"
                placeholder="list title"
                required
                className="px-4 py-3 rounded-xl border border-slate-200 outline-none"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <div className="flex gap-2 flex-wrap">
                {CATEGORY_FOLDERS.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${category === cat.id ? "text-white" : ""}`}
                    style={{
                      background:
                        category === cat.id ? cat.color : `${cat.color}15`,
                      color: category === cat.id ? "white" : cat.color,
                    }}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
              <textarea
                placeholder="description"
                rows="3"
                className="px-4 py-3 rounded-xl border border-slate-200 outline-none"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={is_public}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  id="public-toggle-create"
                  className="w-4 h-4 rounded cursor-pointer"
                />
                <label
                  htmlFor="public-toggle-create"
                  className="text-xs font-bold cursor-pointer"
                  style={{ color: "rgba(26,26,46,0.6)" }}
                >
                  make this list public
                </label>
              </div>
              <button
                type="submit"
                className="w-full font-bold py-4 rounded-xl text-white shadow-xl flex items-center justify-center gap-2  text-sm"
                style={{
                  background:
                    "linear-gradient(135deg, #6495ed 0%, #8b6cf7 100%)",
                }}
              >
                create list
              </button>
            </form>
          </div>
        </div>
      )}

      {activeCategory && activeFolderObj && (
        <div
          className="fixed inset-0 flex flex-col z-[99999]"
          style={{ animation: "overlayIn 0.2s ease both" }}
        >
          <div
            className="absolute inset-0"
            style={{
              background: "rgba(200,210,240,0.55)",
              backdropFilter: "blur(24px) saturate(180%)",
            }}
            onClick={() => setActiveCategory(null)}
          />
          <div
            className="relative z-10 w-full max-w-5xl mx-auto flex flex-col h-full px-6 md:px-12 py-10 md:py-14 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-10 pb-7 shrink-0 border-b border-white/25">
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-black tracking-[0.3em] uppercase text-white">
                  {groupedLists[activeCategory]?.length || 0} collections
                </span>
                <h2 className="text-4xl md:text-5xl font-extrabold flex items-center gap-3 text-white">
                  {activeCategory.toUpperCase()}
                </h2>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setCategory(activeCategory);
                    setIsCreateOpen(true);
                  }}
                  className="px-5 py-2.5 rounded-full font-bold text-sm text-white tracking-wide"
                  style={{ background: activeFolderObj.color }}
                >
                  + new list
                </button>
                <button
                  onClick={() => setActiveCategory(null)}
                  className="p-2.5 rounded-full bg-white/40 text-slate-600"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-5 pb-12">
              {groupedLists[activeCategory].map((list, i) => (
                <Link
                  key={list.id}
                  to={`/lists/${list.id}`}
                  className="group flex flex-col h-full rounded-2xl p-5 bg-white border border-slate-100 shadow-sm hover:-translate-y-1 transition-all relative"
                  style={{
                    animationDelay: `${i * 45}ms`,
                    animation: "slideUp 0.35s ease both",
                  }}
                >
                  {/* Lock/Globe icon */}
                  <div className="absolute bottom-3 right-3 text-xl">
                    {list.is_public ? "🌐" : "🔒"}
                  </div>
                  <h3 className="font-extrabold text-base mb-2 pr-6">
                    {list.title}
                  </h3>
                  <p className="text-xs text-slate-400 line-clamp-2 mt-auto">
                    {list.description}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
