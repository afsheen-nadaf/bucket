const API_URL = "http://localhost:3001/api";

export const searchExternalApi = async (category, query) => {
  try {
    const res = await fetch(
      `${API_URL}/search?category=${category}&q=${encodeURIComponent(query)}`,
    );
    if (!res.ok) throw new Error("Search failed");
    const data = await res.json();
    return data.results;
  } catch (error) {
    console.error(error);
    return [];
  }
};
