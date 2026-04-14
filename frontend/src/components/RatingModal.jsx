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

  useEffect(() => {
    fetchExistingRating();
  }, [item]);

  const fetchExistingRating = async () => {
    // Determine the ID based on where the item came from (Search vs Feed)
    const itemId = item.external_id || item.api_id;

    const { data } = await supabase
      .from("ratings")
      .select("*")
      .eq("user_id", user.id)
      .eq("api_id", itemId) // Your DB uses api_id
      .maybeSingle(); // <-- CRITICAL EXAM KNOWLEDGE: Use maybeSingle() when 0 rows is an acceptable outcome!

    if (data) {
      setRating(data.rating || 0);
      setReview(data.review || "");
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    const itemId = item.external_id || item.api_id;
    const itemTitle = item.item_name || item.title;

    const payload = {
      user_id: user.id,
      api_id: itemId, // Your DB uses api_id
      title: itemTitle, // Your DB uses title
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

    setIsSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-ink/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-lg border border-warmGray/20 overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-warmGray/10 bg-cream/30">
          <h3 className="font-sniglet text-xl text-ink font-bold">
            rate & review
          </h3>
          <button
            onClick={onClose}
            className="text-warmGray hover:text-ink transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6">
          {/* Item Info */}
          <div className="flex gap-4 mb-6">
            {item.cover_url ? (
              <img
                src={item.cover_url}
                alt={item.title}
                className="w-16 h-24 object-cover rounded-md shadow-sm"
              />
            ) : (
              <div className="w-16 h-24 bg-warmGray/10 rounded-md"></div>
            )}
            <div>
              <p className="font-bold text-ink text-lg">{item.title}</p>
              <p className="text-sm text-warmGray">{item.creator}</p>
            </div>
          </div>

          {/* Star Rating */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-warmGray mb-2 lowercase">
              your rating
            </label>
            <div className="flex gap-1">
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
                    className={`transition-colors ${(hoveredStar || rating) >= star ? "fill-cornflower text-cornflower" : "text-warmGray/30 fill-transparent"}`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Review Note */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-warmGray mb-2 lowercase">
              review / notes (optional)
            </label>
            <textarea
              rows="3"
              placeholder="what did you think?"
              className="w-full px-4 py-3 rounded-xl border border-warmGray/30 bg-cream/50 focus:border-cornflower focus:ring-1 focus:ring-cornflower outline-none resize-none lowercase"
              value={review}
              onChange={(e) => setReview(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="w-full bg-ink hover:bg-ink/90 text-white font-medium py-3 rounded-xl transition-colors lowercase"
          >
            {isSaving ? "saving..." : "save rating"}
          </button>
        </form>
      </div>
    </div>
  );
}
