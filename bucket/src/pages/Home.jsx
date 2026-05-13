import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { Link } from "react-router-dom";
import {
  Star,
  List as ListIcon,
  UserPlus,
  Clock,
  Heart,
  MessageCircle,
  Send,
  X,
  Loader,
} from "lucide-react";
import RecsStrip from "../components/RecsStrip";

// Avatar gradient cycles
const avatarGradients = [
  "from-violet-400 to-teal-300",
  "from-pink-400 to-orange-300",
  "from-sky-400 to-indigo-300",
  "from-emerald-400 to-cyan-300",
  "from-rose-400 to-pink-300",
];

// Get a consistent gradient based on user ID char code at 0 so that the same user has the same avatar gradient everywhere in the app
function getAvatarGradient(userId = "") {
  // % operator to cycle through the gradients array based on the char code of the first character of the user ID (or 0 if userId is empty)
  return avatarGradients[userId.charCodeAt(0) % avatarGradients.length];
}

// Gets the first 2 letters of the username for avatar initials and converts to uppercase
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

// Format the dynamic text verb depending on the category
function getActionText(category) {
  switch (category?.toLowerCase()) {
    case "movies":
      return "watched and rated";
    case "shows":
      return "watched and rated";
    case "books":
      return "read and rated";
    case "music":
      return "listened to and rated";
    case "places":
      return "visited";
    default:
      return "rated";
  }
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

  // Fetch the feed on mount and whenever the user changes (e.g. login/logout)
  useEffect(() => {
    if (user) fetchFeed();
  }, [user]);

  // Fetch recent ratings and public lists from friends and combine into a single feed sorted by created_at
  const fetchFeed = async () => {
    setLoading(true);

    // 1. Get accepted friend IDs
    const { data: friendsData } = await supabase
      .from("friends")
      .select("*")
      // .or is needed to get rows where the user is either the requester or receiver of the friendship
      .or(`requester_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .eq("status", "accepted");

    if (!friendsData || friendsData.length === 0) {
      setFeed([]);
      setLoading(false);
      return;
    }

    // map through the friendsData to extract the friend IDs by checking if the user matches requester or receiver
    const friendIds = friendsData.map((f) =>
      f.requester_id === user.id ? f.receiver_id : f.requester_id,
    );

    // 2. Fetch friend profiles
    const { data: profiles } = await supabase
      .from("profiles")
      .select("*")
      .in("id", friendIds);
    // use reduce to create a map of profile data keyed by user ID for easy lookup later when combining the feed items
    const profileMap = (profiles || []).reduce(
      // use p.id as the key and the entire profile object as the value
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
      // sort by created_at descending to show the most recent activity first
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      // slice to the top 30 most recent items to limit the feed length for performance and UX reasons
      .slice(0, 30);

    // set the combined feed into state and turn off loading
    setFeed(combinedFeed);
    setLoading(false);
  };

  // Group feed items by date for display purposes (e.g. "today", "yesterday", "3 days ago", or a date string for older items)
  const groupedFeed = feed.reduce((acc, item) => {
    // getDateLabel is a helper function that converts the created_at timestamp into a human-friendly label
    const label = getDateLabel(item.created_at);
    // if the label doesn't exist in the accumulator object yet, create it with an empty array, then push the current item into the appropriate date group
    if (!acc[label]) acc[label] = [];
    // label is the key in the accumulator object that corresponds to the date group, and we push the current feed item into that array
    acc[label].push(item);
    return acc;
  }, {});

  const badgeClass = (category) =>
    categoryBadge[category?.toLowerCase()] ??
    "bg-white/40 text-cornflower ring-1 ring-cornflower/30";

  return (
    <div className="max-w-2xl mx-auto animate-fade-in lowercase relative px-3 sm:px-4 md:px-6">
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
                      // use a combination of feedType and id as the key to ensure uniqueness across ratings and lists, since they come from different tables but could have overlapping IDs
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

      // Background gradient circles for some subtle visual interest
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

/* ── Feed card ── */
function FeedCard({ item, badgeClass }) {
  const { user } = useAuth();
  const username = item.profile?.username ?? "unknown";
  const userId = item.profile?.id ?? "";
  const gradient = getAvatarGradient(userId);
  const initials = getInitials(username);

  // Social state
  const targetId = item.api_id || item.id?.toString();
  const [likesCount, setLikesCount] = useState(0);
  const [hasLiked, setHasLiked] = useState(false);
  const [comments, setComments] = useState([]);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [isLiking, setIsLiking] = useState(false);
  const [isCommenting, setIsCommenting] = useState(false);

  // Fetch initial like and comment data for this feed item on mount
  useEffect(() => {
    const fetchSocial = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const token = session?.access_token;
        if (!token || !targetId) return;

        // fetch the like count, whether the current user has liked it, and the recent comments for this feed item from the custom API route, which in turn queries the database
        const response = await fetch(
          // targetId is either the api_id (for ratings) or the id (for lists), which is used by the backend to look up the corresponding recommendation and its social data
          `${import.meta.env.VITE_API_URL}/api/recommendations/${targetId}/social`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        if (response.ok) {
          const data = await response.json();
          setLikesCount(data.likeCount);
          setHasLiked(data.hasLiked);
          setComments(data.comments);
        }
      } catch (err) {
        console.error("Failed to fetch social data", err);
      }
    };
    fetchSocial();
  }, [targetId]);

  const toggleLike = async () => {
    if (isLiking) return;
    setIsLiking(true);

    // Optimistic update
    setHasLiked(!hasLiked);
    setLikesCount((prev) => (hasLiked ? prev - 1 : prev + 1));

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/recommendations/${targetId}/like`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );
      if (!response.ok) throw new Error("Like failed");
    } catch (err) {
      setHasLiked(hasLiked);
      setLikesCount((prev) => (hasLiked ? prev + 1 : prev - 1));
    }
    setIsLiking(false);
  };

  const postComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || isCommenting) return;

    setIsCommenting(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/recommendations/${targetId}/comments`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ text: newComment }),
        },
      );
      if (response.ok) {
        const { comment } = await response.json();
        setComments([...comments, comment]);
        setNewComment("");
      }
    } catch (err) {
      console.error("Failed to post comment", err);
    }
    setIsCommenting(false);
  };

  return (
    <>
      <div
        className="rounded-[1.25rem] p-4 border border-white/70 transition-transform duration-200 hover:-translate-y-0.5 relative"
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
                  {getActionText(item.category)}{" "}
                  <span className="text-ink/80 font-semibold">
                    {item.item_name || item.title || "an item"}
                  </span>
                  {item.list_title && (
                    <span className="text-ink/40">
                      {" "}
                      from "{item.list_title}"
                    </span>
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

        {/* Social Action Bar */}
        <div className="flex items-center gap-5 pt-3 px-1 mt-1 font-poppins">
          <button
            onClick={toggleLike}
            className="flex items-center gap-1.5 text-xs font-bold transition-colors group"
            style={{ color: hasLiked ? "#ef4444" : "#64748b" }}
          >
            <Heart
              size={16}
              fill={hasLiked ? "#ef4444" : "transparent"}
              className="group-hover:scale-110 transition-transform active:scale-95"
            />
            <span>
              {likesCount === 0
                ? "like"
                : `${likesCount} ${likesCount === 1 ? "like" : "likes"}`}
            </span>
          </button>

          <button
            onClick={() => setShowComments(true)}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-700 transition-colors group"
          >
            <MessageCircle
              size={16}
              className="group-hover:scale-110 transition-transform active:scale-95"
            />
            <span>
              {comments.length === 0
                ? "comment"
                : `${comments.length} ${comments.length === 1 ? "comment" : "comments"}`}
            </span>
          </button>
        </div>
      </div>

      {/* Comments Slide-up Modal */}
      {showComments && (
        <div
          className="fixed inset-0 z-[100] flex justify-center items-end sm:items-center p-0 sm:p-4 bg-black/20 backdrop-blur-sm"
          onClick={() => setShowComments(false)}
        >
          <div
            className="w-full max-w-md bg-white/90 backdrop-blur-2xl rounded-t-[2rem] sm:rounded-[2rem] border border-white/50 shadow-2xl flex flex-col h-[75vh] sm:h-[60vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            style={{ animation: "slideUp 0.3s ease-out forwards" }}
          >
            <div className="p-5 border-b border-slate-200/50 flex justify-between items-center bg-white/50 shrink-0">
              <h3 className="font-poppins font-extrabold text-ink">comments</h3>
              <button
                onClick={() => setShowComments(false)}
                className="p-2 bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">
              {comments.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-2">
                  <MessageCircle size={32} opacity={0.5} />
                  <p className="text-sm font-medium font-poppins">
                    no comments yet. be the first!
                  </p>
                </div>
              ) : (
                comments.map((c) => (
                  <div key={c.id} className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-200 shrink-0 flex items-center justify-center text-xs font-bold text-slate-500 overflow-hidden font-poppins">
                      {c.profiles?.avatar_url ? (
                        <img
                          src={c.profiles.avatar_url}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        c.profiles?.username?.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="bg-slate-100/80 rounded-2xl rounded-tl-none px-4 py-2.5 flex-1 font-poppins">
                      <p className="text-xs font-extrabold text-slate-700 mb-0.5">
                        @{c.profiles?.username}
                      </p>
                      <p className="text-sm text-slate-800">{c.text}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <form
              onSubmit={postComment}
              className="p-4 border-t border-slate-200/50 bg-white/50 flex gap-2 shrink-0 pb-safe"
            >
              <input
                type="text"
                placeholder="add a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="flex-1 bg-white border border-slate-200 rounded-full px-4 py-3 text-sm outline-none font-poppins focus:border-cornflower transition-colors shadow-inner"
              />
              <button
                type="submit"
                disabled={!newComment.trim() || isCommenting}
                className="w-12 h-12 rounded-full bg-cornflower text-white flex items-center justify-center disabled:opacity-50 hover:opacity-90 transition-all shadow-md shrink-0 active:scale-95"
              >
                {isCommenting ? (
                  <Loader size={18} className="animate-spin" />
                ) : (
                  <Send size={18} className="ml-0.5" />
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
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
          {item.category === 'Movies' ? 'movies & tv' : item.category}
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
    // For lists, we link the entire card to the list detail page since there's no separate "view" button like there is for ratings, and the main action is to view the list itself
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
        {item.category === 'Movies' ? 'movies & tv' : item.category}
      </span>
      {item.description && (
        <p className="text-ink/50 text-xs leading-relaxed line-clamp-2 font-poppins">
          {item.description}
        </p>
      )}
    </Link>
  );
}