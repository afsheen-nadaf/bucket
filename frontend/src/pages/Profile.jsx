import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { Link } from "react-router-dom";
import { User, Star, Search, UserPlus, UserCheck, X } from "lucide-react";

export default function Profile() {
  const { user } = useAuth();

  // Dashboard Tabs
  const [activeTab, setActiveTab] = useState("ratings"); // 'ratings' | 'friends'

  // Ratings State
  const [profile, setProfile] = useState(null);
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Friends State
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [friendList, setFriendList] = useState([]);

  useEffect(() => {
    if (user) {
      fetchProfileData();
      fetchFriendsData();
    }
  }, [user]);

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
    setLoading(false);
  };

  const fetchFriendsData = async () => {
    // Incoming requests
    const { data: requests } = await supabase
      .from("friends")
      .select("id, requester_id")
      .eq("receiver_id", user.id)
      .eq("status", "pending");

    if (requests?.length > 0) {
      const requesterIds = requests.map((r) => r.requester_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("*")
        .in("id", requesterIds);
      const mergedRequests = requests.map((req) => ({
        ...req,
        profile: profiles.find((p) => p.id === req.requester_id),
      }));
      setPendingRequests(mergedRequests);
    } else {
      setPendingRequests([]);
    }

    // Accepted friends
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

  // Friend Actions
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .ilike("username", `%${searchQuery}%`)
      .neq("id", user.id)
      .limit(10);
    setSearchResults(data || []);
  };

  const sendFriendRequest = async (receiverId) => {
    const { error } = await supabase
      .from("friends")
      .insert([
        { requester_id: user.id, receiver_id: receiverId, status: "pending" },
      ]);
    if (!error) {
      setSearchResults([]);
      setSearchQuery("");
      alert("friend request sent!");
    }
  };

  const acceptRequest = async (requestId) => {
    await supabase
      .from("friends")
      .update({ status: "accepted" })
      .eq("id", requestId);
    fetchFriendsData();
  };

  const declineRequest = async (requestId) => {
    await supabase.from("friends").delete().eq("id", requestId);
    fetchFriendsData();
  };

  // --- REUSABLE GLASS STYLE ---
  const glassStyle = {
    background: "rgba(210, 225, 255, 0.88)",
    backdropFilter: "blur(24px) saturate(180%)",
    WebkitBackdropFilter: "blur(24px) saturate(180%)",
    border: "1.5px solid rgba(255,255,255,0.85)",
    boxShadow:
      "0 8px 32px rgba(100,149,237,0.22), 0 2px 8px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.95)",
  };

  if (loading)
    return (
      <div className="p-4 text-ink font-medium text-center py-12">
        loading profile...
      </div>
    );

  return (
    <div className="max-w-3xl mx-auto lowercase animate-fade-in relative z-10">
      {/* Circular aura blobs — fixed position so no parent overflow:hidden clips them */}
      <div
        className="fixed pointer-events-none -z-10"
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
        className="fixed pointer-events-none -z-10"
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

      {/* Dashboard Header - Unified Aura */}
      <div
        className="p-8 rounded-[2rem] text-ink flex items-center gap-6 mb-8 transition-transform hover:-translate-y-1"
        style={glassStyle}
      >
        <div className="w-24 h-24 bg-white/60 backdrop-blur-md rounded-full flex items-center justify-center border border-white/80 shadow-inner">
          <User size={48} className="text-cornflower" />
        </div>
        <div>
          <h1 className="text-3xl font-sniglet font-extrabold drop-shadow-sm">
            @{profile?.username}
          </h1>
          <p className="text-ink/80 mt-1 font-medium text-lg">
            {profile?.bio || "no bio yet."}
          </p>
        </div>
      </div>

      {/* Custom Tab Switcher */}
      <div className="flex gap-4 mb-8 justify-center">
        <button
          onClick={() => setActiveTab("ratings")}
          className={`px-8 py-3 rounded-full font-bold transition-all duration-300 ${activeTab === "ratings" ? "bg-cornflower text-white shadow-lg shadow-cornflower/30 scale-105" : "bg-white/60 backdrop-blur-sm text-ink hover:bg-white/90 border border-warmGray/10"}`}
        >
          my ratings
        </button>
        <button
          onClick={() => setActiveTab("friends")}
          className={`px-8 py-3 rounded-full font-bold transition-all duration-300 flex items-center gap-2 ${activeTab === "friends" ? "bg-cornflower text-white shadow-lg shadow-cornflower/30 scale-105" : "bg-white/60 backdrop-blur-sm text-ink hover:bg-white/90 border border-warmGray/10"}`}
        >
          my friends
          {pendingRequests.length > 0 && (
            <span className="bg-red-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full shadow-sm animate-pulse">
              {pendingRequests.length}
            </span>
          )}
        </button>
      </div>

      {/* --- TAB CONTENT: RATINGS --- */}
      {activeTab === "ratings" && (
        <div className="animate-fade-in">
          {ratings.length === 0 ? (
            <div className="p-12 rounded-[2rem] text-center" style={glassStyle}>
              <p className="text-ink font-bold text-lg">
                you haven't rated anything yet. go to your lists and click on an
                item to rate it!
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {ratings.map((rating) => (
                <div
                  key={rating.id}
                  className="p-6 rounded-2xl text-ink transition-transform hover:-translate-y-1"
                  style={glassStyle}
                >
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-xs font-bold px-3 py-1 bg-white/60 backdrop-blur-sm rounded-full shadow-sm border border-white/50 text-cornflower">
                      {rating.category}
                    </span>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          size={18}
                          className={
                            i < rating.rating
                              ? "fill-cornflower text-cornflower drop-shadow-sm"
                              : "text-warmGray/30 fill-transparent"
                          }
                        />
                      ))}
                    </div>
                  </div>
                  <h3 className="font-poppins font-bold text-xl mb-2">
                    {rating.title}
                  </h3>
                  {rating.review && (
                    <p className="text-ink/90 italic bg-white/50 backdrop-blur-sm p-3 rounded-xl border border-white/60">
                      "{rating.review}"
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* --- TAB CONTENT: FRIENDS --- */}
      {activeTab === "friends" && (
        <div className="grid md:grid-cols-2 gap-8 animate-fade-in">
          <div className="flex flex-col gap-6">
            {/* Search Users */}
            <div className="p-6 rounded-[2rem] text-ink" style={glassStyle}>
              <h2 className="text-2xl font-sniglet font-bold mb-4">
                find friends
              </h2>
              <form
                onSubmit={handleSearch}
                className="flex gap-2 relative mb-4"
              >
                <div className="relative flex-1">
                  <Search
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/50"
                    size={20}
                  />
                  <input
                    type="text"
                    placeholder="search by username..."
                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-white/60 bg-white/50 backdrop-blur-sm focus:border-cornflower focus:ring-1 focus:ring-cornflower outline-none placeholder-ink/50 text-ink font-medium"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <button
                  type="submit"
                  className="bg-cornflower hover:bg-cornflower/90 text-white font-bold px-5 rounded-xl transition-transform hover:scale-105 shadow-sm"
                >
                  search
                </button>
              </form>

              {searchResults.length > 0 && (
                <div className="flex flex-col gap-2">
                  {searchResults.map((profile) => (
                    <div
                      key={profile.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-white/50 border border-white/60 hover:bg-white/80 transition-colors shadow-sm"
                    >
                      <Link
                        to={`/u/${profile.username}`}
                        className="font-bold text-ink hover:text-cornflower transition-colors"
                      >
                        @{profile.username}
                      </Link>
                      <button
                        onClick={() => sendFriendRequest(profile.id)}
                        className="flex items-center gap-1 text-sm bg-cornflower text-white font-bold px-3 py-1.5 rounded-lg hover:scale-105 transition-transform shadow-sm"
                      >
                        <UserPlus size={16} /> add
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Pending Requests */}
            {pendingRequests.length > 0 && (
              <div className="p-6 rounded-[2rem] text-ink" style={glassStyle}>
                <h2 className="text-xl font-sniglet font-bold mb-4 flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse shadow-sm"></span>
                  friend requests
                </h2>
                <div className="flex flex-col gap-3">
                  {pendingRequests.map((req) => (
                    <div
                      key={req.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-white/50 border border-white/60 shadow-sm"
                    >
                      <Link
                        to={`/u/${req.profile?.username}`}
                        className="font-bold text-ink hover:text-cornflower transition-colors"
                      >
                        @{req.profile?.username}
                      </Link>
                      <div className="flex gap-2">
                        <button
                          onClick={() => acceptRequest(req.id)}
                          className="p-2 bg-green-500 text-white rounded-lg hover:scale-110 transition-transform shadow-sm"
                          title="accept"
                        >
                          <UserCheck size={18} />
                        </button>
                        <button
                          onClick={() => declineRequest(req.id)}
                          className="p-2 bg-white text-red-500 border border-red-100 rounded-lg hover:scale-110 transition-transform shadow-sm"
                          title="decline"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Friends List */}
          <div className="p-6 rounded-[2rem] text-ink h-fit" style={glassStyle}>
            <h2 className="text-2xl font-sniglet font-bold mb-4">my friends</h2>
            {friendList.length === 0 ? (
              <p className="text-ink/70 font-medium italic bg-white/50 p-4 rounded-xl border border-white/60 shadow-sm">
                you haven't added any friends yet.
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {friendList.map((friend) => (
                  <Link
                    key={friend.id}
                    to={`/u/${friend.username}`}
                    className="flex items-center justify-between p-4 rounded-xl bg-white/50 border border-white/60 hover:bg-white/80 hover:shadow-md transition-all group shadow-sm"
                  >
                    <span className="font-bold text-ink group-hover:text-cornflower transition-colors">
                      @{friend.username}
                    </span>
                    <span className="text-xs text-ink/60 font-bold group-hover:translate-x-1 transition-transform">
                      view profile →
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
