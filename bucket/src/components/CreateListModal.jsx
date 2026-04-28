import { useState } from "react";
import ReactDOM from "react-dom";
import { supabase } from "../lib/supabase";
import { X, Plus } from "lucide-react";

const glassStyle = {
  background: "rgba(255,255,255,0.72)",
  backdropFilter: "blur(32px) saturate(200%)",
  border: "1.5px solid rgba(255,255,255,0.9)",
  boxShadow:
    "0 12px 48px rgba(80,100,200,0.18), 0 2px 8px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.98)",
};

export default function CreateListModal({
  category,
  item,
  onClose,
  onSuccess,
}) {
  const [listTitle, setListTitle] = useState("");
  const [listDescription, setListDescription] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState(null);

  const handleCreateList = async (e) => {
    e.preventDefault();
    if (!listTitle.trim()) {
      setError("List title is required");
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("Not authenticated");
      }

      // Create the list using Supabase client
      const { data, error: listError } = await supabase
        .from("lists")
        .insert({
          title: listTitle,
          description: listDescription,
          category: category,
          user_id: user.id,
          is_public: false,
        })
        .select()
        .single();

      if (listError) {
        throw listError;
      }

      const newListId = data.id;

      // Add the item to the new list if provided
      if (item) {
        const { error: itemError } = await supabase.from("list_items").insert({
          list_id: newListId,
          api_id: item.external_id,
          title: item.item_name,
          cover_url: item.cover_url,
          creator: item.creator,
        });

        if (itemError) {
          console.error("Error adding item to list:", itemError);
        }
      }

      onSuccess();
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setIsCreating(false);
    }
  };

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
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-600"
          >
            <X size={16} strokeWidth={2.5} />
          </button>

          <h2 className="font-bold text-xl mb-6">create a new list</h2>

          <form onSubmit={handleCreateList} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label
                className="text-xs font-bold uppercase tracking-wide"
                style={{ color: "rgba(26,26,46,0.6)" }}
              >
                List Title
              </label>
              <input
                type="text"
                required
                autoFocus
                value={listTitle}
                onChange={(e) => setListTitle(e.target.value)}
                placeholder="e.g., Summer Reading 2024"
                className="px-4 py-3 rounded-xl outline-none text-sm font-medium transition-all"
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
            </div>

            <div className="flex flex-col gap-2">
              <label
                className="text-xs font-bold uppercase tracking-wide"
                style={{ color: "rgba(26,26,46,0.6)" }}
              >
                Description (optional)
              </label>
              <textarea
                value={listDescription}
                onChange={(e) => setListDescription(e.target.value)}
                placeholder="Add notes about this list..."
                rows={3}
                className="px-4 py-3 rounded-xl outline-none text-sm font-medium transition-all resize-none"
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
            </div>

            {error && (
              <div
                className="px-4 py-3 rounded-xl text-xs font-medium"
                style={{
                  background: "rgba(220, 38, 38, 0.1)",
                  color: "#dc2626",
                }}
              >
                {error}
              </div>
            )}

            <div className="flex gap-3 mt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3 text-sm font-bold rounded-xl transition-all"
                style={{ color: "rgba(26,26,46,0.5)" }}
              >
                cancel
              </button>
              <button
                type="submit"
                disabled={isCreating}
                className="flex-1 px-4 py-3 rounded-xl text-white text-sm font-bold flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 shadow-lg"
                style={{
                  background:
                    "linear-gradient(135deg, #6495ed 0%, #8b6cf7 100%)",
                  boxShadow: "0 6px 20px rgba(100,149,237,0.35)",
                }}
              >
                <Plus size={16} strokeWidth={2.5} />
                {isCreating ? "creating..." : "create list"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );

  return ReactDOM.createPortal(modalContent, document.body);
}
