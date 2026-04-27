import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { Link } from "react-router-dom";
import { Search, UserPlus, UserCheck, X, Loader } from "lucide-react";

export default function Friends() {
  const { user } = useAuth();

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState(null);

  // Social state
  const [pendingRequests, setPendingRequests] = useState([]);
  const [friends, setFriends] = useState([]);

  useEffect(() => {
    fetchFriendsData();
  }, [user]);

  const fetchFriendsData = async () => {
    // Fetch pending requests received by the user
    const { data: requests } = await supabase
      .from("friends")
      .select("id, requester_id")
      .eq("receiver_id", user.id)
      .eq("status", "pending");

    if (requests?.length > 0) {
      // Get the profiles for these requesters
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

    // Fetch accepted friends
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
      setFriends(profiles || []);
    } else {
      setFriends([]);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .ilike("username", `%${searchQuery}%`)
      .neq("id", user.id) // Don't show yourself
      .limit(10);

    setSearchResults(data || []);
    setIsSearching(false);
  };

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    if (searchTimeout) clearTimeout(searchTimeout);
    setIsSearching(true);

    const timeout = setTimeout(() => {
      handleSearch();
    }, 300);

    setSearchTimeout(timeout);
  }, [searchQuery]);

  useEffect(() => {
    return () => {
      if (searchTimeout) clearTimeout(searchTimeout);
    };
  }, [searchTimeout]);

  const sendFriendRequest = async (receiverId) => {
    const { error } = await supabase
      .from("friends")
      .insert([
        { requester_id: user.id, receiver_id: receiverId, status: "pending" },
      ]);

    if (!error) {
      alert("Friend request sent!");
      setSearchResults([]);
      setSearchQuery("");
    }
  };

  const acceptRequest = async (requestId) => {
    await supabase
      .from("friends")
      .update({ status: "accepted" })
      .eq("id", requestId);
    fetchFriendsData(); // Refresh lists
  };

  const declineRequest = async (requestId) => {
    await supabase.from("friends").delete().eq("id", requestId);
    fetchFriendsData(); // Refresh lists
  };

  return (
    <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8">
      {/* Left Column: Search & Pending */}
      <div className="flex flex-col gap-8">
        {/* Search Users */}
        <div className="bg-white p-6 rounded-2xl border border-warmGray/10 shadow-sm">
          <h2 className="text-2xl text-ink mb-4">Find Friends</h2>
          <div className="flex gap-2 relative">
            <div className="relative flex-1">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 text-warmGray/50"
                size={20}
              />
              <input
                type="text"
                placeholder="Search by username..."
                className="w-full pl-12 pr-10 py-2.5 rounded-xl border border-warmGray/30 bg-cream/50 focus:border-cornflower outline-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {isSearching && (
                <Loader
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-cornflower animate-spin"
                  size={18}
                />
              )}
            </div>
          </div>

          {searchResults.length > 0 && (
            <div className="mt-4 flex flex-col gap-2">
              {searchResults.map((profile) => (
                <div
                  key={profile.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-cream/30 border border-warmGray/10"
                >
                  <Link
                    to={`/u/${profile.username}`}
                    className="font-medium text-ink hover:text-cornflower transition-colors"
                  >
                    @{profile.username}
                  </Link>
                  <button
                    onClick={() => sendFriendRequest(profile.id)}
                    className="flex items-center gap-1 text-sm bg-cornflower text-white px-3 py-1.5 rounded-lg hover:bg-cornflower/90 transition-colors"
                  >
                    <UserPlus size={16} /> Add
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pending Requests */}
        {pendingRequests.length > 0 && (
          <div className="bg-white p-6 rounded-2xl border border-warmGray/10 shadow-sm">
            <h2 className="text-xl text-ink mb-4">Friend Requests</h2>
            <div className="flex flex-col gap-3">
              {pendingRequests.map((req) => (
                <div
                  key={req.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-lightTint/50"
                >
                  <Link
                    to={`/u/${req.profile?.username}`}
                    className="font-medium text-ink hover:text-cornflower"
                  >
                    @{req.profile?.username}
                  </Link>
                  <div className="flex gap-2">
                    <button
                      onClick={() => acceptRequest(req.id)}
                      className="p-2 bg-white text-green-600 rounded-lg hover:bg-green-50 shadow-sm"
                      title="Accept"
                    >
                      <UserCheck size={18} />
                    </button>
                    <button
                      onClick={() => declineRequest(req.id)}
                      className="p-2 bg-white text-red-500 rounded-lg hover:bg-red-50 shadow-sm"
                      title="Decline"
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

      {/* Right Column: Friends List */}
      <div className="bg-white p-6 rounded-2xl border border-warmGray/10 shadow-sm h-fit">
        <h2 className="text-2xl text-ink mb-4">My Friends</h2>
        {friends.length === 0 ? (
          <p className="text-warmGray text-sm">
            You haven't added any friends yet.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {friends.map((friend) => (
              <Link
                key={friend.id}
                to={`/u/${friend.username}`}
                className="flex items-center justify-between p-3 rounded-xl hover:bg-lightTint/50 transition-colors border border-transparent hover:border-warmGray/10"
              >
                <span className="font-medium text-ink">@{friend.username}</span>
                <span className="text-xs text-warmGray">View Profile →</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
