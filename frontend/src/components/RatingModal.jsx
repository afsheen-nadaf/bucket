import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { X, Star } from "lucide-react";

export default function RatingModal({ item, category, onClose }) {
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");
  const [hoveredStar, setHoveredStar] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [friends, setFriends] = useState([]);
  const [selectedFriends, setSelectedFriends] = useState([]);

  useEffect(() => {
    fetchExistingRating();
    fetchFriends();
  }, [item]);

  const fetchExistingRating = async () => {
    const itemId = item.external_id || item.api_id;

    const { data } = await supabase
      .from("ratings")
      .select("*")
      .eq("user_id", user.id)
      .eq("api_id", itemId)
      .maybeSingle();

    if (data) {
      setRating(data.rating || 0);
      setReview(data.review || "");
    }
  };

  const fetchFriends = async () => {
    const { data } = await supabase
      .from("friends")
      .select("*")
      .or(`requester_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .eq("status", "accepted");

    if (!data?.length) return;

    const ids = data.map((f) =>
      f.requester_id === user.id ? f.receiver_id : f.requester_id,
    );
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, username, avatar_url")
      .in("id", ids);

    setFriends(profiles || []);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    const itemId = item.external_id || item.api_id;
    const itemTitle = item.item_name || item.title;

    const payload = {
      user_id: user.id,
      api_id: itemId,
      title: itemTitle,
      cover_url: item.cover_url,
      category: category,
      rating: rating > 0 ? rating : null,
      review,
    };

    const { data: existing } = await supabase
      .from("ratings")
      .select("id")
      .eq("user_id", user.id)
      .eq("api_id", itemId)
      .maybeSingle();

    if (existing) {
      await supabase.from("ratings").update(payload).eq("id", existing.id);
    } else {
      await supabase.from("ratings").insert([payload]);
    }

    for (const friendId of selectedFriends) {
      try {
        await supabase.from("recommendations").insert({
          from_user_id: user.id,
          to_user_id: friendId,
          item_name: itemTitle,
          category: category,
          item_id: itemId,
        });
      } catch (err) {
        console.error("Recommendation insert error:", err);
      }
    }

    setIsSaving(false);
    onClose();
  };

  return (
    <>
      <style>{`
        @keyframes overlayIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp   { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        nav, header, .navbar { display: none !important; }
        .custom-scroll::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scroll::-webkit-scrollbar-track {
          background: transparent;
          margin-block: 1.5rem;
        }
        .custom-scroll::-webkit-scrollbar-thumb {
          background: rgba(100, 149, 237, 0.25);
          border-radius: 10px;
        }
        .custom-scroll::-webkit-scrollbar-thumb:hover {
          background: rgba(100, 149, 237, 0.45);
        }
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
          className="w-full max-w-md p-8 rounded-[2rem] relative flex flex-col pointer-events-auto max-h-[90vh] overflow-y-auto custom-scroll"
          style={{
            background: "rgba(255,255,255,0.72)",
            backdropFilter: "blur(32px) saturate(200%)",
            border: "1.5px solid rgba(255,255,255,0.9)",
            boxShadow:
              "0 12px 48px rgba(80,100,200,0.18), 0 2px 8px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.98)",
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
          <h2 className="text-2xl font-bold mb-6 font-poppins text-ink">
            rate & review
          </h2>

          <form onSubmit={handleSave} className="flex flex-col gap-4">
            {/* Item Info */}
            <div className="flex gap-4 mb-6">
              {item.cover_url ? (
                <img
                  src={item.cover_url}
                  alt={item.title}
                  className="w-16 h-24 object-cover rounded-xl shadow-md border border-white/50"
                />
              ) : (
                <div className="w-16 h-24 bg-black/5 rounded-xl border border-white/50"></div>
              )}
              <div className="flex flex-col justify-center">
                <p className="font-bold text-[#1a1a2e] text-lg leading-tight line-clamp-2">
                  {item.title}
                </p>
                <p className="text-xs text-[#1a1a2e]/60 mt-1">{item.creator}</p>
                {item.instances?.length > 1 && (
                  <span className="text-[10px] font-black uppercase tracking-widest mt-2 text-[#6495ed]">
                    re-logged (total: {item.instances.length}x)
                  </span>
                )}
              </div>
            </div>

            {/* Star Rating */}
            <div className="mb-6">
              <label className="block text-[11px] font-bold text-[#1a1a2e]/50 tracking-[0.2em] uppercase mb-3">
                your rating
              </label>
              <div className="flex gap-1.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onMouseEnter={() => setHoveredStar(star)}
                    onMouseLeave={() => setHoveredStar(0)}
                    onClick={() => setRating(star)}
                    className="p-1 transition-transform hover:scale-110 focus:outline-none"
                  >
                    <Star
                      size={32}
                      className={`transition-colors drop-shadow-sm ${
                        (hoveredStar || rating) >= star
                          ? "fill-[#6495ed] text-[#6495ed]"
                          : "text-[#1a1a2e]/20 fill-transparent"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Review Note */}
            <div className="mb-6">
              <label className="block text-[11px] font-bold text-[#1a1a2e]/50 tracking-[0.2em] uppercase mb-3">
                review / notes (optional)
              </label>
              <textarea
                rows="3"
                placeholder="what did you think?"
                className="w-full px-4 py-3 rounded-xl outline-none resize-none lowercase text-sm font-medium transition-all"
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
                value={review}
                onChange={(e) => setReview(e.target.value)}
              />
            </div>

            {/* Friend Recommendations */}
            {friends.length > 0 && (
              <div className="flex flex-col gap-2 mb-8">
                <label className="block text-[11px] font-bold text-[#1a1a2e]/50 tracking-[0.2em] uppercase mb-1">
                  recommend to
                </label>
                <div className="flex flex-wrap gap-2">
                  {friends.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() =>
                        setSelectedFriends((prev) =>
                          prev.includes(f.id)
                            ? prev.filter((id) => id !== f.id)
                            : [...prev, f.id],
                        )
                      }
                      className="px-3 py-1.5 rounded-full text-xs font-bold transition-all shadow-sm"
                      style={
                        selectedFriends.includes(f.id)
                          ? {
                              background: "#6495ed",
                              color: "white",
                              border: "1px solid #6495ed",
                            }
                          : {
                              background: "rgba(255,255,255,0.6)",
                              color: "#1a1a2e",
                              border: "1px solid rgba(0,0,0,0.08)",
                            }
                      }
                    >
                      @{f.username}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isSaving}
              className="w-full font-bold py-3 rounded-xl text-white shadow-lg flex items-center justify-center gap-2 text-sm mt-2 hover:opacity-90 transition-opacity disabled:opacity-50"
              style={{
                background: "linear-gradient(135deg, #6495ed 0%, #8b6cf7 100%)",
              }}
            >
              {isSaving ? "saving..." : "save rating"}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
