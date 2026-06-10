"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ThumbsUp,
  MessageCircle,
  Repeat2,
  Send,
  MoreHorizontal,
  Flag,
  Trash2,
  ShieldCheck,
  X,
  GraduationCap,
  Edit3,
  User,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { API_BASE_URL } from "@/config/constants";
import { getInitials } from "@/lib/utils";
import { UserAvatar } from "@/components/shared/UserAvatar";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PostViewData {
  id: string;
  content: string;
  category: string;
  privacy: string;
  intensity_level: number;
  ai_risk_level: string;
  ai_mood: string | null;
  comments_count: number;
  likes_count: number;
  dislikes_count: number;
  reposts_count: number;
  is_flagged: boolean;
  created_at: string;
  author_id: string;
  author_name: string;
  author_role: "student" | "counselor";
  author_tier: "volunteer" | "professional" | null;
  viewer_has_liked: boolean;
  viewer_has_disliked: boolean;
  viewer_has_reposted: boolean;
  reposted_by_name?: string;
  reposted_by_id?: string;
  reposted_at?: string;
  original_author_id?: string;
  original_author_name?: string;
}

export interface CommentData {
  id: string;
  post_id: string;
  parent_id?: string;
  content: string;
  likes_count: number;
  created_at: string;
  author_id: string;
  author_name: string;
  author_role: "student" | "counselor";
  author_tier: "volunteer" | "professional" | null;
  viewer_has_liked: boolean;
}

interface PostCardProps {
  post: PostViewData;
  viewerUserId: string;
  viewerRole: string;
  token: string;
  onDelete?: (id: string) => void;
  onRepost?: (post: PostViewData) => void;
  viewerName?: string;
}

// ─── API response types ───────────────────────────────────────────────────────

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

interface LikeResult {
  reaction: "like" | "dislike" | null;
  likes_count: number;
}

interface RepostResult {
  reposted: boolean;
  reposts_count: number;
}

interface CommentsResult {
  comments: CommentData[];
  total: number;
}

