export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

const configuredApiUrl = import.meta.env.VITE_API_URL;
if (import.meta.env.PROD && !configuredApiUrl) {
  throw new Error("VITE_API_URL must be set for production builds.");
}
const API_BASE_URL = (configuredApiUrl || "http://localhost:3001")
  .replace(/\/+$/, "");

export async function request(path, { body, ...options } = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
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
    throw new ApiError("Respons server tidak dapat dibaca.", response.status);
  }
  if (!response.ok) {
    throw new ApiError(payload.error || "Permintaan gagal.", response.status);
  }
  return payload;
}

export const studentApi = {
  getRegistrationOptions: (schoolId) => request(
    `/api/public/registration-options${schoolId ? `?schoolId=${encodeURIComponent(schoolId)}` : ""}`,
  ),
  getSession: () => request("/api/auth/me"),
  login: (body) => request("/api/auth/login", { method: "POST", body }),
  register: (body) => request("/api/auth/register", { method: "POST", body }),
  logout: () => request("/api/auth/logout", { method: "POST", body: {} }),
  getProfile: () => request("/api/student/profile"),
  updateProfile: (body) => request("/api/student/profile", { method: "PUT", body }),
  getExams: () => request("/api/student/exams"),
  getExam: (id) => request(`/api/student/exams/${encodeURIComponent(id)}`),
  getQuestions: (id, attemptId) => request(
    `/api/student/exams/${encodeURIComponent(id)}/questions?attemptId=${encodeURIComponent(attemptId)}`,
  ),
  startExam: (id, code) => request(
    `/api/student/exams/${encodeURIComponent(id)}/start`,
    { method: "POST", body: { code } },
  ),
  saveAnswer: (id, body) => request(
    `/api/student/exams/${encodeURIComponent(id)}/save-answer`,
    { method: "POST", body },
  ),
  submitExam: (id, body) => request(
    `/api/student/exams/${encodeURIComponent(id)}/submit`,
    { method: "POST", body },
  ),
  reportExamActivity: (id, body) => request(
    `/api/student/exams/${encodeURIComponent(id)}/activity`,
    { method: "POST", body },
  ),
  getResults: () => request("/api/student/results"),
  getResult: (id) => request(`/api/student/results/${encodeURIComponent(id)}`),
  requestRemedial: (id) => request(
    `/api/student/results/${encodeURIComponent(id)}/remedial`,
    { method: "POST", body: {} },
  ),
};
