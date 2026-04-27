"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/services/api";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Star, MapPin, Clock, ShieldCheck, Flame, MessageSquare } from "lucide-react";

interface Canteen {
  _id: string;
  name: string;
  location: string;
  description: string;
  image?: string;
  cuisine: string[];
  distance?: string;
  isOpen: boolean;
  openTime: string;
  closeTime: string;
  rating: number;
  numRatings: number;
}

export default function CanteensPage() {
  const [canteens, setCanteens] = useState<Canteen[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCanteens = async () => {
      try {
        const response = await api.get("/api/canteens");
        setCanteens(response.data);
      } catch (err) {
        console.error("Error fetching canteens:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCanteens();
  }, []);

  if (loading) return <LoadingSpinner fullPage />;

  return (
    <div className="container canteens-page animate-fadeIn">
      <div className="page-header">
        <h1>Campus Food Stalls</h1>
        <p>Browse active dining halls, food courts, and quick cafes around campus</p>
      </div>

      <div className="canteens-list stagger">
        {canteens.map((canteen) => (
          <div key={canteen._id} className="canteen-row-card card card-hoverable">
            <div className="canteen-image-col">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={canteen.image || "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=500&auto=format&fit=crop&q=60"} 
                alt={canteen.name} 
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=500&auto=format&fit=crop&q=60";
                }}
              />
            </div>
            <div className="canteen-info-col">
              <div className="info-header">
                <span className="badge badge-success">
                  {canteen.isOpen ? "🟢 Open Now" : "🔴 Closed"}
                </span>
                <span className="canteen-distance"><MapPin size={14} /> {canteen.distance || "Within Campus"}</span>
              </div>
              <h2>{canteen.name}</h2>
              <p className="canteen-description">{canteen.description || "Grab delicious meals, breakfast breaks, or quick espresso refreshments."}</p>
              
              <div className="tags-row">
                {canteen.cuisine.map((c, i) => (
                  <span key={i} className="cuisine-tag">{c}</span>
                ))}
              </div>

              <div className="metadata-grid">
                <div className="meta-item">
                  <Star size={16} fill="var(--color-warning)" stroke="var(--color-warning)" />
                  <strong>{canteen.rating.toFixed(1)}</strong>
                  <span className="ratings-count">({canteen.numRatings} reviews)</span>
                </div>
                <div className="meta-item">
                  <Clock size={16} />
                  <span>Hours: {canteen.openTime} - {canteen.closeTime}</span>
                </div>
              </div>

              <div className="actions-row">
                <Link href={`/menu?canteen=${canteen._id}`} className="btn btn-primary">
                  Order from {canteen.name} &rarr;
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        .canteens-page {
          padding-top: 40px;
        }
        .page-header {
          text-align: center;
          margin-bottom: 40px;
        }
        .page-header h1 {
          font-size: 32px;
          font-weight: 800;
          margin-bottom: 8px;
        }
        .page-header p {
          color: var(--color-text-secondary);
        }
        .canteens-list {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .canteen-row-card {
          display: grid;
          grid-template-columns: 320px 1fr;
          padding: 0;
          overflow: hidden;
        }
        .canteen-image-col {
          width: 100%;
          height: 100%;
          min-height: 240px;
          position: relative;
        }
        .canteen-image-col img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .canteen-info-col {
          padding: 32px;
          display: flex;
          flex-direction: column;
        }
        .info-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }
        .canteen-distance {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 13px;
          color: var(--color-text-secondary);
        }
        .canteen-info-col h2 {
          font-size: 24px;
          font-weight: 700;
          margin-bottom: 8px;
        }
        .canteen-description {
          font-size: 14px;
          color: var(--color-text-secondary);
          margin-bottom: 16px;
        }
        .tags-row {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 20px;
        }
        .cuisine-tag {
          font-size: 12px;
          font-weight: 500;
          padding: 4px 10px;
          border-radius: var(--radius-sm);
          background: var(--color-bg-tertiary);
          border: 1px solid var(--color-border);
          color: var(--color-text-secondary);
        }
        .metadata-grid {
          display: flex;
          gap: 32px;
          margin-bottom: 24px;
        }
        .meta-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
        }
        .ratings-count {
          color: var(--color-text-muted);
        }
        .actions-row {
          margin-top: auto;
        }
        @media (max-width: 900px) {
          .canteen-row-card {
            grid-template-columns: 1fr;
          }
          .canteen-image-col {
            height: 200px;
            min-height: auto;
          }
          .canteen-info-col {
            padding: 24px;
          }
        }
      `}</style>
    </div>
  );
}
