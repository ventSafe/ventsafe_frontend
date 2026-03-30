"use client"

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ThumbsUp,
  ThumbsDown,
  MessageCircle,
  Repeat2,
  Send,
  MoreHorizontal,
  Flag,
  Trash2,
  ShieldCheck,
  X,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { API_BASE_URL } from "@/config/constants";

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
  likes_count: number; // total likes on this post
  dislikes_count: number; // total dislikes on this post
  reposts_count: number;
  is_flagged: boolean;
  created_at: string;
  author_id: string;
  author_name: string;
  author_role: "student" | "counselor";
  author_tier: "volunteer" | "professional" | null;
  viewer_has_liked: boolean; // has the viewing user liked this post?
  viewer_has_disliked: boolean; // has the viewing user disliked this post?
  viewer_has_reposted: boolean;
  reposted_by_name?: string;
  reposted_by_id?: string;
  reposted_at?: string;
}

interface CommentData {
  id: string;
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
};

// ─── Author badge (Certified / Volunteer) ────────────────────────────────────
// Shown next to the author's name on every post card.
// Students have no badge. Counsellors show tier badge.

function AuthorBadge({
  role,
  tier,
}: {
  role: "student" | "counselor";
  tier: "volunteer" | "professional" | null;
}) {
  if (role !== "counselor") return null;
  return (
    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-ventsafe-navy text-white ml-1 shrink-0">
      <ShieldCheck size={9} />
      {tier === "professional" ? "Certified" : "Volunteer"}
    </span>
  );
}

// ─── API helpers ──────────────────────────────────────────────────────────────

