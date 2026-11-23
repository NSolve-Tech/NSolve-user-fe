import React, { useEffect, useRef, useState } from "react";
import Brand from "./Brand.jsx";
import biologyIcon from "./icon/BIOLOGI.png";
import bahasaIndonesiaIcon from "./icon/BAHASA INDONESIA.png";
import mathIcon from "./icon/MATEMATIKA.png";
import artIcon from "./icon/SENI BUDAYA.png";
import civicsIcon from "./icon/PPKN.png";
import physicsIcon from "./icon/FISIKA.png";
import chemistryIcon from "./icon/KIMIA.png";
import { studentApi } from "./student-api.js";
import { TeacherShell } from "./TeacherPages.jsx";
import "./student-pages.css";

const studentNavigation = [
  ["Dashboard", "/", "dashboard"],
  ["Ujian Siswa", "/ujian", "exam"],
  ["Nilai Saya", "/nilai", "chart"],
  ["Profil Saya", "/profil", "create"],
];

const iconMap = {
  Kimia: chemistryIcon,
  Fisika: physicsIcon,
  Biologi: biologyIcon,
  Matematika: mathIcon,
  PPKN: civicsIcon,
  "Seni Budaya": artIcon,
  "Bahasa Indonesia": bahasaIndonesiaIcon,
};

function useExamActivityMonitor(examId, attemptId, enabled, onViolation) {
  const callbackRef = useRef(onViolation);
  useEffect(() => { callbackRef.current = onViolation; }, [onViolation]);
  useEffect(() => {
    if (!enabled || !examId) return undefined;
    let lastReportedAt = 0;
    let disposed = false;
    let leavingPage = false;
    const pendingReports = new Set();
    const report = async (eventType, { keepalive = false, notify = true } = {}) => {
      const currentTime = Date.now();
      if (eventType !== "app_closed" && currentTime - lastReportedAt < 2000) return;
      lastReportedAt = currentTime;
      try {
        const activity = await studentApi.reportExamActivity(examId, {
          ...(attemptId ? { attemptId } : {}),
          eventType,
        }, keepalive ? { keepalive: true } : undefined);
        if (notify && !disposed) {
          window.navigator.vibrate?.([180, 80, 180]);
          callbackRef.current?.({ ...activity, eventType });
        }
      } catch (error) {
        if (notify && !disposed) {
          window.navigator.vibrate?.([180, 80, 180]);
          callbackRef.current?.({ eventType, error: error.message });
        }
      }
    };
    const onVisibilityChange = () => {
      if (!leavingPage && document.visibilityState === "hidden") scheduleReport("tab_hidden");
    };
    const onKeyDown = (event) => {
      if (!leavingPage && event.key === "PrintScreen") report("print_screen");
    };
    const onFullscreenChange = () => {
      if (!leavingPage && !document.fullscreenElement) scheduleReport("fullscreen_exit");
    };
    const scheduleReport = (eventType) => {
      const timer = window.setTimeout(() => {
        pendingReports.delete(timer);
        if (!leavingPage) report(eventType);
      }, 150);
      pendingReports.add(timer);
    };
    const onBlur = () => { if (!leavingPage) scheduleReport("window_blur"); };
    const onPageHide = () => {
      leavingPage = true;
      for (const timer of pendingReports) window.clearTimeout(timer);
      pendingReports.clear();
      if (attemptId) report("app_closed", { keepalive: true, notify: false });
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    document.addEventListener("fullscreenchange", onFullscreenChange);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("blur", onBlur);
    window.addEventListener("pagehide", onPageHide);
    return () => {
      disposed = true;
      for (const timer of pendingReports) window.clearTimeout(timer);
      pendingReports.clear();
      document.removeEventListener("visibilitychange", onVisibilityChange);
      document.removeEventListener("fullscreenchange", onFullscreenChange);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("pagehide", onPageHide);
    };
  }, [examId, attemptId, enabled]);
}

function navigateAfterExam(result) {
  if (result.showScore === false) {
    window.alert("Soal Ujian Telah Selesai Dikerjakan");
    window.location.replace("/");
    return;
  }
  window.location.assign(`/ujian/selesai?id=${encodeURIComponent(result.id)}`);
}

function ActivityWarning({ activity, onClose, frozen = false }) {
  if (!activity) return null;
  const eventLabels = {
    tab_hidden: "Perpindahan tab",
    window_blur: "Jendela kehilangan fokus",
    fullscreen_exit: "Keluar dari layar penuh",
    print_screen: "Tombol screenshot",
  };
  return <div className="activity-warning-backdrop">
    <section className="activity-warning" role="alertdialog" aria-modal="true" aria-labelledby="activity-warning-title">
      <span className="activity-warning-icon"><UiIcon name="warning" /></span>
      <h2 id="activity-warning-title">Aktivitas ujian terdeteksi</h2>
      <p>{eventLabels[activity.eventType] ?? "Aktivitas browser"} tercatat. Deteksi browser bersifat terbatas dan tidak dapat menjamin semua screenshot tertangkap.</p>
      {activity.violationCount && <strong className="activity-warning-count">Pelanggaran {activity.violationCount} dari 3</strong>}
      {activity.disqualified && <p className="activity-warning-error">Sesi ditandai untuk verifikasi administrator. Akses ke soal telah dihentikan.</p>}
      {frozen && !activity.disqualified && <p className="activity-warning-error">Sesi dibekukan sementara. Jawaban akan dapat dilanjutkan setelah masa pembekuan berakhir.</p>}
      {activity.error && <p className="activity-warning-error" role="alert">Aktivitas belum berhasil dikirim ke server: {activity.error}</p>}
      {!activity.disqualified && <button type="button" onClick={onClose} disabled={frozen}>
        {frozen ? "Sesi dibekukan sementara" : "Saya Mengerti"}
      </button>}
    </section>
  </div>;
}

function UiIcon({ name, size = 18 }) {
  const paths = {
    home: <><path d="m3 10 9-7 9 7" /><path d="M5 9v11h14V9M9 20v-6h6v6" /></>,
    exam: <><rect x="5" y="3" width="14" height="18" rx="2" /><path d="M9 7h6M9 11h6M9 15h4" /></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M7 3v4M17 3v4M3 10h18" /></>,
    grades: <><path d="M4 20V11M10 20V5M16 20V8M22 20H2" /></>,
    profile: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="9" r="2.5" /><path d="M7.5 18c.7-2.1 2.2-3.2 4.5-3.2s3.8 1.1 4.5 3.2" /></>,
    bell: <><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9ZM10 21h4" /></>,
    back: <><path d="m15 18-6-6 6-6M9 12h12" /></>,
    book: <><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v17H6.5A2.5 2.5 0 0 1 4 17.5zM4 5.5v12M8 7h8M8 11h8" /></>,
    time: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    check: <><path d="m5 12 4 4L19 6" /></>,
    warning: <><path d="m12 3 10 18H2z" /><path d="M12 9v5M12 17h.01" /></>,
    lock: <><rect x="5" y="10" width="14" height="11" rx="2" /><path d="M8 10V7a4 4 0 1 1 8 0v3" /></>,
    arrow: <><path d="M4 12h15m-6-6 6 6-6 6" /></>,
    light: <><path d="M9 18h6M10 22h4M8 14a6 6 0 1 1 8 0c-.8.6-1 1.3-1 2H9c0-.7-.2-1.4-1-2Z" /></>,
    shield: <><path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z" /><path d="m9 12 2 2 4-4" /></>,
  };
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name]}
    </svg>
  );
}

