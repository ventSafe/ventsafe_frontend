"use client";

import { useState, useEffect, useCallback } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PostCard, type PostViewData } from "@/components/shared/PostCard";
import { AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { API_BASE_URL } from "@/config/constants";

export default function MyVentsPage() {
  const { user, token, anonymousName } = useAuth();
  const [posts, setPosts] = useState<PostViewData[]>([]);
  const [loading, setLoading] = useState(true);

  const viewerUserId = user?.id ?? "";
  const viewerRole = user?.role ?? "student";

  const fetchMyPosts = useCallback(async () => {
    if (!token || !viewerUserId) return;
    setLoading(true);
    try {
      const res = await fetch(
        `${API_BASE_URL}/posts?author_id=${viewerUserId}&limit=50`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const data = (await res.json()) as {
        success: boolean;
        data: { posts: PostViewData[] };
      };
      if (data.success) setPosts(data.data.posts);
    } finally {
      setLoading(false);
    }
  }, [token, viewerUserId]);

  useEffect(() => { void fetchMyPosts(); }, [fetchMyPosts]);

  const handleDelete = (id: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== id));
  };

  const handleRepost = (repost: PostViewData) => {
    setPosts((prev) => [repost, ...prev]);
  };

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
        <div className="mb-5">
          <h1 className="text-2xl font-bold text-ventsafe-foreground">
            My Vents
          </h1>
          <p className="text-sm text-ventsafe-foreground/50 mt-1">
            Everything you&apos;ve posted so far.
          </p>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white border border-ventsafe-border rounded-ventsafe-md p-4 animate-pulse"
              >
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
                </div>
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="bg-white border border-ventsafe-border rounded-ventsafe-md p-10 text-center">
            <div className="text-4xl mb-3">💬</div>
            <p className="text-base font-semibold text-ventsafe-foreground">
              No vents yet
            </p>
            <p className="text-sm text-ventsafe-foreground/50 mt-1">
              Head over to the Vent Space and share how you&apos;re feeling.
            </p>
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
          </div>
        )}
      </div>
    </AppLayout>
  );
}
