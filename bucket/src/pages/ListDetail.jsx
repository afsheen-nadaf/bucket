import { useState, useEffect, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { searchExternalApi } from "../lib/api";
import {
  Search,
  Plus,
  ArrowLeft,
  Trash2,
  CheckCircle2,
  Sparkles,
  Loader,
  Heart,
  SearchX // Added for the empty state!
} from "lucide-react";
import RatingModal from "../components/RatingModal";
import AddToListModal from "../components/AddToListModal";

const CATEGORY_META = {
  Movies: { color: "#E05A7A", emoji: "🎬", placeholder: "movie", label: "movies & tv" },
  Books: { color: "#D97706", emoji: "📖", placeholder: "book", label: "books" },
  Music: { color: "#7C3AED", emoji: "🎵", placeholder: "album or artist", label: "music" },
  Places: { color: "#65A30D", emoji: "📍", placeholder: "place", label: "places" },
};

const getVerb = (category) => {
  switch (category) {
    case "Movies":
      return "watched";
    case "Books":
      return "read";
    case "Music":
      return "listened";
    case "Places":
      return "visited";
    default:
      return "logged";
  }
};

const glassCard = {
  background: "rgba(255,255,255,0.55)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  border: "1px solid rgba(255,255,255,0.7)",
  borderRadius: "1.75rem",
};

export default function ListDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [list, setList] = useState(null);
  const [items, setItems] = useState([]);

  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [userLocation, setUserLocation] = useState(null);

  const [isEditingList, setIsEditingList] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    is_public: false,
  });
  const [selectedItemForRating, setSelectedItemForRating] = useState(null);
  const [selectedItemForSaving, setSelectedItemForSaving] = useState(null);
  const searchTimeoutRef = useRef(null);

  const isOwner = user && list && user.id === list.user_id;

  useEffect(() => {
    fetchListDetails();
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        setUserLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        }),
      () => {},
    );
  }, [id]);

  useEffect(() => {
    if (!isOwner) return;

    if (!query.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const results = await searchExternalApi(
          list.category,
          query,
          userLocation,
        );
        setSearchResults(results || []);
      } catch (err) {
        console.error("Search error:", err);
        setSearchResults([]);
      }
      setIsSearching(false);
    }, 300);

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [query, isOwner, list?.category]);

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
        is_public: listData.is_public || false,
      });
      const { data: itemsData } = await supabase
        .from("list_items")
        .select("*")
        .eq("list_id", id)
        .order("created_at", { ascending: false });
      setItems(itemsData || []);
    }
  };

  const updateList = async (e) => {
    e.preventDefault();
    const { data, error } = await supabase
      .from("lists")
      .update({
        title: editForm.title,
        description: editForm.description,
        is_public: editForm.is_public,
      })
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

  const addItem = async (item) => {
    const existingInstances = items.filter((i) => i.api_id === item.api_id);
    const alreadyExists = existingInstances.length > 0;

    const { data, error } = await supabase
      .from("list_items")
      .insert([
        {
          list_id: list.id,
          api_id: item.api_id,
          title: item.title,
          cover_url: item.cover_url,
          creator: item.creator,
          is_done: false, // Don't auto-mark as done until they explicitly save the rating
        },
      ])
      .select();

    if (!error && data) {
      let updatedItems = [data[0], ...items];
      setItems(updatedItems);
      setSearchResults([]);
      setQuery("");

      if (alreadyExists) {
        const groupedRepresentation = {
          ...data[0],
          is_done: false,
          instances: existingInstances.concat(data[0]),
        };
        setSelectedItemForRating(groupedRepresentation);
      }
    }
  };

  const removeItem = async (apiId) => {
    const idsToDelete = items
      .filter((i) => i.api_id === apiId)
      .map((i) => i.id);
    const { error } = await supabase
      .from("list_items")
      .delete()
      .in("id", idsToDelete);
    if (!error) setItems(items.filter((i) => i.api_id !== apiId));
  };

  const toggleItemDone = async (groupedItem) => {
    if (groupedItem.is_done) {
      const idsToUpdate = groupedItem.instances.map((i) => i.id);
      const { error } = await supabase
        .from("list_items")
        .update({ is_done: false })
        .in("id", idsToUpdate);

      if (!error) {
        setItems(
          items.map((i) =>
            idsToUpdate.includes(i.id) ? { ...i, is_done: false } : i,
          ),
        );
      }
    } else {
      setSelectedItemForRating(groupedItem);
    }
  };

  const handleRatingSaved = async (groupedItem) => {
    const idsToUpdate = groupedItem.instances.map((i) => i.id);
    const { error } = await supabase
      .from("list_items")
      .update({ is_done: true })
      .in("id", idsToUpdate);

    if (!error) {
      setItems(
        items.map((i) =>
          idsToUpdate.includes(i.id) ? { ...i, is_done: true } : i,
        ),
      );
    }
    setSelectedItemForRating(null);
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

  if (!list.is_public && user && user.id !== list.user_id) {
    return (
      <div className="relative lowercase min-h-screen pb-24 overflow-x-hidden flex items-center justify-center">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 md:px-8 text-center">
          <Link
            to="/lists"
            className="inline-flex items-center gap-1.5 text-xs font-bold tracking-wide mb-8 transition-all hover:gap-2.5 text-white"
          >
            <ArrowLeft size={14} strokeWidth={2.5} />
            back to lists
          </Link>
          <div
            className="rounded-[1.75rem] p-12 md:p-16 flex flex-col gap-8 items-center"
            style={glassCard}
          >
            <span className="text-6xl">🔒</span>
            <div className="flex flex-col gap-4">
              <h1
                className="text-3xl md:text-4xl font-poppins font-extrabold"
                style={{ color: "#1a1a2e" }}
              >
                this list is private
              </h1>
              <p
                className="text-sm md:text-base"
                style={{ color: "rgba(26,26,46,0.6)" }}
              >
                you don't have permission to view this list.
              </p>
            </div>
            <Link
              to="/"
              className="px-8 py-3 rounded-xl text-white text-sm font-bold transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg"
              style={{
                background: "linear-gradient(135deg, #6495ed 0%, #8b6cf7 100%)",
                boxShadow: "0 6px 20px rgba(100,149,237,0.35)",
              }}
            >
              go home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const meta = CATEGORY_META[list.category] || {
    color: "#6495ed",
    emoji: "✦",
    placeholder: "item",
  };
  const verb = getVerb(list.category);

  const groupedItemsMap = new Map();
  items.forEach((item) => {
    if (groupedItemsMap.has(item.api_id)) {
      const group = groupedItemsMap.get(item.api_id);
      group.instances.push(item);
      group.is_done = group.is_done || item.is_done;
    } else {
      groupedItemsMap.set(item.api_id, { ...item, instances: [item] });
    }
  });
  const groupedItems = Array.from(groupedItemsMap.values());
  const doneCount = groupedItems.filter((i) => i.is_done).length;

  return (
    <div className="relative lowercase min-h-screen pb-24 overflow-x-hidden">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 md:px-8 pt-6 md:pt-8">
        <Link
          to="/lists"
          className="inline-flex items-center gap-1.5 text-xs font-bold tracking-wide mb-6 transition-all hover:gap-2.5 text-white"
        >
          <ArrowLeft size={14} strokeWidth={2.5} />
          back to lists
        </Link>

        {isEditingList ? (
          <form
            onSubmit={updateList}
            className="rounded-[1.75rem] p-6 md:p-8 mb-6 flex flex-col gap-4 relative overflow-hidden"
            style={glassCard}
          >
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
            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                checked={editForm.is_public}
                onChange={(e) =>
                  setEditForm({ ...editForm, is_public: e.target.checked })
                }
                id="public-toggle"
                className="w-4 h-4 rounded cursor-pointer"
              />
              <label
                htmlFor="public-toggle"
                className="text-xs font-bold cursor-pointer"
                style={{ color: "rgba(26,26,46,0.6)" }}
              >
                make this list public
              </label>
            </div>
            <div className="flex justify-end gap-3 mt-auto">
              <button
                type="button"
                onClick={() => setIsEditingList(false)}
                className="px-5 py-2.5 text-sm font-bold rounded-xl"
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
          <div
            className="rounded-[1.75rem] p-6 md:p-8 mb-6 flex flex-col gap-5"
            style={glassCard}
          >
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex items-start gap-4">
                <span className="text-4xl md:text-5xl leading-none">
                  {meta.emoji}
                </span>
                <div className="flex flex-col gap-1 flex-1 min-w-0">
                  <h1
                    className="text-2xl md:text-3xl font-poppins font-extrabold leading-tight break-words"
                    style={{ color: "#1a1a2e" }}
                  >
                    {list.title}
                  </h1>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className="text-[10px] font-bold px-3 py-1 rounded-full text-white"
                      style={{ background: meta.color }}
                    >
                      {meta.label || list.category}
                    </span>
                    {isOwner && (
                      <span
                        className="text-[10px] font-bold px-3 py-1 rounded-full flex items-center gap-1"
                        style={{
                          background: list.is_public
                            ? "rgba(34, 197, 94, 0.15)"
                            : "rgba(107, 114, 128, 0.15)",
                          color: list.is_public
                            ? "rgba(34, 197, 94, 0.7)"
                            : "rgba(107, 114, 128, 0.7)",
                        }}
                      >
                        {list.is_public ? "🌐 public" : "🔒 private"}
                      </span>
                    )}
                    {!isOwner && (
                      <span
                        className="text-[10px] font-bold px-3 py-1 rounded-full"
                        style={{
                          background: "rgba(100,149,237,0.15)",
                          color: "rgba(100,149,237,0.7)",
                        }}
                      >
                        viewing someone's list
                      </span>
                    )}
                  </div>
                </div>
              </div>
              {groupedItems.length > 0 && (
                <span
                  className="text-[10px] font-bold px-3 py-1.5 rounded-full whitespace-nowrap"
                  style={{
                    background: `${meta.color}18`,
                    color: meta.color,
                  }}
                >
                  {doneCount}/{groupedItems.length} done
                </span>
              )}
            </div>

            {list.description && (
              <p className="text-sm" style={{ color: "rgba(26,26,46,0.6)" }}>
                {list.description}
              </p>
            )}

            {isOwner && (
              <div
                className="flex items-center gap-2 pt-2 border-t"
                style={{ borderColor: "rgba(0,0,0,0.08)" }}
              >
                <button
                  onClick={() => setIsEditingList(true)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all hover:scale-105"
                  style={{
                    background: "rgba(100,149,237,0.1)",
                    color: "#6495ed",
                  }}
                >
                  edit
                </button>
                {confirmDelete ? (
                  <div
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold"
                    style={{
                      background: "rgba(254,226,226,0.9)",
                      color: "#dc2626",
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
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all hover:scale-105"
                    style={{
                      background: "rgba(220,38,38,0.08)",
                      color: "rgba(220,38,38,0.7)",
                    }}
                  >
                    delete
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {groupedItems.length > 0 && (
          <div
            className="rounded-lg px-4 py-3 mb-6 flex items-center justify-between gap-4"
            style={glassCard}
          >
            <div className="flex-1">
              <div
                className="h-2 rounded-full overflow-hidden"
                style={{ background: `${meta.color}20` }}
              >
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${(doneCount / groupedItems.length) * 100}%`,
                    background: meta.color,
                  }}
                />
              </div>
            </div>
            <span
              className="text-xs font-bold whitespace-nowrap"
              style={{ color: meta.color }}
            >
              {doneCount}/{groupedItems.length}
            </span>
          </div>
        )}

        {isOwner && (
          <div className="rounded-[1.75rem] p-6 md:p-8 mb-6" style={glassCard}>
            <p
              className="text-[10px] font-bold tracking-[0.2em] uppercase mb-4"
              style={{ color: "rgba(26,26,46,0.4)" }}
            >
              add to list
            </p>
            <div className="flex gap-2 flex-col sm:flex-row">
              <div className="relative flex-1">
                <Search
                  className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
                  size={16}
                  style={{ color: "rgba(26,26,46,0.3)" }}
                />
                <input
                  type="text"
                  placeholder={`search for a ${meta.placeholder}...`}
                  className="w-full pl-10 pr-12 py-3 rounded-xl outline-none text-sm font-medium transition-all"
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
                {isSearching && (
                  <Loader
                    className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin"
                    size={16}
                    style={{ color: "#6495ed" }}
                  />
                )}
              </div>
            </div>

            {searchResults.length > 0 && (
              <div className="mt-5 flex flex-col gap-2">
                <div className="flex items-center justify-between mb-2">
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
                    className="flex items-center justify-between p-3 rounded-lg transition-all gap-2"
                    style={{ background: "rgba(255,255,255,0.6)" }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background =
                        "rgba(100,149,237,0.06)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background =
                        "rgba(255,255,255,0.6)")
                    }
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {res.cover_url ? (
                        <img
                          src={res.cover_url}
                          alt={res.title}
                          className="w-10 h-10 object-cover rounded-lg shadow-sm shrink-0"
                        />
                      ) : (
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center text-lg shrink-0 bg-transparent"
                        >
                          {meta.emoji}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p
                          className="font-bold text-sm truncate"
                          style={{ color: "#1a1a2e" }}
                        >
                          {res.title}
                        </p>
                        <p
                          className="text-xs truncate"
                          style={{ color: "rgba(26,26,46,0.45)" }}
                        >
                          {res.creator}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => addItem(res)}
                      className="p-2 rounded-lg font-bold text-white flex items-center justify-center shrink-0 transition-all hover:scale-105 active:scale-95 shadow-sm"
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
            
            {/* The Empty State for zero search results! */}
            {query.trim() !== "" && !isSearching && searchResults.length === 0 && (
              <div className="text-center py-10 opacity-70 flex flex-col items-center">
                <SearchX size={32} className="mb-3 text-slate-400" />
                <p className="text-sm font-medium lowercase font-poppins text-slate-500">
                  nothing here... try something else?
                </p>
              </div>
            )}
            
          </div>
        )}

        {groupedItems.length === 0 ? (
          <div
            className="text-center py-16 rounded-xl border-2 border-dashed"
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
              {isOwner
                ? `search above to add your first ${meta.placeholder}!`
                : `no items yet.`}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4">
            {groupedItems.map((item, i) => (
              <div
                key={item.api_id}
                onClick={() => {
                  if (isOwner) setSelectedItemForRating(item);
                }}
                className={`rounded-xl overflow-hidden group relative transition-all hover:-translate-y-1 ${isOwner ? "cursor-pointer" : "cursor-default"}`}
                style={{
                  ...glassCard,
                  animationDelay: `${i * 40}ms`,
                  animation: "fadeSlideUp 0.35s ease both",
                  boxShadow: item.is_done
                    ? "0 2px 8px rgba(0,0,0,0.05)"
                    : "0 8px 28px rgba(80,100,200,0.10), 0 2px 8px rgba(0,0,0,0.04)",
                }}
              >
                {isOwner && (
                  <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
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
                        removeItem(item.api_id);
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
                )}

                {!isOwner && user && (
                  <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedItemForSaving({
                          item_name: item.title,
                          category: list.category,
                          external_id: item.api_id,
                          cover_url: item.cover_url,
                          creator: item.creator,
                        });
                      }}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg shadow-md transition-all hover:scale-110"
                      style={{
                        background: "rgba(255,235,240,0.95)",
                        color: "#e05a7a",
                      }}
                    >
                      <Heart size={12} strokeWidth={3} />
                      <span className="text-[10px] font-bold">save</span>
                    </button>
                  </div>
                )}

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

                {item.instances.length > 1 && (
                  <div
                    className="absolute bottom-[4.5rem] right-2 z-10 px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest shadow-sm border border-white/60"
                    style={{
                      background: "rgba(255,255,255,0.85)",
                      color: meta.color,
                      backdropFilter: "blur(6px)",
                    }}
                  >
                    {verb} {item.instances.length}x
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
                      className="w-full aspect-[2/3] flex flex-col items-center justify-center gap-2 p-4 text-center bg-transparent"
                    >
                      <span className="text-4xl">{meta.emoji}</span>
                      <span
                        className="text-xs font-bold line-clamp-2"
                        style={{ color: meta.color }}
                      >
                        {item.title}
                      </span>
                    </div>
                  )}
                </div>

                <div className="p-2.5 pb-3">
                  <h4
                    className="font-bold text-xs truncate leading-snug line-clamp-2"
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

      {selectedItemForRating && (
        <RatingModal
          item={selectedItemForRating}
          category={list.category}
          onClose={() => setSelectedItemForRating(null)}
          onSaveSuccess={() => handleRatingSaved(selectedItemForRating)}
        />
      )}

      {selectedItemForSaving && (
        <AddToListModal
          item={selectedItemForSaving}
          onClose={() => setSelectedItemForSaving(null)}
          onSuccess={() => setSelectedItemForSaving(null)}
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