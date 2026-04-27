"use client";

import React, { useEffect, useState, Suspense, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "@/services/api";
import { useAuth } from "@/context/AuthContext";
import { MenuCard } from "@/components/MenuCard";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Search, SlidersHorizontal, Star, Flame, Sparkles, TrendingUp } from "lucide-react";

interface MenuItem {
  _id: string;
  name: string;
  category: string;
  price: number;
  basePrice?: number;
  image?: string;
  description?: string;
  availability: boolean;
  isVeg: boolean;
  preparationTime: number;
  stockQuantity: number;
  avgRating: number;
  ratingCount: number;
  carbonScore: number;
  carbonSaving: number;
}

interface Canteen {
  _id: string;
  name: string;
}

function MenuContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const initialCanteen = searchParams ? searchParams.get("canteen") || "" : "";

  // Filter and Search States
  const [canteens, setCanteens] = useState<Canteen[]>([]);
  const [selectedCanteen, setSelectedCanteen] = useState(initialCanteen);
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [vegOnly, setVegOnly] = useState(false);
  const [sortBy, setSortBy] = useState("default");

  // Data States
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [trendingItems, setTrendingItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Categories list
  const categories = ["All", "Breakfast", "Lunch", "Snacks", "Beverages", "Dessert"];

  useEffect(() => {
    // Fetch canteens list
    const fetchCanteens = async () => {
      try {
        const res = await api.get("/api/canteens");
        setCanteens(res.data);
      } catch (err) {
        console.error("Canteen fetch error", err);
      }
    };
    fetchCanteens();
  }, []);

  // Fetch trending items
  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const res = await api.get("/api/recommendations/trending");
        setTrendingItems(res.data);
      } catch (err) {
        console.error("Trending fetch error", err);
      }
    };
    fetchTrending();
  }, []);

  // Fetch Menu Items with filters
  useEffect(() => {
    const fetchMenu = async () => {
      setLoading(true);
      try {
        const params: any = {};
        if (selectedCanteen) params.canteen = selectedCanteen;
        if (selectedCategory !== "All") params.category = selectedCategory;
        if (vegOnly) params.veg = "true";
        if (searchQuery) params.q = searchQuery;

        const res = await api.get("/api/menu", { params });
        let items = res.data;

        // Apply Sorting
        if (sortBy === "priceAsc") {
          items.sort((a: MenuItem, b: MenuItem) => a.price - b.price);
        } else if (sortBy === "priceDesc") {
          items.sort((a: MenuItem, b: MenuItem) => b.price - a.price);
        } else if (sortBy === "rating") {
          items.sort((a: MenuItem, b: MenuItem) => b.avgRating - a.avgRating);
        } else if (sortBy === "prepTime") {
          items.sort((a: MenuItem, b: MenuItem) => a.preparationTime - b.preparationTime);
        }

        setMenuItems(items);
      } catch (err) {
        console.error("Menu fetch error", err);
      } finally {
        setLoading(false);
      }
    };

    const delayDebounce = setTimeout(() => {
      fetchMenu();
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [selectedCanteen, selectedCategory, vegOnly, searchQuery, sortBy]);

  // Suggestions handler
  const handleSearchChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);

    if (value.trim().length > 1) {
      try {
        const res = await api.get(`/api/menu/suggestions?q=${value}`);
        setSuggestions(res.data);
      } catch (err) {
        console.error("Suggestions error", err);
      }
    } else {
      setSuggestions([]);
    }
  };

  const handleSuggestionClick = (name: string) => {
    setSearchQuery(name);
    setSuggestions([]);
  };

  return (
    <div className="container menu-page animate-fadeIn">
      {/* Search and Canteen Row */}
      <div className="search-filter-row">
        <div className="search-wrapper">
          <Search className="search-icon" size={18} />
          <input
            type="text"
            className="form-input search-input"
            placeholder="Search delicious campus food..."
            value={searchQuery}
            onChange={handleSearchChange}
          />
          {suggestions.length > 0 && (
            <div className="suggestions-dropdown card">
              {suggestions.map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSuggestionClick(s.name)}
                  className="suggestion-item"
                >
                  <span>{s.name}</span>
                  <span className="badge badge-muted">{s.category}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="filter-selects">
          <div className="select-with-icon">
            <SlidersHorizontal size={14} className="select-icon" />
            <select
              className="form-select filter-canteen-select"
              value={selectedCanteen}
              onChange={(e) => setSelectedCanteen(e.target.value)}
            >
              <option value="">All Canteens</option>
              {canteens.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <select
            className="form-select sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="default">Sort by: Relevance</option>
            <option value="priceAsc">Price: Low to High</option>
            <option value="priceDesc">Price: High to Low</option>
            <option value="rating">Top Rated</option>
            <option value="prepTime">Fastest Prep</option>
          </select>
        </div>
      </div>

      {/* Category Tabs & Veg Filter Row */}
      <div className="tabs-row">
        <div className="category-tabs">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`category-tab ${selectedCategory === cat ? "active" : ""}`}
            >
              {cat}
            </button>
          ))}
        </div>

        <label className="veg-toggle-label">
          <input
            type="checkbox"
            checked={vegOnly}
            onChange={() => setVegOnly(!vegOnly)}
            className="veg-checkbox"
          />
          <span className="veg-toggle-button">🌱 Veg Only</span>
        </label>
      </div>

      {/* Trending Section */}
      {trendingItems.length > 0 && searchQuery === "" && (
        <section className="trending-section">
          <h2 className="section-title"><TrendingUp size={20} className="text-amber-500" /> Trending Weekly Favorites</h2>
          <div className="trending-grid">
            {trendingItems.slice(0, 4).map((item) => (
              <MenuCard key={item._id} item={item} />
            ))}
          </div>
        </section>
      )}

      {/* Main Menu Grid */}
      <section className="main-menu-section">
        <h2 className="section-title"><Sparkles size={20} className="text-orange-500" /> Smart Menu</h2>
        {loading ? (
          <LoadingSpinner />
        ) : menuItems.length === 0 ? (
          <div className="empty-menu card text-center">
            <h3>No items found</h3>
            <p>Try refining your search queries or category filters.</p>
          </div>
        ) : (
          <div className="menu-grid stagger">
            {menuItems.map((item) => (
              <MenuCard key={item._id} item={item} />
            ))}
          </div>
        )}
      </section>

      <style jsx>{`
        .menu-page {
          padding-top: 40px;
        }
        .search-filter-row {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 20px;
          margin-bottom: 24px;
        }
        .search-wrapper {
          position: relative;
        }
        .search-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--color-text-secondary);
        }
        .search-input {
          padding-left: 44px !important;
          width: 100%;
        }
        .suggestions-dropdown {
          position: absolute;
          top: calc(100% + 8px);
          left: 0;
          width: 100%;
          z-index: 100;
          padding: 8px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .suggestion-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 14px;
          border-radius: var(--radius-sm);
          font-size: 14px;
          color: var(--color-text-secondary);
          transition: all var(--transition-fast);
          width: 100%;
          text-align: left;
        }
        .suggestion-item:hover {
          background: var(--color-surface-hover);
          color: var(--color-text);
        }
        .filter-selects {
          display: flex;
          gap: 12px;
        }
        .select-with-icon {
          position: relative;
          display: flex;
          align-items: center;
        }
        .select-icon {
          position: absolute;
          left: 14px;
          color: var(--color-text-secondary);
          pointer-events: none;
        }
        .filter-canteen-select {
          padding-left: 36px !important;
          min-width: 180px;
        }
        .sort-select {
          min-width: 160px;
        }
        .tabs-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 32px;
          gap: 24px;
          flex-wrap: wrap;
        }
        .category-tabs {
          display: flex;
          gap: 8px;
          overflow-x: auto;
          padding-bottom: 6px;
        }
        .category-tab {
          padding: 8px 18px;
          border-radius: var(--radius-full);
          font-size: 13px;
          font-weight: 600;
          color: var(--color-text-secondary);
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          transition: all var(--transition-fast);
        }
        .category-tab.active, .category-tab:hover {
          background: var(--color-primary-light);
          color: var(--color-primary);
          border-color: var(--color-primary);
        }
        .veg-toggle-label {
          cursor: pointer;
        }
        .veg-checkbox {
          display: none;
        }
        .veg-toggle-button {
          display: inline-block;
          padding: 8px 18px;
          border-radius: var(--radius-full);
          font-size: 13px;
          font-weight: 600;
          color: var(--color-text-secondary);
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          transition: all var(--transition-fast);
        }
        .veg-checkbox:checked + .veg-toggle-button {
          background: var(--color-success-light);
          color: var(--color-success);
          border-color: var(--color-success);
        }
        .section-title {
          font-size: 20px;
          font-weight: 700;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .trending-section {
          margin-bottom: 40px;
        }
        .trending-grid, .menu-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
          gap: 24px;
        }
        .empty-menu {
          padding: 60px 24px;
        }
        .empty-menu h3 {
          margin-bottom: 8px;
        }
        .empty-menu p {
          color: var(--color-text-secondary);
        }
        @media (max-width: 768px) {
          .search-filter-row {
            grid-template-columns: 1fr;
          }
          .filter-selects {
            width: 100%;
          }
          .filter-canteen-select, .sort-select {
            flex: 1;
            min-width: 0;
          }
          .tabs-row {
            flex-direction: column;
            align-items: flex-start;
            gap: 16px;
          }
          .category-tabs {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}

export default function MenuPage() {
  return (
    <Suspense fallback={<LoadingSpinner fullPage />}>
      <MenuContent />
    </Suspense>
  );
}
