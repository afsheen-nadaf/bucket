import { useState, useEffect } from "react";
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

  return (
    <div
      className="fixed inset-0 z-50 bg-ink/60 backdrop-blur-sm flex items-center justify-center p-4 lowercase animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-[20px] w-full max-w-[420px] shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Preview */}
        <div className="flex justify-between items-center p-6 border-b border-warmGray/10 bg-cream/30 relative">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 text-warmGray hover:text-ink transition-colors p-2 bg-cream rounded-full z-10"
          >
            <X size={20} />
          </button>
          <div className="flex items-center gap-4">
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shrink-0 ${catStyle.bg} border border-black/5`}
            >
              {catStyle.emoji}
            </div>
            <div className="overflow-hidden pr-8">
              <h3 className="font-poppins font-bold text-lg text-ink truncate">
                {item.item_name}
              </h3>
              <span
                className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full inline-block mt-1 ${catStyle.bg} ${catStyle.text}`}
              >
                {item.category}
              </span>
            </div>
          </div>
        </div>

        {/* List Selection */}
        <div className="flex-1 overflow-y-auto p-6">
          <h2 className="font-sniglet font-extrabold text-2xl text-ink mb-4">
            add to a list
          </h2>

          {loading ? (
            <div className="text-warmGray text-sm text-center py-6 animate-pulse">
              loading lists...
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {applicableLists.length > 0 ? (
                applicableLists.map((list) => (
                  <button
                    key={list.id}
                    onClick={() => handleSaveToList(list.id)}
                    disabled={addingId === list.id || addedId === list.id}
                    className="flex items-center justify-between p-4 rounded-2xl border border-warmGray/10 hover:border-cornflower/30 hover:bg-lightTint/30 transition-all text-left group disabled:opacity-80"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${catStyle.bg} border border-black/5`}
                      >
                        {catStyle.emoji}
                      </div>
                      <div>
                        <p className="font-bold text-ink group-hover:text-cornflower transition-colors truncate">
                          {list.title}
                        </p>
                        <p className="text-xs text-warmGray font-medium">
                          {list.item_count} items
                        </p>
                      </div>
                    </div>

                    <div className="w-8 h-8 rounded-full flex items-center justify-center">
                      {addedId === list.id ? (
                        <div className="bg-green-100 text-[#27500A] w-full h-full rounded-full flex items-center justify-center animate-fade-in">
                          <Check size={18} strokeWidth={3} />
                        </div>
                      ) : addingId === list.id ? (
                        <div className="w-4 h-4 rounded-full border-2 border-cornflower border-t-transparent animate-spin"></div>
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-cream group-hover:bg-cornflower text-transparent group-hover:text-white transition-colors flex items-center justify-center">
                          <Plus size={18} strokeWidth={3} />
                        </div>
                      )}
                    </div>
                  </button>
                ))
              ) : (
                <div className="text-warmGray/70 text-sm py-4 italic text-center bg-cream/50 rounded-2xl border border-warmGray/10">
                  no existing lists for this category.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Create New Action */}
        <div className="p-4 border-t border-warmGray/10 bg-white">
          <button
            onClick={handleCreateNew}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl border-2 border-dashed border-warmGray/30 text-warmGray hover:text-ink hover:border-ink hover:bg-cream/50 transition-all font-bold text-sm"
          >
            <Plus size={18} />
            create a new list
          </button>
        </div>
      </div>
    </div>
  );
}
