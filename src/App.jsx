import React from "react";
import { useEffect, useState } from "react";
import biologyIcon from "./icon/BIOLOGI.png";
import bahasaIndonesiaIcon from "./icon/BAHASA INDONESIA.png";
import mathIcon from "./icon/MATEMATIKA.png";
import artIcon from "./icon/SENI BUDAYA.png";
import civicsIcon from "./icon/PPKN.png";
import physicsIcon from "./icon/FISIKA.png";
import chemistryIcon from "./icon/KIMIA.png";
import Brand from "./Brand.jsx";
import StudentPages, { ActivityWarning } from "./StudentPages.jsx";
import TeacherPages, { TeacherShell } from "./TeacherPages.jsx";
import AuthPage from "./AuthPages.jsx";
import { studentApi } from "./student-api.js";

const AdminPanel = React.lazy(() => import("./admin/App.jsx"));

const subjectIcons = {
  kimia: chemistryIcon,
  fisika: physicsIcon,
  matematika: mathIcon,
  biologi: biologyIcon,
  ppkn: civicsIcon,
  "seni budaya": artIcon,
  "bahasa indonesia": bahasaIndonesiaIcon,
};
const studentNavigation = [
  ["Dashboard", "/", "dashboard"],
  ["Ujian Siswa", "/ujian", "exam"],
  ["Nilai Saya", "/nilai", "chart"],
  ["Profil Saya", "/profil", "create"],
];

function getSubjectIcon(subjectName) {
  const key = subjectName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
  return subjectIcons[key];
}

const iconPaths = {
  dashboard: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </>
  ),
  exam: (
    <>
      <rect x="5" y="4" width="14" height="17" rx="2" />
      <path d="M9 4.5h6M9 9h6M9 13h6M9 17h3" />
    </>
  ),
  grades: (
    <>
      <path d="M4 20V11M10 20V5M16 20V8M22 20H2" />
      <rect x="3" y="11" width="3" height="9" rx="1" />
      <rect x="9" y="5" width="3" height="15" rx="1" />
      <rect x="15" y="8" width="3" height="12" rx="1" />
    </>
  ),
  profile: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="9" r="2.5" />
      <path d="M7.5 18c.7-2.1 2.2-3.2 4.5-3.2s3.8 1.1 4.5 3.2" />
    </>
  ),
  bell: (
    <>
      <path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9ZM10 21h4" />
      <circle cx="19" cy="5" r="2" className="bell-dot" />
    </>
  ),
  school: (
    <>
      <path d="m3 9 9-5 9 5M5 10v8M9 10v8M15 10v8M19 10v8M3 20h18" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M7 3v4M17 3v4M3 10h18" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  lock: (
    <>
      <rect x="5" y="10" width="14" height="11" rx="2" />
      <path d="M8 10V7a4 4 0 1 1 8 0v3M12 14v3" />
    </>
  ),
  arrow: <path d="M4 12h15m-6-6 6 6-6 6" />,
  flask: (
    <>
      <path d="M9 3h6M10 3v6l-5.5 9.2A2 2 0 0 0 6.2 21h11.6a2 2 0 0 0 1.7-2.8L14 9V3M8 16h8" />
    </>
  ),
  tree: (
    <>
      <path d="M12 3 8 8h2l-4 5h4l-3 4h10l-3-4h4l-4-5h2l-4-5ZM12 17v4" />
    </>
  ),
  menu: (
    <>
      <circle cx="5" cy="5" r="1.5" />
      <circle cx="12" cy="5" r="1.5" />
      <circle cx="19" cy="5" r="1.5" />
      <circle cx="5" cy="12" r="1.5" />
      <circle cx="12" cy="12" r="1.5" />
      <circle cx="19" cy="12" r="1.5" />
      <circle cx="5" cy="19" r="1.5" />
      <circle cx="12" cy="19" r="1.5" />
      <circle cx="19" cy="19" r="1.5" />
    </>
  ),
};

function Icon({ name, className = "" }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {iconPaths[name]}
    </svg>
  );
}

