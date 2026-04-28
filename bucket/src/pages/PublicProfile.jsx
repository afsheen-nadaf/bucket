import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { User, Star, Lock, List, PlusCircle, Sparkles } from "lucide-react";

export default function PublicProfile() {
  const { username } = useParams();
  const [profile, setProfile] = useState(null);
  const [publicLists, setPublicLists] = useState([]);
  const [ratings, setRatings] = useState([]);
  const [listItems, setListItems] = useState([]);
  const [activity, setActivity] = useState([]);
  const [activeTab, setActiveTab] = useState("activity");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserData();
  }, [username]);

  const fetchUserData = async () => {
    setLoading(true);

    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("username", username)
      .single();

    if (!profileData) {
      setLoading(false);
      return;
    }
    setProfile(profileData);

    const { data: listsData } = await supabase
      .from("lists")
      .select("*")
      .eq("user_id", profileData.id)
      .eq("is_public", true)
      .order("created_at", { ascending: false });
    setPublicLists(listsData || []);

    const { data: ratingsData } = await supabase
      .from("ratings")
      .select("*")
      .eq("user_id", profileData.id)
      .order("created_at", { ascending: false });
    setRatings(ratingsData || []);

    let itemsData = [];
    if (listsData && listsData.length > 0) {
      const listIds = listsData.map((l) => l.id);
      const { data: items } = await supabase
        .from("list_items")
        .select("*")
        .in("list_id", listIds)
        .order("created_at", { ascending: false });
      itemsData = items || [];
      setListItems(itemsData);
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

  const glassCard = {
    background: "rgba(220, 230, 255, 0.82)",
    backdropFilter: "blur(28px) saturate(190%)",
    WebkitBackdropFilter: "blur(28px) saturate(190%)",
    border: "1.5px solid rgba(255,255,255,0.90)",
    boxShadow:
      "0 8px 40px rgba(100,149,237,0.18), 0 2px 8px rgba(0,0,0,0.06), inset 0 1.5px 0 rgba(255,255,255,0.95)",
  };

  const timeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const TABS = [
    { id: "activity", label: "activity", icon: <Sparkles size={15} /> },
    { id: "lists", label: "lists", icon: <List size={15} /> },
    { id: "ratings", label: "ratings", icon: <Star size={15} /> },
  ];

  if (loading)
    return (
      <div className="p-4 font-poppins text-ink font-medium text-center py-12">
        loading...
      </div>
    );
  if (!profile)
    return (
      <div className="p-4 font-poppins text-red-500 text-center py-12">
        user not found.
      </div>
    );

  return (
    <div className="max-w-3xl mx-auto lowercase relative z-10">
      {/* Header */}
      <div
        className="p-8 rounded-[2rem] text-ink flex items-center gap-6 mb-8 transition-transform hover:-translate-y-0.5"
        style={glassCard}
      >
        <div className="relative">
          <div className="w-24 h-24 bg-white/60 backdrop-blur-md rounded-full flex items-center justify-center border-2 border-white/80 shadow-inner">
            <User size={44} className="text-cornflower" />
          </div>
        </div>
        <div className="flex-1">
          <h1 className="text-3xl text-ink font-poppins font-bold drop-shadow-sm">
            @{profile.username}
          </h1>
          <p className="font-poppins text-sm text-ink/70 mt-1 leading-relaxed">
            {profile.bio || "no bio yet."}
          </p>
          <div className="flex gap-4 mt-3">
            <span className="text-xs font-poppins font-semibold text-cornflower bg-white/60 px-3 py-1 rounded-full border border-white/70 shadow-sm">
              {ratings.length} ratings
            </span>
            <span className="text-xs font-poppins font-semibold text-cornflower bg-white/60 px-3 py-1 rounded-full border border-white/70 shadow-sm">
              {publicLists.length} public lists
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-3 mb-8 justify-center">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-full font-poppins font-semibold text-sm transition-all duration-300 ${
              activeTab === tab.id
                ? "bg-cornflower text-white shadow-lg shadow-cornflower/30 scale-105"
                : "bg-white/60 backdrop-blur-sm text-ink hover:bg-white/90 border border-warmGray/10"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── ACTIVITY TAB ── */}
      {activeTab === "activity" && (
        <div className="animate-fade-in flex flex-col gap-3">
          {activity.length === 0 ? (
            <div
              className="p-12 rounded-[2rem] text-center font-poppins"
              style={glassCard}
            >
              <Sparkles size={32} className="mx-auto text-cornflower/40 mb-3" />
              <p className="text-ink/70 font-semibold">
                no public activity yet.
              </p>
            </div>
          ) : (
            activity.map((event, idx) => (
              <ActivityCard
                key={idx}
                event={event}
                timeAgo={timeAgo}
                glassCard={glassCard}
              />
            ))
          )}
        </div>
      )}

      {/* ── LISTS TAB ── */}
      {activeTab === "lists" && (
        <div className="animate-fade-in">
          {publicLists.length === 0 ? (
            <div
              className="p-12 rounded-[2rem] text-center font-poppins"
              style={glassCard}
            >
              <Lock size={28} className="mx-auto text-warmGray/30 mb-3" />
              <p className="text-ink/70 font-semibold">
                no public lists to show.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {publicLists.map((list) => (
                <Link
                  key={list.id}
                  to={`/lists/${list.id}`}
                  className="p-5 rounded-2xl text-ink transition-transform hover:-translate-y-0.5 block"
                  style={glassCard}
                >
                  <div className="flex justify-between items-start mb-1">
                    <h3
                      className="text-lg text-ink"
                      style={{
                        fontFamily: "'Poppins', sans-serif",
                        fontWeight: 700,
                      }}
                    >
                      {list.title}
                    </h3>
                    <span className="text-xs font-poppins font-semibold px-2 py-0.5 bg-white/60 text-cornflower rounded-full border border-white/60">
                      {list.category}
                    </span>
                  </div>
                  {list.description && (
                    <p className="font-poppins text-sm text-ink/60 line-clamp-2 mt-1">
                      {list.description}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── RATINGS TAB ── */}
      {activeTab === "ratings" && (
        <div className="animate-fade-in">
          {ratings.length === 0 ? (
            <div
              className="p-12 rounded-[2rem] text-center font-poppins"
              style={glassCard}
            >
              <Star size={28} className="mx-auto text-cornflower/40 mb-3" />
              <p className="text-ink/70 font-semibold">no ratings yet.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {ratings.map((rating) => (
                <div
                  key={rating.id}
                  className="p-6 rounded-2xl text-ink transition-transform hover:-translate-y-0.5"
                  style={glassCard}
                >
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-xs font-poppins font-bold px-3 py-1 bg-white/60 backdrop-blur-sm rounded-full shadow-sm border border-white/50 text-cornflower">
                      {rating.category}
                    </span>
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          size={16}
                          className={
                            i < rating.rating
                              ? "fill-cornflower text-cornflower"
                              : "text-warmGray/30 fill-transparent"
                          }
                        />
                      ))}
                    </div>
                  </div>
                  <h3
                    className="text-xl mb-2 text-ink"
                    style={{
                      fontFamily: "'Poppins', sans-serif",
                      fontWeight: 700,
                    }}
                  >
                    {rating.title}
                  </h3>
                  {rating.review && (
                    <p className="font-poppins text-sm text-ink/80 italic bg-white/50 p-3 rounded-xl border border-white/60 leading-relaxed">
                      "{rating.review}"
                    </p>
                  )}
                  <p className="font-poppins text-xs text-ink/40 mt-2">
                    {timeAgo(rating.created_at)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Activity Card sub-component ── */
function ActivityCard({ event, timeAgo, glassCard }) {
  const { type, date, data, list } = event;

  if (type === "list_created") {
    return (
      <div
        className="p-5 rounded-2xl text-ink flex items-start gap-4 transition-transform hover:-translate-y-0.5"
        style={glassCard}
      >
        <div className="w-10 h-10 rounded-full bg-cornflower/15 border border-cornflower/20 flex items-center justify-center flex-shrink-0 mt-0.5">
          <PlusCircle size={18} className="text-cornflower" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-poppins text-sm text-ink/60 mb-0.5">
            created a list
          </p>
          <Link to={`/lists/${data.id}`}>
            <h3
              className="text-base text-ink hover:text-cornflower transition-colors truncate"
              style={{
                fontFamily: "'Poppins', sans-serif",
                fontWeight: 700,
              }}
            >
              {data.title}
            </h3>
          </Link>
          {data.category && (
            <span className="inline-block mt-1.5 text-[11px] font-poppins font-semibold px-2 py-0.5 bg-white/60 text-cornflower rounded-full border border-white/60">
              {data.category}
            </span>
          )}
        </div>
        <span className="font-poppins text-xs text-ink/35 flex-shrink-0 mt-1">
          {timeAgo(date)}
        </span>
      </div>
    );
  }

  if (type === "item_added") {
    return (
      <div
        className="p-5 rounded-2xl text-ink flex items-start gap-4 transition-transform hover:-translate-y-0.5"
        style={glassCard}
      >
        <div className="w-10 h-10 rounded-full bg-purple-100/60 border border-purple-200/40 flex items-center justify-center flex-shrink-0 mt-0.5">
          <List size={18} className="text-purple-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-poppins text-sm text-ink/60 mb-0.5">
            added to{" "}
            {list ? (
              <Link
                to={`/lists/${list.id}`}
                className="text-cornflower hover:underline font-semibold"
              >
                {list.title}
              </Link>
            ) : (
              "a list"
            )}
          </p>
          <h3
            className="text-base text-ink truncate"
            style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700 }}
          >
            {data.title || data.name || "untitled item"}
          </h3>
          {data.note && (
            <p className="font-poppins text-xs text-ink/50 mt-0.5 line-clamp-1 italic">
              "{data.note}"
            </p>
          )}
        </div>
        <span className="font-poppins text-xs text-ink/35 flex-shrink-0 mt-1">
          {timeAgo(date)}
        </span>
      </div>
    );
  }

  if (type === "rating") {
    return (
      <div
        className="p-5 rounded-2xl text-ink flex items-start gap-4 transition-transform hover:-translate-y-0.5"
        style={glassCard}
      >
        <div className="w-10 h-10 rounded-full bg-yellow-100/60 border border-yellow-200/40 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Star size={18} className="text-yellow-500 fill-yellow-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-poppins text-sm text-ink/60 mb-0.5">rated</p>
          <h3
            className="text-base text-ink truncate"
            style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700 }}
          >
            {data.title}
          </h3>
          <div className="flex items-center gap-0.5 mt-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                size={13}
                className={
                  i < data.rating
                    ? "fill-cornflower text-cornflower"
                    : "text-warmGray/25 fill-transparent"
                }
              />
            ))}
            {data.category && (
              <span className="ml-2 text-[11px] font-poppins font-semibold px-2 py-0.5 bg-white/60 text-cornflower rounded-full border border-white/60">
                {data.category}
              </span>
            )}
          </div>
          {data.review && (
            <p className="font-poppins text-xs text-ink/55 italic mt-1.5 line-clamp-2 bg-white/40 px-2.5 py-1.5 rounded-lg border border-white/50">
              "{data.review}"
            </p>
          )}
        </div>
        <span className="font-poppins text-xs text-ink/35 flex-shrink-0 mt-1">
          {timeAgo(date)}
        </span>
      </div>
    );
  }

  return null;
}
