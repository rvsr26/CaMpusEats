"use client";

import React, { useEffect, useState } from "react";
import { api } from "@/services/api";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useToast } from "@/context/ToastContext";
import { 
  HelpCircle, 
  Plus, 
  MessageSquare, 
  Clock, 
  CheckCircle2, 
  Send,
  AlertTriangle
} from "lucide-react";

interface Ticket {
  _id: string;
  subject: string;
  category: "order" | "payment" | "food-quality" | "app-issue" | "other" | string;
  status: "open" | "in-progress" | "closed" | string;
  priority: "low" | "medium" | "high" | "critical" | string;
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

export default function SupportPage() {
  const { showToast } = useToast();

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTicketId, setActiveTicketId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);

  // Form States
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("other");
  const [priority, setPriority] = useState("medium");
  const [newMessage, setNewMessage] = useState("");
  const [chatMessage, setChatMessage] = useState("");

  const [submittingTicket, setSubmittingTicket] = useState(false);
  const [sendingMsg, setSendingMsg] = useState(false);

  const fetchTickets = async () => {
    try {
      const res = await api.get("/api/support");
      setTickets(res.data);
    } catch (err) {
      console.error("Failed to load tickets:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim()) return;

    setSubmittingTicket(true);
    try {
      await api.post("/api/support", {
        subject,
        category,
        priority
      });
      showToast("Support ticket created successfully", "success");
      setSubject("");
      setCategory("other");
      setPriority("medium");
      setShowCreateForm(false);
      fetchTickets();
    } catch (err: any) {
      showToast(err.response?.data?.message || "Failed to create ticket", "error");
    } finally {
      setSubmittingTicket(false);
    }
  };

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
      // Append message locally
      setMessages((prev) => [...prev, res.data]);
      setChatMessage("");
    } catch (err: any) {
      showToast(err.response?.data?.message || "Failed to send message", "error");
    } finally {
      setSendingMsg(false);
    }
  };

  if (loading) return <LoadingSpinner fullPage />;

  return (
    <ProtectedRoute>
      <div className="container support-page animate-fadeIn">
        <div className="page-header">
          <div className="title-row">
            <div>
              <h1>Support Helpdesk</h1>
              <p>Resolve disputes, ask payment questions, or report quality concerns</p>
            </div>
            <button onClick={() => setShowCreateForm(!showCreateForm)} className="btn btn-primary">
              <Plus size={16} /> {showCreateForm ? "View Tickets" : "Open New Ticket"}
            </button>
          </div>
        </div>

        {showCreateForm ? (
          <div className="card form-card max-width-form stagger">
            <h3>Create a Support Ticket</h3>
            <div className="divider"></div>
            <form onSubmit={handleCreateTicket} className="support-form">
              <div className="form-group">
                <label className="form-label" htmlFor="subject">Subject / Issue</label>
                <input
                  id="subject"
                  type="text"
                  className="form-input"
                  placeholder="e.g. Transaction failed but money debited"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="category">Category</label>
                <select
                  id="category"
                  className="form-select"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="order">Order Issues</option>
                  <option value="payment">Wallet & Payments</option>
                  <option value="food-quality">Food Quality / Preparation</option>
                  <option value="app-issue">App Bug / Glitch</option>
                  <option value="other">Other Concerns</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="priority">Priority</label>
                <select
                  id="priority"
                  className="form-select"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                >
                  <option value="low">Low - General query</option>
                  <option value="medium">Medium - Standard issue</option>
                  <option value="high">High - Urgent ordering issue</option>
                  <option value="critical">Critical - Account lock / Fraud</option>
                </select>
              </div>

              <button type="submit" className="btn btn-primary mt-4" disabled={submittingTicket}>
                {submittingTicket ? <LoadingSpinner size="sm" /> : "Submit Ticket"}
              </button>
            </form>
          </div>
        ) : (
          <div className="support-grid stagger">
            {/* Tickets List */}
            <div className="tickets-panel">
              <h3>Active Tickets</h3>
              <div className="divider"></div>

              {tickets.length === 0 ? (
                <div className="card text-center p-8 text-secondary">
                  No active support tickets. Click 'Open New Ticket' to submit an inquiry.
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

            {/* Ticket Chat Panel */}
            <div className="chat-panel card">
              {activeTicketId ? (
                <div className="chat-container">
                  <div className="chat-header">
                    <h4>Conversation Details</h4>
                    <span className="text-secondary text-xs">ID: {activeTicketId}</span>
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
                          <span className="msg-sender">{msg.isAdmin ? "Staff Agent" : "You"}</span>
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
                      placeholder="Type a message to support agent..."
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
                  <h4>Select a ticket to view messages</h4>
                  <p>Click on any of your active tickets on the left panel to review responses or chat with canteen administrators.</p>
                </div>
              )}
            </div>
          </div>
        )}

        <style jsx>{`
          .support-page {
            padding-top: 40px;
          }
          .title-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .title-row h1 {
            font-size: 28px;
            font-weight: 800;
          }
          .title-row p {
            color: var(--color-text-secondary);
          }
          .max-width-form {
            max-width: 600px;
            margin: 0 auto;
          }
          .support-form {
            display: flex;
            flex-direction: column;
            gap: 16px;
          }
          .support-grid {
            display: grid;
            grid-template-columns: 360px 1fr;
            gap: 32px;
            align-items: flex-start;
          }
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
          .chat-header {
            display: flex;
            justify-content: space-between;
            align-items: baseline;
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
            align-self: flex-end;
            background: var(--color-primary-light);
            border: 1px solid rgba(249, 115, 22, 0.2);
            border-bottom-right-radius: 0;
          }
          .admin-msg {
            align-self: flex-start;
            background: var(--color-surface);
            border: 1px solid var(--color-border);
            border-bottom-left-radius: 0;
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
          @media (max-width: 800px) {
            .support-grid {
              grid-template-columns: 1fr;
            }
          }
        `}</style>
      </div>
    </ProtectedRoute>
  );
}
