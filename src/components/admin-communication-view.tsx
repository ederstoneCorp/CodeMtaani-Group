"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { Hash, Plus, Send, User, Volume2 } from "lucide-react";
import type { Announcement, ChatGroup, ConversationContact, DirectMessage, GroupMessage } from "@/lib/communication";

export function AdminCommunicationView({ canAnnounce }: { canAnnounce: boolean }) {
  const [subTab, setSubTab] = useState<"direct" | "groups" | "announcements">("direct");

  // Direct chat state
  const [contacts, setContacts] = useState<ConversationContact[]>([]);
  const [activePeer, setActivePeer] = useState<ConversationContact | null>(null);
  const [directMessages, setDirectMessages] = useState<DirectMessage[]>([]);
  const [dmInput, setDmInput] = useState("");
  const [contactSearch, setContactSearch] = useState("");

  // Group chat state
  const [groups, setGroups] = useState<ChatGroup[]>([]);
  const [activeGroup, setActiveGroup] = useState<ChatGroup | null>(null);
  const [groupMessages, setGroupMessages] = useState<GroupMessage[]>([]);
  const [groupInput, setGroupInput] = useState("");
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDept, setNewGroupDept] = useState("");

  // Announcements state
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [showNewAnnounce, setShowNewAnnounce] = useState(false);
  const [annTitle, setAnnTitle] = useState("");
  const [annContent, setAnnContent] = useState("");
  const [annPriority, setAnnPriority] = useState<Announcement["priority"]>("normal");
  const [annDept, setAnnDept] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load contacts
  const loadContacts = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/communication/direct");
      if (res.ok) {
        const d = await res.json();
        setContacts(d.contacts || []);
        if (d.contacts?.length > 0) {
          setActivePeer((prev) => prev ?? d.contacts[0]);
        }
      }
    } catch {}
  }, []);

  // Load direct messages
  async function loadDirectMessages(peerId: string) {
    try {
      const res = await fetch(`/api/admin/communication/direct?peerId=${peerId}`);
      if (res.ok) {
        const d = await res.json();
        setDirectMessages(d.messages || []);
      }
    } catch {}
  }

  // Load groups
  const loadGroups = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/communication/groups");
      if (res.ok) {
        const d = await res.json();
        setGroups(d.groups || []);
        if (d.groups?.length > 0) {
          setActiveGroup((prev) => prev ?? d.groups[0]);
        }
      }
    } catch {}
  }, []);

  // Load group messages
  async function loadGroupMessages(groupId: string) {
    try {
      const res = await fetch(`/api/admin/communication/groups?groupId=${groupId}`);
      if (res.ok) {
        const d = await res.json();
        setGroupMessages(d.messages || []);
      }
    } catch {}
  }

  // Load announcements
  const loadAnnouncements = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/communication/announcements");
      if (res.ok) {
        const d = await res.json();
        setAnnouncements(d.announcements || []);
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (subTab === "direct") loadContacts();
    else if (subTab === "groups") loadGroups();
    else if (subTab === "announcements") loadAnnouncements();
  }, [subTab, loadContacts, loadGroups, loadAnnouncements]);

  useEffect(() => {
    if (activePeer) {
      loadDirectMessages(activePeer.id);
      const timer = setInterval(() => loadDirectMessages(activePeer.id), 10000);
      return () => clearInterval(timer);
    }
  }, [activePeer]);

  useEffect(() => {
    if (activeGroup) {
      loadGroupMessages(activeGroup.id);
      const timer = setInterval(() => loadGroupMessages(activeGroup.id), 10000);
      return () => clearInterval(timer);
    }
  }, [activeGroup]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [directMessages, groupMessages]);

  async function handleSendDirect(e: FormEvent) {
    e.preventDefault();
    if (!activePeer || !dmInput.trim()) return;
    const text = dmInput;
    setDmInput("");
    try {
      const res = await fetch("/api/admin/communication/direct", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipientId: activePeer.id, content: text }),
      });
      if (res.ok) {
        await loadDirectMessages(activePeer.id);
        await loadContacts();
      }
    } catch {}
  }

  async function handleSendGroup(e: FormEvent) {
    e.preventDefault();
    if (!activeGroup || !groupInput.trim()) return;
    const text = groupInput;
    setGroupInput("");
    try {
      const res = await fetch("/api/admin/communication/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupId: activeGroup.id, content: text }),
      });
      if (res.ok) {
        await loadGroupMessages(activeGroup.id);
      }
    } catch {}
  }

  async function handleCreateGroup(e: FormEvent) {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    try {
      const res = await fetch("/api/admin/communication/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newGroupName, department: newGroupDept || null }),
      });
      if (res.ok) {
        setShowNewGroup(false);
        setNewGroupName("");
        setNewGroupDept("");
        await loadGroups();
      }
    } catch {}
  }

  async function handleCreateAnnouncement(e: FormEvent) {
    e.preventDefault();
    if (!annTitle.trim() || !annContent.trim()) return;
    try {
      const res = await fetch("/api/admin/communication/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: annTitle,
          content: annContent,
          priority: annPriority,
          target_department: annDept || null,
        }),
      });
      if (res.ok) {
        setShowNewAnnounce(false);
        setAnnTitle("");
        setAnnContent("");
        await loadAnnouncements();
      }
    } catch {}
  }

  async function markAnnouncementRead(id: string) {
    try {
      await fetch("/api/admin/communication/announcements", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      setAnnouncements((prev) =>
        prev.map((a) => (a.id === id ? { ...a, is_read: true } : a))
      );
    } catch {}
  }

  const filteredContacts = contacts.filter((c) => {
    const q = contactSearch.toLowerCase();
    return (
      c.full_name.toLowerCase().includes(q) ||
      (c.staff_number && c.staff_number.toLowerCase().includes(q)) ||
      (c.department && c.department.toLowerCase().includes(q))
    );
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* SUB-NAVIGATION */}
      <div style={{ display: "flex", gap: "10px", borderBottom: "1px solid #1f3034", paddingBottom: "12px" }}>
        <button
          type="button"
          onClick={() => setSubTab("direct")}
          style={{
            background: subTab === "direct" ? "rgba(69,200,216,0.15)" : "transparent",
            color: subTab === "direct" ? "#45c8d8" : "#8fa5a9",
            border: "none",
            borderRadius: "6px",
            padding: "8px 16px",
            fontSize: "13px",
            fontWeight: 700,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <User size={15} /> Direct Staff Messages
        </button>

        <button
          type="button"
          onClick={() => setSubTab("groups")}
          style={{
            background: subTab === "groups" ? "rgba(69,200,216,0.15)" : "transparent",
            color: subTab === "groups" ? "#45c8d8" : "#8fa5a9",
            border: "none",
            borderRadius: "6px",
            padding: "8px 16px",
            fontSize: "13px",
            fontWeight: 700,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <Hash size={15} /> Departmental Channels
        </button>

        <button
          type="button"
          onClick={() => setSubTab("announcements")}
          style={{
            background: subTab === "announcements" ? "rgba(69,200,216,0.15)" : "transparent",
            color: subTab === "announcements" ? "#45c8d8" : "#8fa5a9",
            border: "none",
            borderRadius: "6px",
            padding: "8px 16px",
            fontSize: "13px",
            fontWeight: 700,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <Volume2 size={15} /> Internal Announcements ({announcements.filter((a) => !a.is_read).length} new)
        </button>
      </div>

      {/* DIRECT MESSAGING VIEW */}
      {subTab === "direct" && (
        <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: "16px", height: "620px", background: "#081518", border: "1px solid #1a2c30", borderRadius: "10px", overflow: "hidden" }}>
          {/* CONTACTS SIDEBAR */}
          <div style={{ borderRight: "1px solid #1a2c30", display: "flex", flexDirection: "column" }}>
            <div style={{ padding: "14px", borderBottom: "1px solid #1a2c30" }}>
              <input
                placeholder="Search staff by name or ID..."
                value={contactSearch}
                onChange={(e) => setContactSearch(e.target.value)}
                style={{ fontSize: "12px", padding: "8px 12px" }}
              />
            </div>

            <div style={{ flex: 1, overflowY: "auto" }}>
              {filteredContacts.map((c) => (
                <div
                  key={c.id}
                  onClick={() => setActivePeer(c)}
                  style={{
                    padding: "12px 14px",
                    borderBottom: "1px solid rgba(255,255,255,0.04)",
                    cursor: "pointer",
                    background: activePeer?.id === c.id ? "rgba(69,200,216,0.12)" : "transparent",
                    transition: "background 0.15s ease",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <strong style={{ fontSize: "13px", color: "#f1fbfc" }}>{c.full_name}</strong>
                    {c.unread_count > 0 && (
                      <span style={{ background: "#45c8d8", color: "#041719", fontSize: "10px", fontWeight: 800, padding: "1px 6px", borderRadius: "999px" }}>
                        {c.unread_count}
                      </span>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: "6px", alignItems: "center", marginTop: "2px" }}>
                    {c.staff_number && (
                      <span style={{ fontSize: "10px", color: "#63d8e5", fontFamily: "monospace" }}>
                        {c.staff_number}
                      </span>
                    )}
                    {c.department && <small style={{ color: "#769196" }}>· {c.department}</small>}
                  </div>
                </div>
              ))}
              {filteredContacts.length === 0 && (
                <div style={{ padding: "20px", textAlign: "center", color: "#6e898e", fontSize: "12px" }}>
                  No other staff accounts found.
                </div>
              )}
            </div>
          </div>

          {/* CHAT WINDOW */}
          {activePeer ? (
            <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
              <div style={{ padding: "14px 20px", borderBottom: "1px solid #1a2c30", background: "#0a191d", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: "14px", color: "#f1fbfc" }}>{activePeer.full_name}</h3>
                  <small style={{ color: "#769196" }}>
                    {activePeer.staff_number || "CMG-STAFF"} · {activePeer.role.replaceAll("_", " ")}
                  </small>
                </div>
              </div>

              <div style={{ flex: 1, overflowY: "auto", padding: "20px", display: "flex", flexDirection: "column", gap: "12px" }}>
                {directMessages.length === 0 ? (
                  <div style={{ margin: "auto", textAlign: "center", color: "#6b868b", fontSize: "13px" }}>
                    No messages yet with {activePeer.full_name}. Say hello!
                  </div>
                ) : (
                  directMessages.map((msg) => {
                    const isMe = msg.sender_id !== activePeer.id;
                    return (
                      <div
                        key={msg.id}
                        style={{
                          alignSelf: isMe ? "flex-end" : "flex-start",
                          maxWidth: "70%",
                          background: isMe ? "linear-gradient(135deg, #0b5965 0%, #063b45 100%)" : "#0d2227",
                          border: `1px solid ${isMe ? "rgba(72,198,212,0.4)" : "#1c3236"}`,
                          borderRadius: "10px",
                          padding: "10px 14px",
                        }}
                      >
                        <p style={{ margin: 0, fontSize: "13px", color: "#f4fbfc", whiteSpace: "pre-wrap", lineHeight: "1.6" }}>
                          {msg.content}
                        </p>
                        <small style={{ display: "block", textAlign: "right", marginTop: "4px", fontSize: "9px", color: "#8aa2a6" }}>
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </small>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              <form onSubmit={handleSendDirect} style={{ padding: "14px", borderTop: "1px solid #1a2c30", display: "flex", gap: "10px", background: "#09171a" }}>
                <input
                  value={dmInput}
                  onChange={(e) => setDmInput(e.target.value)}
                  placeholder={`Message ${activePeer.full_name}...`}
                  style={{ flex: 1 }}
                />
                <button className="admin-button" type="submit" style={{ padding: "10px 16px" }}>
                  <Send size={14} />
                </button>
              </form>
            </div>
          ) : (
            <div style={{ display: "grid", placeItems: "center", color: "#779095", fontSize: "13px" }}>
              Select a colleague from the directory to start a private conversation.
            </div>
          )}
        </div>
      )}

      {/* DEPARTMENTAL CHANNELS VIEW */}
      {subTab === "groups" && (
        <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: "16px", height: "620px", background: "#081518", border: "1px solid #1a2c30", borderRadius: "10px", overflow: "hidden" }}>
          {/* CHANNELS SIDEBAR */}
          <div style={{ borderRight: "1px solid #1a2c30", display: "flex", flexDirection: "column" }}>
            <div style={{ padding: "14px", borderBottom: "1px solid #1a2c30", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <strong style={{ fontSize: "13px", color: "#f1fbfc" }}>Team Channels</strong>
              <button
                type="button"
                onClick={() => setShowNewGroup(true)}
                style={{ background: "transparent", border: "none", color: "#45c8d8", cursor: "pointer", fontSize: "12px", display: "inline-flex", alignItems: "center", gap: "4px" }}
              >
                <Plus size={13} /> New
              </button>
            </div>

            <div style={{ flex: 1, overflowY: "auto" }}>
              {groups.map((g) => (
                <div
                  key={g.id}
                  onClick={() => setActiveGroup(g)}
                  style={{
                    padding: "12px 14px",
                    borderBottom: "1px solid rgba(255,255,255,0.04)",
                    cursor: "pointer",
                    background: activeGroup?.id === g.id ? "rgba(69,200,216,0.12)" : "transparent",
                  }}
                >
                  <strong style={{ fontSize: "13px", color: "#f1fbfc", display: "flex", alignItems: "center", gap: "6px" }}>
                    <Hash size={13} color="#45c8d8" /> {g.name}
                  </strong>
                  {g.department && <small style={{ color: "#769196", display: "block", marginTop: "2px" }}>{g.department}</small>}
                </div>
              ))}
            </div>
          </div>

          {/* CHANNEL CHAT WINDOW */}
          {activeGroup ? (
            <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
              <div style={{ padding: "14px 20px", borderBottom: "1px solid #1a2c30", background: "#0a191d" }}>
                <h3 style={{ margin: 0, fontSize: "14px", color: "#f1fbfc" }}>#{activeGroup.name}</h3>
                <small style={{ color: "#769196" }}>{activeGroup.description || "General departmental workspace."}</small>
              </div>

              <div style={{ flex: 1, overflowY: "auto", padding: "20px", display: "flex", flexDirection: "column", gap: "12px" }}>
                {groupMessages.map((msg) => (
                  <div key={msg.id} style={{ background: "#0d2227", padding: "10px 14px", borderRadius: "8px", border: "1px solid #1c3236" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                      <strong style={{ fontSize: "12px", color: "#45c8d8" }}>
                        {msg.sender_name} {msg.sender_staff_number && `(${msg.sender_staff_number})`}
                      </strong>
                      <small style={{ fontSize: "10px", color: "#6a888d" }}>{new Date(msg.created_at).toLocaleTimeString()}</small>
                    </div>
                    <p style={{ margin: 0, fontSize: "13px", color: "#f4fbfc" }}>{msg.content}</p>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              <form onSubmit={handleSendGroup} style={{ padding: "14px", borderTop: "1px solid #1a2c30", display: "flex", gap: "10px", background: "#09171a" }}>
                <input
                  value={groupInput}
                  onChange={(e) => setGroupInput(e.target.value)}
                  placeholder={`Message #${activeGroup.name}...`}
                  style={{ flex: 1 }}
                />
                <button className="admin-button" type="submit" style={{ padding: "10px 16px" }}>
                  <Send size={14} />
                </button>
              </form>
            </div>
          ) : (
            <div style={{ display: "grid", placeItems: "center", color: "#779095" }}>Select a channel to join discussion.</div>
          )}
        </div>
      )}

      {/* NEW CHANNEL MODAL */}
      {showNewGroup && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(3,15,18,0.85)", backdropFilter: "blur(6px)", zIndex: 999, display: "grid", placeItems: "center", padding: "20px" }}>
          <div style={{ background: "#0a1417", border: "1px solid #45c8d8", borderRadius: "12px", padding: "24px", maxWidth: "440px", width: "100%" }}>
            <h3 style={{ margin: "0 0 14px", color: "#f1fbfc" }}>Create Team Channel</h3>
            <form onSubmit={handleCreateGroup}>
              <label>
                Channel Name
                <input required value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} placeholder="e.g. ai-research or engineering" />
              </label>
              <label>
                Department Tag (optional)
                <input value={newGroupDept} onChange={(e) => setNewGroupDept(e.target.value)} placeholder="Engineering / AI / Product" />
              </label>
              <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
                <button className="admin-button" type="submit">Create Channel</button>
                <button className="admin-button secondary" type="button" onClick={() => setShowNewGroup(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ANNOUNCEMENTS BULLETIN VIEW */}
      {subTab === "announcements" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <p style={{ fontSize: "13px", color: "#8fa5a9", margin: 0 }}>
              Official CodeMtaani Group administrative bulletins and organizational announcements.
            </p>
            {canAnnounce && (
              <button className="admin-button" onClick={() => setShowNewAnnounce(true)}>
                <Plus size={14} style={{ marginRight: 6 }} /> Publish Announcement
              </button>
            )}
          </div>

          {/* NEW ANNOUNCEMENT MODAL */}
          {showNewAnnounce && (
            <div style={{ position: "fixed", inset: 0, background: "rgba(3,15,18,0.85)", backdropFilter: "blur(6px)", zIndex: 999, display: "grid", placeItems: "center", padding: "20px" }}>
              <div style={{ background: "#0a1417", border: "1px solid #45c8d8", borderRadius: "12px", padding: "26px", maxWidth: "560px", width: "100%" }}>
                <h3 style={{ margin: "0 0 16px", color: "#f1fbfc" }}>Publish Internal Announcement</h3>
                <form onSubmit={handleCreateAnnouncement}>
                  <label>
                    Announcement Title
                    <input required value={annTitle} onChange={(e) => setAnnTitle(e.target.value)} placeholder="e.g. Q4 Sprint Review Schedule" />
                  </label>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                    <label>
                      Priority Level
                      <select value={annPriority} onChange={(e) => setAnnPriority(e.target.value as Announcement["priority"])}>
                        <option value="normal">Normal</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                        <option value="low">Low</option>
                      </select>
                    </label>
                    <label>
                      Target Department
                      <input value={annDept} onChange={(e) => setAnnDept(e.target.value)} placeholder="Leave blank for all staff" />
                    </label>
                  </div>
                  <label>
                    Announcement Content
                    <textarea required rows={5} value={annContent} onChange={(e) => setAnnContent(e.target.value)} placeholder="Full bulletin text..." />
                  </label>
                  <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
                    <button className="admin-button" type="submit">Publish</button>
                    <button className="admin-button secondary" type="button" onClick={() => setShowNewAnnounce(false)}>Cancel</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {announcements.map((ann) => {
              const isUrgent = ann.priority === "urgent" || ann.priority === "high";
              return (
                <div
                  key={ann.id}
                  style={{
                    background: "#081518",
                    border: `1px solid ${isUrgent ? "rgba(224,0,0,0.4)" : "#1a2c30"}`,
                    borderRadius: "10px",
                    padding: "20px",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px", marginBottom: "8px" }}>
                    <div>
                      <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "4px" }}>
                        <span
                          style={{
                            fontSize: "10px",
                            fontWeight: 800,
                            textTransform: "uppercase",
                            padding: "2px 6px",
                            borderRadius: "4px",
                            background: isUrgent ? "#e00000" : "rgba(69,200,216,0.2)",
                            color: isUrgent ? "#fff" : "#45c8d8",
                          }}
                        >
                          {ann.priority}
                        </span>
                        {ann.target_department && (
                          <span style={{ fontSize: "11px", color: "#63d8e5" }}>
                            [{ann.target_department}]
                          </span>
                        )}
                        <strong style={{ fontSize: "15px", color: "#f1fbfc" }}>{ann.title}</strong>
                      </div>
                      <small style={{ color: "#7a989d" }}>
                        By {ann.author_name} {ann.author_staff_number && `(${ann.author_staff_number})`} · {new Date(ann.published_at).toLocaleString()}
                      </small>
                    </div>

                    {!ann.is_read && (
                      <button
                        type="button"
                        onClick={() => markAnnouncementRead(ann.id)}
                        className="admin-button secondary"
                        style={{ padding: "4px 10px", fontSize: "11px" }}
                      >
                        Mark as read
                      </button>
                    )}
                  </div>

                  <p style={{ margin: "12px 0 0", fontSize: "13px", lineHeight: "1.8", color: "#d2e3e6", whiteSpace: "pre-wrap" }}>
                    {ann.content}
                  </p>
                </div>
              );
            })}
            {announcements.length === 0 && (
              <p className="admin-empty">No announcements published yet.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
