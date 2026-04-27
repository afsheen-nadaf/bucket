import { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";
import { Check, Plus, X } from "lucide-react";

const categoryConfig = {
  books: { bg: "bg-[#FAEEDA]", text: "text-[#633806]", emoji: "📖" },
  movies: { bg: "bg-[#FBEAF0]", text: "text-[#72243E]", emoji: "🎬" },
  music: { bg: "bg-[#EEEDFE]", text: "text-[#3C3489]", emoji: "🎵" },
  places: { bg: "bg-[#EAF3DE]", text: "text-[#27500A]", emoji: "📍" },
  default: { bg: "bg-[#E8EEF9]", text: "text-[#6495ED]", emoji: "✨" },
};

const glassStyle = {
  background: "rgba(255,255,255,0.72)",
  backdropFilter: "blur(32px) saturate(200%)",
  border: "1.5px solid rgba(255,255,255,0.9)",
  boxShadow:
    "0 12px 48px rgba(80,100,200,0.18), 0 2px 8px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.98)",
};

export default function AddToListModal({ item, onClose, onSuccess }) {
  const navigate = useNavigate();
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addingId, setAddingId] = useState(null);
  const [addedId, setAddedId] = useState(null);

  const catStyle =
    categoryConfig[item.category?.toLowerCase()] || categoryConfig.default;

  useEffect(() => {
    fetchMyLists();

    const handleEsc = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  const fetchMyLists = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const res = await fetch("http://localhost:3001/api/lists/mine", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const data = await res.json();
      setLists(data.lists || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToList = async (listId) => {
    setAddingId(listId);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      await fetch(`http://localhost:3001/api/lists/${listId}/items`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          item_name: item.item_name,
          category: item.category,
          external_id: item.external_id,
          cover_url: item.cover_url, // Sending cover_url for the DB
          creator: item.creator, // Sending creator for the DB
        }),
      });

      setAddedId(listId);
      setTimeout(() => {
        onSuccess(item.external_id);
      }, 800);
    } catch (err) {
      console.error(err);
      setAddingId(null);
    }
  };

  const handleCreateNew = () => {
    navigate("/lists");
  };

  const applicableLists = lists.filter(
    (l) => l.category.toLowerCase() === item.category?.toLowerCase(),
  );

  const modalContent = (
    <>
      <style>{`
        @keyframes overlayIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp   { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        ${`nav, header, .navbar { display: none !important; }`}
      `}</style>
      <div
        className="fixed inset-0"
        style={{
          background: "rgba(255,255,255,0.15)",
          backdropFilter: "blur(24px) saturate(180%)",
          zIndex: 9999,
          animation: "overlayIn 0.2s ease both",
        }}
        onClick={onClose}
      />
      <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 lowercase pointer-events-none">
        <div
          className="w-full max-w-md p-8 rounded-[2rem] relative flex flex-col pointer-events-auto"
          style={{
            ...glassStyle,
            animation: "slideUp 0.25s ease both",
            maxHeight: "85vh",
            overflow: "auto",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-600"
          >
            <X size={16} strokeWidth={2.5} />
          </button>

          <div className="flex items-center gap-3 mb-6">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl shrink-0 ${catStyle.bg} border border-black/5`}
            >
              {catStyle.emoji}
            </div>
            <div>
              <h2 className="font-bold text-lg">{item.item_name}</h2>
              <span
                className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full inline-block mt-1 ${catStyle.bg} ${catStyle.text}`}
              >
                {item.category}
              </span>
            </div>
          </div>

          <h3 className="font-bold text-lg mb-4">add to a list</h3>

          {loading ? (
            <div className="text-center py-6 animate-pulse text-sm opacity-60">
              loading lists...
            </div>
          ) : (
            <div className="flex flex-col gap-3 mb-6">
              {applicableLists.length > 0 ? (
                applicableLists.map((list) => {
                  const categoryColor =
                    categoryConfig[list.category?.toLowerCase()]?.bg ||
                    categoryConfig.default.bg;
                  const categoryText =
                    categoryConfig[list.category?.toLowerCase()]?.text ||
                    categoryConfig.default.text;
                  const categoryEmoji =
                    categoryConfig[list.category?.toLowerCase()]?.emoji ||
                    categoryConfig.default.emoji;
                  return (
                    <button
                      key={list.id}
                      onClick={() => handleSaveToList(list.id)}
                      disabled={addingId === list.id || addedId === list.id}
                      className="flex items-center justify-between px-4 py-3 rounded-full transition-all text-left group disabled:opacity-70"
                      style={{
                        background:
                          addedId === list.id ? "#dcfce7" : categoryColor,
                      }}
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="text-lg flex-shrink-0">
                          {categoryEmoji}
                        </span>
                        <div className="min-w-0">
                          <p className="font-bold text-sm truncate">
                            {list.title}
                          </p>
                          <p className="text-xs opacity-70 font-medium">
                            {list.item_count} items
                          </p>
                        </div>
                      </div>

                      <div className="w-6 h-6 flex items-center justify-center flex-shrink-0 ml-2">
                        {addedId === list.id ? (
                          <div className="text-[#27500A] flex items-center justify-center animate-fade-in">
                            <Check size={16} strokeWidth={3} />
                          </div>
                        ) : addingId === list.id ? (
                          <div className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin opacity-70"></div>
                        ) : (
                          <Plus
                            size={16}
                            strokeWidth={3}
                            className="opacity-50 group-hover:opacity-100 transition-opacity"
                          />
                        )}
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="text-center text-sm py-4 opacity-60">
                  no existing lists for this category.
                </div>
              )}
            </div>
          )}

          <button
            onClick={handleCreateNew}
            type="button"
            className="w-full font-bold py-4 rounded-xl text-white shadow-xl flex items-center justify-center gap-2 text-sm font-poppins transition-all hover:scale-105 active:scale-95"
            style={{
              background: "linear-gradient(135deg, #6495ed 0%, #8b6cf7 100%)",
            }}
          >
            <Plus size={16} strokeWidth={2.5} />
            create a new list
          </button>
        </div>
      </div>
    </>
  );

  return ReactDOM.createPortal(modalContent, document.body);
}
