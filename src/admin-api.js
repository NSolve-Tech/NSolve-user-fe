import { request } from "./student-api.js";

let activeSchoolId = "";

export function setAdminSchoolId(schoolId) {
  activeSchoolId = schoolId ?? "";
}

function scopedPath(path) {
  if (!activeSchoolId || path === "/api/admin/schools") return path;
  const [pathname, query = ""] = path.split("?", 2);
  const params = new URLSearchParams(query);
  if (params.has("schoolId")) return path;
  params.set("schoolId", activeSchoolId);
  return `${pathname}?${params.toString()}`;
}

function adminRequest(path, options) {
  return request(scopedPath(path), options);
}

export const adminApi = {
  getSchools: () => request("/api/admin/schools"),
  getTeacherAssignments: () => adminRequest("/api/admin/teacher-assignments"),
  setTeacherClasses: (teacherId, classIds) => adminRequest(
    `/api/admin/teachers/${encodeURIComponent(teacherId)}/classes`,
    { method: "PUT", body: { classIds } },
  ),
  getExamActivity: () => adminRequest("/api/admin/exam-activity"),
};
