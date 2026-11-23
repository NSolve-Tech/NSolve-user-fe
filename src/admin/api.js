const configuredApiUrl = import.meta.env.VITE_API_URL;
const apiBaseUrl = import.meta.env.PROD
  ? ""
  : (configuredApiUrl || "http://localhost:3001").replace(/\/+$/, "");
let activeSchoolId = "";

export function setAdminSchoolId(schoolId) {
  activeSchoolId = schoolId ?? "";
}

function scopeAdminPath(path) {
  if (!activeSchoolId || path === "/api/admin/schools" ||
      path.startsWith("/api/admin/schools/") ||
      path.startsWith("/api/admin/profile")) return path;
  const [pathname, query = ""] = path.split("?", 2);
  const params = new URLSearchParams(query);
  if (params.has("schoolId")) return path;
  params.set("schoolId", activeSchoolId);
  return `${pathname}?${params.toString()}`;
}

export async function request(path, { body, ...options } = {}) {
  const response = await fetch(`${apiBaseUrl}${scopeAdminPath(path)}`, {
    credentials: "include",
    ...options,
    headers: {
      ...(body === undefined ? {} : { "content-type": "application/json" }),
      ...options.headers,
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  let payload;
  try {
    payload = await response.json();
  } catch {
    throw new Error("Respons server tidak dapat dibaca.");
  }
  if (!response.ok) throw new Error(payload.error || "Permintaan gagal.");
  return payload;
}

export const adminApi = {
  session: () => request("/api/auth/me"),
  login: (body) => request("/api/auth/login", { method: "POST", body }),
  logout: () => request("/api/auth/logout", { method: "POST", body: {} }),
  schools: () => request("/api/admin/schools"),
  createSchool: (body) => request("/api/admin/schools", { method: "POST", body }),
  updatePlatformSchool: (id, body) => request(
    `/api/admin/schools/${encodeURIComponent(id)}`, { method: "PUT", body },
  ),
  deleteSchool: (id) => request(
    `/api/admin/schools/${encodeURIComponent(id)}`, { method: "DELETE" },
  ),
  users: (role) => request(`/api/admin/users${role ? `?role=${role}` : ""}`),
  createUser: (body) => request("/api/admin/users", { method: "POST", body }),
  resetPassword: (id) => request(
    `/api/admin/users/${encodeURIComponent(id)}/reset-password`,
    { method: "POST", body: {} },
  ),
  passwordResetLogs: (id) => request(
    `/api/admin/users/${encodeURIComponent(id)}/password-resets`,
  ),
  updateUser: (id, body) => request(`/api/admin/users/${encodeURIComponent(id)}`, { method: "PUT", body }),
  deleteUser: (id) => request(`/api/admin/users/${encodeURIComponent(id)}`, { method: "DELETE" }),
  classes: () => request("/api/admin/classes"),
  saveClass: (id, body) => request(`/api/admin/classes${id ? `/${encodeURIComponent(id)}` : ""}`, {
    method: id ? "PUT" : "POST", body,
  }),
  deleteClass: (id) => request(`/api/admin/classes/${encodeURIComponent(id)}`, { method: "DELETE" }),
  subjects: () => request("/api/admin/subjects"),
  saveSubject: (id, body) => request(`/api/admin/subjects${id ? `/${encodeURIComponent(id)}` : ""}`, {
    method: id ? "PUT" : "POST", body,
  }),
  deleteSubject: (id) => request(`/api/admin/subjects/${encodeURIComponent(id)}`, { method: "DELETE" }),
  exams: () => request("/api/admin/exams"),
  updateExamToken: (id, code) => request(
    `/api/admin/exams/${encodeURIComponent(id)}/token`,
    { method: "PUT", body: { code } },
  ),
  school: () => request("/api/admin/school"),
  updateSchool: (body) => request("/api/admin/school", { method: "PUT", body }),
  updateProfile: (body) => request("/api/admin/profile", { method: "PUT", body }),
  activity: () => request("/api/admin/exam-activity"),
};
