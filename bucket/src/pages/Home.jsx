import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { Link } from "react-router-dom";
import { Star, List as ListIcon, UserPlus, Clock } from "lucide-react";
import RecsStrip from "../components/RecsStrip";

// Avatar gradient cycles
const avatarGradients = [
  "from-violet-400 to-teal-300",
  "from-pink-400 to-orange-300",
  "from-sky-400 to-indigo-300",
  "from-emerald-400 to-cyan-300",
  "from-rose-400 to-pink-300",
];

function getAvatarGradient(userId = "") {
  return avatarGradients[userId.charCodeAt(0) % avatarGradients.length];
}

function getInitials(username = "") {
  return username.slice(0, 2).toUpperCase();
}

function getDateLabel(dateString) {
  const days = Math.floor(
    (new Date() - new Date(dateString)) / (1000 * 60 * 60 * 24),
  );
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 7) return `${days} days ago`;
  return new Date(dateString).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
  });
}

function timeAgo(dateString) {
  const mins = Math.floor((new Date() - new Date(dateString)) / (1000 * 60));
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "yesterday";
  return `${days}d ago`;
}

const categoryBadge = {
  books: "bg-amber-100/60 text-amber-700 ring-1 ring-amber-300/40",
  movies: "bg-pink-100/60 text-pink-700 ring-1 ring-pink-300/40",
  music: "bg-purple-100/60 text-purple-700 ring-1 ring-purple-300/40",
  places: "bg-green-100/60 text-green-700 ring-1 ring-green-300/40",
};