function getInitials(fullName = "") {
  return fullName.trim().split(/\s+/).slice(0, 2).map((part) => part[0] ?? "").join("").toUpperCase();
}

function SiteHeader({ active = "Ujian Siswa", waiting = false, user, onLogout }) {
  const schoolName = user?.schoolName ?? "Sekolah";
  const nav = [
    ["Dashboard", "/"],
    ["Ujian Siswa", "/ujian"],
    ["Nilai Saya", "/nilai"],
    ["Profil Saya", "/profil"],
  ];

  return (
    <header className={`site-header ${waiting ? "waiting-header" : ""}`}>
      <aside className="student-sidebar">
        <Brand variant="top" />
        <div className="student-role-label">PORTAL SISWA</div>
        <nav className="student-sidebar-nav" aria-label="Navigasi siswa">
          {nav.map(([label, href]) => (
            <a className={label === active ? "active" : ""} href={href} key={label}>
              <UiIcon name={label === "Dashboard" ? "home" : label === "Ujian Siswa" ? "exam" : label === "Nilai Saya" ? "grades" : "profile"} />
              {label}
            </a>
          ))}
        </nav>
        <div className="student-sidebar-school">
          <UiIcon name="profile" size={16} />
          <span>{schoolName}</span>
        </div>
      </aside>
      <div className="student-main-header">
        <div className="student-header-school">🏫 {schoolName}</div>
        <div className="site-user">
          <span>
            <strong>{user?.fullName ?? "Siswa"}</strong>
            <small>Siswa</small>
          </span>
          <i>{getInitials(user?.fullName)}</i>
          <button className="site-logout" onClick={onLogout}>Keluar</button>
        </div>
      </div>
      <div className="site-mobile-main">
        <Brand variant="compact" />
        <div className="site-mobile-user">
          <span><strong>{user?.fullName ?? "Siswa"}</strong><small>{user?.email}</small></span>
          <i>{getInitials(user?.fullName)}</i>
          {!waiting && <button aria-label="Notifikasi"><UiIcon name="bell" size={17} /></button>}
          <button className="site-logout" onClick={onLogout}>Keluar</button>
        </div>
      </div>
      {waiting && (
        <nav className="waiting-mobile-nav">
          {nav.slice(0, 4).map(([label, href]) => (
            <a className={label === active ? "active" : ""} href={href} key={label}>{label}</a>
          ))}
        </nav>
      )}
    </header>
  );
}

function MobileNav({ active = "Beranda" }) {
  const items = [
    ["Beranda", "/", "home"],
    ["Ujian", "/ujian", "exam"],
    ["Jadwal", "/ruang-ujian", "calendar"],
    ["Nilai", "/nilai", "grades"],
    ["Profil", "/profil", "profile"],
  ];
  return (
    <nav className="student-bottom-nav" aria-label="Navigasi bawah">
      {items.map(([label, href, icon]) => (
        <a className={active === label ? "active" : ""} href={href} key={label}>
          <UiIcon name={icon} />
          <span>{label}</span>
          {active === label && <i />}
        </a>
      ))}
    </nav>
  );
}

function SiteFooter() {
  return <footer className="student-footer">© 2026 All rights reserved&nbsp; | &nbsp;<strong>NSolve-Tech</strong></footer>;
}

function SubjectBadge({ name, className = "" }) {
  const image = iconMap[name];
  return (
    <span className={`subject-badge ${className}`}>
      {image && <img src={image} alt={`Ikon ${name}`} />}
    </span>
  );
}

