"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  GraduationCap,
  RefreshCw,
  Search,
  UserCheck,
  UserX,
  ChevronDown,
  Wifi,
  WifiOff,
  Stethoscope,
  Shield,
} from "lucide-react";
import { useAdminAuth } from "../../_context/AdminAuthContext";
import { ADMIN_API, UserRecord, timeAgo, formatDate } from "../../utils";

type RoleFilter = "all" | "student" | "counsellor";
type GenderFilter = "all" | "male" | "female";
type StatusFilter = "all" | "active" | "inactive";
type SortFilter = "newest" | "oldest" | "last_seen";

export default function UsersClient() {
  const { admin } = useAdminAuth();

  const [users, setUsers] = useState<UserRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const [role, setRole] = useState<RoleFilter>("all");
  const [gender, setGender] = useState<GenderFilter>("all");
  const [status, setStatus] = useState<StatusFilter>("active");
  const [sort, setSort] = useState<SortFilter>("newest");
  const [search, setSearch] = useState("");

  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserRecord | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({
      role,
      gender,
      status,
      sort,
      page: String(page),
      limit: "20",
    });
    fetch(`${ADMIN_API}/users?${params}`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setUsers(d.data.users);
          setTotal(d.data.total);
        }
      })
      .finally(() => setLoading(false));
  }, [role, gender, status, sort, page]);

  useEffect(() => {
    load();
  }, [load]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [role, gender, status, sort]);

  const toggleUserStatus = async (user: UserRecord) => {
    const action = user.is_active ? "deactivate" : "activate";
    const key = user.id + action;
    setActionLoading(key);
    try {
      const res = await fetch(`${ADMIN_API}/users/${user.id}/${action}`, {
        method: "PATCH",
        credentials: "include",
      });
      const data = await res.json();
      if (!data.success) {
        alert(data.message);
        return;
      }
      load();
      setSelectedUser(null);
    } catch {
      alert("Something went wrong.");
    } finally {
      setActionLoading(null);
    }
  };

  const filteredUsers = search.trim()
    ? users.filter(
        (u) =>
          u.anonymous_name?.toLowerCase().includes(search.toLowerCase()) ||
          u.anonymous_id?.toLowerCase().includes(search.toLowerCase()),
      )
    : users;

  const roleColor = (r: string) =>
    ({
      student: "bg-blue-100 text-blue-700 border-blue-200",
      counselor: "bg-emerald-100 text-emerald-700 border-emerald-200",
      counsellor_pending: "bg-amber-100 text-amber-700 border-amber-200",
    })[r] ??
    "bg-ventsafe-foreground/10 text-ventsafe-foreground/70 border-ventsafe-foreground/20";

  const roleLabel = (r: string) =>
    ({
      student: "Student",
      counselor: "Counsellor",
      counsellor_pending: "Pending",
    })[r] ?? r;

  const SelectFilter = ({
    label,
    value,
    onChange,
    options,
  }: {
    label: string;
    value: string;
    onChange: (v: any) => void;
    options: { value: string; label: string }[];
  }) => (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none bg-white border border-ventsafe-foreground/15 text-ventsafe-foreground text-sm px-4 py-2 pr-8 rounded-ventsafe-sm focus:outline-none focus:border-ventsafe-foreground cursor-pointer transition-colors hover:border-ventsafe-foreground/30"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ventsafe-foreground/40 pointer-events-none" />
    </div>
  );

  return (
    <div className="p-6 lg:p-8 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-ventsafe-foreground">Users</h1>
          <p className="text-sm text-ventsafe-foreground/50 mt-1">
            {total}{" "}
            {role === "all"
              ? "users"
              : role === "counsellor"
                ? "counsellors"
                : "students"}{" "}
            found
          </p>
        </div>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={load}
          className="flex items-center gap-2 text-sm text-ventsafe-foreground/50 hover:text-ventsafe-foreground border border-ventsafe-foreground/15 px-3 py-2 rounded-ventsafe-sm hover:bg-ventsafe-foreground/5 transition-all cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </motion.button>
      </div>

      {/* Search + Filters */}
      <div className="bg-white border border-ventsafe-border/40 rounded-2xl p-4 mb-6 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ventsafe-foreground/30" />
          <input
            type="text"
            placeholder="Search by anonymous name or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-ventsafe-foreground/5 border border-ventsafe-foreground/15 rounded-ventsafe-sm text-ventsafe-foreground text-sm placeholder-ventsafe-foreground/30 focus:outline-none focus:border-ventsafe-foreground transition-colors"
          />
        </div>

        {/* Filter row */}
        <div className="flex items-center gap-3 flex-wrap">
          <SelectFilter
            label="Role"
            value={role}
            onChange={setRole}
            options={[
              { value: "all", label: "All Roles" },
              { value: "student", label: "Students" },
              { value: "counsellor", label: "Counsellors" },
            ]}
          />
          <SelectFilter
            label="Gender"
            value={gender}
            onChange={setGender}
            options={[
              { value: "all", label: "All Genders" },
              { value: "male", label: "Male" },
              { value: "female", label: "Female" },
            ]}
          />
          <SelectFilter
            label="Status"
            value={status}
            onChange={setStatus}
            options={[
              { value: "all", label: "All Status" },
              { value: "active", label: "Active" },
              { value: "inactive", label: "Inactive" },
            ]}
          />
          <SelectFilter
            label="Sort"
            value={sort}
            onChange={setSort}
            options={[
              { value: "newest", label: "Newest First" },
              { value: "oldest", label: "Oldest First" },
              { value: "last_seen", label: "Last Seen" },
            ]}
          />
        </div>
      </div>

      {/* Users list */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="h-20 bg-ventsafe-foreground/5 rounded-2xl animate-pulse"
            />
          ))}
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-14 h-14 rounded-2xl bg-ventsafe-foreground/5 flex items-center justify-center mx-auto mb-4">
            <Users className="w-7 h-7 text-ventsafe-foreground/20" />
          </div>
          <p className="text-ventsafe-foreground/40 font-medium">
            No users found
          </p>
          <p className="text-ventsafe-foreground/25 text-sm mt-1">
            Try adjusting your filters
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {filteredUsers.map((user, i) => (
              <motion.button
                key={user.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: i * 0.03,
                  type: "spring",
                  stiffness: 260,
                  damping: 24,
                }}
                whileHover={{ scale: 1.005 }}
                whileTap={{ scale: 0.998 }}
                onClick={() =>
                  setSelectedUser(selectedUser?.id === user.id ? null : user)
                }
                className={`w-full bg-white border rounded-2xl p-5 text-left transition-all cursor-pointer group shadow-sm hover:shadow-md ${
                  selectedUser?.id === user.id
                    ? "border-ventsafe-foreground/40"
                    : "border-ventsafe-border/40 hover:border-ventsafe-foreground/20"
                } ${!user.is_active ? "opacity-60" : ""}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <div
                      className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                        user.role === "counselor"
                          ? "bg-emerald-100"
                          : "bg-ventsafe-foreground/8"
                      }`}
                    >
                      {user.role === "counselor" ? (
                        <Stethoscope className="w-5 h-5 text-emerald-600" />
                      ) : user.role === "counsellor_pending" ? (
                        <Shield className="w-5 h-5 text-amber-600" />
                      ) : (
                        <GraduationCap className="w-5 h-5 text-ventsafe-foreground" />
                      )}
                    </div>

                    {/* Info */}
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-bold text-ventsafe-foreground">
                          {user.anonymous_name || "Anonymous"}
                        </p>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium border ${roleColor(user.role)}`}
                        >
                          {roleLabel(user.role)}
                        </span>
                        {user.tier && (
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-ventsafe-foreground/8 text-ventsafe-foreground/60 border border-ventsafe-foreground/15 capitalize">
                            {user.tier}
                          </span>
                        )}
                        {!user.is_active && (
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-red-100 text-red-600 border border-red-200">
                            Inactive
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="text-xs text-ventsafe-foreground/40 capitalize">
                          {user.gender}
                        </span>
                        <span className="text-ventsafe-foreground/20">·</span>
                        <span className="text-xs text-ventsafe-foreground/40">
                          Joined {formatDate(user.created_at)}
                        </span>
                        {user.last_seen && (
                          <>
                            <span className="text-ventsafe-foreground/20">
                              ·
                            </span>
                            <span className="text-xs text-ventsafe-foreground/40">
                              Seen {timeAgo(user.last_seen)}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Online indicator */}
                  <div className="flex items-center gap-2 shrink-0">
                    {user.is_online ? (
                      <Wifi className="w-4 h-4 text-green-500" />
                    ) : (
                      <WifiOff className="w-4 h-4 text-ventsafe-foreground/20" />
                    )}
                  </div>
                </div>

                {/* Specialisations for counsellors */}
                {user.specialisations && user.specialisations.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {user.specialisations.slice(0, 4).map((s) => (
                      <span
                        key={s}
                        className="text-xs bg-ventsafe-foreground/5 text-ventsafe-foreground/40 px-2 py-0.5 rounded-full border border-ventsafe-foreground/8"
                      >
                        {s}
                      </span>
                    ))}
                    {user.specialisations.length > 4 && (
                      <span className="text-xs text-ventsafe-foreground/25">
                        +{user.specialisations.length - 4}
                      </span>
                    )}
                  </div>
                )}

                {/* Expanded actions — Super Admin only */}
                <AnimatePresence>
                  {selectedUser?.id === user.id && admin.is_super_admin && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="flex gap-3 mt-4 pt-4 border-t border-ventsafe-border/30">
                        <motion.button
                          whileTap={{ scale: 0.97 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleUserStatus(user);
                          }}
                          disabled={!!actionLoading}
                          className={`flex items-center gap-2 text-xs px-4 py-2 rounded-full font-semibold border transition-all cursor-pointer disabled:opacity-50 ${
                            user.is_active
                              ? "border-red-200 text-red-500 bg-red-50 hover:bg-red-100"
                              : "border-green-200 text-green-600 bg-green-50 hover:bg-green-100"
                          }`}
                        >
                          {user.is_active ? (
                            <>
                              <UserX className="w-3.5 h-3.5" /> Deactivate
                              Account
                            </>
                          ) : (
                            <>
                              <UserCheck className="w-3.5 h-3.5" /> Activate
                              Account
                            </>
                          )}
                        </motion.button>
                        <p className="text-xs text-ventsafe-foreground/30 self-center">
                          {user.is_active
                            ? "This will prevent the user from logging in."
                            : "This will allow the user to log in again."}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            ))}
          </div>

          {/* Pagination */}
          {total > 20 && (
            <div className="flex items-center justify-between mt-6">
              <p className="text-xs text-ventsafe-foreground/40">
                Showing {Math.min((page - 1) * 20 + 1, total)}–
                {Math.min(page * 20, total)} of {total}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 text-sm border border-ventsafe-foreground/15 rounded-ventsafe-sm text-ventsafe-foreground/60 hover:text-ventsafe-foreground hover:bg-ventsafe-foreground/5 disabled:opacity-30 cursor-pointer transition-all"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page * 20 >= total}
                  className="px-4 py-2 text-sm border border-ventsafe-foreground/15 rounded-ventsafe-sm text-ventsafe-foreground/60 hover:text-ventsafe-foreground hover:bg-ventsafe-foreground/5 disabled:opacity-30 cursor-pointer transition-all"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
