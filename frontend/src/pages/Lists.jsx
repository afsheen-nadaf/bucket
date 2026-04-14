import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { Plus, X, Sparkles } from "lucide-react";
import Folder from "../components/Folder";
import Iridescence from "../components/Iridescence";

export default function Lists() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Movies");
  const [description, setDescription] = useState("");

  // Folder & Modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState(null);

  useEffect(() => {
    fetchLists();
  }, [user]);

  const fetchLists = async () => {
    const { data, error } = await supabase
      .from("lists")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (!error) setLists(data);
    setLoading(false);
  };

  const createList = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    const { data, error } = await supabase
      .from("lists")
      .insert([{ user_id: user.id, title, category, description }])
      .select();

    if (!error && data) {
      setLists([data[0], ...lists]);
      setTitle("");
      setDescription("");
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

  const categoryFolders = [
    { id: "Movies", label: "movies", color: "#E05A7A", emoji: "🎬" },
    { id: "Books", label: "books", color: "#D97706", emoji: "📖" },
    { id: "Music", label: "music", color: "#7C3AED", emoji: "🎵" },
    { id: "Places", label: "places", color: "#65A30D", emoji: "📍" },
  ];

  const activeFolderObj = categoryFolders.find((c) => c.id === activeCategory);

  // Glass style used for modals
  const glassStyle = {
    background: "rgba(255,255,255,0.72)",
    backdropFilter: "blur(32px) saturate(200%)",
    WebkitBackdropFilter: "blur(32px) saturate(200%)",
    border: "1.5px solid rgba(255,255,255,0.9)",
    boxShadow:
      "0 12px 48px rgba(80,100,200,0.18), 0 2px 8px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.98)",
  };

  return (
    <div className="relative lowercase w-full min-h-screen flex flex-col items-center overflow-hidden">
      {/* ── Full-page Iridescence background ── */}
      <div
        className="fixed inset-0 -z-20 pointer-events-none"
        style={{ opacity: 0.38 }}
      >
        <Iridescence
          color={[0.55, 0.62, 1.0]}
          speed={0.55}
          amplitude={0.08}
          mouseReact={false}
        />
      </div>

      {/* ── Frosted white wash so content stays readable ── */}
      <div
        className="fixed inset-0 -z-10 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 90% 70% at 50% 40%, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.82) 100%)",
        }}
      />

      {/* ── Decorative blobs ── */}
      <div
        className="fixed pointer-events-none -z-10"
        style={{
          width: "560px",
          height: "560px",
          top: "18%",
          left: "8%",
          transform: "translate(-50%, -50%)",
          background:
            "radial-gradient(circle, rgba(100,149,237,0.22) 0%, transparent 65%)",
          borderRadius: "50%",
        }}
      />
      <div
        className="fixed pointer-events-none -z-10"
        style={{
          width: "480px",
          height: "480px",
          top: "72%",
          left: "88%",
          transform: "translate(-50%, -50%)",
          background:
            "radial-gradient(circle, rgba(224,90,122,0.16) 0%, transparent 65%)",
          borderRadius: "50%",
        }}
      />
      <div
        className="fixed pointer-events-none -z-10"
        style={{
          width: "400px",
          height: "400px",
          top: "55%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          background:
            "radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 65%)",
          borderRadius: "50%",
        }}
      />

      {/* ── Header ── */}
      <div className="flex justify-between items-center w-full max-w-[100rem] mb-2 px-6 md:px-14 mt-8 mx-auto">
        <div className="flex flex-col">
          <span
            className="text-[11px] font-bold tracking-[0.25em] uppercase"
            style={{ color: "rgba(100,149,237,0.7)" }}
          >
            your collections
          </span>
          <h1
            className="font-balsamiq text-3xl md:text-4xl font-extrabold leading-tight"
            style={{ color: "#1a1a2e" }}
          >
            my lists ✦
          </h1>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-sm md:text-base transition-all hover:scale-105 active:scale-95 shadow-lg"
          style={{
            background: "rgba(255,255,255,0.85)",
            backdropFilter: "blur(16px)",
            border: "1.5px solid rgba(100,149,237,0.35)",
            color: "#5b87e5",
            boxShadow:
              "0 4px 20px rgba(100,149,237,0.2), inset 0 1px 0 rgba(255,255,255,0.95)",
          }}
        >
          <Plus size={18} strokeWidth={3} />
          new list
        </button>
      </div>

      {/* ── Thin divider ── */}
      <div className="w-full max-w-[100rem] px-6 md:px-14 mb-10">
        <div
          style={{
            height: "1px",
            background:
              "linear-gradient(90deg, transparent, rgba(100,149,237,0.25) 30%, rgba(100,149,237,0.25) 70%, transparent)",
          }}
        />
      </div>

      {/* ── Main content: folders ── */}
      {loading ? (
        <div
          className="flex-1 flex flex-col items-center justify-center gap-3 mt-20"
          style={{ color: "rgba(26,26,46,0.45)" }}
        >
          <div
            className="w-8 h-8 rounded-full border-2 animate-spin"
            style={{
              borderColor: "rgba(100,149,237,0.3)",
              borderTopColor: "#6495ed",
            }}
          />
          <span className="text-sm font-medium">loading your folders...</span>
        </div>
      ) : (
        <div className="flex-1 w-full flex flex-col justify-center items-center py-8 md:py-16">
          <div className="flex flex-wrap justify-center items-end gap-y-16 gap-x-10 md:gap-x-20 lg:gap-x-28 xl:gap-x-40 px-6 w-full max-w-[100rem] mx-auto">
            {categoryFolders.map((cat, catIdx) => {
              const catLists = groupedLists[cat.id] || [];
              const overflowCount = catLists.length - 2;
              const visibleLists =
                catLists.length <= 3 ? catLists : catLists.slice(0, 2);

              const folderItems = [
                ...visibleLists.map((l) => (
                  <div
                    key={l.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/lists/${l.id}`);
                    }}
                    className="w-full h-full flex flex-col p-2 cursor-pointer hover:-translate-y-0.5 transition-all"
                    style={{
                      background: "white",
                      borderRadius: "8px",
                      boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "7px",
                        fontWeight: 800,
                        color: cat.color,
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                        marginBottom: "3px",
                      }}
                    >
                      {cat.label}
                    </span>
                    <span
                      style={{
                        fontSize: "9px",
                        fontWeight: 700,
                        color: "#1a1a2e",
                        lineHeight: 1.3,
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {l.title}
                    </span>
                  </div>
                )),
                ...(catLists.length > 3
                  ? [
                      <div
                        key="overflow"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveCategory(cat.id);
                        }}
                        className="w-full h-full flex flex-col items-center justify-center p-1.5 cursor-pointer hover:-translate-y-1 transition-transform"
                        style={{
                          background: `${cat.color}14`,
                          borderRadius: "8px",
                          border: `1.5px dashed ${cat.color}50`,
                        }}
                      >
                        <span
                          style={{
                            fontSize: "13px",
                            fontWeight: 800,
                            color: cat.color,
                            lineHeight: 1,
                          }}
                        >
                          +{overflowCount}
                        </span>
                        <span
                          style={{
                            fontSize: "8px",
                            fontWeight: 700,
                            color: cat.color,
                            opacity: 0.7,
                            marginTop: "2px",
                          }}
                        >
                          more
                        </span>
                      </div>,
                    ]
                  : []),
              ];

              return (
                <div
                  key={cat.id}
                  className="flex flex-col items-center gap-5 group w-[180px] md:w-[240px] shrink-0"
                  style={{
                    animationDelay: `${catIdx * 80}ms`,
                    animation: "fadeSlideUp 0.5s ease both",
                  }}
                >
                  {/* Count badge above folder */}
                  <div
                    className="text-xs font-bold px-3 py-1 rounded-full transition-opacity"
                    style={{
                      background:
                        catLists.length > 0
                          ? `${cat.color}18`
                          : "rgba(0,0,0,0.04)",
                      color:
                        catLists.length > 0 ? cat.color : "rgba(26,26,46,0.3)",
                      border: `1px solid ${catLists.length > 0 ? cat.color + "30" : "transparent"}`,
                      opacity: catLists.length > 0 ? 1 : 0.5,
                    }}
                  >
                    {catLists.length === 0
                      ? "empty"
                      : `${catLists.length} list${catLists.length !== 1 ? "s" : ""}`}
                  </div>

                  {/* Folder with subtle glow on hover */}
                  <div
                    className="transition-all duration-300 hover:scale-105 relative"
                    style={{
                      filter: "drop-shadow(0 8px 24px rgba(0,0,0,0.10))",
                    }}
                  >
                    {/* Glow ring behind folder */}
                    <div
                      className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                      style={{
                        background: `radial-gradient(circle at 50% 80%, ${cat.color}30 0%, transparent 70%)`,
                        transform: "scale(1.4) translateY(10%)",
                      }}
                    />
                    <Folder color={cat.color} size={1.6} items={folderItems} />
                  </div>

                  {/* Category label button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveCategory(cat.id);
                    }}
                    className="font-balsamiq font-bold text-lg flex items-center justify-center gap-2 rounded-full transition-all hover:-translate-y-0.5 active:scale-95 w-full max-w-[175px] py-2.5 px-5"
                    style={{
                      background: "rgba(255,255,255,0.8)",
                      backdropFilter: "blur(12px)",
                      border: "1.5px solid rgba(255,255,255,0.9)",
                      color: "#1a1a2e",
                      boxShadow:
                        "0 4px 16px rgba(0,0,0,0.07), inset 0 1px 0 rgba(255,255,255,0.95)",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = `${cat.color}60`;
                      e.currentTarget.style.color = cat.color;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor =
                        "rgba(255,255,255,0.9)";
                      e.currentTarget.style.color = "#1a1a2e";
                    }}
                  >
                    <span>{cat.emoji}</span>
                    <span>{cat.label}</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Keyframe for staggered reveal ── */}
      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* =========================================
          MODAL 1: Create New List
          ========================================= */}
      {isCreateOpen && (
        <div
          className="fixed top-0 inset-x-0 bottom-0 z-50 flex items-center justify-center p-4 animate-fade-in"
          style={{
            background: "rgba(20,20,40,0.45)",
            backdropFilter: "blur(8px)",
          }}
          onClick={() => setIsCreateOpen(false)}
        >
          <div
            className="w-full max-w-md p-8 rounded-[2rem] shadow-2xl relative"
            style={glassStyle}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Subtle iridescence tint in top corner */}
            <div
              className="absolute top-0 right-0 w-48 h-48 rounded-[2rem] pointer-events-none overflow-hidden opacity-20"
              style={{ zIndex: 0 }}
            >
              <Iridescence
                color={[0.6, 0.7, 1.0]}
                speed={0.4}
                amplitude={0.05}
                mouseReact={false}
              />
            </div>

            <button
              onClick={() => setIsCreateOpen(false)}
              className="absolute top-5 right-5 transition-all hover:scale-110 active:scale-95 rounded-full p-2 z-10"
              style={{
                background: "rgba(0,0,0,0.06)",
                color: "rgba(26,26,46,0.5)",
              }}
            >
              <X size={18} strokeWidth={2.5} />
            </button>

            <div className="relative z-10">
              <h2
                className="text-2xl font-balsamiq font-extrabold mb-1 flex items-center gap-2.5"
                style={{ color: "#1a1a2e" }}
              >
                <span
                  className="inline-flex items-center justify-center w-9 h-9 rounded-xl shadow-sm"
                  style={{
                    background: "rgba(100,149,237,0.15)",
                    color: "#6495ed",
                  }}
                >
                  <Plus size={22} strokeWidth={3} />
                </span>
                new list
              </h2>
              <p
                className="text-xs font-medium mb-6"
                style={{ color: "rgba(26,26,46,0.45)" }}
              >
                add it to a category folder
              </p>

              <form onSubmit={createList} className="flex flex-col gap-3.5">
                <input
                  type="text"
                  placeholder="list title (e.g. summer reads)"
                  required
                  className="w-full px-4 py-3 rounded-xl outline-none font-medium placeholder-shown:text-sm transition-all"
                  style={{
                    background: "rgba(255,255,255,0.75)",
                    border: "1.5px solid rgba(255,255,255,0.8)",
                    color: "#1a1a2e",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
                  }}
                  onFocus={(e) =>
                    (e.target.style.borderColor = "rgba(100,149,237,0.5)")
                  }
                  onBlur={(e) =>
                    (e.target.style.borderColor = "rgba(255,255,255,0.8)")
                  }
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />

                {/* Category pills */}
                <div className="flex gap-2 flex-wrap">
                  {categoryFolders.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategory(cat.id)}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all hover:scale-105 active:scale-95"
                      style={{
                        background:
                          category === cat.id ? cat.color : `${cat.color}14`,
                        color: category === cat.id ? "#fff" : cat.color,
                        border: `1.5px solid ${category === cat.id ? cat.color : cat.color + "30"}`,
                        boxShadow:
                          category === cat.id
                            ? `0 4px 12px ${cat.color}40`
                            : "none",
                      }}
                    >
                      {cat.emoji} {cat.label}
                    </button>
                  ))}
                </div>

                <textarea
                  placeholder="description (optional)"
                  rows="3"
                  className="w-full px-4 py-3 rounded-xl outline-none resize-none font-medium placeholder-shown:text-sm transition-all"
                  style={{
                    background: "rgba(255,255,255,0.75)",
                    border: "1.5px solid rgba(255,255,255,0.8)",
                    color: "#1a1a2e",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
                  }}
                  onFocus={(e) =>
                    (e.target.style.borderColor = "rgba(100,149,237,0.5)")
                  }
                  onBlur={(e) =>
                    (e.target.style.borderColor = "rgba(255,255,255,0.8)")
                  }
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />

                <button
                  type="submit"
                  className="w-full font-bold py-3.5 rounded-xl shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all mt-1 flex items-center justify-center gap-2"
                  style={{
                    background:
                      "linear-gradient(135deg, #6495ed 0%, #8b6cf7 100%)",
                    color: "white",
                    boxShadow: "0 6px 24px rgba(100,149,237,0.4)",
                  }}
                >
                  <Sparkles size={16} strokeWidth={2.5} />
                  create list
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* =========================================
          MODAL 2: Expanded Folder Contents
          — Slides up as a bottom sheet, sits under the navbar
          ========================================= */}
      {activeCategory && activeFolderObj && (
        <>
          {/* Dim overlay — only covers below the nav */}
          <div
            className="fixed inset-x-0 bottom-0 z-[59] animate-fade-in"
            style={{
              top: "72px",
              background: "rgba(20,20,40,0.35)",
              backdropFilter: "blur(4px)",
            }}
            onClick={() => setActiveCategory(null)}
          />

          {/* Sheet — slides up from the bottom */}
          <div
            className="fixed inset-x-0 bottom-0 z-[60] flex flex-col"
            style={{
              top: "72px",
              background: "#f4f6ff",
              borderTop: `3px solid ${activeFolderObj.color}`,
              boxShadow: "0 -8px 48px rgba(0,0,0,0.14)",
              animation: "sheetSlideUp 0.35s cubic-bezier(0.22,1,0.36,1) both",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Iridescence strip at the very top of the sheet */}
            <div
              className="absolute inset-x-0 top-0 pointer-events-none overflow-hidden"
              style={{ height: "140px", opacity: 0.22 }}
            >
              <Iridescence
                color={[0.5, 0.6, 1.0]}
                speed={0.5}
                amplitude={0.07}
                mouseReact={false}
              />
            </div>

            {/* Sheet header */}
            <div
              className="relative flex items-center justify-between px-6 md:px-10 py-5 shrink-0"
              style={{ borderBottom: "1px solid rgba(0,0,0,0.07)" }}
            >
              <div className="flex items-center gap-3">
                {/* Mini folder swatch */}
                <div
                  className="w-8 h-6 rounded-md shadow-sm"
                  style={{ background: activeFolderObj.color }}
                />
                <div>
                  <h3
                    className="text-2xl font-balsamiq font-extrabold leading-tight"
                    style={{ color: "#1a1a2e" }}
                  >
                    {activeFolderObj.emoji} {activeCategory.toLowerCase()}
                  </h3>
                  <p
                    className="text-[11px] font-bold tracking-widest uppercase"
                    style={{ color: activeFolderObj.color + "cc" }}
                  >
                    {groupedLists[activeCategory]?.length || 0} list
                    {groupedLists[activeCategory]?.length !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setActiveCategory(null)}
                className="transition-all hover:scale-110 active:scale-95 rounded-full p-2.5 shadow-sm"
                style={{
                  background: "rgba(26,26,46,0.07)",
                  color: "rgba(26,26,46,0.55)",
                }}
              >
                <X size={18} strokeWidth={2.5} />
              </button>
            </div>

            {/* Scrollable cards area */}
            <div className="overflow-y-auto flex-1 px-6 md:px-10 py-6 custom-scrollbar">
              {groupedLists[activeCategory]?.length === 0 ? (
                <div
                  className="text-center p-10 rounded-2xl w-full max-w-sm mx-auto mt-8"
                  style={{
                    background: "white",
                    border: `2px dashed ${activeFolderObj.color}40`,
                  }}
                >
                  <p
                    className="font-bold text-lg mb-1"
                    style={{ color: "#1a1a2e" }}
                  >
                    this folder is empty.
                  </p>
                  <p
                    className="text-sm font-medium"
                    style={{ color: "rgba(26,26,46,0.45)" }}
                  >
                    close this and use the new list button to make your first
                    one!
                  </p>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full max-w-4xl mx-auto pb-8">
                  {groupedLists[activeCategory].map((list, i) => (
                    <Link
                      key={list.id}
                      to={`/lists/${list.id}`}
                      className="group flex flex-col rounded-2xl p-5 transition-all hover:-translate-y-1"
                      style={{
                        background: "white",
                        border: `1.5px solid rgba(0,0,0,0.07)`,
                        boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
                        animationDelay: `${i * 55}ms`,
                        animation: "fadeSlideUp 0.4s ease both",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = `${activeFolderObj.color}55`;
                        e.currentTarget.style.boxShadow = `0 8px 28px ${activeFolderObj.color}20`;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = "rgba(0,0,0,0.07)";
                        e.currentTarget.style.boxShadow =
                          "0 2px 12px rgba(0,0,0,0.06)";
                      }}
                    >
                      {/* Top colour bar */}
                      <div
                        className="w-8 h-1 rounded-full mb-3 transition-all group-hover:w-16"
                        style={{ background: activeFolderObj.color }}
                      />
                      <div className="flex justify-between items-start mb-2">
                        <h3
                          className="text-sm font-bold line-clamp-2 pr-2 leading-snug"
                          style={{ color: "#1a1a2e" }}
                        >
                          {list.title}
                        </h3>
                        <span
                          className="text-[9px] font-bold px-2.5 py-1 rounded-full shrink-0"
                          style={{
                            background: `${activeFolderObj.color}18`,
                            color: activeFolderObj.color,
                          }}
                        >
                          {list.category.toLowerCase()}
                        </span>
                      </div>
                      {list.description && (
                        <p
                          className="text-xs line-clamp-2 mt-auto pt-3"
                          style={{
                            color: "rgba(26,26,46,0.45)",
                            borderTop: "1px solid rgba(0,0,0,0.06)",
                          }}
                        >
                          {list.description}
                        </p>
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          <style>{`
            @keyframes sheetSlideUp {
              from { transform: translateY(100%); }
              to   { transform: translateY(0); }
            }
          `}</style>
        </>
      )}
    </div>
  );
}
