import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { LogOut, X, Edit2, Loader, User } from "lucide-react";

export default function Profile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Edit Modal State
  const [showEdit, setShowEdit] = useState(false);
  const [editForm, setEditForm] = useState({ username: "", email: "" });
  const [editError, setEditError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;

    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (data) {
      setProfile(data);
      // Populate form with current data (fallback to auth email if not in profile table)
      setEditForm({
        username: data.username || "",
        email: data.email || user.email || "",
      });
    }
    setLoading(false);
  };

  const handleLogOut = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setEditError(null);

    // 1. Check if the email is valid using Regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(editForm.email)) {
      setEditError("please enter a valid email address");
      return; // Stop the save process!
    }

    setIsSaving(true);

    try {
      // 2. Update the secure auth vault (This changes their actual login & reset email!)
      if (editForm.email !== user.email) {
        const { error: authError } = await supabase.auth.updateUser({
          email: editForm.email,
        });
        if (authError) throw authError;
      }

      // 3. Update your public profiles table
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          username: editForm.username,
          email: editForm.email, // Optional: if you also store email in the profile table
        })
        .eq("id", user.id);

      if (profileError) throw profileError;

      // Success! Refresh data and close modal
      await fetchProfile();
      setShowEdit(false);
    } catch (err) {
      setEditError(err.message || "failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-slate-400 lowercase font-poppins">
        <Loader className="animate-spin mb-2" size={28} />
        <p className="text-xs font-bold tracking-widest uppercase">
          loading...
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 pt-12 pb-24 lowercase font-poppins text-ink animate-fade-in">
      {/* Profile Header */}
      <div
        className="rounded-[2rem] p-8 border border-white/50 mb-8 flex flex-col sm:flex-row items-center sm:items-start gap-6 relative overflow-hidden"
        style={{
          background: "rgba(255,255,255,0.45)",
          backdropFilter: "blur(20px)",
        }}
      >
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-cornflower to-purple-400 flex items-center justify-center shrink-0 border-4 border-white/60 shadow-lg text-white font-extrabold text-3xl">
          {profile?.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt="avatar"
              className="w-full h-full object-cover rounded-full"
            />
          ) : (
            profile?.username?.charAt(0).toUpperCase() || <User size={40} />
          )}
        </div>

        <div className="flex-1 text-center sm:text-left">
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">
            @{profile?.username || "unknown"}
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-1">
            {profile?.email || user?.email}
          </p>

          <div className="flex items-center justify-center sm:justify-start gap-3 mt-6">
            <button
              onClick={() => setShowEdit(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/60 border border-white hover:bg-white transition-all text-sm font-bold text-slate-700 shadow-sm hover:scale-105 active:scale-95"
            >
              <Edit2 size={16} /> edit profile
            </button>
            <button
              onClick={handleLogOut}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-red-50/50 border border-red-100 text-red-500 hover:bg-red-100 transition-all text-sm font-bold shadow-sm hover:scale-105 active:scale-95"
            >
              <LogOut size={16} /> log out
            </button>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {showEdit && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm animate-fade-in"
          onClick={() => setShowEdit(false)}
        >
          <div
            className="w-full max-w-md bg-white/90 backdrop-blur-2xl rounded-[2rem] border border-white/50 shadow-2xl overflow-hidden p-6 sm:p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-extrabold text-2xl text-slate-800">
                edit profile
              </h2>
              <button
                onClick={() => setShowEdit(false)}
                className="p-2 bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Custom Error Message Display */}
            {editError && (
              <div
                className="px-4 py-3 mb-6 rounded-xl text-sm font-medium animate-fade-in"
                style={{
                  background: "rgba(220, 38, 38, 0.1)",
                  color: "#dc2626",
                  border: "1px solid rgba(220, 38, 38, 0.2)",
                }}
              >
                {editError}
              </div>
            )}

            <form onSubmit={handleSave} className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  username
                </label>
                <input
                  type="text"
                  value={editForm.username}
                  onChange={(e) =>
                    setEditForm({ ...editForm, username: e.target.value })
                  }
                  className="w-full px-4 py-3 rounded-2xl bg-white/70 border border-slate-200 focus:border-cornflower outline-none transition-colors text-sm text-slate-800 shadow-inner"
                  placeholder="enter a username"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  email address
                </label>
                <input
                  type="text"
                  value={editForm.email}
                  onChange={(e) =>
                    setEditForm({ ...editForm, email: e.target.value })
                  }
                  className="w-full px-4 py-3 rounded-2xl bg-white/70 border border-slate-200 focus:border-cornflower outline-none transition-colors text-sm text-slate-800 shadow-inner"
                  placeholder="enter your email"
                />
              </div>

              <button
                type="submit"
                disabled={isSaving}
                className="w-full mt-4 py-3.5 rounded-2xl font-bold text-white text-sm transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60 shadow-md flex items-center justify-center gap-2"
                style={{
                  background:
                    "linear-gradient(135deg, #6495ed 0%, #8b6cf7 100%)",
                }}
              >
                {isSaving ? (
                  <Loader size={18} className="animate-spin" />
                ) : (
                  "save changes"
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
