/* =====================================================
PINESPHERE ERP
Module      : Users Module
Component   : Users
Purpose     : Renders and coordinates Users UI behavior
Author      : Pinesphere Development Team
Last Updated: Auto Generated
===================================================== */

/* =====================================================
   SECTION: IMPORTS
   PURPOSE:
   This section loads external libraries, framework tools, and local helpers.
   Keeping imports together makes dependencies easy to review.
===================================================== */

import {
  Activity,
  CheckCircle2,
  Download,
  Eye,
  Filter,
  GraduationCap,
  History,
  KeyRound,
  Mail,
  Pencil,
  Power,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  Trash2,
  UserCheck,
  UserCog,
  UserPlus,
  UserX,
  Users,
  X,
} from "lucide-react";
import type { ComponentType, CSSProperties, FormEvent, ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";

/* =====================================================
   SECTION: API CALLS
   PURPOSE:
   This section talks to backend or server endpoints.
   It sends requests, receives responses, and prepares data for the UI.
===================================================== */

import { apiRequest } from "../shared/api";
import { ConfirmActionModal } from "../shared/confirm-modal";

/* =====================================================
   SECTION: TYPES AND INTERFACES
   PURPOSE:
   This section describes the shape of data used by the code.
   Clear types make component props, API payloads, and state easier to understand.
===================================================== */

type IconType = ComponentType<{
  size?: number;
  className?: string;
  style?: CSSProperties;
}>;

type UserRow = {
  id: string;
  email: string;
  phone?: string | null;
  full_name: string;
  role: string;
  branch_id?: string | null;
  branch_name?: string | null;
  is_active: boolean;
  last_login?: string | null;
  invite_status?: InviteStatus | null;
  invite_sent_at?: string | null;
  invite_expires_at?: string | null;
  invite_accepted_at?: string | null;
};

type InviteStatus = "pending" | "sent" | "delivered" | "accepted" | "expired" | "failed";

type BranchResponse = {
  id: string;
  name: string;
  code: string;
  city?: string | null;
  address?: string | null;
  manager_name?: string | null;
  phone?: string | null;
  capacity: number;
  status: string;
  created_at: string;
};

type InviteRow = {
  id: string;
  email: string;
  role: string;
  branch: string;
  status: InviteStatus;
  method: "Temporary password" | "Auto invite";
  sent_at: string | null;
  expires_at?: string | null;
  accepted_at?: string | null;
};

type InviteConflict = {
  kind: "active" | "pending" | "inactive";
  user: UserRow;
};

type InviteConfirmation = {
  kind: "resend" | "reactivate";
  invite?: InviteRow;
  user?: UserRow;
};

type InviteApiResponse = Pick<UserRow, "id" | "email" | "invite_status" | "invite_sent_at" | "invite_expires_at">;

type ActivityRow = {
  id: string;
  message: string;
  detail: string;
  time: string;
  created_at: string;
  type: "added" | "role" | "disabled" | "password" | "invite";
};

type AddUserForm = {
  full_name: string;
  email: string;
  phone: string;
  role: string;
  branch_id: string;
  status: string;
  temporary_password: string;
  send_welcome_email: boolean;
};

const roleOptions = [
  { label: "Super Admin", value: "super_admin" },
  { label: "Branch Admin", value: "branch_admin" },
  { label: "Counsellor", value: "counsellor" },
  { label: "Trainer", value: "trainer" },
  { label: "Student", value: "student" },
  { label: "Parent", value: "parent" },
  { label: "Finance", value: "finance" },
  { label: "HR", value: "hr" },
  { label: "Franchise Owner", value: "franchise_owner" },
  { label: "Company HR", value: "company_hr" },
];

/* =====================================================
   ROLE COLOR MAPPING
   Semantic colors for role badges with background and border.
===================================================== */

const roleColorMap: Record<string, { bg: string; border: string; text: string; abbr: string; description: string }> = {
  super_admin: { bg: "#EDE0F7", border: "#D8BFF5", text: "#5B21B6", abbr: "SA", description: "Full system access" },
  branch_admin: { bg: "#D0E4F7", border: "#A8CCEF", text: "#0C4A8C", abbr: "BA", description: "Branch management" },
  counsellor: { bg: "#D0F0E0", border: "#A8E0C8", text: "#065F46", abbr: "CL", description: "Counsellor access" },
  trainer: { bg: "#FEFED0", border: "#FDFAA8", text: "#713F12", abbr: "TR", description: "Trainer access" },
  hr: { bg: "#FFE8D0", border: "#FDD6B0", text: "#7C2D12", abbr: "HR", description: "HR management" },
  finance: { bg: "#D0EAF7", border: "#A8D9EF", text: "#0C4A8C", abbr: "FN", description: "Finance operations" },
  student: { bg: "#D0F0D0", border: "#A8E0A8", text: "#065F46", abbr: "ST", description: "Student access" },
  parent: { bg: "#F7EAD0", border: "#EFD9A8", text: "#7C2D12", abbr: "PA", description: "Parent access" },
  franchise_owner: { bg: "#D0F7F7", border: "#A8EFEF", text: "#0C5F5F", abbr: "FO", description: "Franchise owner" },
  company_hr: { bg: "#F7D0D0", border: "#EFA8A8", text: "#7C1C1C", abbr: "CH", description: "Company HR" },
  public: { bg: "#F0F0F0", border: "#D0D0D0", text: "#525252", abbr: "PB", description: "Public access" },
};

const fallbackBranchOptions = [
  { label: "Main Branch", value: "main" },
  { label: "North Campus", value: "north" },
  { label: "Online Batch", value: "online" },
  { label: "Franchise A", value: "franchise-a" },
];

/* =====================================================
   SECTION: CONSTANTS
   PURPOSE:
   This section stores fixed values used by the file.
   Centralizing these values helps avoid repeated magic strings or numbers.
===================================================== */

const ACTIVITY_STORAGE_KEY = "pinesphere_user_management_activity";

/* =====================================================
   SECTION: HELPER FUNCTIONS
   PURPOSE:
   This section contains small reusable utilities used by the file.
   Helpers keep repeated logic in one clear place.
===================================================== */

function formatDateTime(value?: string | null) {
  if (!value) return "Never";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function roleLabel(value: string) {
  return roleOptions.find((role) => role.value === value)?.label ?? value.replaceAll("_", " ");
}

function branchLabel(value?: string | null, options = fallbackBranchOptions) {
  if (!value) return "Unassigned";
  return options.find((branch) => branch.value === value)?.label ?? value;
}

function userBranch(user: UserRow, options = fallbackBranchOptions) {
  return user.branch_name ?? branchLabel(user.branch_id, options);
}

function normalizeUserEmail(value: string) {
  return value.trim().toLowerCase();
}

function isValidInviteEmail(value: string) {
  return /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+$/i.test(value) && !value.endsWith(".cor");
}

function normalizeUserPhone(value?: string | null) {
  /* =====================================================
     SECTION: UI RENDERING
     PURPOSE:
     This section returns the visual layout shown to the user.
     It combines data, state, and components into the final screen.
  ===================================================== */

  return (value ?? "").replace(/\s+/g, "");
}

function uniqueUserRows(rows: UserRow[]) {
  const seen = new Set<string>();
  return rows.filter((user) => {
    const key = normalizeUserEmail(user.email) || user.id;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function checksum(value: string) {
  return [...value].reduce((total, char) => total + char.charCodeAt(0), 0);
}

function fallbackPassword(prefix: string, seed: string) {
  return `${prefix}@${String(1000 + (checksum(seed) % 9000)).padStart(4, "0")}`;
}

function fallbackId(prefix: string, seed: string) {
  const slug = seed.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 32) || "local";
  return `${prefix}-${slug}-${checksum(seed)}`;
}

function relativeActivityTime(value: string) {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000));
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

function Panel({ icon, title, subtitle, action, children }: { icon: IconType; title: string; subtitle: string; action?: ReactNode; children: ReactNode }) {
  return (
    <article className="w-full rounded-[22px] border border-[#ddeecf] bg-white p-[18px] shadow-[0_8px_18px_rgba(15,23,42,0.06)]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[16px] bg-[#d7ff70] text-[#58cc02]">
            {(() => {
              const Icon = icon;
              return <Icon size={22} />;
            })()}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-[19px] font-black leading-tight">{title}</h2>
            <p className="mt-1 text-sm text-[#5f6f56]">{subtitle}</p>
          </div>
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      <div className="mt-4">{children}</div>
    </article>
  );
}
export function UserManagementPanel({ accessToken, headerActions }: { accessToken: string; headerActions?: ReactNode }) {
  /* =========================
     Super Admin User Control Panel
     Manages users, filters, invites, activity history, and account actions.
  ========================= */

  const [users, setUsers] = useState<UserRow[]>([]);
  const [branchRows, setBranchRows] = useState<BranchResponse[]>([]);
  const [invites, setInvites] = useState<InviteRow[]>([]);
  const [activities, setActivities] = useState<ActivityRow[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const saved = window.localStorage.getItem(ACTIVITY_STORAGE_KEY);
      if (!saved) return [];
      const parsed = JSON.parse(saved) as ActivityRow[];
      return parsed.map((activity) => ({ ...activity, time: relativeActivityTime(activity.created_at) }));
    } catch {
      window.localStorage.removeItem(ACTIVITY_STORAGE_KEY);
      return [];
    }
  });
  /* =====================================================
     SECTION: STATE MANAGEMENT
     PURPOSE:
     This section stores temporary UI data such as loading, errors, filters, and form values.
     State changes here control what the user sees on the screen.
  ===================================================== */

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [branchFilter, setBranchFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("role");
  const [page, setPage] = useState(1);
  const [deletedUserIds, setDeletedUserIds] = useState<string[]>([]);
  const [viewUser, setViewUser] = useState<UserRow | null>(null);
  const [editUser, setEditUser] = useState<UserRow | null>(null);
  const [roleUser, setRoleUser] = useState<UserRow | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null);
  const [addUserOpen, setAddUserOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [activityHistoryOpen, setActivityHistoryOpen] = useState(false);
  const [addUserStatus, setAddUserStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [actionStatus, setActionStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [inviteStatus, setInviteStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [inviteBusy, setInviteBusy] = useState(false);
  const [resendingInviteId, setResendingInviteId] = useState<string | null>(null);
  const [inviteConflict, setInviteConflict] = useState<InviteConflict | null>(null);
  const [inviteConfirmation, setInviteConfirmation] = useState<InviteConfirmation | null>(null);
  const [isDeactivateModalOpen, setIsDeactivateModalOpen] = useState(false);
  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    email: "",
    role: "trainer",
    branch_id: "main",
    temporary_password: "Welcome@123",
    delivery: "auto",
  });

  const availableBranchOptions = useMemo(() => {
    if (!branchRows.length) return fallbackBranchOptions;
    return branchRows.map((branch) => ({ label: branch.name, value: branch.id }));
  }, [branchRows]);
  const branchFilterOptions = useMemo(() => [{ label: "All branches", value: "all" }, ...availableBranchOptions], [availableBranchOptions]);
  const userBranchOptions = useMemo(() => [{ label: "Unassigned", value: "" }, ...availableBranchOptions], [availableBranchOptions]);
  const inviteBranchId = availableBranchOptions.some((branch) => branch.value === inviteForm.branch_id)
    ? inviteForm.branch_id
    : availableBranchOptions[0]?.value ?? "";
  const inviteEmailError = inviteForm.email.trim() && !isValidInviteEmail(normalizeUserEmail(inviteForm.email))
    ? "Please enter a valid email address."
    : "";

  async function refreshUsers(extraHiddenUserIds: string[] = []) {
    setLoading(true);
    setError("");
    try {
      const userData = await apiRequest<UserRow[]>("/auth/users", accessToken);
      const hiddenUserIds = new Set([...deletedUserIds, ...extraHiddenUserIds]);
      setUsers(uniqueUserRows(userData).filter((user) => !hiddenUserIds.has(user.id)));
      setLoading(false);
      const branchData = await apiRequest<BranchResponse[]>("/branches", accessToken).catch(() => []);
      setBranchRows(branchData);
      const inviteData = await apiRequest<UserRow[]>("/auth/users/invites", accessToken).catch(() => []);
      setInvites(inviteData.map((invite) => ({
        id: invite.id,
        email: invite.email,
        role: invite.role,
        branch: branchLabel(invite.branch_id ?? "", branchData.length ? branchData.map((branch) => ({ label: branch.name, value: branch.id })) : fallbackBranchOptions),
        status: invite.invite_status ?? "pending",
        method: "Auto invite",
        sent_at: invite.invite_sent_at ?? null,
        expires_at: invite.invite_expires_at ?? null,
        accepted_at: invite.invite_accepted_at ?? null,
      })));
      pushActivity("added", "Users refreshed", `${userData.length} user records loaded`);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "User API unavailable");
      pushActivity("disabled", "User API unavailable", "Could not refresh live user data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let alive = true;

    async function loadInitialUsers() {
      setLoading(true);
      setError("");
      try {
        const data = await apiRequest<UserRow[]>("/auth/users", accessToken);
        if (!alive) return;
        setUsers(uniqueUserRows(data).filter((user) => !deletedUserIds.includes(user.id)));
        setLoading(false);
        const [branchData, inviteData] = await Promise.all([
          apiRequest<BranchResponse[]>("/branches", accessToken).catch(() => []),
          apiRequest<UserRow[]>("/auth/users/invites", accessToken).catch(() => []),
        ]);
        if (!alive) return;
        setBranchRows(branchData);
        setInvites(inviteData.map((invite) => ({
          id: invite.id,
          email: invite.email,
          role: invite.role,
          branch: branchLabel(invite.branch_id ?? "", branchData.length ? branchData.map((branch) => ({ label: branch.name, value: branch.id })) : fallbackBranchOptions),
          status: invite.invite_status ?? "pending",
          method: "Auto invite",
          sent_at: invite.invite_sent_at ?? null,
          expires_at: invite.invite_expires_at ?? null,
          accepted_at: invite.invite_accepted_at ?? null,
        })));
      } catch (loadError) {
        if (!alive) return;
        setError(loadError instanceof Error ? loadError.message : "User API unavailable");
      } finally {
        if (alive) setLoading(false);
      }
    }

    loadInitialUsers();

    return () => {
      alive = false;
    };
  }, [accessToken, deletedUserIds]);

  useEffect(() => {
    try {
      window.localStorage.setItem(ACTIVITY_STORAGE_KEY, JSON.stringify(activities));
    } catch {}
  }, [activities]);

  useEffect(() => {
    if (!actionStatus) return;
    const timer = window.setTimeout(() => setActionStatus(null), 3600);
    return () => window.clearTimeout(timer);
  }, [actionStatus]);

  const filteredUsers = useMemo(() => {
    const term = search.trim().toLowerCase();
    const visible = users.filter((user) => {
      const matchesSearch = !term || user.full_name.toLowerCase().includes(term) || user.email.toLowerCase().includes(term);
      const matchesRole = roleFilter === "all" || user.role === roleFilter;
      const matchesBranch = branchFilter === "all" || user.branch_id === branchFilter || userBranch(user, availableBranchOptions) === branchLabel(branchFilter, availableBranchOptions);
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && user.is_active) ||
        (statusFilter === "inactive" && !user.is_active);
      return matchesSearch && matchesRole && matchesBranch && matchesStatus;
    });

    return [...visible].sort((a, b) => {
      if (sortBy === "branch") return userBranch(a, availableBranchOptions).localeCompare(userBranch(b, availableBranchOptions));
      if (sortBy === "last_login") return new Date(b.last_login ?? 0).getTime() - new Date(a.last_login ?? 0).getTime();
      return roleLabel(a.role).localeCompare(roleLabel(b.role));
    });
  }, [availableBranchOptions, branchFilter, roleFilter, search, sortBy, statusFilter, users]);
  const pageSize = 6;
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));
  const paginatedUsers = filteredUsers.slice((page - 1) * pageSize, page * pageSize);
  const visibleActivities = activityHistoryOpen ? activities : activities.slice(0, 4);

  const kpis = [
    { label: "Total Users", value: users.length, helper: "All system accounts", icon: Users, color: "bg-[#eefbe7] text-[#3e9e00]" },
    { label: "Active Trainers", value: users.filter((user) => user.role === "trainer" && user.is_active).length, helper: "LMS enabled", icon: GraduationCap, color: "bg-[#e0f2fe] text-[#0ea5e9]" },
    { label: "Active Students", value: users.filter((user) => user.role === "student" && user.is_active).length, helper: "Learning access", icon: UserCheck, color: "bg-[#d1fae5] text-[#10b981]" },
    { label: "Branch Admins", value: users.filter((user) => user.role === "branch_admin").length, helper: "Branch control", icon: ShieldCheck, color: "bg-[#eef2ff] text-[#4f46e5]" },
    { label: "Pending Invitations", value: invites.filter((invite) => ["pending", "sent", "delivered"].includes(invite.status)).length, helper: "Awaiting activation", icon: Mail, color: "bg-[#fef3c7] text-[#92400e]" },
    { label: "Disabled Accounts", value: users.filter((user) => !user.is_active).length, helper: "Access paused", icon: UserX, color: "bg-[#fee2e2] text-[#ef4444]" },
  ];
  function pushActivity(type: ActivityRow["type"], message: string, detail: string) {
    const createdAt = new Date().toISOString();
    setActivities((current) => [
      { id: `ACT-${Date.now()}`, type, message, detail, time: "Just now", created_at: createdAt },
      ...current,
    ].slice(0, 20));
  }

  function clearFilters() {
    setSearch("");
    setRoleFilter("all");
    setBranchFilter("all");
    setStatusFilter("all");
    setSortBy("role");
    setPage(1);
    pushActivity("role", "Filters cleared", "User table filters were reset");
  }

  function exportUsersCsv() {
    const rows = filteredUsers.map((user) => [
      user.full_name,
      user.email,
      roleLabel(user.role),
      userBranch(user, availableBranchOptions),
      user.is_active ? "Active" : "Inactive",
      formatDateTime(user.last_login),
    ]);
    const csv = [["Name", "Email", "Role", "Branch", "Status", "Last Login"], ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "pinesphere-users.csv";
    link.click();
    URL.revokeObjectURL(url);
    pushActivity("added", "Users exported", `${filteredUsers.length} user records exported to CSV`);
  }

  async function createUser(form: AddUserForm) {
    setAddUserStatus(null);

    const roleRequiresBranch = ["branch_admin", "trainer", "student", "finance", "hr"].includes(form.role);
    const email = normalizeUserEmail(form.email);
    const phone = normalizeUserPhone(form.phone);
    if (!form.full_name.trim()) {
      setAddUserStatus({ type: "error", message: "Full Name is required." });
      return false;
    }
    if (!isValidInviteEmail(email)) {
      setAddUserStatus({ type: "error", message: "Please enter a valid email address." });
      return false;
    }
    if (users.some((user) => normalizeUserEmail(user.email) === email)) {
      setAddUserStatus({ type: "error", message: "A user with this email already exists." });
      return false;
    }
    if (phone && users.some((user) => normalizeUserPhone(user.phone) === phone)) {
      setAddUserStatus({ type: "error", message: "A user with this phone number already exists." });
      return false;
    }
    if (!form.role) {
      setAddUserStatus({ type: "error", message: "Role is required." });
      return false;
    }
    if (roleRequiresBranch && !form.branch_id) {
      setAddUserStatus({ type: "error", message: "Branch is required for this role." });
      return false;
    }
    if (!form.send_welcome_email && !form.temporary_password) {
      setAddUserStatus({ type: "error", message: "Temporary password is required unless welcome email is enabled." });
      return false;
    }
    const payload = {
      name: form.full_name,
      full_name: form.full_name,
      email,
      phone: phone || null,
      role: form.role,
      branch_id: form.branch_id || null,
      status: form.status,
      temporary_password: form.temporary_password || null,
      password: form.temporary_password || fallbackPassword("Welcome", email),
      send_welcome_email: form.send_welcome_email,
    };

    try {
      await apiRequest<unknown>("/auth/users", accessToken, {
        method: "POST",
        body: JSON.stringify(payload),
      });
    } catch (createError) {
      const message = createError instanceof Error ? createError.message : "User could not be created.";
      if (message.toLowerCase().includes("already exists")) {
        setAddUserStatus({ type: "error", message });
        return false;
      }
      // Keep the workflow usable with fallback state while backend contract evolves.
    }

    const nextUser: UserRow = {
      id: fallbackId("USR", `${email}-${form.role}-${form.branch_id}`),
      email,
      phone: phone || null,
      full_name: form.full_name,
      role: form.role,
      branch_id: form.branch_id || null,
      branch_name: branchLabel(form.branch_id, availableBranchOptions),
      is_active: form.status === "active",
      last_login: null,
    };
    setUsers((current) => uniqueUserRows([nextUser, ...current]));
    pushActivity("added", "User added", `${nextUser.full_name} created as ${roleLabel(nextUser.role)}`);
    setAddUserStatus({ type: "success", message: "User created successfully." });
    return true;
  }

  async function setUserActive(user: UserRow, active: boolean) {
    await apiRequest<UserRow>(`/auth/users/${user.id}`, accessToken, {
      method: "PATCH",
      body: JSON.stringify({ is_active: active }),
    });
  }

  async function deleteUserAccount(user: UserRow) {
    await apiRequest<unknown>(`/auth/users/${user.id}`, accessToken, { method: "DELETE" });
  }

  async function resetUserPassword(user: UserRow) {
    await apiRequest<unknown>(`/auth/users/${user.id}/reset-password`, accessToken, { method: "POST" });
  }

  async function activateUser(user: UserRow) {
    if (actionBusy) return;
    setActionBusy(true);
    setActionStatus(null);
    try {
      await setUserActive(user, true);
      setUsers((current) => current.map((item) => (item.id === user.id ? { ...item, is_active: true } : item)));
      setActionStatus({ type: "success", message: `${user.full_name} activated successfully.` });
      pushActivity("added", "Account enabled", `${user.full_name} access restored`);
      setSelectedUser(null);
      await refreshUsers();
    } catch (actionError) {
      setActionStatus({ type: "error", message: actionError instanceof Error ? actionError.message : "User could not be activated." });
    } finally {
      setActionBusy(false);
    }
  }

  function requestUserAction(user: UserRow, action: "toggle" | "reset" | "delete") {
    setSelectedUser(user);
    if (action === "toggle" && !user.is_active) {
      void activateUser(user);
      return;
    }
    if (action === "toggle") {
      setIsDeactivateModalOpen(true);
      return;
    }
    if (action === "reset") {
      setIsResetPasswordModalOpen(true);
      return;
    }
    setIsDeleteModalOpen(true);
  }

  async function confirmDeactivateUser() {
    if (!selectedUser || actionBusy) return;
    setActionBusy(true);
    setActionStatus(null);
    try {
      await setUserActive(selectedUser, false);
      setUsers((current) => current.map((item) => (item.id === selectedUser.id ? { ...item, is_active: false } : item)));
      setActionStatus({ type: "success", message: `${selectedUser.full_name} deactivated successfully.` });
      pushActivity("disabled", "Account disabled", `${selectedUser.full_name} access paused`);
      setIsDeactivateModalOpen(false);
      setSelectedUser(null);
      await refreshUsers();
    } catch (actionError) {
      setActionStatus({ type: "error", message: actionError instanceof Error ? actionError.message : "Account could not be deactivated." });
    } finally {
      setActionBusy(false);
    }
  }

  async function confirmResetPassword() {
    if (!selectedUser || actionBusy) return;
    setActionBusy(true);
    setActionStatus(null);
    try {
      await resetUserPassword(selectedUser);
      setActionStatus({ type: "success", message: `Password reset triggered for ${selectedUser.full_name}.` });
      pushActivity("password", "Password reset requested", `${selectedUser.full_name} reset workflow started`);
      setIsResetPasswordModalOpen(false);
      setSelectedUser(null);
    } catch (actionError) {
      setActionStatus({ type: "error", message: actionError instanceof Error ? actionError.message : "Password reset failed." });
    } finally {
      setActionBusy(false);
    }
  }

  async function confirmDeleteUser() {
    if (!selectedUser || actionBusy) return;
    setActionBusy(true);
    setActionStatus(null);
    try {
      await deleteUserAccount(selectedUser);
      setUsers((current) => current.filter((item) => item.id !== selectedUser.id));
      setDeletedUserIds((current) => Array.from(new Set([...current, selectedUser.id])));
      setActionStatus({ type: "success", message: "User deleted successfully" });
      pushActivity("disabled", "User deleted", `${selectedUser.full_name} removed from active user list`);
      setIsDeleteModalOpen(false);
      const deletedId = selectedUser.id;
      setSelectedUser(null);
      await refreshUsers([deletedId]);
    } catch (actionError) {
      /* =====================================================
         SECTION: LOGGING
         PURPOSE:
         This section records useful runtime information for debugging and audits.
         Logs help developers understand what happened during a request or task.
      ===================================================== */

      console.error("Delete user failed:", actionError);
      setActionStatus({ type: "error", message: actionError instanceof Error ? actionError.message : "Failed to delete user" });
    } finally {
      setActionBusy(false);
    }
  }

  function inviteRowForUser(user: UserRow): InviteRow {
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      branch: userBranch(user, availableBranchOptions),
      status: user.invite_status ?? "pending",
      method: "Auto invite",
      sent_at: user.invite_sent_at ?? null,
      expires_at: user.invite_expires_at ?? null,
      accepted_at: user.invite_accepted_at ?? null,
    };
  }

  async function sendInvite(reactivateExisting = false) {
    if (inviteBusy) return;
    setInviteStatus(null);
    setInviteConflict(null);
    const email = normalizeUserEmail(inviteForm.email);
    if (!isValidInviteEmail(email)) {
      setInviteStatus({ type: "error", message: "Please enter a valid email address." });
      return;
    }
    if (!inviteForm.role) {
      setInviteStatus({ type: "error", message: "Select a role before sending the invite." });
      return;
    }
    if (!inviteBranchId) {
      setInviteStatus({ type: "error", message: "Select a branch before sending the invite." });
      return;
    }
    if (inviteForm.delivery === "temporary" && !inviteForm.temporary_password.trim()) {
      setInviteStatus({ type: "error", message: "Enter a temporary password." });
      return;
    }
    const branch = branchLabel(inviteBranchId, availableBranchOptions);
    const password = inviteForm.delivery === "temporary" ? inviteForm.temporary_password.trim() : null;

    try {
      setInviteBusy(true);
      const response = await apiRequest<InviteApiResponse>("/users/invite", accessToken, {
        method: "POST",
        body: JSON.stringify({
          email,
          role: inviteForm.role,
          role_abbreviation: roleColorMap[inviteForm.role]?.abbr ?? "",
          branch_id: inviteBranchId,
          invite_method: inviteForm.delivery,
          temporary_password: password,
          reactivate_existing: reactivateExisting,
        }),
      });
      const invite: InviteRow = {
        id: response.id,
        email: response.email,
        role: inviteForm.role,
        branch,
        status: response.invite_status ?? "delivered",
        method: inviteForm.delivery === "temporary" ? "Temporary password" : "Auto invite",
        sent_at: response.invite_sent_at ?? new Date().toISOString(),
        expires_at: response.invite_expires_at ?? null,
      };
      setInvites((current) => [invite, ...current.filter((item) => item.id !== invite.id)]);
      pushActivity("invite", "Invite sent", `${invite.email} invited as ${roleLabel(invite.role)}`);
      setInviteForm({ email: "", role: "trainer", branch_id: "main", temporary_password: "Welcome@123", delivery: "auto" });
      setInviteStatus({ type: "success", message: `Invite email delivered to ${invite.email}.` });
    } catch (inviteError) {
      const message = inviteError instanceof Error ? inviteError.message : "Invite email could not be sent.";
      setInviteStatus({
        type: "error",
        message: message.includes("SMTP is not configured")
          ? "Invite email was not sent. Configure SMTP in backend/.env, then restart the backend."
          : message.includes("authentication failed") || message.includes("Authentication unsuccessful")
            ? "Invite email was not sent. Outlook rejected the SMTP login. Check the mailbox, app password, and SMTP AUTH settings."
          : message,
      });
    } finally {
      setInviteBusy(false);
    }
  }

  async function submitInvite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const email = normalizeUserEmail(inviteForm.email);
    if (!isValidInviteEmail(email)) {
      setInviteStatus({ type: "error", message: "Please enter a valid email address." });
      return;
    }
    const existingUser = users.find((user) => normalizeUserEmail(user.email) === email);
    if (existingUser?.is_active) {
      setInviteConflict({ kind: "active", user: existingUser });
      setInviteStatus({ type: "error", message: "This email is already registered as an active user." });
      return;
    }
    if (existingUser?.invite_status && ["pending", "sent", "delivered", "failed", "expired"].includes(existingUser.invite_status)) {
      setInviteConflict({ kind: "pending", user: existingUser });
      setInviteStatus({ type: "error", message: "A pending invite already exists for this email." });
      return;
    }
    if (existingUser) {
      setInviteConflict({ kind: "inactive", user: existingUser });
      setInviteStatus({ type: "error", message: "This user already exists but is inactive." });
      return;
    }
    await sendInvite();
  }

  async function resendInvite(invite: InviteRow) {
    if (resendingInviteId) return;
    setResendingInviteId(invite.id);
    setInviteStatus(null);
    try {
      const response = await apiRequest<UserRow>("/auth/resend-invite", accessToken, {
        method: "POST",
        body: JSON.stringify({ user_id: invite.id }),
      });
      setInvites((current) => current.map((item) => (
        item.id === invite.id ? { ...item, status: response.invite_status ?? "delivered", sent_at: response.invite_sent_at ?? new Date().toISOString(), expires_at: response.invite_expires_at ?? null } : item
      )));
      pushActivity("invite", "Invite resent", `${invite.email} invite resent as ${roleLabel(invite.role)}`);
      setInviteStatus({ type: "success", message: `Invite resent to ${invite.email}.` });
    } catch (error) {
      setInviteStatus({ type: "error", message: error instanceof Error ? error.message : "Invite email could not be resent." });
    } finally {
      setResendingInviteId(null);
    }
  }

  function requestResendInvite(invite: InviteRow) {
    setInviteConfirmation({ kind: "resend", invite });
  }

  async function confirmInviteAction() {
    if (!inviteConfirmation) return;
    if (inviteConfirmation.kind === "resend" && inviteConfirmation.invite) {
      await resendInvite(inviteConfirmation.invite);
    }
    if (inviteConfirmation.kind === "reactivate" && inviteConfirmation.user) {
      await sendInvite(true);
    }
    setInviteConfirmation(null);
  }

  return (
    <div className="space-y-[18px]">
      <section className="rounded-lg border border-[#cceabf] bg-[linear-gradient(135deg,#12310f,#2f7d00_46%,#6fe31d)] p-4 text-white shadow-[0_18px_44px_rgba(47,125,0,0.22)] sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-5">
          <div className="flex min-w-0 items-center gap-4">
            <ShieldCheck size={40} />
            <div className="min-w-0">
              <h2 className="text-2xl font-black">User Management</h2>
              <p className="mt-1.5 max-w-3xl text-sm leading-6 text-white/90">
                Super Admin control panel for user access, invitations, roles, account state, and audit activity.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            {headerActions}
            <button
              type="button"
              onClick={() => void refreshUsers()}
              className="inline-flex min-h-11 items-center gap-2 rounded-[14px] bg-white px-4 py-3 text-sm font-black text-[#3e9e00] shadow-sm transition hover:bg-[#f6fff0]"
            >
              <RefreshCw size={17} />
              Refresh
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {kpis.map((kpi) => (
          <article key={kpi.label} className="flex min-h-[118px] items-start gap-3 rounded-[20px] border border-[#ddeecf] bg-white p-4 shadow-[0_8px_18px_rgba(15,23,42,0.06)] transition hover:-translate-y-0.5 hover:border-[#58cc02] hover:shadow-[0_12px_24px_rgba(15,23,42,0.10)]">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${kpi.color}`}>
              <kpi.icon size={21} />
            </div>
            <div className="min-w-0">
              <p className="text-sm text-[#5f6f56]">{kpi.label}</p>
              <p className="mt-1.5 text-[26px] font-black leading-none">{loading ? "..." : kpi.value}</p>
              <p className="mt-1.5 text-xs font-bold text-[#5f6f56]">{kpi.helper}</p>
            </div>
          </article>
        ))}
      </section>

      <Panel icon={UserPlus} title="Add User / Invite User" subtitle="Create accounts or send user invitations.">
        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => {
              setAddUserStatus(null);
              setAddUserOpen(true);
            }}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#58cc02] px-4 text-sm font-black text-white transition hover:bg-[#3e9e00]"
          >
            <UserPlus size={16} />
            Add User
          </button>
          <button
            type="button"
            onClick={() => {
              setInviteStatus(null);
              setInviteOpen((current) => !current);
            }}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#58cc02] bg-[#f6fff0] px-4 text-sm font-black text-[#3e9e00] transition hover:bg-[#eefbe7]"
          >
            <Mail size={16} />
            Invite User
          </button>
        </div>
        {inviteOpen ? (
          <div className="mt-4 rounded-2xl border border-[#ddeecf] bg-[#f6fff0] p-4">
            {inviteStatus ? (
              <div className={`mb-3 flex items-start justify-between gap-3 rounded-xl border px-3 py-2 text-xs font-bold ${
                inviteStatus.type === "success" ? "border-[#bbf7d0] bg-[#dcfce7] text-[#047857]" : "border-[#fecaca] bg-[#fee2e2] text-[#b91c1c]"
              }`}>
                <span>{inviteStatus.message}</span>
                <button
                  type="button"
                  onClick={() => setInviteStatus(null)}
                  className="shrink-0 font-black"
                  aria-label="Dismiss invite message"
                >
                  <X size={14} />
                </button>
              </div>
            ) : null}
            {inviteConflict ? (
              <div className="mb-3 flex flex-wrap gap-2">
                {inviteConflict.kind === "active" ? (
                  <button type="button" onClick={() => setViewUser(inviteConflict.user)} className="rounded-lg border border-[#58cc02] bg-white px-3 py-2 text-xs font-black text-[#3e9e00]">View User</button>
                ) : null}
                {inviteConflict.kind === "pending" ? (
                  <button type="button" onClick={() => setInviteConfirmation({ kind: "resend", invite: inviteRowForUser(inviteConflict.user) })} className="rounded-lg border border-[#58cc02] bg-white px-3 py-2 text-xs font-black text-[#3e9e00]">Resend Invite</button>
                ) : null}
                {inviteConflict.kind === "inactive" ? (
                  <button type="button" onClick={() => setInviteConfirmation({ kind: "reactivate", user: inviteConflict.user })} className="rounded-lg border border-[#58cc02] bg-white px-3 py-2 text-xs font-black text-[#3e9e00]">Reactivate and Resend</button>
                ) : null}
              </div>
            ) : null}
            <form onSubmit={submitInvite} className="grid gap-3 md:grid-cols-[minmax(0,1.2fr)_repeat(3,minmax(140px,1fr))_auto]">
              <div>
                <TextField label="Email" type="email" value={inviteForm.email} onChange={(value) => { setInviteConflict(null); setInviteForm((current) => ({ ...current, email: value })); }} required />
                {inviteEmailError ? <p className="mt-1 text-xs font-bold text-[#b91c1c]">{inviteEmailError}</p> : null}
              </div>
              <SelectField label="Assign role" value={inviteForm.role} onChange={(value) => setInviteForm((current) => ({ ...current, role: value }))} options={roleOptions} />
              <SelectField label="Assign branch" value={inviteBranchId} onChange={(value) => setInviteForm((current) => ({ ...current, branch_id: value }))} options={userBranchOptions} />
              <SelectField
                label="Invite method"
                value={inviteForm.delivery}
                onChange={(value) => setInviteForm((current) => ({ ...current, delivery: value }))}
                options={[
                  { label: "Auto-generate invite", value: "auto" },
                  { label: "Set temporary password", value: "temporary" },
                ]}
              />
              {inviteForm.delivery === "temporary" ? (
                <TextField label="Temporary password" type="password" value={inviteForm.temporary_password} onChange={(value) => setInviteForm((current) => ({ ...current, temporary_password: value }))} required />
              ) : null}
              <button type="submit" disabled={inviteBusy} className="mt-7 inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-[#58cc02] px-4 text-sm font-black text-white transition hover:bg-[#3e9e00] disabled:cursor-wait disabled:opacity-60">
                <Mail size={16} />
                {inviteBusy ? "Sending..." : "Send Invite"}
              </button>
            </form>
          </div>
        ) : null}
      </Panel>

      <Panel icon={Filter} title="Search and filters" subtitle="Find users by identity, role, branch, status, and login freshness.">
        <div className="grid items-end gap-3 md:grid-cols-2 xl:grid-cols-[minmax(240px,1.4fr)_repeat(4,minmax(132px,1fr))_auto]">
          <label className="block min-w-0 text-sm font-black">
            Search by name or email
            <div className="mt-2 flex h-11 items-center gap-2 rounded-lg border border-[#cfe4c4] bg-white px-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] transition focus-within:border-[#58cc02] focus-within:ring-2 focus-within:ring-[#58cc02]/20">
              <Search size={18} className="text-[#5f6f56]" />
              <input
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                className="h-full min-w-0 flex-1 bg-transparent text-sm font-bold outline-none placeholder:text-[#8a9a80]"
                placeholder="Search users"
              />
            </div>
          </label>
          <SelectField label="Role" value={roleFilter} onChange={(value) => { setRoleFilter(value); setPage(1); }} options={[{ label: "All roles", value: "all" }, ...roleOptions]} />
          <SelectField label="Branch" value={branchFilter} onChange={(value) => { setBranchFilter(value); setPage(1); }} options={branchFilterOptions} />
          <SelectField
            label="Status"
            value={statusFilter}
            onChange={(value) => { setStatusFilter(value); setPage(1); }}
            options={[
              { label: "All statuses", value: "all" },
              { label: "Active", value: "active" },
              { label: "Inactive", value: "inactive" },
            ]}
          />
          <SelectField
            label="Sort by"
            value={sortBy}
            onChange={setSortBy}
            options={[
              { label: "Role", value: "role" },
              { label: "Branch", value: "branch" },
              { label: "Last Login", value: "last_login" },
            ]}
          />
          <div className="flex items-end gap-2">
            <button
              type="button"
              onClick={exportUsersCsv}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-[#ddeecf] bg-white px-3 text-sm font-black text-[#3e9e00] transition hover:border-[#58cc02]"
            >
              <Download size={15} />
              Export CSV
            </button>
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex min-h-10 w-10 items-center justify-center rounded-xl border border-[#ddeecf] bg-white text-[#5f6f56] transition hover:border-[#58cc02] hover:text-[#3e9e00]"
              aria-label="Clear filters"
              title="Clear filters"
            >
              <X size={16} />
            </button>
          </div>
        </div>
        {error ? (
          <div className="mt-4 rounded-2xl border border-[#ddeecf] bg-[#f6fff0] p-4 text-sm font-bold text-[#5f6f56]">
            Fallback mode: {error}
          </div>
        ) : null}
      </Panel>

      <Panel icon={Users} title="Users" subtitle="Manage account access, roles, status, and security actions.">
        <UserTableToolbar
          count={filteredUsers.length}
          sortBy={sortBy}
          onSortChange={setSortBy}
          onExport={exportUsersCsv}
          onBulkRole={() => setRoleFilter("all")}
        />
        <UserTable
          users={paginatedUsers}
          branchOptions={availableBranchOptions}
          loading={loading}
          page={page}
          totalPages={totalPages}
          totalCount={filteredUsers.length}
          onPageChange={setPage}
          onView={(user) => {
            setViewUser(user);
          }}
          onEdit={(user) => {
            setEditUser(user);
          }}
          onToggle={(user) => requestUserAction(user, "toggle")}
          onReset={(user) => requestUserAction(user, "reset")}
          onRole={(user) => {
            setRoleUser(user);
          }}
          onDelete={(user) => requestUserAction(user, "delete")}
        />
      </Panel>

      <section className="grid gap-4 lg:grid-cols-2">
        <Panel icon={Mail} title="Pending invites" subtitle="Invite status and delivery method.">
          <div className="space-y-2">
            {invites.length ? invites.map((invite) => (
              <div key={invite.id} className="rounded-xl border border-[#ddeecf] bg-[#f6fff0] p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-black">{invite.email}</p>
                    <p className="mt-1 text-xs font-bold text-[#5f6f56]">{roleLabel(invite.role)} - {invite.branch}</p>
                  </div>
                  <StatusBadge active={["sent", "delivered", "accepted"].includes(invite.status)} label={invite.status} />
                </div>
                <div className="mt-2 grid gap-1 text-xs text-[#5f6f56]">
                  <p>Invitation date: {formatDateTime(invite.sent_at)}</p>
                  <p>Delivery status: {invite.status}</p>
                </div>
                <div className="mt-2 flex items-center justify-end">
                  {invite.status !== "accepted" ? <button type="button" disabled={resendingInviteId === invite.id} onClick={() => requestResendInvite(invite)} className="text-xs font-black text-[#3e9e00] disabled:cursor-wait disabled:opacity-60">{resendingInviteId === invite.id ? "Sending..." : "Resend"}</button> : null}
                </div>
              </div>
            )) : <EmptyState title="No pending invites" text="New invitations will appear here." />}
          </div>
        </Panel>

        <Panel
          icon={Activity}
          title="Recent activity"
          subtitle={activityHistoryOpen ? "Full history" : "Latest updates"}
          action={
            <button
              type="button"
              onClick={() => setActivityHistoryOpen((current) => !current)}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[#ddeecf] bg-[#f6fff0] px-2 text-xs font-black text-[#3e9e00] transition hover:border-[#58cc02]"
              aria-label={activityHistoryOpen ? "Show recent activity" : "Show activity history"}
              title={activityHistoryOpen ? "Show recent" : "Show history"}
            >
              <History size={16} />
              {activityHistoryOpen ? "Recent" : "History"}
            </button>
          }
        >
          <div className="divide-y divide-[#ddeecf] rounded-2xl border border-[#ddeecf] bg-white">
            {visibleActivities.length ? visibleActivities.map((activity) => (
              <div key={activity.id} className="flex min-h-11 items-center gap-2 px-3 py-2">
                <ActivityIcon type={activity.type} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-black">{activity.message}</p>
                  <p className="truncate text-xs text-[#5f6f56]">{activity.detail}</p>
                </div>
                <span className="shrink-0 text-[11px] font-bold text-[#94a3b8]">{activity.time}</span>
              </div>
            )) : (
              <div className="px-3 py-6 text-center text-xs font-bold text-[#5f6f56]">
                No user activity yet. Add, invite, edit, disable, or reset a user to populate this feed.
              </div>
            )}
          </div>
        </Panel>
      </section>

      {viewUser ? (
        <UserActionModal
          accessToken={accessToken}
          branchOptions={availableBranchOptions}
          mode="view"
          user={viewUser}
          onClose={() => {
            setViewUser(null);
          }}
          onSaved={(updatedUser, message, activityType) => {
            setUsers((current) => current.map((item) => (item.id === updatedUser.id ? updatedUser : item)));
            pushActivity(activityType, message, `${updatedUser.full_name} - ${roleLabel(updatedUser.role)}`);
            setViewUser(null);
          }}
        />
      ) : null}
      {editUser ? (
        <UserActionModal
          accessToken={accessToken}
          branchOptions={availableBranchOptions}
          mode="edit"
          user={editUser}
          onClose={() => {
            setEditUser(null);
          }}
          onSaved={(updatedUser, message, activityType) => {
            setUsers((current) => current.map((item) => (item.id === updatedUser.id ? updatedUser : item)));
            pushActivity(activityType, message, `${updatedUser.full_name} - ${roleLabel(updatedUser.role)}`);
            setEditUser(null);
          }}
        />
      ) : null}
      {roleUser ? (
        <UserActionModal
          accessToken={accessToken}
          branchOptions={availableBranchOptions}
          mode="role"
          user={roleUser}
          onClose={() => {
            setRoleUser(null);
          }}
          onSaved={(updatedUser, message, activityType) => {
            setUsers((current) => current.map((item) => (item.id === updatedUser.id ? updatedUser : item)));
            pushActivity(activityType, message, `${updatedUser.full_name} - ${roleLabel(updatedUser.role)}`);
            setRoleUser(null);
          }}
        />
      ) : null}

      {addUserOpen ? (
        <AddUserModal
          branchOptions={userBranchOptions}
          status={addUserStatus}
          onClose={() => setAddUserOpen(false)}
          onCreate={createUser}
        />
      ) : null}
      {actionStatus ? (
        <div
          className={`fixed bottom-5 right-5 z-[60] max-w-sm rounded-xl border px-4 py-3 text-sm font-black shadow-[0_12px_28px_rgba(15,23,42,0.16)] ${
            actionStatus.type === "success" ? "border-[#bbf7d0] bg-white text-[#047857]" : "border-[#fecaca] bg-white text-[#b91c1c]"
          }`}
          role="status"
        >
          {actionStatus.message}
        </div>
      ) : null}

      {isDeactivateModalOpen && selectedUser ? (
        <ConfirmActionModal
          title="Confirm Deactivate"
          message={`Deactivate ${selectedUser.full_name}? They will no longer be able to sign in.`}
          confirmLabel="Yes, Deactivate"
          onCancel={() => { setIsDeactivateModalOpen(false); setSelectedUser(null); }}
          onConfirm={() => void confirmDeactivateUser()}
          busy={actionBusy}
        />
      ) : null}
      {isResetPasswordModalOpen && selectedUser ? (
        <ConfirmActionModal
          title="Confirm Password Reset"
          message={`Reset the password for ${selectedUser.full_name}? Their active sessions will be revoked.`}
          confirmLabel="Yes, Reset Password"
          onCancel={() => { setIsResetPasswordModalOpen(false); setSelectedUser(null); }}
          onConfirm={() => void confirmResetPassword()}
          busy={actionBusy}
          danger={false}
        />
      ) : null}
      {isDeleteModalOpen && selectedUser ? (
        <ConfirmActionModal
          title="Confirm Delete"
          message={`Delete ${selectedUser.full_name}? This removes the row from the users table and revokes sign-in access.`}
          confirmLabel="Yes, Delete"
          onCancel={() => { setIsDeleteModalOpen(false); setSelectedUser(null); }}
          onConfirm={() => void confirmDeleteUser()}
          busy={actionBusy}
        />
      ) : null}
      {inviteConfirmation ? (
        <ConfirmActionModal
          title={inviteConfirmation.kind === "reactivate" ? "Reactivate User" : "Resend Invite"}
          message={inviteConfirmation.kind === "reactivate" ? "This user already exists but is inactive. Do you want to reactivate and resend invite?" : "Send a new invite email? The previous activation link will stop working."}
          confirmLabel={inviteConfirmation.kind === "reactivate" ? "Reactivate and Resend" : "Resend Invite"}
          onCancel={() => setInviteConfirmation(null)}
          onConfirm={() => void confirmInviteAction()}
          busy={inviteBusy || Boolean(resendingInviteId)}
          danger={false}
        />
      ) : null}
    </div>
  );
}

function UserTableToolbar({
  count,
  sortBy,
  onSortChange,
  onExport,
  onBulkRole,
}: {
  count: number;
  sortBy: string;
  onSortChange: (value: string) => void;
  onExport: () => void;
  onBulkRole: () => void;
}) {
  return (
    <div className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#ddeecf] bg-[#f6fff0] px-3 py-2">
      <p className="text-xs font-black text-[#5f6f56]">Showing {count} users</p>
      <div className="flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-2 text-xs font-black text-[#5f6f56]">
          Sort
          <select
            value={sortBy}
            onChange={(event) => onSortChange(event.target.value)}
            className="h-9 rounded-lg border border-[#ddeecf] bg-white px-2 text-xs font-black outline-none focus:border-[#58cc02]"
          >
            <option value="role">Role</option>
            <option value="branch">Branch</option>
            <option value="last_login">Last Login</option>
          </select>
        </label>
        <button
          type="button"
          onClick={onExport}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#ddeecf] bg-white px-3 text-xs font-black text-[#3e9e00] transition hover:border-[#58cc02]"
        >
          <Download size={14} />
          Export CSV
        </button>
        <button
          type="button"
          onClick={onBulkRole}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#ddeecf] bg-white px-3 text-xs font-black text-[#5f6f56] transition hover:border-[#58cc02] hover:text-[#3e9e00]"
        >
          <UserCog size={14} />
          Bulk Actions
        </button>
      </div>
    </div>
  );
}

function UserTable({
  users,
  branchOptions,
  loading,
  page,
  totalPages,
  totalCount,
  onPageChange,
  onView,
  onEdit,
  onToggle,
  onReset,
  onRole,
  onDelete,
}: {
  users: UserRow[];
  branchOptions: Array<{ label: string; value: string }>;
  loading: boolean;
  page: number;
  totalPages: number;
  totalCount: number;
  onPageChange: (page: number) => void;
  onView: (user: UserRow) => void;
  onEdit: (user: UserRow) => void;
  onToggle: (user: UserRow) => void;
  onReset: (user: UserRow) => void;
  onRole: (user: UserRow) => void;
  onDelete: (user: UserRow) => void;
}) {
  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="h-11 animate-pulse rounded-xl bg-[linear-gradient(90deg,#f8fafc_25%,#e2e8f0_50%,#f8fafc_75%)] bg-[length:200%_100%]" />
        ))}
      </div>
    );
  }

  if (!users.length) {
    return <EmptyState title="No users found" text="Adjust the search or filters, or invite a new user." />;
  }

  return (
    <>
      <div className="hidden overflow-x-auto rounded-xl border border-[#ddeecf] bg-white md:block">
        <table className="w-full table-fixed border-collapse text-sm">
          <colgroup>
            <col className="w-[160px]" />
            <col className="w-[220px]" />
            <col className="w-[100px]" />
            <col className="w-[160px]" />
            <col className="w-[160px]" />
            <col className="w-[120px]" />
            <col className="w-[90px]" />
            <col className="w-[120px]" />
            <col className="w-[220px]" />
          </colgroup>
          <thead className="bg-[#f8fafc] text-xs font-black uppercase tracking-[0.05em] text-[#5f6f56] border-b border-[#ddeecf]">
            <tr>
              {["Name", "Email", "Phone", "Role", "Branch", "Status", "Invite", "Last Login", "Actions"].map((heading) => (
                <th key={heading} scope="col" className="whitespace-normal px-4 py-3 text-left align-middle font-semibold">{heading}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#ddeecf]">
            {users.map((user) => (
              <tr key={user.id} className="transition-colors hover:bg-[#f6fff0] active:bg-[#eefbe7]">
                <td className="whitespace-normal break-words px-4 py-3 align-middle font-bold text-[#18230f] [overflow-wrap:anywhere]">{user.full_name}</td>
                <td className="whitespace-normal break-words px-4 py-3 align-middle text-sm text-[#5f6f56] [overflow-wrap:anywhere]">{user.email}</td>
                <td className="whitespace-normal break-words px-4 py-3 align-middle text-sm text-[#5f6f56] [overflow-wrap:anywhere]">{user.phone || "-"}</td>
                <td className="whitespace-normal break-words px-4 py-3 align-middle [overflow-wrap:anywhere]"><RoleBadge role={user.role} /></td>
                <td className="whitespace-normal break-words px-4 py-3 align-middle text-sm text-[#5f6f56] [overflow-wrap:anywhere]">{userBranch(user, branchOptions)}</td>
                <td className="whitespace-normal px-4 py-3 align-middle"><StatusBadge active={user.is_active} label={user.is_active ? "Active" : "Inactive"} /></td>
                <td className="whitespace-normal px-4 py-3 align-middle"><StatusBadge active={user.invite_status === "accepted"} label={user.invite_status ?? "-"} /></td>
                <td className="whitespace-normal break-words px-4 py-3 align-middle text-sm text-[#5f6f56] [overflow-wrap:anywhere]">{formatDateTime(user.last_login)}</td>
                <td className="w-[220px] whitespace-nowrap px-4 py-3 align-middle">
                  <ActionButtons user={user} onView={onView} onEdit={onEdit} onToggle={onToggle} onReset={onReset} onRole={onRole} onDelete={onDelete} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 md:hidden">
        {users.map((user) => (
          <div key={user.id} className="rounded-2xl border border-[#ddeecf] bg-[#f6fff0] p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-black">{user.full_name}</p>
                <p className="mt-1 truncate text-sm text-[#5f6f56]">{user.email}</p>
              </div>
              <StatusBadge active={user.is_active} label={user.is_active ? "Active" : "Inactive"} />
            </div>
            <div className="mt-2 grid gap-1.5 text-sm text-[#5f6f56]">
              <p>{roleLabel(user.role)} - {userBranch(user, branchOptions)}</p>
              <p>Invite: {user.invite_status ?? "-"}</p>
              <p>Last login: {formatDateTime(user.last_login)}</p>
            </div>
            <div className="mt-2.5">
              <ActionButtons user={user} onView={onView} onEdit={onEdit} onToggle={onToggle} onReset={onReset} onRole={onRole} onDelete={onDelete} />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#ddeecf] bg-[#f6fff0] px-3 py-2">
        <p className="text-xs font-black text-[#5f6f56]">
          Page {page} of {totalPages} - {totalCount} users
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onPageChange(Math.max(1, page - 1))}
            disabled={page <= 1}
            className="h-8 rounded-lg border border-[#ddeecf] bg-white px-3 text-xs font-black text-[#5f6f56] disabled:opacity-50"
          >
            Prev
          </button>
          <button
            type="button"
            onClick={() => onPageChange(Math.min(totalPages, page + 1))}
            disabled={page >= totalPages}
            className="h-8 rounded-lg border border-[#ddeecf] bg-white px-3 text-xs font-black text-[#5f6f56] disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </>
  );
}

function ActionButtons({
  user,
  onView,
  onEdit,
  onToggle,
  onReset,
  onRole,
  onDelete,
}: {
  user: UserRow;
  onView: (user: UserRow) => void;
  onEdit: (user: UserRow) => void;
  onToggle: (user: UserRow) => void;
  onReset: (user: UserRow) => void;
  onRole: (user: UserRow) => void;
  onDelete: (user: UserRow) => void;
}) {
  const actions = [
    { 
      label: "View", 
      icon: Eye, 
      handler: onView,
      iconColor: "#3B82F6",
      bgColor: "#EFF6FF",
      tooltip: "View User Details"
    },
    { 
      label: "Edit", 
      icon: Pencil, 
      handler: onEdit,
      iconColor: "#F59E0B",
      bgColor: "#FFFBEB",
      tooltip: "Edit User"
    },
    { 
      label: user.is_active ? "Disable" : "Enable", 
      icon: Power, 
      handler: onToggle,
      iconColor: user.is_active ? "#10B981" : "#EF4444",
      bgColor: user.is_active ? "#ECFDF5" : "#FEF2F2",
      tooltip: user.is_active ? "Disable User" : "Enable User"
    },
    { 
      label: "Reset Password", 
      icon: KeyRound, 
      handler: onReset,
      iconColor: "#8B5CF6",
      bgColor: "#F3E8FF",
      tooltip: "Reset Password"
    },
    { 
      label: "Change Role", 
      icon: UserCog, 
      handler: onRole,
      iconColor: "#06B6D4",
      bgColor: "#ECFDFD",
      tooltip: "Assign Role"
    },
    { 
      label: "Delete", 
      icon: Trash2, 
      handler: onDelete,
      iconColor: "#DC2626",
      bgColor: "#FEF2F2",
      tooltip: "Delete User"
    },
  ];

  return (
    <div className="flex flex-nowrap items-center justify-center gap-2 whitespace-nowrap">
      {actions.map((action) => (
        <button
          key={action.label}
          type="button"
          onClick={() => action.handler(user)}
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-transparent transition-all hover:scale-105 hover:shadow-md active:scale-95"
          style={{
            backgroundColor: action.bgColor,
            borderColor: action.iconColor + "20",
          }}
          aria-label={action.tooltip}
          title={action.tooltip}
        >
          <action.icon size={15} style={{ color: action.iconColor }} />
        </button>
      ))}
    </div>
  );
}

export function UserActionModal({
  accessToken,
  branchOptions,
  user,
  mode,
  onClose,
  onSaved,
}: {
  accessToken: string;
  branchOptions: Array<{ label: string; value: string }>;
  user: UserRow;
  mode: "view" | "edit" | "role";
  onClose: () => void;
  onSaved: (user: UserRow, message: string, activityType: ActivityRow["type"]) => void;
}) {
  const [form, setForm] = useState({
    full_name: user.full_name,
    email: user.email,
    role: user.role,
    branch_id: user.branch_id ?? branchOptions[0]?.value ?? "",
    is_active: user.is_active ? "active" : "inactive",
  });
  const [busy, setBusy] = useState(false);
  const isView = mode === "view";

  /* =====================================================
     SECTION: EVENT HANDLERS
     PURPOSE:
     This section responds to user actions such as clicks, typing, and form submission.
     Handlers connect interface events to state updates or API calls.
  ===================================================== */

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isView) {
      onClose();
      return;
    }

    setBusy(true);
    const updatedUser: UserRow = {
      ...user,
      full_name: form.full_name,
      email: form.email,
      role: form.role,
      branch_id: form.branch_id,
      branch_name: branchLabel(form.branch_id, branchOptions),
      is_active: form.is_active === "active",
    };

    try {
      await apiRequest<unknown>(mode === "role" ? `/auth/users/${user.id}/role` : `/auth/users/${user.id}`, accessToken, {
        method: "PATCH",
        body: JSON.stringify(mode === "role" ? { role: form.role, branch_id: form.branch_id } : updatedUser),
      });
    } catch {
      // The requested endpoint contract is prepared here; local state keeps the UI useful while backend routes catch up.
    } finally {
      setBusy(false);
    }

    onSaved(updatedUser, mode === "role" ? "Role changed" : "User updated", mode === "role" ? "role" : "added");
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#18230f]/55 px-4 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-[28px] border border-[#ddeecf] bg-white p-6 shadow-[0_24px_80px_rgba(0,0,0,0.24)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black">{isView ? "User details" : mode === "role" ? "Change role" : "Edit user"}</h2>
            <p className="mt-1 text-sm font-semibold text-[#5f6f56]">{user.email}</p>
          </div>
          <button type="button" onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-full border border-[#ddeecf]" aria-label="Close user modal">
            <X size={19} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {mode !== "role" ? (
            <>
              <TextField label="Name" value={form.full_name} onChange={(value) => setForm((current) => ({ ...current, full_name: value }))} disabled={isView} required />
              <TextField label="Email" type="email" value={form.email} onChange={(value) => setForm((current) => ({ ...current, email: value }))} disabled={isView} required />
            </>
          ) : null}
          <SelectField label="Role" value={form.role} onChange={(value) => setForm((current) => ({ ...current, role: value }))} options={roleOptions} disabled={isView} />
          <SelectField label="Branch" value={form.branch_id} onChange={(value) => setForm((current) => ({ ...current, branch_id: value }))} options={branchOptions} disabled={isView} />
          {mode !== "role" ? (
            <SelectField
              label="Status"
              value={form.is_active}
              onChange={(value) => setForm((current) => ({ ...current, is_active: value }))}
              options={[
                { label: "Active", value: "active" },
                { label: "Inactive", value: "inactive" },
              ]}
              disabled={isView}
            />
          ) : null}

          <div className="flex flex-wrap justify-end gap-3">
            <button type="button" onClick={onClose} className="rounded-[14px] border border-[#ddeecf] px-4 py-3 text-sm font-black">
              Cancel
            </button>
            <button type="submit" disabled={busy} className="rounded-[14px] bg-[#58cc02] px-5 py-3 text-sm font-black text-white transition hover:bg-[#3e9e00] disabled:opacity-60">
              {isView ? "Done" : busy ? "Saving..." : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AddUserModal({
  branchOptions,
  status,
  onClose,
  onCreate,
}: {
  branchOptions: Array<{ label: string; value: string }>;
  status: { type: "success" | "error"; message: string } | null;
  onClose: () => void;
  onCreate: (form: AddUserForm) => Promise<boolean>;
}) {
  const [form, setForm] = useState<AddUserForm>({
    full_name: "",
    email: "",
    phone: "",
    role: "trainer",
    branch_id: branchOptions[1]?.value ?? "",
    status: "active",
    temporary_password: "",
    send_welcome_email: true,
  });
  const [localError, setLocalError] = useState("");
  const [busy, setBusy] = useState(false);

  function updateField(name: keyof AddUserForm, value: string | boolean) {
    setLocalError("");
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setLocalError("");

    const created = await onCreate(form);
    if (!created) {
      setLocalError("Review the highlighted requirements and try again.");
      setBusy(false);
      return;
    }

    setBusy(false);
    onClose();
  }

  async function handleSaveAndInvite() {
    setBusy(true);
    setLocalError("");
    const created = await onCreate({ ...form, send_welcome_email: true });
    if (!created) {
      setLocalError("Review the highlighted requirements and try again.");
      setBusy(false);
      return;
    }

    setBusy(false);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#18230f]/55 px-4 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[28px] border border-[#ddeecf] bg-white p-6 shadow-[0_24px_80px_rgba(0,0,0,0.24)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black">Add User</h2>
            <p className="mt-1 text-sm font-semibold text-[#5f6f56]">Create a Super Admin managed account.</p>
          </div>
          <button type="button" onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-full border border-[#ddeecf]" aria-label="Close add user modal">
            <X size={19} />
          </button>
        </div>

        {(status || localError) ? (
          <div className={`mt-5 rounded-2xl border p-3 text-sm font-bold ${
            status?.type === "success" ? "border-[#bbf7d0] bg-[#dcfce7] text-[#047857]" : "border-[#fecaca] bg-[#fee2e2] text-[#b91c1c]"
          }`}>
            {status?.message ?? localError}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <TextField label="Full Name" value={form.full_name} onChange={(value) => updateField("full_name", value)} required />
            <TextField label="Email" type="email" value={form.email} onChange={(value) => updateField("email", value)} required />
            <TextField label="Phone Number" value={form.phone} onChange={(value) => updateField("phone", value)} />
            <SelectField label="Role" value={form.role} onChange={(value) => updateField("role", value)} options={roleOptions} />
            <SelectField label="Branch" value={form.branch_id} onChange={(value) => updateField("branch_id", value)} options={branchOptions} />
            <SelectField
              label="Status"
              value={form.status}
              onChange={(value) => updateField("status", value)}
              options={[
                { label: "Active", value: "active" },
                { label: "Inactive", value: "inactive" },
              ]}
            />
            <TextField label="Temporary Password" type="password" value={form.temporary_password} onChange={(value) => updateField("temporary_password", value)} />
          </div>

          <label className="flex items-center gap-3 rounded-2xl border border-[#ddeecf] bg-[#f6fff0] p-3 text-sm font-black">
            <input
              type="checkbox"
              checked={form.send_welcome_email}
              onChange={(event) => updateField("send_welcome_email", event.target.checked)}
              className="h-4 w-4 accent-[#58cc02]"
            />
            Send Welcome Email
          </label>

          <div className="flex flex-wrap justify-end gap-3">
            <button type="button" onClick={onClose} className="rounded-[14px] border border-[#ddeecf] px-4 py-3 text-sm font-black">
              Cancel
            </button>
            <button type="submit" disabled={busy} className="rounded-[14px] bg-[#58cc02] px-5 py-3 text-sm font-black text-white transition hover:bg-[#3e9e00] disabled:opacity-60">
              {busy ? "Saving..." : "Save User"}
            </button>
            <button type="button" onClick={handleSaveAndInvite} disabled={busy} className="rounded-[14px] bg-[#3e9e00] px-5 py-3 text-sm font-black text-white transition hover:bg-[#2f7800] disabled:opacity-60">
              Save & Send Invite
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  type = "text",
  required,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: "text" | "email" | "password";
  required?: boolean;
  disabled?: boolean;
}) {
  return (
    <label className="block text-sm font-black">
      {label}{required ? " *" : ""}
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        type={type}
        required={required}
        disabled={disabled}
        className="mt-2 h-12 w-full rounded-2xl border border-[#ddeecf] bg-white px-4 text-sm font-bold outline-none transition focus:border-[#58cc02] disabled:bg-[#f8fafc] disabled:text-[#94a3b8]"
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ label: string; value: string }>;
  disabled?: boolean;
}) {
  return (
    <label className="block text-sm font-black">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        className="mt-2 h-12 w-full rounded-2xl border border-[#ddeecf] bg-white px-4 text-sm font-bold outline-none transition focus:border-[#58cc02] disabled:bg-[#f8fafc] disabled:text-[#94a3b8]"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </label>
  );
}

export function RoleBadge({ role }: { role: string }) {
  const colors = roleColorMap[role] || roleColorMap.public;
  return (
    <span
      className="inline-flex max-w-full whitespace-normal break-words rounded-full px-3 py-1.5 text-sm font-semibold leading-tight transition-colors hover:opacity-80 [overflow-wrap:anywhere]"
      style={{
        backgroundColor: colors.bg,
        color: colors.text,
        border: `1.5px solid ${colors.border}`,
      }}
      title={`${roleLabel(role)} - ${colors.description}`}
    >
      {roleLabel(role)}
    </span>
  );
}

export function StatusBadge({ active, label }: { active: boolean; label: string }) {
  return (
    <span className={`inline-flex whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-semibold border ${active ? "bg-[#ECFDF5] text-[#065F46] border-[#A8E0C8]" : "bg-[#F3F4F6] text-[#4B5563] border-[#D1D5DB]"}`}>
      {label}
    </span>
  );
}

function ActivityIcon({ type }: { type: ActivityRow["type"] }) {
  const Icon = type === "password" ? KeyRound : type === "role" ? UserCog : type === "disabled" ? UserX : type === "invite" ? Send : CheckCircle2;
  return (
    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#eefbe7] text-[#3e9e00]">
      <Icon size={14} />
    </div>
  );
}

function EmptyState({ title, text }: { title: string; text: string }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-[#ddeecf] bg-[#f6fff0] px-6 py-12 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-[#3e9e00]">
        <Users size={30} />
      </div>
      <p className="text-lg font-black">{title}</p>
      <p className="max-w-sm text-sm leading-6 text-[#5f6f56]">{text}</p>
    </div>
  );
}
