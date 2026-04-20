import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { searchExternalApi } from "../lib/api";
import {
  Search,
  Plus,
  ArrowLeft,
  Trash2,
  Edit2,
  CheckCircle2,
  Sparkles,
  X,
} from "lucide-react";
import RatingModal from "../components/RatingModal";
import Iridescence from "../components/Iridescence";

const CATEGORY_META = {
  Movies: { color: "#E05A7A", emoji: "🎬", placeholder: "movie" },
  Books: { color: "#D97706", emoji: "📖", placeholder: "book" },
  Music: { color: "#7C3AED", emoji: "🎵", placeholder: "album or artist" },
  Places: { color: "#65A30D", emoji: "📍", placeholder: "place" },
};

const glassCard = {
  background: "rgba(255,255,255,0.82)",
  backdropFilter: "blur(32px) saturate(180%)",
  WebkitBackdropFilter: "blur(32px) saturate(180%)",
  border: "1.5px solid rgba(255,255,255,0.9)",
  boxShadow:
    "0 8px 32px rgba(80,100,200,0.10), 0 2px 8px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.98)",
};

export default function ListDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [list, setList] = useState(null);
  const [items, setItems] = useState([]);

  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const [isEditingList, setIsEditingList] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editForm, setEditForm] = useState({ title: "", description: "" });
  const [selectedItemForRating, setSelectedItemForRating] = useState(null);

  useEffect(() => {
    fetchListDetails();
  }, [id]);

  const fetchListDetails = async () => {
    const { data: listData } = await supabase
      .from("lists")
      .select("*")
      .eq("id", id)
      .single();
    if (listData) {
      setList(listData);
      setEditForm({
        title: listData.title,
        description: listData.description || "",
      });
      const { data: itemsData } = await supabase
        .from("list_items")
        .select("*")
        .eq("list_id", id)
        .order("added_at", { ascending: false });
      setItems(itemsData || []);
    }
  };

  const updateList = async (e) => {
    e.preventDefault();
    const { data, error } = await supabase
      .from("lists")
      .update(editForm)
      .eq("id", id)
      .select();
    if (!error && data) {
      setList(data[0]);
      setIsEditingList(false);
    }
  };

  const deleteList = async () => {
    const { error } = await supabase.from("lists").delete().eq("id", id);
    if (!error) navigate("/lists");
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim() || !list) return;
    setIsSearching(true);
    const results = await searchExternalApi(list.category, query);
    setSearchResults(results);
    setIsSearching(false);
  };

  const addItem = async (item) => {
    const { data, error } = await supabase
      .from("list_items")
      .insert([
        {
          list_id: list.id,
          api_id: item.api_id,
          title: item.title,
          cover_url: item.cover_url,
          creator: item.creator,
        },
      ])
      .select();
    if (!error && data) {
      setItems([data[0], ...items]);
      setSearchResults([]);
      setQuery("");
    }
  };

  const removeItem = async (itemId) => {
    const { error } = await supabase
      .from("list_items")
      .delete()
      .eq("id", itemId);
    if (!error) setItems(items.filter((i) => i.id !== itemId));
  };

  const toggleItemDone = async (item) => {
    const { error } = await supabase
      .from("list_items")
      .update({ is_done: !item.is_done })
      .eq("id", item.id);
    if (!error)
      setItems(
        items.map((i) =>
          i.id === item.id ? { ...i, is_done: !item.is_done } : i,
        ),
      );
  };

  if (!list)
    return (
      <div
        className="flex items-center justify-center min-h-[60vh] gap-3"
        style={{ color: "rgba(26,26,46,0.45)" }}
      >
        <div
          className="w-6 h-6 rounded-full border-2 animate-spin"
          style={{
            borderColor: "rgba(100,149,237,0.3)",
            borderTopColor: "#6495ed",
          }}
        />
        <span className="text-sm font-medium lowercase">loading...</span>
      </div>
    );

  const meta = CATEGORY_META[list.category] || {
    color: "#6495ed",
    emoji: "✦",
    placeholder: "item",
  };
  const doneCount = items.filter((i) => i.is_done).length;

  return (
    <div className="relative lowercase min-h-screen pb-24">
      {/* ── Decorative blobs ── */}
      <div className="fixed inset-0 pointer-events-none -z-10 opacity-30">
        <Iridescence color={[0.4, 0.6, 1.0]} speed={0.5} amplitude={0.05} />
      </div>
      <div
        className="fixed pointer-events-none -z-10"
        style={{
          width: "500px",
          height: "500px",
          top: "10%",
          left: "-5%",
          background: `radial-gradient(circle, ${meta.color}20 0%, transparent 65%)`,
          borderRadius: "50%",
        }}
      />
      <div
        className="fixed pointer-events-none -z-10"
        style={{
          width: "420px",
          height: "420px",
          bottom: "10%",
          right: "-5%",
          background:
            "radial-gradient(circle, rgba(100,149,237,0.14) 0%, transparent 65%)",
          borderRadius: "50%",
        }}
      />

      <div className="max-w-4xl mx-auto px-4 md:px-8 pt-8">
        {/* ── Back link ── */}
        <Link
          to="/lists"
          className="inline-flex items-center gap-1.5 text-xs font-bold tracking-wide mb-8 transition-all hover:gap-2.5"
          style={{ color: "rgba(100,149,237,0.85)" }}
        >
          <ArrowLeft size={14} strokeWidth={2.5} />
          back to lists
        </Link>

        {/* ── Header ── */}
        {isEditingList ? (
          <form
            onSubmit={updateList}
            className="rounded-3xl p-7 mb-8 flex flex-col gap-4 relative overflow-hidden"
            style={glassCard}
          >
            <div className="absolute top-0 right-0 w-36 h-36 pointer-events-none opacity-20 rounded-3xl overflow-hidden">
              <Iridescence
                color={[0.6, 0.7, 1.0]}
                speed={0.4}
                amplitude={0.05}
                mouseReact={false}
              />
            </div>
            <p
              className="text-[11px] font-bold tracking-[0.2em] uppercase"
              style={{ color: "rgba(26,26,46,0.4)" }}
            >
              editing list
            </p>
            <input
              type="text"
              required
              value={editForm.title}
              onChange={(e) =>
                setEditForm({ ...editForm, title: e.target.value })
              }
              placeholder="list title"
              className="w-full text-xl font-extrabold px-4 py-3 rounded-xl outline-none transition-all"
              style={{
                background: "rgba(255,255,255,0.75)",
                border: "1.5px solid rgba(255,255,255,0.8)",
                color: "#1a1a2e",
              }}
              onFocus={(e) =>
                (e.target.style.borderColor = "rgba(100,149,237,0.5)")
              }
              onBlur={(e) =>
                (e.target.style.borderColor = "rgba(255,255,255,0.8)")
              }
            />
            <textarea
              value={editForm.description}
              onChange={(e) =>
                setEditForm({ ...editForm, description: e.target.value })
              }
              placeholder="description (optional)"
              rows={3}
              className="w-full px-4 py-3 rounded-xl outline-none resize-none transition-all text-sm"
              style={{
                background: "rgba(255,255,255,0.75)",
                border: "1.5px solid rgba(255,255,255,0.8)",
                color: "#1a1a2e",
              }}
              onFocus={(e) =>
                (e.target.style.borderColor = "rgba(100,149,237,0.5)")
              }
              onBlur={(e) =>
                (e.target.style.borderColor = "rgba(255,255,255,0.8)")
              }
            />
            <div className="flex justify-end gap-3 mt-1">
              <button
                type="button"
                onClick={() => setIsEditingList(false)}
                className="px-5 py-2.5 text-sm font-bold rounded-xl transition-colors"
                style={{ color: "rgba(26,26,46,0.5)" }}
              >
                cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 text-sm font-bold rounded-xl text-white flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg"
                style={{
                  background:
                    "linear-gradient(135deg, #6495ed 0%, #8b6cf7 100%)",
                  boxShadow: "0 6px 20px rgba(100,149,237,0.35)",
                }}
              >
                <Sparkles size={14} strokeWidth={2.5} />
                save changes
              </button>
            </div>
          </form>
        ) : (
          <div className="mb-8 flex justify-between items-start gap-4">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-2xl">{meta.emoji}</span>
                <h1
                  className="font-balsamiq text-3xl md:text-4xl font-extrabold"
                  style={{ color: "#1a1a2e" }}
                >
                  {list.title}
                </h1>
                <span
                  className="text-[10px] font-bold px-3 py-1 rounded-full text-white shadow-sm"
                  style={{ background: meta.color }}
                >
                  {list.category}
                </span>
              </div>
              {list.description && (
                <p
                  className="text-sm font-medium"
                  style={{ color: "rgba(26,26,46,0.5)" }}
                >
                  {list.description}
                </p>
              )}
              {items.length > 0 && (
                <p
                  className="text-xs font-bold tracking-wide"
                  style={{ color: "rgba(26,26,46,0.35)" }}
                >
                  {doneCount}/{items.length} done
                </p>
              )}
            </div>

            <div className="flex items-center gap-2 mt-1 shrink-0">
              <button
                onClick={() => setIsEditingList(true)}
                className="p-2.5 rounded-xl transition-all hover:scale-105 active:scale-95"
                style={{ ...glassCard, color: "rgba(26,26,46,0.45)" }}
                title="edit list"
              >
                <Edit2 size={16} />
              </button>

              {confirmDelete ? (
                <div
                  className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border"
                  style={{
                    background: "rgba(254,226,226,0.9)",
                    color: "#dc2626",
                    border: "1.5px solid rgba(220,38,38,0.2)",
                    backdropFilter: "blur(12px)",
                  }}
                >
                  sure?
                  <button
                    onClick={deleteList}
                    className="font-black hover:underline"
                  >
                    yes
                  </button>
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="hover:underline"
                  >
                    no
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="p-2.5 rounded-xl transition-all hover:scale-105 active:scale-95"
                  style={{ ...glassCard, color: "rgba(26,26,46,0.45)" }}
                  title="delete list"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── Divider ── */}
        <div
          className="mb-8"
          style={{
            height: "1px",
            background:
              "linear-gradient(90deg, transparent, rgba(100,149,237,0.2) 30%, rgba(100,149,237,0.2) 70%, transparent)",
          }}
        />

        {/* ── Search / Add Item ── */}
        <div
          className="rounded-3xl p-6 mb-8 relative overflow-hidden"
          style={glassCard}
        >
          <p
            className="text-[11px] font-bold tracking-[0.2em] uppercase mb-4"
            style={{ color: "rgba(26,26,46,0.4)" }}
          >
            add to list
          </p>
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
                size={16}
                style={{ color: "rgba(26,26,46,0.3)" }}
              />
              <input
                type="text"
                placeholder={`search for a ${meta.placeholder}...`}
                className="w-full pl-10 pr-4 py-3 rounded-xl outline-none text-sm font-medium transition-all"
                style={{
                  background: "rgba(255,255,255,0.75)",
                  border: "1.5px solid rgba(255,255,255,0.8)",
                  color: "#1a1a2e",
                }}
                onFocus={(e) =>
                  (e.target.style.borderColor = "rgba(100,149,237,0.5)")
                }
                onBlur={(e) =>
                  (e.target.style.borderColor = "rgba(255,255,255,0.8)")
                }
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <button
              type="submit"
              disabled={isSearching}
              className="px-5 py-3 rounded-xl text-sm font-bold text-white flex items-center gap-1.5 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-md disabled:opacity-60"
              style={{
                background: "linear-gradient(135deg, #1a1a2e 0%, #2d2d4e 100%)",
                boxShadow: "0 4px 16px rgba(26,26,46,0.3)",
              }}
            >
              {isSearching ? (
                <div
                  className="w-4 h-4 rounded-full border-2 animate-spin"
                  style={{
                    borderColor: "rgba(255,255,255,0.3)",
                    borderTopColor: "#fff",
                  }}
                />
              ) : (
                <Search size={15} strokeWidth={2.5} />
              )}
              {isSearching ? "..." : "search"}
            </button>
          </form>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="mt-4 flex flex-col gap-1.5">
              <div className="flex items-center justify-between mb-1">
                <p
                  className="text-[10px] font-bold tracking-widest uppercase"
                  style={{ color: "rgba(26,26,46,0.35)" }}
                >
                  results
                </p>
                <button
                  onClick={() => setSearchResults([])}
                  className="text-[10px] font-bold"
                  style={{ color: "rgba(26,26,46,0.35)" }}
                >
                  clear
                </button>
              </div>
              {searchResults.map((res) => (
                <div
                  key={res.api_id}
                  className="flex items-center justify-between p-3 rounded-2xl transition-all group"
                  style={{ background: "rgba(255,255,255,0.6)" }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background =
                      "rgba(100,149,237,0.06)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "rgba(255,255,255,0.6)")
                  }
                >
                  <div className="flex items-center gap-3">
                    {res.cover_url ? (
                      <img
                        src={res.cover_url}
                        alt={res.title}
                        className="w-11 h-11 object-cover rounded-xl shadow-sm"
                      />
                    ) : (
                      <div
                        className="w-11 h-11 rounded-xl flex items-center justify-center text-lg"
                        style={{ background: `${meta.color}18` }}
                      >
                        {meta.emoji}
                      </div>
                    )}
                    <div>
                      <p
                        className="font-bold text-sm"
                        style={{ color: "#1a1a2e" }}
                      >
                        {res.title}
                      </p>
                      <p
                        className="text-xs"
                        style={{ color: "rgba(26,26,46,0.45)" }}
                      >
                        {res.creator}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => addItem(res)}
                    className="p-2 rounded-xl font-bold text-white flex items-center gap-1 text-xs transition-all hover:scale-105 active:scale-95 shadow-sm"
                    style={{
                      background: meta.color,
                      boxShadow: `0 4px 12px ${meta.color}40`,
                    }}
                  >
                    <Plus size={14} strokeWidth={3} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Items Grid ── */}
        {items.length === 0 ? (
          <div
            className="text-center py-16 rounded-3xl border-2 border-dashed"
            style={{
              borderColor: "rgba(100,149,237,0.18)",
              background: "rgba(255,255,255,0.4)",
            }}
          >
            <p className="text-3xl mb-3">✦</p>
            <p className="font-bold" style={{ color: "#1a1a2e" }}>
              this list is empty
            </p>
            <p
              className="text-sm mt-1"
              style={{ color: "rgba(26,26,46,0.45)" }}
            >
              search above to add your first {meta.placeholder}!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {items.map((item, i) => (
              <div
                key={item.id}
                onClick={() => setSelectedItemForRating(item)}
                className="rounded-2xl overflow-hidden group relative cursor-pointer transition-all hover:-translate-y-1"
                style={{
                  ...glassCard,
                  animationDelay: `${i * 40}ms`,
                  animation: "fadeSlideUp 0.35s ease both",
                  boxShadow: item.is_done
                    ? "0 2px 8px rgba(0,0,0,0.05)"
                    : "0 8px 28px rgba(80,100,200,0.10), 0 2px 8px rgba(0,0,0,0.04)",
                }}
              >
                {/* Hover action buttons */}
                <div className="absolute top-2 right-2 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleItemDone(item);
                    }}
                    title={item.is_done ? "mark as not done" : "mark as done"}
                    className="p-1.5 rounded-lg shadow-md transition-all hover:scale-110"
                    style={
                      item.is_done
                        ? { background: "#22c55e", color: "#fff" }
                        : {
                            background: "rgba(255,255,255,0.9)",
                            color: "rgba(26,26,46,0.5)",
                          }
                    }
                  >
                    <CheckCircle2 size={14} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeItem(item.id);
                    }}
                    title="remove"
                    className="p-1.5 rounded-lg shadow-md transition-all hover:scale-110"
                    style={{
                      background: "rgba(255,255,255,0.9)",
                      color: "rgba(220,38,38,0.7)",
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                {/* Done badge */}
                {item.is_done && (
                  <div
                    className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest"
                    style={{
                      background: "#22c55e",
                      color: "#fff",
                      boxShadow: "0 2px 8px rgba(34,197,94,0.4)",
                    }}
                  >
                    done
                  </div>
                )}

                <div
                  className={
                    item.is_done
                      ? "opacity-40 grayscale transition-all"
                      : "transition-all"
                  }
                >
                  {item.cover_url ? (
                    <img
                      src={item.cover_url}
                      alt={item.title}
                      className="w-full aspect-[2/3] object-cover"
                    />
                  ) : (
                    <div
                      className="w-full aspect-[2/3] flex flex-col items-center justify-center gap-2 p-4 text-center"
                      style={{
                        background: `linear-gradient(145deg, ${meta.color}10, ${meta.color}22)`,
                      }}
                    >
                      <span className="text-3xl">{meta.emoji}</span>
                      <span
                        className="text-xs font-bold"
                        style={{ color: meta.color }}
                      >
                        {item.title}
                      </span>
                    </div>
                  )}
                </div>

                <div className="p-3 pb-3.5">
                  <h4
                    className="font-bold text-xs truncate leading-snug"
                    title={item.title}
                    style={{
                      color: item.is_done ? "rgba(26,26,46,0.35)" : "#1a1a2e",
                      textDecoration: item.is_done ? "line-through" : "none",
                    }}
                  >
                    {item.title}
                  </h4>
                  <p
                    className="text-[10px] truncate mt-0.5"
                    style={{ color: "rgba(26,26,46,0.4)" }}
                  >
                    {item.creator}
                  </p>
                  {item.rating && (
                    <div className="mt-1.5 flex items-center gap-1">
                      <span
                        className="text-[10px] font-black"
                        style={{ color: meta.color }}
                      >
                        {"★".repeat(item.rating)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Rating Modal ── */}
      {selectedItemForRating && (
        <RatingModal
          item={selectedItemForRating}
          category={list.category}
          onClose={() => setSelectedItemForRating(null)}
        />
      )}

      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
