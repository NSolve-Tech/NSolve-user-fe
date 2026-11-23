import React, { useEffect, useMemo, useState } from "react";
import mammoth from "mammoth";
import { adminApi, setAdminSchoolId } from "./admin-api.js";
import Brand from "./Brand.jsx";
import {
  IMPORTED_EXAM_QUESTIONS_KEY,
  mapImportedQuestionsToExamDraft,
  parseImportedQuestions,
} from "./question-import.js";
import { teacherApi } from "./teacher-api.js";
import "./teacher-pages.css";

const questionTypes = [
  ["multiple_choice", "Pilihan Ganda"],
  ["multiple_choice_complex", "Pilihan Ganda Kompleks"],
  ["true_false", "Benar / Salah"],
  ["matching", "Menjodohkan"],
  ["short_answer", "Isian Singkat"],
  ["essay", "Essay"],
];
const typeNames = Object.fromEntries(questionTypes);
const difficultyNames = { mudah: "Mudah", sedang: "Sedang", sulit: "Sulit" };

function TeacherIcon({ name }) {
  const paths = {
    dashboard: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
    questions: <><path d="M5 4h14v16H5z" /><path d="M9 8h6M9 12h6M9 16h4" /></>,
    import: <><path d="M12 15V3m0 0L8 7m4-4 4 4" /><path d="M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6" /></>,
    create: <><path d="M12 5v14M5 12h14" /><circle cx="12" cy="12" r="9" /></>,
    exam: <><rect x="5" y="3" width="14" height="18" rx="2" /><path d="M9 8h6M9 12h6M9 16h4" /></>,
    students: <><circle cx="9" cy="8" r="3" /><path d="M3 20v-1a6 6 0 0 1 12 0v1M16 5a3 3 0 0 1 0 6M18 14a5 5 0 0 1 3 5v1" /></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M7 3v4M17 3v4M3 10h18" /></>,
    chart: <><path d="M4 20V11M10 20V5M16 20V8M22 20H2" /></>,
    school: <><path d="m3 9 9-5 9 5M5 10v8M9 10v8M15 10v8M19 10v8M3 20h18" /></>,
    search: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 5 5" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    eye: <><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" /><circle cx="12" cy="12" r="2.5" /></>,
    bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M10 21h4" /></>,
    arrow: <path d="M4 12h15m-6-6 6 6-6 6" />,
    back: <><path d="m15 18-6-6 6-6" /><path d="M9 12h12" /></>,
    logout: <><path d="M10 17l5-5-5-5M15 12H3" /><path d="M12 3h7a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-7" /></>,
  };
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {paths[name]}
    </svg>
  );
}

export function TeacherShell({
  active,
  user,
  onLogout,
  children,
  navigation,
  workspaceLabel,
  roleDescription,
  adminSchools,
  selectedSchoolId,
  onAdminSchoolChange,
}) {
  const logout = onLogout ?? user?.onLogout;
  const isAdmin = user?.role === "admin";
  const [profile, setProfile] = useState(null);
  const [profileError, setProfileError] = useState("");
  const [remedialRequests, setRemedialRequests] = useState([]);
  const [remedialLoaded, setRemedialLoaded] = useState(false);
  const [remedialError, setRemedialError] = useState("");
  const [remedialOpen, setRemedialOpen] = useState(false);
  const [remedialBusy, setRemedialBusy] = useState("");
  useEffect(() => {
    if (user?.role !== "teacher") return undefined;
    let activeRequest = true;
    teacherApi.getProfile()
      .then(({ teacher }) => { if (activeRequest) setProfile(teacher); })
      .catch((requestError) => { if (activeRequest) setProfileError(requestError.message); });
    return () => { activeRequest = false; };
  }, [user?.role]);
  useEffect(() => {
    if (user?.role !== "teacher") return undefined;
    let active = true;
    let timerId;
    async function loadRemedialRequests() {
      try {
        const { requests } = await teacherApi.getRemedialRequests();
        if (active) {
          setRemedialRequests(requests);
          setRemedialError("");
        }
      } catch (requestError) {
        if (active) setRemedialError(requestError.message);
      } finally {
        if (active) {
          setRemedialLoaded(true);
          timerId = window.setTimeout(loadRemedialRequests, 30_000);
        }
      }
    }
    loadRemedialRequests();
    return () => {
      active = false;
      window.clearTimeout(timerId);
    };
  }, [user?.role]);

  async function updateRemedialRequest(requestId, status) {
    setRemedialBusy(requestId);
    setRemedialError("");
    try {
      await teacherApi.updateRemedialRequest(requestId, status);
      const { requests } = await teacherApi.getRemedialRequests();
      setRemedialRequests(requests);
    } catch (requestError) {
      setRemedialError(requestError.message);
    } finally {
      setRemedialBusy("");
    }
  }
  const displayName = profile?.fullName ?? user?.fullName ?? "Pengguna";
  const displaySubject = profile?.subject ?? "";
  const activeAdminSchool = adminSchools?.find((school) => school.id === selectedSchoolId);
  const displaySchool = activeAdminSchool?.name ?? profile?.schoolName ?? user?.schoolName ?? "Sekolah";
  const initials = displayName
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
  const links = navigation ?? (isAdmin
    ? [
      ["Dashboard", "/guru", "dashboard"],
      ["Penugasan Guru", "/guru/penugasan-guru", "students"],
      ["Pengawasan Ujian", "/guru/pengawasan-ujian", "chart"],
    ]
    : [
      ["Dashboard", "/guru", "dashboard"],
      ["Soal", "/guru/soal", "questions"],
      ["Jadwal Ujian", "/guru/jadwal-ujian", "calendar"],
      ["Peserta", "/guru/peserta-ujian", "students"],
      ["Hasil Ujian", "/guru/hasil-ujian", "chart"],
      ["Data Kelas", "/guru/data-kelas", "school"],
      ["Profil", "/guru/profil", "create"],
    ]);
  const workspace = workspaceLabel ?? (isAdmin ? "WORKSPACE ADMIN" : user?.role === "student" ? "PORTAL SISWA" : "WORKSPACE GURU");
  const accountDescription = roleDescription ?? (isAdmin ? "Administrator" : user?.role === "student" ? "Siswa" : [profile?.positionTitle ?? "Guru", displaySubject].filter(Boolean).join(" "));
  const pendingRemedialCount = remedialRequests.filter((request) => request.status === "pending").length;
  return (
    <div className="teacher-app">
      <aside className="teacher-sidebar">
        <Brand />
        <div className="teacher-role-label">{workspace}</div>
        <nav aria-label={isAdmin ? "Navigasi admin" : user?.role === "student" ? "Navigasi siswa" : "Navigasi guru"}>
          {links.map(([label, href, icon]) => (
            <a className={active === label ? "active" : ""} href={href} key={label}>
              <TeacherIcon name={icon} /><span>{label}</span>
            </a>
          ))}
        </nav>
        <div className="teacher-sidebar-school">
          <TeacherIcon name="school" />
          <span>{displaySchool}</span>
        </div>
      </aside>
      <div className="teacher-main">
        <header className="teacher-header">
          <div className="teacher-header-school"><TeacherIcon name="school" />{isAdmin && adminSchools?.length
            ? <select
              className="teacher-admin-school-select"
              aria-label="Pilih sekolah yang dikelola"
              value={selectedSchoolId}
              onChange={(event) => onAdminSchoolChange(event.target.value)}
            >
              {adminSchools.map((school) => <option value={school.id} key={school.id}>{school.name}</option>)}
            </select>
            : <span>{displaySchool}</span>}</div>
          {user?.role === "teacher" && <div className="teacher-notification">
            <button
              type="button"
              className="teacher-notification-button"
              aria-label={`Notifikasi remedial${pendingRemedialCount
                ? `, ${pendingRemedialCount} pengajuan menunggu`
                : ""}`}
              aria-expanded={remedialOpen}
              onClick={() => setRemedialOpen((open) => !open)}
            >
              <TeacherIcon name="bell" />
              {pendingRemedialCount > 0 && (
                <span>{pendingRemedialCount}</span>
              )}
            </button>
            {remedialOpen && <section className="teacher-notification-panel" aria-label="Pengajuan remedial">
              <header>
                <div><strong>Pengajuan remedial</strong><small>Notifikasi diperbarui otomatis</small></div>
                <button type="button" aria-label="Tutup notifikasi" onClick={() => setRemedialOpen(false)}>×</button>
              </header>
              {remedialError && <p className="teacher-notification-error" role="alert">{remedialError}</p>}
              {!remedialLoaded && <p className="teacher-notification-empty">Memuat pengajuan...</p>}
              {remedialLoaded && !remedialError && remedialRequests.length === 0 && (
                <p className="teacher-notification-empty">Belum ada pengajuan remedial.</p>
              )}
              {remedialRequests.slice(0, 8).map((request) => (
                <article className="teacher-notification-item" key={request.id}>
                  <div>
                    <strong>{request.studentName} · {request.className}</strong>
                    <small>{request.examTitle} · Nilai {Math.round(request.score)} / KKM {request.kkm}</small>
                  </div>
                  <span className={`teacher-remedial-status ${request.status}`}>{{
                    pending: "Menunggu",
                    approved: "Disetujui",
                    rejected: "Ditolak",
                    scheduled: "Terjadwal",
                  }[request.status] ?? request.status}</span>
                  {request.status === "pending" && <div className="teacher-notification-actions">
                    <button
                      type="button"
                      className="teacher-primary-button"
                      disabled={remedialBusy === request.id}
                      onClick={() => updateRemedialRequest(request.id, "approved")}
                    >Setujui</button>
                    <button
                      type="button"
                      className="teacher-secondary-button"
                      disabled={remedialBusy === request.id}
                      onClick={() => updateRemedialRequest(request.id, "rejected")}
                    >Tolak</button>
                  </div>}
                  {request.status === "approved" && <div className="teacher-notification-actions">
                    <a className="teacher-secondary-button" href={`/guru/soal/baru?remedialRequestId=${encodeURIComponent(request.id)}&remedialMode=new`}>Buat soal baru</a>
                    <a className="teacher-primary-button" href={`/guru/soal/baru?remedialRequestId=${encodeURIComponent(request.id)}&remedialMode=repeat`}>Ulangi soal sebelumnya</a>
                  </div>}
                  {request.status === "scheduled" && request.scheduledExamTitle && (
                    <small className="teacher-notification-scheduled">Ujian: {request.scheduledExamTitle}</small>
                  )}
                </article>
              ))}
            </section>}
          </div>}
          <div className="teacher-account">
            <span><strong>{displayName}</strong><small>{accountDescription}</small></span>
            <i>{initials}</i>
            <button type="button" onClick={logout} aria-label="Keluar">
              <TeacherIcon name="logout" /><span>Keluar</span>
            </button>
          </div>
        </header>
        <main className="teacher-content">
          {profileError && <div className="teacher-alert error" role="alert">{profileError}</div>}
          {children}
        </main>
      </div>
    </div>
  );
}

function PageTitle({ eyebrow, title, description, action }) {
  return (
    <div className="teacher-page-title">
      <div>
        {eyebrow && <span>{eyebrow}</span>}
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {action}
    </div>
  );
}

