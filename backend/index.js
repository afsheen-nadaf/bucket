import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

// 1. Load Environment Variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// 2. Initialize Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error(
    "Critical Error: Supabase URL or Service Role Key is missing in .env",
  );
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const verifyUser = async (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) throw new Error("Missing authorization header");
  const token = authHeader.split(" ")[1];
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);
  if (error || !user) throw new Error("Invalid token");
  return user;
};

const formatResult = (api_id, title, cover_url, creator) => ({
  api_id,
  title,
  cover_url,
  creator,
});

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

    // FIX: Added 'review' to the select statement to fetch the user's note!
    const { data: ratings, error: ratingsErr } = await supabase
      .from("ratings")
      .select("user_id, api_id, title, category, cover_url, user_id, review")
      .in("user_id", friendIds)
      .gte("rating", 4);

    if (ratingsErr) console.error("Ratings fetch error:", ratingsErr);

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

      if (itemsErr) console.error("List items fetch error:", itemsErr);

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
          review: item.review || null, // Attach the review note to the card!
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
    console.error("Recs Endpoint Error:", error);
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
      return res.status(403).json({ error: "Unauthorized access to list" });

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
    console.error("Add item error:", error);
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

// --- ENDPOINT: EXTERNAL SEARCH ---
app.get("/api/search", async (req, res) => {
  const { category, q, lat, lng } = req.query;
  if (!q || !category)
    return res.status(400).json({ error: "Missing query or category" });

  try {
    let results = [];
    if (category === "Movies") {
      const response = await fetch(
        `https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(q)}&api_key=${process.env.TMDB_API_KEY}`,
      );
      const data = await response.json();
      results = (data.results || [])
        .slice(0, 5)
        .map((m) =>
          formatResult(
            m.id.toString(),
            m.title,
            m.poster_path
              ? `https://image.tmdb.org/t/p/w500${m.poster_path}`
              : null,
            m.release_date?.split("-")[0],
          ),
        );
    } else if (category === "Books") {
      const response = await fetch(
        `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(q)}&maxResults=5`,
      );
      const data = await response.json();
      results = (data.items || []).map((b) =>
        formatResult(
          b.id,
          b.volumeInfo.title,
          b.volumeInfo.imageLinks?.thumbnail,
          b.volumeInfo.authors?.[0] || "Unknown Author",
        ),
      );
    } else if (category === "Music") {
      const response = await fetch(
        `https://itunes.apple.com/search?term=${encodeURIComponent(q)}&entity=album&limit=5`,
      );
      const data = await response.json();
      results = (data.results || []).map((a) =>
        formatResult(
          a.collectionId.toString(),
          a.collectionName,
          a.artworkUrl100?.replace("100x100", "600x600"),
          a.artistName,
        ),
      );
    } else if (category === "Places") {
  let url = lat && lng
    ? `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(q)}&limit=10&filter=circle:${lng},${lat},50000&bias=proximity:${lng},${lat}&apiKey=${process.env.GEOAPIFY_API_KEY}`
    : `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(q)}&limit=10&apiKey=${process.env.GEOAPIFY_API_KEY}`;

  const response = await fetch(url);
  const data = await response.json();
  let features = data.features || [];

  // If circle filter returned nothing, retry with just bias
  if (features.length === 0 && lat && lng) {
    const fallbackUrl = `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(q)}&limit=10&bias=proximity:${lng},${lat}&apiKey=${process.env.GEOAPIFY_API_KEY}`;
    const fallbackRes = await fetch(fallbackUrl);
    const fallbackData = await fallbackRes.json();
    features = fallbackData.features || [];
  }

  // Sort by confidence + popularity
  features.sort((a, b) => {
    const aScore = (a.properties.rank?.confidence || 0) + (a.properties.rank?.popularity || 0);
    const bScore = (b.properties.rank?.confidence || 0) + (b.properties.rank?.popularity || 0);
    return bScore - aScore;
  });

  // Deduplicate by name+city
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

      // Build a meaningful subtitle with street/neighbourhood context
      const subtitleParts = [
        props.street || props.neighbourhood || props.suburb, // closest context
        props.city || props.county,
        props.state,
        props.country,
      ].filter(Boolean);

      // Remove duplicates (suburb sometimes equals title)
      const subtitle = subtitleParts
        .filter((part) => part?.toLowerCase() !== title?.toLowerCase())
        .slice(0, 3) // max 3 parts to keep it readable
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
    console.error("Search error:", error);
    res.status(500).json({ error: "Failed to fetch search results" });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server listening on port ${PORT}`);
});