async function apiPost(url: string, token: string, body?: object) {
  const res = await fetch(`${API_BASE_URL}${url}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return res.json() as Promise<{
    success: boolean;
    data: Record<string, unknown>;
    error?: string;
  }>;
}

async function apiGet(url: string, token: string) {
  const res = await fetch(`${API_BASE_URL}${url}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json() as Promise<{
    success: boolean;
    data: Record<string, unknown>;
  }>;
}

async function apiDelete(url: string, token: string) {
  const res = await fetch(`${API_BASE_URL}${url}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json() as Promise<{ success: boolean }>;
}

// ─── Comment Item ─────────────────────────────────────────────────────────────

function CommentItem({
  comment,
  token,
}: {
  comment: CommentData;
  token: string;
}) {
  const [liked, setLiked] = useState(comment.viewer_has_liked);
  const [likeCount, setLikeCount] = useState(comment.likes_count);

  const handleLike = async () => {
    const res = await apiPost(`/posts/x/comments/${comment.id}/like`, token);
    if (res.success) {
      const d = res.data as { liked: boolean; likes_count: number };
      setLiked(d.liked);
      setLikeCount(d.likes_count);
    }
  };

  return (
    <div className="flex gap-2.5 py-2.5 border-b border-ventsafe-border/30 last:border-0">
      <div className="w-7 h-7 rounded-full bg-ventsafe-muted text-ventsafe-foreground flex items-center justify-center text-xs font-bold shrink-0">
        {comment.author_name.charAt(0)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1 flex-wrap">
          <span className="text-xs font-semibold text-ventsafe-foreground">
            {comment.author_name}
          </span>
          <AuthorBadge role={comment.author_role} tier={comment.author_tier} />
          <span className="text-[10px] text-ventsafe-foreground/40">
            {formatDistanceToNow(new Date(comment.created_at), {
              addSuffix: true,
            })}
          </span>
        </div>
        <p className="text-xs text-ventsafe-foreground/80 mt-0.5 leading-relaxed">
          {comment.content}
        </p>
        <button
          onClick={handleLike}
          className={`flex items-center gap-1 mt-1 text-[10px] font-medium transition-colors ${
            liked
              ? "text-ventsafe-navy"
              : "text-ventsafe-foreground/40 hover:text-ventsafe-navy"
          }`}
        >
          <ThumbsUp size={10} className={liked ? "fill-ventsafe-navy" : ""} />
          {likeCount > 0 && likeCount}
        </button>
      </div>
    </div>
  );
}

// ─── Main PostCard ────────────────────────────────────────────────────────────

export function PostCard({
  post: initialPost,
  viewerUserId,
  viewerRole,
  token,
  onDelete,
}: PostCardProps) {
  const [post, setPost] = useState(initialPost);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<CommentData[]>([]);
  const [commentText, setCommentText] = useState("");
  const [loadingComments, setLoadingComments] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [showReportInput, setShowReportInput] = useState(false);
  const [reactingPost, setReactingPost] = useState(false);

  const isOwn = post.author_id === viewerUserId;
  const isLong = post.content.length > 300;
  const displayContent =
    isLong && !expanded ? post.content.slice(0, 300) + "..." : post.content;

  // Students can only comment on counsellor posts (not other student posts)
  // or on their own posts.
  const canComment =
    isOwn || viewerRole === "counselor" || post.author_role === "counselor";

  // ── React to post (like / dislike / toggle off) ────────────────────────────

  const handleReact = async (reaction: "like" | "dislike") => {
    if (reactingPost) return;
    setReactingPost(true);

    // Optimistic update before API call
    const prev = {
      viewer_has_liked: post.viewer_has_liked,
      viewer_has_disliked: post.viewer_has_disliked,
      likes_count: post.likes_count,
      dislikes_count: post.dislikes_count,
    };

    setPost((p) => {
      const toggling =
        reaction === "like" ? p.viewer_has_liked : p.viewer_has_disliked;
      if (reaction === "like") {
        return {
          ...p,
          viewer_has_liked: !p.viewer_has_liked,
          viewer_has_disliked: false,
          likes_count: p.viewer_has_liked
            ? p.likes_count - 1
            : p.likes_count + 1,
          dislikes_count: p.viewer_has_disliked
            ? p.dislikes_count - 1
            : p.dislikes_count,
        };
      } else {
        return {
          ...p,
          viewer_has_disliked: !p.viewer_has_disliked,
          viewer_has_liked: false,
          dislikes_count: p.viewer_has_disliked
            ? p.dislikes_count - 1
            : p.dislikes_count + 1,
          likes_count: p.viewer_has_liked ? p.likes_count - 1 : p.likes_count,
        };
      }
    });

    const res = await apiPost(`/posts/${post.id}/react`, token, { reaction });
    if (!res.success) {
      // Rollback
      setPost((p) => ({ ...p, ...prev }));
    } else {
      const d = res.data as {
        reaction: "like" | "dislike" | null;
        likes_count: number;
        dislikes_count: number;
      };
      setPost((p) => ({
        ...p,
        viewer_has_liked: d.reaction === "like",
        viewer_has_disliked: d.reaction === "dislike",
        likes_count: d.likes_count,
        dislikes_count: d.dislikes_count,
      }));
    }
    setReactingPost(false);
  };

  // ── Repost / un-repost ────────────────────────────────────────────────────

  const handleRepost = async () => {
    const res = await apiPost(`/posts/${post.id}/repost`, token);
    if (res.success) {
      const d = res.data as { reposted: boolean; reposts_count: number };
      setPost((p) => ({
        ...p,
        viewer_has_reposted: d.reposted,
        reposts_count: d.reposts_count,
      }));
    }
  };

  // ── Comments ──────────────────────────────────────────────────────────────

  const handleLoadComments = async () => {
    if (showComments) {
      setShowComments(false);
      return;
    }
    setLoadingComments(true);
    const res = await apiGet(`/posts/${post.id}/comments`, token);
    if (res.success) {
      setComments((res.data as { comments: CommentData[] }).comments);
    }
    setLoadingComments(false);
    setShowComments(true);
  };

  const handleSubmitComment = async () => {
    if (!commentText.trim()) return;
    setSubmittingComment(true);
    const res = await apiPost(`/posts/${post.id}/comments`, token, {
      content: commentText.trim(),
    });
    if (res.success) {
      setComments((prev) => [...prev, res.data as CommentData]);
      setCommentText("");
      setPost((p) => ({ ...p, comments_count: p.comments_count + 1 }));
    }
    setSubmittingComment(false);
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
    await apiPost(`/posts/${post.id}/report`, token, {
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
      className="bg-white border border-ventsafe-border rounded-ventsafe-md overflow-hidden"
    >
      {/* Repost header — shown when this post appears in feed as a repost */}
      {post.reposted_by_name && (
        <div className="flex items-center gap-1.5 px-4 pt-3 text-xs text-ventsafe-foreground/50">
          <Repeat2 size={12} />
          <span>
            <span className="font-semibold">{post.reposted_by_name}</span>{" "}
            reposted this
          </span>
        </div>
      )}

      <div className="p-4">
        {/* ── Post header ── */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2.5">
            {/* Avatar */}
            <div className="w-9 h-9 rounded-full bg-ventsafe-foreground text-ventsafe-primary-foreground flex items-center justify-center text-sm font-bold shrink-0">
              {post.author_name.charAt(0)}
            </div>
            {/* Name + badge + time */}
            <div>
              <div className="flex items-center gap-1 flex-wrap">
                <span className="text-sm font-semibold text-ventsafe-foreground">
                  {post.author_name}
                </span>
                {/* Verified badge — ONLY shown for counsellors */}
                <AuthorBadge role={post.author_role} tier={post.author_tier} />
              </div>
              <span className="text-[11px] text-ventsafe-foreground/40">
                {formatDistanceToNow(new Date(post.created_at), {
                  addSuffix: true,
                })}
              </span>
            </div>
          </div>

          {/* Right side: Vent type badge + menu + dismiss */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* "Vent" badge — this is a POST TYPE label, NOT a follow button.
                Per the design screenshot: it appears top-right of counsellor posts.
                It identifies the content as a "Vent" (vs an Article on Resources).
                Follow button is only on the counsellor avatar strip below the mood slider. */}
            {post.author_role === "counselor" && (
              <span className="text-[11px] font-semibold text-ventsafe-navy border border-ventsafe-navy rounded-full px-2 py-0.5">
                Vent
              </span>
            )}

            {/* Three-dot menu */}
            <div className="relative">
              <button
                type="button"
                title="Post options"
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
                    className="absolute right-0 top-full mt-1 w-40 bg-white border border-ventsafe-border rounded-ventsafe-sm shadow-md z-10 overflow-hidden"
                  >
                    {isOwn ? (
                      <button
                        onClick={handleDelete}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50"
                      >
                        <Trash2 size={13} /> Delete post
                      </button>
                    ) : (
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

            {/* Dismiss (X) — visible for non-own posts */}
            {!isOwn && (
              <button
                title="Close"
                type="button"
                className="p-1 hover:bg-ventsafe-muted rounded transition-colors"
              >
                <X size={13} className="text-ventsafe-foreground/30" />
              </button>
            )}
          </div>
        </div>

        {/* ── Content ── */}
        <div className="mb-3">
          <p className="text-sm text-ventsafe-foreground leading-relaxed whitespace-pre-line">
            {displayContent}
          </p>
          {isLong && (
            <button
              onClick={() => setExpanded((e) => !e)}
              className="text-xs text-ventsafe-navy font-medium mt-1 hover:underline"
            >
              {expanded ? "Show less" : "...more"}
            </button>
          )}
        </div>

        {/* ── Category tag ── */}
        <div className="mb-3">
          <span className="text-[11px] text-ventsafe-foreground/50 bg-ventsafe-muted px-2 py-0.5 rounded-full">
            {CATEGORY_LABELS[post.category] ?? post.category}
          </span>
        </div>

        {/* ── Counts ── */}
        <div className="flex items-center gap-3 text-xs text-ventsafe-foreground/50 mb-3">
          {post.likes_count > 0 && (
            <span>
              {post.likes_count} like{post.likes_count !== 1 ? "s" : ""}
            </span>
          )}
          {post.comments_count > 0 && (
            <span>
              {post.comments_count} comment
              {post.comments_count !== 1 ? "s" : ""}
            </span>
          )}
          {post.reposts_count > 0 && (
            <span>
              {post.reposts_count} repost{post.reposts_count !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {/* ── Action bar ── */}
        <div className="flex items-center justify-between pt-2 border-t border-ventsafe-border/30">
          {/* Like button — active = navy, clicking again = unlike */}
          <button
            onClick={() => handleReact("like")}
            disabled={reactingPost}
            className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-ventsafe-sm transition-colors ${
              post.viewer_has_liked
                ? "text-ventsafe-navy bg-ventsafe-muted"
                : "text-ventsafe-foreground/60 hover:bg-ventsafe-muted"
            }`}
          >
            <ThumbsUp
              size={14}
              className={post.viewer_has_liked ? "fill-ventsafe-navy" : ""}
            />
            Like
          </button>

          {/* Comment button — only shown if user can comment */}
          {canComment && (
            <button
              onClick={handleLoadComments}
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-ventsafe-sm text-ventsafe-foreground/60 hover:bg-ventsafe-muted transition-colors"
            >
              <MessageCircle size={14} />
              Comment
            </button>
          )}

          {/* Repost button — active = green, clicking again = un-repost */}
          <button
            onClick={handleRepost}
            className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-ventsafe-sm transition-colors ${
              post.viewer_has_reposted
                ? "text-green-600 bg-green-50"
                : "text-ventsafe-foreground/60 hover:bg-ventsafe-muted"
            }`}
          >
            <Repeat2 size={14} />
            Repost
          </button>

          {/* Send button */}
          <button className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-ventsafe-sm text-ventsafe-foreground/60 hover:bg-ventsafe-muted transition-colors">
            <Send size={14} />
            Send
          </button>

          {/* Dislike button — shown on far right, styled subtly */}
          <button
            onClick={() => handleReact("dislike")}
            disabled={reactingPost}
            className={`flex items-center gap-1 text-xs font-medium px-2 py-1.5 rounded-ventsafe-sm transition-colors ${
              post.viewer_has_disliked
                ? "text-red-500 bg-red-50"
                : "text-ventsafe-foreground/30 hover:bg-ventsafe-muted hover:text-ventsafe-foreground/60"
            }`}
          >
            <ThumbsDown
              size={13}
              className={post.viewer_has_disliked ? "fill-red-500" : ""}
            />
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
                    onClick={handleReport}
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
                    {canComment ? " Be the first." : ""}
                  </p>
                ) : (
                  <div>
                    {comments.map((c) => (
                      <CommentItem key={c.id} comment={c} token={token} />
                    ))}
                  </div>
                )}

                {/* Comment input — only shown to users who can comment */}
                {canComment && (
                  <div className="flex gap-2 mt-3">
                    <input
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSubmitComment();
                        }
                      }}
                      placeholder="Write a comment..."
                      className="flex-1 border border-ventsafe-border rounded-ventsafe-full px-3 py-1.5 text-xs focus:outline-none focus:border-ventsafe-navy"
                    />
                    <button
                      onClick={handleSubmitComment}
                      disabled={!commentText.trim() || submittingComment}
                      className="px-3 py-1.5 bg-ventsafe-foreground text-ventsafe-primary-foreground rounded-ventsafe-full text-xs font-medium disabled:opacity-40 hover:opacity-90"
                    >
                      Post
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