function ExamPortal({ history = false, user, onLogout, onStartExam, startingExamId }) {
  const activeHref = "/ujian";
  const historyHref = "/ujian/riwayat";
  const [exams, setExams] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    Promise.all([studentApi.getExams(), studentApi.getResults()])
      .then(([examData, resultData]) => {
        if (!active) return;
        setExams(examData.exams);
        setResults(resultData.results);
        setError("");
      })
      .catch((requestError) => {
        if (active) setError(requestError.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  const visibleResults = results.filter((result) => result.showScore !== false && result.score !== null);
  const average = visibleResults.length
    ? visibleResults.reduce((sum, result) => sum + result.score, 0) / visibleResults.length
    : 0;
  const passed = visibleResults.filter((result) => result.score >= result.kkm).length;
  const activeExamCount = exams.filter((exam) => exam.status === "active" && exam.canStart).length;

  return (
    <TeacherShell
      active="Ujian Siswa"
      user={user}
      onLogout={onLogout}
      navigation={studentNavigation}
      workspaceLabel="PORTAL SISWA"
      roleDescription="Siswa"
    >
      <main className="portal-content">
        <div className="portal-title-row">
          <div>
            <h1>Ujian Siswa</h1>
            <p>Pilih ujian yang sedang berlangsung atau tinjau kembali hasil ujian yang telah kamu selesaikan.</p>
          </div>
          <div className="exam-tabs">
            <a className={!history ? "active" : ""} href={activeHref}>Ujian Aktif <b>{activeExamCount}</b></a>
            <a className={history ? "active" : ""} href={historyHref}>Riwayat Ujian <b>{results.length}</b></a>
          </div>
        </div>

        {history ? (
          <>
            <section className="history-summary">
              <div className="history-summary-heading">
                <h2><UiIcon name="grades" /> Ringkasan Hasil Ujian</h2>
                <span>● Data Tersinkronisasi Otomatis</span>
              </div>
              <div className="summary-stats">
                <article><small>Rata-rata Nilai</small><strong>{visibleResults.length ? average.toFixed(1) : "—"}{visibleResults.length > 0 && <em> / 100</em>}</strong><span>{visibleResults.length ? "Dari hasil yang ditampilkan guru" : "Nilai disembunyikan oleh guru"}</span></article>
                <article><small>Ujian Selesai</small><strong>{results.length} <em>Ujian</em></strong><span>Hasil milik akun Anda</span></article>
                <article><small>Status Kelulusan</small><strong>{visibleResults.length ? passed : "—"}{visibleResults.length > 0 && <em> Lulus</em>}</strong><span>{visibleResults.length ? `${visibleResults.length - passed} perlu remedial` : "Belum ditampilkan guru"}</span></article>
              </div>
            </section>
            {loading && <p className="student-data-message">Memuat riwayat ujian...</p>}
            {error && <p className="student-data-message error" role="alert">{error}</p>}
            {!loading && !error && results.length === 0 && (
              <p className="student-data-message">Belum ada ujian yang dikumpulkan.</p>
            )}
            <section className="history-list">
              {!loading && !error && results.map((item) => (
                <article className={`history-card ${item.showScore !== false && item.score < item.kkm ? "remedial" : ""}`} key={item.id}>
                  <div className="history-card-top">
                    <span className={item.showScore === false ? "" : item.score >= item.kkm ? "pass-tag" : "remedial-tag"}>
                      {item.showScore === false ? "Nilai disembunyikan oleh guru" : item.score >= item.kkm ? `✓ Lulus KKM (${item.kkm})` : `△ Perlu Remedial (KKM ${item.kkm})`}
                    </span>
                    <b>{item.code}</b>
                    <time>{new Date(item.createdAt).toLocaleString("id-ID")}</time>
                  </div>
                  <div className="history-card-body">
                    <SubjectBadge name={item.subject} />
                    <div className="history-description">
                      <h3>{item.subject}: {item.examTitle}</h3>
                      <p>Kode ujian <strong>{item.code}</strong></p>
                      {item.showScore !== false ? <div>
                        <span>✓ Benar {item.correctCount} Soal</span><i>·</i>
                        <b>× Salah {item.wrongCount} Soal</b><i>·</i>
                        <span>◷ Kosong {item.unansweredCount} Soal</span>
                      </div> : <p>Hasil ujian telah dikumpulkan.</p>}
                    </div>
                    <div className="history-score">
                      {item.showScore !== false ? <>
                        <small>Skor Evaluasi</small>
                        <strong>{Math.round(item.score)}<em> / 100</em></strong>
                        <span className={item.score >= item.kkm ? "pass-tag" : "remedial-tag"}>
                          {item.score >= item.kkm ? "Lulus" : "Perlu Remedial"}
                        </span>
                      </> : <span>Nilai belum ditampilkan</span>}
                      <a href={`/ujian/selesai?id=${encodeURIComponent(item.id)}`}>
                        {item.showScore === false ? "Lihat Status" : "Lihat Hasil"} <UiIcon name="arrow" size={15} />
                      </a>
                    </div>
                  </div>
                </article>
              ))}
            </section>
            {error && <button className="more-button" onClick={() => window.location.reload()}>Coba lagi</button>}
            <aside className="evaluation-tip"><span><UiIcon name="light" /></span><div><strong>Tips Evaluasi Mandiri</strong><p>Periksa pembahasan jawaban benar dan salah pada hasil ujian untuk meninjau kembali materi yang perlu dipelajari.</p></div></aside>
          </>
        ) : (
          <>
            {loading && <p className="student-data-message">Memuat daftar ujian...</p>}
            {error && <p className="student-data-message error" role="alert">{error}</p>}
            <section className="active-exam-list">
              {!loading && !error && exams.length === 0 && (
                <p className="student-data-message">Belum ada ujian yang tersedia untuk kelas Anda.</p>
              )}
              {exams.map((exam, index) => {
                const active = exam.status === "active" && exam.canStart;
                const completed = exam.completed;
                const date = new Date(exam.opensAt).toLocaleString("id-ID");
                return (
                  <article className={`active-exam-card ${active ? "current" : ""}`} key={exam.id}>
                    <SubjectBadge name={exam.subject} />
                    <div className="active-exam-info">
                      <div className="active-exam-tags">
                        <span className={active ? "live-tag" : "date-tag"}>
                          {completed ? "✓ Selesai" : active ? "● Ujian Aktif" : `◷ ${date}`}
                        </span>
                      </div>
                      <h2>{exam.subject}<br />{exam.title}</h2>
                      <p className="topic">{exam.description}</p>
                      <div className="active-exam-meta">
                        <span><UiIcon name="calendar" /> {date}</span>
                        <span><UiIcon name="time" /> Durasi: <b>{exam.durationMinutes} Menit</b></span>
                        <span><UiIcon name="book" /> {exam.questionCount} Butir Soal</span>
                      </div>
                      <p className="instructor">Guru: <b>{exam.teacherName}</b></p>
                    </div>
                    <div className="active-exam-actions">
                      <span>{completed ? "Sudah dikumpulkan" : active ? "Siap dikerjakan" : "Menunggu jadwal ujian"}</span>
                      <button
                        disabled={!active || startingExamId === exam.id}
                        onClick={() => onStartExam(exam.id)}
                      >
                        {startingExamId === exam.id ? "Memeriksa token..." : completed ? "Sudah Dikerjakan" : active ? "Masuk Ruang Ujian" : "Belum Dibuka"}
                        {active && <UiIcon name="arrow" />}
                      </button>
                    </div>
                  </article>
                );
              })}
            </section>
            <aside className="exam-tip"><UiIcon name="light" /><p><strong>Tips Mengerjakan:</strong> Pastikan berdoa sebelum mulai, baca instruksi setiap butir soal dengan teliti, dan simpan jawaban secara berkala. Semoga sukses!</p></aside>
          </>
        )}
      </main>
    </TeacherShell>
  );
}

function GradePage({ user, onLogout }) {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [requestingId, setRequestingId] = useState("");

  useEffect(() => {
    let active = true;
    studentApi.getResults()
      .then(({ results: data }) => {
        if (active) setResults(data);
      })
      .catch((requestError) => {
        if (active) setError(requestError.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  const visibleResults = results.filter((result) => result.showScore !== false && result.score !== null);
  const average = visibleResults.length
    ? visibleResults.reduce((sum, result) => sum + result.score, 0) / visibleResults.length
    : 0;
  const passed = visibleResults.filter((result) => result.score >= result.kkm).length;
  const remedialResult = visibleResults.find((result) => result.score < result.kkm);

  async function requestRemedial(resultId) {
    setRequestingId(resultId);
    setError("");
    setNotice("");
    try {
      const { request } = await studentApi.requestRemedial(resultId);
      setResults((current) => current.map((result) =>
        result.id === resultId ? { ...result, remedialStatus: request.status } : result,
      ));
      setNotice("Permohonan remedial telah dikirim kepada guru pengampu.");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setRequestingId("");
    }
  }

  return (
    <TeacherShell
      active="Nilai Saya"
      user={user}
      onLogout={onLogout}
      navigation={studentNavigation}
      workspaceLabel="PORTAL SISWA"
      roleDescription="Siswa"
    >
      <main className="grade-content">
        <div className="grade-heading">
          <h1>Nilai Siswa</h1>
          <p>Pantau hasil ujian, evaluasi pencapaian akademik, dan status ketuntasan KKM secara real-time.</p>
        </div>
        <div className="grade-legend"><span>● Lulus (nilai ≥ KKM)</span><b>·</b><span>● Perlu Remedial (nilai &lt; KKM)</span></div>
        <div className="grade-layout">
          <section className="grade-results-panel">
            <header className="grade-results-heading">
              <div><h2><UiIcon name="book" /> Rekapitulasi Nilai Ujian</h2><small>{results.length} hasil tersimpan</small></div>
              <span>Rata-rata {visibleResults.length ? average.toFixed(1) : "—"}</span>
            </header>
            {loading && <p className="student-data-message">Memuat nilai...</p>}
            {error && <p className="student-data-message error" role="alert">{error}</p>}
            {notice && <p className="student-data-message" role="status">{notice}</p>}
            {!loading && !error && results.length === 0 && (
              <p className="student-data-message">Belum ada hasil. Selesaikan ujian untuk melihat nilai di sini.</p>
            )}
            <div className="grade-results-grid">
              {results.map((result) => {
                const scoreVisible = result.showScore !== false && result.score !== null;
                const isPassed = scoreVisible && result.score >= result.kkm;
                const remedialPending = ["pending", "approved", "scheduled"].includes(result.remedialStatus);
                const duration = `${Math.floor(result.durationSeconds / 60)} mnt ${result.durationSeconds % 60} dtk`;
                return (
                  <article className={`grade-result-card ${scoreVisible ? isPassed ? "passed" : "remedial" : ""}`} key={result.id}>
                    <header>
                      <div><span className="grade-result-subject">{result.subject}</span><h3>{result.examTitle}</h3></div>
                      <span className={`grade-result-status ${scoreVisible ? isPassed ? "passed" : "remedial" : ""}`}>{scoreVisible ? isPassed ? "Lulus" : "Perlu Remedial" : "Nilai disembunyikan"}</span>
                    </header>
                    {scoreVisible ? <>
                      <div className="grade-result-score">
                      <div><small>NILAI AKHIR</small><strong>{Math.round(result.score)}<span>/100</span></strong></div>
                      <span>KKM <b>{result.kkm}</b></span>
                      </div>
                      <div className="grade-result-counts">
                        <span className="correct"><b>{result.correctCount}</b> Benar</span>
                        <span className="wrong"><b>{result.wrongCount}</b> Salah</span>
                        <span className="unanswered"><b>{result.unansweredCount}</b> Kosong</span>
                      </div>
                    </> : <p className="student-data-message">Ujian selesai. Nilai belum ditampilkan oleh guru.</p>}
                    <footer>
                      <span>{new Date(result.createdAt).toLocaleString("id-ID")} · {duration}</span>
                      <div>
                        {scoreVisible && !isPassed && <button type="button" className="grade-remedial-button" onClick={() => requestRemedial(result.id)} disabled={requestingId === result.id || remedialPending}>
                          {requestingId === result.id ? "Mengirim..." : remedialPending ? "Remedial Diajukan" : "Ajukan Remedial"}
                        </button>}
                        <a href={`/ujian/selesai?id=${encodeURIComponent(result.id)}`}>{scoreVisible ? "Lihat Review" : "Lihat Status"}</a>
                      </div>
                    </footer>
                  </article>
                );
              })}
            </div>
            {!loading && !error && results.length > 0 && <p className="grade-results-footnote">{visibleResults.length ? `${passed} dari ${visibleResults.length} ujian yang nilainya ditampilkan memenuhi KKM.` : "Nilai ujian disembunyikan oleh guru."}</p>}
          </section>
          <aside className="teacher-notes">
            <article className="teacher-note-card">
              <h2><span><UiIcon name="profile" size={16} /></span> Catatan Akademik</h2>
              <small>Ringkasan hasil {user?.fullName ?? "siswa"}</small>
              <blockquote>
                {visibleResults.length
                  ? `Terdapat ${results.length} hasil ujian. Rata-rata nilai yang ditampilkan ${average.toFixed(1)} dan ${passed} hasil memenuhi KKM.`
                  : results.length ? `Terdapat ${results.length} hasil ujian. Nilai disembunyikan oleh guru.`
                  : "Hasil ujian yang sudah dikumpulkan akan tampil di halaman ini."}
              </blockquote>
              <footer>
                <span>Data diperbarui dari hasil ujian.</span>
                {results[0] && <a href={`/ujian/selesai?id=${encodeURIComponent(results[0].id)}`}>Status terbaru →</a>}
              </footer>
            </article>
            <article className="remedial-event">
              <span>{remedialResult ? "Perlu Remedial" : "Status Akademik"}</span>
              <small>{remedialResult ? `KKM ${remedialResult.kkm}` : "Nilai tersimpan"}</small>
              <h3>{remedialResult ? remedialResult.subject : "Ketuntasan Nilai"}</h3>
              <p>{remedialResult ? remedialResult.examTitle : "Pantau hasil ujian dan pencapaian KKM Anda."}</p>
              <footer>
                <span>{remedialResult ? `Skor: ${Math.round(remedialResult.score)}` : visibleResults.length ? `${passed} dari ${visibleResults.length} ujian tuntas` : "Nilai disembunyikan oleh guru"}</span>
                {remedialResult && <a href={`/ujian/selesai?id=${encodeURIComponent(remedialResult.id)}`}>Lihat hasil</a>}
              </footer>
            </article>
          </aside>
        </div>
      </main>
    </TeacherShell>
  );
}

function ProfilePage({ user, onLogout, onProfileUpdated }) {
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  useEffect(() => {
    let active = true;
    studentApi.getProfile()
      .then(({ profile: value }) => {
        if (!active) return;
        setProfile(value);
        setForm({
          fullName: value.fullName,
          email: value.email,
          currentPassword: "",
          newPassword: "",
        });
      })
      .catch((requestError) => { if (active) setError(requestError.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  async function saveProfile(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const { profile: value } = await studentApi.updateProfile(form);
      setProfile(value);
      setForm({
        fullName: value.fullName,
        email: value.email,
        currentPassword: "",
        newPassword: "",
      });
      setEditing(false);
      setNotice("Profil berhasil diperbarui.");
      onProfileUpdated?.(value);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  }

  const fields = profile ? [
    ["Nama Lengkap", profile.fullName],
    ["Email", profile.email],
    ["Sekolah", profile.schoolName ?? "Belum terhubung"],
    ["Kelas", profile.className ?? "Belum ditetapkan"],
    ["Role", "Siswa"],
    ["Tanggal Daftar", profile.createdAt ? new Date(profile.createdAt).toLocaleDateString("id-ID", { dateStyle: "long" }) : "—"],
  ] : [];
  return <TeacherShell
    active="Profil Saya"
    user={{ ...user, fullName: profile?.fullName ?? user?.fullName }}
    onLogout={onLogout}
    navigation={studentNavigation}
    workspaceLabel="PORTAL SISWA"
    roleDescription="Siswa"
  >
    <div className="teacher-page-title">
      <div><span>PROFIL PENGGUNA</span><h1>Profil Siswa</h1><p>Informasi akun dan data akademik Anda.</p></div>
    </div>
    {error && <div className="teacher-alert error" role="alert">{error}</div>}
    {notice && <div className="teacher-alert success" role="status">{notice}</div>}
    {loading ? <p className="teacher-empty">Memuat profil...</p> : profile && (
      <section className="teacher-panel teacher-profile-card student-profile-card">
        <span className="teacher-profile-avatar" aria-label={`Profil ${profile.fullName}`}>{getInitials(profile.fullName)}</span>
        {editing && form ? (
          <form className="teacher-profile-form" onSubmit={saveProfile}>
            <label>Nama Lengkap<input value={form.fullName} onChange={(event) => setForm({ ...form, fullName: event.target.value })} required minLength="2" maxLength="120" /></label>
            <label>Email<input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required maxLength="254" /></label>
            <label>Kelas<input value={profile.className ?? "Belum ditetapkan"} disabled /></label>
            <label>Kata Sandi Saat Ini<input type="password" autoComplete="current-password" value={form.currentPassword} onChange={(event) => setForm({ ...form, currentPassword: event.target.value })} placeholder="Isi untuk mengganti kata sandi" /></label>
            <label>Kata Sandi Baru<input type="password" autoComplete="new-password" value={form.newPassword} onChange={(event) => setForm({ ...form, newPassword: event.target.value })} minLength="8" maxLength="128" placeholder="Minimal 8 karakter" /></label>
            <p className="student-profile-note">Perubahan kelas dilakukan oleh administrator sekolah.</p>
            <div className="teacher-profile-actions">
              <button type="button" className="teacher-secondary-button" onClick={() => setEditing(false)} disabled={saving}>Batal</button>
              <button type="submit" className="teacher-primary-button" disabled={saving}>{saving ? "Menyimpan..." : "Simpan Perubahan"}</button>
            </div>
          </form>
        ) : (
          <>
            <dl>{fields.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
            <button type="button" className="teacher-primary-button teacher-profile-edit" onClick={() => { setEditing(true); setError(""); setNotice(""); }}>
              ✏️ Edit Profil
            </button>
          </>
        )}
      </section>
    )}
  </TeacherShell>;
}

function WaitRoomPage({ user, onLogout, onStartExam, startingExamId }) {
  const [exam, setExam] = useState(null);
  const [error, setError] = useState("");
  const [activityWarning, setActivityWarning] = useState(null);
  useExamActivityMonitor(exam?.id, null, Boolean(exam), setActivityWarning);

  useEffect(() => {
    let active = true;
    studentApi.getExams()
      .then(({ exams }) => {
        if (active) setExam(exams.find((item) => item.status === "active" && item.canStart) ?? null);
      })
      .catch((requestError) => {
        if (active) setError(requestError.message);
      });
    return () => { active = false; };
  }, []);

  const rules = [
    ["▣", "1. Screenshot dan Rekam Layar", "Browser tidak dapat menjamin semua screenshot atau rekaman layar terdeteksi."],
    ["▧", "2. Perpindahan Tab dan Fokus", "Perpindahan tab atau jendela yang terdeteksi browser dapat dicatat sebagai aktivitas ujian."],
    ["♧", "3. Log Pengawasan", "Aktivitas yang berhasil dikirim akan muncul pada panel administrator sekolah."],
    ["△", "4. Pemeriksaan Aktivitas", "Aktivitas berulang selama pengerjaan dapat membekukan sesi sementara atau menandainya untuk verifikasi."],
  ];
  return (
    <TeacherShell
      active="Ujian Siswa"
      user={user}
      onLogout={onLogout}
      navigation={studentNavigation}
      workspaceLabel="PORTAL SISWA"
      roleDescription="Siswa"
    >
      <main className="waiting-content">
        <section className="waiting-card">
          <span className="waiting-label">◉ Ruang Tunggu CBT</span>
          <h1>{exam?.title ?? "Ruang Ujian"}</h1>
          <p>{exam?.description ?? "Ujian yang tersedia untuk akun Anda."}</p>
          {exam && <div className="waiting-meta"><span>♙ {exam.teacherName}</span><span>▣ {new Date(exam.opensAt).toLocaleString("id-ID")}</span><span>◫ {exam.durationMinutes} Menit</span><span>▣ {exam.questionCount} Butir Soal</span></div>}
          {error && <p className="student-data-message error" role="alert">{error}</p>}
          {!exam && !error && <p className="student-data-message">Tidak ada ujian aktif saat ini.</p>}
        </section>
        <section className="countdown-card"><h2>◷ STATUS SESI UJIAN</h2><div><span><b>{exam ? "AKTIF" : "—"}</b><small>STATUS</small></span></div><p>ⓘ Jawaban akan tersimpan otomatis selama ujian berlangsung.</p></section>
        <div className="device-checks"><span>✓ Akun Terverifikasi</span><span>▤ Periksa Jaringan</span><span>◉ Pantauan Browser Best-Effort</span><span>▣ Perangkat Siap</span></div>
        <section className="integrity-card"><header><span>◈</span><div><strong>Pengawasan &amp; Integritas Ujian</strong><small>Pemantauan browser bersifat best-effort; screenshot sistem operasi tidak selalu dapat dideteksi.</small></div><button>Tata Tertib</button></header><div className="integrity-rules">{rules.map(([icon, title, text]) => <article key={title}><b>{icon}　{title}</b><p>{text}</p></article>)}</div></section>
        <button className="start-exam-button" disabled={!exam || startingExamId === exam?.id} onClick={() => exam && onStartExam(exam.id)}>
          {startingExamId === exam?.id ? "Membuka ujian..." : "Mulai Kerjakan Ujian Sekarang"}
          <UiIcon name="arrow" />
        </button>
        <p className="start-status">{exam ? "●　Sesi ujian aktif" : "Sesi ujian belum dibuka"}</p>
      </main>
      <ActivityWarning activity={activityWarning} onClose={() => setActivityWarning(null)} />
    </TeacherShell>
  );
}

function QuestionGrid({
  compact = false,
  mode = "active",
  questions = [],
  currentNumber,
  onSelect,
}) {
  return (
    <div className={`question-grid ${compact ? "compact" : ""} ${mode}`}>
      {questions.map((question) => {
        const answered = Boolean(question.selectedOptionId);
        const status = mode === "result"
          ? question.status ?? (!answered
            ? "unanswered"
            : question.selectedOptionId === question.correctOptionId ? "correct" : "wrong")
          : question.number === currentNumber ? "active" : answered ? "answered" : "unanswered";
        return (
          <a
            className={status}
            href={`#soal-${question.number}`}
            key={question.id}
            aria-current={question.number === currentNumber ? "step" : undefined}
            onClick={(event) => {
              event.preventDefault();
              onSelect?.(question.number);
            }}
          >
            {question.number}
          </a>
        );
      })}
    </div>
  );
}

function formatCountdown(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  return [hours, minutes, remainingSeconds].map((value) => String(value).padStart(2, "0")).join(":");
}

function ExamPage({ drawer = false, search = "", user, onLogout }) {
  const params = new URLSearchParams(search);
  const requestedExamId = params.get("examId");
  const requestedAttemptId = params.get("attemptId");
  const requestedQuestion = Number(params.get("soal")) || 1;
  const [exam, setExam] = useState(null);
  const [attempt, setAttempt] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentNumber, setCurrentNumber] = useState(requestedQuestion);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saveMessage, setSaveMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [activityWarning, setActivityWarning] = useState(null);
  const [clock, setClock] = useState(Date.now());
  const saveQueue = useRef(new Map());
  const submissionStarted = useRef(false);
  useExamActivityMonitor(exam?.id, attempt?.id, Boolean(exam && attempt), setActivityWarning);

  useEffect(() => {
    let active = true;
    async function loadExam() {
      setLoading(true);
      setError("");
      let currentAttempt = null;
      try {
        const examList = await studentApi.getExams();
        const selectedExamId = requestedExamId ??
          examList.exams.find((item) => item.status === "active")?.id ??
          examList.exams[0]?.id;
        if (!selectedExamId) throw new Error("Belum ada ujian yang tersedia.");

        const { exam: examData } = await studentApi.getExam(selectedExamId);
        currentAttempt = requestedAttemptId
          ? examData.activeAttempt?.id === requestedAttemptId
            ? examData.activeAttempt
            : { id: requestedAttemptId }
          : examData.activeAttempt;
        if (!currentAttempt) {
          const started = await studentApi.startExam(selectedExamId);
          if (started.result) {
            navigateAfterExam(started.result);
            return;
          }
          currentAttempt = started.attempt;
        }
        if (!active) return;
        setExam(examData);
        setAttempt(currentAttempt);
        const { questions: questionData } = await studentApi.getQuestions(
          selectedExamId,
          currentAttempt.id,
        );
        if (!active) return;
        setQuestions(questionData);
        setCurrentNumber(Math.min(requestedQuestion, questionData.length) || 1);
      } catch (requestError) {
        if (active) {
          if (currentAttempt?.disqualifiedAt || requestError.status === 423) {
            setActivityWarning({
              eventType: "tab_hidden",
              violationCount: currentAttempt.violationCount,
              lockedUntil: currentAttempt.lockedUntil,
              disqualified: Boolean(currentAttempt.disqualifiedAt),
            });
          }
          setError(requestError.message);
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    loadExam();
    return () => { active = false; };
  }, [requestedExamId, requestedAttemptId, requestedQuestion]);

  useEffect(() => {
    const intervalId = window.setInterval(() => setClock(Date.now()), 1000);
    return () => window.clearInterval(intervalId);
  }, []);

  const remainingSeconds = attempt
    ? Math.max(0, Math.ceil((Date.parse(attempt.expiresAt) - clock) / 1000))
    : 0;
  const currentQuestion = questions.find((question) => question.number === currentNumber);
  const answeredCount = questions.filter((question) => question.selectedOptionId).length;
  const isDisqualified = Boolean(activityWarning?.disqualified);
  const isFrozen = Boolean(activityWarning?.lockedUntil && Date.parse(activityWarning.lockedUntil) > clock);

  async function submitAttempt() {
    if (!exam || !attempt || submissionStarted.current || isFrozen || isDisqualified) return;
    submissionStarted.current = true;
    setSubmitting(true);
    setError("");
    try {
      await Promise.all(saveQueue.current.values());
      const { result } = await studentApi.submitExam(exam.id, { attemptId: attempt.id });
      navigateAfterExam(result);
    } catch (requestError) {
      submissionStarted.current = false;
      setSubmitting(false);
      setError(requestError.message);
      setConfirmSubmit(false);
    }
  }

  useEffect(() => {
    if (!loading && attempt && questions.length && remainingSeconds === 0) {
      submitAttempt();
    }
  }, [loading, attempt, questions.length, remainingSeconds]);

  function selectQuestion(number) {
    if (isDisqualified) return;
    setCurrentNumber(number);
    const nextParams = new URLSearchParams(window.location.search);
    nextParams.set("soal", String(number));
    window.history.replaceState(null, "", `${window.location.pathname}?${nextParams}`);
  }

  async function saveAnswer(questionId, optionId) {
    if (!exam || !attempt || isFrozen || isDisqualified) return;
    setQuestions((previous) => previous.map((question) => (
      question.id === questionId ? { ...question, selectedOptionId: optionId } : question
    )));
    setSaveMessage("Menyimpan jawaban...");
    setError("");
    const previousSave = saveQueue.current.get(questionId) ?? Promise.resolve();
    const pending = previousSave.catch(() => {}).then(() => studentApi.saveAnswer(exam.id, {
      attemptId: attempt.id,
      questionId,
      optionId,
    }));
    saveQueue.current.set(questionId, pending);
    try {
      await pending;
      if (saveQueue.current.get(questionId) === pending) {
        setSaveMessage("Jawaban tersimpan otomatis.");
      }
    } catch (requestError) {
      if (saveQueue.current.get(questionId) === pending) {
        setSaveMessage(`Gagal menyimpan: ${requestError.message}`);
      }
    }
  }

  async function dismissActivityWarning() {
    if (questions.length === 0 && exam && attempt && !isDisqualified) {
      try {
        const { questions: questionData } = await studentApi.getQuestions(exam.id, attempt.id);
        setQuestions(questionData);
        setError("");
      } catch (requestError) {
        setError(requestError.message);
        return;
      }
    }
    setActivityWarning(null);
  }

  return (
    <div className="student-screen exam-taking-page">
      <SiteHeader active="Ruang Ujian" user={user} onLogout={onLogout} />
      {exam && <section className="exam-status-bar">
        <SubjectBadge name={exam.subject} />
        <div>
          <h1>{exam.title}</h1>
          <p>Pengampu: {exam.teacherName} · {user?.fullName}</p>
        </div>
        <div className="exam-progress">
          <span>Progres Pengerjaan <b>{questions.length ? Math.round((answeredCount / questions.length) * 100) : 0}%</b></span>
          <i><b style={{ width: `${questions.length ? (answeredCount / questions.length) * 100 : 0}%` }} /></i>
          <small>{answeredCount} dari {questions.length} Soal Terjawab</small>
        </div>
        <div className="connection-status">● Terkoneksi Stabil<br /><small>{saveMessage || "Autosave aktif"}</small></div>
        <div className="exam-timer">SISA WAKTU<strong>◷ {formatCountdown(remainingSeconds)}</strong></div>
      </section>}
      <main className="exam-taking-content">
        <section className="question-card">
          {loading && <p className="student-data-message">Memuat soal ujian...</p>}
          {error && <p className="student-data-message error" role="alert">{error}</p>}
          {!loading && !error && currentQuestion && <>
            <header>
              <span>Soal No. {currentQuestion.number}</span>
              <small>dari total {questions.length} Butir Soal</small>
              <b>Pilihan Ganda</b>
              <button className="flag-button" type="button">⚐ Tandai Ragu-Ragu</button>
              <a className="mobile-question-list" href={`/ujian/daftar-soal?examId=${encodeURIComponent(exam.id)}&attemptId=${encodeURIComponent(attempt.id)}`}>▦ Daftar Soal</a>
            </header>
            <div className="question-prompt"><p>{currentQuestion.prompt}</p></div>
            <div className="answer-options">
              {currentQuestion.options.map((option) => (
                <button
                  className={currentQuestion.selectedOptionId === option.id ? "selected" : ""}
                  key={option.id}
                  type="button"
                  disabled={isFrozen || isDisqualified}
                  onClick={() => saveAnswer(currentQuestion.id, option.id)}
                >
                  <b>{option.label}</b><span>{option.content}</span>
                  {currentQuestion.selectedOptionId === option.id && <UiIcon name="check" />}
                </button>
              ))}
            </div>
            <p className={`autosave-note ${saveMessage.startsWith("Gagal") ? "error" : ""}`} role="status">
              ♧ {saveMessage || "Jawaban disimpan otomatis saat Anda memilih opsi."}
            </p>
          </>}
        </section>
        <aside className="question-navigation">
          <h2>▦ Navigasi Soal <small>{questions.length} Butir</small></h2>
          <QuestionGrid questions={questions} currentNumber={currentNumber} onSelect={selectQuestion} />
          <div className="question-legend">
            <strong>Keterangan Status Soal:</strong>
            <span>● Sudah Dijawab ({answeredCount})</span>
            <span>● Belum Dijawab ({questions.length - answeredCount})</span>
          </div>
          <button type="button" onClick={() => setConfirmSubmit(true)}>☑ Selesai &amp; Kumpulkan</button>
        </aside>
        <nav className="question-controls">
          <button type="button" disabled={currentNumber <= 1} onClick={() => selectQuestion(currentNumber - 1)}>← Sebelumnya</button>
          <span />
          <button type="button" disabled={currentNumber >= questions.length} onClick={() => selectQuestion(currentNumber + 1)}>Selanjutnya →</button>
          <button type="button" onClick={() => setConfirmSubmit(true)}>☑ Kumpulkan Ujian</button>
        </nav>
      </main>
      <SiteFooter />
      <div className="mobile-exam-controls">
        <button type="button" disabled={currentNumber <= 1} onClick={() => selectQuestion(currentNumber - 1)}>‹　Sebelumnya</button>
        <button type="button" disabled={currentNumber >= questions.length} onClick={() => selectQuestion(currentNumber + 1)}>Selanjutnya　›</button>
        <button type="button" onClick={() => setConfirmSubmit(true)}>☑ Submit Jawaban</button>
      </div>
      {drawer && <QuestionDrawer
        questions={questions}
        currentNumber={currentNumber}
        onSelect={(number) => selectQuestion(number)}
        onSubmit={() => setConfirmSubmit(true)}
        examId={exam?.id}
        attemptId={attempt?.id}
      />}
      {confirmSubmit && (
        <div className="submit-backdrop" role="presentation">
          <section className="submit-confirmation" role="dialog" aria-modal="true" aria-labelledby="submit-title">
            <h2 id="submit-title">Kumpulkan ujian?</h2>
            <p>Jawaban yang sudah tersimpan akan dinilai. Anda tidak dapat mengubah jawaban setelah dikumpulkan.</p>
            <div>
              <button type="button" onClick={() => setConfirmSubmit(false)} disabled={submitting}>Kembali</button>
              <button type="button" onClick={submitAttempt} disabled={submitting}>
                {submitting ? "Mengirim..." : "Ya, kumpulkan"}
              </button>
            </div>
          </section>
        </div>
      )}
      <ActivityWarning
        activity={activityWarning}
        frozen={isFrozen}
        onClose={dismissActivityWarning}
      />
    </div>
  );
}

function QuestionDrawer({ questions, currentNumber, onSelect, onSubmit, examId, attemptId }) {
  return (
    <div className="drawer-backdrop">
      <aside className="question-drawer">
        <header>
          <UiIcon name="grades" />
          <div><strong>Daftar Nomor Soal</strong><small>Pilih nomor untuk melompat</small></div>
          <b>{questions.length} Butir</b>
          <a href={`/ujian/aktif?examId=${encodeURIComponent(examId ?? "")}&attemptId=${encodeURIComponent(attemptId ?? "")}`} aria-label="Tutup">×</a>
        </header>
        <div className="drawer-legend">
          <span>■ Sudah ({questions.filter((question) => question.selectedOptionId).length})</span>
          <span>■ Belum ({questions.filter((question) => !question.selectedOptionId).length})</span>
        </div>
        <QuestionGrid
          compact
          questions={questions}
          currentNumber={currentNumber}
          onSelect={onSelect}
        />
        <footer><button type="button" onClick={onSubmit}>▣　Selesai &amp; Kumpulkan Semua Jawaban</button></footer>
      </aside>
    </div>
  );
}

function ResultPage({ user, onLogout, search }) {
  const requestedId = new URLSearchParams(search).get("id");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activityWarning, setActivityWarning] = useState(null);
  const [remedialPending, setRemedialPending] = useState(false);
  const [remedialError, setRemedialError] = useState("");
  const [remedialNotice, setRemedialNotice] = useState("");
  useExamActivityMonitor(result?.examId, null, Boolean(result?.examId), setActivityWarning);

  useEffect(() => {
    let active = true;
    async function loadResult() {
      try {
        if (requestedId) {
          const response = await studentApi.getResult(requestedId);
          if (active) setResult(response.result);
        } else {
          const response = await studentApi.getResults();
          if (active) setResult(response.results[0] ?? null);
        }
      } catch (requestError) {
        if (active) setError(requestError.message);
      } finally {
        if (active) setLoading(false);
      }
    }
    loadResult();
    return () => { active = false; };
  }, [requestedId]);

  function scrollToQuestion(number) {
    document.getElementById(`result-question-${number}`)?.scrollIntoView({ behavior: "smooth" });
  }

  async function requestRemedial() {
    if (!result || remedialPending) return;
    setRemedialPending(true);
    setRemedialError("");
    try {
      const { request } = await studentApi.requestRemedial(result.id);
      setResult((current) => ({ ...current, remedialStatus: request.status }));
      setRemedialNotice("Permohonan remedial telah dikirim kepada guru pengampu.");
    } catch (requestError) {
      setRemedialError(requestError.message);
    } finally {
      setRemedialPending(false);
    }
  }

  return (
    <TeacherShell
      active="Nilai Saya"
      user={user}
      onLogout={onLogout}
      navigation={studentNavigation}
      workspaceLabel="PORTAL SISWA"
      roleDescription="Siswa"
    >
      <main className="result-content">
        {loading && <p className="student-data-message">Memuat hasil ujian...</p>}
        {error && <p className="student-data-message error" role="alert">{error}</p>}
        {!loading && !error && !result && <p className="student-data-message">Belum ada hasil ujian.</p>}
        {result && result.showScore === false && (
          <section className="teacher-panel student-hidden-result">
            <span className="result-id">UJIAN SELESAI</span>
            <h1>Soal Ujian Telah Selesai Dikerjakan</h1>
            <h2>{result.examTitle}</h2>
            <p>Guru belum menampilkan nilai untuk ujian ini.</p>
            <a className="teacher-primary-button" href="/">Kembali ke Dashboard</a>
          </section>
        )}
        {result && result.showScore !== false && <>
          <div className="result-id">●　Review hasil ujian　·　<strong>{result.code}</strong></div>
          <section className="result-hero">
            <div>
              <span>{result.code}</span>
              <h1>{result.examTitle}</h1>
              <p>{result.subject} · {new Date(result.createdAt).toLocaleString("id-ID")}</p>
            </div>
            <div>
              <small>NILAI AKHIR</small>
              <strong>{Math.round(result.score)} <em>/ 100</em></strong>
              <span>{result.passed ? `✓ Lulus · KKM ${result.kkm}` : `Perlu Remedial · KKM ${result.kkm}`}</span>
            </div>
          </section>
          {remedialError && <p className="student-data-message error" role="alert">{remedialError}</p>}
          {remedialNotice && <p className="student-data-message" role="status">{remedialNotice}</p>}
          <section className="result-stats">
            <article><small>JAWABAN BENAR</small><strong>{result.correctCount} <em>Soal</em></strong></article>
            <article><small>JAWABAN SALAH</small><strong>{result.wrongCount} <em>Soal</em></strong></article>
            <article><small>TIDAK DIJAWAB</small><strong>{result.unansweredCount} <em>Soal</em></strong></article>
          </section>
          <section className="result-questions">
            <header>
              <div><h2>Daftar Nomor Soal</h2><p>Pilih nomor untuk melihat jawaban Anda dan kunci jawaban.</p></div>
              <aside>● Benar ({result.correctCount})　 ● Salah ({result.wrongCount})　 ● Kosong ({result.unansweredCount})</aside>
            </header>
            <QuestionGrid mode="result" questions={result.questions} onSelect={scrollToQuestion} />
          </section>
          <section className="result-answer-review">
            {result.questions.map((question) => (
              <article id={`result-question-${question.number}`} key={question.id}>
                <h3>Soal {question.number}</h3>
                <p>{question.prompt}</p>
                <div>
                  {question.options.map((option) => {
                    const correct = option.id === question.correctOptionId;
                    const selected = option.id === question.selectedOptionId;
                    return (
                      <p className={correct ? "correct-option" : selected ? "incorrect-option" : ""} key={option.id}>
                        <b>{option.label}.</b> {option.content}
                        {correct && <strong> · Kunci jawaban</strong>}
                        {selected && <strong> · Jawaban Anda</strong>}
                      </p>
                    );
                  })}
                </div>
              </article>
            ))}
          </section>
          <div className="result-actions">
            {!result.passed && <button type="button" onClick={requestRemedial} disabled={remedialPending || ["pending", "approved", "scheduled"].includes(result.remedialStatus)}>
              {remedialPending ? "Mengirim..." : ["pending", "approved", "scheduled"].includes(result.remedialStatus) ? "Remedial Diajukan" : "Ajukan Remedial"}
            </button>}
            <a href="/">Selesai Review　<UiIcon name="arrow" /></a>
          </div>
        </>}
      </main>
      <ActivityWarning activity={activityWarning} onClose={() => setActivityWarning(null)} />
    </TeacherShell>
  );
}

export default function StudentPages({
  path,
  search,
  user,
  onLogout,
  onProfileUpdated,
  onStartExam,
  startingExamId,
}) {
  if (path === "/ujian" || path === "/ujian/riwayat") {
    return (
      <ExamPortal
        history={path.endsWith("riwayat") || new URLSearchParams(search).get("tab") === "riwayat"}
        user={user}
        onLogout={onLogout}
        onStartExam={onStartExam}
        startingExamId={startingExamId}
      />
    );
  }
  if (path === "/nilai") return <GradePage user={user} onLogout={onLogout} />;
  if (path === "/profil") return <ProfilePage user={user} onLogout={onLogout} onProfileUpdated={onProfileUpdated} />;
  if (path === "/ruang-ujian" || path === "/ujian/ruang-tunggu") {
    return <WaitRoomPage user={user} onLogout={onLogout} onStartExam={onStartExam} startingExamId={startingExamId} />;
  }
  if (path === "/ujian/aktif" || path === "/ujian/aktif/daftar-soal" || path === "/ujian/daftar-soal") {
    return <ExamPage drawer={path.endsWith("daftar-soal")} search={search} user={user} onLogout={onLogout} />;
  }
  if (path === "/ujian/selesai") return <ResultPage user={user} onLogout={onLogout} search={search} />;
  if (path === "/ujian/peringatan") return <ExamPage search={search} user={user} onLogout={onLogout} />;
  return <ExamPortal user={user} onLogout={onLogout} onStartExam={onStartExam} startingExamId={startingExamId} />;
}