export default function Home() {
  const { user } = useAuth();
  const [feed, setFeed] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchFeed();
  }, [user]);

  const fetchFeed = async () => {
    setLoading(true);

    // 1. Get accepted friend IDs
    const { data: friendsData } = await supabase
      .from("friends")
      .select("*")
      .or(`requester_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .eq("status", "accepted");

    if (!friendsData || friendsData.length === 0) {
      setFeed([]);
      setLoading(false);
      return;
    }

    const friendIds = friendsData.map((f) =>
      f.requester_id === user.id ? f.receiver_id : f.requester_id,
    );

    // 2. Fetch friend profiles
    const { data: profiles } = await supabase
      .from("profiles")
      .select("*")
      .in("id", friendIds);
    const profileMap = (profiles || []).reduce(
      (acc, p) => ({ ...acc, [p.id]: p }),
      {},
    );

    // 3. Fetch recent ratings
    const { data: ratings } = await supabase
      .from("ratings")
      .select("*")
      .in("user_id", friendIds)
      .order("created_at", { ascending: false })
      .limit(20);

    // 4. Fetch recent public lists
    const { data: lists } = await supabase
      .from("lists")
      .select("*")
      .in("user_id", friendIds)
      .eq("is_public", true)
      .order("created_at", { ascending: false })
      .limit(20);

    // 5. Combine, sort, slice
    const combinedFeed = [
      ...(ratings || []).map((r) => ({
        ...r,
        feedType: "rating",
        profile: profileMap[r.user_id],
      })),
      ...(lists || []).map((l) => ({
        ...l,
        feedType: "list",
        profile: profileMap[l.user_id],
      })),
    ]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 30);

    setFeed(combinedFeed);
    setLoading(false);
  };

  const groupedFeed = feed.reduce((acc, item) => {
    const label = getDateLabel(item.created_at);
    if (!acc[label]) acc[label] = [];
    acc[label].push(item);
    return acc;
  }, {});

  const badgeClass = (category) =>
    categoryBadge[category?.toLowerCase()] ??
    "bg-white/40 text-cornflower ring-1 ring-cornflower/30";

  return (
    <div className="max-w-2xl mx-auto animate-fade-in lowercase relative">
      <div className="relative z-10">
        <RecsStrip />

        {/* Page header */}
        <h1 className="font-poppins text-3xl font-semibold text-white tracking-tight text-center mt-6 mb-8 drop-shadow-sm">
          lately in your world
        </h1>

        {loading ? (
          <div className="text-center py-16 text-warmGray/70 font-medium text-sm">
            loading activity...
          </div>
        ) : feed.length === 0 ? (
          /* ── Empty state ── */
          <div
            className="rounded-[2rem] p-12 text-center border border-white/50"
            style={{
              background: "rgba(255,255,255,0.35)",
              backdropFilter: "blur(20px)",
            }}
          >
            <div className="w-20 h-20 bg-white/40 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/60">
              <Clock size={36} className="text-cornflower" />
            </div>
            <h2 className="font-poppins text-2xl font-extrabold text-ink mb-3">
              it's quiet in here
            </h2>
            <p className="text-ink/60 max-w-xs mx-auto mb-8 text-sm leading-relaxed">
              your feed shows ratings and public lists from friends. add some to
              see what they're tracking!
            </p>
            <Link
              to="/profile?tab=friends"
              className="inline-flex items-center gap-2 bg-cornflower hover:opacity-90 text-white font-bold text-sm px-7 py-3 rounded-full transition-all hover:scale-105 shadow-sm"
            >
              <UserPlus size={16} /> find friends
            </Link>
          </div>
        ) : (
          /* ── Feed timeline ── */
          <div className="flex flex-col gap-1 pb-10">
            {Object.entries(groupedFeed).map(([dateLabel, items]) => (
              <div key={dateLabel}>
                {/* Date divider */}
                <div className="flex items-center gap-3 my-5">
                  <div className="flex-1 h-px bg-white/50" />
                  <span className="text-xs text-ink/40 font-medium tracking-wide font-poppins">
                    {dateLabel}
                  </span>
                  <div className="flex-1 h-px bg-white/50" />
                </div>

                <div className="flex flex-col gap-3">
                  {items.map((item) => (
                    <FeedCard
                      key={`${item.feedType}-${item.id}`}
                      item={item}
                      badgeClass={badgeClass}
                    />
                  ))}
                </div>
              </div>
            ))}

            {/* Find friends CTA */}
            <div className="flex justify-center pt-6">
              <Link
                to="/profile?tab=friends"
                className="inline-flex items-center gap-2 text-sm font-bold text-white px-7 py-3 rounded-full transition-all hover:scale-105 hover:opacity-90 border border-white/30"
                style={{
                  background: "rgba(90, 100, 230, 0.8)",
                  backdropFilter: "blur(8px)",
                }}
              >
                <UserPlus size={16} /> find friends
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Feed card ── */
function FeedCard({ item, badgeClass }) {
  const username = item.profile?.username ?? "unknown";
  const userId = item.profile?.id ?? "";
  const gradient = getAvatarGradient(userId);
  const initials = getInitials(username);

  return (
    <div
      className="rounded-[1.25rem] p-4 border border-white/70 transition-transform duration-200 hover:-translate-y-0.5"
      style={{
        background: "rgba(255,255,255,0.45)",
        backdropFilter: "blur(16px)",
      }}
    >
      {/* Card header */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        {/* Avatar */}
        <div
          className={`w-7 h-7 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center shrink-0`}
        >
          <span className="text-white text-[10px] font-bold font-poppins">
            {initials}
          </span>
        </div>

        {/* Username + action */}
        <div className="flex flex-wrap items-center gap-x-1 gap-y-0.5 text-sm flex-1 min-w-0">
          <Link
            to={`/u/${username}`}
            className="font-semibold text-cornflower hover:underline underline-offset-2 decoration-cornflower/40 shrink-0"
          >
            @{username}
          </Link>
          <span className="text-ink/50 font-poppins text-xs">
            {item.feedType === "rating" ? (
              <>
                rated{" "}
                <span className="text-ink/80 font-semibold">
                  {item.item_name || item.title || "an item"}
                </span>
                {item.list_title && (
                  <span className="text-ink/40"> from "{item.list_title}"</span>
                )}
              </>
            ) : (
              <>
                created a list{" "}
                <span className="text-ink/80 font-semibold">
                  "{item.title}"
                </span>
              </>
            )}
          </span>
        </div>

        {/* Timestamp pill */}
        <span
          className="shrink-0 flex items-center gap-1 text-[10px] text-ink/40 px-2.5 py-1 rounded-full border border-white/60 font-poppins"
          style={{ background: "rgba(255,255,255,0.5)" }}
        >
          <Clock size={9} />
          {timeAgo(item.created_at)}
        </span>
      </div>

      {/* Card body */}
      {item.feedType === "rating" ? (
        <RatingInner item={item} badgeClass={badgeClass} />
      ) : (
        <ListInner item={item} badgeClass={badgeClass} />
      )}
    </div>
  );
}

/* ── Rating inner ── */
function RatingInner({ item, badgeClass }) {
  return (
    <div
      className="rounded-2xl p-4 border border-white/60"
      style={{ background: "rgba(255,255,255,0.5)" }}
    >
      <div className="flex justify-between items-center mb-2.5">
        <span
          className={`text-[10px] font-semibold px-2.5 py-1 rounded-full font-poppins ${badgeClass(item.category)}`}
        >
          {item.category}
        </span>
        <div className="flex items-center gap-0.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              size={13}
              className={
                i < item.rating
                  ? "fill-amber-400 text-amber-400"
                  : "fill-transparent text-black/15"
              }
            />
          ))}
        </div>
      </div>
      <h3 className="font-poppins font-semibold text-ink text-[15px] leading-snug mb-1">
        {item.item_name || item.title || "unknown item"}
      </h3>
      {item.review && (
        <p className="text-ink/50 text-xs italic leading-relaxed font-poppins">
          "{item.review}"
        </p>
      )}
    </div>
  );
}

/* ── List inner ── */
function ListInner({ item, badgeClass }) {
  return (
    <Link
      to={`/lists/${item.id}`}
      className="block rounded-2xl p-4 border border-white/60 transition-colors group hover:bg-white/20"
      style={{ background: "rgba(255,255,255,0.5)" }}
    >
      <div className="flex items-center gap-3 mb-2">
        <div className="w-9 h-9 rounded-xl bg-cornflower/10 border border-cornflower/20 flex items-center justify-center shrink-0 group-hover:bg-cornflower/20 transition-colors">
          <ListIcon size={17} className="text-cornflower" />
        </div>
        <h3 className="font-poppins font-semibold text-ink text-[15px] leading-snug">
          {item.title}
        </h3>
      </div>
      <span
        className={`text-[10px] font-semibold px-2.5 py-1 rounded-full inline-block mb-2 font-poppins ${badgeClass(item.category)}`}
      >
        {item.category}
      </span>
      {item.description && (
        <p className="text-ink/50 text-xs leading-relaxed line-clamp-2 font-poppins">
          {item.description}
        </p>
      )}
    </Link>
  );
}
