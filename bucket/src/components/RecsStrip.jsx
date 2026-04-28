import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { Sparkles, HeartCrack, Heart } from "lucide-react";
import AddToListModal from "./AddToListModal";
import TiltedCard from "./TiltedCard";

const categoryConfig = {
  books: { bg: "bg-[#FAEEDA]", text: "text-[#633806]", emoji: "📖" },
  movies: { bg: "bg-[#FBEAF0]", text: "text-[#72243E]", emoji: "🎬" },
  music: { bg: "bg-[#EEEDFE]", text: "text-[#3C3489]", emoji: "🎵" },
  places: { bg: "bg-[#EAF3DE]", text: "text-[#27500A]", emoji: "📍" },
  default: { bg: "bg-[#E8EEF9]", text: "text-[#6495ED]", emoji: "✨" },
};

export default function RecsStrip() {
  const [recs, setRecs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [debugError, setDebugError] = useState(null);
  const [dismissingId, setDismissingId] = useState(null);
  const [savingId, setSavingId] = useState(null);
  const [selectedRec, setSelectedRec] = useState(null);

  // Track window width to dynamically calculate maximum card spread
  const [screenWidth, setScreenWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1200,
  );

  useEffect(() => {
    const handleResize = () => setScreenWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    fetchRecs();
  }, []);

  const fetchRecs = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;
      const res = await fetch(
        "http://import.meta.env.VITE_API_URL/api/recommendations",
        {
          headers: { Authorization: `Bearer ${session.access_token}` },
        },
      );
      const data = await res.json();
      if (data.error) {
        setDebugError(data.error);
        setRecs([]);
      } else {
        setRecs(data.recommendations || []);
      }
    } catch (err) {
      console.error(err);
      setDebugError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = async (rec) => {
    setDismissingId(rec.external_id);
    if (!rec.isDummy) {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        await fetch("http://import.meta.env.VITE_API_URL/api/dismissed-recs", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            external_id: rec.external_id,
            item_name: rec.item_name,
          }),
        });
      } catch (err) {
        console.error(err);
      }
    }

    setTimeout(() => {
      setRecs((prev) => prev.filter((r) => r.external_id !== rec.external_id));
      setDismissingId(null);
    }, 400);
  };

  const handleSaveSuccess = (external_id) => {
    setSelectedRec(null);
    setSavingId(external_id);
    setTimeout(() => {
      setRecs((prev) => prev.filter((r) => r.external_id !== external_id));
      setSavingId(null);
    }, 400);
  };

  const glassStyle = {
    background: "rgba(210, 225, 255, 0.88)",
    backdropFilter: "blur(24px) saturate(180%)",
    WebkitBackdropFilter: "blur(24px) saturate(180%)",
    border: "1.5px solid rgba(255,255,255,0.85)",
    boxShadow:
      "0 8px 32px rgba(100,149,237,0.22), 0 2px 8px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.95)",
  };

  const displayRecs = [...recs];
  const showDots = !loading && displayRecs.length > 2;

  // --- DYNAMIC EDGE-TO-EDGE SPACING ALGORITHM ---
  const activeCardsCount = displayRecs.length;
  const maxDepth = Math.ceil((activeCardsCount - 1) / 2);

  // Calculate the maximum X distance the furthest card can travel from the center of the screen
  const marginFromEdge = 20;
  const halfCardWidth = 155; // 310px wide card
  const maxSpread = Math.max(
    80,
    screenWidth / 2 - halfCardWidth - marginFromEdge,
  );

  // TIGHT DECK LOGIC: Cap the maximum gap at 100px so few cards stay tightly overlapped.
  // As cards increase, they spread outwards until they hit maxSpread, then the gap compresses.
  const baseGap = 100;
  const dynamicGap =
    maxDepth > 0 ? Math.min(baseGap, maxSpread / maxDepth) : baseGap;

  // Refined scaling and opacity so tight decks don't fade out too drastically
  const baseScaleDrop = 0.06;
  const dynamicScaleDrop =
    maxDepth > 0 ? Math.min(baseScaleDrop, 0.4 / maxDepth) : baseScaleDrop;

  const baseOpacityDrop = 0.12;
  const dynamicOpacityDrop =
    maxDepth > 0 ? Math.min(baseOpacityDrop, 0.6 / maxDepth) : baseOpacityDrop;

  return (
    // BREAKOUT: Used w-screen and left-1/2 -translate-x-1/2 to break out of the parent's width constraints!
    <div className="mb-14 w-screen relative left-1/2 -translate-x-1/2 lowercase flex flex-col items-center overflow-hidden">
      {/* Circular aura blobs */}
      <div
        className="absolute pointer-events-none -z-10"
        style={{
          width: "520px",
          height: "520px",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          background:
            "radial-gradient(circle, rgba(100,149,237,0.28) 0%, rgba(100,149,237,0.10) 45%, transparent 70%)",
          borderRadius: "50%",
        }}
      />
      <div
        className="absolute pointer-events-none -z-10"
        style={{
          width: "320px",
          height: "320px",
          top: "40%",
          left: "60%",
          transform: "translate(-50%, -50%)",
          background:
            "radial-gradient(circle, rgba(255,182,193,0.22) 0%, transparent 65%)",
          borderRadius: "50%",
        }}
      />

      {/* Section Header */}
      <div className="flex items-center justify-center gap-2 mb-10 px-2 text-center">
        <Sparkles size={28} className="text-white drop-shadow-sm" />
        <h2 className="text-2xl font-poppins font-semibold text-white tracking-wide drop-shadow-sm">
          we think you'll love
        </h2>
      </div>

      {/* Edge-to-Edge Deck Container (Removed max-w constraint) */}
      <div className="relative w-full h-[520px] mx-auto perspective-1000 flex justify-center">
        {loading ? (
          /* Render 7 skeletons to show off the fanning state while loading */
          Array.from({ length: 7 }).map((_, i) => {
            const depth = Math.ceil(i / 2);
            const dir = i % 2 === 1 ? 1 : -1;

            const skeletonMaxDepth = 3;
            const skeletonGap = Math.min(baseGap, maxSpread / skeletonMaxDepth);
            const skeletonScaleDrop = Math.min(
              baseScaleDrop,
              0.4 / skeletonMaxDepth,
            );

            const xOffset = i === 0 ? 0 : dir * (depth * skeletonGap);
            const scaleVal = i === 0 ? 1 : 1 - depth * skeletonScaleDrop;

            return (
              <div
                key={`skeleton-${i}`}
                className="absolute top-0 left-0 right-0 mx-auto w-[310px] h-[460px] rounded-[28px] animate-pulse flex flex-col items-center origin-center p-5"
                style={{
                  ...glassStyle,
                  zIndex: 10 - depth,
                  transform: `translateX(${xOffset}px) scale(${scaleVal})`,
                  opacity: i === 0 ? 1 : 1 - depth * baseOpacityDrop,
                }}
              >
                <div className="w-full h-48 bg-cornflower/15 rounded-xl mb-5" />
                <div className="w-20 h-5 bg-cornflower/20 rounded-full mb-3" />
                <div className="w-3/4 h-6 bg-ink/10 rounded-xl mb-2" />
                <div className="w-1/2 h-3 bg-ink/10 rounded-full mb-2" />
                <div className="w-2/3 h-3 bg-ink/8 rounded-full" />
              </div>
            );
          })
        ) : displayRecs.length === 0 ? (
          <div
            className="absolute top-0 left-0 right-0 mx-auto w-[310px] h-[460px] flex flex-col items-center justify-center text-center p-6 rounded-[28px] border-dashed border-2 border-warmGray/20"
            style={glassStyle}
          >
            <Sparkles size={32} className="text-warmGray/40 mb-4" />
            <h3 className="text-xl font-poppins font-bold text-ink mb-2">
              you're all caught up!
            </h3>
            <p className="text-warmGray text-sm">
              check back later for more recommendations from your friends.
            </p>
          </div>
        ) : (
          displayRecs.map((rec, index) => {
            const catStyle =
              categoryConfig[rec.category?.toLowerCase()] ||
              categoryConfig.default;
            const isDismissing = dismissingId === rec.external_id;
            const isSaving = savingId === rec.external_id;
            const useEmoji =
              rec.category?.toLowerCase() === "places" || !rec.cover_url;
            const isTopCard = index === 0;

            // Horizontal Laid Out Math using our tighter base gap
            const depth = Math.ceil(index / 2);
            const dir = index % 2 === 1 ? 1 : -1;

            let transformStr = "";
            let opacityVal = 1;

            if (isDismissing) {
              transformStr = "translateX(-200%) scale(0.8) rotate(-10deg)";
              opacityVal = 0;
            } else if (isSaving) {
              transformStr = "translateX(200%) scale(0.8) rotate(10deg)";
              opacityVal = 0;
            } else {
              const xOffset = index === 0 ? 0 : dir * (depth * dynamicGap);
              const scaleVal = index === 0 ? 1 : 1 - depth * dynamicScaleDrop;

              transformStr = `translateX(${xOffset}px) scale(${scaleVal})`;
              opacityVal = index === 0 ? 1 : 1 - depth * dynamicOpacityDrop;
            }

            return (
              <div
                key={rec.external_id}
                className="absolute top-0 left-0 right-0 mx-auto w-[310px] transition-all duration-500 ease-out origin-center"
                style={{
                  zIndex: displayRecs.length - depth,
                  transform: transformStr,
                  opacity: opacityVal,
                  pointerEvents:
                    isTopCard && !isDismissing && !isSaving ? "auto" : "none",
                }}
              >
                <TiltedCard containerWidth="100%">
                  <div
                    className="w-full rounded-[28px] p-5 flex flex-col h-[460px] relative overflow-hidden"
                    style={glassStyle}
                  >
                    {/* Glossy shine strip */}
                    <div
                      className="absolute top-0 left-0 right-0 pointer-events-none rounded-t-[28px]"
                      style={{
                        height: "40%",
                        background:
                          "linear-gradient(180deg, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0) 100%)",
                        zIndex: 2,
                      }}
                    />

                    {/* Poster / Emoji */}
                    <div
                      className={`w-full h-48 rounded-[18px] overflow-hidden mb-4 flex-shrink-0 flex items-center justify-center relative z-10 ${
                        useEmoji ? catStyle.bg : ""
                      }`}
                      style={{
                        boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
                        background: useEmoji
                          ? undefined
                          : "rgba(180,200,255,0.3)",
                      }}
                    >
                      {useEmoji ? (
                        <span className="text-5xl drop-shadow-md">
                          {catStyle.emoji}
                        </span>
                      ) : (
                        <img
                          src={rec.cover_url}
                          alt={rec.item_name}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>

                    {/* Card Body */}
                    <div className="flex flex-col items-center text-center relative z-10 flex-1">
                      <span
                        className={`text-[10px] font-bold px-3 py-1 rounded-full inline-block mb-2 shadow-sm ${catStyle.bg} ${catStyle.text}`}
                      >
                        {catStyle.emoji} {rec.category}
                      </span>

                      <h3 className="font-poppins font-bold text-xl text-ink leading-tight mb-1 line-clamp-2">
                        {rec.item_name}
                      </h3>

                      <p className="text-xs font-semibold text-cornflower mb-1">
                        {rec.friend_label}
                      </p>

                      {rec.because_label && (
                        <p className="text-[10px] text-ink/50 italic mb-2">
                          {rec.because_label}
                        </p>
                      )}

                      {rec.review && (
                        <p className="text-sm italic line-clamp-2 text-ink/70 leading-relaxed">
                          "{rec.review}"
                        </p>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-center gap-3 mt-auto pt-3 relative z-10">
                      <button
                        onClick={() => handleDismiss(rec)}
                        className="flex items-center gap-1.5 px-5 py-2.5 rounded-full font-semibold text-xs text-ink/60 hover:text-ink transition-all duration-200 hover:scale-105 active:scale-95"
                        style={{
                          background: "rgba(255,255,255,0.55)",
                          border: "1.5px solid rgba(255,255,255,0.85)",
                          backdropFilter: "blur(8px)",
                          WebkitBackdropFilter: "blur(8px)",
                          boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
                        }}
                        title="Not for me"
                      >
                        <HeartCrack size={15} strokeWidth={2.5} />
                        not for me
                      </button>

                      <button
                        onClick={() => setSelectedRec(rec)}
                        className="flex items-center gap-1.5 px-5 py-2.5 rounded-full font-semibold text-xs text-[#e05a7a] hover:text-[#c0395a] transition-all duration-200 hover:scale-105 active:scale-95"
                        style={{
                          background: "rgba(255,235,240,0.70)",
                          border: "1.5px solid rgba(224,90,122,0.30)",
                          backdropFilter: "blur(8px)",
                          WebkitBackdropFilter: "blur(8px)",
                          boxShadow: "0 2px 10px rgba(224,90,122,0.10)",
                        }}
                        title="Save to List"
                      >
                        <Heart size={15} strokeWidth={2.5} />
                        save to list
                      </button>
                    </div>
                  </div>
                </TiltedCard>
              </div>
            );
          })
        )}
      </div>

      {/* Dot indicator */}
      {showDots && (
        <div className="flex items-center gap-1.5 mt-4">
          {displayRecs
            .slice(0, Math.min(displayRecs.length, 10))
            .map((_, i) => (
              <div
                key={i}
                className="rounded-full transition-all duration-300"
                style={{
                  width: i === 0 ? "18px" : "6px",
                  height: "6px",
                  background: i === 0 ? "#6495ED" : "#c8d4f5",
                }}
              />
            ))}
        </div>
      )}

      {selectedRec && (
        <AddToListModal
          item={selectedRec}
          onClose={() => setSelectedRec(null)}
          onSuccess={handleSaveSuccess}
        />
      )}
    </div>
  );
}
