import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { Buffer } from "buffer";

// 1. load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// 2. initialize supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error(
    "critical error: supabase url or service role key is missing in .env",
  );
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const verifyUser = async (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) throw new Error("missing authorization header");
  const token = authHeader.split(" ")[1];
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);
  if (error || !user) throw new Error("invalid token");
  return user;
};

const formatResult = (api_id, title, cover_url, creator) => ({
  api_id,
  title,
  cover_url,
  creator,
});

// spotify token management
let spotifyToken = null;
let spotifyTokenExpiration = null;

const getSpotifyToken = async () => {
  if (spotifyToken && Date.now() < spotifyTokenExpiration) {
    return spotifyToken;
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("spotify credentials missing in .env");
  }

  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization:
        "Basic " +
        Buffer.from(clientId + ":" + clientSecret).toString("base64"),
    },
    body: "grant_type=client_credentials",
  });

  const data = await response.json();
  if (!response.ok)
    throw new Error(data.error_description || "failed to get spotify token");

  spotifyToken = data.access_token;
  spotifyTokenExpiration = Date.now() + (data.expires_in - 60) * 1000; // 60s buffer
  return spotifyToken;
};

// --- ENDPOINT: GET RECOMMENDATIONS ---
app.get("/api/recommendations", async (req, res) => {
  try {
    const user = await verifyUser(req);
    const userId = user.id;

    const { data: friends } = await supabase
      .from("friends")
      .select("*")
      .or(`requester_id.eq.${userId},receiver_id.eq.${userId}`)
      .eq("status", "accepted");

    if (!friends || friends.length === 0)
      return res.json({ recommendations: [] });
    const friendIds = friends.map((f) =>
      f.requester_id === userId ? f.receiver_id : f.requester_id,
    );

    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, username")
      .in("id", friendIds);
    const profileMap = (profiles || []).reduce(
      (acc, p) => ({ ...acc, [p.id]: p.username }),
      {},
    );

    const { data: ratings, error: ratingsErr } = await supabase
      .from("ratings")
      .select("user_id, api_id, title, category, cover_url, user_id, review")
      .in("user_id", friendIds)
      .gte("rating", 4);

    if (ratingsErr) console.error("ratings fetch error:", ratingsErr);

    const { data: publicLists } = await supabase
      .from("lists")
      .select("id, category, user_id")
      .in("user_id", friendIds)
      .eq("is_public", true);

    const listMap = (publicLists || []).reduce(
      (acc, l) => ({ ...acc, [l.id]: l }),
      {},
    );
    const listIds = Object.keys(listMap);

    let friendListItems = [];
    if (listIds.length > 0) {
      const { data: items, error: itemsErr } = await supabase
        .from("list_items")
        .select("list_id, api_id, title, cover_url, user_id")
        .in("list_id", listIds);

      if (itemsErr) console.error("list items fetch error:", itemsErr);

      friendListItems = (items || []).map((item) => ({
        ...item,
        user_id: listMap[item.list_id].user_id,
        category: listMap[item.list_id].category,
      }));
    }

    const { data: myRatings } = await supabase
      .from("ratings")
      .select("api_id")
      .eq("user_id", userId);
    const { data: myLists } = await supabase
      .from("lists")
      .select("id")
      .eq("user_id", userId);
    const myListIds = (myLists || []).map((l) => l.id);

    let myListItems = [];
    if (myListIds.length > 0) {
      const { data: uItems } = await supabase
        .from("list_items")
        .select("api_id")
        .in("list_id", myListIds);
      myListItems = uItems || [];
    }

    const { data: myDismissed } = await supabase
      .from("dismissed_recs")
      .select("external_id")
      .eq("user_id", userId);

    const excludedIds = new Set([
      ...(myRatings || []).map((r) => r.api_id),
      ...(myListItems || []).map((i) => i.api_id),
      ...(myDismissed || []).map((d) => d.external_id),
    ]);

    const recMap = {};
    const processItem = (item) => {
      const id = item.api_id;
      if (!id || excludedIds.has(id)) return;
      if (!recMap[id]) {
        recMap[id] = {
          external_id: id,
          item_name: item.title,
          category: item.category,
          cover_url: item.cover_url,
          creator: item.creator,
          review: item.review || null,
          friendSet: new Set(),
        };
      } else if (item.review && !recMap[id].review) {
        recMap[id].review = item.review;
      }
      recMap[id].friendSet.add(item.user_id);
    };

    (ratings || []).forEach(processItem);
    friendListItems.forEach(processItem);

    const recommendations = Object.values(recMap)
      .map((item) => {
        const friendArray = Array.from(item.friendSet);
        const score = friendArray.length;
        const firstFriend = profileMap[friendArray[0]] || "someone";

        let friend_label = `@${firstFriend} loved this!`;
        if (score === 2)
          friend_label = `@${firstFriend} and 1 other loved this!`;
        else if (score > 2)
          friend_label = `@${firstFriend} and ${score - 1} others loved this!`;

        return { ...item, friend_label, score };
      })
      .sort((a, b) => b.score - a.score);

    res.json({ recommendations });
  } catch (error) {
    console.error("recs endpoint error:", error);
    res.status(500).json({ error: error.message });
  }
});

