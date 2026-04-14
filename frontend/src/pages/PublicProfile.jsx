import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { User, Star, Lock } from "lucide-react";

export default function PublicProfile() {
  const { username } = useParams();
  const [profile, setProfile] = useState(null);
  const [publicLists, setPublicLists] = useState([]);
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserData();
  }, [username]);

  const fetchUserData = async () => {
    setLoading(true);

    // 1. Fetch Profile by Username
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

    // 2. Fetch their PUBLIC Lists
    const { data: listsData } = await supabase
      .from("lists")
      .select("*")
      .eq("user_id", profileData.id)
      .eq("is_public", true)
      .order("created_at", { ascending: false });

    setPublicLists(listsData || []);

    // 3. Fetch their Ratings
    const { data: ratingsData } = await supabase
      .from("ratings")
      .select("*")
      .eq("user_id", profileData.id)
      .order("created_at", { ascending: false });

    setRatings(ratingsData || []);
    setLoading(false);
  };

  if (loading) return <div className="p-4 text-warmGray">Loading...</div>;
  if (!profile) return <div className="p-4 text-red-500">User not found.</div>;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Profile Header */}
      <div className="bg-white p-8 rounded-2xl border border-warmGray/10 shadow-sm flex items-center gap-6 mb-8">
        <div className="w-24 h-24 bg-lightTint text-cornflower rounded-full flex items-center justify-center">
          <User size={48} />
        </div>
        <div>
          <h1 className="text-3xl text-ink font-fredoka">
            @{profile.username}
          </h1>
          <p className="text-warmGray mt-1">{profile.bio || "No bio yet."}</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Public Lists */}
        <div>
          <h2 className="text-2xl text-ink mb-4">Public Lists</h2>
          {publicLists.length === 0 ? (
            <div className="bg-white p-6 rounded-2xl border border-warmGray/10 border-dashed text-center">
              <Lock size={24} className="mx-auto text-warmGray/30 mb-2" />
              <p className="text-warmGray text-sm">No public lists to show.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {publicLists.map((list) => (
                <Link
                  key={list.id}
                  to={`/lists/${list.id}`}
                  className="bg-white p-4 rounded-2xl border border-warmGray/10 shadow-sm hover:border-cornflower/50 transition-colors block"
                >
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="text-lg text-ink font-medium">
                      {list.title}
                    </h3>
                    <span className="text-xs font-medium px-2 py-0.5 bg-lightTint text-cornflower rounded-full">
                      {list.category}
                    </span>
                  </div>
                  {list.description && (
                    <p className="text-warmGray text-sm line-clamp-2">
                      {list.description}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Ratings */}
        <div>
          <h2 className="text-2xl text-ink mb-4">Recent Ratings</h2>
          {ratings.length === 0 ? (
            <div className="bg-white p-6 rounded-2xl border border-warmGray/10 border-dashed text-center">
              <p className="text-warmGray text-sm">No ratings yet.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {ratings.map((rating) => (
                <div
                  key={rating.id}
                  className="bg-white p-4 rounded-2xl border border-warmGray/10 shadow-sm"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-medium px-2 py-0.5 bg-lightTint text-cornflower rounded-full">
                      {rating.category}
                    </span>
                    <div className="flex items-center text-cornflower">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          size={14}
                          className={
                            i < rating.rating
                              ? "fill-current"
                              : "text-warmGray/30 fill-transparent"
                          }
                        />
                      ))}
                    </div>
                  </div>
                  {rating.review && (
                    <p className="text-ink text-sm italic">"{rating.review}"</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
