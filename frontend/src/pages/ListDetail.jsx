import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { searchExternalApi } from "../lib/api";
import {
  Search,
  Plus,
  ArrowLeft,
  Trash2,
  Edit2,
  CheckCircle2,
} from "lucide-react";
import RatingModal from '../components/RatingModal';

export default function ListDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [list, setList] = useState(null);
  const [items, setItems] = useState([]);

  // Search state
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // Edit List state
  const [isEditingList, setIsEditingList] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editForm, setEditForm] = useState({ title: "", description: "" });
  const [selectedItemForRating, setSelectedItemForRating] = useState(null);

  useEffect(() => {
    fetchListDetails();
  }, [id]);

  const fetchListDetails = async () => {
    // Fetch list metadata
    const { data: listData } = await supabase
      .from("lists")
      .select("*")
      .eq("id", id)
      .single();
    if (listData) {
      setList(listData);
      setEditForm({
        title: listData.title,
        description: listData.description || "",
      });
    }

    // Fetch items currently in the list
    if (listData) {
      const { data: itemsData } = await supabase
        .from("list_items")
        .select("*")
        .eq("list_id", id)
        .order("added_at", { ascending: false });
      setItems(itemsData || []);
    }
  };

  // --- LIST CRUD OPERATIONS ---

  const updateList = async (e) => {
    e.preventDefault();
    const { data, error } = await supabase
      .from("lists")
      .update(editForm)
      .eq("id", id)
      .select();
    if (!error && data) {
      setList(data[0]);
      setIsEditingList(false);
    }
  };

  const deleteList = async () => {
    const { error } = await supabase.from("lists").delete().eq("id", id);
    if (!error) navigate("/lists");
  };

  // --- ITEM CRUD OPERATIONS ---

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim() || !list) return;
    setIsSearching(true);
    const results = await searchExternalApi(list.category, query);
    setSearchResults(results);
    setIsSearching(false);
  };

  const addItem = async (item) => {
    const { data, error } = await supabase
      .from("list_items")
      .insert([
        {
          list_id: list.id,
          api_id: item.api_id,
          title: item.title,
          cover_url: item.cover_url,
          creator: item.creator,
        },
      ])
      .select();

    if (!error && data) {
      setItems([data[0], ...items]);
      setSearchResults([]);
      setQuery("");
    }
  };

  const removeItem = async (itemId) => {
    const { error } = await supabase
      .from("list_items")
      .delete()
      .eq("id", itemId);
    if (!error) setItems(items.filter((i) => i.id !== itemId));
  };

  const toggleItemDone = async (item) => {
    const { error } = await supabase
      .from("list_items")
      .update({ is_done: !item.is_done })
      .eq("id", item.id);
    if (!error)
      setItems(
        items.map((i) =>
          i.id === item.id ? { ...i, is_done: !item.is_done } : i,
        ),
      );
  };

  if (!list) return <div className="p-4">Loading list...</div>;

  return (
    <div className="max-w-3xl mx-auto">
      <Link
        to="/lists"
        className="text-cornflower hover:underline inline-flex items-center gap-1 mb-6 text-sm font-medium"
      >
        <ArrowLeft size={16} /> Back to Lists
      </Link>

      {/* Header & Edit List Mode */}
      {isEditingList ? (
        <form
          onSubmit={updateList}
          className="bg-white p-6 rounded-2xl border border-warmGray/10 shadow-sm mb-8 flex flex-col gap-4"
        >
          <input
            type="text"
            required
            value={editForm.title}
            onChange={(e) =>
              setEditForm({ ...editForm, title: e.target.value })
            }
            className="w-full text-xl px-4 py-2 rounded-xl border border-warmGray/30 bg-cream/50 focus:border-cornflower outline-none"
          />
          <textarea
            value={editForm.description}
            onChange={(e) =>
              setEditForm({ ...editForm, description: e.target.value })
            }
            className="w-full px-4 py-2 rounded-xl border border-warmGray/30 bg-cream/50 focus:border-cornflower outline-none resize-none"
          />
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsEditingList(false)}
              className="px-4 py-2 text-warmGray hover:text-ink font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-cornflower text-white rounded-xl font-medium"
            >
              Save Changes
            </button>
          </div>
        </form>
      ) : (
        <div className="mb-8 flex justify-between items-start gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-4xl text-ink">{list.title}</h1>
              <span className="text-xs font-medium px-2.5 py-1 bg-lightTint text-cornflower rounded-full">
                {list.category}
              </span>
            </div>
            {list.description && (
              <p className="text-warmGray text-lg">{list.description}</p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsEditingList(true)}
              className="p-2 text-warmGray hover:text-cornflower bg-white rounded-xl border border-warmGray/10 shadow-sm transition-colors"
              title="Edit List"
            >
              <Edit2 size={18} />
            </button>

            {confirmDelete ? (
              <div className="flex items-center gap-3 bg-red-50 text-red-600 px-3 py-1.5 rounded-xl text-sm border border-red-100">
                Sure?
                <button
                  onClick={deleteList}
                  className="font-bold hover:underline"
                >
                  Yes
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="hover:underline"
                >
                  No
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDelete(true)}
                className="p-2 text-warmGray hover:text-red-500 bg-white rounded-xl border border-warmGray/10 shadow-sm transition-colors"
                title="Delete List"
              >
                <Trash2 size={18} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Add Item Section */}
      <div className="bg-white p-6 rounded-2xl border border-warmGray/10 shadow-sm mb-8">
        <form onSubmit={handleSearch} className="flex gap-2 relative">
          <div className="relative flex-1">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-warmGray/50"
              size={20}
            />
            <input
              type="text"
              placeholder={`Search for a ${list.category.toLowerCase().slice(0, -1)}...`}
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-warmGray/30 bg-cream/50 focus:border-cornflower focus:ring-1 focus:ring-cornflower outline-none"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <button
            type="submit"
            disabled={isSearching}
            className="bg-ink hover:bg-ink/90 text-white px-6 rounded-xl font-medium"
          >
            {isSearching ? "..." : "Search"}
          </button>
        </form>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="mt-4 flex flex-col gap-2">
            {searchResults.map((res) => (
              <div
                key={res.api_id}
                className="flex items-center justify-between p-3 rounded-xl hover:bg-lightTint/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  {res.cover_url ? (
                    <img
                      src={res.cover_url}
                      alt={res.title}
                      className="w-12 h-12 object-cover rounded-md"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-warmGray/20 rounded-md flex items-center justify-center">
                      <Search size={16} className="text-warmGray" />
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-ink">{res.title}</p>
                    <p className="text-sm text-warmGray">{res.creator}</p>
                  </div>
                </div>
                <button
                  onClick={() => addItem(res)}
                  className="p-2 text-cornflower hover:bg-cornflower/10 rounded-lg"
                >
                  <Plus size={20} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* List Items Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {items.map((item) => (
          <div
            key={item.id}
            onClick={() => setSelectedItemForRating(item)} // <-- Opens Modal
            className="bg-white rounded-xl border border-warmGray/10 overflow-hidden shadow-sm group relative cursor-pointer hover:border-cornflower/50 transition-colors"
          >
            {/* Hover Actions (Delete & Toggle Done) */}
            <div className="absolute top-2 right-2 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-10">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleItemDone(item);
                }} // <-- Stop propagation!
                title={item.is_done ? "Mark as not done" : "Mark as done"}
                className={`p-1.5 rounded-lg shadow-sm backdrop-blur-sm transition-colors ${item.is_done ? "bg-green-500 text-white" : "bg-white/80 text-warmGray hover:text-green-600"}`}
              >
                <CheckCircle2 size={16} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeItem(item.id);
                }} // <-- Stop propagation!
                title="Remove item"
                className="p-1.5 bg-white/80 backdrop-blur-sm text-warmGray hover:text-red-500 rounded-lg shadow-sm transition-colors"
              >
                <Trash2 size={16} />
              </button>
            </div>

            <div
              className={
                item.is_done
                  ? "opacity-50 grayscale transition-all"
                  : "transition-all"
              }
            >
              {item.cover_url ? (
                <img
                  src={item.cover_url}
                  alt={item.title}
                  className="w-full aspect-[2/3] object-cover"
                />
              ) : (
                <div className="w-full aspect-[2/3] bg-warmGray/10 flex items-center justify-center p-4 text-center">
                  <span className="text-warmGray text-sm">{item.title}</span>
                </div>
              )}
            </div>

            <div className="p-3">
              <h4
                className={`font-medium text-sm truncate ${item.is_done ? "text-warmGray line-through" : "text-ink"}`}
                title={item.title}
              >
                {item.title}
              </h4>
              <p className="text-xs text-warmGray truncate">{item.creator}</p>
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <div className="col-span-full py-12 text-center text-warmGray">
            This list is empty. Search above to add items!
          </div>
        )}
          </div>
          {/* Add this block here */}
      {selectedItemForRating && (
        <RatingModal 
          item={selectedItemForRating} 
          category={list.category} 
          onClose={() => setSelectedItemForRating(null)} 
        />
      )}

    </div>
  );
}