// --- ENDPOINT: ADD ITEM TO LIST ---
app.post("/api/lists/:listId/items", async (req, res) => {
  try {
    const user = await verifyUser(req);
    const { listId } = req.params;
    const { item_name, external_id, cover_url, creator } = req.body;

    const { data: list } = await supabase
      .from("lists")
      .select("user_id")
      .eq("id", listId)
      .single();
    if (!list || list.user_id !== user.id)
      return res.status(403).json({ error: "unauthorized access to list" });

    const { data, error } = await supabase
      .from("list_items")
      .insert([
        {
          list_id: listId,
          title: item_name,
          api_id: external_id,
          cover_url: cover_url,
          creator: creator,
        },
      ])
      .select();

    if (error) throw error;
    res.json({ item: data[0] });
  } catch (error) {
    console.error("add item error:", error);
    res.status(500).json({ error: error.message });
  }
});

// --- ENDPOINT: GET MY LISTS ---
app.get("/api/lists/mine", async (req, res) => {
  try {
    const user = await verifyUser(req);
    const { data: lists, error } = await supabase
      .from("lists")
      .select("id, title, category")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) throw error;
    res.json({ lists: lists || [] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- ENDPOINT: DISMISS REC ---
app.post("/api/dismissed-recs", async (req, res) => {
  try {
    const user = await verifyUser(req);
    const { external_id, item_name } = req.body;
    await supabase.from("dismissed_recs").insert([
      {
        user_id: user.id,
        external_id,
        item_name,
      },
    ]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- ENDPOINT: LIKE RECOMMENDATION ---
app.post("/api/recommendations/:id/like", async (req, res) => {
  try {
    const user = await verifyUser(req);
    const { id } = req.params;

    const { data: existing } = await supabase
      .from("likes")
      .select("*")
      .eq("user_id", user.id)
      .eq("api_id", id)
      .maybeSingle();

    if (existing) {
      await supabase.from("likes").delete().eq("id", existing.id);
      res.json({ liked: false });
    } else {
      await supabase.from("likes").insert([{ user_id: user.id, api_id: id }]);
      res.json({ liked: true });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- ENDPOINT: COMMENT ON RECOMMENDATION ---
app.post("/api/recommendations/:id/comments", async (req, res) => {
  try {
    const user = await verifyUser(req);
    const { id } = req.params;
    const { text } = req.body;

    const { data, error } = await supabase
      .from("comments")
      .insert([{ user_id: user.id, api_id: id, text }])
      .select("*, profiles(username, avatar_url)")
      .single();

    if (error) throw error;
    res.json({ comment: data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- ENDPOINT: GET SOCIAL DATA (LIKES/COMMENTS) ---
app.get("/api/recommendations/:id/social", async (req, res) => {
  try {
    const user = await verifyUser(req);
    const { id } = req.params;

    const { data: comments } = await supabase
      .from("comments")
      .select("*, profiles(username, avatar_url)")
      .eq("api_id", id)
      .order("created_at", { ascending: true });

    const { data: likes } = await supabase
      .from("likes")
      .select("user_id")
      .eq("api_id", id);

    const hasLiked = likes?.some((l) => l.user_id === user.id) || false;

    res.json({
      comments: comments || [],
      likeCount: likes?.length || 0,
      hasLiked,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- ENDPOINT: EXTERNAL SEARCH ---
app.get("/api/search", async (req, res) => {
  const { category, q, lat, lng } = req.query;
  if (!q || !category)
    return res.status(400).json({ error: "missing query or category" });

  try {
    let results = [];
    if (category === "Movies") {
      // using search/multi to get both movies and tv shows
      const response = await fetch(
        `https://api.themoviedb.org/3/search/multi?query=${encodeURIComponent(q)}&api_key=${process.env.TMDB_API_KEY}`,
      );
      const data = await response.json();

      results = (data.results || [])
        .filter((m) => m.media_type === "movie" || m.media_type === "tv") // filter out actors/people
        .slice(0, 5)
        .map((m) => {
          // movies use 'title', tv shows use 'name'
          const title = m.title || m.name;
          // movies use 'release_date', tv shows use 'first_air_date'
          const date = m.release_date || m.first_air_date;
          const year = date ? date.split("-")[0] : "unknown year";
          const typeLabel = m.media_type === "tv" ? "tv show" : "movie";

          return formatResult(
            m.id.toString(),
            title,
            m.poster_path
              ? `https://image.tmdb.org/t/p/w500${m.poster_path}`
              : null,
            `${year} • ${typeLabel}`, // makes the creator text say "2023 • tv show" or "1989 • movie"
          );
        });
    } else if (category === "Books") {
      const response = await fetch(
        `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(q)}&maxResults=15`,
      );
      const data = await response.json();
      const seenBooks = new Set();

      results = (data.items || [])
        .filter((b) => {
          const titleKey = b.volumeInfo.title?.toLowerCase();
          const idKey = b.id;
          if (!titleKey || seenBooks.has(titleKey) || seenBooks.has(idKey))
            return false;
          seenBooks.add(titleKey);
          seenBooks.add(idKey);
          return true;
        })
        .slice(0, 5)
        .map((b) =>
          formatResult(
            b.id,
            b.volumeInfo.title,
            b.volumeInfo.imageLinks?.thumbnail?.replace("http:", "https:"),
            b.volumeInfo.authors?.[0] || "unknown author",
          ),
        );
    } else if (category === "Music") {
      const token = await getSpotifyToken();

      // Try to make query more track-specific
      const trackQuery = q.toLowerCase().includes("artist:") ? q : `track:${q}`;

      const response = await fetch(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(trackQuery)}&type=track&limit=15`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const data = await response.json();
      const seenTracks = new Set();

      results = (data.tracks?.items || [])
        .filter((t) => {
          // filter out tracks that are just named after their album (usually compilation/album entries)
          const trackName = t.name.toLowerCase();
          const albumName = t.album?.name?.toLowerCase();
          if (trackName === albumName) return false;

          // filter out obvious non-song results
          const junkyPhrases = [
            "piano cover",
            "karaoke",
            "tribute",
            "made famous",
            "originally performed",
            "lower key",
            "arr. piano",
            "bonus track version",
            "- single",
            "(single)",
          ];
          if (junkyPhrases.some((p) => trackName.includes(p))) return false;

          // dedup
          const key = `${t.name}-${t.artists[0]?.name}`.toLowerCase();
          if (seenTracks.has(key)) return false;
          seenTracks.add(key);
          return true;
        })
        .sort((a, b) => b.popularity - a.popularity) // sort by track popularity
        .slice(0, 5)
        .map((t) =>
          formatResult(
            t.id,
            t.name,
            t.album?.images?.[0]?.url || null,
            `${t.artists?.[0]?.name || "unknown artist"} • ${t.album?.name || ""}`,
          ),
        );
    } else if (category === "Places") {
      let url =
        lat && lng
          ? `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(q)}&limit=10&filter=circle:${lng},${lat},50000&bias=proximity:${lng},${lat}&apiKey=${process.env.GEOAPIFY_API_KEY}`
          : `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(q)}&limit=10&apiKey=${process.env.GEOAPIFY_API_KEY}`;

      const response = await fetch(url);
      const data = await response.json();
      let features = data.features || [];

      if (features.length === 0 && lat && lng) {
        const fallbackUrl = `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(q)}&limit=10&bias=proximity:${lng},${lat}&apiKey=${process.env.GEOAPIFY_API_KEY}`;
        const fallbackRes = await fetch(fallbackUrl);
        const fallbackData = await fallbackRes.json();
        features = fallbackData.features || [];
      }

      features.sort((a, b) => {
        const aScore =
          (a.properties.rank?.confidence || 0) +
          (a.properties.rank?.popularity || 0);
        const bScore =
          (b.properties.rank?.confidence || 0) +
          (b.properties.rank?.popularity || 0);
        return bScore - aScore;
      });

      const seen = new Set();
      results = features
        .filter((f) => {
          const props = f.properties;
          const key = `${(props.name || props.suburb || props.address_line1)?.toLowerCase()}-${props.city?.toLowerCase()}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        })
        .slice(0, 5)
        .map((f) => {
          const props = f.properties;
          const title = props.name || props.suburb || props.address_line1;

          const subtitleParts = [
            props.street || props.neighbourhood || props.suburb,
            props.city || props.county,
            props.state,
            props.country,
          ].filter(Boolean);

          const subtitle = subtitleParts
            .filter((part) => part?.toLowerCase() !== title?.toLowerCase())
            .slice(0, 3)
            .join(", ");

          return formatResult(
            props.place_id?.toString() || f.id,
            title,
            null,
            subtitle,
          );
        });
    }
    res.json({ results });
  } catch (error) {
    console.error("search error:", error);
    res.status(500).json({ error: "failed to fetch search results" });
  }
});

app.listen(PORT, () => {
  console.log(`backend server listening on port ${PORT}`);
});
