"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  ThumbsUp,
  ThumbsDown,
  Flag,
  Pin,
  Pencil,
  Trash2,
  Eye,
  Plus,
  X,
  BarChart2,
  BookOpen,
  AlertTriangle,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import { API_BASE_URL } from "@/config/constants";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ResourceData {
  id: string;
  title: string;
  content: string;
  excerpt: string | null;
  category: string;
  is_pinned: boolean;
  view_count: number;
  likes_count: number;
  dislikes_count: number;
  created_at: string;
  author_id: string;
  author_name: string;
  author_tier: "volunteer" | "professional" | null;
  viewer_reaction: "like" | "dislike" | null;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

interface ReactResult {
  reaction: "like" | "dislike" | null;
  likes_count: number;
  dislikes_count: number;
}

interface ViewStats {
  total_views: number;
  unique_viewers: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES = [
  { value: "", label: "All", icon: "📚" },
  { value: "anxiety", label: "Anxiety", icon: "😰" },
  { value: "depression", label: "Depression", icon: "😞" },
  { value: "relationships", label: "Relationships", icon: "👥" },
  { value: "academic", label: "Academic", icon: "🎓" },
  { value: "financial", label: "Financial", icon: "💰" },
  { value: "health", label: "Health", icon: "❤️" },
  { value: "family", label: "Family", icon: "🏠" },
  { value: "crisis", label: "Crisis", icon: "🆘" },
];

const WRITE_CATEGORIES = [
  "anxiety",
  "depression",
  "relationships",
  "academic",
  "financial",
  "health",
  "family",
  "crisis",
  "general",
];

// ─── Write Article Modal ──────────────────────────────────────────────────────

interface WriteModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: string;
  editResource: ResourceData | null;
  onSaved: (resource: ResourceData) => void;
}

function WriteArticleModal({
  isOpen,
  onClose,
  token,
  editResource,
  onSaved,
}: WriteModalProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [category, setCategory] = useState("general");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (editResource) {
      setTitle(editResource.title);
      setContent(editResource.content);
      setExcerpt(editResource.excerpt ?? "");
      setCategory(editResource.category);
    } else {
      setTitle("");
      setContent("");
      setExcerpt("");
      setCategory("general");
    }
    setError("");
  }, [editResource, isOpen]);

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      setError("Title and content are required.");
      return;
    }
    setSaving(true);
    try {
      const url = editResource
        ? `${API_BASE_URL}/resources/${editResource.id}`
        : `${API_BASE_URL}/resources`;
      const method = editResource ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
          excerpt: excerpt.trim() || undefined,
          category,
        }),
      });
      const data = (await res.json()) as ApiResponse<ResourceData>;
      if (data.success) {
        onSaved(data.data);
        onClose();
      } else {
        setError(data.error ?? "Failed to save.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative w-full max-w-2xl bg-white rounded-ventsafe-md shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto z-10"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-ventsafe-border/30">
          <h2 className="text-base font-bold text-ventsafe-foreground">
            {editResource ? "Edit Article" : "Write a Resource Article"}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-ventsafe-muted rounded-ventsafe-sm"
          >
            <X size={16} className="text-ventsafe-foreground/50" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-ventsafe-foreground mb-1">
              Title *
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. 5-Minute Anxiety Relief Techniques"
              className="w-full border border-ventsafe-border rounded-ventsafe-sm px-3 py-2.5 text-sm focus:outline-none focus:border-ventsafe-navy"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ventsafe-foreground mb-1">
              Short excerpt (optional)
            </label>
            <input
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="A one-line summary shown in the article list"
              maxLength={200}
              className="w-full border border-ventsafe-border rounded-ventsafe-sm px-3 py-2.5 text-sm focus:outline-none focus:border-ventsafe-navy"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ventsafe-foreground mb-1">
              Category *
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full border border-ventsafe-border rounded-ventsafe-sm px-3 py-2.5 text-sm focus:outline-none focus:border-ventsafe-navy bg-white capitalize"
            >
              {WRITE_CATEGORIES.map((c) => (
                <option key={c} value={c} className="capitalize">
                  {c.charAt(0).toUpperCase() + c.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-ventsafe-foreground mb-1">
              Content *
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your article here. Be clear, compassionate and practical."
              rows={10}
              className="w-full border border-ventsafe-border rounded-ventsafe-sm px-3 py-2.5 text-sm focus:outline-none focus:border-ventsafe-navy resize-none leading-relaxed"
            />
            <p className="text-xs text-ventsafe-foreground/40 mt-1">
              {content.length} characters
            </p>
          </div>

          {error && <p className="text-xs text-red-500 font-medium">{error}</p>}

          <button
            onClick={() => void handleSave()}
            disabled={saving || !title.trim() || !content.trim()}
            className="w-full py-2.5 bg-ventsafe-foreground text-ventsafe-primary-foreground rounded-ventsafe-sm font-semibold text-sm disabled:opacity-40 hover:opacity-90 transition-opacity"
          >
            {saving
              ? "Saving..."
              : editResource
                ? "Save Changes"
                : "Publish Article"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Resource Card ────────────────────────────────────────────────────────────

interface ResourceCardProps {
  resource: ResourceData;
  token: string;
  viewerUserId: string;
  viewerRole: string;
  onEdit?: (r: ResourceData) => void;
  onDelete?: (id: string) => void;
}

// Helper — only used inside ResourceCard but needs to be accessible
function MoreHorizontal({
  size,
  className,
}: {
  size: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      <circle cx="5" cy="12" r="2" />
      <circle cx="12" cy="12" r="2" />
      <circle cx="19" cy="12" r="2" />
    </svg>
  );
}

function ResourceCard({
  resource: initialResource,
  token,
  viewerUserId,
  viewerRole,
  onEdit,
  onDelete,
}: ResourceCardProps) {
  const [resource, setResource] = useState<ResourceData>(initialResource);
  const [expanded, setExpanded] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [viewStats, setViewStats] = useState<ViewStats | null>(null);
  const [showReport, setShowReport] = useState(false);
  const [reportReason, setReportReason] = useState("");

  const isOwn = resource.author_id === viewerUserId;
  const isCounsellor = viewerRole === "counselor";
  const isLong = resource.content.length > 350;

  const callApi = async <T = unknown>(
    url: string,
    method: string,
    body?: object,
  ): Promise<ApiResponse<T>> => {
    const res = await fetch(`${API_BASE_URL}${url}`, {
      method,
      headers: {
        ...(body ? { "Content-Type": "application/json" } : {}),
        Authorization: `Bearer ${token}`,
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    return res.json() as Promise<ApiResponse<T>>;
  };

  const handleReact = async (reaction: "like" | "dislike") => {
    const res = await callApi<ReactResult>(
      `/resources/${resource.id}/react`,
      "POST",
      { reaction },
    );
    if (res.success) {
      setResource((r) => ({
        ...r,
        viewer_reaction: res.data.reaction,
        likes_count: res.data.likes_count,
        dislikes_count: res.data.dislikes_count,
      }));
    }
  };

  const handlePin = async () => {
    const res = await callApi<{ is_pinned: boolean }>(
      `/resources/${resource.id}/pin`,
      "PATCH",
    );
    if (res.success) {
      setResource((r) => ({ ...r, is_pinned: res.data.is_pinned }));
    }
  };

  const handleDelete = async () => {
    const res = await callApi<null>(`/resources/${resource.id}`, "DELETE");
    if (res.success && onDelete) onDelete(resource.id);
  };

  const handleViewStats = async () => {
    if (viewStats) {
      setViewStats(null);
      return;
    }
    const res = await callApi<ViewStats>(
      `/resources/${resource.id}/views`,
      "GET",
    );
    if (res.success) setViewStats(res.data);
  };

  const handleReport = async () => {
    if (!reportReason.trim()) return;
    await callApi<null>(`/resources/${resource.id}/report`, "POST", {
      reason: reportReason,
    });
    setShowReport(false);
    setReportReason("");
    setMenuOpen(false);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white border rounded-ventsafe-md overflow-hidden transition-all ${resource.is_pinned ? "border-ventsafe-navy" : "border-ventsafe-border"
        }`}
    >
      <div className="p-5">
        {resource.is_pinned && (
          <div className="flex items-center gap-1 text-ventsafe-navy text-[11px] font-semibold mb-2">
            <Pin size={11} /> Pinned
          </div>
        )}

        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div>
            <h3 className="text-base font-bold text-ventsafe-foreground leading-snug">
              {resource.title}
            </h3>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-xs text-ventsafe-foreground/50">
                by {resource.author_name}
              </span>
              {resource.author_tier && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-ventsafe-navy text-white font-semibold">
                  {resource.author_tier === "professional"
                    ? "Certified"
                    : "Volunteer"}
                </span>
              )}
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-ventsafe-muted text-ventsafe-foreground/60 capitalize">
                {resource.category}
              </span>
              {(resource.category === "crisis" || /(sensitive|adult|nsfw|trigger warning|tw:)/i.test(resource.title) || /(sensitive|adult|nsfw|trigger warning|tw:)/i.test(resource.content)) && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-bold border border-red-200 flex items-center gap-1">
                  <AlertTriangle size={10} /> Sensitive Content
                </span>
              )}
              <span className="text-[11px] text-ventsafe-foreground/40">
                {formatDistanceToNow(new Date(resource.created_at), {
                  addSuffix: true,
                })}
              </span>
            </div>
          </div>

          <div className="relative shrink-0">
            <button
              onClick={() => setMenuOpen((o) => !o)}
              className="p-1.5 hover:bg-ventsafe-muted rounded transition-colors"
            >
              <MoreHorizontal
                size={16}
                className="text-ventsafe-foreground/40"
              />
            </button>
            <AnimatePresence>
              {menuOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="absolute right-0 top-full mt-1 w-48 bg-white border border-ventsafe-border rounded-ventsafe-sm shadow-md z-10 overflow-hidden"
                >
                  {isOwn && isCounsellor && (
                    <>
                      <button
                        onClick={() => {
                          onEdit?.(resource);
                          setMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-ventsafe-foreground hover:bg-ventsafe-muted"
                      >
                        <Pencil size={13} /> Edit article
                      </button>
                      <button
                        onClick={() => void handlePin()}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-ventsafe-foreground hover:bg-ventsafe-muted"
                      >
                        <Pin size={13} /> {resource.is_pinned ? "Unpin" : "Pin"}{" "}
                        article
                      </button>
                      <button
                        onClick={() => void handleViewStats()}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-ventsafe-foreground hover:bg-ventsafe-muted"
                      >
                        <BarChart2 size={13} /> View stats
                      </button>
                      <button
                        onClick={() => void handleDelete()}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50"
                      >
                        <Trash2 size={13} /> Delete
                      </button>
                    </>
                  )}
                  {!isOwn && (
                    <button
                      onClick={() => {
                        setShowReport(true);
                        setMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-ventsafe-foreground hover:bg-ventsafe-muted"
                    >
                      <Flag size={13} /> Report article
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* View stats */}
        {viewStats && (
          <div className="bg-ventsafe-muted rounded-ventsafe-sm px-3 py-2 mb-3 flex items-center gap-4">
            <span className="text-xs text-ventsafe-foreground/70 flex items-center gap-1">
              <Eye size={12} /> {viewStats.total_views} views
            </span>
            <span className="text-xs text-ventsafe-foreground/70">
              {viewStats.unique_viewers} unique readers
            </span>
          </div>
        )}

        {/* Content */}
        <div className="mb-4">
          {resource.excerpt && !expanded && (
            <p className="text-sm text-ventsafe-foreground/70 italic mb-2 leading-relaxed">
              {resource.excerpt}
            </p>
          )}
          <p className="text-sm text-ventsafe-foreground leading-relaxed whitespace-pre-line">
            {isLong && !expanded
              ? resource.content.slice(0, 350) + "..."
              : resource.content}
          </p>
          {isLong && (
            <button
              onClick={() => setExpanded((e) => !e)}
              className="text-xs text-ventsafe-navy font-medium mt-1.5 hover:underline"
            >
              {expanded ? "Show less" : "Read more"}
            </button>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-3 border-t border-ventsafe-border/30">
          <button
            onClick={() => void handleReact("like")}
            className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-ventsafe-sm transition-colors ${resource.viewer_reaction === "like"
                ? "text-ventsafe-navy bg-ventsafe-muted"
                : "text-ventsafe-foreground/60 hover:bg-ventsafe-muted"
              }`}
          >
            <ThumbsUp
              size={13}
              className={
                resource.viewer_reaction === "like" ? "fill-ventsafe-navy" : ""
              }
            />
            {resource.likes_count > 0 && resource.likes_count} Like
          </button>

          <button
            onClick={() => void handleReact("dislike")}
            className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-ventsafe-sm transition-colors ${resource.viewer_reaction === "dislike"
                ? "text-red-500 bg-red-50"
                : "text-ventsafe-foreground/60 hover:bg-ventsafe-muted"
              }`}
          >
            <ThumbsDown
              size={13}
              className={
                resource.viewer_reaction === "dislike" ? "fill-red-500" : ""
              }
            />
            {resource.dislikes_count > 0 && resource.dislikes_count}
          </button>

          <span className="text-xs text-ventsafe-foreground/40 flex items-center gap-1 ml-auto">
            <Eye size={11} /> {resource.view_count}
          </span>
        </div>

        {/* Report input */}
        <AnimatePresence>
          {showReport && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="pt-3 space-y-2">
                <input
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  placeholder="Why are you reporting this article?"
                  className="w-full border border-ventsafe-border rounded-ventsafe-sm px-3 py-2 text-xs focus:outline-none focus:border-ventsafe-navy"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => void handleReport()}
                    disabled={!reportReason.trim()}
                    className="px-3 py-1.5 bg-red-500 text-white rounded-ventsafe-sm text-xs font-medium disabled:opacity-40"
                  >
                    Submit
                  </button>
                  <button
                    onClick={() => setShowReport(false)}
                    className="px-3 py-1.5 border border-ventsafe-border rounded-ventsafe-sm text-xs"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ─── Main ResourcesClient ─────────────────────────────────────────────────────

export default function ResourcesClient() {
  const { user, token } = useAuth();

  const [resources, setResources] = useState<ResourceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [writeModalOpen, setWriteModalOpen] = useState(false);
  const [editResource, setEditResource] = useState<ResourceData | null>(null);

  const viewerUserId = user?.id ?? "";
  const viewerRole = user?.role ?? "student";
  const isCounsellor = viewerRole === "counselor";

  const fetchResources = useCallback(
    async (pageNum: number, replace = false) => {
      if (!token) return;
      if (pageNum === 1) setLoading(true);
      try {
        const params = new URLSearchParams({
          page: String(pageNum),
          limit: "20",
          ...(category ? { category } : {}),
          ...(search ? { search } : {}),
        });
        const res = await fetch(`${API_BASE_URL}/resources?${params}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = (await res.json()) as ApiResponse<{
          resources: ResourceData[];
          hasMore: boolean;
        }>;
        if (data.success) {
          setResources((prev) =>
            replace ? data.data.resources : [...prev, ...data.data.resources],
          );
          setHasMore(data.data.hasMore);
        }
      } catch {
        // Network error — keep showing existing state
      } finally {
        setLoading(false);
      }
    },
    [token, category, search],
  );

  useEffect(() => {
    setPage(1);
    void fetchResources(1, true);
  }, [category, search, fetchResources]);

  const handleSaved = (resource: ResourceData) => {
    if (editResource) {
      setResources((prev) =>
        prev.map((r) => (r.id === resource.id ? resource : r)),
      );
    } else {
      setResources((prev) => [resource, ...prev]);
    }
    setEditResource(null);
  };

  const handleDelete = (id: string) => {
    setResources((prev) => prev.filter((r) => r.id !== id));
  };

  const handleEdit = (resource: ResourceData) => {
    setEditResource(resource);
    setWriteModalOpen(true);
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        {/* Header */}
        <div className="bg-white border border-ventsafe-border rounded-ventsafe-md p-5 mb-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-ventsafe-muted rounded-ventsafe-sm flex items-center justify-center">
                <BookOpen size={20} className="text-ventsafe-navy" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-ventsafe-foreground">
                  Resource Hub
                </h1>
                <p className="text-xs text-ventsafe-foreground/50">
                  Curated articles and guides for your wellbeing
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-ventsafe-foreground/40"
                />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search for Resource..."
                  className="pl-9 pr-3 py-2 border border-ventsafe-border rounded-ventsafe-sm text-sm focus:outline-none focus:border-ventsafe-navy w-52"
                />
              </div>
              {isCounsellor && (
                <button
                  onClick={() => {
                    setEditResource(null);
                    setWriteModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 bg-ventsafe-foreground text-ventsafe-primary-foreground rounded-ventsafe-sm text-sm font-medium hover:opacity-90 transition-opacity"
                >
                  <Plus size={14} /> Write Article
                </button>
              )}
            </div>
          </div>

          {/* Category filters */}
          <div className="flex gap-2 mt-4 flex-wrap">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setCategory(cat.value)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-ventsafe-full text-xs font-medium border transition-all ${category === cat.value
                    ? "bg-ventsafe-foreground text-ventsafe-primary-foreground border-ventsafe-foreground"
                    : "bg-white border-ventsafe-border text-ventsafe-foreground/70 hover:border-ventsafe-navy"
                  }`}
              >
                <span>{cat.icon}</span>
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Resources list */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white border border-ventsafe-border rounded-ventsafe-md p-5 animate-pulse"
              >
                <div className="h-5 bg-ventsafe-muted rounded w-2/3 mb-3" />
                <div className="space-y-2">
                  <div className="h-3 bg-ventsafe-muted rounded" />
                  <div className="h-3 bg-ventsafe-muted rounded w-4/5" />
                </div>
              </div>
            ))}
          </div>
        ) : resources.length === 0 ? (
          <div className="bg-white border border-ventsafe-border rounded-ventsafe-md p-10 text-center">
            <BookOpen
              size={32}
              className="mx-auto text-ventsafe-foreground/20 mb-3"
            />
            <p className="text-sm font-semibold text-ventsafe-foreground mb-1">
              No articles yet
            </p>
            <p className="text-xs text-ventsafe-foreground/50">
              {isCounsellor
                ? "Be the first to write a helpful article for students."
                : "Check back soon — counsellors will be sharing resources here."}
            </p>
            {isCounsellor && (
              <button
                onClick={() => setWriteModalOpen(true)}
                className="mt-4 px-5 py-2 bg-ventsafe-foreground text-ventsafe-primary-foreground rounded-ventsafe-tiny font-medium text-sm"
              >
                Write first article
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {resources.map((r) => (
                <ResourceCard
                  key={r.id}
                  resource={r}
                  token={token}
                  viewerUserId={viewerUserId}
                  viewerRole={viewerRole}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </AnimatePresence>
            {hasMore && (
              <button
                onClick={() => {
                  const next = page + 1;
                  setPage(next);
                  void fetchResources(next);
                }}
                className="w-full py-3 text-sm text-ventsafe-foreground/60 border border-ventsafe-border rounded-ventsafe-md hover:border-ventsafe-navy transition-colors"
              >
                Load more
              </button>
            )}
          </div>
        )}
      </div>

      <WriteArticleModal
        isOpen={writeModalOpen}
        onClose={() => {
          setWriteModalOpen(false);
          setEditResource(null);
        }}
        token={token}
        editResource={editResource}
        onSaved={handleSaved}
      />
    </AppLayout>
  );
}
