import React from "react";
import { Star, Flame, ShoppingCart, ShieldAlert } from "lucide-react";
import { useCart } from "@/context/CartContext";

interface MenuItemType {
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
  isPerishable?: boolean;
}

interface MenuCardProps {
  item: MenuItemType;
}

export const MenuCard: React.FC<MenuCardProps> = ({ item }) => {
  const { addToCart } = useCart();

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    if (item.availability) {
      addToCart(item._id, 1);
    }
  };

  const isDiscounted = item.basePrice && item.basePrice > item.price;
  const discountPct = isDiscounted 
    ? Math.round(((item.basePrice! - item.price) / item.basePrice!) * 100)
    : 0;

  return (
    <div className={`menu-card card card-hoverable animate-scaleIn ${!item.availability ? "out-of-stock" : ""}`}>
      <div className="image-container">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img 
          src={item.image || "/images/food-placeholder.png"} 
          alt={item.name}
          className="food-image"
          onError={(e) => {
            (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=60";
          }}
        />
        <span className={`veg-badge ${item.isVeg ? "veg" : "non-veg"}`}>
          <span className="dot"></span>
        </span>
        {isDiscounted && (
          <span className="discount-badge">-{discountPct}%</span>
        )}
      </div>

      <div className="card-body">
        <div className="card-header-info">
          <span className="item-category">{item.category}</span>
          <div className="rating-info">
            <Star size={12} fill="var(--color-warning)" stroke="var(--color-warning)" />
            <span>{item.avgRating > 0 ? item.avgRating.toFixed(1) : "New"}</span>
            {item.ratingCount > 0 && <span className="rating-count">({item.ratingCount})</span>}
          </div>
        </div>

        <h3 className="item-name">{item.name}</h3>
        <p className="item-desc">{item.description || "Fresh and hot delicious meal prepared specially for you."}</p>

        <div className="meta-stats">
          <span className="prep-time flex items-center gap-1">
            <Flame size={12} className="prep-icon" /> {item.preparationTime} mins
          </span>
          {item.carbonSaving > 0 && (
            <span className="carbon-saving badge badge-success">
              🌱 -{item.carbonSaving.toFixed(1)}kg CO2
            </span>
          )}
        </div>

        <div className="divider"></div>

        <div className="card-footer">
          <div className="price-wrapper">
            <span className="price-label">Price</span>
            <div className="price-row">
              <span className="current-price">₹{item.price}</span>
              {isDiscounted && <span className="base-price">₹{item.basePrice}</span>}
            </div>
          </div>

          {item.availability ? (
            <button onClick={handleAdd} className="btn btn-primary btn-sm flex items-center gap-1">
              <ShoppingCart size={14} /> Add
            </button>
          ) : (
            <span className="badge badge-error flex items-center gap-1">
              <ShieldAlert size={12} /> Sold Out
            </span>
          )}
        </div>
      </div>

      <style jsx>{`
        .menu-card {
          display: flex;
          flex-direction: column;
          padding: 0;
          overflow: hidden;
          background: var(--color-surface);
          position: relative;
        }
        .out-of-stock {
          opacity: 0.65;
        }
        .image-container {
          position: relative;
          width: 100%;
          aspect-ratio: 16/10;
          overflow: hidden;
          background: var(--color-bg-secondary);
        }
        .food-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform var(--transition-slow);
        }
        .menu-card:hover .food-image {
          transform: scale(1.05);
        }
        .veg-badge {
          position: absolute;
          top: 12px;
          left: 12px;
          background: rgba(10, 10, 15, 0.7);
          backdrop-filter: blur(8px);
          width: 22px;
          height: 22px;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1.5px solid;
        }
        .veg-badge.veg {
          border-color: var(--color-success);
        }
        .veg-badge.non-veg {
          border-color: var(--color-error);
        }
        .dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }
        .veg-badge.veg .dot {
          background: var(--color-success);
        }
        .veg-badge.non-veg .dot {
          background: var(--color-error);
        }
        .discount-badge {
          position: absolute;
          top: 12px;
          right: 12px;
          background: var(--color-primary);
          color: white;
          font-size: 11px;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: var(--radius-sm);
        }
        .card-body {
          padding: 16px;
          display: flex;
          flex-direction: column;
          flex: 1;
        }
        .card-header-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }
        .item-category {
          font-size: 11px;
          font-weight: 600;
          color: var(--color-text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .rating-info {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 12px;
          font-weight: 600;
        }
        .rating-count {
          color: var(--color-text-muted);
          font-weight: 400;
        }
        .item-name {
          font-size: 16px;
          font-weight: 700;
          color: var(--color-text);
          margin-bottom: 6px;
        }
        .item-desc {
          font-size: 13px;
          color: var(--color-text-secondary);
          line-height: 1.4;
          margin-bottom: 12px;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          text-overflow: ellipsis;
          min-height: 36px;
        }
        .meta-stats {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 11px;
          color: var(--color-text-muted);
          font-weight: 500;
        }
        .prep-icon {
          color: var(--color-primary);
        }
        .card-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: auto;
        }
        .price-wrapper {
          display: flex;
          flex-direction: column;
        }
        .price-label {
          font-size: 10px;
          color: var(--color-text-muted);
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }
        .price-row {
          display: flex;
          align-items: baseline;
          gap: 6px;
        }
        .current-price {
          font-size: 18px;
          font-weight: 800;
          color: var(--color-text);
        }
        .base-price {
          font-size: 12px;
          color: var(--color-text-muted);
          text-decoration: line-through;
        }
      `}</style>
    </div>
  );
};
