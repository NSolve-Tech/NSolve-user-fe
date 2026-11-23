import { request } from "./student-api.js";

export const teacherApi = {
  getDashboard: () => request("/api/teacher/dashboard"),
  getProfile: () => request("/api/teacher/profile"),
  updateProfile: (data) => request("/api/teacher/profile", { method: "PUT", body: data }),
  getQuestions: (filters = {}) => {
    const query = new URLSearchParams(
      Object.entries(filters).filter(([, value]) => value),
    );
    return request(`/api/teacher/questions${query.size ? `?${query}` : ""}`);
  },
  getQuestion: (id) => request(`/api/teacher/questions/${encodeURIComponent(id)}`),
  createQuestion: (data) => request("/api/teacher/questions", { method: "POST", body: data }),
  updateQuestion: (id, data) => request(
    `/api/teacher/questions/${encodeURIComponent(id)}`,
    { method: "PUT", body: data },
  ),
  deleteQuestion: (id) => request(
    `/api/teacher/questions/${encodeURIComponent(id)}`,
    { method: "DELETE" },
  ),
  importQuestions: (questions) => request(
    "/api/teacher/questions/import",
    { method: "POST", body: { questions } },
  ),
  getClasses: () => request("/api/teacher/classes"),
  getAvailableClasses: () => request("/api/teacher/available-classes"),
  getParticipants: () => request("/api/teacher/participants"),
  getResults: () => request("/api/teacher/results"),
  getRemedialRequests: () => request("/api/teacher/remedial-requests"),
  updateRemedialRequest: (id, status) => request(
    `/api/teacher/remedial-requests/${encodeURIComponent(id)}`,
    { method: "PUT", body: { status } },
  ),
  scheduleRemedialRequest: (id, examId) => request(
    `/api/teacher/remedial-requests/${encodeURIComponent(id)}/schedule`,
    { method: "POST", body: { examId } },
  ),
  getExams: () => request("/api/teacher/exams"),
  getExam: (id) => request(`/api/teacher/exams/${encodeURIComponent(id)}`),
  createExam: (data) => request("/api/teacher/exams", { method: "POST", body: data }),
  updateExam: (id, data) => request(
    `/api/teacher/exams/${encodeURIComponent(id)}`,
    { method: "PUT", body: data },
  ),
  updateExamToken: (id, code) => request(
    `/api/teacher/exams/${encodeURIComponent(id)}/token`,
    { method: "PUT", body: { code } },
  ),
  deleteExam: (id) => request(
    `/api/teacher/exams/${encodeURIComponent(id)}`,
    { method: "DELETE" },
  ),
  publishExam: (id, data) => request(
    `/api/teacher/exams/${encodeURIComponent(id)}/publish`,
    { method: "POST", body: data },
  ),
  getAnalytics: (id) => request(
    `/api/teacher/exams/${encodeURIComponent(id)}/analytics`,
  ),
};
