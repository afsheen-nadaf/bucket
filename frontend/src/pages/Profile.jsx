import {
  useState,
  useEffect,
  useId,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import {
  User,
  Star,
  UserPlus,
  UserCheck,
  X,
  List,
  PlusCircle,
  Sparkles,
  Lock,
} from "lucide-react";
import Iridescence from "../components/Iridescence";

/* ─────────────────────────────────────────
   GOOEY SEARCH
───────────────────────────────────────── */
function GooeyFilter({ filterId, blur }) {
  return (
    <svg className="pointer-events-none absolute h-0 w-0" aria-hidden="true">
      <defs>
        <filter id={filterId} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur
            in="SourceGraphic"
            stdDeviation={blur}
            result="blur"
          />
          <feColorMatrix
            in="blur"
            type="matrix"
            values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -10"
            result="goo"
          />
          <feComposite in="SourceGraphic" in2="goo" operator="atop" />
        </filter>
      </defs>
    </svg>
  );
}

function SearchSVG({ layoutId }) {
  return (
    <motion.svg
      layoutId={layoutId}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      className="size-4 shrink-0"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </motion.svg>
  );
}

const gooeySpring = { duration: 0.4, type: "spring", bounce: 0.25 };

function GooeySearch({ value, onValueChange, onSearch }) {
  const reactId = useId();
  const safeId = reactId.replace(/:/g, "");
  const filterId = `gooey-${safeId}`;
  const iconId = `gooey-icon-${safeId}`;

  const inputRef = useRef(null);
  const prevExpanded = useRef(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const buttonVariants = useMemo(
    () => ({
      collapsed: { width: 130, marginLeft: 0 },
      expanded: { width: 240, marginLeft: 44 },
    }),
    [],
  );

  const bubbleVariants = {
    collapsed: { scale: 0, opacity: 0 },
    expanded: { scale: 1, opacity: 1 },
  };

  useEffect(() => {
    if (isExpanded) inputRef.current?.focus();
    else if (prevExpanded.current) onValueChange("");
    prevExpanded.current = isExpanded;
  }, [isExpanded, onValueChange]);

  const handleBlur = useCallback(() => {
    if (!value) setIsExpanded(false);
  }, [value]);
  const handleKey = useCallback(
    (e) => {
      if (e.key === "Enter") onSearch();
    },
    [onSearch],
  );

  const surface = {
    background: "rgba(255,255,255,0.78)",
    border: "1.5px solid rgba(255,255,255,0.92)",
    color: "#1e2640",
    boxShadow: "0 2px 12px rgba(100,148,236,0.10)",
  };

  return (
    <div className="relative flex items-center">
      <GooeyFilter filterId={filterId} blur={5} />
      <div
        className="relative flex h-10 items-center"
        style={{ filter: `url(#${filterId})` }}
      >
        <motion.div
          className="flex h-10 items-center"
          variants={buttonVariants}
          initial="collapsed"
          animate={isExpanded ? "expanded" : "collapsed"}
          transition={gooeySpring}
        >
          {/* Replaced <button> with <div> to prevent browser default button padding from breaking vertical alignment */}
          <div
            onClick={() => setIsExpanded(true)}
            className="flex h-10 w-full cursor-text items-center gap-2 rounded-full px-4 text-sm outline-none"
            style={surface}
          >
            {!isExpanded && <SearchSVG layoutId={iconId} />}
            <motion.input
              ref={inputRef}
              type="search"
              autoComplete="off"
              value={value}
              onChange={(e) => onValueChange(e.target.value)}
              onBlur={handleBlur}
              onKeyDown={handleKey}
              disabled={!isExpanded}
              placeholder={isExpanded ? "find your friends!" : "search"}
              className="w-full min-w-0 flex-1 bg-transparent text-sm outline-none font-poppins font-medium placeholder:text-[#1e2640]/50"
              style={{
                color: "#1e2640",
                pointerEvents: isExpanded ? "auto" : "none",
              }}
            />
          </div>
        </motion.div>
        <motion.div
          className="absolute top-0 left-0 flex size-10 items-center justify-center"
          variants={bubbleVariants}
          initial="collapsed"
          animate={isExpanded ? "expanded" : "collapsed"}
          transition={gooeySpring}
        >
          <div
            className="flex size-10 items-center justify-center rounded-full"
            style={surface}
          >
            <SearchSVG layoutId={iconId} />
          </div>
        </motion.div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   PROFILE PAGE
───────────────────────────────────────── */
export default function Profile() {
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState("activity");
  const [profile, setProfile] = useState(null);
  const [ratings, setRatings] = useState([]);
  const [lists, setLists] = useState([]);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [friendList, setFriendList] = useState([]);

  useEffect(() => {
    if (user) fetchAll();
  }, [user]);

  const fetchAll = async () => {
    await Promise.all([fetchProfileData(), fetchFriendsData()]);
  };

  const fetchProfileData = async () => {
    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();
    setProfile(profileData);

    const { data: ratingsData } = await supabase
      .from("ratings")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setRatings(ratingsData || []);

    const { data: listsData } = await supabase
      .from("lists")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setLists(listsData || []);

    let itemsData = [];
    if (listsData?.length > 0) {
      const { data: items } = await supabase
        .from("list_items")
        .select("*")
        .in(
          "list_id",
          listsData.map((l) => l.id),
        )
        .order("created_at", { ascending: false });
      itemsData = items || [];
    }

    const feed = [
      ...(ratingsData || []).map((r) => ({
        type: "rating",
        date: r.created_at,
        data: r,
      })),
      ...(listsData || []).map((l) => ({
        type: "list_created",
        date: l.created_at,
        data: l,
      })),
      ...itemsData.map((i) => ({
        type: "item_added",
        date: i.created_at,
        data: i,
        list: listsData?.find((l) => l.id === i.list_id),
      })),
    ].sort((a, b) => new Date(b.date) - new Date(a.date));
    setActivity(feed);
    setLoading(false);
  };

  const fetchFriendsData = async () => {
    const { data: requests } = await supabase
      .from("friends")
      .select("id, requester_id")
      .eq("receiver_id", user.id)
      .eq("status", "pending");
    if (requests?.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("*")
        .in(
          "id",
          requests.map((r) => r.requester_id),
        );
      setPendingRequests(
        requests.map((req) => ({
          ...req,
          profile: profiles.find((p) => p.id === req.requester_id),
        })),
      );
    } else {
      setPendingRequests([]);
    }

    const { data: accepted } = await supabase
      .from("friends")
      .select("*")
      .or(`requester_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .eq("status", "accepted");
    if (accepted?.length > 0) {
      const friendIds = accepted.map((f) =>
        f.requester_id === user.id ? f.receiver_id : f.requester_id,
      );
      const { data: profiles } = await supabase
        .from("profiles")
        .select("*")
        .in("id", friendIds);
      setFriendList(profiles || []);
    } else {
      setFriendList([]);
    }
  };

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .ilike("username", `%${searchQuery}%`)
      .neq("id", user.id)
      .limit(10);
    setSearchResults(data || []);
  }, [searchQuery, user?.id]);

  const sendFriendRequest = async (receiverId) => {
    const { error } = await supabase
      .from("friends")
      .insert([
        { requester_id: user.id, receiver_id: receiverId, status: "pending" },
      ]);
    if (!error) {
      setSearchResults([]);
      setSearchQuery("");
    }
  };

  const acceptRequest = async (id) => {
    await supabase.from("friends").update({ status: "accepted" }).eq("id", id);
    fetchFriendsData();
  };
  const declineRequest = async (id) => {
    await supabase.from("friends").delete().eq("id", id);
    fetchFriendsData();
  };

  const glass = {
    background: "rgba(218, 230, 255, 0.80)",
    backdropFilter: "blur(28px) saturate(190%)",
    WebkitBackdropFilter: "blur(28px) saturate(190%)",
    border: "1.5px solid rgba(255,255,255,0.90)",
    boxShadow:
      "0 8px 40px rgba(100,149,237,0.14), 0 2px 8px rgba(0,0,0,0.05), inset 0 1.5px 0 rgba(255,255,255,0.95)",
  };

  const timeAgo = (d) => {
    const diff = Date.now() - new Date(d).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d`;
    return new Date(d).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const TABS = [
    { id: "activity", label: "activity", icon: <Sparkles size={14} /> },
    { id: "ratings", label: "my ratings", icon: <Star size={14} /> },
    {
      id: "friends",
      label: "friends",
      icon: <UserCheck size={14} />,
      badge: pendingRequests.length,
    },
  ];

  if (loading)
    return (
      <div className="fixed inset-0 pointer-events-none z-0 opacity-40">
        <Iridescence color={[0.4, 0.6, 1.0]} speed={0.6} amplitude={0.06} />
      </div>
    );

  return (
    <div className="max-w-4xl mx-auto lowercase relative z-10 pb-12">
      {/* Iridescent bg */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-40">
        <Iridescence color={[0.4, 0.6, 1.0]} speed={0.6} amplitude={0.06} />
      </div>

      {/* ── HEADER TILE ── */}
      <div
        className="p-6 rounded-[2rem] flex items-center gap-5 mb-4"
        style={glass}
      >
        <div className="relative flex-shrink-0">
          <div className="w-20 h-20 rounded-full bg-white/60 border-2 border-white/85 flex items-center justify-center shadow-inner">
            <User size={36} className="text-cornflower" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-cornflower rounded-full border-2 border-white flex items-center justify-center shadow-md">
            <Sparkles size={11} className="text-white" />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-poppins font-bold text-ink leading-tight">
            @{profile?.username}
          </h1>
          <p className="font-poppins text-sm text-ink/55 mt-1 leading-relaxed">
            {profile?.bio || "no bio yet."}
          </p>
        </div>
        <div className="flex flex-col gap-2 flex-shrink-0">
          {[
            { n: ratings.length, l: "ratings" },
            { n: lists.length, l: "lists" },
            { n: friendList.length, l: "friends" },
          ].map(({ n, l }) => (
            <div
              key={l}
              className="flex items-center gap-2 bg-white/55 border border-white/70 rounded-full px-3 py-1"
            >
              <span className="font-poppins font-bold text-sm text-cornflower">
                {n}
              </span>
              <span className="font-poppins text-xs text-ink/45">{l}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── TABS ── */}
      <div className="flex gap-2.5 mb-4 justify-center">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-5 py-2 rounded-full font-poppins font-semibold text-xs transition-all duration-300 ${
              activeTab === tab.id
                ? "bg-cornflower text-white shadow-lg shadow-cornflower/30 scale-105"
                : "bg-white/60 text-ink hover:bg-white/85 border border-white/50"
            }`}
          >
            {tab.icon}
            {tab.label}
            {tab.badge > 0 && (
              <span className="bg-red-500 text-white text-[9px] w-4 h-4 flex items-center justify-center rounded-full animate-pulse">
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ════════ ACTIVITY TAB ════════ */}
      {activeTab === "activity" && (
        <div className="grid grid-cols-2 gap-4 animate-fade-in">
          {/* Feed tile */}
          <div className="rounded-[1.5rem] overflow-hidden" style={glass}>
            <div className="px-5 pt-4 pb-2">
              <p className="font-poppins text-[10px] font-bold tracking-widest text-ink/40 uppercase">
                recent activity
              </p>
            </div>
            {activity.length === 0 ? (
              <div className="p-10 text-center">
                <Sparkles
                  size={28}
                  className="mx-auto text-cornflower/30 mb-2"
                />
                <p className="font-poppins text-sm text-ink/45">
                  nothing yet — go rate something!
                </p>
              </div>
            ) : (
              <div className="flex flex-col divide-y divide-white/50">
                {activity.slice(0, 9).map((event, i) => (
                  <FeedRow key={i} event={event} timeAgo={timeAgo} />
                ))}
              </div>
            )}
          </div>

          {/* Right column */}
          <div className="flex flex-col gap-4">
            {/* Stats tile */}
            <div className="rounded-[1.5rem] p-5" style={glass}>
              <p className="font-poppins text-[10px] font-bold tracking-widest text-ink/40 uppercase mb-3">
                stats
              </p>
              <div className="grid grid-cols-3 gap-2 text-center">
                {[
                  { n: ratings.length, l: "ratings" },
                  { n: lists.length, l: "lists" },
                  { n: friendList.length, l: "friends" },
                ].map(({ n, l }) => (
                  <div
                    key={l}
                    className="bg-white/50 rounded-2xl py-3 border border-white/60"
                  >
                    <div className="font-poppins font-bold text-2xl text-cornflower leading-none">
                      {n}
                    </div>
                    <div className="font-poppins text-[10px] text-ink/40 mt-1">
                      {l}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Lists tile */}
            <div
              className="rounded-[1.5rem] flex-1 overflow-hidden"
              style={glass}
            >
              <div className="px-5 pt-4 pb-2">
                <p className="font-poppins text-[10px] font-bold tracking-widest text-ink/40 uppercase">
                  my lists
                </p>
              </div>
              {lists.length === 0 ? (
                <div className="p-8 text-center">
                  <Lock size={22} className="mx-auto text-ink/20 mb-2" />
                  <p className="font-poppins text-xs text-ink/35">
                    no lists yet.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col divide-y divide-white/50">
                  {lists.slice(0, 6).map((list) => (
                    <Link
                      key={list.id}
                      to={`/lists/${list.id}`}
                      className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-white/30 transition-colors group"
                    >
                      <div className="min-w-0">
                        <p
                          className="font-semibold text-sm text-ink group-hover:text-cornflower transition-colors truncate"
                          style={{ fontFamily: "'Balsamiq Sans', cursive" }}
                        >
                          {list.title}
                        </p>
                        {list.category && (
                          <span className="font-poppins text-[10px] text-ink/35">
                            {list.category}
                          </span>
                        )}
                      </div>
                      <span className="font-poppins text-[10px] text-ink/25 group-hover:text-cornflower/50 group-hover:translate-x-0.5 transition-all flex-shrink-0">
                        →
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ════════ RATINGS TAB ════════ */}
      {activeTab === "ratings" && (
        <div className="animate-fade-in">
          {ratings.length === 0 ? (
            <div className="p-14 rounded-[2rem] text-center" style={glass}>
              <Star size={32} className="mx-auto text-cornflower/30 mb-3" />
              <p className="font-poppins text-sm text-ink/55 font-medium">
                no ratings yet. open a list and tap an item to rate it!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {ratings.map((r) => (
                <div
                  key={r.id}
                  className="p-5 rounded-[1.5rem] flex flex-col gap-2.5 transition-transform hover:-translate-y-0.5"
                  style={glass}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-poppins text-[10px] font-bold px-2.5 py-1 bg-white/65 text-cornflower rounded-full border border-white/65">
                      {r.category}
                    </span>
                    <div className="flex gap-0.5 flex-shrink-0">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          size={13}
                          className={
                            i < r.rating
                              ? "fill-cornflower text-cornflower"
                              : "text-ink/15 fill-transparent"
                          }
                        />
                      ))}
                    </div>
                  </div>
                  <h3
                    className="text-ink text-base leading-snug"
                    style={{
                      fontFamily: "'Balsamiq Sans', cursive",
                      fontWeight: 700,
                    }}
                  >
                    {r.title}
                  </h3>
                  {r.review && (
                    <p className="font-poppins text-xs text-ink/55 italic bg-white/45 px-3 py-2 rounded-xl border border-white/55 line-clamp-3 leading-relaxed">
                      "{r.review}"
                    </p>
                  )}
                  <p className="font-poppins text-[10px] text-ink/30 mt-auto">
                    {timeAgo(r.created_at)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ════════ FRIENDS TAB ════════ */}
      {activeTab === "friends" && (
        <div className="grid grid-cols-2 gap-4 animate-fade-in">
          {/* Left — search + pending */}
          <div className="flex flex-col gap-4">
            <div className="p-5 rounded-[1.5rem]" style={glass}>
              <p className="font-poppins text-[10px] font-bold tracking-widest text-ink/40 uppercase mb-4">
                find friends
              </p>
              <div className="flex items-center gap-3 mb-4 flex-wrap">
                <GooeySearch
                  value={searchQuery}
                  onValueChange={setSearchQuery}
                  onSearch={handleSearch}
                />
                {searchQuery.trim() && (
                  <button
                    onClick={handleSearch}
                    className="bg-cornflower text-white font-poppins font-semibold text-xs px-4 py-2 rounded-full hover:scale-105 transition-transform shadow-sm flex-shrink-0"
                  >
                    go
                  </button>
                )}
              </div>
              {searchResults.length > 0 && (
                <div className="flex flex-col gap-2">
                  {searchResults.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-white/50 border border-white/65"
                    >
                      <Link
                        to={`/u/${p.username}`}
                        className="font-poppins font-semibold text-sm text-ink hover:text-cornflower transition-colors"
                      >
                        @{p.username}
                      </Link>
                      <button
                        onClick={() => sendFriendRequest(p.id)}
                        className="flex items-center gap-1 text-[11px] bg-cornflower text-white font-poppins font-semibold px-3 py-1.5 rounded-lg hover:scale-105 transition-transform"
                      >
                        <UserPlus size={12} /> add
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {searchQuery && searchResults.length === 0 && (
                <p className="font-poppins text-xs text-ink/35 text-center py-2">
                  no users found
                </p>
              )}
            </div>

            {pendingRequests.length > 0 && (
              <div className="p-5 rounded-[1.5rem]" style={glass}>
                <p className="font-poppins text-[10px] font-bold tracking-widest text-ink/40 uppercase mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse inline-block" />
                  requests
                </p>
                <div className="flex flex-col gap-2">
                  {pendingRequests.map((req) => (
                    <div
                      key={req.id}
                      className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-white/50 border border-white/65"
                    >
                      <Link
                        to={`/u/${req.profile?.username}`}
                        className="font-poppins font-semibold text-sm text-ink hover:text-cornflower transition-colors"
                      >
                        @{req.profile?.username}
                      </Link>
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => acceptRequest(req.id)}
                          className="p-1.5 bg-green-500 text-white rounded-lg hover:scale-110 transition-transform"
                          title="accept"
                        >
                          <UserCheck size={14} />
                        </button>
                        <button
                          onClick={() => declineRequest(req.id)}
                          className="p-1.5 bg-white text-red-400 border border-red-100 rounded-lg hover:scale-110 transition-transform"
                          title="decline"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right — friends list */}
          <div className="rounded-[1.5rem] h-fit overflow-hidden" style={glass}>
            <div className="px-5 pt-4 pb-2">
              <p className="font-poppins text-[10px] font-bold tracking-widest text-ink/40 uppercase">
                my friends
              </p>
            </div>
            {friendList.length === 0 ? (
              <div className="p-10 text-center">
                <User size={26} className="mx-auto text-ink/20 mb-2" />
                <p className="font-poppins text-xs text-ink/35 italic">
                  no friends yet — use the search!
                </p>
              </div>
            ) : (
              <div className="flex flex-col divide-y divide-white/50">
                {friendList.map((friend) => (
                  <Link
                    key={friend.id}
                    to={`/u/${friend.username}`}
                    className="flex items-center justify-between px-5 py-3.5 hover:bg-white/30 transition-colors group"
                  >
                    <span className="font-poppins font-semibold text-sm text-ink group-hover:text-cornflower transition-colors">
                      @{friend.username}
                    </span>
                    <span className="font-poppins text-xs text-ink/25 group-hover:translate-x-0.5 group-hover:text-cornflower/50 transition-all">
                      →
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────
   FEED ROW
───────────────────────────────────────── */
function FeedRow({ event, timeAgo }) {
  const { type, date, data, list } = event;

  const meta = {
    list_created: {
      bg: "rgba(100,148,236,0.13)",
      border: "rgba(100,148,236,0.2)",
      icon: <PlusCircle size={15} className="text-cornflower" />,
    },
    item_added: {
      bg: "rgba(160,120,255,0.11)",
      border: "rgba(160,120,255,0.18)",
      icon: <List size={15} className="text-purple-400" />,
    },
    rating: {
      bg: "rgba(220,170,40,0.13)",
      border: "rgba(220,170,40,0.2)",
      icon: <Star size={15} className="text-amber-400 fill-amber-400" />,
    },
  }[type];

  const label =
    type === "list_created" ? (
      "created a list"
    ) : type === "item_added" ? (
      <span>
        added to{" "}
        {list ? (
          <Link
            to={`/lists/${list.id}`}
            className="text-cornflower font-semibold hover:underline"
          >
            {list.title}
          </Link>
        ) : (
          "a list"
        )}
      </span>
    ) : (
      "rated"
    );

  const titleContent =
    type === "list_created" ? (
      <Link
        to={`/lists/${data.id}`}
        className="hover:text-cornflower transition-colors"
      >
        {data.title}
      </Link>
    ) : type === "item_added" ? (
      data.title || data.name || "untitled item"
    ) : (
      data.title
    );

  return (
    <div className="flex items-start gap-3 px-5 py-3 hover:bg-white/20 transition-colors">
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
        style={{ background: meta.bg, border: `1px solid ${meta.border}` }}
      >
        {meta.icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-poppins text-[10.5px] text-ink/45 mb-0.5">{label}</p>
        <p
          className="font-semibold text-sm text-ink truncate"
          style={{ fontFamily: "'Balsamiq Sans', cursive" }}
        >
          {titleContent}
        </p>
        {type === "rating" && (
          <div className="flex gap-0.5 mt-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                size={10}
                className={
                  i < data.rating
                    ? "fill-cornflower text-cornflower"
                    : "text-ink/15 fill-transparent"
                }
              />
            ))}
          </div>
        )}
      </div>
      <span className="font-poppins text-[10px] text-ink/28 flex-shrink-0 mt-0.5">
        {timeAgo(date)}
      </span>
    </div>
  );
}
