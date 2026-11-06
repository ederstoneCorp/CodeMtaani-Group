"use client";

import { ChangeEvent, FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Download,
  FileText,
  Hash,
  Paperclip,
  Plus,
  RefreshCw,
  Search,
  Send,
  User,
  Users,
  Volume2,
  X,
} from "lucide-react";
import type { Announcement, ChatGroup, ConversationContact, DirectMessage, GroupMessage } from "@/lib/communication";
import { safeFetchJson } from "@/lib/safe-fetch";

export function AdminCommunicationView({ canAnnounce }: { canAnnounce: boolean }) {
  const [subTab, setSubTab] = useState<"direct" | "people" | "groups" | "announcements">("direct");

  // Direct chat state
  const [contacts, setContacts] = useState<ConversationContact[]>([]);
  const [activePeer, setActivePeer] = useState<ConversationContact | null>(null);
  const [directMessages, setDirectMessages] = useState<DirectMessage[]>([]);
  const [dmInput, setDmInput] = useState("");
  const [directMessageError, setDirectMessageError] = useState<string | null>(null);
  const [sendingDirect, setSendingDirect] = useState(false);
  const [contactSearch, setContactSearch] = useState("");
  const [messageSearch, setMessageSearch] = useState("");
  const [attachedUrl, setAttachedUrl] = useState<string | null>(null);
  const [attachedName, setAttachedName] = useState<string | null>(null);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // People directory state
  const [dirSearch, setDirSearch] = useState("");
  const [dirDeptFilter, setDirDeptFilter] = useState("all");

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
  const [annRole, setAnnRole] = useState("");
  const [annAttachmentUrl, setAnnAttachmentUrl] = useState("");
  const [annImageUrl, setAnnImageUrl] = useState("");
  const [annBusy, setAnnBusy] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load contacts
  const loadContacts = useCallback(async () => {
    const res = await safeFetchJson<{ contacts: ConversationContact[] }>("/api/admin/communication/direct");
    if (res.ok && res.data) {
      setContacts(res.data.contacts || []);
      if (res.data.contacts?.length > 0) {
        setActivePeer((prev) => {
          if (!prev) return res.data?.contacts?.[0] || null;
          // Refresh activePeer reference with latest unread status
          return res.data?.contacts?.find((c) => c.id === prev.id) || prev;
        });
      }
    }
  }, []);

  // Load direct messages
  const loadDirectMessages = useCallback(async (peerId: string) => {
    const res = await safeFetchJson<{ messages: DirectMessage[] }>(
      `/api/admin/communication/direct?peerId=${peerId}`
    );
    if (res.ok && res.data) {
      setDirectMessages(res.data.messages || []);
    }
  }, []);

  // Load groups
  const loadGroups = useCallback(async () => {
    const res = await safeFetchJson<{ groups: ChatGroup[] }>("/api/admin/communication/groups");
    if (res.ok && res.data) {
      setGroups(res.data.groups || []);
      if (res.data.groups?.length > 0) {
        setActiveGroup((prev) => prev ?? res.data?.groups?.[0] ?? null);
      }
    }
  }, []);

  // Load group messages
  const loadGroupMessages = useCallback(async (groupId: string) => {
    const res = await safeFetchJson<{ messages: GroupMessage[] }>(
      `/api/admin/communication/groups?groupId=${groupId}`
    );
    if (res.ok && res.data) {
      setGroupMessages(res.data.messages || []);
    }
  }, []);

  // Load announcements
  const loadAnnouncements = useCallback(async () => {
    const res = await safeFetchJson<{ announcements: Announcement[] }>("/api/admin/communication/announcements");
    if (res.ok && res.data) {
      setAnnouncements(res.data.announcements || []);
    }
  }, []);

  useEffect(() => {
    if (subTab === "direct" || subTab === "people") loadContacts();
    else if (subTab === "groups") loadGroups();
    else if (subTab === "announcements") loadAnnouncements();
  }, [subTab, loadContacts, loadGroups, loadAnnouncements]);

  useEffect(() => {
    if (activePeer && subTab === "direct") {
      loadDirectMessages(activePeer.id);
      const timer = setInterval(() => loadDirectMessages(activePeer.id), 8000);
      return () => clearInterval(timer);
    }
  }, [activePeer, subTab, loadDirectMessages]);

  useEffect(() => {
    if (activeGroup && subTab === "groups") {
      loadGroupMessages(activeGroup.id);
      const timer = setInterval(() => loadGroupMessages(activeGroup.id), 8000);
      return () => clearInterval(timer);
    }
  }, [activeGroup, subTab, loadGroupMessages]);

  useEffect(() => {
    if (!messageSearch) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [directMessages, groupMessages, messageSearch]);

  // Handle file attachment upload
  async function handleFileUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAttachment(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/admin/media/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Upload failed." }));
        throw new Error(err.error || "File upload failed.");
      }

      const data = await res.json();
      setAttachedUrl(data.url);
      setAttachedName(file.name);
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : "Failed to upload file.");
    } finally {
      setUploadingAttachment(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  // Send Direct Message. Keep the draft until the server confirms delivery.
  async function handleSendDirect(e: FormEvent) {
    e.preventDefault();
    if (sendingDirect || !activePeer || (!dmInput.trim() && !attachedUrl)) return;

    const peer = activePeer;
    const text = dmInput.trim();
    const fileUrl = attachedUrl;
    const fileName = attachedName;
    setDirectMessageError(null);
    setSendingDirect(true);

    try {
      const res = await safeFetchJson<{ message: DirectMessage }>("/api/admin/communication/direct", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientId: peer.id,
          content: text || `[Shared attachment: ${fileName || "File"}]`,
          attachmentUrl: fileUrl,
        }),
      });

      if (!res.ok) {
        setDirectMessageError(res.error || "The message could not be sent. Your draft has been kept.");
        return;
      }

      setDmInput("");
      setAttachedUrl(null);
      setAttachedName(null);
      await loadDirectMessages(peer.id);
      await loadContacts();
    } catch (error) {
      setDirectMessageError(error instanceof Error ? error.message : "The message could not be sent. Your draft has been kept.");
    } finally {
      setSendingDirect(false);
    }
  }

  // Send Group Message
  async function handleSendGroup(e: FormEvent) {
    e.preventDefault();
    if (!activeGroup || !groupInput.trim()) return;
    const text = groupInput;
    setGroupInput("");

    const res = await safeFetchJson("/api/admin/communication/groups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ groupId: activeGroup.id, content: text }),
    });

    if (res.ok) {
      await loadGroupMessages(activeGroup.id);
    }
  }

  // Create Channel Group
  async function handleCreateGroup(e: FormEvent) {
    e.preventDefault();
    if (!newGroupName.trim()) return;

    const res = await safeFetchJson("/api/admin/communication/groups", {
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
  }

  // Publish Announcement
  async function handleCreateAnnouncement(e: FormEvent) {
    e.preventDefault();
    if (!annTitle.trim() || !annContent.trim()) return;
    setAnnBusy(true);

    const res = await safeFetchJson("/api/admin/communication/announcements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: annTitle,
        content: annContent,
        priority: annPriority,
        target_department: annDept || null,
        target_role: annRole || null,
        attachment_url: annAttachmentUrl || null,
        image_url: annImageUrl || null,
      }),
    });

    setAnnBusy(false);
    if (res.ok) {
      setShowNewAnnounce(false);
      setAnnTitle("");
      setAnnContent("");
      setAnnDept("");
      setAnnRole("");
      setAnnAttachmentUrl("");
      setAnnImageUrl("");
      await loadAnnouncements();
    }
  }

  // Mark Announcement Read
  async function markAnnouncementRead(id: string) {
    const res = await safeFetchJson("/api/admin/communication/announcements", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });

    if (res.ok) {
      setAnnouncements((prev) =>
        prev.map((a) => (a.id === id ? { ...a, is_read: true } : a))
      );
    }
  }

  // Switch to direct chat with a person
  function startChatWith(contact: ConversationContact) {
    setActivePeer(contact);
    setSubTab("direct");
  }

  // Filtered contacts for direct chat sidebar
  const filteredContacts = useMemo(() => {
    const q = contactSearch.toLowerCase().trim();
    return contacts.filter((c) => {
      if (!q) return true;
      return (
        c.full_name.toLowerCase().includes(q) ||
        (c.staff_number && c.staff_number.toLowerCase().includes(q)) ||
        (c.department && c.department.toLowerCase().includes(q)) ||
        (c.role && c.role.toLowerCase().includes(q))
      );
    });
  }, [contacts, contactSearch]);

  // Filtered staff for People Directory tab
  const directoryStaff = useMemo(() => {
    const q = dirSearch.toLowerCase().trim();
    return contacts.filter((c) => {
      const matchesQ =
        !q ||
        c.full_name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        (c.staff_number && c.staff_number.toLowerCase().includes(q)) ||
        (c.role && c.role.toLowerCase().includes(q)) ||
        (c.department && c.department.toLowerCase().includes(q));
      const matchesDept = dirDeptFilter === "all" || (c.department || "").toLowerCase() === dirDeptFilter.toLowerCase();
      return matchesQ && matchesDept;
    });
  }, [contacts, dirSearch, dirDeptFilter]);

  // Unique departments for filter
  const departments = useMemo(() => {
    const depts = new Set<string>();
    contacts.forEach((c) => {
      if (c.department) depts.add(c.department);
    });
    return Array.from(depts);
  }, [contacts]);

  // Filtered messages in active conversation
  const displayedMessages = useMemo(() => {
    const q = messageSearch.toLowerCase().trim();
    if (!q) return directMessages;
    return directMessages.filter(
      (m) =>
        m.content.toLowerCase().includes(q) ||
        (m.attachment_url && m.attachment_url.toLowerCase().includes(q))
    );
  }, [directMessages, messageSearch]);

  // Total unread messages across all contacts
  const totalUnreadMessages = useMemo(() => {
    return contacts.reduce((sum, c) => sum + (c.unread_count || 0), 0);
  }, [contacts]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* SUB-NAVIGATION TABS */}
      <div
        style={{
          display: "flex",
          gap: "10px",
          borderBottom: "1px solid #1f3034",
          paddingBottom: "12px",
          flexWrap: "wrap",
        }}
      >
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
            gap: "8px",
          }}
        >
          <User size={15} /> Direct Staff Messages
          {totalUnreadMessages > 0 && (
            <span
              style={{
                background: "#45c8d8",
                color: "#041719",
                fontSize: "10px",
                fontWeight: 800,
                padding: "1px 7px",
                borderRadius: "999px",
              }}
            >
              {totalUnreadMessages}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setSubTab("people")}
          style={{
            background: subTab === "people" ? "rgba(69,200,216,0.15)" : "transparent",
            color: subTab === "people" ? "#45c8d8" : "#8fa5a9",
            border: "none",
            borderRadius: "6px",
            padding: "8px 16px",
            fontSize: "13px",
            fontWeight: 700,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <Users size={15} /> People Directory ({contacts.length})
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
            gap: "8px",
          }}
        >
          <Hash size={15} /> Departmental Channels ({groups.length})
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
            gap: "8px",
          }}
        >
          <Volume2 size={15} /> Internal Announcements
          {announcements.filter((a) => !a.is_read).length > 0 && (
            <span
              style={{
                background: "#f59e0b",
                color: "#041719",
                fontSize: "10px",
                fontWeight: 800,
                padding: "1px 7px",
                borderRadius: "999px",
              }}
            >
              {announcements.filter((a) => !a.is_read).length} new
            </span>
          )}
        </button>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 1. DIRECT MESSAGING VIEW */}
      {/* ------------------------------------------------------------- */}
      {subTab === "direct" && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "310px 1fr",
            gap: "16px",
            height: "640px",
            background: "#081518",
            border: "1px solid #1a2c30",
            borderRadius: "10px",
            overflow: "hidden",
          }}
        >
          {/* CONTACTS SIDEBAR */}
          <div style={{ borderRight: "1px solid #1a2c30", display: "flex", flexDirection: "column" }}>
            <div style={{ padding: "12px 14px", borderBottom: "1px solid #1a2c30", position: "relative" }}>
              <Search size={14} style={{ position: "absolute", left: "24px", top: "22px", color: "#6e898e" }} />
              <input
                placeholder="Search staff by name or ID..."
                value={contactSearch}
                onChange={(e) => setContactSearch(e.target.value)}
                style={{ fontSize: "12px", padding: "8px 12px 8px 32px", width: "100%" }}
              />
            </div>

            <div style={{ flex: 1, overflowY: "auto" }}>
              {filteredContacts.map((c) => {
                const isSelected = activePeer?.id === c.id;
                return (
                  <div
                    key={c.id}
                    onClick={() => setActivePeer(c)}
                    style={{
                      padding: "12px 14px",
                      borderBottom: "1px solid rgba(255,255,255,0.04)",
                      cursor: "pointer",
                      background: isSelected ? "rgba(69,200,216,0.12)" : "transparent",
                      transition: "background 0.15s ease",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <strong style={{ fontSize: "13px", color: isSelected ? "#45c8d8" : "#f1fbfc" }}>
                        {c.full_name}
                      </strong>
                      {c.unread_count > 0 && (
                        <span
                          style={{
                            background: "#45c8d8",
                            color: "#041719",
                            fontSize: "10px",
                            fontWeight: 800,
                            padding: "1px 6px",
                            borderRadius: "999px",
                          }}
                        >
                          {c.unread_count}
                        </span>
                      )}
                    </div>
                    <div style={{ display: "flex", gap: "6px", alignItems: "center", marginTop: "3px" }}>
                      {c.staff_number && (
                        <span style={{ fontSize: "10px", color: "#63d8e5", fontFamily: "monospace" }}>
                          {c.staff_number}
                        </span>
                      )}
                      {c.department && <small style={{ color: "#769196" }}>· {c.department}</small>}
                    </div>
                    {c.last_message && (
                      <p
                        style={{
                          margin: "4px 0 0",
                          fontSize: "11px",
                          color: "#7e969a",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {c.last_message}
                      </p>
                    )}
                  </div>
                );
              })}
              {filteredContacts.length === 0 && (
                <div style={{ padding: "20px", textAlign: "center", color: "#6e898e", fontSize: "12px" }}>
                  No colleagues match your search.
                </div>
              )}
            </div>
          </div>

          {/* CHAT WINDOW */}
          {activePeer ? (
            <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
              {/* CHAT HEADER */}
              <div
                style={{
                  padding: "12px 20px",
                  borderBottom: "1px solid #1a2c30",
                  background: "#0a191d",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "12px",
                }}
              >
                <div>
                  <h3 style={{ margin: 0, fontSize: "14px", color: "#f1fbfc", display: "flex", alignItems: "center", gap: "8px" }}>
                    {activePeer.full_name}
                    <span
                      style={{
                        fontSize: "10px",
                        padding: "1px 6px",
                        borderRadius: "4px",
                        background: "rgba(16,185,129,0.15)",
                        color: "#34d399",
                        fontWeight: 600,
                      }}
                    >
                      Active
                    </span>
                  </h3>
                  <small style={{ color: "#769196" }}>
                    {activePeer.staff_number || "CMG-STAFF"} · {activePeer.role.replaceAll("_", " ")}
                    {activePeer.department && ` · ${activePeer.department}`}
                  </small>
                </div>

                {/* IN-CONVERSATION SEARCH */}
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <div style={{ position: "relative", width: "180px" }}>
                    <Search size={13} style={{ position: "absolute", left: "10px", top: "10px", color: "#6e898e" }} />
                    <input
                      placeholder="Search messages..."
                      value={messageSearch}
                      onChange={(e) => setMessageSearch(e.target.value)}
                      style={{
                        fontSize: "11px",
                        padding: "6px 8px 6px 28px",
                        background: "#081316",
                        border: "1px solid #1a2c30",
                      }}
                    />
                    {messageSearch && (
                      <button
                        onClick={() => setMessageSearch("")}
                        style={{
                          position: "absolute",
                          right: "6px",
                          top: "6px",
                          background: "transparent",
                          border: "none",
                          color: "#8fa5a9",
                          cursor: "pointer",
                          padding: "2px",
                        }}
                      >
                        <X size={12} />
                      </button>
                    )}
                  </div>

                  <button
                    onClick={() => loadDirectMessages(activePeer.id)}
                    title="Refresh conversation"
                    style={{
                      background: "transparent",
                      border: "1px solid #1a2c30",
                      borderRadius: "6px",
                      color: "#8fa5a9",
                      padding: "6px 8px",
                      cursor: "pointer",
                    }}
                  >
                    <RefreshCw size={13} />
                  </button>
                </div>
              </div>

              {/* MESSAGES THREAD */}
              <div
                style={{
                  flex: 1,
                  overflowY: "auto",
                  padding: "20px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
                {displayedMessages.length === 0 ? (
                  <div style={{ margin: "auto", textAlign: "center", color: "#6b868b", fontSize: "13px" }}>
                    {messageSearch
                      ? `No messages matching "${messageSearch}".`
                      : `No messages yet with ${activePeer.full_name}. Say hello!`}
                  </div>
                ) : (
                  displayedMessages.map((msg) => {
                    const isMe = msg.sender_id !== activePeer.id;
                    const hasAttachment = Boolean(msg.attachment_url);
                    const isImage =
                      hasAttachment &&
                      (msg.attachment_url?.match(/\.(jpg|jpeg|png|webp|gif|svg)$/i) ||
                        msg.attachment_url?.includes("/api/media/"));

                    return (
                      <div
                        key={msg.id}
                        style={{
                          alignSelf: isMe ? "flex-end" : "flex-start",
                          maxWidth: "72%",
                          background: isMe ? "linear-gradient(135deg, #0b5965 0%, #063b45 100%)" : "#0d2227",
                          border: `1px solid ${isMe ? "rgba(72,198,212,0.4)" : "#1c3236"}`,
                          borderRadius: "10px",
                          padding: "10px 14px",
                        }}
                      >
                        {/* ATTACHMENT PREVIEW */}
                        {hasAttachment && (
                          <div style={{ marginBottom: "8px" }}>
                            {isImage ? (
                              <a href={msg.attachment_url!} target="_blank" rel="noopener noreferrer">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={msg.attachment_url!}
                                  alt="Attachment"
                                  style={{
                                    maxWidth: "280px",
                                    maxHeight: "180px",
                                    borderRadius: "6px",
                                    display: "block",
                                    objectFit: "cover",
                                    border: "1px solid rgba(255,255,255,0.1)",
                                  }}
                                />
                              </a>
                            ) : (
                              <a
                                href={msg.attachment_url!}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "8px",
                                  padding: "6px 10px",
                                  background: "rgba(0,0,0,0.3)",
                                  borderRadius: "6px",
                                  color: "#62d8e5",
                                  fontSize: "12px",
                                  textDecoration: "none",
                                  border: "1px solid rgba(69,200,216,0.3)",
                                }}
                              >
                                <FileText size={15} /> Document Attachment <Download size={13} />
                              </a>
                            )}
                          </div>
                        )}

                        <p
                          style={{
                            margin: 0,
                            fontSize: "13px",
                            color: "#f4fbfc",
                            whiteSpace: "pre-wrap",
                            lineHeight: "1.6",
                          }}
                        >
                          {msg.content}
                        </p>
                        <small
                          style={{
                            display: "block",
                            textAlign: "right",
                            marginTop: "4px",
                            fontSize: "9px",
                            color: "#8aa2a6",
                          }}
                        >
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </small>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* ATTACHMENT PREVIEW STRIP */}
              {attachedUrl && (
                <div
                  style={{
                    padding: "8px 16px",
                    background: "#0d282e",
                    borderTop: "1px solid #1a3c42",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "10px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "#65d5e1" }}>
                    <Paperclip size={14} />
                    <span>Attached: {attachedName || "File ready to send"}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setAttachedUrl(null);
                      setAttachedName(null);
                    }}
                    style={{ background: "transparent", border: "none", color: "#ff8888", cursor: "pointer" }}
                  >
                    <X size={14} />
                  </button>
                </div>
              )}

              {uploadError && (
                <div style={{ padding: "6px 16px", background: "rgba(220,38,38,0.2)", color: "#fca5a5", fontSize: "11px" }}>
                  {uploadError}
                </div>
              )}

              {directMessageError && (
                <div
                  role="alert"
                  style={{
                    padding: "8px 14px",
                    background: "rgba(220,38,38,0.18)",
                    borderTop: "1px solid rgba(248,113,113,0.3)",
                    color: "#fca5a5",
                    fontSize: "12px",
                  }}
                >
                  {directMessageError}
                </div>
              )}

              {/* MESSAGE COMPOSER */}
              <form
                onSubmit={handleSendDirect}
                style={{
                  padding: "12px 14px",
                  borderTop: "1px solid #1a2c30",
                  display: "flex",
                  gap: "10px",
                  background: "#09171a",
                  alignItems: "center",
                }}
              >
                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileUpload}
                  style={{ display: "none" }}
                  accept="image/*,application/pdf"
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAttachment}
                  title="Attach image or PDF document"
                  style={{
                    background: "transparent",
                    border: "1px solid #1a2c30",
                    borderRadius: "6px",
                    color: uploadingAttachment ? "#45c8d8" : "#8fa5a9",
                    padding: "10px",
                    cursor: "pointer",
                    display: "grid",
                    placeItems: "center",
                  }}
                >
                  <Paperclip size={16} />
                </button>

                <input
                  value={dmInput}
                  onChange={(e) => setDmInput(e.target.value)}
                  disabled={sendingDirect}
                  placeholder={
                    uploadingAttachment
                      ? "Uploading attachment..."
                      : `Message ${activePeer.full_name}...`
                  }
                  style={{ flex: 1 }}
                />

                <button
                  className="admin-button"
                  type="submit"
                  disabled={uploadingAttachment || sendingDirect || (!dmInput.trim() && !attachedUrl)}
                  aria-label={sendingDirect ? "Sending message" : "Send message"}
                  style={{ padding: "10px 16px" }}
                >
                  {sendingDirect ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
                </button>
              </form>
            </div>
          ) : (
            <div style={{ display: "grid", placeItems: "center", color: "#779095", fontSize: "13px" }}>
              Select a colleague from the directory or use the People Directory tab to start a conversation.
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 2. PEOPLE DIRECTORY TAB */}
      {/* ------------------------------------------------------------- */}
      {subTab === "people" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* SEARCH & FILTERS */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "12px",
              background: "#081518",
              padding: "14px 18px",
              borderRadius: "8px",
              border: "1px solid #1a2c30",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1, minWidth: "280px" }}>
              <div style={{ position: "relative", flex: 1 }}>
                <Search size={14} style={{ position: "absolute", left: "12px", top: "12px", color: "#6e898e" }} />
                <input
                  placeholder="Search staff by name, email, department, or CMG ID..."
                  value={dirSearch}
                  onChange={(e) => setDirSearch(e.target.value)}
                  style={{ fontSize: "12px", padding: "8px 12px 8px 34px", width: "100%" }}
                />
              </div>

              <select
                value={dirDeptFilter}
                onChange={(e) => setDirDeptFilter(e.target.value)}
                style={{ width: "180px", fontSize: "12px" }}
              >
                <option value="all">All Departments</option>
                {departments.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <button
              className="admin-button secondary"
              onClick={() => loadContacts()}
              style={{ fontSize: "12px", padding: "8px 14px" }}
            >
              <RefreshCw size={13} style={{ marginRight: 6 }} /> Refresh Directory
            </button>
          </div>

          {/* PEOPLE DIRECTORY CARDS GRID */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
              gap: "14px",
            }}
          >
            {directoryStaff.map((person) => {
              const initials = person.full_name
                .split(" ")
                .filter(Boolean)
                .map((n) => n[0])
                .slice(0, 2)
                .join("")
                .toUpperCase();

              return (
                <div
                  key={person.id}
                  style={{
                    background: "#0a171a",
                    border: "1px solid #1a2c30",
                    borderRadius: "10px",
                    padding: "18px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    gap: "14px",
                    transition: "border-color 0.2s ease",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "14px" }}>
                    {/* AVATAR LOCKUP */}
                    <div
                      style={{
                        width: "44px",
                        height: "44px",
                        borderRadius: "50%",
                        background: "linear-gradient(135deg, #0d3840 0%, #061c20 100%)",
                        border: "1px solid #45c8d8",
                        display: "grid",
                        placeItems: "center",
                        fontWeight: 700,
                        fontSize: "14px",
                        color: "#65d5e1",
                        flexShrink: 0,
                      }}
                    >
                      {initials || "CM"}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                        <h4 style={{ margin: 0, fontSize: "14px", color: "#f1fbfc", fontWeight: 700 }}>
                          {person.full_name}
                        </h4>
                        <span
                          style={{
                            fontSize: "10px",
                            padding: "1px 6px",
                            borderRadius: "4px",
                            background: "rgba(16,185,129,0.15)",
                            color: "#34d399",
                            fontWeight: 600,
                          }}
                        >
                          Available
                        </span>
                      </div>

                      <div style={{ display: "flex", gap: "6px", alignItems: "center", marginTop: "3px" }}>
                        <span style={{ fontSize: "11px", color: "#45c8d8", fontFamily: "monospace", fontWeight: 700 }}>
                          {person.staff_number || "CMG-STAFF"}
                        </span>
                        <span style={{ fontSize: "11px", color: "#8fa5a9" }}>· {person.role.replaceAll("_", " ")}</span>
                      </div>

                      <div style={{ fontSize: "11px", color: "#627f84", marginTop: "4px" }}>
                        {person.department ? `Department: ${person.department}` : "Independent Office"}
                      </div>
                      <div style={{ fontSize: "11px", color: "#769196", marginTop: "2px", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {person.email}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "12px" }}>
                    <small style={{ fontSize: "11px", color: "#627f84" }}>
                      {person.unread_count > 0 ? `${person.unread_count} unread messages` : "All messages read"}
                    </small>
                    <button
                      className="admin-button"
                      onClick={() => startChatWith(person)}
                      style={{ fontSize: "12px", padding: "6px 14px", display: "inline-flex", alignItems: "center", gap: "6px" }}
                    >
                      <User size={13} /> Message
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {directoryStaff.length === 0 && (
            <div style={{ padding: "40px", textAlign: "center", color: "#8fa5a9", background: "#0a171a", borderRadius: "8px" }}>
              No staff members found matching &quot;{dirSearch}&quot;.
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 3. DEPARTMENTAL CHANNELS VIEW */}
      {/* ------------------------------------------------------------- */}
      {subTab === "groups" && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "280px 1fr",
            gap: "16px",
            height: "640px",
            background: "#081518",
            border: "1px solid #1a2c30",
            borderRadius: "10px",
            overflow: "hidden",
          }}
        >
          {/* CHANNELS SIDEBAR */}
          <div style={{ borderRight: "1px solid #1a2c30", display: "flex", flexDirection: "column" }}>
            <div
              style={{
                padding: "14px",
                borderBottom: "1px solid #1a2c30",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <strong style={{ fontSize: "13px", color: "#f1fbfc" }}>Team Channels</strong>
              <button
                type="button"
                onClick={() => setShowNewGroup(true)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#45c8d8",
                  cursor: "pointer",
                  fontSize: "12px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <Plus size={13} /> New Channel
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
              {groups.length === 0 && (
                <div style={{ padding: "20px", textAlign: "center", color: "#6e898e", fontSize: "12px" }}>
                  No channels created yet.
                </div>
              )}
            </div>
          </div>

          {/* CHANNEL CHAT WINDOW */}
          {activeGroup ? (
            <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
              <div style={{ padding: "14px 20px", borderBottom: "1px solid #1a2c30", background: "#0a191d" }}>
                <h3 style={{ margin: 0, fontSize: "14px", color: "#f1fbfc" }}>#{activeGroup.name}</h3>
                <small style={{ color: "#769196" }}>{activeGroup.description || "General departmental workspace."}</small>
              </div>

              <div
                style={{
                  flex: 1,
                  overflowY: "auto",
                  padding: "20px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
                {groupMessages.map((msg) => (
                  <div
                    key={msg.id}
                    style={{
                      background: "#0d2227",
                      padding: "10px 14px",
                      borderRadius: "8px",
                      border: "1px solid #1c3236",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                      <strong style={{ fontSize: "12px", color: "#45c8d8" }}>
                        {msg.sender_name} {msg.sender_staff_number && `(${msg.sender_staff_number})`}
                      </strong>
                      <small style={{ fontSize: "10px", color: "#6a888d" }}>
                        {new Date(msg.created_at).toLocaleTimeString()}
                      </small>
                    </div>
                    <p style={{ margin: 0, fontSize: "13px", color: "#f4fbfc" }}>{msg.content}</p>
                  </div>
                ))}
                {groupMessages.length === 0 && (
                  <div style={{ margin: "auto", color: "#6e898e", fontSize: "13px" }}>
                    No messages in #{activeGroup.name} yet. Start the conversation!
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              <form
                onSubmit={handleSendGroup}
                style={{ padding: "14px", borderTop: "1px solid #1a2c30", display: "flex", gap: "10px", background: "#09171a" }}
              >
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
            <div style={{ display: "grid", placeItems: "center", color: "#779095" }}>
              Select a channel to join discussion.
            </div>
          )}
        </div>
      )}

      {/* NEW CHANNEL MODAL */}
      {showNewGroup && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(3,15,18,0.85)",
            backdropFilter: "blur(6px)",
            zIndex: 999,
            display: "grid",
            placeItems: "center",
            padding: "20px",
          }}
        >
          <div
            style={{
              background: "#0a1417",
              border: "1px solid #45c8d8",
              borderRadius: "12px",
              padding: "24px",
              maxWidth: "440px",
              width: "100%",
            }}
          >
            <h3 style={{ margin: "0 0 14px", color: "#f1fbfc" }}>Create Team Channel</h3>
            <form onSubmit={handleCreateGroup}>
              <label>
                Channel Name
                <input
                  required
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="e.g. ai-research or engineering"
                />
              </label>
              <label>
                Department Tag (optional)
                <input
                  value={newGroupDept}
                  onChange={(e) => setNewGroupDept(e.target.value)}
                  placeholder="Engineering / AI / Product"
                />
              </label>
              <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
                <button className="admin-button" type="submit">
                  Create Channel
                </button>
                <button className="admin-button secondary" type="button" onClick={() => setShowNewGroup(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 4. ANNOUNCEMENTS BULLETIN VIEW */}
      {/* ------------------------------------------------------------- */}
      {subTab === "announcements" && (
        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "16px",
              flexWrap: "wrap",
              gap: "10px",
            }}
          >
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
            <div
              style={{
                position: "fixed",
                inset: 0,
                background: "rgba(3,15,18,0.85)",
                backdropFilter: "blur(6px)",
                zIndex: 999,
                display: "grid",
                placeItems: "center",
                padding: "20px",
              }}
            >
              <div
                style={{
                  background: "#0a1417",
                  border: "1px solid #45c8d8",
                  borderRadius: "12px",
                  padding: "26px",
                  maxWidth: "580px",
                  width: "100%",
                }}
              >
                <h3 style={{ margin: "0 0 16px", color: "#f1fbfc" }}>Publish Internal Announcement</h3>
                <form onSubmit={handleCreateAnnouncement}>
                  <label>
                    Announcement Title
                    <input
                      required
                      value={annTitle}
                      onChange={(e) => setAnnTitle(e.target.value)}
                      placeholder="e.g. Q4 Sprint Review Schedule"
                    />
                  </label>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                    <label>
                      Priority Level
                      <select
                        value={annPriority}
                        onChange={(e) => setAnnPriority(e.target.value as Announcement["priority"])}
                      >
                        <option value="normal">Normal</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                        <option value="low">Low</option>
                      </select>
                    </label>
                    <label>
                      Target Department
                      <input
                        value={annDept}
                        onChange={(e) => setAnnDept(e.target.value)}
                        placeholder="Leave blank for all departments"
                      />
                    </label>
                  </div>
                  <label>
                    Target Role (optional)
                    <input
                      value={annRole}
                      onChange={(e) => setAnnRole(e.target.value)}
                      placeholder="Leave blank for all roles, or e.g. developer"
                    />
                  </label>
                  <label>
                    Announcement Content
                    <textarea
                      required
                      rows={5}
                      value={annContent}
                      onChange={(e) => setAnnContent(e.target.value)}
                      placeholder="Full bulletin text..."
                    />
                  </label>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                    <label>
                      Image URL (optional)
                      <input
                        value={annImageUrl}
                        onChange={(e) => setAnnImageUrl(e.target.value)}
                        placeholder="https://... or /api/media/..."
                      />
                    </label>
                    <label>
                      Attachment URL (optional)
                      <input
                        value={annAttachmentUrl}
                        onChange={(e) => setAnnAttachmentUrl(e.target.value)}
                        placeholder="https://... or /api/media/..."
                      />
                    </label>
                  </div>
                  <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
                    <button className="admin-button" type="submit" disabled={annBusy}>
                      {annBusy ? "Publishing…" : "Publish"}
                    </button>
                    <button className="admin-button secondary" type="button" onClick={() => setShowNewAnnounce(false)}>
                      Cancel
                    </button>
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
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      gap: "12px",
                      marginBottom: "8px",
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "4px", flexWrap: "wrap" }}>
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
                          <span style={{ fontSize: "11px", color: "#63d8e5" }}>[{ann.target_department}]</span>
                        )}
                        {ann.target_role && (
                          <span style={{ fontSize: "11px", color: "#c084fc" }}>[Role: {ann.target_role}]</span>
                        )}
                        <strong style={{ fontSize: "15px", color: "#f1fbfc" }}>{ann.title}</strong>
                      </div>
                      <small style={{ color: "#7a989d" }}>
                        By {ann.author_name || "CodeMtaani Admin"}{" "}
                        {ann.author_staff_number && `(${ann.author_staff_number})`} ·{" "}
                        {new Date(ann.published_at).toLocaleString()}
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

                  {ann.image_url && (
                    <div style={{ margin: "12px 0" }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={ann.image_url}
                        alt=""
                        style={{
                          maxWidth: "100%",
                          maxHeight: "320px",
                          borderRadius: "6px",
                          objectFit: "cover",
                        }}
                      />
                    </div>
                  )}

                  <p
                    style={{
                      margin: "12px 0 0",
                      fontSize: "13px",
                      lineHeight: "1.8",
                      color: "#d2e3e6",
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {ann.content}
                  </p>

                  {ann.attachment_url && (
                    <div style={{ marginTop: "12px" }}>
                      <a
                        href={ann.attachment_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-link"
                        style={{ fontSize: "12px", display: "inline-flex", alignItems: "center", gap: "6px" }}
                      >
                        <Download size={13} /> View Attached Document / File
                      </a>
                    </div>
                  )}
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
