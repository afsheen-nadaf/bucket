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
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  User,
  Star,
  UserPlus,
  UserCheck,
  UserMinus,
  List,
  PlusCircle,
  Sparkles,
  Lock,
  X,
  Edit2, // Added missing Edit2 import
  LogOut, // Added missing LogOut import
} from "lucide-react";

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
      xmlns="https://www.w3.org/2000/svg"
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

// Format the dynamic text verb depending on the category
function getActionText(category) {
  switch (category?.toLowerCase()) {
    case "movies":
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

export default function Profile() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [activeTab, setActiveTab] = useState(() => {
    const tabFromParams = searchParams.get("tab");
    return tabFromParams === "friends" ? "friends" : "activity";
  });

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profile, setProfile] = useState(null);
  const [ratings, setRatings] = useState([]);
  const [lists, setLists] = useState([]);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editUsername, setEditUsername] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [editBio, setEditBio] = useState("");
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [editError, setEditError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [friendList, setFriendList] = useState([]);
  const [toastMessage, setToastMessage] = useState(null);
  const [friendToRemove, setFriendToRemove] = useState(null);

  const deleteConfirmRef = useRef(null);
  const avatarInputRef = useRef(null);
  const searchTimeoutRef = useRef(null);

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
    setEditFirstName(profileData?.first_name || "");
    setEditLastName(profileData?.last_name || "");
    setEditUsername(profileData?.username || "");
    setEditBio(profileData?.bio || "");

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
    // Received requests
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

    // Sent requests
    const { data: sent } = await supabase
      .from("friends")
      .select("id, receiver_id")
      .eq("requester_id", user.id)
      .eq("status", "pending");

    if (sent?.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("*")
        .in(
          "id",
          sent.map((r) => r.receiver_id),
        );

      setSentRequests(
        sent.map((req) => ({
          ...req,
          profile: profiles.find((p) => p.id === req.receiver_id),
        })),
      );
    } else {
      setSentRequests([]);
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

  const updateProfile = async () => {
    setEditError(null);
    if (editUsername.length < 3 || editUsername.includes(" ")) {
      setUsernameError("min 3 characters, no spaces");
      return;
    }

    setIsSaving(true);
    const safeUsername = editUsername.toLowerCase().replace(/\s+/g, "");

    const { data: existing } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", safeUsername)
      .neq("id", user.id)
      .maybeSingle();

    if (existing) {
      setUsernameError("this username is already taken");
      setIsSaving(false);
      return;
    }

    setUsernameError("");

    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        first_name: editFirstName,
        last_name: editLastName,
        username: safeUsername,
        bio: editBio,
      })
      .eq("id", user.id);

    if (profileError) {
      setEditError("Failed to update profile.");
      setIsSaving(false);
      return;
    }

    setProfile({
      ...profile,
      first_name: editFirstName,
      last_name: editLastName,
      username: safeUsername,
      bio: editBio,
    });
    setIsEditingProfile(false);
    setIsSaving(false);
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText.toLowerCase() !== profile?.username?.toLowerCase()) {
      return;
    }
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      await supabase.functions.invoke("delete-account", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
    } catch (e) {
      // continue even if edge function fails
    }
    await signOut();
    navigate("/login");
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

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      handleSearch();
    }, 300);
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [searchQuery, handleSearch]);

  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const sendFriendRequest = async (receiverId) => {
    const { data, error } = await supabase
      .from("friends")
      .insert([
        { requester_id: user.id, receiver_id: receiverId, status: "pending" },
      ])
      .select()
      .single();

    if (!error && data) {
      fetchFriendsData();
      showToast("Friend request sent!");
    }
  };

  const acceptRequest = async (id) => {
    await supabase.from("friends").update({ status: "accepted" }).eq("id", id);
    fetchFriendsData();
    showToast("Friend request accepted!");
  };

  const declineRequest = async (id) => {
    await supabase.from("friends").delete().eq("id", id);
    fetchFriendsData();
  };

  const cancelRequest = async (id) => {
    await supabase.from("friends").delete().eq("id", id);
    fetchFriendsData();
    showToast("Request cancelled");
  };

  const executeRemoveFriend = async (friendId) => {
    await supabase
      .from("friends")
      .delete()
      .or(
        `and(requester_id.eq.${user.id},receiver_id.eq.${friendId}),and(requester_id.eq.${friendId},receiver_id.eq.${user.id})`,
      );

    setFriendToRemove(null);
    fetchFriendsData();
    showToast("Friend removed");
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${user.id}/avatar.${ext}`;
    const { error } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true });
    if (!error) {
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      const url = data.publicUrl + "?t=" + Date.now();
      await supabase
        .from("profiles")
        .update({ avatar_url: url })
        .eq("id", user.id);
      setProfile((prev) => ({ ...prev, avatar_url: url }));
    }
    setAvatarUploading(false);
  };

  const handleRemoveAvatar = async () => {
    setAvatarUploading(true);
    const { error } = await supabase
      .from("profiles")
      .update({ avatar_url: null })
      .eq("id", user.id);

    if (!error) {
      setProfile((prev) => ({ ...prev, avatar_url: null }));
    }
    setAvatarUploading(false);
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

  const displayName =
    profile?.first_name || profile?.last_name
      ? `${profile?.first_name || ""} ${profile?.last_name || ""}`.trim()
      : profile?.username;

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
    return <div className="text-center py-16 text-ink/60">loading...</div>;

  return (
    <div className="max-w-4xl mx-auto lowercase relative z-10 pb-12 mt-12 px-4">
      {/* Toast Notification for info messages */}
      {toastMessage && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-ink text-white px-5 py-2.5 rounded-full shadow-xl z-[9999] text-sm font-semibold animate-fade-in">
          {toastMessage}
        </div>
      )}

      {/* ── EDIT PROFILE MODAL ── */}
      {isEditingProfile && (
        <div
          className="fixed inset-0 z-[999999] flex items-center justify-center p-4"
          style={{
            background: "rgba(255,255,255,0.15)",
            backdropFilter: "blur(24px) saturate(180%)",
            animation: "overlayIn 0.2s ease both",
          }}
          onClick={() => setIsEditingProfile(false)}
        >
          <style>{`
            @keyframes overlayIn { from { opacity: 0; } to { opacity: 1; } }
            @keyframes slideUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
            nav, header, .navbar { display: none !important; }
            .custom-scroll::-webkit-scrollbar { width: 6px; }
            .custom-scroll::-webkit-scrollbar-track { background: transparent; margin-block: 1.5rem; }
            .custom-scroll::-webkit-scrollbar-thumb { background: rgba(100,149,237,0.25); border-radius: 10px; }
            .custom-scroll::-webkit-scrollbar-thumb:hover { background: rgba(100,149,237,0.45); }
          `}</style>
          <div
            className="w-full max-w-md max-h-[90vh] overflow-y-auto custom-scroll p-8 rounded-[2rem] relative flex flex-col gap-5"
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
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-2xl font-bold font-poppins text-ink">
                edit profile
              </h2>
              <button
                onClick={() => setIsEditingProfile(false)}
                className="p-2 bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {editError && (
              <div
                className="px-4 py-3 mb-2 rounded-xl text-sm font-medium animate-fade-in"
                style={{
                  background: "rgba(220, 38, 38, 0.1)",
                  color: "#dc2626",
                  border: "1px solid rgba(220, 38, 38, 0.2)",
                }}
              >
                {editError}
              </div>
            )}

            {/* Avatar */}
            <div className="flex flex-col items-center gap-2 mb-6">
              <div
                onClick={() => avatarInputRef.current?.click()}
                className="w-20 h-20 rounded-full overflow-hidden border-2 border-white/80 cursor-pointer relative group"
                style={{ background: "rgba(255,255,255,0.5)" }}
              >
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    className="w-full h-full object-cover"
                    alt="avatar"
                  />
                ) : (
                  <User size={36} className="text-cornflower m-auto mt-5" />
                )}
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-full">
                  <span className="text-white text-[10px] font-bold">
                    change
                  </span>
                </div>
                {avatarUploading && (
                  <div className="absolute inset-0 bg-white/60 flex items-center justify-center rounded-full">
                    <div className="w-5 h-5 border-2 border-cornflower border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>

              {/* Photo Actions */}
              <div className="flex items-center gap-2 mt-1">
                <button
                  onClick={() => avatarInputRef.current?.click()}
                  className="text-[10px] font-bold text-cornflower bg-cornflower/10 px-3 py-1.5 rounded-full hover:bg-cornflower/20 transition-colors"
                >
                  change
                </button>
                {profile?.avatar_url && (
                  <button
                    onClick={handleRemoveAvatar}
                    className="text-[10px] font-bold text-red-500 bg-red-500/10 px-3 py-1.5 rounded-full hover:bg-red-500/20 transition-colors"
                  >
                    remove
                  </button>
                )}
              </div>

              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
              />
            </div>

            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-500 ml-1">
                    first name
                  </label>
                  <input
                    type="text"
                    value={editFirstName}
                    onChange={(e) => setEditFirstName(e.target.value)}
                    className="px-4 py-3 rounded-xl border border-slate-200 outline-none text-sm bg-white/60 focus:bg-white focus:border-cornflower transition-colors"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-500 ml-1">
                    last name
                  </label>
                  <input
                    type="text"
                    value={editLastName}
                    onChange={(e) => setEditLastName(e.target.value)}
                    className="px-4 py-3 rounded-xl border border-slate-200 outline-none text-sm bg-white/60 focus:bg-white focus:border-cornflower transition-colors"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500 ml-1">
                  username
                </label>
                <input
                  type="text"
                  value={editUsername}
                  onChange={(e) => {
                    setEditUsername(e.target.value);
                    setUsernameError("");
                  }}
                  className="px-4 py-3 rounded-xl border border-slate-200 outline-none text-sm bg-white/60 focus:bg-white focus:border-cornflower transition-colors"
                />
                {usernameError && (
                  <p className="text-[11px] text-red-500 mt-1">
                    {usernameError}
                  </p>
                )}
                {editUsername.length > 0 &&
                  !usernameError &&
                  (editUsername.length < 3 || editUsername.includes(" ")) && (
                    <p className="text-[11px] text-red-500 ml-1">
                      min 3 characters, no spaces
                    </p>
                  )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500 ml-1">
                  bio ({editBio.length}/160)
                </label>
                <textarea
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value.slice(0, 160))}
                  maxLength={160}
                  rows={3}
                  className="px-4 py-3 rounded-xl border border-slate-200 outline-none text-sm bg-white/60 focus:bg-white focus:border-cornflower transition-colors resize-none"
                />
              </div>
            </div>

            <button
              onClick={updateProfile}
              disabled={isSaving}
              className="w-full font-bold py-4 rounded-xl text-white shadow-xl flex items-center justify-center gap-2 text-sm mt-2 hover:opacity-90 disabled:opacity-50 transition-opacity"
              style={{
                background: "linear-gradient(135deg, #6495ed 0%, #8b6cf7 100%)",
              }}
            >
              {isSaving ? "saving..." : "save changes"}
            </button>

            <div className="mt-2 pt-6 border-t border-slate-200 flex flex-col gap-4">
              <h3 className="font-poppins text-[10px] font-bold tracking-widest text-slate-400 uppercase ml-1">
                account settings
              </h3>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={async () => {
                    await signOut();
                    navigate("/login");
                  }}
                  className="px-5 py-2.5 rounded-xl font-bold text-xs border border-slate-200 bg-white/50 hover:bg-white transition-colors text-slate-700"
                >
                  log out
                </button>
                <button
                  onClick={() => {
                    const nextState = !showDeleteConfirm;
                    setShowDeleteConfirm(nextState);
                    if (nextState) {
                      setTimeout(() => {
                        deleteConfirmRef.current?.scrollIntoView({
                          behavior: "smooth",
                          block: "nearest",
                        });
                      }, 100);
                    }
                  }}
                  className="px-5 py-2.5 rounded-xl font-bold text-xs border border-red-100 bg-red-50/50 hover:bg-red-50 text-red-600 transition-colors"
                >
                  delete account
                </button>
              </div>

              {showDeleteConfirm && (
                <div
                  ref={deleteConfirmRef}
                  className="flex flex-col gap-3 p-5 rounded-[1.25rem] bg-red-50/80 border border-red-100 mt-2"
                >
                  <p className="text-xs text-red-900/70 font-medium leading-relaxed">
                    type{" "}
                    <span className="font-bold">"{profile?.username}"</span> to
                    confirm deletion:
                  </p>
                  <div className="flex flex-col gap-2">
                    <input
                      type="text"
                      placeholder="username"
                      value={deleteConfirmText}
                      onChange={(e) => setDeleteConfirmText(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl outline-none text-sm border border-red-200 bg-white focus:border-red-400 transition-colors"
                    />
                    <button
                      onClick={handleDeleteAccount}
                      disabled={
                        deleteConfirmText.toLowerCase() !==
                        profile?.username?.toLowerCase()
                      }
                      className="w-full py-3 rounded-xl font-bold text-sm text-white disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
                      style={{ background: "#dc2626" }}
                    >
                      confirm delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── HEADER ── */}
      <div
        className="p-6 rounded-[2rem] flex items-center gap-5 mb-4"
        style={glass}
      >
        <div className="relative flex-shrink-0">
          <div className="w-20 h-20 rounded-full bg-white/60 border-2 border-white/85 flex items-center justify-center shadow-inner overflow-hidden">
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt="avatar"
                className="w-full h-full object-cover"
              />
            ) : (
              <User size={36} className="text-cornflower" />
            )}
          </div>
          <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-cornflower rounded-full border-2 border-white flex items-center justify-center shadow-md">
            <Sparkles size={11} className="text-white" />
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-poppins font-bold text-ink leading-tight">
            {displayName}
          </h1>
          <p className="font-poppins text-sm text-ink/50 mt-0.5">
            @{profile?.username}
          </p>
          {profile?.bio && (
            <p className="font-poppins text-sm text-ink/55 mt-1 leading-relaxed">
              {profile.bio}
            </p>
          )}
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
          <div className="flex gap-2 mt-1">
            <button
              onClick={() => setIsEditingProfile(true)}
              className="px-3 py-1 rounded-full text-xs font-bold hover:scale-105 transition-all"
              style={{ background: "rgba(100,149,237,0.15)", color: "#6495ed" }}
            >
              edit profile
            </button>
            <button
              id="share-btn"
              onClick={async () => {
                await navigator.clipboard.writeText(
                  window.location.origin + "/u/" + profile?.username,
                );
                const btn = document.getElementById("share-btn");
                if (btn) {
                  btn.textContent = "copied!";
                  setTimeout(() => {
                    btn.textContent = "share";
                  }, 2000);
                }
              }}
              className="px-3 py-1 rounded-full text-xs font-bold hover:scale-105 transition-all"
              style={{ background: "rgba(100,149,237,0.15)", color: "#6495ed" }}
            >
              share
            </button>
          </div>
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

      {/* ACTIVITY */}
      {activeTab === "activity" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

          <div className="flex flex-col gap-4">
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
                        <p className="font-poppins font-semibold text-sm text-ink group-hover:text-cornflower transition-colors truncate">
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

      {/* RATINGS */}
      {activeTab === "ratings" && (
        <div>
          {ratings.length === 0 ? (
            <div className="p-14 rounded-[2rem] text-center" style={glass}>
              <Star size={32} className="mx-auto text-cornflower/30 mb-3" />
              <p className="font-poppins text-sm text-ink/55 font-medium">
                no ratings yet. open a list and tap an item to rate it!
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3 max-w-3xl">
              {ratings.map((r) => (
                <div
                  key={r.id}
                  className="p-5 rounded-[1.5rem] flex flex-col gap-3 transition-transform hover:-translate-y-0.5"
                  style={glass}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex flex-col gap-2 flex-1">
                      <span className="font-poppins text-[10px] font-bold px-2.5 py-1 bg-white/65 text-cornflower rounded-full border border-white/65 w-fit">
                        {r.category}
                      </span>
                      <h3 className="font-poppins font-bold text-ink text-lg leading-snug">
                        {r.title}
                      </h3>
                      {r.list_title && (
                        <span className="flex items-center gap-1 font-poppins text-[11px] text-ink/40">
                          <List size={11} /> {r.list_title}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-0.5 flex-shrink-0">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          size={14}
                          className={
                            i < r.rating
                              ? "fill-cornflower text-cornflower"
                              : "text-ink/15 fill-transparent"
                          }
                        />
                      ))}
                    </div>
                  </div>
                  {r.review && (
                    <p className="font-poppins text-sm text-ink/70 bg-white/45 px-4 py-3 rounded-xl border border-white/55 leading-relaxed italic">
                      "{r.review}"
                    </p>
                  )}
                  <p className="font-poppins text-[10px] text-ink/30">
                    {timeAgo(r.created_at)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* FRIENDS */}
      {activeTab === "friends" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              </div>
              {searchResults.length > 0 && (
                <div className="flex flex-col gap-2">
                  {searchResults.map((p) => {
                    const isFriend = friendList.some((f) => f.id === p.id);
                    const isSent = sentRequests.some(
                      (req) => req.profile?.id === p.id,
                    );
                    const isReceived = pendingRequests.some(
                      (req) => req.profile?.id === p.id,
                    );

                    return (
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
                        {isFriend ? (
                          <span className="text-[11px] font-bold text-ink/40 px-3 py-1.5">
                            friends
                          </span>
                        ) : isSent ? (
                          <span className="text-[11px] font-bold text-cornflower px-3 py-1.5 bg-cornflower/10 rounded-lg">
                            request sent
                          </span>
                        ) : isReceived ? (
                          <span className="text-[11px] font-bold text-ink/40 px-3 py-1.5">
                            check requests
                          </span>
                        ) : (
                          <button
                            onClick={() => sendFriendRequest(p.id)}
                            className="flex items-center gap-1 text-[11px] bg-cornflower text-white font-poppins font-semibold px-3 py-1.5 rounded-lg hover:scale-105 transition-transform"
                          >
                            <UserPlus size={12} /> add
                          </button>
                        )}
                      </div>
                    );
                  })}
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
                        >
                          <UserCheck size={14} />
                        </button>
                        <button
                          onClick={() => declineRequest(req.id)}
                          className="p-1.5 bg-white text-red-400 border border-red-100 rounded-lg hover:scale-110 transition-transform"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sent Requests Box */}
            {sentRequests.length > 0 && (
              <div className="p-5 rounded-[1.5rem]" style={glass}>
                <p className="font-poppins text-[10px] font-bold tracking-widest text-ink/40 uppercase mb-3 flex items-center gap-2">
                  sent requests
                </p>
                <div className="flex flex-col gap-2">
                  {sentRequests.map((req) => (
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
                      <button
                        onClick={() => cancelRequest(req.id)}
                        className="text-[10px] font-bold text-red-500/70 hover:text-red-500 bg-red-500/10 px-2.5 py-1.5 rounded-lg transition-colors"
                      >
                        cancel
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

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
                  <div
                    key={friend.id}
                    className="flex items-center justify-between px-5 py-3.5 hover:bg-white/30 transition-colors group"
                  >
                    <Link
                      to={`/u/${friend.username}`}
                      className="font-poppins font-semibold text-sm text-ink group-hover:text-cornflower transition-colors flex-1"
                    >
                      @{friend.username}
                    </Link>
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/u/${friend.username}`}
                        className="font-poppins text-xs text-ink/25 group-hover:text-cornflower/50 transition-all md:hidden group-hover:md:block"
                      >
                        →
                      </Link>
                      {/* Inline Remove Confirmation */}
                      {friendToRemove?.id === friend.id ? (
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold bg-red-50/80 text-ink/70">
                          sure?
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              executeRemoveFriend(friend.id);
                            }}
                            className="font-black text-red-600 hover:underline"
                          >
                            yes
                          </button>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              setFriendToRemove(null);
                            }}
                            className="hover:underline text-ink"
                          >
                            no
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            setFriendToRemove(friend);
                          }}
                          className="text-[10px] font-bold text-red-500/70 hover:text-red-500 px-2 py-1.5 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                        >
                          remove
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

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
      getActionText(data?.category)
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
        <p className="font-poppins font-semibold text-sm text-ink truncate">
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
