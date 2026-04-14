import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { Link } from "react-router-dom";
import { Star, List as ListIcon, UserPlus, Clock } from "lucide-react";
import RecsStrip from "../components/RecsStrip";
import Iridescence from "../components/Iridescence";

const categoryColors = {
  books: "bg-amber-100 text-amber-700",
  movies: "bg-pink-100 text-pink-700",
  music: "bg-purple-100 text-purple-700",
  places: "bg-green-100 text-green-700",
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

    // 1. Get accepted friends IDs
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

    // 2. Fetch friend profiles (to display usernames)
    const { data: profiles } = await supabase
      .from("profiles")
      .select("*")
      .in("id", friendIds);
    const profileMap = (profiles || []).reduce(
      (acc, p) => ({ ...acc, [p.id]: p }),
      {},
    );

    // 3. Fetch recent ratings by friends
    const { data: ratings } = await supabase
      .from("ratings")
      .select("*")
      .in("user_id", friendIds)
      .order("created_at", { ascending: false })
      .limit(20);

    // 4. Fetch recent public lists by friends
    const { data: lists } = await supabase
      .from("lists")
      .select("*")
      .in("user_id", friendIds)
      .eq("is_public", true)
      .order("created_at", { ascending: false })
      .limit(20);

    // 5. Combine, format, and sort into a single timeline
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
      .slice(0, 30); // Top 30 items

    setFeed(combinedFeed);
    setLoading(false);
  };

  // Helper to format timestamps nicely
  const timeAgo = (dateString) => {
    const days = Math.floor(
      (new Date() - new Date(dateString)) / (1000 * 60 * 60 * 24),
    );
    if (days === 0) return "today";
    if (days === 1) return "yesterday";
    return `${days}d ago`;
  };

  return (
    <div className="max-w-2xl mx-auto animate-fade-in lowercase relative">
      {/* Iridescence Aura Background - Subtle and cornflower focused */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-40">
        <Iridescence color={[0.4, 0.6, 1.0]} speed={0.6} amplitude={0.06} />
      </div>

      {/* Main Content Wrapper - Pulled to the front with relative z-10 */}
      <div className="relative z-10">
        {/* Recs Strip */}
        <RecsStrip />

        {/* Page Header */}
        <h1 className="text-2xl text-ink font-balsamiq font-extrabold tracking-tight text-center mb-10 mt-6">
          lately in your world
        </h1>

        {loading ? (
          <div className="text-center py-12 text-warmGray font-medium">
            loading activity...
          </div>
        ) : feed.length === 0 ? (
          /* Empty State */
          <div className="bg-cornflower p-12 rounded-[2rem] shadow-lg shadow-cornflower/20 text-center text-white border border-white/20">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6 backdrop-blur-sm">
              <Clock size={40} className="text-white" />
            </div>
            <h2 className="text-3xl font-bold mb-3">it's quiet in here</h2>
            <p className="text-white/80 max-w-sm mx-auto mb-8 text-lg">
              your feed shows the latest ratings and public lists from your
              friends. add some friends to see what they are tracking!
            </p>
            <Link
              to="/friends"
              className="inline-block bg-white hover:bg-cream text-cornflower font-bold px-8 py-3 rounded-full transition-all hover:scale-105 shadow-sm"
            >
              find friends
            </Link>
          </div>
        ) : (
          /* Feed Timeline */
          <div className="flex flex-col gap-8">
            {feed.map((item) => (
              /* Individual Feed Card (Cornflower Blue) */
              <div
                key={`${item.feedType}-${item.id}`}
                className="bg-cornflower p-6 md:p-8 rounded-[2rem] shadow-lg shadow-cornflower/20 border border-white/20 text-white transition-transform hover:-translate-y-1 duration-300"
              >
                {/* Feed Item Header */}
                <div className="flex justify-between items-start mb-5">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                    <Link
                      to={`/u/${item.profile?.username}`}
                      className="font-bold text-lg hover:text-cream transition-colors underline decoration-white/30 underline-offset-4"
                    >
                      @{item.profile?.username}
                    </Link>
                    <span className="text-white/80 text-sm">
                      {item.feedType === "rating" ? (
                        <>
                          rated{" "}
                          <span className="text-white font-semibold">
                            {item.item_name || item.title || "an item"}
                          </span>
                          {item.list_title && ` from "${item.list_title}"`}
                        </>
                      ) : (
                        <>
                          created a list{" "}
                          <span className="text-white font-semibold">
                            "{item.title}"
                          </span>
                        </>
                      )}
                    </span>
                  </div>
                  <span className="text-xs text-white/60 flex items-center gap-1.5 shrink-0 bg-black/10 px-3 py-1 rounded-full">
                    <Clock size={12} /> {timeAgo(item.created_at)}
                  </span>
                </div>

                {/* Feed Item Content (Translucent Glass Effect) */}
                {item.feedType === "rating" ? (
                  <div className="bg-white/20 backdrop-blur-sm p-5 rounded-2xl border border-white/10">
                    <div className="flex justify-between items-start mb-2">
                      <span
                        className={`text-xs font-bold px-3 py-1 rounded-full shadow-sm ${categoryColors[item.category?.toLowerCase()] ?? "bg-white text-cornflower"}`}
                      >
                        {item.category}
                      </span>
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            size={16}
                            className={
                              i < item.rating
                                ? "fill-white text-white"
                                : "text-white/30 fill-transparent"
                            }
                          />
                        ))}
                      </div>
                    </div>
                    <h3 className="text-xl font-bold mt-3 mb-1">
                      {item.item_name || item.title || "unknown item"}
                    </h3>
                    {item.review && (
                      <p className="text-white/80 text-sm leading-relaxed">
                        "{item.review}"
                      </p>
                    )}
                  </div>
                ) : (
                  <Link
                    to={`/lists/${item.id}`}
                    className="block bg-white/20 backdrop-blur-sm p-5 rounded-2xl border border-white/10 hover:bg-white/30 transition-colors group"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-white/20 rounded-xl group-hover:scale-110 transition-transform">
                        <ListIcon size={20} className="text-white" />
                      </div>
                      <h3 className="text-xl font-bold">{item.title}</h3>
                    </div>
                    <span className="text-xs font-bold px-3 py-1 bg-white text-cornflower rounded-full inline-block mb-3 shadow-sm">
                      {item.category}
                    </span>
                    {item.description && (
                      <p className="text-white/80 text-sm line-clamp-2">
                        {item.description}
                      </p>
                    )}
                  </Link>
                )}
              </div>
            ))}

            {/* Find Friends Button at the bottom */}
            <div className="flex justify-center pt-4">
              <Link
                to="/friends"
                className="flex items-center gap-2 text-sm bg-white text-cornflower px-6 py-3 rounded-full shadow-sm hover:shadow-md hover:scale-105 transition-all font-bold border border-cornflower/10"
              >
                <UserPlus size={18} /> find friends
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