interface CommentLikeResult {
  liked: boolean;
  likes_count: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<string, string> = {
  general: "General",
  academic_pressure: "Academic Pressure",
  financial_stress: "Financial Stress",
  relationships: "Relationships",
  family_issues: "Family Issues",
  health_concerns: "Health Concerns",
  career_anxiety: "Career Anxiety",
  loneliness: "Loneliness",
  counsellor_tip: "Professional Tip",
};

// ─── Permission helpers ───────────────────────────────────────────────────────
// All rules from the flow diagram:
//
// STUDENT:
//   Can comment on: own post, counsellor posts
//   Cannot comment on: other student posts
//
// COUNSELLOR:
//   Can comment on: own post, student posts
//   Cannot comment on: other counsellor posts
//
// Both: like/unlike (toggle), repost, report any post

function canComment(
  viewerRole: string,
  viewerUserId: string,
  authorId: string,
  authorRole: "student" | "counselor",
): boolean {
  // Always can reply to own post
  if (viewerUserId === authorId) return true;

  if (viewerRole === "student") {
    // Students can ONLY comment on counsellor posts
    return authorRole === "counselor";
  }

  if (viewerRole === "counselor") {
    // Counsellors can ONLY comment on student posts (not other counsellors)
    return authorRole === "student";
  }

  return false;
}

// ─── Author badge ─────────────────────────────────────────────────────────────

function AuthorBadge({
  role,
  tier,
}: {
  role: "student" | "counselor";
  tier: "volunteer" | "professional" | null;
}) {
  if (role === "counselor") {
    return (
      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-ventsafe-navy text-white ml-1 shrink-0">
        <ShieldCheck size={9} />
        {tier === "professional" ? "Certified" : "Volunteer"}
      </span>
    );
  }
  // Students get a subtle badge too so counsellors know who they're reading
  return (
    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-ventsafe-muted text-ventsafe-foreground/60 ml-1 shrink-0">
      <GraduationCap size={9} />
      Student
    </span>
  );
}

// ─── API helpers ──────────────────────────────────────────────────────────────

async function apiPost<T>(
  url: string,
  token: string,
  body?: object,
): Promise<ApiResponse<T>> {
  const res = await fetch(`${API_BASE_URL}${url}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return res.json() as Promise<ApiResponse<T>>;
}

async function apiGet<T>(url: string, token: string): Promise<ApiResponse<T>> {
  const res = await fetch(`${API_BASE_URL}${url}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json() as Promise<ApiResponse<T>>;
}

async function apiDelete(
  url: string,
  token: string,
): Promise<ApiResponse<null>> {
  const res = await fetch(`${API_BASE_URL}${url}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json() as Promise<ApiResponse<null>>;
}

// ─── Comment Item ─────────────────────────────────────────────────────────────

function CommentItem({
  comment,
  token,
  viewerUserId,
  onDeleted,
  onReply,
}: {
  comment: CommentData;
  token: string;
  viewerUserId: string;
  onDeleted: (commentId: string) => void;
  onReply: (commentId: string, authorName: string) => void;
}) {
  const [liked, setLiked] = useState(comment.viewer_has_liked);
  const [likeCount, setLikeCount] = useState(comment.likes_count);
  const [isEditing, setIsEditing] = useState(false);
  const [currentContent, setCurrentContent] = useState(comment.content);
  const [editContent, setEditContent] = useState(comment.content);
  const [menuOpen, setMenuOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const isOwn = comment.author_id === viewerUserId;

  const handleLike = async () => {
    const res = await apiPost<CommentLikeResult>(
      `/posts/x/comments/${comment.id}/like`,
      token,
    );
    if (res.success) {
      setLiked(res.data.liked);
      setLikeCount(res.data.likes_count);
    }
  };

  const handleEdit = async () => {
    if (!editContent.trim()) return;
    setSubmitting(true);
    const res = await fetch(
      `${API_BASE_URL}/posts/${comment.post_id}/comments/${comment.id}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: editContent.trim() }),
      },
    ).then((r) => r.json());

    if (res.success) {
      setCurrentContent(editContent.trim());
      setIsEditing(false);
    }
    setSubmitting(false);
  };

  const handleDelete = async () => {
    const res = await apiDelete(
      `/posts/${comment.post_id}/comments/${comment.id}`,
      token,
    );
    if (res.success) {
      onDeleted(comment.id);
    }
  };

  return (
    <div className="flex gap-2.5 py-2.5 border-b border-ventsafe-border/30 last:border-0 relative group">
      <UserAvatar
        name={comment.author_name}
        role={comment.author_role}
        className="w-7 h-7 text-xs"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-1 flex-wrap mb-0.5">
            <span className="text-xs font-semibold text-ventsafe-foreground">
              {comment.author_name}
            </span>
            <AuthorBadge
              role={comment.author_role}
              tier={comment.author_tier}
            />
            <span className="text-[10px] text-ventsafe-foreground/40">
              {formatDistanceToNow(new Date(comment.created_at), {
                addSuffix: true,
              })}
            </span>
          </div>

          {/* Comment 3-dot menu */}
          <div className="relative opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-0.5 text-ventsafe-foreground/40 hover:text-ventsafe-foreground rounded"
            >
              <MoreHorizontal size={13} />
            </button>
            <AnimatePresence>
              {menuOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="absolute right-0 top-full mt-1 w-32 bg-ventsafe-card border border-ventsafe-border rounded-ventsafe-sm shadow-md z-10 overflow-hidden"
                >
                  {isOwn && (
                    <>
                      <button
                        onClick={() => {
                          setIsEditing(true);
                          setMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-ventsafe-foreground hover:bg-ventsafe-muted"
                      >
                        <Edit3 size={12} /> Edit
                      </button>
                      <button
                        onClick={() => {
                          void handleDelete();
                          setMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-red-500 hover:bg-red-50"
                      >
                        <Trash2 size={12} /> Delete
                      </button>
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {isEditing ? (
          <div className="mt-1 flex flex-col gap-1.5">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full border border-ventsafe-border rounded-ventsafe-sm px-2 py-1.5 text-xs focus:outline-none focus:border-ventsafe-navy resize-none min-h-12.5"
            />
            <div className="flex justify-end gap-1.5">
              <button
                disabled={submitting}
                onClick={() => setIsEditing(false)}
                className="px-2 py-1 text-[10px] border border-ventsafe-border rounded transition-colors"
              >
                Cancel
              </button>
              <button
                disabled={submitting || !editContent.trim()}
                onClick={() => void handleEdit()}
                className="px-2 py-1 bg-ventsafe-navy text-white rounded text-[10px] disabled:opacity-50 transition-colors"
              >
                {submitting ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        ) : (
          <p className="text-xs text-ventsafe-foreground/80 leading-relaxed whitespace-pre-wrap">
            {currentContent}
          </p>
        )}

        <div className="flex items-center gap-3 mt-1.5">
          <button
            onClick={() => void handleLike()}
            className={`flex items-center gap-1 text-[10px] font-medium transition-colors ${
              liked
                ? "text-ventsafe-navy"
                : "text-ventsafe-foreground/40 hover:text-ventsafe-navy"
            }`}
          >
            <ThumbsUp size={10} className={liked ? "fill-ventsafe-navy" : ""} />
            {likeCount > 0 && likeCount}
          </button>

          <button
            onClick={() => onReply(comment.id, comment.author_name)}
            className="text-[10px] font-medium text-ventsafe-foreground/40 hover:text-ventsafe-navy transition-colors"
          >
            Reply
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Post type badge ──────────────────────────────────────────────────────────
// Counsellor posts show "Motivation" badge — th_____ey're sharing encouragement/tips.
// Student posts show nothing — they're venting.

function PostTypeBadge({
  authorRole,
  category,
}: {
  authorRole: "student" | "counselor";
  category?: string;
}) {
  if (category === "counsellor_tip") {
    return (
      <span className="text-[11px] font-bold text-amber-600 border border-amber-600 bg-amber-50 rounded-full px-2.5 py-0.5 animate-pulse shadow-sm shadow-amber-100">
        Professional Tip
      </span>
    );
  }
  if (authorRole !== "counselor") return null;
  return (
    <span className="text-[11px] font-semibold text-ventsafe-navy border border-ventsafe-navy rounded-full px-2 py-0.5">
      Motivation
    </span>
  );
}

// ─── Main PostCard ────────────────────────────────────────────────────────────

export function PostCard({
  post: initialPost,
  viewerUserId,
  viewerRole,
  token,
  onDelete,
  onRepost,
  viewerName,
}: PostCardProps) {
  const [post, setPost] = useState<PostViewData>(initialPost);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<CommentData[]>([]);
  const [commentText, setCommentText] = useState("");
  const [loadingComments, setLoadingComments] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [showReportInput, setShowReportInput] = useState(false);
  const [reactingLike, setReactingLike] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(initialPost.content);
  const [submittingEdit, setSubmittingEdit] = useState(false);
  const [replyingTo, setReplyingTo] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const [likers, setLikers] = useState<any[]>([]);
  const [showLikers, setShowLikers] = useState(false);
  const [reposters, setReposters] = useState<any[]>([]);
  const [showReposters, setShowReposters] = useState(false);

  const isOwn = post.author_id === viewerUserId;
  const isRepostCard = post.reposted_by_id === viewerUserId;
  const canDelete = isOwn || isRepostCard;
  const isLong = post.content.length > 300;
  const displayContent =
    isLong && !expanded ? post.content.slice(0, 300) + "..." : post.content;

  // Permission check using the helper above
  const showCommentButton = canComment(
    viewerRole,
    viewerUserId,
    post.author_id,
    post.author_role,
  );

  // ── Like / Unlike (toggle — no separate dislike per flow diagram) ─────────

  const handleLike = async () => {
    if (reactingLike) return;
    setReactingLike(true);

    const wasLiked = post.viewer_has_liked;

    // Optimistic update
    setPost((p) => ({
      ...p,
      viewer_has_liked: !p.viewer_has_liked,
      likes_count: p.viewer_has_liked ? p.likes_count - 1 : p.likes_count + 1,
    }));

    // Per flow diagram: like/unlike = same endpoint with 'like' reaction
    // Backend toggles: if already liked → unlike
    const res = await apiPost<LikeResult>(`/posts/${post.id}/react`, token, {
      reaction: "like",
    });

    if (!res.success) {
      // Rollback
      setPost((p) => ({
        ...p,
        viewer_has_liked: wasLiked,
        likes_count: wasLiked ? p.likes_count + 1 : p.likes_count - 1,
      }));
    } else {
      setPost((p) => ({
        ...p,
        viewer_has_liked: res.data.reaction === "like",
        likes_count: res.data.likes_count,
      }));
    }
    setReactingLike(false);
  };

  // ── Repost / un-repost ────────────────────────────────────────────────────

  const handleRepost = async () => {
    // If THIS card is the user's repost, clicking the repost button means UNDO.
    const isUndoing = post.viewer_has_reposted || isRepostCard;
    if (isUndoing) {
      const confirmUndo = window.confirm("Do you want to undo your repost?");
      if (!confirmUndo) return;
    }

    if (isRepostCard) {
      // Deleting the repost card undoes the repost
      const res = await apiDelete(`/posts/${post.id}`, token);
      if (res.success && onDelete) {
        onDelete(post.id);
      }
      return;
    }

    // Otherwise, toggle repost on the original post
    const res = await apiPost<RepostResult>(`/posts/${post.id}/repost`, token);
    if (res.success) {
      setPost((p) => ({
        ...p,
        viewer_has_reposted: res.data.reposted,
        reposts_count: res.data.reposts_count,
      }));

      // If we just UNDID a repost from the original post card, and this card itself was a direct feed of it 
      // (which shouldn't usually be the case here, but kept for safety)
      if (!res.data.reposted && isUndoing) {
        if (post.reposted_by_id === viewerUserId && onDelete) {
          onDelete(post.id);
        }
      }

      // If they just reposted, notify parent to add to feed
      if (res.data.reposted && onRepost) {
        onRepost({
          ...post,
          viewer_has_reposted: true,
          reposts_count: res.data.reposts_count,
          reposted_by_name: viewerName ?? "You",
          reposted_by_id: viewerUserId,
          reposted_at: new Date().toISOString(),
        });
      }
    }
  };

  // ── Load likers and reposters ─────────────────────────────────────────────

  const handleFetchLikers = async () => {
    if (showLikers) return setShowLikers(false);
    const res = await apiGet<{ likers: any[] }>(
      `/posts/${post.id}/likes`,
      token,
    );
    if (res.success) {
      setLikers(res.data.likers);
      setShowLikers(true);
      setShowReposters(false);
      setShowComments(false);
    }
  };

  const handleFetchReposters = async () => {
    if (showReposters) return setShowReposters(false);
    const res = await apiGet<{ reposters: any[] }>(
      `/posts/${post.id}/reposts`,
      token,
    );
    if (res.success) {
      setReposters(res.data.reposters);
      setShowReposters(true);
      setShowLikers(false);
      setShowComments(false);
    }
  };

  // ── Load comments ─────────────────────────────────────────────────────────

  const handleLoadComments = async () => {
    if (showComments) {
      setShowComments(false);
      return;
    }
    setLoadingComments(true);
    const res = await apiGet<CommentsResult>(
      `/posts/${post.id}/comments`,
      token,
    );
    if (res.success) setComments(res.data.comments);
    setLoadingComments(false);
    setShowComments(true);
    setShowLikers(false);
    setShowReposters(false);
  };

  // ── Submit comment ────────────────────────────────────────────────────────

  const handleSubmitComment = async () => {
    if (!commentText.trim()) return;
    setSubmittingComment(true);
    const res = await apiPost<CommentData>(
      `/posts/${post.id}/comments`,
      token,
      { content: commentText.trim(), parentId: replyingTo?.id },
    );
    if (res.success) {
      setComments((prev) => [...prev, res.data]);
      setCommentText("");
      setReplyingTo(null);
      setPost((p) => ({ ...p, comments_count: p.comments_count + 1 }));
    }
    setSubmittingComment(false);
  };

  // ── Edit Post ─────────────────────────────────────────────────────────────

  const handleEdit = async () => {
    if (!editContent.trim()) return;
    setSubmittingEdit(true);
    // PUT /posts/:id requires an auth payload, backend route expects generic PUT body
    const res = await fetch(`${API_BASE_URL}/posts/${post.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ content: editContent.trim() }),
    }).then((r) => r.json());

    if (res.success) {
      setPost((p) => ({ ...p, content: editContent.trim() }));
      setIsEditing(false);
    }
    setSubmittingEdit(false);
  };

  // ── Delete ────────────────────────────────────────────────────────────────

  const handleDelete = async () => {
    const res = await apiDelete(`/posts/${post.id}`, token);
    if (res.success && onDelete) onDelete(post.id);
    setMenuOpen(false);
  };

  // ── Report ────────────────────────────────────────────────────────────────

  const handleReport = async () => {
    if (!reportReason.trim()) return;
    await apiPost<null>(`/posts/${post.id}/report`, token, {
      reason: reportReason,
    });
    setShowReportInput(false);
    setReportReason("");
    setMenuOpen(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-ventsafe-card border border-ventsafe-border rounded-ventsafe-md overflow-hidden"
    >
      {/* Repost header */}
      {post.reposted_by_name && (
        <div className="flex items-center gap-1.5 px-4 pt-3 pb-2 text-xs text-ventsafe-foreground/60 border-b border-ventsafe-border/30 bg-ventsafe-muted/20">
          <Repeat2 size={13} className="text-ventsafe-navy" />
          <span className="flex items-center gap-1.5">
            <UserAvatar
              name={post.reposted_by_name}
              className="w-4 h-4 text-[8px]"
            />
            <span className="font-semibold text-ventsafe-foreground">
              {post.reposted_by_id === viewerUserId
                ? "You"
                : post.reposted_by_name}
            </span>{" "}
            reposted{" "}
            {post.original_author_name
              ? `${post.original_author_name}'s vent`
              : "this"}
          </span>
        </div>
      )}

      <div className="p-4">
        {/* ── Header ── */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2.5">
            <UserAvatar
              name={post.author_name}
              role={post.author_role}
              className="w-9 h-9 text-sm"
            />
            <div>
              <div className="flex items-center gap-1 flex-wrap">
                <span className="text-sm font-semibold text-ventsafe-foreground">
                  {post.author_name ?? "Anonymous"}
                </span>
                <AuthorBadge
                  role={post.author_role ?? "student"}
                  tier={post.author_tier}
                />
              </div>
              <span className="text-[11px] text-ventsafe-foreground/40">
                {formatDistanceToNow(new Date(post.created_at), {
                  addSuffix: true,
                })}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Post type badge: "Motivation" for counsellors, nothing for students */}
            <PostTypeBadge authorRole={post.author_role} category={post.category} />

            {/* Three-dot menu */}
            <div className="relative">
              <button
                onClick={() => setMenuOpen((o) => !o)}
                className="p-1 hover:bg-ventsafe-muted rounded transition-colors"
              >
                <MoreHorizontal
                  size={16}
                  className="text-ventsafe-foreground/40"
                />
              </button>
              <AnimatePresence>
                {menuOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -4 }}
                    transition={{ duration: 0.1 }}
                    className="absolute right-0 top-full mt-1 w-44 bg-ventsafe-card border border-ventsafe-border rounded-ventsafe-sm shadow-md z-10 overflow-hidden"
                  >
                    {canDelete ? (
                      <>
                        {isOwn && !post.reposted_by_id && (
                          <button
                            onClick={() => {
                              setIsEditing(true);
                              setMenuOpen(false);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-ventsafe-foreground hover:bg-ventsafe-muted"
                          >
                            <Edit3 size={13} /> Edit post
                          </button>
                        )}

                        <button
                          onClick={() => void handleDelete()}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50"
                        >
                          <Trash2 size={13} /> Delete post
                        </button>
                      </>
                    ) : (
                      // Both students and counsellors can report any post
                      <button
                        onClick={() => {
                          setShowReportInput(true);
                          setMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-ventsafe-foreground hover:bg-ventsafe-muted"
                      >
                        <Flag size={13} /> Report post
                      </button>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Dismiss (X) for non-own posts */}
            {!isOwn && (
              <button
                onClick={() => setMenuOpen(false)}
                className="p-1 hover:bg-ventsafe-muted rounded transition-colors"
              >
                <X size={13} className="text-ventsafe-foreground/30" />
              </button>
            )}
          </div>
        </div>

        {/* ── Content ────────────────────────────────────────────────────────── */}
        <div
          className={`mb-3 ${
            post.author_role === "counselor"
              ? "bg-ventsafe-muted/40 rounded-ventsafe-sm px-3 py-2.5 border-l-2 border-ventsafe-navy"
              : ""
          }`}
        >
          {isEditing ? (
            <div className="flex flex-col gap-2">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full border border-ventsafe-border rounded-ventsafe-sm px-3 py-2 text-xs focus:outline-none focus:border-ventsafe-navy resize-none min-h-20"
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1.5 border border-ventsafe-border rounded-ventsafe-sm text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => void handleEdit()}
                  disabled={submittingEdit || !editContent.trim()}
                  className="px-3 py-1.5 bg-ventsafe-navy text-white rounded-ventsafe-sm text-xs disabled:opacity-50 transition-colors"
                >
                  {submittingEdit ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          ) : (
            <>
              <p className="text-sm text-ventsafe-foreground leading-relaxed whitespace-pre-line">
                {displayContent}
              </p>
              {isLong && (
                <button
                  onClick={() => setExpanded((e) => !e)}
                  className="text-xs text-ventsafe-navy font-medium mt-1.5 hover:underline"
                >
                  {expanded ? "Show less" : "...more"}
                </button>
              )}
            </>
          )}
        </div>

        {/* ── Category tag ── */}
        <div className="mb-3">
          <span className="text-[11px] text-ventsafe-foreground/50 bg-ventsafe-muted px-2 py-0.5 rounded-full">
            {CATEGORY_LABELS[post.category] ?? post.category}
          </span>
        </div>

        {/* ── Counts ── */}
        <div className="flex items-center gap-3 text-xs text-ventsafe-foreground/50 mb-3 select-none">
          {post.likes_count > 0 && (
            <button
              onClick={() => void handleFetchLikers()}
              className="hover:text-ventsafe-foreground transition-colors hover:underline"
            >
              {post.likes_count} like{post.likes_count !== 1 ? "s" : ""}
            </button>
          )}
          {post.comments_count > 0 && (
            <span>
              {post.comments_count} comment
              {post.comments_count !== 1 ? "s" : ""}
            </span>
          )}
          {post.reposts_count > 0 && (
            <button
              onClick={() => void handleFetchReposters()}
              className="hover:text-ventsafe-foreground transition-colors hover:underline"
            >
              {post.reposts_count} repost
              {post.reposts_count !== 1 ? "s" : ""}
            </button>
          )}
        </div>

        {/* ── Action bar ─────────────────────────────────────────────────────
            Permissions per flow diagram:
            LIKE/UNLIKE  → everyone (toggle via single button)
            COMMENT      → only when canComment() is true (see helper above)
            REPOST       → everyone
            SEND         → everyone
            DISLIKE      → REMOVED (not in flow diagram)
        ── */}
        <div className="flex items-center gap-1 pt-2 border-t border-ventsafe-border/30">
          {/* Like / Unlike toggle */}
          <button
            onClick={() => void handleLike()}
            disabled={reactingLike}
            className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-ventsafe-sm transition-colors flex-1 justify-center ${
              post.viewer_has_liked
                ? "text-ventsafe-navy bg-ventsafe-muted"
                : "text-ventsafe-foreground/60 hover:bg-ventsafe-muted"
            }`}
          >
            <ThumbsUp
              size={14}
              className={post.viewer_has_liked ? "fill-ventsafe-navy" : ""}
            />
            {post.viewer_has_liked ? "Liked" : "Like"}
          </button>

          {/* Comment — only shown when permission allows */}
          {showCommentButton && (
            <button
              onClick={() => void handleLoadComments()}
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-ventsafe-sm text-ventsafe-foreground/60 hover:bg-ventsafe-muted transition-colors flex-1 justify-center"
            >
              <MessageCircle size={14} />
              Comment
            </button>
          )}

          {/* Repost — everyone */}
          <button
            onClick={() => void handleRepost()}
            className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-ventsafe-sm transition-colors flex-1 justify-center ${
              post.viewer_has_reposted
                ? "text-green-600 bg-green-50"
                : "text-ventsafe-foreground/60 hover:bg-ventsafe-muted"
            }`}
          >
            <Repeat2 size={14} />
            {post.viewer_has_reposted ? "Reposted" : "Repost"}
          </button>

          {/* Send — everyone */}
          <button className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-ventsafe-sm text-ventsafe-foreground/60 hover:bg-ventsafe-muted transition-colors flex-1 justify-center">
            <Send size={14} />
            Send
          </button>
        </div>

        {/* ── Report input ── */}
        <AnimatePresence>
          {showReportInput && (
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
                  placeholder="Why are you reporting this post?"
                  className="w-full border border-ventsafe-border rounded-ventsafe-sm px-3 py-2 text-xs focus:outline-none focus:border-ventsafe-navy"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => void handleReport()}
                    disabled={!reportReason.trim()}
                    className="px-3 py-1.5 bg-red-500 text-white rounded-ventsafe-sm text-xs font-medium disabled:opacity-40"
                  >
                    Submit report
                  </button>
                  <button
                    onClick={() => setShowReportInput(false)}
                    className="px-3 py-1.5 border border-ventsafe-border rounded-ventsafe-sm text-xs"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Comments section ── */}
        <AnimatePresence>
          {showComments && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="pt-3 border-t border-ventsafe-border/30 mt-3">
                {loadingComments ? (
                  <p className="text-xs text-ventsafe-foreground/40 py-2">
                    Loading comments...
                  </p>
                ) : comments.length === 0 ? (
                  <p className="text-xs text-ventsafe-foreground/40 py-2">
                    No comments yet.
                    {showCommentButton ? " Be the first." : ""}
                  </p>
                ) : (
                  <div>
                    {comments
                      .filter((c) => !c.parent_id)
                      .map((parent) => (
                        <div key={parent.id}>
                          <CommentItem
                            comment={parent}
                            token={token}
                            viewerUserId={viewerUserId}
                            onDeleted={(commentId) => {
                              setComments((prev) =>
                                prev.filter((x) => x.id !== commentId),
                              );
                              setPost((p) => ({
                                ...p,
                                comments_count: Math.max(
                                  0,
                                  p.comments_count - 1,
                                ),
                              }));
                            }}
                            onReply={(commentId, authorName) =>
                              setReplyingTo({ id: commentId, name: authorName })
                            }
                          />
                          {/* Nested replies */}
                          {comments
                            .filter((c) => c.parent_id === parent.id)
                            .map((reply) => (
                              <div
                                key={reply.id}
                                className="ml-9 border-l-2 border-ventsafe-border/30 pl-3"
                              >
                                <CommentItem
                                  comment={reply}
                                  token={token}
                                  viewerUserId={viewerUserId}
                                  onDeleted={(commentId) => {
                                    setComments((prev) =>
                                      prev.filter((x) => x.id !== commentId),
                                    );
                                    setPost((p) => ({
                                      ...p,
                                      comments_count: Math.max(
                                        0,
                                        p.comments_count - 1,
                                      ),
                                    }));
                                  }}
                                  onReply={(commentId, authorName) =>
                                    setReplyingTo({
                                      id: commentId,
                                      name: authorName,
                                    })
                                  }
                                />
                              </div>
                            ))}
                        </div>
                      ))}
                  </div>
                )}

                {/* Comment input — only shown when permission allows */}
                {showCommentButton && (
                  <div className="flex flex-col gap-2 mt-3">
                    {replyingTo && (
                      <div className="flex items-center justify-between bg-ventsafe-muted/40 px-3 py-1.5 rounded-ventsafe-sm border border-ventsafe-border/50">
                        <span className="text-[10px] text-ventsafe-foreground/60">
                          Replying to{" "}
                          <span className="font-semibold">
                            {replyingTo.name}
                          </span>
                        </span>
                        <button
                          onClick={() => setReplyingTo(null)}
                          className="text-ventsafe-foreground/40 hover:text-ventsafe-foreground transition-colors"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <input
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            void handleSubmitComment();
                          }
                        }}
                        placeholder={
                          replyingTo
                            ? "Write a reply..."
                            : viewerRole === "counselor"
                              ? "Write a reply to support this student..."
                              : "Write a comment..."
                        }
                        className="flex-1 border border-ventsafe-border rounded-ventsafe-full px-3 py-1.5 text-xs focus:outline-none focus:border-ventsafe-navy"
                      />
                      <button
                        onClick={() => void handleSubmitComment()}
                        disabled={!commentText.trim() || submittingComment}
                        className="px-3 py-1.5 bg-ventsafe-foreground text-ventsafe-background rounded-ventsafe-full text-xs font-medium disabled:opacity-40 hover:opacity-90 transition-opacity"
                      >
                        {replyingTo ? "Reply" : "Post"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Likers List ── */}
        <AnimatePresence>
          {showLikers && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="pt-3 border-t border-ventsafe-border/30 mt-3 space-y-2">
                <div className="flex items-center justify-between pb-1">
                  <h4 className="text-xs font-semibold text-ventsafe-foreground">
                    Liked by
                  </h4>
                  <button
                    onClick={() => setShowLikers(false)}
                    className="text-ventsafe-foreground/40 hover:text-ventsafe-foreground"
                  >
                    <X size={12} />
                  </button>
                </div>
                {likers.map((u, i) => (
                  <div key={i} className="flex items-center gap-2 py-1.5">
                    <UserAvatar
                      name={u.anonymous_name}
                      role={u.role}
                      className="w-6 h-6 text-[10px]"
                    />
                    <span className="text-xs font-medium">
                      {u.anonymous_name}
                    </span>
                    <AuthorBadge role={u.role} tier={u.tier} />
                  </div>
                ))}
                {likers.length === 0 && (
                  <p className="text-xs text-ventsafe-foreground/50 py-2">
                    No one has liked this yet.
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Reposters List ── */}
        <AnimatePresence>
          {showReposters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="pt-3 border-t border-ventsafe-border/30 mt-3 space-y-2">
                <div className="flex items-center justify-between pb-1">
                  <h4 className="text-xs font-semibold text-ventsafe-foreground">
                    Reposted by
                  </h4>
                  <button
                    onClick={() => setShowReposters(false)}
                    className="text-ventsafe-foreground/40 hover:text-ventsafe-foreground"
                  >
                    <X size={12} />
                  </button>
                </div>
                {reposters.map((u, i) => (
                  <div key={i} className="flex items-center gap-2 py-1.5">
                    <UserAvatar
                      name={u.anonymous_name}
                      role={u.role}
                      className="w-6 h-6 text-[10px]"
                    />
                    <span className="text-xs font-medium">
                      {u.anonymous_name}
                    </span>
                    <AuthorBadge role={u.role} tier={u.tier} />
                  </div>
                ))}
                {reposters.length === 0 && (
                  <p className="text-xs text-ventsafe-foreground/50 py-2">
                    No one has reposted this yet.
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
