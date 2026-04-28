"use client";

import React, { useEffect, useState } from "react";
import { api } from "@/services/api";
import { useToast } from "@/context/ToastContext";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { 
  HelpCircle, 
  MessageSquare, 
  Clock, 
  CheckCircle2, 
  Send,
  ArrowUp,
  XCircle
} from "lucide-react";

interface Ticket {
  _id: string;
  subject: string;
  category: string;
  status: string;
  priority: string;
  user: {
    name: string;
    email: string;
  };
  createdAt: string;
}

interface Message {
  _id: string;
  message: string;
  sender: {
    name: string;
    _id: string;
  };
  isAdmin: boolean;
  createdAt: string;
}

export default function AdminSupportPage() {
  const { showToast } = useToast();

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [activeTicketId, setActiveTicketId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const [chatMessage, setChatMessage] = useState("");
  const [sendingMsg, setSendingMsg] = useState(false);
  const [escalating, setEscalating] = useState(false);

  const fetchTickets = async () => {
    try {
      const res = await api.get("/api/support");
      setTickets(res.data);
    } catch (err) {
      console.error("Failed to load admin support tickets:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const loadMessages = async (ticketId: string) => {
    setLoadingMessages(true);
    try {
      const res = await api.get(`/api/support/${ticketId}/messages`);
      setMessages(res.data);
      setActiveTicketId(ticketId);
    } catch (err) {
      console.error("Failed to load messages:", err);
      showToast("Failed to load conversation", "error");
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim() || !activeTicketId) return;

    setSendingMsg(true);
    try {
      const res = await api.post(`/api/support/${activeTicketId}/messages`, {
        message: chatMessage
      });
      setMessages((prev) => [...prev, res.data]);
      setChatMessage("");
    } catch (err: any) {
      showToast(err.response?.data?.message || "Failed to send message", "error");
    } finally {
      setSendingMsg(false);
    }
  };

  const handleCloseTicket = async () => {
    if (!activeTicketId) return;

    try {
      await api.put(`/api/support/${activeTicketId}/close`);
      showToast("Ticket closed successfully", "success");
      fetchTickets();
      setActiveTicketId(null);
    } catch (err: any) {
      showToast("Failed to close ticket", "error");
    }
  };

  const handleEscalateTicket = async () => {
    if (!activeTicketId) return;
    const reason = window.prompt("Reason for escalation:");
    if (!reason) return;

    setEscalating(true);
    try {
      await api.put(`/api/support/${activeTicketId}/escalate`, { reason });
      showToast("Ticket escalated to management level", "info");
      fetchTickets();
      setActiveTicketId(null);
    } catch (err: any) {
      showToast("Failed to escalate ticket", "error");
    } finally {
      setEscalating(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="admin-support-page animate-fadeIn">
      <div className="page-header mb-8">
        <h1>Support Center Inbox</h1>
        <p>Review customer complaints, chat with students in real-time, or close resolved queries.</p>
      </div>

      <div className="support-grid stagger">
        {/* Tickets Panel */}
        <div className="tickets-panel">
          <h3>Inbox Tickets</h3>
          <div className="divider"></div>

          {tickets.length === 0 ? (
            <div className="card text-center p-8 text-secondary">
              No active support inquiries in the system.
            </div>
          ) : (
            <div className="tickets-list">
              {tickets.map((t) => (
                <div 
                  key={t._id} 
                  onClick={() => loadMessages(t._id)}
                  className={`ticket-item card card-hoverable ${activeTicketId === t._id ? "active-ticket" : ""}`}
                >
                  <div className="ticket-meta">
                    <span className="badge badge-muted">{t.category}</span>
                    <span className={`badge ${t.priority === "critical" || t.priority === "high" ? "badge-error" : "badge-info"}`}>
                      {t.priority}
                    </span>
                  </div>
                  <h4>{t.subject}</h4>
                  <p className="ticket-author">By: {t.user?.name || "Student"}</p>
                  <div className="ticket-footer">
                    <span className="date-label">
                      {new Date(t.createdAt).toLocaleDateString()}
                    </span>
                    <span className={`status-pill status-${t.status}`}>
                      {t.status === "open" && <Clock size={12} />}
                      {t.status === "in-progress" && <MessageSquare size={12} />}
                      {t.status === "closed" && <CheckCircle2 size={12} />}
                      {t.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Chat Thread Panel */}
        <div className="chat-panel card">
          {activeTicketId ? (
            <div className="chat-container">
              <div className="chat-header-row">
                <div>
                  <h4>Conversation Thread</h4>
                  <span className="text-secondary text-xs">ID: {activeTicketId}</span>
                </div>
                <div className="header-actions">
                  <button onClick={handleEscalateTicket} className="btn btn-secondary btn-sm flex items-center gap-1" disabled={escalating}>
                    <ArrowUp size={12} /> Escalate
                  </button>
                  <button onClick={handleCloseTicket} className="btn btn-ghost btn-danger btn-sm flex items-center gap-1">
                    <XCircle size={12} /> Close Ticket
                  </button>
                </div>
              </div>
              <div className="divider"></div>

              <div className="messages-thread">
                {loadingMessages ? (
                  <LoadingSpinner />
                ) : messages.length === 0 ? (
                  <p className="text-center text-muted p-8">No messages in thread.</p>
                ) : (
                  messages.map((msg) => (
                    <div 
                      key={msg._id} 
                      className={`message-bubble ${msg.isAdmin ? "admin-msg" : "student-msg"}`}
                    >
                      <span className="msg-sender">{msg.isAdmin ? "You" : msg.sender?.name || "Student"}</span>
                      <p>{msg.message}</p>
                      <span className="msg-time">
                        {new Date(msg.createdAt).toLocaleTimeString(undefined, {
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </span>
                    </div>
                  ))
                )}
              </div>

              <form onSubmit={handleSendMessage} className="chat-input-row">
                <input
                  type="text"
                  className="form-input"
                  placeholder="Type your response to student..."
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  required
                  disabled={sendingMsg}
                />
                <button type="submit" className="btn btn-primary btn-icon" disabled={sendingMsg}>
                  <Send size={16} />
                </button>
              </form>
            </div>
          ) : (
            <div className="empty-chat-state text-center text-secondary">
              <HelpCircle size={48} className="text-muted animate-pulse" />
              <h4>Select a support ticket</h4>
              <p>Click on any incoming ticket on the left panel to review complaint details and chat with the student.</p>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .tickets-panel {
          display: flex;
          flex-direction: column;
        }
        .tickets-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .ticket-item {
          cursor: pointer;
          border-left: 3px solid transparent;
          padding: 16px;
        }
        .ticket-item.active-ticket {
          border-left-color: var(--color-primary);
          background: var(--color-surface-hover);
        }
        .ticket-meta {
          display: flex;
          gap: 8px;
          margin-bottom: 8px;
        }
        .ticket-item h4 {
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 4px;
        }
        .ticket-author {
          font-size: 12px;
          color: var(--color-text-secondary);
          margin-bottom: 12px;
        }
        .ticket-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 11px;
          color: var(--color-text-muted);
        }
        .status-pill {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          text-transform: capitalize;
          font-weight: 600;
        }
        .status-open { color: var(--color-warning); }
        .status-in-progress { color: var(--color-info); }
        .status-closed { color: var(--color-success); }
        .chat-panel {
          min-height: 500px;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
        .empty-chat-state {
          padding: 40px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
        }
        .empty-chat-state p {
          max-width: 320px;
          font-size: 13px;
        }
        .chat-container {
          display: flex;
          flex-direction: column;
          height: 500px;
        }
        .chat-header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .header-actions {
          display: flex;
          gap: 8px;
        }
        .messages-thread {
          flex: 1;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 16px;
          padding: 16px;
          background: var(--color-bg);
          border-radius: var(--radius-md);
          border: 1px solid var(--color-border);
          margin-bottom: 16px;
        }
        .message-bubble {
          max-width: 70%;
          padding: 12px 16px;
          border-radius: var(--radius-md);
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .student-msg {
          align-self: flex-start;
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-bottom-left-radius: 0;
        }
        .admin-msg {
          align-self: flex-end;
          background: var(--color-primary-light);
          border: 1px solid rgba(249, 115, 22, 0.2);
          border-bottom-right-radius: 0;
        }
        .msg-sender {
          font-size: 10px;
          font-weight: 700;
          color: var(--color-text-muted);
        }
        .message-bubble p {
          font-size: 13px;
          color: var(--color-text);
        }
        .msg-time {
          font-size: 9px;
          color: var(--color-text-muted);
          align-self: flex-end;
        }
        .chat-input-row {
          display: flex;
          gap: 12px;
        }
        .chat-input-row :global(.form-input) {
          flex: 1;
        }
        .support-grid {
          display: grid;
          grid-template-columns: 360px 1fr;
          gap: 32px;
          align-items: flex-start;
        }
        @media (max-width: 800px) {
          .support-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
