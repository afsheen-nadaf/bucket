const API_URL = "http://localhost:3001/api";

export const searchExternalApi = async (category, query, location = null) => {
  try {
    let url = `${API_URL}/search?category=${category}&q=${encodeURIComponent(query)}`;
    if (location) {
      url += `&lat=${location.lat}&lng=${location.lng}`;
    }
    const res = await fetch(url);
    if (!res.ok) throw new Error("Search failed");
    const data = await res.json();
    return data.results;
  } catch (error) {
    console.error(error);
    return [];
  }
};