function AdminWorkspace({ user, path }) {
  const [schools, setSchools] = useState([]);
  const [selectedSchoolId, setSelectedSchoolId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    adminApi.getSchools()
      .then(({ schools: values }) => {
        if (!active) return;
        setSchools(values);
        const selected = values.find((school) => school.id === user.schoolId) ?? values[0];
        if (!selected) {
          setError("Belum ada sekolah yang dapat dikelola.");
          return;
        }
        setAdminSchoolId(selected.id);
        setSelectedSchoolId(selected.id);
      })
      .catch((requestError) => { if (active) setError(requestError.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [user.schoolId]);

  function changeSchool(schoolId) {
    setAdminSchoolId(schoolId);
    setSelectedSchoolId(schoolId);
  }

  const shellProps = {
    user,
    adminSchools: schools,
    selectedSchoolId,
    onAdminSchoolChange: changeSchool,
  };
  if (loading) {
    return <TeacherShell {...shellProps}><p className="teacher-empty">Memuat daftar sekolah...</p></TeacherShell>;
  }
  if (error || !selectedSchoolId) {
    return <TeacherShell {...shellProps}><div className="teacher-alert error" role="alert">{error || "Pilih sekolah untuk melanjutkan."}</div></TeacherShell>;
  }
  return <div key={selectedSchoolId}>
    {path === "/guru/penugasan-guru"
      ? <AdminTeacherAssignments {...shellProps} />
      : <AdminDashboard {...shellProps} monitorOnly={path === "/guru/pengawasan-ujian"} />}
  </div>;
}

function AdminDashboard({
  user,
  monitorOnly = false,
  adminSchools,
  selectedSchoolId,
  onAdminSchoolChange,
}) {
  const [events, setEvents] = useState([]);
  const [error, setError] = useState("");
  const [updatedAt, setUpdatedAt] = useState(null);
  useEffect(() => {
    let active = true;
    let timer;
    async function loadActivity() {
      try {
        const response = await adminApi.getExamActivity();
        if (active) {
          setEvents(response.events);
          setError("");
          setUpdatedAt(new Date());
        }
      } catch (requestError) {
        if (active) setError(requestError.message);
      } finally {
        if (active) timer = window.setTimeout(loadActivity, 15_000);
      }
    }
    loadActivity();
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, []);

  const eventLabels = {
    tab_hidden: "Beralih dari halaman ujian",
    window_blur: "Jendela ujian kehilangan fokus",
    fullscreen_exit: "Keluar dari mode layar penuh",
    print_screen: "Tombol PrintScreen terdeteksi",
    app_closed: "Keluar atau menutup halaman ujian",
  };
  return <TeacherShell
    active={monitorOnly ? "Pengawasan Ujian" : "Dashboard"}
    user={user}
    adminSchools={adminSchools}
    selectedSchoolId={selectedSchoolId}
    onAdminSchoolChange={onAdminSchoolChange}
  >
    <PageTitle
      eyebrow={monitorOnly ? "PENGAWASAN UJIAN" : "DASHBOARD ADMIN"}
      title={monitorOnly ? "Aktivitas Ujian" : "Ringkasan Pengawasan"}
      description="Aktivitas yang dilaporkan perangkat siswa. Pemeriksaan browser bersifat best-effort dan tidak dapat mendeteksi semua cara mengambil screenshot."
    />
    {error && <div className="teacher-alert error" role="alert">{error}</div>}
    <section className="teacher-stat-grid admin-stat-grid">
      <article className="teacher-stat-card"><span className="teacher-stat-icon chart"><TeacherIcon name="eye" /></span><div><small>Aktivitas tercatat</small><strong>{events.length}</strong></div></article>
      <article className="teacher-stat-card"><span className="teacher-stat-icon exam"><TeacherIcon name="clock" /></span><div><small>Terakhir diperbarui</small><strong>{updatedAt ? updatedAt.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : "—"}</strong></div></article>
      <article className="teacher-stat-card"><span className="teacher-stat-icon students"><TeacherIcon name="students" /></span><div><small>Frekuensi pembaruan</small><strong>15 detik</strong></div></article>
    </section>
    <section className="teacher-panel admin-activity-panel">
      <div className="teacher-panel-heading"><div><span>LOG AKTIVITAS</span><h2>Notifikasi Pengawasan</h2></div></div>
      {events.length ? <div className="admin-activity-list">
        {events.map((event) => <article key={event.id}>
          <span className="admin-activity-indicator" aria-hidden="true" />
          <div><strong>{event.studentName} · {event.className ?? "Kelas tidak diketahui"}</strong><p>Pelanggaran ke-{event.violationNumber} · {eventLabels[event.eventType] ?? event.eventType} — {event.examTitle}</p></div>
          <time dateTime={event.occurredAt}>{new Date(event.occurredAt).toLocaleString("id-ID")}</time>
        </article>)}
      </div> : updatedAt
        ? <div className="teacher-empty-state"><TeacherIcon name="check" /><strong>Belum ada aktivitas yang dilaporkan</strong><span>Notifikasi baru akan muncul setelah siswa mengikuti ujian.</span></div>
        : <p className="teacher-empty">Aktivitas belum dapat dimuat.</p>}
    </section>
  </TeacherShell>;
}

function AdminTeacherAssignments({
  user,
  adminSchools,
  selectedSchoolId,
  onAdminSchoolChange,
}) {
  const [teachers, setTeachers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [selected, setSelected] = useState({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let active = true;
    adminApi.getTeacherAssignments()
      .then((response) => {
        if (!active) return;
        setTeachers(response.teachers);
        setClasses(response.classes);
        setSelected(Object.fromEntries(response.teachers.map((teacher) => [
          teacher.id,
          teacher.classes.map((item) => item.id),
        ])));
      })
      .catch((requestError) => { if (active) setError(requestError.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  async function saveAssignments(teacher) {
    setSavingId(teacher.id);
    setError("");
    setNotice("");
    try {
      const classIds = selected[teacher.id] ?? [];
      const response = await adminApi.setTeacherClasses(teacher.id, classIds);
      setTeachers(response.teachers);
      setNotice(`Penugasan kelas untuk ${teacher.fullName} berhasil disimpan.`);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSavingId("");
    }
  }

  return <TeacherShell
    active="Penugasan Guru"
    user={user}
    adminSchools={adminSchools}
    selectedSchoolId={selectedSchoolId}
    onAdminSchoolChange={onAdminSchoolChange}
  >
    <PageTitle eyebrow="ADMINISTRASI SEKOLAH" title="Penugasan Kelas Guru" description="Pilih kelas yang boleh dikelola dan dituju oleh setiap guru." />
    {error && <div className="teacher-alert error" role="alert">{error}</div>}
    {notice && <div className="teacher-alert success" role="status">{notice}</div>}
    {loading ? <p className="teacher-empty">Memuat daftar guru dan kelas...</p> : error ? null : teachers.length ? (
      <div className="admin-assignment-list">
        {teachers.map((teacher) => <section className="teacher-panel admin-assignment-card" key={teacher.id}>
          <div className="teacher-panel-heading">
            <div><span>{teacher.subject || "GURU"}</span><h2>{teacher.fullName}</h2><p>{teacher.positionTitle || "Guru"}</p></div>
            <button type="button" className="teacher-primary-button" onClick={() => saveAssignments(teacher)} disabled={savingId === teacher.id}>
              {savingId === teacher.id ? "Menyimpan..." : "Simpan Kelas"}
            </button>
          </div>
          {classes.length ? <div className="admin-class-picker">
            {["X", "XI", "XII"].map((grade) => {
              const gradeClasses = classes.filter((item) =>
                (item.gradeLevel ?? item.name.split(" ")[0]) === grade,
              );
              const assignedCount = gradeClasses.filter((item) =>
                (selected[teacher.id] ?? []).includes(item.id),
              ).length;
              return <details className="admin-class-grade" key={grade}>
                <summary><strong>{grade}</strong><span>{assignedCount} dari {gradeClasses.length} kelas dipilih</span></summary>
                {gradeClasses.length ? <div className="admin-class-options">
                  {gradeClasses.map((item) => <label key={item.id}>
                    <input
                      type="checkbox"
                      checked={(selected[teacher.id] ?? []).includes(item.id)}
                      onChange={() => setSelected((current) => {
                        const currentIds = current[teacher.id] ?? [];
                        return {
                          ...current,
                          [teacher.id]: currentIds.includes(item.id)
                            ? currentIds.filter((id) => id !== item.id)
                            : [...currentIds, item.id],
                        };
                      })}
                    />
                    <span><strong>{item.name}</strong><small>{item.studentCount} siswa</small></span>
                  </label>)}
                </div> : <p className="teacher-empty">Belum ada kelas {grade} di sekolah ini.</p>}
              </details>;
            })}
          </div> : <div className="teacher-empty-state"><strong>Belum ada kelas di sekolah ini</strong></div>}
        </section>)}
      </div>
    ) : <div className="teacher-panel teacher-empty-state"><strong>Belum ada akun guru</strong><span>Guru yang terdaftar di sekolah ini akan muncul di sini.</span></div>}
  </TeacherShell>;
}

function TeacherDashboard({ user }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [requestBusy, setRequestBusy] = useState("");
  const [requestError, setRequestError] = useState("");
  useEffect(() => {
    let active = true;
    let firstLoad = true;
    async function loadDashboard() {
      try {
        const response = await teacherApi.getDashboard();
        if (active) {
          setData(response);
          setError("");
        }
      } catch (requestError) {
        if (active) setError(requestError.message);
      } finally {
        if (active && firstLoad) {
          setLoading(false);
          firstLoad = false;
        }
      }
    }
    loadDashboard();
    const timerId = window.setInterval(loadDashboard, 20_000);
    return () => {
      active = false;
      window.clearInterval(timerId);
    };
  }, []);

  async function decideRemedial(requestId, status) {
    setRequestBusy(requestId);
    setRequestError("");
    try {
      await teacherApi.updateRemedialRequest(requestId, status);
      setData(await teacherApi.getDashboard());
    } catch (error) {
      setRequestError(error.message);
    } finally {
      setRequestBusy("");
    }
  }
  const stats = data?.stats;
  return (
    <TeacherShell active="Dashboard" user={user} onLogout={user?.onLogout}>
      <PageTitle
        eyebrow="DASHBOARD GURU"
        title={`Selamat pagi, ${(data?.teacher?.fullName ?? user?.fullName ?? "Guru").split(",")[0]}`}
        description="Kelola soal, jadwal ujian, dan hasil belajar kelas Anda."
      />
      {error && <div className="teacher-alert error" role="alert">{error}</div>}
      {requestError && <div className="teacher-alert error" role="alert">{requestError}</div>}
      <section className="teacher-stat-grid" aria-label="Statistik guru">
        {[
          ["Total Soal", stats?.totalQuestions, "questions"],
          ["Total Ujian", stats?.totalExams, "exam"],
          ["Total Peserta", stats?.totalStudents, "students"],
          ["Ujian Aktif", stats?.activeExams, "calendar"],
          ["Ujian Selesai", stats?.completedExams, "chart"],
        ].map(([label, value, icon]) => (
          <article className="teacher-stat-card" key={label}>
            <span className={`teacher-stat-icon ${icon}`}><TeacherIcon name={icon} /></span>
            <div><small>{label}</small><strong>{loading ? "—" : value}</strong></div>
          </article>
        ))}
      </section>
      {loading ? (
        <p className="teacher-empty">Memuat dashboard...</p>
      ) : (
        <div className="teacher-dashboard-grid">
          <section className="teacher-panel">
            <div className="teacher-panel-heading">
              <div><span>JADWAL</span><h2>Jadwal Ujian Terdekat</h2></div>
              <a href="/guru/jadwal-ujian">Lihat Semua <TeacherIcon name="arrow" /></a>
            </div>
            {data.upcomingExams.length === 0 ? (
              <div className="teacher-empty-state"><TeacherIcon name="calendar" /><strong>Belum ada jadwal ujian</strong><span>Soal yang dibuat akan tampil di sini setelah dijadwalkan.</span></div>
            ) : data.upcomingExams.map((exam) => (
              <a className="teacher-upcoming-item" href={`/guru/ujian/${exam.id}`} key={exam.id}>
                <i><TeacherIcon name="calendar" /></i>
                <span><strong>{exam.title}</strong><small>{exam.subject} · {exam.gradeLevel} · {exam.durationMinutes} menit</small></span>
                <b className={`teacher-status ${exam.status}`}>{exam.status}</b>
              </a>
            ))}
          </section>
          <section className="teacher-panel teacher-class-panel">
            <div className="teacher-panel-heading">
              <div><span>SEKOLAH AKTIF</span><h2>Daftar Kelas</h2></div>
              <TeacherIcon name="school" />
            </div>
            {data.classes.map((item) => (
              <div className="teacher-class-row" key={item.id}>
                <span>{item.name}</span><small>{item.studentCount} siswa terdaftar</small>
              </div>
            ))}
          </section>
          {data.remedialRequests?.length > 0 && (
            <section className="teacher-panel teacher-remedial-panel">
              <div className="teacher-panel-heading">
                <div><span>PERMINTAAN SISWA</span><h2>Pengajuan Remedial</h2></div>
                <span>{data.remedialRequests.filter((item) => item.status === "pending").length} baru</span>
              </div>
              <div className="teacher-remedial-list">
                {data.remedialRequests.map((item) => (
                  <article className="teacher-remedial-request" key={item.id}>
                    <div>
                      <strong>{item.studentName} ({item.className}) mengajukan remedial</strong>
                      <small>{item.examTitle} · {item.subject} · Nilai {Math.round(item.score)} / KKM {item.kkm}</small>
                      {item.status === "scheduled" && <small>Jadwal: {item.scheduledExamTitle}</small>}
                    </div>
                    <span className={`teacher-remedial-status ${item.status}`}>{{
                      pending: "Menunggu",
                      approved: "Disetujui",
                      rejected: "Ditolak",
                      scheduled: "Terjadwal",
                    }[item.status]}</span>
                    {item.status === "pending" && <div className="teacher-remedial-actions">
                      <button type="button" className="teacher-primary-button" disabled={requestBusy === item.id} onClick={() => decideRemedial(item.id, "approved")}>Setujui</button>
                      <button type="button" className="teacher-secondary-button" disabled={requestBusy === item.id} onClick={() => decideRemedial(item.id, "rejected")}>Tolak</button>
                    </div>}
                    {item.status === "approved" && <div className="teacher-remedial-actions">
                      <a className="teacher-secondary-button" href={`/guru/soal/baru?remedialRequestId=${encodeURIComponent(item.id)}&remedialMode=new`}>Buat soal baru</a>
                      <a className="teacher-primary-button" href={`/guru/soal/baru?remedialRequestId=${encodeURIComponent(item.id)}&remedialMode=repeat`}>Ulangi soal sebelumnya</a>
                    </div>}
                  </article>
                ))}
              </div>
            </section>
          )}
          <footer className="teacher-page-footer">
            <span>© 2026 All rights reserved</span>
            <b>|</b>
            <strong>NSolve-Tech</strong>
          </footer>
        </div>
      )}
    </TeacherShell>
  );
}

function statusName(status) {
  return ({
    draft: "Draft",
    scheduled: "Dijadwalkan",
    active: "Aktif",
    completed: "Selesai",
  })[status] ?? status;
}

function QuestionBank({ user }) {
  const [questions, setQuestions] = useState([]);
  const [filters, setFilters] = useState({
    subject: "Kimia",
    gradeLevel: "",
    chapter: "",
    search: "",
    difficulty: "",
    page: 1,
  });
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    setLoading(true);
    teacherApi.getQuestions(filters)
      .then(({ questions: values, pagination: pageInfo }) => {
        if (active) {
          setQuestions(values);
          setPagination(pageInfo);
        }
      })
      .catch((requestError) => { if (active) setError(requestError.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [filters]);
  const chapters = useMemo(() => [...new Set(questions.map((question) => question.chapter))], [questions]);
  return (
    <TeacherShell active="Soal" user={user}>
      <PageTitle
        eyebrow="MATERI PEMBELAJARAN"
        title="Bank Soal"
        description="Cari dan kelola soal Kimia kelas XI."
        action={<div className="teacher-title-actions"><a className="teacher-secondary-button" href="/guru/import-soal"><TeacherIcon name="import" /> Import Soal</a><a className="teacher-primary-button" href="/guru/soal/baru"><TeacherIcon name="create" /> Tambah Soal</a></div>}
      />
      <section className="teacher-filter-panel">
        <label>Mata Pelajaran<select value="Kimia" disabled><option>Kimia</option></select></label>
        <label>Kelas<select value={filters.gradeLevel} onChange={(event) => setFilters({ ...filters, gradeLevel: event.target.value, page: 1 })}><option value="">Semua Kelas</option><option value="XI">XI</option></select></label>
        <label>Materi<select value={filters.chapter} onChange={(event) => setFilters({ ...filters, chapter: event.target.value, page: 1 })}><option value="">Semua Materi</option>{chapters.map((chapter) => <option key={chapter}>{chapter}</option>)}</select></label>
        <label>Kesulitan<select value={filters.difficulty} onChange={(event) => setFilters({ ...filters, difficulty: event.target.value, page: 1 })}><option value="">Semua tingkat</option><option value="mudah">Mudah</option><option value="sedang">Sedang</option><option value="sulit">Sulit</option></select></label>
        <label className="teacher-search"><span>Cari soal</span><div><TeacherIcon name="search" /><input value={filters.search} onChange={(event) => setFilters({ ...filters, search: event.target.value, page: 1 })} placeholder="Cari kata kunci soal..." /></div></label>
      </section>
      {error && <div className="teacher-alert error" role="alert">{error}</div>}
      <section className="teacher-panel question-bank-panel">
        <div className="teacher-panel-heading">
          <div><span>KIMIA · XI</span><h2>Daftar Soal <small>{loading ? "…" : pagination.total}</small></h2></div>
          <a className="teacher-secondary-button" href="/guru/ujian/baru">Pilih untuk paket SAS</a>
        </div>
        {loading ? <p className="teacher-empty">Memuat bank soal...</p> : questions.length === 0 ? (
          <div className="teacher-empty-state"><TeacherIcon name="questions" /><strong>Soal belum ditemukan</strong><span>Ubah filter pencarian atau tambahkan soal baru.</span><a href="/guru/soal/baru">Tambah soal Kimia</a></div>
        ) : (
          <div className="teacher-question-list">
            {questions.map((question, index) => (
              <article className="teacher-question-item" key={question.id}>
                <span className="teacher-question-number">{String((pagination.page - 1) * pagination.pageSize + index + 1).padStart(2, "0")}</span>
                <div className="teacher-question-main">
                  <div className="teacher-question-meta"><span>{question.chapter}</span><b className={`difficulty-${question.difficulty}`}>{difficultyNames[question.difficulty]}</b><small>{typeNames[question.type]}</small></div>
                  <p>{question.prompt}</p>
                  {question.options.length > 0 && <small className="teacher-option-count">{question.options.length} opsi jawaban</small>}
                </div>
                <a className="teacher-icon-button" href={`/guru/soal/${encodeURIComponent(question.id)}`} aria-label={`Lihat soal ${index + 1}`}><TeacherIcon name="eye" /></a>
              </article>
            ))}
          </div>
        )}
        {pagination.totalPages > 1 && <div className="teacher-pagination"><button type="button" className="teacher-secondary-button" disabled={pagination.page <= 1} onClick={() => setFilters({ ...filters, page: pagination.page - 1 })}>Sebelumnya</button><span>Halaman {pagination.page} dari {pagination.totalPages}</span><button type="button" className="teacher-secondary-button" disabled={pagination.page >= pagination.totalPages} onClick={() => setFilters({ ...filters, page: pagination.page + 1 })}>Berikutnya</button></div>}
      </section>
    </TeacherShell>
  );
}

function initialOptions(type) {
  if (type === "true_false") {
    return [
      { label: "Benar", content: "", isCorrect: false },
      { label: "Salah", content: "", isCorrect: false },
    ];
  }
  if (["short_answer", "essay"].includes(type)) return [];
  return ["A", "B", "C", "D"].map((label) => ({ label, content: "", isCorrect: false }));
}

function QuestionEditor({ user, questionId }) {
  const [form, setForm] = useState({
    academicYear: "2026/2027",
    subject: "",
    gradeLevel: "XI",
    chapter: "Bilangan Kuantum",
    difficulty: "sedang",
    type: "multiple_choice",
    prompt: "",
    answerKey: "",
    explanation: "",
    options: initialOptions("multiple_choice"),
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(Boolean(questionId));
  const [subjects, setSubjects] = useState([]);
  const [loadingSubjects, setLoadingSubjects] = useState(true);
  useEffect(() => {
    let active = true;
    teacherApi.getSubjects()
      .then(({ subjects: values }) => {
        if (!active) return;
        const names = values.map((subject) => subject.name);
        setSubjects(names);
        if (!questionId) {
          setForm((current) => ({
            ...current,
            subject: names.includes(current.subject) ? current.subject : names[0] ?? "",
          }));
        }
      })
      .catch((requestError) => { if (active) setError(requestError.message); })
      .finally(() => { if (active) setLoadingSubjects(false); });
    return () => { active = false; };
  }, [questionId]);
  useEffect(() => {
    if (!questionId) return undefined;
    let active = true;
    teacherApi.getQuestion(questionId)
      .then(({ question }) => {
        if (active) setForm({
          academicYear: question.academicYear,
          subject: question.subject,
          gradeLevel: question.gradeLevel,
          chapter: question.chapter,
          difficulty: question.difficulty,
          type: question.type,
          prompt: question.prompt,
          answerKey: question.answerKey,
          explanation: question.explanation,
          options: question.options.map(({ label, content, isCorrect }) => ({ label, content, isCorrect })),
        });
      })
      .catch((requestError) => { if (active) setError(requestError.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [questionId]);
  const optionType = !["short_answer", "essay"].includes(form.type);
  function changeType(type) {
    setForm({ ...form, type, options: initialOptions(type), answerKey: "" });
  }
  function updateOption(index, changes) {
    setForm({
      ...form,
      options: form.options.map((option, position) => {
        if (position !== index) return form.type === "multiple_choice" && changes.isCorrect ? { ...option, isCorrect: false } : option;
        return { ...option, ...changes };
      }),
    });
  }
  function addOption() {
    if (form.options.length >= 10) return;
    const label = String.fromCharCode(65 + form.options.length);
    setForm({ ...form, options: [...form.options, { label, content: "", isCorrect: false }] });
  }
  async function submit(event) {
    event.preventDefault();
    setError("");
    setSaving(true);
    try {
      if (questionId) await teacherApi.updateQuestion(questionId, form);
      else await teacherApi.createQuestion(form);
      window.location.assign("/guru/bank-soal");
    } catch (requestError) {
      setError(requestError.message);
      setSaving(false);
    }
  }
  return (
    <TeacherShell active="Soal" user={user}>
      <PageTitle eyebrow="BANK SOAL · KIMIA" title={questionId ? "Edit Soal" : "Tambah Soal"} description="Soal akan tersimpan di bank soal sekolah dan dapat digunakan ulang." />
      {error && <div className="teacher-alert error" role="alert">{error}</div>}
      {loading ? <p className="teacher-empty">Memuat soal...</p> : (
      <form className="teacher-form-layout" onSubmit={submit}>
        <section className="teacher-panel teacher-form-panel">
          <div className="teacher-panel-heading"><div><span>INFORMASI SOAL</span><h2>Detail Materi</h2></div><b className="teacher-required-note">* Wajib diisi</b></div>
          <div className="teacher-form-grid">
            <label>Sekolah<input value={user?.schoolName ?? "Sekolah"} disabled /></label>
            <label>Tahun Ajaran<input value={form.academicYear} onChange={(event) => setForm({ ...form, academicYear: event.target.value })} required /></label>
            <label>Mata Pelajaran<select value={form.subject} onChange={(event) => setForm({ ...form, subject: event.target.value })} required>
              <option value="" disabled>{loadingSubjects ? "Memuat mata pelajaran..." : "Pilih mata pelajaran"}</option>
              {subjects.map((subject) => <option key={subject} value={subject}>{subject}</option>)}
            </select></label>
            <label>Kelas<select value={form.gradeLevel} onChange={(event) => setForm({ ...form, gradeLevel: event.target.value })}><option value="XI">XI</option></select></label>
            <label>Bab<input value={form.chapter} onChange={(event) => setForm({ ...form, chapter: event.target.value })} required /></label>
            <label>Tingkat Kesulitan<select value={form.difficulty} onChange={(event) => setForm({ ...form, difficulty: event.target.value })}><option value="mudah">Mudah</option><option value="sedang">Sedang</option><option value="sulit">Sulit</option></select></label>
            <label className="teacher-form-full">Tipe Soal<select value={form.type} onChange={(event) => changeType(event.target.value)}>{questionTypes.map(([value, name]) => <option value={value} key={value}>{name}</option>)}</select></label>
          </div>
          <label className="teacher-prompt-label">Pertanyaan<textarea rows="5" minLength="10" maxLength="4000" value={form.prompt} onChange={(event) => setForm({ ...form, prompt: event.target.value })} placeholder="Tuliskan pertanyaan Kimia dengan jelas..." required /></label>
          {optionType ? (
            <div className="teacher-options-editor">
              <div className="teacher-options-heading"><strong>Opsi Jawaban</strong><small>{form.type === "multiple_choice_complex" ? "Pilih semua jawaban benar" : "Tandai satu kunci jawaban"}</small></div>
              {form.options.map((option, index) => (
                <div className="teacher-option-edit-row" key={`${form.type}-${index}`}>
                  <span>{option.label}</span>
                  <input value={option.content} onChange={(event) => updateOption(index, { content: event.target.value })} placeholder={`Tulis opsi ${option.label}`} required />
                  <label aria-label={`Tandai ${option.label} sebagai jawaban benar`}>
                    <input type={form.type === "multiple_choice_complex" ? "checkbox" : "radio"} name="correct-option" checked={option.isCorrect} onChange={(event) => updateOption(index, { isCorrect: event.target.checked })} />
                    <span>Kunci</span>
                  </label>
                </div>
              ))}
              {form.type !== "true_false" && <button className="teacher-text-button" type="button" onClick={addOption} disabled={form.options.length >= 10}>+ Tambah opsi</button>}
            </div>
          ) : (
            <label className="teacher-prompt-label">Kunci Jawaban<textarea rows="3" value={form.answerKey} onChange={(event) => setForm({ ...form, answerKey: event.target.value })} required /></label>
          )}
          <label className="teacher-prompt-label">Pembahasan <span className="teacher-optional-label">Opsional</span><textarea rows="3" value={form.explanation} onChange={(event) => setForm({ ...form, explanation: event.target.value })} placeholder="Tuliskan pembahasan untuk membantu evaluasi." /></label>
          <div className="teacher-form-actions"><a className="teacher-secondary-button" href="/guru/bank-soal">Batal</a><button className="teacher-primary-button" type="submit" disabled={saving}>{saving ? "Menyimpan..." : "Simpan ke Bank Soal"}</button></div>
        </section>
        <aside className="teacher-panel teacher-form-help"><TeacherIcon name="questions" /><h3>Catatan Penyusunan</h3><p>Gunakan pertanyaan yang sesuai capaian pembelajaran Kimia kelas XI dan sertakan kunci jawaban yang dapat diverifikasi.</p><span>Materi saat ini: {form.chapter || "Belum ditentukan"}</span></aside>
      </form>
      )}
    </TeacherShell>
  );
}

function QuestionDetail({ user, questionId }) {
  const [question, setQuestion] = useState(null);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);
  useEffect(() => {
    let active = true;
    teacherApi.getQuestion(questionId)
      .then(({ question: value }) => { if (active) setQuestion(value); })
      .catch((requestError) => { if (active) setError(requestError.message); });
    return () => { active = false; };
  }, [questionId]);
  async function removeQuestion() {
    if (!window.confirm("Hapus soal ini dari bank soal? Soal yang sudah disalin ke paket ujian tetap ada di paket tersebut.")) return;
    setDeleting(true);
    setError("");
    try {
      await teacherApi.deleteQuestion(questionId);
      window.location.assign("/guru/bank-soal");
    } catch (requestError) {
      setError(requestError.message);
      setDeleting(false);
    }
  }
  return (
    <TeacherShell active="Soal" user={user}>
      <a className="teacher-back-link" href="/guru/bank-soal"><TeacherIcon name="back" /> Kembali ke Bank Soal</a>
      {error && <div className="teacher-alert error" role="alert">{error}</div>}
      {!question ? <p className="teacher-empty">Memuat soal...</p> : <>
        <PageTitle eyebrow={`${question.schoolName} · ${question.gradeLevel} · ${question.chapter}`} title="Detail Soal" description={`${question.subject} · ${typeNames[question.type]} · Tingkat ${difficultyNames[question.difficulty]}`} action={<div className="teacher-title-actions"><a className="teacher-secondary-button" href={`/guru/soal/${encodeURIComponent(question.id)}/edit`}>Edit</a><button type="button" className="teacher-danger-button" onClick={removeQuestion} disabled={deleting}>{deleting ? "Menghapus..." : "Hapus"}</button><a className="teacher-primary-button" href="/guru/ujian/baru">Gunakan di Paket Ujian</a></div>} />
        <section className="teacher-panel teacher-question-detail">
          <span>Pertanyaan</span>
          <h2>{question.prompt}</h2>
          {question.options.length > 0 && <div className="teacher-question-detail-options">{question.options.map((option) => <div className={option.isCorrect ? "correct" : ""} key={option.id}><b>{option.label}</b><span>{option.content}</span>{option.isCorrect && <TeacherIcon name="check" />}</div>)}</div>}
          {question.answerKey && <div className="teacher-answer-key"><b>Kunci Jawaban</b><p>{question.answerKey}</p></div>}
          {question.explanation && <div className="teacher-answer-key"><b>Pembahasan</b><p>{question.explanation}</p></div>}
        </section>
      </>}
    </TeacherShell>
  );
}

function ExamList({ user, schedule = false }) {
  const [exams, setExams] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [copiedToken, setCopiedToken] = useState("");
  useEffect(() => {
    let active = true;
    teacherApi.getExams()
      .then(({ exams: values }) => { if (active) setExams(values); })
      .catch((requestError) => { if (active) setError(requestError.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  async function removeExam(examId) {
    if (!window.confirm("Hapus paket ujian ini? Semua soal dan sumbernya dari bank (termasuk yang dipakai ulang), jawaban, hasil, aktivitas, dan permintaan remedial terkait akan dihapus permanen.")) return;
    setError("");
    try {
      await teacherApi.deleteExam(examId);
      setExams((values) => values.filter((exam) => exam.id !== examId));
    } catch (requestError) {
      setError(requestError.message);
    }
  }
  async function copyToken(code) {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedToken(code);
      setError("");
    } catch {
      setError("Token tidak dapat disalin. Salin token secara manual.");
    }
  }
  const visibleExams = exams.filter((exam) => statusFilter === "all" || exam.status === statusFilter);
  const title = schedule ? "Jadwal Ujian" : "Soal";
  const formatDate = (value, includeTime = false) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return date.toLocaleString("id-ID", includeTime
      ? { dateStyle: "medium", timeStyle: "short" }
      : { dateStyle: "medium" });
  };
  const questionTypeLabel = (exam) => {
    const types = [];
    if (exam.mcQuestionCount > 0) types.push("Pilihan Ganda");
    if (exam.essayQuestionCount > 0) types.push("Essay");
    return types.join(" & ") || "—";
  };
  return (
    <TeacherShell active={title} user={user}>
      <PageTitle
        eyebrow={schedule ? "JADWAL" : "KELOLA SOAL"}
        title={title}
        description={schedule
          ? "Pantau ujian draft, terjadwal, aktif, dan selesai."
          : "Buat ujian dengan mengetik soal atau mengimpor soal yang sudah tersedia."}
        action={schedule ? null : (
          <div className="teacher-title-actions">
            <a className="teacher-secondary-button" href="/guru/import-soal"><TeacherIcon name="import" /> Import Soal</a>
            <a className="teacher-primary-button" href="/guru/soal/baru"><TeacherIcon name="create" /> Buat Soal</a>
          </div>
        )}
      />
      {error && <div className="teacher-alert error" role="alert">{error}</div>}
      {schedule && (
        <div className="teacher-status-tabs" aria-label="Filter jadwal ujian">
          {[["all", "Semua"], ["draft", "Draft"], ["scheduled", "Terjadwal"], ["active", "Aktif"], ["completed", "Selesai"]].map(([value, label]) => (
            <button type="button" className={statusFilter === value ? "active" : ""} key={value} onClick={() => setStatusFilter(value)}>
              {label}{value !== "all" && <span>{exams.filter((exam) => exam.status === value).length}</span>}
            </button>
          ))}
        </div>
      )}
      {loading ? <p className="teacher-empty">Memuat {title.toLowerCase()}...</p> : exams.length === 0 ? (
        <div className="teacher-panel teacher-empty-state">
          <TeacherIcon name="exam" />
          <strong>{schedule ? "Belum ada jadwal ujian" : "Belum ada soal"}</strong>
          <span>{schedule ? "Ujian terjadwal dan aktif akan tampil di halaman ini." : "Mulai dengan mengetik soal atau mengimpor soal dari file."}</span>
          {!schedule && <a className="teacher-primary-button" href="/guru/soal/baru">Buat Soal</a>}
        </div>
      ) : (
        <section className="teacher-panel teacher-table-panel">
          {!schedule && (
            <section className="teacher-filter-panel teacher-exam-status-filter">
              <label>Status
                <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                  <option value="all">Semua status</option>
                  <option value="draft">Draft</option>
                  <option value="scheduled">Terjadwal</option>
                  <option value="active">Aktif</option>
                  <option value="completed">Selesai</option>
                </select>
              </label>
            </section>
          )}
          <div className="teacher-table-scroll">
            <table>
              <thead>
                <tr>
                  {schedule ? (
                    <>
                      <th>Judul</th><th>Soal</th><th>Mata Pelajaran</th><th>Tipe Soal</th>
                      <th>Kelas Tujuan</th><th>Status</th><th>Tanggal Dibuat</th>
                      <th>Tanggal Mulai</th><th>Tanggal Selesai</th><th>Token</th>
                    </>
                  ) : (
                    <>
                      <th>Judul Soal</th><th>Mata Pelajaran</th><th>Tipe Soal</th>
                      <th>Kelas Tujuan</th><th>Status</th><th>Tanggal Publish</th><th>Aksi</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {visibleExams.map((exam) => (
                  <tr key={exam.id}>
                    {schedule ? (
                      <>
                        <td><a className="teacher-table-title" href={`/guru/ujian/${exam.id}?from=schedule`}>{exam.title}</a></td>
                        <td>{exam.questionCount} soal</td>
                        <td>{exam.subject}</td>
                        <td>{questionTypeLabel(exam)}</td>
                        <td>{exam.classes?.map((item) => item.name).join(", ") || "—"}</td>
                        <td><b className={`teacher-status ${exam.status}`}>{statusName(exam.status)}</b></td>
                        <td>{formatDate(exam.createdAt)}</td>
                        <td>{formatDate(exam.opensAt, true)}</td>
                        <td>{formatDate(exam.closesAt, true)}</td>
                        <td>{exam.publishedAt && exam.code && !exam.code.startsWith("DRAFT-")
                          ? <div className="teacher-table-token"><code>{exam.code}</code><button type="button" className="teacher-secondary-button" onClick={() => copyToken(exam.code)}>{copiedToken === exam.code ? "Tersalin" : "Salin Token"}</button></div>
                          : <span>Belum dipublish</span>}</td>
                      </>
                    ) : (
                      <>
                        <td>{exam.title}</td>
                        <td>{exam.subject}</td>
                        <td>{questionTypeLabel(exam)}</td>
                        <td>{exam.classes?.map((item) => item.name).join(", ") || "—"}</td>
                        <td><b className={`teacher-status ${exam.status}`}>{statusName(exam.status)}</b></td>
                        <td>{exam.publishedAt ? formatDate(exam.publishedAt) : "—"}</td>
                        <td className="teacher-table-actions">
                          <a className="teacher-secondary-button" href={`/guru/ujian/${exam.id}?from=soal`}>Detail</a>
                          <a className="teacher-secondary-button" href={`/guru/ujian/${exam.id}/edit?from=soal`}>Edit</a>
                          <button type="button" className="teacher-danger-button" onClick={() => removeExam(exam.id)}>Hapus</button>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
                {visibleExams.length === 0 && <tr><td colSpan={schedule ? 10 : 7} className="teacher-empty">Tidak ada ujian dengan status ini.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </TeacherShell>
  );
}

const wizardSteps = [
  "Tipe Soal",
  "Mata Pelajaran",
  "Judul",
  "Kelas",
  "Jadwal",
  "Token",
  "Input Soal",
  "Preview",
  "Publish",
];

function createQuestionDraft(type) {
  return {
    ...(type ? { type } : {}),
    prompt: "",
    options: ["", "", "", "", ""],
    correctOption: "A",
    answerKey: "",
    points: 1,
  };
}

function TeacherExamWizard({ user, examId = null, returnToSchedule = false }) {
  const isEditing = Boolean(examId);
  const remedialRequestId = new URLSearchParams(window.location.search).get("remedialRequestId");
  const remedialMode = new URLSearchParams(window.location.search).get("remedialMode") ?? "new";
  const fromImport = new URLSearchParams(window.location.search).get("fromImport") === "1";
  const [importedExamDraft] = useState(() => {
    if (!fromImport) return { questions: null, error: "" };
    try {
      const importedQuestions = sessionStorage.getItem(IMPORTED_EXAM_QUESTIONS_KEY);
      if (!importedQuestions) throw new Error("Data soal impor tidak ditemukan. Ulangi proses import.");
      return {
        questions: mapImportedQuestionsToExamDraft(JSON.parse(importedQuestions)),
        error: "",
      };
    } catch (requestError) {
      return {
        questions: null,
        error: `Soal impor tidak dapat dimuat: ${requestError.message}`,
      };
    }
  });
  const [step, setStep] = useState(0);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedClassIds, setSelectedClassIds] = useState([]);
  const [activeClassGrade, setActiveClassGrade] = useState("X");
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [loadingSubjects, setLoadingSubjects] = useState(true);
  const [loadingExam, setLoadingExam] = useState(isEditing || Boolean(remedialRequestId));
  const [saving, setSaving] = useState(false);
  const [savingToken, setSavingToken] = useState(false);
  const [tokenNotice, setTokenNotice] = useState("");
  const [error, setError] = useState(importedExamDraft.error);
  const [token, setToken] = useState("");
  const [copiedToken, setCopiedToken] = useState(false);
  const [editToken, setEditToken] = useState("");
  const [tokenMode, setTokenMode] = useState("automatic");
  const [examWasPublished, setExamWasPublished] = useState(false);
  const [publishedExam, setPublishedExam] = useState(null);
  const [savedQuestionIds, setSavedQuestionIds] = useState(null);
  const [draftExamId, setDraftExamId] = useState(null);
  const [form, setForm] = useState({
    type: "multiple_choice",
    subject: "",
    title: "",
    startMode: "now",
    opensAt: toLocalDateTime(new Date(Date.now() + 60 * 60 * 1000)),
    closesAt: toLocalDateTime(new Date(Date.now() + 3 * 60 * 60 * 1000)),
    durationMinutes: 120,
    kkm: 75,
    academicYear: "2026/2027",
    semester: "Genap",
    examType: "UH",
    visibility: "private",
    randomizeQuestions: true,
    randomizeOptions: false,
    autoGrade: true,
    showScore: true,
    questions: importedExamDraft.questions ?? [createQuestionDraft()],
  });

  useEffect(() => {
    if (fromImport) sessionStorage.removeItem(IMPORTED_EXAM_QUESTIONS_KEY);
  }, [fromImport]);

  useEffect(() => {
    let active = true;
    Promise.all([
      teacherApi.getAvailableClasses(),
      teacherApi.getSubjects(),
      isEditing ? teacherApi.getExam(examId) : Promise.resolve(null),
      remedialRequestId
        ? teacherApi.getRemedialRequests()
        : Promise.resolve({ requests: [] }),
    ])
      .then(async ([classData, subjectData, examData, remedialData]) => {
        if (!active) return;
        setSubjects(subjectData.subjects.map((subject) => subject.name));
        const availableClasses = classData.classes.filter((item) => {
          const match = item.name.match(/^(X|XI|XII) (\d{1,2})$/);
          if (!match) return false;
          const maximum = match[1] === "X" ? 12 : 11;
          return Number(match[2]) >= 1 && Number(match[2]) <= maximum;
        });
        setClasses(availableClasses);
        setActiveClassGrade(availableClasses[0]?.gradeLevel ?? availableClasses[0]?.name.split(" ")[0] ?? "X");
        if (examData) {
          const value = examData.exam;
          setSelectedClassIds(value.classes.map((item) => item.id));
          const firstSelectedClass = value.classes[0];
          if (firstSelectedClass) {
            setActiveClassGrade(firstSelectedClass.gradeLevel ?? firstSelectedClass.name.split(" ")[0]);
          }
          setExamWasPublished(Boolean(value.publishedAt));
          setEditToken(value.publishedAt ? value.code : "");
          setTokenMode(value.publishedAt ? "custom" : "automatic");
          setForm({
            type: value.questions.some((question) => question.type === "essay")
              ? "essay"
              : "multiple_choice",
            subject: value.subject,
            title: value.title,
            startMode: value.status === "active" ? "now" : "scheduled",
            opensAt: toLocalDateTime(new Date(value.opensAt)),
            closesAt: toLocalDateTime(new Date(value.closesAt)),
            durationMinutes: value.durationMinutes,
            kkm: value.kkm,
            academicYear: value.academicYear,
            semester: value.semester,
            examType: value.examType,
            visibility: value.visibility,
            randomizeQuestions: value.randomizeQuestions,
            randomizeOptions: value.randomizeOptions,
            autoGrade: value.autoGrade,
            showScore: value.showScore !== false,
            questions: value.questions.map((question) => {
              const isEssay = ["essay", "short_answer"].includes(question.type);
              return {
                type: isEssay ? "essay" : "multiple_choice",
                prompt: question.prompt,
                answerKey: question.answerKey ?? "",
                points: question.points,
                options: question.options.map((option) => option.content),
                correctOption: question.options.find((option) => option.isCorrect)?.label ?? "A",
              };
            }),
          });
        } else if (remedialRequestId) {
          const request = remedialData.requests.find((item) => item.id === remedialRequestId);
          if (request?.status !== "approved") {
            setError(request
              ? "Permintaan remedial harus disetujui sebelum membuat jadwal."
              : "Pengajuan remedial tidak ditemukan.");
            return;
          }
          if (request.status === "approved") {
            setSelectedClassIds(
              availableClasses.filter((item) => item.id === request.classId).map((item) => item.id),
            );
            const remedialClass = availableClasses.find((item) => item.id === request.classId);
            if (remedialClass) {
              setActiveClassGrade(remedialClass.gradeLevel ?? remedialClass.name.split(" ")[0]);
            }
            if (remedialMode === "repeat") {
              if (!request.examId) throw new Error("Data ujian asal tidak tersedia untuk diulangi.");
              const { exam: sourceExam } = await teacherApi.getExam(request.examId);
              if (!active) return;
              if (sourceExam.questions.some((question) => !["multiple_choice", "essay"].includes(question.type))) {
                throw new Error("Tipe soal ujian asal belum dapat diulangi. Pilih opsi Buat soal baru.");
              }
              const questions = sourceExam.questions.map((question) => {
                const isEssay = question.type === "essay";
                return {
                  type: isEssay ? "essay" : "multiple_choice",
                  prompt: question.prompt,
                  answerKey: question.answerKey ?? "",
                  points: question.points,
                  options: question.options.map((option) => option.content),
                  correctOption: question.options.find((option) => option.isCorrect)?.label ?? "A",
                };
              });
              setForm((current) => ({
                ...current,
                type: questions.some((question) => question.type === "essay") ? "essay" : "multiple_choice",
                subject: request.subject,
                title: `Remedial ${request.examTitle}`.slice(0, 120),
                startMode: "scheduled",
                durationMinutes: sourceExam.durationMinutes,
                kkm: request.kkm,
                academicYear: sourceExam.academicYear,
                semester: sourceExam.semester,
                examType: sourceExam.examType,
                autoGrade: sourceExam.autoGrade,
                randomizeQuestions: sourceExam.randomizeQuestions,
                randomizeOptions: sourceExam.randomizeOptions,
                showScore: sourceExam.showScore !== false,
                questions,
              }));
            } else {
              setForm((current) => ({
                ...current,
                subject: request.subject,
                title: `Remedial ${request.examTitle}`.slice(0, 120),
                startMode: "scheduled",
                kkm: request.kkm,
              }));
            }
          }
        }
      })
      .catch((requestError) => { if (active) setError(requestError.message); })
      .finally(() => {
        if (!active) return;
        setLoadingClasses(false);
        setLoadingSubjects(false);
        setLoadingExam(false);
      });
    return () => { active = false; };
  }, [examId, isEditing, remedialMode, remedialRequestId]);

  function updateQuestion(index, changes) {
    setForm((current) => ({
      ...current,
      questions: current.questions.map((question, position) =>
        position === index ? { ...question, ...changes } : question,
      ),
    }));
  }

  function toggleClass(id) {
    setSelectedClassIds((current) =>
      current.includes(id) ? current.filter((value) => value !== id) : [...current, id],
    );
  }

  const activeGradeClasses = classes.filter((item) =>
    (item.gradeLevel ?? item.name.split(" ")[0]) === activeClassGrade,
  );
  const activeGradeClassIds = activeGradeClasses.map((item) => item.id);
  const allActiveGradeSelected = activeGradeClassIds.length > 0 &&
    activeGradeClassIds.every((id) => selectedClassIds.includes(id));

  function setQuestionType(index, type) {
    const question = form.questions[index];
    updateQuestion(index, {
      type,
      options: type === "essay"
        ? []
        : question.options.length
          ? question.options
          : ["", "", "", "", ""],
      answerKey: type === "essay" ? question.answerKey : "",
      points: question.points || 1,
    });
  }

  async function saveExamToken() {
    setError("");
    setTokenNotice("");
    setSavingToken(true);
    try {
      const { exam } = await teacherApi.updateExamToken(examId, editToken);
      setEditToken(exam.code);
      setTokenNotice("Token ujian berhasil disimpan.");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSavingToken(false);
    }
  }

  async function copyPublishedToken() {
    try {
      await navigator.clipboard.writeText(token);
      setCopiedToken(true);
    } catch {
      setError("Token tidak dapat disalin. Salin token secara manual.");
    }
  }

  function continueToNextStep() {
    setError("");
    if (step === 1 && !form.subject) {
      setError("Pilih mata pelajaran terlebih dahulu.");
      return;
    }
    if (step === 2 && !form.title.trim()) {
      setError("Judul soal wajib diisi.");
      return;
    }
    if (step === 3 && selectedClassIds.length === 0) {
      setError("Pilih minimal satu kelas tujuan.");
      return;
    }
    if (step === 4) {
      const opensAt = form.startMode === "scheduled"
        ? new Date(form.opensAt)
        : new Date();
      const closesAt = new Date(form.closesAt);
      if (!Number.isFinite(opensAt.getTime()) || !Number.isFinite(closesAt.getTime()) ||
          closesAt <= opensAt) {
        setError("Waktu selesai harus setelah waktu mulai.");
        return;
      }
      if (!Number.isInteger(Number(form.durationMinutes)) ||
          Number(form.durationMinutes) < 1 || Number(form.durationMinutes) > 480) {
        setError("Durasi ujian harus 1 sampai 480 menit.");
        return;
      }
      if (!Number.isInteger(Number(form.kkm)) ||
          Number(form.kkm) < 0 || Number(form.kkm) > 100) {
        setError("KKM harus berupa bilangan bulat antara 0 dan 100.");
        return;
      }
    }
    if (step === 5 && tokenMode === "custom") {
      if (!editToken.trim() || !/^[A-Z]{3}\d{2}[#@!]$/.test(editToken.trim())) {
        setError("Isi token dengan format tiga huruf, dua angka, dan satu simbol.");
        return;
      }
    }
    if (step === 6 && form.questions.some((question) => {
      const type = question.type ?? form.type;
      return question.prompt.trim().length < 10 ||
        (type === "multiple_choice" && (
          question.options.length < 2 ||
          question.options.some((option) => !option.trim()) ||
          !question.options.some((_, index) =>
            String.fromCharCode(65 + index) === question.correctOption)
        )) ||
        (type === "essay" && (
          !question.answerKey.trim() ||
          !Number.isFinite(Number(question.points)) ||
          Number(question.points) <= 0 ||
          Number(question.points) > 100
        ));
    })) {
      setError("Lengkapi semua pertanyaan, pilihan jawaban, kunci, dan bobot nilai.");
      return;
    }
    setStep((current) => Math.min(current + 1, wizardSteps.length - 1));
  }

  async function publish(event) {
    event.preventDefault();
    setError("");
    setSaving(true);
    try {
      if (!form.title.trim() || selectedClassIds.length === 0) {
        throw new Error("Judul soal dan minimal satu kelas tujuan wajib diisi.");
      }
      const selectedClasses = classes.filter((item) => selectedClassIds.includes(item.id));
      const gradeLevel = selectedClasses[0]?.gradeLevel ??
        selectedClasses[0]?.name.split(" ")[0] ?? "XI";
      const opensAt = form.startMode === "scheduled"
        ? new Date(form.opensAt)
        : new Date();
      const closesAt = new Date(form.closesAt);
      if (!Number.isFinite(opensAt.getTime()) || !Number.isFinite(closesAt.getTime()) ||
          closesAt <= opensAt || !Number.isInteger(Number(form.durationMinutes)) ||
          Number(form.durationMinutes) < 1 || Number(form.durationMinutes) > 480) {
        throw new Error("Waktu selesai harus setelah waktu mulai.");
      }
      if (!Number.isInteger(Number(form.kkm)) ||
          Number(form.kkm) < 0 || Number(form.kkm) > 100) {
        throw new Error("KKM harus berupa bilangan bulat antara 0 dan 100.");
      }
      if (tokenMode === "custom" &&
          (!editToken.trim() || !/^[A-Z]{3}\d{2}[#@!]$/.test(editToken.trim()))) {
        throw new Error("Isi token dengan format tiga huruf, dua angka, dan satu simbol.");
      }
      const questionsToSave = form.questions.map((question) => ({
        academicYear: form.academicYear,
        subject: form.subject,
        gradeLevel,
        chapter: form.title,
        difficulty: "sedang",
        type: question.type ?? form.type,
        prompt: question.prompt,
        answerKey: (question.type ?? form.type) === "essay" ? question.answerKey : "",
        points: Number((question.type ?? form.type) === "essay" ? question.points : 1),
        options: (question.type ?? form.type) === "multiple_choice"
          ? question.options.map((content, index) => ({
            label: String.fromCharCode(65 + index),
            content,
            isCorrect: String.fromCharCode(65 + index) === question.correctOption,
          }))
          : [],
      }));
      const mcQuestionCount = questionsToSave.filter((question) =>
        !["essay", "short_answer"].includes(question.type),
      ).length;
      const essayQuestionCount = questionsToSave.length - mcQuestionCount;
      if (isEditing) {
        await teacherApi.updateExam(examId, {
          title: form.title,
          subject: form.subject,
          description: `${form.subject} · ${form.title}`,
          academicYear: form.academicYear,
          semester: form.semester,
          examType: form.examType,
          gradeLevel,
          durationMinutes: Number(form.durationMinutes),
          kkm: Number(form.kkm),
          showScore: form.showScore,
          mcQuestionCount,
          essayQuestionCount,
          randomizeQuestions: form.randomizeQuestions,
          randomizeOptions: form.randomizeOptions,
          autoGrade: form.autoGrade,
          visibility: form.visibility,
          questionIds: [],
          classIds: selectedClassIds,
          opensAt: opensAt.toISOString(),
          closesAt: closesAt.toISOString(),
          ...(examWasPublished ? {
            status: form.startMode === "now" ? "active" : "scheduled",
          } : {}),
          code: editToken.trim() || undefined,
          questions: questionsToSave.map(({ type, prompt, answerKey, points, options }) => ({
            type,
            prompt,
            answerKey,
            points,
            options,
          })),
        });
        window.location.assign(`/guru/ujian/${examId}`);
        return;
      }
      let questionIds = savedQuestionIds;
      if (!questionIds) {
        const { questions: savedQuestions } = await teacherApi.importQuestions(questionsToSave);
        questionIds = savedQuestions.map((question) => question.id);
        setSavedQuestionIds(questionIds);
      }
      let publishingExamId = draftExamId;
      if (!publishingExamId) {
        const { exam } = await teacherApi.createExam({
          title: form.title,
          subject: form.subject,
          description: `${form.subject} · ${form.title}`,
          academicYear: form.academicYear,
          semester: form.semester,
          examType: form.examType,
          gradeLevel,
          durationMinutes: Number(form.durationMinutes),
          kkm: Number(form.kkm),
          showScore: form.showScore,
          mcQuestionCount,
          essayQuestionCount,
          questionIds,
          classIds: selectedClassIds,
          randomizeQuestions: form.randomizeQuestions,
          randomizeOptions: form.randomizeOptions,
          autoGrade: form.autoGrade,
          visibility: form.visibility,
        });
        publishingExamId = exam.id;
        setDraftExamId(exam.id);
      }
      const { exam: result } = await teacherApi.publishExam(publishingExamId, {
        status: form.startMode === "now" ? "active" : "scheduled",
        opensAt: opensAt.toISOString(),
        closesAt: closesAt.toISOString(),
        visibility: "private",
      });
      setToken(result.code);
      setPublishedExam(result);
      setStep(8);
      if (remedialRequestId) {
        try {
          await teacherApi.scheduleRemedialRequest(remedialRequestId, result.id);
        } catch (scheduleError) {
          setError(`Ujian terpublikasi, tetapi belum tertaut ke pengajuan remedial: ${scheduleError.message}`);
        }
      }
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  }

  const selectedClasses = classes.filter((item) => selectedClassIds.includes(item.id));
  if (loadingExam) {
    return <TeacherShell active="Soal" user={user}><p className="teacher-empty">Memuat data ujian...</p></TeacherShell>;
  }
  return (
    <TeacherShell active="Soal" user={user}>
      <a className="teacher-back-link" href={returnToSchedule ? "/guru/jadwal-ujian" : "/guru/soal"}><TeacherIcon name="back" /> Kembali ke {returnToSchedule ? "Jadwal Ujian" : "Soal"}</a>
      <PageTitle
        eyebrow={isEditing ? "EDIT UJIAN" : fromImport ? "IMPORT SOAL KE UJIAN" : "BUAT SOAL"}
        title={isEditing ? "Edit Ujian" : fromImport ? "Buat Ujian dari Import" : "Buat Soal Baru"}
        description={fromImport
          ? "Soal hasil import sudah terisi. Lengkapi judul, kelas, jadwal, dan pengaturan ujian."
          : "Lengkapi informasi ujian, kelas peserta, jadwal, dan daftar soal."}
      />
      <nav className="teacher-wizard-steps" aria-label="Langkah pembuatan soal">
        {wizardSteps.map((label, index) => (
          <button type="button" className={index === step ? "active" : index < step ? "complete" : ""} key={label} disabled={!isEditing && Boolean(draftExamId) && index < step} onClick={() => index < step && setStep(index)}>
            <span>{index < step ? "✓" : index + 1}</span>{label}
          </button>
        ))}
      </nav>
      {error && <div className="teacher-alert error" role="alert">{error}</div>}
      <section className="teacher-panel teacher-wizard-panel">
        {step === 0 && (
          <>
            <div className="teacher-panel-heading"><div><span>LANGKAH 1</span><h2>Pilih Tipe Soal</h2></div></div>
            {isEditing ? <p className="teacher-wizard-help">Tipe tiap pertanyaan mengikuti data ujian dan dapat diubah pada langkah Input Soal.</p> : <div className="teacher-choice-cards">
              {[
                ["multiple_choice", "Pilihan Ganda", "Siswa memilih satu jawaban dari lima opsi."],
                ...(!importedExamDraft.questions
                  ? [["essay", "Essay", "Siswa menulis jawaban dengan kata-kata sendiri."]]
                  : []),
              ].map(([value, title, description]) => (
                <label className={form.type === value ? "selected" : ""} key={value}>
                  <input type="radio" name="question-type" checked={form.type === value} onChange={() => setForm({ ...form, type: value })} />
                  <span><strong>{title}</strong><small>{description}</small></span>
                </label>
              ))}
              {importedExamDraft.questions && <p className="teacher-wizard-help">Tipe Pilihan Ganda dipilih otomatis karena soal impor memiliki opsi A-E.</p>}
            </div>}
          </>
        )}
        {step === 1 && (
          <>
            <div className="teacher-panel-heading"><div><span>LANGKAH 2</span><h2>Pilih Mata Pelajaran</h2></div></div>
            {loadingSubjects ? <p className="teacher-empty">Memuat mata pelajaran sekolah...</p>
              : subjects.length === 0 ? <div className="teacher-empty-state"><strong>Belum ada mata pelajaran</strong><span>Minta Admin menambahkan mata pelajaran terlebih dahulu.</span></div>
                : <label className="teacher-wizard-label">Mata Pelajaran
                  <select value={form.subject} onChange={(event) => setForm({ ...form, subject: event.target.value })} required>
                    <option value="" disabled>Pilih mata pelajaran</option>
                    {subjects.map((subject) => <option key={subject} value={subject}>{subject}</option>)}
                  </select>
                </label>}
          </>
        )}
        {step === 2 && (
          <>
            <div className="teacher-panel-heading"><div><span>LANGKAH 3</span><h2>Beri Judul Soal</h2></div></div>
            <label className="teacher-wizard-label">Judul Soal
              <input value={form.title} maxLength="120" onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Contoh: Ulangan Harian Kimia" required />
            </label>
            <div className="teacher-title-suggestions">
              {["Ulangan Harian", "Ujian Tengah Semester", "Ujian Sumatif Akhir Semester", "Try Out UTBK"].map((title) => (
                <button type="button" key={title} onClick={() => setForm({ ...form, title: `${title} ${form.subject}` })}>{title}</button>
              ))}
            </div>
          </>
        )}
        {step === 3 && (
          <>
            <div className="teacher-panel-heading"><div><span>LANGKAH 4</span><h2>Pilih Kelas Tujuan</h2></div><span>{selectedClassIds.length} dipilih</span></div>
            {loadingClasses ? <p className="teacher-empty">Memuat daftar kelas...</p> : classes.length === 0 ? (
              <div className="teacher-empty-state"><strong>Belum ada data kelas</strong><span>Minta Admin menambahkan kelas ke data sekolah terlebih dahulu.</span></div>
            ) : (
              <div className="teacher-class-picker">
                <div className="teacher-class-picker-toolbar">
                  <label className="teacher-wizard-label">Jenjang Kelas
                    <select value={activeClassGrade} onChange={(event) => setActiveClassGrade(event.target.value)}>
                      {["X", "XI", "XII"].map((grade) => (
                        <option value={grade} key={grade}>{grade} ({classes.filter((item) =>
                          (item.gradeLevel ?? item.name.split(" ")[0]) === grade,
                        ).length})</option>
                      ))}
                    </select>
                  </label>
                  {activeGradeClasses.length > 0 && (
                    <button
                      type="button"
                      className="teacher-secondary-button"
                      onClick={() => setSelectedClassIds((current) => allActiveGradeSelected
                        ? current.filter((id) => !activeGradeClassIds.includes(id))
                        : [...new Set([...current, ...activeGradeClassIds])])}
                    >
                      {allActiveGradeSelected ? "Batalkan Pilih Semua" : `Pilih Semua ${activeClassGrade}`}
                    </button>
                  )}
                </div>
                {activeGradeClasses.length === 0 ? (
                  <p className="teacher-empty">Belum ada kelas {activeClassGrade} di data sekolah.</p>
                ) : (
                  <div className="teacher-wizard-class-grid">
                    {activeGradeClasses.map((item) => (
                      <label className={selectedClassIds.includes(item.id) ? "selected" : ""} key={item.id}>
                        <input type="checkbox" checked={selectedClassIds.includes(item.id)} onChange={() => toggleClass(item.id)} />
                        <span><strong>{item.name}</strong><small>{item.studentCount} siswa</small></span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}
            <p className="teacher-wizard-help">Pilih satu atau beberapa kelas. Soal akan terlihat hanya oleh siswa di kelas yang dipilih.</p>
          </>
        )}
        {step === 4 && (
          <>
            <div className="teacher-panel-heading"><div><span>LANGKAH 5</span><h2>Atur Jadwal</h2></div></div>
            <div className="teacher-schedule-options">
              <label className={form.startMode === "now" ? "selected" : ""}><input type="radio" name="start-mode" checked={form.startMode === "now"} onChange={() => setForm({ ...form, startMode: "now" })} /><span><strong>Mulai Sekarang</strong><small>Ujian langsung aktif setelah dipublish.</small></span></label>
              <label className={form.startMode === "scheduled" ? "selected" : ""}><input type="radio" name="start-mode" checked={form.startMode === "scheduled"} onChange={() => setForm({ ...form, startMode: "scheduled" })} /><span><strong>Jadwalkan</strong><small>Tentukan waktu mulai dan selesai.</small></span></label>
            </div>
            <div className="teacher-schedule-fields">
              {form.startMode === "scheduled" && <label>Tanggal &amp; Jam Mulai<input type="datetime-local" value={form.opensAt} onChange={(event) => setForm({ ...form, opensAt: event.target.value })} required /></label>}
              <label>Tanggal &amp; Jam Selesai<input type="datetime-local" value={form.closesAt} onChange={(event) => setForm({ ...form, closesAt: event.target.value })} required /></label>
            </div>
            <label className="teacher-wizard-label">Durasi Ujian (menit)
              <input type="number" min="1" max="480" value={form.durationMinutes} onChange={(event) => setForm({ ...form, durationMinutes: event.target.value })} required />
            </label>
            <label className="teacher-wizard-label">KKM
              <input type="number" min="0" max="100" step="1" value={form.kkm} onChange={(event) => setForm({ ...form, kkm: event.target.value })} required />
            </label>
            <label className={`teacher-score-visibility ${form.showScore ? "selected" : ""}`}>
              <input type="checkbox" checked={form.showScore} onChange={(event) => setForm({ ...form, showScore: event.target.checked })} />
              <span><strong>Tampilkan nilai kepada siswa</strong><small>Jika dinonaktifkan, siswa hanya melihat konfirmasi bahwa ujian selesai.</small></span>
            </label>
            <div className="teacher-wizard-label">
              <span>Urutan Soal</span>
              <div className="teacher-schedule-options">
                <label className={!form.randomizeQuestions ? "selected" : ""}>
                  <input type="radio" name="question-order" checked={!form.randomizeQuestions} onChange={() => setForm({ ...form, randomizeQuestions: false })} />
                  <span><strong>Sesuai urutan guru</strong><small>Semua siswa melihat susunan yang sama.</small></span>
                </label>
                <label className={form.randomizeQuestions ? "selected" : ""}>
                  <input type="radio" name="question-order" checked={form.randomizeQuestions} onChange={() => setForm({ ...form, randomizeQuestions: true })} />
                  <span><strong>Acak per siswa</strong><small>Susunan berbeda pada setiap percobaan.</small></span>
                </label>
              </div>
            </div>
          </>
        )}
        {step === 5 && (
          <>
            <div className="teacher-panel-heading"><div><span>LANGKAH 6</span><h2>Atur Token Ujian</h2></div></div>
            <p className="teacher-wizard-help">Gunakan token otomatis atau tentukan token khusus untuk ujian ini.</p>
            <div className="teacher-schedule-options">
              <label className={tokenMode === "automatic" ? "selected" : ""}>
                <input type="radio" name="token-mode" checked={tokenMode === "automatic"} onChange={() => { setTokenMode("automatic"); setEditToken(""); setTokenNotice(""); }} />
                <span><strong>Generate otomatis</strong><small>Token dibuat saat ujian dipublish.</small></span>
              </label>
              <label className={tokenMode === "custom" ? "selected" : ""}>
                <input type="radio" name="token-mode" checked={tokenMode === "custom"} onChange={() => { setTokenMode("custom"); setTokenNotice(""); }} />
                <span><strong>Buat token sendiri</strong><small>Format 3 huruf, 2 angka, dan simbol (#, @, !).</small></span>
              </label>
            </div>
            {tokenMode === "custom" && (
              <div className="teacher-token-editor">
                <label className="teacher-wizard-label">Token Ujian
                  <input value={editToken} maxLength="6" pattern="[A-Za-z]{3}[0-9]{2}[#@!]" required onChange={(event) => { setEditToken(event.target.value.toUpperCase()); setTokenNotice(""); }} placeholder="Contoh: KIM23#" />
                </label>
                {isEditing && examWasPublished && <button type="button" className="teacher-secondary-button" onClick={saveExamToken} disabled={savingToken}>
                  {savingToken ? "Menyimpan..." : "Simpan Token"}
                </button>}
                {tokenNotice && <span className="teacher-token-notice" role="status">{tokenNotice}</span>}
              </div>
            )}
          </>
        )}
        {step === 6 && (
          <>
            <div className="teacher-panel-heading"><div><span>LANGKAH 7</span><h2>Input Soal</h2></div><span>{form.questions.length} soal</span></div>
            <div className="teacher-wizard-question-list">
              {form.questions.map((question, index) => (
                <article className="teacher-wizard-question" key={index}>
                  <div className="teacher-wizard-question-heading"><strong>Pertanyaan {index + 1}</strong>{form.questions.length > 1 && <button type="button" onClick={() => setForm({ ...form, questions: form.questions.filter((_, position) => position !== index) })}>Hapus</button>}</div>
                  {isEditing && (
                    <label className="teacher-wizard-label">Tipe Pertanyaan
                      <select value={question.type} onChange={(event) => setQuestionType(index, event.target.value)}>
                        <option value="multiple_choice">Pilihan Ganda</option>
                        <option value="essay">Essay</option>
                      </select>
                    </label>
                  )}
                  <label className="teacher-wizard-label">{(question.type ?? form.type) === "essay" ? "Pertanyaan Essay" : "Pertanyaan"}
                    <textarea minLength="10" maxLength="4000" rows="4" value={question.prompt} onChange={(event) => updateQuestion(index, { prompt: event.target.value })} placeholder="Tulis pertanyaan dengan jelas..." required />
                  </label>
                  {(question.type ?? form.type) === "essay" ? (
                    <div className="teacher-wizard-question-fields">
                      <label>Bobot Nilai<input type="number" min="0.1" max="100" step="0.1" value={question.points} onChange={(event) => updateQuestion(index, { points: event.target.value })} required /></label>
                      <label>Pedoman Jawaban<textarea rows="2" value={question.answerKey} onChange={(event) => updateQuestion(index, { answerKey: event.target.value })} placeholder="Tuliskan pedoman penilaian..." required /></label>
                    </div>
                  ) : (
                    <div className="teacher-wizard-options">
                      {question.options.map((option, optionIndex) => {
                        const label = String.fromCharCode(65 + optionIndex);
                        return <label key={label}><span>{label}</span><input value={option} onChange={(event) => updateQuestion(index, { options: question.options.map((value, position) => position === optionIndex ? event.target.value : value) })} placeholder={`Pilihan ${label}`} required /><input type="radio" name={`correct-${index}`} aria-label={`Kunci jawaban ${label}`} checked={question.correctOption === label} onChange={() => updateQuestion(index, { correctOption: label })} /></label>;
                      })}
                      <small>Pilih lingkaran di samping jawaban yang benar.</small>
                    </div>
                  )}
                </article>
              ))}
              {form.questions.length < 100 && <button type="button" className="teacher-secondary-button" onClick={() => setForm({ ...form, questions: [...form.questions, createQuestionDraft(isEditing ? form.type : undefined)] })}>+ Tambah Pertanyaan</button>}
            </div>
          </>
        )}
        {step === 7 && (
          <>
            <div className="teacher-panel-heading"><div><span>LANGKAH 8</span><h2>Preview untuk Siswa</h2></div><span>{form.subject}</span></div>
            <article className="teacher-student-preview">
              <div><small>{form.subject} · {selectedClasses.map((item) => item.name).join(", ")}</small><h3>{form.title || "Judul Soal"}</h3><span>{form.questions.length} soal · KKM {form.kkm} · {form.randomizeQuestions ? "Urutan diacak per siswa" : "Sesuai urutan guru"}</span></div>
              {form.questions.map((question, index) => (
                <section key={index}>
                  <strong className="nsolve-preserve-lines">{index + 1}. {question.prompt || "Pertanyaan akan tampil di sini."}</strong>
                  {(question.type ?? form.type) === "essay" ? <div className="teacher-preview-answer-box">Jawaban essay siswa</div> : question.options.map((option, optionIndex) => (
                    <span className="nsolve-preserve-lines" key={optionIndex}><i /> {String.fromCharCode(65 + optionIndex)}. {option || `Pilihan ${String.fromCharCode(65 + optionIndex)}`}</span>
                  ))}
                </section>
              ))}
            </article>
          </>
        )}
        {step === 8 && (
          <>
            <div className="teacher-panel-heading"><div><span>LANGKAH 9</span><h2>{isEditing ? "Simpan Perubahan" : "Publish Soal"}</h2></div></div>
            {token ? (
              <div className="teacher-token-result" role="status">
                <span>Ujian berhasil dipublish</span>
                <p>Bagikan token ini kepada siswa yang terdaftar di kelas tujuan.</p>
                <div className="teacher-token-value"><strong>{token}</strong><button type="button" className="teacher-secondary-button" onClick={copyPublishedToken}>{copiedToken ? "Tersalin" : "Salin Token"}</button></div>
                <small>Siswa akan diminta memasukkan token sebelum masuk ruang ujian.</small>
                <div className="teacher-token-links"><a className="teacher-primary-button" href="/guru/jadwal-ujian">Lihat Jadwal Ujian</a><a className="teacher-secondary-button" href={`/guru/ujian/${publishedExam?.id}`}>Detail Ujian</a></div>
              </div>
            ) : (
              <div className="teacher-publish-confirm">
                <p><strong>{form.title || "Judul Soal"}</strong> {isEditing ? "akan disimpan kembali" : `akan dipublish untuk ${selectedClassIds.length} kelas dengan status ${form.startMode === "now" ? "aktif" : "terjadwal"}`}.</p>
                <p>{isEditing ? "Perubahan akan langsung tersimpan pada data ujian." : tokenMode === "custom" ? `Token ${editToken} akan digunakan untuk masuk ke ujian.` : "Token masuk siswa akan dibuat otomatis setelah publish."}</p>
                <button className="teacher-primary-button" type="button" onClick={publish} disabled={saving}>{saving ? "Menyimpan..." : isEditing ? "Simpan Perubahan" : "Publish Soal"}</button>
              </div>
            )}
          </>
        )}
        {!token && (
          <div className="teacher-wizard-actions">
            <button type="button" className="teacher-secondary-button" onClick={() => setStep((current) => Math.max(current - 1, 0))} disabled={step === 0 || (!isEditing && Boolean(draftExamId))}>Kembali</button>
            {step < 8 && <button type="button" className="teacher-primary-button" onClick={continueToNextStep} disabled={(step === 1 && (loadingSubjects || !subjects.length || !form.subject)) || (step === 3 && (loadingClasses || classes.length === 0))}>Lanjut</button>}
          </div>
        )}
      </section>
    </TeacherShell>
  );
}

function ExamDetail({ user, examId, returnToSchedule = false }) {
  const [exam, setExam] = useState(null);
  const [error, setError] = useState("");
  const [copiedToken, setCopiedToken] = useState(false);
  useEffect(() => {
    let active = true;
    teacherApi.getExam(examId)
      .then(({ exam: value }) => {
        if (!active) return;
        setExam(value);
      })
      .catch((requestError) => { if (active) setError(requestError.message); });
    return () => { active = false; };
  }, [examId]);
  if (!exam) return <TeacherShell active={returnToSchedule ? "Jadwal Ujian" : "Soal"} user={user}>{error ? <div className="teacher-alert error" role="alert">{error}</div> : <p className="teacher-empty">Memuat data ujian...</p>}</TeacherShell>;
  const questionTypes = [...new Set(exam.questions.map((question) => typeNames[question.type]))];
  const formatDate = (value) => {
    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? "—"
      : date.toLocaleString("id-ID", { dateStyle: "long", timeStyle: "short" });
  };
  async function copyExamToken() {
    try {
      await navigator.clipboard.writeText(exam.code);
      setCopiedToken(true);
      setError("");
    } catch {
      setError("Token tidak dapat disalin. Salin token secara manual.");
    }
  }
  return (
    <TeacherShell active={returnToSchedule ? "Jadwal Ujian" : "Soal"} user={user}>
      <a className="teacher-back-link" href={returnToSchedule ? "/guru/jadwal-ujian" : "/guru/soal"}><TeacherIcon name="back" /> Kembali ke {returnToSchedule ? "Jadwal Ujian" : "Soal"}</a>
      <PageTitle eyebrow="DETAIL UJIAN" title={exam.title} action={<span className={`teacher-status large ${exam.status}`}>{statusName(exam.status)}</span>} />
      {error && <div className="teacher-alert error" role="alert">{error}</div>}
      <section className="teacher-panel teacher-exam-readonly">
        <dl>
          <div><dt>Judul Ujian</dt><dd>{exam.title}</dd></div>
          <div><dt>Mata Pelajaran</dt><dd>{exam.subject}</dd></div>
          <div><dt>Jenis Soal</dt><dd>{questionTypes.join(" dan ") || "—"}</dd></div>
          <div><dt>Kelas Tujuan</dt><dd>{exam.classes.map((item) => item.name).join(", ") || "—"}</dd></div>
          <div><dt>Tanggal Mulai</dt><dd>{formatDate(exam.opensAt)}</dd></div>
          <div><dt>Tanggal Selesai</dt><dd>{formatDate(exam.closesAt)}</dd></div>
          <div><dt>Durasi</dt><dd>{exam.durationMinutes} menit</dd></div>
          <div><dt>Status</dt><dd>{statusName(exam.status)}</dd></div>
          <div><dt>Token Ujian</dt><dd>{exam.publishedAt && exam.code && !exam.code.startsWith("DRAFT-")
            ? <div className="teacher-detail-token"><code>{exam.code}</code><button type="button" className="teacher-secondary-button" onClick={copyExamToken}>{copiedToken ? "Tersalin" : "Salin Token"}</button></div>
            : "Belum dipublish"}</dd></div>
          <div><dt>Jumlah Soal</dt><dd>{exam.questions.length}</dd></div>
        </dl>
      </section>
      <section className="teacher-panel teacher-exam-questions">
        <div className="teacher-panel-heading"><div><span>DAFTAR SOAL</span><h2>Soal Ujian <small>{exam.questions.length}</small></h2></div></div>
        {exam.questions.length === 0
          ? <p className="teacher-empty">Belum ada soal.</p>
          : exam.questions.map((question) => (
            <article key={question.id}>
              <b>{String(question.position).padStart(2, "0")}</b>
              <span>{question.prompt}</span>
              <small>{typeNames[question.type]}</small>
            </article>
          ))}
      </section>
    </TeacherShell>
  );
}

function toLocalDateTime(date) {
  if (Number.isNaN(date.getTime())) return "";
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

function ExamParticipants({ user, examId }) {
  const [exam, setExam] = useState(null);
  const [students, setStudents] = useState([]);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    Promise.all([teacherApi.getExam(examId), teacherApi.getParticipants()])
      .then(([examData, participantData]) => {
        if (!active) return;
        setExam(examData.exam);
        setStudents(participantData.participants.filter((item) => item.examId === examId));
      })
      .catch((requestError) => { if (active) setError(requestError.message); });
    return () => { active = false; };
  }, [examId]);
  return (
    <TeacherShell active="Jadwal Ujian" user={user}>
      <a className="teacher-back-link" href={`/guru/ujian/${examId}`}><TeacherIcon name="back" /> Kembali ke Detail Ujian</a>
      <PageTitle eyebrow="PESERTA UJIAN" title="Daftar Peserta" description={exam?.title ?? "Siswa terdaftar otomatis berdasarkan kelas tujuan ujian."} />
      {error && <div className="teacher-alert error" role="alert">{error}</div>}
      <section className="teacher-panel admin-activity-panel">
        <div className="teacher-panel-heading"><div><span>{exam?.participantCount ?? students.length} SISWA</span><h2>Peserta dari Kelas Tujuan</h2></div></div>
        <div className="teacher-table-wrap"><table className="teacher-table"><thead><tr><th>Nama Siswa</th><th>Email</th><th>Kelas</th><th>Status Ujian</th></tr></thead>
          <tbody>{students.map((student) => <tr key={student.studentId}><td>{student.fullName}</td><td>{student.email}</td><td>{student.className}</td><td>{student.resultId ? "Selesai" : "Belum mengerjakan"}</td></tr>)}
            {!students.length && <tr><td colSpan="4">Belum ada siswa yang terdaftar di kelas tujuan ujian.</td></tr>}
          </tbody>
        </table></div>
      </section>
    </TeacherShell>
  );
}

function ExamPreview({ user, examId }) {
  const [exam, setExam] = useState(null);
  const [error, setError] = useState("");
  const [answers, setAnswers] = useState({});
  useEffect(() => {
    let active = true;
    teacherApi.getExam(examId)
      .then(({ exam: value }) => { if (active) setExam(value); })
      .catch((requestError) => { if (active) setError(requestError.message); });
    return () => { active = false; };
  }, [examId]);
  function selectAnswer(questionId, value, multiple) {
    setAnswers((current) => {
      const chosen = Array.isArray(current[questionId]) ? current[questionId] : [];
      return {
        ...current,
        [questionId]: multiple
          ? chosen.includes(value) ? chosen.filter((item) => item !== value) : [...chosen, value]
          : value,
      };
    });
  }
  return (
    <TeacherShell active="Jadwal Ujian" user={user}>
      <a className="teacher-back-link" href={`/guru/ujian/${examId}`}><TeacherIcon name="back" /> Kembali ke Detail Ujian</a>
      <PageTitle eyebrow="MODE PREVIEW · HANYA GURU" title="Preview Ujian Siswa" description={exam?.title ?? "Tampilan simulasi untuk memeriksa soal sebelum ujian dipublikasikan."} />
      {error && <div className="teacher-alert error" role="alert">{error}</div>}
      {exam && <div className="teacher-preview-banner"><TeacherIcon name="eye" /><span>Mode pratinjau. Jawaban yang dipilih hanya simulasi dan tidak disimpan sebagai hasil ujian.</span><b>{exam.durationMinutes} menit</b></div>}
      {!exam ? <p className="teacher-empty">Memuat preview...</p> : <div className="teacher-preview-layout">
        <div className="teacher-preview-questions">
          {exam.questions.map((question) => (
            <article className="teacher-panel teacher-preview-question" key={question.id}>
              <div className="teacher-preview-question-head"><span>SOAL {question.position}</span><small>{typeNames[question.type]}</small></div>
              <p className="nsolve-preserve-lines">{question.prompt}</p>
              {question.options.length ? <div className="teacher-preview-options">{question.options.map((option) => (
                <label key={option.id}><input
                  type={question.type === "multiple_choice_complex" ? "checkbox" : "radio"}
                  name={question.id}
                  checked={question.type === "multiple_choice_complex"
                    ? (answers[question.id] ?? []).includes(option.id)
                    : answers[question.id] === option.id}
                  onChange={() => selectAnswer(question.id, option.id, question.type === "multiple_choice_complex")}
                /><span className="nsolve-preserve-lines"><b>{option.label}</b>{option.content}</span></label>
              ))}</div> : <textarea rows="3" value={answers[question.id] ?? ""} onChange={(event) => setAnswers({ ...answers, [question.id]: event.target.value })} placeholder="Tulis jawaban Anda..." />}
            </article>
          ))}
          {exam.questions.length === 0 && <p className="teacher-empty">Belum ada soal di dalam paket ini.</p>}
        </div>
        <aside className="teacher-panel teacher-preview-summary"><span>RINGKASAN</span><h3>{exam.title}</h3><p>{exam.gradeLevel} IPA · {exam.schoolName}</p><div><TeacherIcon name="clock" /> {exam.durationMinutes} menit</div><div><TeacherIcon name="questions" /> {exam.questions.length} soal pada draft</div><div><TeacherIcon name="students" /> {exam.participantCount} peserta</div><a className="teacher-secondary-button" href={`/guru/ujian/${exam.id}`}>Selesai Preview</a></aside>
      </div>}
    </TeacherShell>
  );
}

function ExamAnalytics({ user, examId }) {
  const [report, setReport] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    teacherApi.getAnalytics(examId)
      .then((data) => { if (active) setReport(data); })
      .catch((requestError) => { if (active) setError(requestError.message); });
    return () => { active = false; };
  }, [examId]);
  return (
    <TeacherShell active="Jadwal Ujian" user={user}>
      <a className="teacher-back-link" href={`/guru/ujian/${examId}`}><TeacherIcon name="back" /> Kembali ke Detail Ujian</a>
      <PageTitle eyebrow="LAPORAN HASIL UJIAN" title="Analisis Hasil" description={report?.exam.title ?? "Nilai rata-rata, ketuntasan, dan tingkat kesulitan per soal."} />
      {error && <div className="teacher-alert error" role="alert">{error}</div>}
      {!report ? <p className="teacher-empty">Memuat analisis...</p> : <>
        <div className="teacher-stat-grid teacher-analysis-stats">
          {[
            ["Nilai Rata-rata", `${report.summary.average}`, "chart"],
            ["Nilai Tertinggi", `${report.summary.highest}`, "check"],
            ["Nilai Terendah", `${report.summary.lowest}`, "clock"],
            ["Jumlah Peserta", `${report.summary.participants}`, "students"],
            ["Ketuntasan", `${report.summary.passRate}%`, "students"],
          ].map(([label, value, icon]) => <article className="teacher-stat-card" key={label}><span className={`teacher-stat-icon ${icon}`}><TeacherIcon name={icon} /></span><div><small>{label}</small><strong>{report.summary.submissions ? value : "—"}</strong></div></article>)}
        </div>
        <section className="teacher-panel teacher-analysis-panel">
          <div className="teacher-panel-heading"><div><span>{report.summary.submissions} PENGUMPULAN</span><h2>Analisis per Soal</h2></div><span>Rata-rata penyelesaian {report.summary.completionPercent}%</span></div>
          {report.summary.submissions === 0 ? <div className="teacher-empty-state"><TeacherIcon name="chart" /><strong>Belum ada hasil ujian</strong><span>Analisis soal akan tersedia setelah peserta mengumpulkan ujian.</span></div> : report.questions.map((question) => (
            <article className="teacher-analysis-question" key={question.id}>
              <div><b>Soal {question.number}</b><span>{question.prompt}</span></div>
              <small>{question.correctCount} benar · {question.responseCount} respons</small>
              <div className="teacher-analysis-track"><i style={{ width: `${question.correctRate}%` }} /></div>
              <strong>{question.correctRate}%</strong>
            </article>
          ))}
        </section>
        <section className="teacher-panel teacher-results-table">
          <div className="teacher-panel-heading"><div><span>DAFTAR NILAI</span><h2>Hasil Peserta</h2></div></div>
          <div className="teacher-table-scroll"><table><thead><tr><th>Nama Siswa</th><th>Kelas</th><th>Nilai</th><th>Benar</th><th>Salah</th><th>Kosong</th><th>Status Lulus</th></tr></thead><tbody>
            {report.participants.map((participant) => <tr key={participant.studentId}><td>{participant.fullName}</td><td>{participant.className}</td><td>{participant.score ?? "—"}</td><td>{participant.correctCount ?? "—"}</td><td>{participant.wrongCount ?? "—"}</td><td>{participant.unansweredCount ?? "—"}</td><td><span className={`teacher-result-status ${participant.resultId ? (participant.passed ? "passed" : "failed") : "pending"}`}>{participant.resultId ? (participant.passed ? "Lulus" : "Belum tuntas") : "Belum mengerjakan"}</span></td></tr>)}
            {report.participants.length === 0 && <tr><td colSpan="7">Belum ada peserta pada paket ujian ini.</td></tr>}
          </tbody></table></div>
        </section>
      </>}
    </TeacherShell>
  );
}

function QuestionImport({ user }) {
  const [text, setText] = useState("");
  const [questions, setQuestions] = useState([]);
  const [errors, setErrors] = useState([]);
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);
  const [readingFile, setReadingFile] = useState(false);
  async function readWordFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setErrors([]);
    setNotice("");
    setQuestions([]);
    setReadingFile(true);
    try {
      if (!/\.docx$/i.test(file.name)) {
        throw new Error("Format .doc belum didukung. Simpan ulang dokumen Word sebagai .docx.");
      }
      const arrayBuffer = await file.arrayBuffer();
      const { value } = await mammoth.extractRawText({ arrayBuffer });
      const extractedText = value.trim();
      setText(extractedText);
      if (extractedText) {
        const parsed = parseImportedQuestions(extractedText);
        setQuestions(parsed.questions);
        setErrors(parsed.errors);
      }
    } catch (requestError) {
      setErrors([requestError.message || "File Word tidak dapat dibaca."]);
    } finally {
      setReadingFile(false);
      event.target.value = "";
    }
  }
  function preview(event) {
    event.preventDefault();
    setNotice("");
    const parsed = parseImportedQuestions(text);
    setQuestions(parsed.questions);
    setErrors(parsed.errors);
  }
  function continueToExam() {
    try {
      sessionStorage.setItem(IMPORTED_EXAM_QUESTIONS_KEY, JSON.stringify(questions));
      window.location.assign("/guru/soal/baru?fromImport=1");
    } catch (requestError) {
      setErrors([`Soal tidak dapat diteruskan ke wizard ujian: ${requestError.message}`]);
    }
  }
  async function saveImport() {
    setSaving(true);
    setErrors([]);
    setNotice("");
    try {
      await teacherApi.importQuestions(questions);
      setNotice(`${questions.length} soal berhasil disimpan ke Bank Soal.`);
      setQuestions([]);
      setText("");
    } catch (requestError) {
      setErrors([requestError.message]);
    } finally {
      setSaving(false);
    }
  }
  return (
    <TeacherShell active="Soal" user={user}>
      <PageTitle eyebrow="IMPORT SOAL" title="Import Soal" description="Periksa preview, lalu teruskan soal ke wizard ujian atau simpan ke Bank Soal." />
      {notice && <div className="teacher-alert success" role="status">{notice}</div>}
      {errors.map((error) => <div className="teacher-alert error" role="alert" key={error}>{error}</div>)}
      <form className="teacher-panel teacher-import-panel" onSubmit={preview}>
        <label htmlFor="question-word-file">Unggah file Word (.docx)</label>
        <input
          id="question-word-file"
          className="teacher-file-input"
          type="file"
          accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          onChange={readWordFile}
          disabled={readingFile}
        />
        {readingFile && <small role="status">Membaca teks dari dokumen Word...</small>}
        <label htmlFor="question-import-text">Format teks soal</label>
        <textarea id="question-import-text" rows="14" value={text} onChange={(event) => setText(event.target.value)} placeholder={"Soal:\nElektron valensi atom selenium (Se, Z = 34) yang terletak di orbital 4p dapat memiliki bilangan kuantum ...\n\nA. ...\nB. ...\nC. ...\nD. ...\nE. ...\n\nKunci: B"} required />
        <button className="teacher-primary-button" type="submit">Preview Import Soal</button>
      </form>
      {questions.length > 0 && <section className="teacher-panel teacher-import-preview">
        <div className="teacher-panel-heading"><div><span>PREVIEW IMPORT SOAL</span><h2>{questions.length} soal siap diperiksa</h2></div></div>
        {questions.map((question, index) => <article key={`${index}-${question.prompt}`}>
          <strong className="nsolve-preserve-lines">{index + 1}. {question.prompt}</strong>
          {question.options.map((option) => <span className={`${option.isCorrect ? "correct " : ""}nsolve-preserve-lines`} key={option.label}>{option.label}. {option.content}{option.isCorrect ? " · Kunci" : ""}</span>)}
        </article>)}
        <div className="teacher-title-actions">
          <button className="teacher-primary-button" type="button" disabled={saving || errors.length > 0} onClick={continueToExam}>Lanjut Buat Ujian</button>
          <button className="teacher-secondary-button" type="button" disabled={saving || errors.length > 0} onClick={saveImport}>{saving ? "Menyimpan..." : "Simpan ke Bank Soal"}</button>
        </div>
        <p className="teacher-wizard-help">Jika lanjut ke ujian, soal akan disimpan saat ujian dipublikasikan. Untuk menyimpan tanpa membuat ujian, pilih Bank Soal.</p>
      </section>}
    </TeacherShell>
  );
}

function TeacherParticipants({ user }) {
  const [participants, setParticipants] = useState([]);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    teacherApi.getParticipants()
      .then(({ participants: rows }) => { if (active) setParticipants(rows); })
      .catch((requestError) => { if (active) setError(requestError.message); });
    return () => { active = false; };
  }, []);
  return <TeacherShell active="Peserta Ujian" user={user}>
    <PageTitle eyebrow="PESERTA UJIAN" title="Peserta Ujian" description="Daftar siswa yang terdaftar pada paket ujian di sekolah Anda." />
    {error && <div className="teacher-alert error" role="alert">{error}</div>}
    <section className="teacher-panel teacher-results-table"><div className="teacher-table-scroll"><table><thead><tr><th>Nama Siswa</th><th>Email</th><th>Kelas</th><th>Paket Ujian</th><th>Status</th><th>Nilai</th></tr></thead><tbody>
      {participants.map((participant) => <tr key={`${participant.examId}-${participant.studentId}`}><td>{participant.fullName}</td><td>{participant.email}</td><td>{participant.className}</td><td>{participant.examTitle}</td><td>{participant.status}</td><td>{participant.score ?? "—"}</td></tr>)}
      {!participants.length && !error && <tr><td colSpan="6">Belum ada peserta yang ditambahkan ke NSolve-Tech</td></tr>}
    </tbody></table></div></section>
  </TeacherShell>;
}

function TeacherResults({ user }) {
  const [report, setReport] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    teacherApi.getResults()
      .then((data) => { if (active) setReport(data); })
      .catch((requestError) => { if (active) setError(requestError.message); });
    return () => { active = false; };
  }, []);
  return <TeacherShell active="Hasil Ujian" user={user}>
    <PageTitle eyebrow="LAPORAN HASIL UJIAN" title="Hasil Ujian" description="Pantau nilai dan ketuntasan ujian Kimia di sekolah Anda." />
    {error && <div className="teacher-alert error" role="alert">{error}</div>}
    {!report ? <p className="teacher-empty">Memuat hasil ujian...</p> : <>
      <div className="teacher-stat-grid teacher-analysis-stats">{[
        ["Nilai rata-rata", report.summary.average, "chart"],
        ["Nilai tertinggi", report.summary.highest, "check"],
        ["Nilai terendah", report.summary.lowest, "clock"],
        ["Jumlah peserta", report.summary.participants, "students"],
        ["Ketuntasan", `${report.summary.passRate}%`, "school"],
      ].map(([label, value, icon]) => <article className="teacher-stat-card" key={label}><span className={`teacher-stat-icon ${icon}`}><TeacherIcon name={icon} /></span><div><small>{label}</small><strong>{value}</strong></div></article>)}</div>
      <section className="teacher-panel teacher-results-table"><div className="teacher-panel-heading"><div><span>{report.summary.submissions} HASIL</span><h2>Nilai Peserta</h2></div></div><div className="teacher-table-scroll"><table><thead><tr><th>Nama Siswa</th><th>Paket Ujian</th><th>Kelas</th><th>Nilai</th><th>Benar</th><th>Salah</th><th>Kosong</th><th>Status Lulus</th></tr></thead><tbody>
        {report.results.map((result) => <tr key={`${result.examId}-${result.fullName}`}><td>{result.fullName}</td><td><a href={`/guru/ujian/${result.examId}/analisis`}>{result.examTitle}</a></td><td>{result.className}</td><td>{result.score}</td><td>{result.correctCount}</td><td>{result.wrongCount}</td><td>{result.unansweredCount}</td><td><span className={`teacher-result-status ${result.passed ? "passed" : "failed"}`}>{result.passed ? "Lulus" : "Belum tuntas"}</span></td></tr>)}
        {!report.results.length && <tr><td colSpan="8">Belum ada hasil ujian.</td></tr>}
      </tbody></table></div></section>
    </>}
  </TeacherShell>;
}

function TeacherClasses({ user }) {
  const [classes, setClasses] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    teacherApi.getClasses()
      .then(({ classes: rows }) => { if (active) setClasses(rows); })
      .catch((requestError) => { if (active) setError(requestError.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  return <TeacherShell active="Data Kelas" user={user}>
    <PageTitle eyebrow="KELAS MENGAJAR" title="Data Kelas" description="Daftar kelas yang ditugaskan administrator untuk Anda ajar." />
    {error && <div className="teacher-alert error" role="alert">{error}</div>}
    <section className="teacher-class-cards">
      {classes.map((item) => <article className="teacher-panel" key={item.id}>
        <span className="teacher-class-badge">{item.gradeLevel}</span>
        <div><h2>{item.name}</h2><p>{item.studentCount} siswa terdaftar</p></div>
      </article>)}
      {loading && <p className="teacher-empty">Memuat daftar kelas...</p>}
      {!loading && !error && classes.length === 0 && <div className="teacher-panel teacher-empty-state"><strong>Belum ada kelas yang ditugaskan</strong><span>Hubungi administrator sekolah untuk mengatur kelas mengajar Anda.</span></div>}
    </section>
  </TeacherShell>;
}

function TeacherProfile({ user }) {
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  useEffect(() => {
    let active = true;
    teacherApi.getProfile()
      .then((data) => {
        if (!active) return;
        setProfile(data.teacher);
        setForm({
          fullName: data.teacher.fullName,
          positionTitle: data.teacher.positionTitle ?? "Guru",
          subject: data.teacher.subject,
          academicYear: data.teacher.academicYear ?? "2026/2027",
        });
      })
      .catch((requestError) => { if (active) setError(requestError.message); });
    return () => { active = false; };
  }, []);
  async function saveProfile(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const { teacher } = await teacherApi.updateProfile(form);
      setProfile(teacher);
      setEditing(false);
      setNotice("Profil berhasil diperbarui.");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  }
  return <TeacherShell active="Profil" user={user}>
    <PageTitle eyebrow="PROFIL PENGGUNA" title="Profil Guru" description="Informasi akun dan penugasan Anda." />
    {error && <div className="teacher-alert error" role="alert">{error}</div>}
    {notice && <div className="teacher-alert success" role="status">{notice}</div>}
    {!profile ? <p className="teacher-empty">Memuat profil...</p> : (
      <section className="teacher-panel teacher-profile-card">
        <span className="teacher-profile-avatar">{profile.fullName.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase()}</span>
        {editing && form ? (
          <form className="teacher-profile-form" onSubmit={saveProfile}>
            <label>Nama Lengkap<input value={form.fullName} onChange={(event) => setForm({ ...form, fullName: event.target.value })} required /></label>
            <label>Jabatan<input value={form.positionTitle} onChange={(event) => setForm({ ...form, positionTitle: event.target.value })} placeholder="Contoh: Guru Kimia" required /></label>
            <label>Mata Pelajaran<input value={form.subject} onChange={(event) => setForm({ ...form, subject: event.target.value })} required /></label>
            <label>Tahun Ajaran<input value={form.academicYear} onChange={(event) => setForm({ ...form, academicYear: event.target.value })} required /></label>
            <label>Sekolah<input value={profile.schoolName} disabled /></label>
            <div className="teacher-profile-actions">
              <button type="button" className="teacher-secondary-button" onClick={() => setEditing(false)} disabled={saving}>Batal</button>
              <button type="submit" className="teacher-primary-button" disabled={saving}>{saving ? "Menyimpan..." : "Simpan Perubahan"}</button>
            </div>
          </form>
        ) : (
          <>
            <dl>
              <div><dt>Nama</dt><dd>{profile.fullName}</dd></div>
              <div><dt>Jabatan</dt><dd>{profile.positionTitle ?? "Guru"} {profile.subject}</dd></div>
              <div><dt>Sekolah</dt><dd>{profile.schoolName}</dd></div>
              <div><dt>Mata Pelajaran</dt><dd>{profile.subject}</dd></div>
              <div><dt>Tahun Ajaran</dt><dd>{profile.academicYear ?? "2026/2027"}</dd></div>
            </dl>
            <button type="button" className="teacher-primary-button teacher-profile-edit" onClick={() => setEditing(true)}>Edit Profil</button>
          </>
        )}
      </section>
    )}
  </TeacherShell>;
}

export default function TeacherPages({ path, search = "", user, onLogout }) {
  const account = { ...user, onLogout };
  const returnToSchedule = new URLSearchParams(search).get("from") === "schedule";
  if (account.role === "admin") {
    return <AdminWorkspace user={account} path={path} />;
  }
  if (path === "/guru/soal" || path === "/guru/bank-soal") return <ExamList user={account} />;
  if (path === "/guru/soal/baru" || path === "/guru/ujian/baru") return <TeacherExamWizard user={account} />;
  if (path === "/guru/import-soal") return <QuestionImport user={account} />;
  if (path === "/guru/jadwal-ujian" || path === "/guru/paket-ujian") return <ExamList user={account} schedule />;
  if (path === "/guru/peserta-ujian") return <TeacherParticipants user={account} />;
  if (path === "/guru/hasil-ujian") return <TeacherResults user={account} />;
  if (path === "/guru/data-kelas") return <TeacherClasses user={account} />;
  if (path === "/guru/profil") return <TeacherProfile user={account} />;
  const questionEditRoute = path.match(/^\/guru\/soal\/([^/]+)\/edit$/);
  if (questionEditRoute) return <QuestionEditor user={account} questionId={decodeURIComponent(questionEditRoute[1])} />;
  const questionRoute = path.match(/^\/guru\/soal\/([^/]+)$/);
  if (questionRoute) return <QuestionDetail user={account} questionId={questionRoute[1]} />;
  const examRoute = path.match(/^\/guru\/ujian\/([^/]+)(?:\/(preview|peserta|analisis|edit))?$/);
  if (examRoute) {
    const [, examId, action] = examRoute;
    if (action === "edit") return <TeacherExamWizard user={account} examId={examId} returnToSchedule={returnToSchedule} />;
    if (action === "preview") return <ExamPreview user={account} examId={examId} />;
    if (action === "peserta") return <ExamParticipants user={account} examId={examId} />;
    if (action === "analisis") return <ExamAnalytics user={account} examId={examId} />;
    return <ExamDetail user={account} examId={examId} returnToSchedule={returnToSchedule} />;
  }
  return <TeacherDashboard user={account} onLogout={onLogout} />;
}