function Header({ user, onLogout }) {
  const schoolName = user?.schoolName ?? "Sekolah";
  return (
    <>
      <header className="desktop-header">
        <div className="school-pill">
          <Icon name="school" />
          <span>{schoolName}</span>
        </div>
        <div className="header-account">
          <button className="notification-button" aria-label="Notifikasi">
            <Icon name="bell" />
          </button>
          <div className="student-name">
            <strong>{user.fullName}</strong>
            <small>Siswa</small>
          </div>
          <span className="student-avatar">{user.fullName.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase()}</span>
          <button className="account-logout" onClick={onLogout}>Keluar</button>
        </div>
      </header>
      <header className="mobile-header">
        <Brand variant="dashboard-compact" />
        <div className="mobile-account">
          <div className="student-name">
            <strong>{user.fullName}</strong>
            <small>Siswa</small>
          </div>
          <button className="profile-button" aria-label="Profil">
            <Icon name="profile" />
          </button>
          <button className="notification-button" aria-label="Notifikasi">
            <Icon name="bell" />
          </button>
          <button className="account-logout" onClick={onLogout}>Keluar</button>
        </div>
      </header>
    </>
  );
}

function Sidebar({ user }) {
  const schoolName = user?.schoolName ?? "Sekolah";
  const links = [
    ["dashboard", "Dashboard", true, "/"],
    ["exam", "Ujian Siswa", false, "/ujian"],
    ["grades", "Nilai Saya", false, "/nilai"],
    ["profile", "Profil Saya", false, "/profil"],
  ];

  return (
    <aside className="sidebar">
      <Brand />
      <div className="student-role-label">PORTAL SISWA</div>
      <nav className="side-nav" aria-label="Navigasi utama">
        {links.map(([icon, text, active, href]) => (
          <a className={active ? "active" : ""} href={href} key={text}>
            <Icon name={icon} />
            <span>{text}</span>
          </a>
        ))}
      </nav>
      <div className="student-sidebar-school">
        <Icon name="school" />
        <span>{schoolName}</span>
      </div>
    </aside>
  );
}

function UpcomingExam({ exam, compact = false, onStart, starting }) {
  const subjectIcon = getSubjectIcon(exam.subject);
  const startDate = new Date(exam.opensAt);
  const dateLabel = Number.isNaN(startDate.getTime())
    ? "Jadwal belum ditentukan"
    : startDate.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  const active = exam.status === "active" && exam.canStart;
  const completed = exam.completed;
  return (
    <article className={`exam-card ${compact ? "exam-card-compact" : ""}`}>
      <div className={`subject-icon ${compact ? "compact-icon" : ""}`}>
        {subjectIcon && <img src={subjectIcon} alt={`Ikon ${exam.subject}`} />}
      </div>
      <div className="exam-content">
        {compact ? (
          <div className="exam-compact-top">
            <span className={`status-tag ${active ? "start-tag" : "muted-tag"}`}>
              {completed ? "Selesai" : active ? "Aktif" : "Terjadwal"}
            </span>
            <small>{dateLabel}</small>
          </div>
        ) : (
          <div className="exam-tags">
            <span className={`status-tag ${active ? "start-tag" : "muted-tag"}`}>
              {completed ? "Sudah Dikerjakan" : active ? "Ujian Aktif" : "Terjadwal"}
            </span>
            <small>{active ? "Ujian sedang berlangsung" : "Ujian belum dimulai"}</small>
          </div>
        )}
        <h3>{compact ? exam.subject : exam.subject.toUpperCase()}</h3>
        <h4>{exam.title}</h4>
        <p className="teacher">
          <Icon name="profile" />
          <span>Guru Pengampu:</span>{" "}
          {exam.teacherName}
        </p>
        {!compact && (
          <div className="exam-details">
            <span>
              <Icon name="calendar" />
              {dateLabel}
            </span>
            <span>
              <Icon name="clock" />
              {exam.durationMinutes} Menit ({exam.questionCount} Soal)
            </span>
          </div>
        )}
        {compact && (
          <div className="compact-footer">
            <span>
              <Icon name="lock" />
              {completed ? "Lihat hasil di Nilai Saya" : active ? "Ujian sudah dibuka" : "Belum dibuka"}
            </span>
            <button disabled={!active || starting} onClick={() => onStart(exam.id)}>
              {starting ? "Memeriksa token..." : completed ? "Selesai" : active ? "Masuk Ruang Ujian" : "Terjadwal"}
            </button>
          </div>
        )}
      </div>
      {!compact && (
        <button className="join-button" disabled={!active || starting} onClick={() => onStart(exam.id)}>
          {starting ? "Memeriksa token..." : completed ? "Sudah Dikerjakan" : active ? "Masuk Ruang Ujian" : "Belum Dibuka"}
          <Icon name="arrow" />
        </button>
      )}
    </article>
  );
}

