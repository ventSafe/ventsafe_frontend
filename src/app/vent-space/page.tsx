"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PostCard, type PostViewData } from "@/components/shared/PostCard";
import { CreateVentModal } from "@/components/shared/CreateVentModal";
import { MoodSection } from "@/components/shared/MoodSection";
import { AvailableUsers } from "@/components/shared/AvailableUsers";
import { useAuth } from "@/hooks/useAuth";
import { API_BASE_URL } from "@/config/constants";

// ─── Types ────────────────────────────────────────────────────────────────────

interface QuickResource {
  id: string;
  title: string;
  category: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<string, string> = {
  anxiety: "Anxiety", depression: "Depression", academic: "Academic",
  financial: "Financial", relationships: "Relationships", family: "Family",
  health: "Health", crisis: "Crisis", general: "General",
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function VentSpacePage() {
  const { user, token, anonymousName } = useAuth();
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);


  const [posts, setPosts] = useState<PostViewData[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [quickResources, setQuickResources] = useState<QuickResource[]>([]);
  const loaderRef = useRef<HTMLDivElement>(null);

  const viewerUserId = user?.id ?? "";
  const viewerRole = user?.role ?? "student";
  const isCounsellor = viewerRole === "counselor";

  // ── Fetch feed ──────────────────────────────────────────────────────────────

  const fetchPosts = useCallback(
    async (pageNum: number, replace = false) => {
      if (!token) return;
      if (pageNum === 1) setLoading(true);
      else setLoadingMore(true);

      try {
        const res = await fetch(
          `${API_BASE_URL}/posts?page=${pageNum}&limit=20`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        const data = (await res.json()) as {
          success: boolean;
          data: { posts: PostViewData[]; hasMore: boolean };
        };
        if (data.success) {
          setPosts((prev) =>
            replace ? data.data.posts : [...prev, ...data.data.posts],
          );
          setHasMore(data.data.hasMore);
        }
      } catch {
        // Network error — show empty state
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [token],
  );

  useEffect(() => { void fetchPosts(1, true); }, [fetchPosts]);

  // ── Fetch quick resources ────────────────────────────────────────────────────

  useEffect(() => {
    if (!token) return;
    fetch(`${API_BASE_URL}/resources?limit=3`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then(
        (data: {
          success: boolean;
          data: { resources: QuickResource[] };
        }) => {
          if (data.success) setQuickResources(data.data.resources.slice(0, 3));
        },
      )
      .catch(() => { });
  }, [token]);

  // ── Infinite scroll ─────────────────────────────────────────────────────────

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          const nextPage = page + 1;
          setPage(nextPage);
          void fetchPosts(nextPage);
        }
      },
      { threshold: 0.5 },
    );
    const el = loaderRef.current;
    if (el) observer.observe(el);
    return () => { if (el) observer.unobserve(el); };
  }, [hasMore, loadingMore, loading, page, fetchPosts]);

  // ── Handlers ─────────────────────────────────────────────────────────────────

  const handlePosted = (newPost: PostViewData) => {
    setPosts((prev) => [newPost, ...prev]);
  };

  const handleDelete = (id: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== id));
  };

  const handleRepost = (repost: PostViewData) => {
    setPosts((prev) => [repost, ...prev]);
  };

  // ── Composer copy (Point 3 & 6) ─────────────────────────────────────────────
  // Students → "Start a vent"
  // Counsellors → "Motivate a student"
  const composerPlaceholder = isCounsellor
    ? "Motivate a student"
    : "Start a vent";

  const composerSubTexts = isCounsellor
    ? [
      "Share words of encouragement.",
      "Post a resource or tip.",
      "Reach out to the community.",
    ]
    : [
      "How are you feeling today?",
      "Tell your recovery story.",
      "Express yourself. No Judgment here.",
    ];

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">

          {/* ── LEFT COLUMN ──────────────────────────────────────────────── */}
          <div className="space-y-4">

            {/* ── Composer (Point 6) ── */}
            <div className="bg-white border border-ventsafe-border rounded-ventsafe-md p-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-ventsafe-foreground text-ventsafe-primary-foreground flex items-center justify-center text-sm font-bold shrink-0">
                  {hasMounted ? anonymousName.charAt(0) : ""}
                </div>
                <button
                  onClick={() => setModalOpen(true)}
                  className="flex-1 text-left px-4 py-2.5 bg-ventsafe-muted rounded-ventsafe-full text-sm text-ventsafe-foreground/40 hover:bg-ventsafe-border/30 transition-colors"
                >
                  {composerPlaceholder}
                </button>
              </div>
              <div className="flex items-center gap-4 mt-2 ml-12">
                {composerSubTexts.map((t) => (
                  <span key={t} className="text-[11px] text-ventsafe-foreground/40">
                    {t}
                  </span>
                ))}
              </div>
            </div>

        
            <MoodSection token={token} viewerRole={viewerRole} />

            {/* ── Available Users (Point 2) ──
                Students: see available counsellors + follow button
                Counsellors: see active students + chat button (no follow)
            ── */}
            <div className="bg-white border border-ventsafe-border rounded-ventsafe-md p-4">
              <AvailableUsers token={token} viewerRole={viewerRole} />
            </div>

            {/* ── Feed ── */}
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white border border-ventsafe-border rounded-ventsafe-md p-4 animate-pulse">
                    <div className="flex gap-3 mb-3">
                      <div className="w-9 h-9 rounded-full bg-ventsafe-muted" />
                      <div className="space-y-1.5 flex-1">
                        <div className="h-3 bg-ventsafe-muted rounded w-24" />
                        <div className="h-2.5 bg-ventsafe-muted rounded w-16" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-3 bg-ventsafe-muted rounded" />
                      <div className="h-3 bg-ventsafe-muted rounded w-4/5" />
                      <div className="h-3 bg-ventsafe-muted rounded w-3/5" />
                    </div>
                  </div>
                ))}
              </div>
            ) : posts.length === 0 ? (
              /* ── Point 3: Role-aware empty state ── */
              <div className="bg-white border border-ventsafe-border rounded-ventsafe-md p-8 text-center space-y-3">
                <div className="text-4xl">{isCounsellor ? "🌱" : "💬"}</div>
                <p className="text-base font-semibold text-ventsafe-foreground">
                  {isCounsellor ? "No post yet" : "Nothing here yet"}
                </p>
                <p className="text-sm text-ventsafe-foreground/50 leading-relaxed max-w-xs mx-auto">
                  {isCounsellor
                    ? "Be the first to motivate a student. Your words could make all the difference."
                    : "You haven't posted anything yet, and none of the counsellors you follow have posted either."}
                </p>
                <div className="flex gap-3 justify-center pt-1">
                  {/* Point 3: CTA text changes per role */}
                  <button
                    onClick={() => setModalOpen(true)}
                    className="px-5 py-2 bg-ventsafe-foreground text-ventsafe-primary-foreground rounded-ventsafe-tiny font-medium text-sm hover:opacity-90 transition-opacity"
                  >
                    {isCounsellor ? "Motivate a student" : "Start a vent"}
                  </button>
                  {!isCounsellor && (
                    <Link
                      href="/available-counsellors"
                      className="px-5 py-2 border border-ventsafe-border text-ventsafe-foreground rounded-ventsafe-tiny font-medium text-sm hover:border-ventsafe-navy transition-colors"
                    >
                      Follow a counsellor
                    </Link>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <AnimatePresence initial={false}>
                  {posts.map((post) => (
                    <PostCard
                      key={`${post.id}-${post.reposted_by_id ?? "direct"}`}
                      post={post}
                      viewerUserId={viewerUserId}
                      viewerRole={viewerRole}
                      token={token}
                      onDelete={handleDelete}
                      onRepost={handleRepost}
                      viewerName={anonymousName}
                    />
                  ))}
                </AnimatePresence>

                <div ref={loaderRef} className="py-2">
                  {loadingMore && (
                    <div className="flex justify-center py-4">
                      <div className="spinner" />
                    </div>
                  )}
                  {!hasMore && posts.length > 0 && (
                    <p className="text-center text-xs text-ventsafe-foreground/30 py-4">
                      You&apos;ve reached the end
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ── RIGHT COLUMN ─────────────────────────────────────────────── */}
          <div className="hidden lg:block space-y-4">

            {/* ── Quick Resources (Point 4) ── */}
            <div className="bg-white border border-ventsafe-border rounded-ventsafe-md p-4">
              <h3 className="text-sm font-bold text-ventsafe-foreground mb-3">
                Quick Resources
              </h3>
              {quickResources.length === 0 ? (
                <>
                  <p className="text-xs text-ventsafe-foreground/40 mb-3">
                    {isCounsellor
                      ? "No resources created yet."
                      : "No resources yet."}
                  </p>
                  <Link
                    href="/resources"
                    className="flex items-center gap-1 text-xs text-ventsafe-navy font-medium hover:underline"
                  >
                    {/* Point 4: "Be the first" for counsellors if no resources */}
                    {isCounsellor ? "Be the first to create one" : "View All Resources"}{" "}
                    <ChevronRight size={12} />
                  </Link>
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    {quickResources.map((r) => (
                      <Link
                        key={r.id}
                        href="/resources"
                        className="block border border-ventsafe-border rounded-ventsafe-sm p-3 hover:border-ventsafe-navy transition-colors"
                      >
                        <p className="text-sm font-medium text-ventsafe-foreground leading-snug">
                          {r.title}
                        </p>
                        <p className="text-xs text-ventsafe-foreground/50 mt-0.5 capitalize">
                          {CATEGORY_LABELS[r.category] ?? r.category}
                        </p>
                      </Link>
                    ))}
                  </div>
                  {/* Point 4: "Create a resource" CTA for counsellors if resources exist */}
                  <Link
                    href="/resources"
                    className="flex items-center gap-1 text-xs text-ventsafe-navy font-medium mt-3 hover:underline"
                  >
                    {isCounsellor ? "Create a resource" : "View All Resources"}{" "}
                    <ChevronRight size={12} />
                  </Link>
                </>
              )}
            </div>

            {/* ── Communities Banner (Point 8) ──
                Opens /coming-soon in a new tab when clicked.
            ── */}
            <div className="bg-gradient-to-br from-ventsafe-navy to-ventsafe-accent text-white rounded-ventsafe-md p-5 space-y-2">
              <span className="text-xl">🌐</span>
              <h3 className="font-bold text-sm leading-tight">
                View Different Communities on VentSafe
              </h3>
              <p className="text-xs opacity-70 leading-relaxed">
                Connect with others going through similar experiences.
              </p>
              {/* Point 8: opens /coming-soon in new tab */}
              <a
                href="/coming-soon"
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full py-2 bg-white text-ventsafe-foreground rounded-ventsafe-sm text-xs font-semibold hover:bg-white/90 transition-colors mt-1 text-center"
              >
                Explore Communities
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Create Vent Modal */}
      <CreateVentModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        token={token}
        authorName={anonymousName}
        onPosted={handlePosted}
      />
    </AppLayout>
  );
}