function LatestGrades({ results, loading, error }) {
  return (
    <section className="grades-section">
      <div className="panel-heading grades-heading">
        <h2>Riwayat Ujian</h2>
        <a href="/ujian/riwayat">Lihat Semua <span>›</span></a>
      </div>
      <div className="grades-grid">
        {loading && <p className="dashboard-data-message">Memuat hasil ujian...</p>}
        {!loading && error && <p className="dashboard-data-message error" role="alert">{error}</p>}
        {!loading && !error && results.length === 0 && (
          <p className="dashboard-data-message">Belum ada hasil ujian.</p>
        )}
        {!loading && !error && results.slice(0, 3).map((result) => {
          const subjectIcon = getSubjectIcon(result.subject);
          return (
            <article className="grade-card" key={result.id}>
              <div className="grade-icon">
                {subjectIcon && (
                  <img src={subjectIcon} alt={`Ikon ${result.subject}`} />
                )}
              </div>
              <div className="grade-title">
                <strong>{result.subject}</strong>
                <small>{result.examTitle}</small>
              </div>
              <div className="grade-score">
                <strong>{Math.round(result.score)}</strong>
                <span>/100</span>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function BottomNav() {
  const items = [
    ["dashboard", "Beranda", true, "/"],
    ["exam", "Ujian", false, "/ujian"],
    ["calendar", "Jadwal", false, "/ujian"],
    ["grades", "Nilai", false, "/nilai"],
    ["profile", "Profil", false, "/profil"],
  ];
  return (
    <nav className="bottom-nav" aria-label="Navigasi mobile">
      {items.map(([icon, label, active, href], index) => (
        <a className={active ? "active" : ""} href={href} key={label}>
          <span className="bottom-icon-wrap">
            <Icon name={icon} />
            {index === 4 && <i />}
          </span>
          <span>{label}</span>
          {active && <i className="active-dot" />}
        </a>
      ))}
    </nav>
  );
}

function ExamTokenDialog({ examId, onClose, onSubmit, token, onTokenChange, error, submitting }) {
  const [activityWarning, setActivityWarning] = useState(null);
  useEffect(() => {
    if (!examId) return undefined;
    let active = true;
    let lastReportedAt = 0;
    const report = async (eventType) => {
      if (Date.now() - lastReportedAt < 2000) return;
      lastReportedAt = Date.now();
      try {
        const activity = await studentApi.reportExamActivity(examId, { eventType });
        window.navigator.vibrate?.([180, 80, 180]);
        if (active) setActivityWarning({ ...activity, eventType });
      } catch (requestError) {
        window.navigator.vibrate?.([180, 80, 180]);
        if (active) setActivityWarning({ eventType, error: requestError.message });
      }
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") report("tab_hidden");
    };
    const onBlur = () => report("window_blur");
    const onKeyDown = (event) => {
      if (event.key === "PrintScreen") report("print_screen");
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("blur", onBlur);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      active = false;
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [examId]);
  if (!examId) return null;
  return (
    <div className="exam-token-backdrop">
      <section className="exam-token-dialog" role="dialog" aria-modal="true" aria-labelledby="exam-token-title">
        <button type="button" className="exam-token-close" onClick={onClose} aria-label="Tutup">×</button>
        <span className="exam-token-icon"><Icon name="lock" /></span>
        <h2 id="exam-token-title">Masuk Ruang Ujian</h2>
        <p>Masukkan token yang diberikan guru untuk memulai ujian.</p>
        <ActivityWarning
          activity={activityWarning}
          onClose={() => setActivityWarning(null)}
        />
        <form onSubmit={onSubmit}>
          <label htmlFor="exam-token-input">Token Ujian</label>
          <input
            id="exam-token-input"
            autoFocus
            autoComplete="off"
            maxLength="8"
            placeholder="Contoh: KIM23#"
            value={token}
            onChange={(event) => onTokenChange(event.target.value.toUpperCase())}
            required
          />
          {error && <span className="exam-token-error" role="alert">{error}</span>}
          <div>
            <button type="button" className="exam-token-cancel" onClick={onClose}>Batal</button>
            <button type="submit" className="exam-token-submit" disabled={submitting}>
              {submitting ? "Memeriksa..." : "Masuk Ujian"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

function App() {
  const { pathname, search } = window.location;
  const authRoute = pathname === "/login" || pathname === "/daftar" || pathname === "/register";
  const registering = pathname === "/daftar" || pathname === "/register";
  const dashboardRoute = pathname === "/" || pathname === "/dashboard";
  const teacherRoute = pathname === "/guru" || pathname.startsWith("/guru/");
  const adminRoute = pathname === "/admin" || pathname.startsWith("/admin/");
  const [auth, setAuth] = useState({ status: "loading", user: null, error: null });
  const teacherRole = auth.user?.role === "teacher";
  const adminRole = auth.user?.role === "admin";
  const [dashboardData, setDashboardData] = useState({
    loading: true,
    exams: [],
    results: [],
    error: null,
  });
  const [startingExamId, setStartingExamId] = useState(null);
  const [actionError, setActionError] = useState("");
  const [examTokenDialogId, setExamTokenDialogId] = useState(null);
  const [examToken, setExamToken] = useState("");
  const [examTokenError, setExamTokenError] = useState("");

  useEffect(() => {
    let active = true;
    studentApi.getSession()
      .then(({ user }) => {
        if (active) setAuth({ status: "ready", user, error: null });
      })
      .catch((error) => {
        if (active) setAuth({ status: "error", user: null, error });
      });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (auth.status !== "ready") return;
    if (!auth.user && !authRoute) {
      sessionStorage.setItem("nsolve-return-to", `${pathname}${search}`);
      window.location.replace("/login");
    } else if (auth.user && authRoute) {
      window.location.replace(adminRole ? "/admin" : teacherRole ? "/guru" : "/");
    } else if (auth.user && adminRole && !adminRoute) {
      window.location.replace("/admin");
    } else if (auth.user && teacherRole && (!teacherRoute || adminRoute)) {
      window.location.replace("/guru");
    } else if (auth.user && !teacherRole && !adminRole && (teacherRoute || adminRoute)) {
      window.location.replace("/");
    }
  }, [auth.status, auth.user, authRoute, pathname, search, teacherRole, adminRole, teacherRoute, adminRoute]);

  useEffect(() => {
    if (auth.status !== "ready" || !auth.user || !dashboardRoute) return undefined;
    let active = true;
    setDashboardData({ loading: true, exams: [], results: [], error: null });
    Promise.all([studentApi.getExams(), studentApi.getResults()])
      .then(([examData, resultData]) => {
        if (active) setDashboardData({
          loading: false,
          exams: examData.exams,
          results: resultData.results,
          error: null,
        });
      })
      .catch((error) => {
        if (active) setDashboardData({
          loading: false,
          exams: [],
          results: [],
          error: error.message,
        });
      });
    return () => { active = false; };
  }, [auth.status, auth.user, dashboardRoute]);

  async function handleAuthenticate(values) {
    const response = registering
      ? await studentApi.register(values)
      : await studentApi.login(values);
    setAuth({ status: "ready", user: response.user, error: null });
    const returnTo = sessionStorage.getItem("nsolve-return-to") || "/";
    sessionStorage.removeItem("nsolve-return-to");
    const roleHome = response.user.role === "admin"
      ? "/admin"
      : response.user.role === "teacher" ? "/guru" : "/";
    const returnMatchesRole = returnTo.startsWith("/") && (
      response.user.role === "admin"
        ? returnTo === "/admin" || returnTo.startsWith("/admin/")
        : response.user.role === "teacher"
          ? returnTo === "/guru" || returnTo.startsWith("/guru/")
          : returnTo !== "/admin" && !returnTo.startsWith("/admin/") &&
            returnTo !== "/guru" && !returnTo.startsWith("/guru/")
    );
    window.location.assign(returnMatchesRole ? returnTo : roleHome);
  }

  async function handleLogout() {
    setActionError("");
    try {
      await studentApi.logout();
      window.location.replace("/login");
    } catch (error) {
      setActionError(error.message);
    }
  }

  function handleProfileUpdated(profile) {
    setAuth((current) => current.user
      ? { ...current, user: { ...current.user, fullName: profile.fullName, email: profile.email } }
      : current);
  }

  function handleStartExam(examId) {
    setExamTokenDialogId(examId);
    setExamToken("");
    setExamTokenError("");
  }

  async function submitExamToken(event) {
    event.preventDefault();
    if (!examTokenDialogId) return;
    const examId = examTokenDialogId;
    setStartingExamId(examId);
    setExamTokenError("");
    try {
      const response = await studentApi.startExam(examId, examToken.trim());
      if (response.result) {
        window.location.assign(`/ujian/selesai?id=${encodeURIComponent(response.result.id)}`);
        return;
      }
      const { attempt } = response;
      window.location.assign(
        `/ujian/aktif?examId=${encodeURIComponent(examId)}&attemptId=${encodeURIComponent(attempt.id)}`,
      );
    } catch (error) {
      setExamTokenError(error.message);
      setStartingExamId(null);
    }
  }

  const tokenDialog = (
    <ExamTokenDialog
      examId={examTokenDialogId}
      onClose={() => {
        setExamTokenDialogId(null);
        setExamTokenError("");
        setStartingExamId(null);
      }}
      onSubmit={submitExamToken}
      token={examToken}
      onTokenChange={setExamToken}
      error={examTokenError}
      submitting={startingExamId === examTokenDialogId}
    />
  );

  if (auth.status === "loading") {
    return <main className="auth-page"><p role="status">Memeriksa sesi masuk...</p></main>;
  }
  if (auth.status === "error") {
    return (
      <main className="auth-page">
        <section className="auth-card" role="alert">
          <h1>Server belum dapat dihubungi</h1>
          <p>{auth.error.message}</p>
          <button onClick={() => window.location.reload()}>Coba lagi</button>
        </section>
      </main>
    );
  }
  if (!auth.user) {
    if (authRoute) return <AuthPage mode={registering ? "register" : "login"} onAuthenticate={handleAuthenticate} />;
    return <AuthPage mode="login" onAuthenticate={handleAuthenticate} />;
  }
  if (adminRole) {
    if (!adminRoute) return <main className="auth-page"><p role="status">Mengarahkan ke Dashboard Admin...</p></main>;
    return (
      <React.Suspense fallback={<main className="auth-page"><p role="status">Memuat Dashboard Admin...</p></main>}>
        <AdminPanel basePath="/admin" initialUser={auth.user} onLogout={handleLogout} />
      </React.Suspense>
    );
  }
  if (teacherRole) {
    return (
      <>
        {actionError && <p className="global-action-error" role="alert">{actionError}</p>}
        <TeacherPages
          path={teacherRoute ? pathname : "/guru"}
          search={search}
          user={auth.user}
          onLogout={handleLogout}
        />
      </>
    );
  }
  if (teacherRoute) {
    return <main className="auth-page"><section className="auth-card" role="alert">Akun Guru diperlukan untuk membuka halaman ini.</section></main>;
  }
  if (authRoute) return null;

  if (!dashboardRoute) {
    return (
      <>
        {actionError && <p className="global-action-error" role="alert">{actionError}</p>}
        <StudentPages
          path={pathname}
          search={search}
          user={auth.user}
          onLogout={handleLogout}
          onProfileUpdated={handleProfileUpdated}
          onStartExam={handleStartExam}
          startingExamId={startingExamId}
        />
        {tokenDialog}
      </>
    );
  }

  return (
    <TeacherShell
      active="Dashboard"
      user={auth.user}
      onLogout={handleLogout}
      navigation={studentNavigation}
      workspaceLabel="PORTAL SISWA"
      roleDescription="Siswa"
    >
        <div className="dashboard student-dashboard">
          <section className="welcome panel">
            <h1>
              Halo, {auth.user.fullName.split(" ")[0]} <span aria-hidden="true">👋</span>
            </h1>
            <p>
              <span className="desktop-welcome">
                Selamat datang kembali di <strong>NSolve-Tech.</strong> Anda memiliki
              </span>
              <span className="mobile-welcome">
                Selamat datang di portal ujian <strong>NSolve-Tech.</strong>
              </span>
              <b>
                <span className="desktop-count">{dashboardData.exams.filter((exam) => exam.status === "scheduled").length} ujian</span>
                <span className="mobile-count">{dashboardData.exams.filter((exam) => exam.status === "scheduled").length} ujian tersedia</span>
              </b>
              <span className="desktop-welcome"> menunggu jadwal mulai.</span>
            </p>
          </section>

          <section className="upcoming-section">
            <div className="section-title-row">
              <h2>Ujian Akan Datang</h2>
              <a href="/ujian">Lihat Semua Jadwal <span>›</span></a>
            </div>
            <div className="upcoming-grid">
              {dashboardData.loading && <p className="dashboard-data-message">Memuat jadwal ujian...</p>}
              {!dashboardData.loading && dashboardData.error && (
                <p className="dashboard-data-message error" role="alert">{dashboardData.error}</p>
              )}
              {!dashboardData.loading && !dashboardData.error && dashboardData.exams.filter((exam) => exam.status === "scheduled").length === 0 && (
                <p className="dashboard-data-message">{dashboardData.exams.length === 0 ? "Belum ada ujian yang tersedia untuk kelas Anda." : "Belum ada ujian yang dijadwalkan."}</p>
              )}
              {!dashboardData.loading && !dashboardData.error && dashboardData.exams.filter((exam) => exam.status === "scheduled").slice(0, 2).map((exam, index) => (
                <UpcomingExam
                  key={exam.id}
                  exam={exam}
                  compact={index > 0}
                  onStart={handleStartExam}
                  starting={startingExamId === exam.id}
                />
              ))}
            </div>
            {actionError && <p className="dashboard-data-message error" role="alert">{actionError}</p>}
          </section>

          <section className="upcoming-section">
            <div className="section-title-row">
              <h2>Ujian Aktif</h2>
              <a href="/ujian">Lihat Semua <span>›</span></a>
            </div>
            <div className="upcoming-grid">
              {!dashboardData.loading && !dashboardData.error && dashboardData.exams.filter((exam) => exam.status === "active" && exam.canStart).length === 0 && (
                <p className="dashboard-data-message">Belum ada ujian aktif.</p>
              )}
              {dashboardData.exams.filter((exam) => exam.status === "active" && exam.canStart).slice(0, 2).map((exam, index) => (
                <UpcomingExam key={exam.id} exam={exam} compact={index > 0} onStart={handleStartExam} starting={startingExamId === exam.id} />
              ))}
            </div>
          </section>
          <LatestGrades
            results={dashboardData.results}
            loading={dashboardData.loading}
            error={dashboardData.error}
          />
          <footer className="page-footer">
            © 2026 All rights reserved&nbsp; | &nbsp;<strong>NSolve-Tech</strong>
          </footer>
        </div>
      {tokenDialog}
    </TeacherShell>
  );
}

export default App;
