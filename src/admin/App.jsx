import React, { useEffect, useState } from "react";
import { adminApi, setAdminSchoolId } from "./api.js";
import dashboardLogo from "../icon.png";
import "./styles.css";

const navigation = [
  ["Dashboard", "/", "▦"],
  ["Sekolah", "/sekolah", "⌂"],
  ["Data Siswa", "/siswa", "♙"],
  ["Data Guru", "/guru", "♧"],
  ["Data Admin", "/admin", "◇"],
  ["Data Kelas", "/kelas", "⌂"],
  ["Data Mata Pelajaran", "/mapel", "▤"],
  ["Data Ujian", "/ujian", "▣"],
  ["Pengaturan", "/pengaturan", "⚙"],
  ["Profil", "/profil", "◉"],
];
const roleLabels = { student: "Student", teacher: "Teacher", admin: "Admin" };
const pathTitles = {
  "/": "Dashboard",
  "/sekolah": "Sekolah",
  "/siswa": "Data Siswa",
  "/guru": "Data Guru",
  "/admin": "Data Admin",
  "/kelas": "Data Kelas",
  "/mapel": "Data Mata Pelajaran",
  "/ujian": "Data Ujian",
  "/pengaturan": "Pengaturan",
  "/profil": "Profil Admin",
  "/pengawasan": "Pengawasan Ujian",
};

function initials(name = "") {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0] ?? "").join("").toUpperCase();
}

function scopedPath(basePath, path) {
  if (!basePath) return path;
  return path === "/" ? basePath : `${basePath}${path}`;
}

function Alert({ error, notice }) {
  return <>
    {error && <p className="alert error" role="alert">{error}</p>}
    {notice && <p className="alert success" role="status">{notice}</p>}
  </>;
}

function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  async function submit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      await onLogin({ email, password });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }
  return <main className="login-page">
    <form className="login-card" onSubmit={submit}>
      <div className="login-brand"><img src={dashboardLogo} alt="Logo NSolve-Tech" /><strong>NSolve-Tech</strong></div>
      <p>WORKSPACE ADMIN</p>
      <h1>Masuk ke Dashboard Admin</h1>
      <label>Email<input type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
      <label>Kata Sandi<input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required /></label>
      {error && <p className="alert error" role="alert">{error}</p>}
      <button className="primary" type="submit" disabled={loading}>{loading ? "Memeriksa..." : "Masuk"}</button>
    </form>
  </main>;
}

function Shell({
  user,
  path,
  onLogout,
  children,
  schools,
  selectedSchoolId,
  onSchoolChange,
  isPlatformAdmin,
  basePath,
}) {
  const activeSchool = schools.find((school) => school.id === selectedSchoolId);
  const schoolName = activeSchool?.name ?? user.schoolName ?? "Sekolah";
  return <div className="admin-app">
    <aside className="admin-sidebar">
      <a className="brand" href={scopedPath(basePath, "/")}>
        <img className="brand-logo" src={dashboardLogo} alt="Logo NSolve-Tech" />
        <span><strong>NSolve-Tech</strong><small>PORTAL ADMIN</small></span>
      </a>
      <div className="workspace-label">WORKSPACE ADMIN</div>
      <nav aria-label="Navigasi admin">
        {navigation.filter(([, href]) => href !== "/sekolah" || isPlatformAdmin).map(([label, href, icon]) => <a className={path === href ? "active" : ""} href={scopedPath(basePath, href)} key={href}>
          <i aria-hidden="true">{icon}</i><span>{label}</span>
        </a>)}
      </nav>
      <div className="sidebar-school"><span>⌂</span>{schoolName}</div>
    </aside>
    <div className="admin-main">
      <header className="admin-header">
        <div className="header-school"><span>⌂</span>{isPlatformAdmin
          ? <select
            className="school-selector"
            aria-label="Pilih sekolah yang dikelola"
            value={selectedSchoolId}
            onChange={(event) => onSchoolChange(event.target.value)}
          >
            {schools.map((school) => <option key={school.id} value={school.id}>
              {school.name}{school.isActive === false ? " (Nonaktif)" : ""}
            </option>)}
          </select>
          : schoolName}</div>
        <div className="account">
          <span><strong>{user.fullName}</strong><small>Administrator</small></span>
          <i>{initials(user.fullName)}</i>
          <button type="button" onClick={onLogout}>⇥ <span>Keluar</span></button>
        </div>
      </header>
      <main className="content">
        <div className="page-title"><div><span>ADMINISTRASI SEKOLAH</span><h1>{pathTitles[path] ?? "Dashboard Admin"}</h1></div></div>
        {children}
      </main>
    </div>
  </div>;
}

function Dashboard({ basePath }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    Promise.all([
      adminApi.users("student"),
      adminApi.users("teacher"),
      adminApi.users("admin"),
      adminApi.classes(),
      adminApi.exams(),
      adminApi.activity(),
    ]).then(([students, teachers, admins, classes, exams, activity]) => {
      if (active) setData({
        students: students.users.length,
        teachers: teachers.users.length,
        admins: admins.users.length,
        classes: classes.classes.length,
        exams: exams.exams.length,
        events: activity.events.length,
      });
    }).catch((requestError) => { if (active) setError(requestError.message); });
    return () => { active = false; };
  }, []);
  return <>
    <Alert error={error} />
    <section className="stats">
      {[
        ["Siswa", data?.students, "♙", "/siswa"],
        ["Guru", data?.teachers, "♧", "/guru"],
        ["Admin", data?.admins, "◇", "/admin"],
        ["Kelas", data?.classes, "⌂", "/kelas"],
        ["Ujian", data?.exams, "▣", "/ujian"],
        ["Aktivitas Pengawasan", data?.events, "◈", "/pengawasan"],
      ].map(([label, value, icon, href]) => <a className="stat-card" href={scopedPath(basePath, href)} key={label}>
        <i>{icon}</i><span><small>{label}</small><strong>{value ?? "—"}</strong></span>
      </a>)}
    </section>
    <section className="panel dashboard-welcome">
      <span>RINGKASAN SEKOLAH</span><h2>Kelola data sekolah dari satu tempat</h2>
      <p>Data siswa, guru, kelas, mata pelajaran, dan ujian mengikuti akun serta penugasan yang tersimpan di sistem.</p>
    </section>
  </>;
}

function UserEditor({ item, role, classes, subjects, schoolName, onClose, onSave, saving }) {
  const isNew = !item;
  const initialClass = classes.find((value) => value.id === item?.classId) ?? classes[0];
  const [form, setForm] = useState({
    fullName: item?.fullName ?? "",
    email: item?.email ?? "",
    role: item?.role ?? role,
    isActive: item?.isActive ?? true,
    classId: item?.classId ?? (role === "student" ? initialClass?.id ?? "" : ""),
    gradeLevel: initialClass?.gradeLevel ?? "X",
    password: "",
    subject: item?.subject ?? "",
    positionTitle: item?.positionTitle ?? "Guru",
    classIds: (item?.teacherClasses ?? []).map((value) => value.id),
  });
  const toggleClass = (id) => setForm((current) => ({
    ...current,
    classIds: current.classIds.includes(id)
      ? current.classIds.filter((value) => value !== id)
      : [...current.classIds, id],
  }));
  async function submit(event) {
    event.preventDefault();
    await onSave({
      fullName: form.fullName,
      email: form.email,
      role: form.role,
      ...(isNew && form.password ? { password: form.password } : {}),
      ...(!isNew ? { isActive: form.isActive } : {}),
      ...(form.role === "student" ? { classId: form.classId } : {}),
      ...(form.role === "teacher" ? {
        subject: form.subject,
        positionTitle: form.positionTitle,
        classIds: form.classIds,
      } : {}),
    });
  }
  return <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <form className="modal-card" onSubmit={submit}>
      <header><div><span>DATA AKUN</span><h2>{isNew ? "Buat Akun" : `Edit ${roleLabels[item.role] ?? "Pengguna"}`}</h2></div><button type="button" onClick={onClose} aria-label="Tutup">×</button></header>
      <label>Nama Lengkap<input value={form.fullName} onChange={(event) => setForm({ ...form, fullName: event.target.value })} required minLength="2" maxLength="120" /></label>
      <label>Email<input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required /></label>
      {isNew && <label>Sekolah<input value={schoolName ?? "Sekolah"} readOnly /></label>}
      <label>Role<select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })}>
        {isNew
          ? <><option value="student">Student</option><option value="teacher">Teacher</option><option value="admin">Admin</option></>
          : <><option value="student">Student</option><option value="teacher">Teacher</option><option value="admin">Admin</option></>}
      </select></label>
      {isNew && <label>Password (opsional)<input type="password" autoComplete="new-password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} minLength="8" maxLength="128" /><small>Kosongkan untuk membuat password sementara otomatis.</small></label>}
      {form.role === "student" && <>
        <label>Jenjang<select value={form.gradeLevel} onChange={(event) => setForm({ ...form, gradeLevel: event.target.value, classId: "" })} required>
          <option value="X">X</option><option value="XI">XI</option><option value="XII">XII</option>
        </select></label>
        <label>Kelas<select value={form.classId} onChange={(event) => setForm({ ...form, classId: event.target.value })} required>
          <option value="">Pilih kelas</option>{classes.filter((value) => value.gradeLevel === form.gradeLevel).map((value) => <option value={value.id} key={value.id}>{value.name}</option>)}
        </select></label>
      </>}
      {form.role === "teacher" && <>
        <label>Mata Pelajaran<select value={form.subject} onChange={(event) => setForm({ ...form, subject: event.target.value })} required>
          <option value="">Pilih mata pelajaran</option>{subjects.map((value) => <option key={value.id} value={value.name}>{value.name}</option>)}
          {!subjects.some((value) => value.name === form.subject) && form.subject && <option value={form.subject}>{form.subject}</option>}
        </select></label>
        <label>Jabatan<input value={form.positionTitle} onChange={(event) => setForm({ ...form, positionTitle: event.target.value })} /></label>
        <label>Jenjang<select value={form.gradeLevel} onChange={(event) => setForm({ ...form, gradeLevel: event.target.value })}>
          <option value="X">X</option><option value="XI">XI</option><option value="XII">XII</option>
        </select></label>
        <fieldset><legend>Kelas yang diajar ({form.classIds.length} dipilih)</legend><div className="class-checks">{classes.filter((value) => value.gradeLevel === form.gradeLevel).map((value) => <label key={value.id}>
          <input type="checkbox" checked={form.classIds.includes(value.id)} onChange={() => toggleClass(value.id)} />{value.name}
        </label>)}</div></fieldset>
      </>}
      {!isNew && <label className="check-row"><input type="checkbox" checked={form.isActive} onChange={(event) => setForm({ ...form, isActive: event.target.checked })} /> Akun aktif</label>}
      <footer><button className="secondary" type="button" onClick={onClose}>Batal</button><button className="primary" type="submit" disabled={saving}>{saving ? "Menyimpan..." : isNew ? "Buat Akun" : "Simpan Perubahan"}</button></footer>
    </form>
  </div>;
}

function TemporaryPasswordDialog({ credential, onClose }) {
  const [copyStatus, setCopyStatus] = useState("");
  useEffect(() => setCopyStatus(""), [credential?.password]);
  if (!credential) return null;
  async function copyPassword() {
    try {
      await navigator.clipboard.writeText(credential.password);
      setCopyStatus("Kata sandi sementara berhasil disalin.");
    } catch {
      setCopyStatus("Tidak dapat menyalin otomatis. Silakan salin kata sandi secara manual.");
    }
  }
  return <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="modal-card" role="dialog" aria-modal="true" aria-labelledby="temporary-password-title">
      <header><div><span>KREDENSIAL SEMENTARA</span><h2 id="temporary-password-title">Akun siap digunakan</h2></div><button type="button" onClick={onClose} aria-label="Tutup">×</button></header>
      <p className="hint">Password sementara dibuat otomatis dan hanya ditampilkan sekali. Salin lalu sampaikan melalui kanal yang aman.</p>
      <label>Email<input readOnly value={credential.email} /></label>
      <label>Kata Sandi Sementara<input readOnly value={credential.password} onFocus={(event) => event.target.select()} /></label>
      {copyStatus && <p className="alert success" role="status">{copyStatus}</p>}
      <footer><button className="secondary" type="button" onClick={copyPassword}>Salin untuk Dikirim</button><button className="primary" type="button" onClick={onClose}>Selesai</button></footer>
    </section>
  </div>;
}

function UserProfileDialog({ item, onClose, onResetPassword }) {
  const [resetLogs, setResetLogs] = useState([]);
  const [logsError, setLogsError] = useState("");
  const [logsLoading, setLogsLoading] = useState(true);
  const details = [
    ["Nama Lengkap", item.fullName],
    ["Email", item.email],
    ["ID Akun", item.id],
    ["Sekolah", item.schoolName ?? "—"],
    ["Role", roleLabels[item.role] ?? item.role],
    ["Kelas", item.className ?? "—"],
    ["Mata Pelajaran", item.subject ?? "—"],
    ["Kelas Mengajar", (item.teacherClasses ?? []).map((value) => value.name).join(", ") || "—"],
    ["Status Akun", item.isActive ? "Aktif" : "Nonaktif"],
    ["Tanggal Daftar", item.createdAt ? new Date(item.createdAt).toLocaleString("id-ID") : "—"],
  ];
  useEffect(() => {
    let active = true;
    adminApi.passwordResetLogs(item.id)
      .then(({ logs }) => { if (active) setResetLogs(logs); })
      .catch((requestError) => { if (active) setLogsError(requestError.message); })
      .finally(() => { if (active) setLogsLoading(false); });
    return () => { active = false; };
  }, [item.id]);
  return <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="modal-card profile-dialog" role="dialog" aria-modal="true" aria-labelledby="user-profile-title">
      <header><div><span>PROFIL PENGGUNA</span><h2 id="user-profile-title">{item.fullName}</h2></div><button type="button" onClick={onClose} aria-label="Tutup">×</button></header>
      <dl className="user-profile-details">
        {details.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
      </dl>
      <div className="password-privacy-note">
        <strong>Kata sandi tidak dapat dilihat</strong>
        <p>Kata sandi disimpan dalam bentuk hash. Gunakan reset kata sandi untuk membuat sandi sementara baru.</p>
        <button className="secondary" type="button" onClick={() => onResetPassword(item)}>Reset / Ganti Password</button>
      </div>
      <section className="password-reset-history">
        <strong>Riwayat Reset Password</strong>
        {logsError ? <p className="alert error" role="alert">{logsError}</p>
          : logsLoading ? <p>Memuat riwayat...</p>
            : resetLogs.length ? <ul>{resetLogs.map((log) => <li key={log.id}>
              <span>{log.actorName} mereset password</span>
              <time dateTime={log.resetAt}>{new Date(log.resetAt).toLocaleString("id-ID")}</time>
            </li>)}</ul>
              : <p>Belum ada riwayat reset password.</p>}
      </section>
      <footer><button className="primary" type="button" onClick={onClose}>Tutup</button></footer>
    </section>
  </div>;
}

function UserPage({ role, title, currentUser, schoolName }) {
  const [users, setUsers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [editing, setEditing] = useState(null);
  const [profile, setProfile] = useState(null);
  const [creating, setCreating] = useState(false);
  const [credential, setCredential] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const load = async () => {
    const [userData, classData, subjectData] = await Promise.all([
      adminApi.users(role), adminApi.classes(), adminApi.subjects(),
    ]);
    setUsers(userData.users);
    setClasses(classData.classes);
    setSubjects(subjectData.subjects);
  };
  useEffect(() => {
    let active = true;
    Promise.all([adminApi.users(role), adminApi.classes(), adminApi.subjects()])
      .then(([userData, classData, subjectData]) => {
        if (!active) return;
        setUsers(userData.users);
        setClasses(classData.classes);
        setSubjects(subjectData.subjects);
      })
      .catch((requestError) => { if (active) setError(requestError.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [role]);
  async function saveUser(body) {
    setSaving(true);
    setError("");
    setNotice("");
    try {
      if (creating) {
        const { user, temporaryPassword } = await adminApi.createUser(body);
        if (temporaryPassword) setCredential({ email: user.email, password: temporaryPassword });
        else setNotice("Akun berhasil dibuat dengan kata sandi yang Anda tetapkan.");
        setCreating(false);
      } else {
        await adminApi.updateUser(editing.id, body);
      }
      await load();
      setEditing(null);
      if (!creating) setNotice("Data pengguna berhasil diperbarui.");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  }
  async function deleteUser(item) {
    const consequences = item.role === "student"
      ? "Akun, sesi login, dan seluruh riwayat ujian siswa ini akan dihapus permanen."
      : item.role === "teacher"
        ? "Akun guru, soal buatannya, ujian yang dikelola, dan seluruh riwayat terkait akan dihapus permanen."
        : "Akun dan sesi login akan dihapus permanen.";
    if (!window.confirm(`Hapus akun ${item.fullName}? ${consequences}`)) return;
    setError("");
    setNotice("");
    try {
      await adminApi.deleteUser(item.id);
      setUsers((current) => current.filter((value) => value.id !== item.id));
      setNotice("Akun berhasil dihapus.");
    } catch (requestError) {
      setError(requestError.message);
    }
  }
  async function resetPassword(item) {
    if (!window.confirm(`Buat kata sandi sementara baru untuk ${item.fullName}?`)) return;
    setError("");
    setNotice("");
    try {
      const { temporaryPassword } = await adminApi.resetPassword(item.id);
      setCredential({ email: item.email, password: temporaryPassword });
    } catch (requestError) {
      setError(requestError.message);
    }
  }
  return <>
    <Alert error={error} notice={notice} />
    {role === "admin" && <p className="hint">Perubahan role dapat dilakukan dari halaman Data Siswa atau Data Guru. Admin tidak dapat menurunkan atau menghapus role akunnya sendiri.</p>}
    <section className="panel table-panel">
      <div className="panel-heading"><div><span>DAFTAR AKUN</span><h2>{title} <small>{loading ? "…" : users.length}</small></h2></div>
        <button className="primary" type="button" onClick={() => setCreating(true)}>
          + Tambah {role === "student" ? "Siswa" : role === "teacher" ? "Guru" : "Admin"}
        </button>
      </div>
      {loading ? <p className="empty">Memuat data...</p> : <div className="table-scroll"><table>
        <thead><tr><th>Nama</th><th>Email</th>{role === "student" && <th>Kelas</th>}{role === "teacher" && <><th>Mata Pelajaran</th><th>Kelas Mengajar</th></>}<th>Status</th><th>Terdaftar</th><th>Aksi</th></tr></thead>
        <tbody>{users.map((item) => <tr key={item.id}>
          <td><strong>{item.fullName}</strong>{item.id === currentUser.id && <small className="you-label">Anda</small>}</td>
          <td>{item.email}</td>
          {role === "student" && <td>{item.className ?? "Belum ditetapkan"}</td>}
          {role === "teacher" && <><td>{item.subject ?? "—"}</td><td>{(item.teacherClasses ?? []).map((value) => value.name).join(", ") || "Belum ditugaskan"}</td></>}
          <td><span className={`status ${item.isActive ? "active" : "inactive"}`}>{item.isActive ? "Aktif" : "Nonaktif"}</span></td>
          <td>{new Date(item.createdAt).toLocaleDateString("id-ID")}</td>
          <td><div className="row-actions"><button className="secondary" onClick={() => setProfile(item)}>Profil</button><button className="secondary" onClick={() => setEditing(item)}>Edit</button><button className="secondary" onClick={() => resetPassword(item)} disabled={item.id === currentUser.id}>Reset Password</button><button className="danger" onClick={() => deleteUser(item)} disabled={item.id === currentUser.id}>Hapus</button></div></td>
        </tr>)}
        {!users.length && <tr><td colSpan="8">Belum ada data {title.toLowerCase()}.</td></tr>}
        </tbody>
      </table></div>}
    </section>
    {(editing || creating) && <UserEditor item={editing} role={role} classes={classes} subjects={subjects} schoolName={schoolName} onClose={() => { setEditing(null); setCreating(false); }} onSave={saveUser} saving={saving} />}
    {profile && <UserProfileDialog item={profile} onClose={() => setProfile(null)} onResetPassword={(item) => { setProfile(null); resetPassword(item); }} />}
    <TemporaryPasswordDialog credential={credential} onClose={() => setCredential(null)} />
  </>;
}

function ClassesPage({ schoolId, schoolName }) {
  const usesXIClassF = schoolId === "school-sman2-lubuk-linggau" ||
    schoolName === "SMAN 2 Kota Lubuk Linggau";
  const className = (gradeLevel, number) =>
    `${gradeLevel === "XI" && usesXIClassF ? "XI F" : gradeLevel} ${number}`;
  const [classes, setClasses] = useState([]);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  async function load() { setClasses((await adminApi.classes()).classes); }
  useEffect(() => {
    let active = true;
    adminApi.classes().then(({ classes: values }) => { if (active) setClasses(values); })
      .catch((requestError) => { if (active) setError(requestError.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  async function save(event) {
    event.preventDefault();
    setSaving(true); setError(""); setNotice("");
    try {
      await adminApi.saveClass(editing.id, { name: editing.name, gradeLevel: editing.gradeLevel });
      await load(); setEditing(null); setNotice("Data kelas berhasil disimpan.");
    } catch (requestError) { setError(requestError.message); }
    finally { setSaving(false); }
  }
  async function remove(item) {
    if (!window.confirm(`Hapus kelas ${item.name}? Data penugasan kelas untuk siswa dan guru serta target kelas pada ujian akan dihapus. Akun siswa, guru, dan paket ujian tetap ada.`)) return;
    try {
      await adminApi.deleteClass(item.id); setClasses((current) => current.filter((value) => value.id !== item.id));
      setNotice("Kelas berhasil dihapus."); setError("");
    } catch (requestError) { setError(requestError.message); }
  }
  return <>
    <Alert error={error} notice={notice} />
    <div className="toolbar"><p>Menghapus kelas juga menghapus penugasan siswa/guru dan target kelas pada ujian, tetapi tidak menghapus akun atau paket ujiannya.</p><button className="primary" onClick={() => setEditing({ id: null, name: "", gradeLevel: "X" })}>+ Tambah Kelas</button></div>
    <section className="panel table-panel"><div className="table-scroll"><table><thead><tr><th>Kelas</th><th>Jenjang</th><th>Jumlah Siswa</th><th>Jumlah Guru</th><th>Aksi</th></tr></thead><tbody>
      {classes.map((item) => <tr key={item.id}><td><strong>{item.name}</strong></td><td>{item.gradeLevel}</td><td>{item.studentCount}</td><td>{item.teacherCount}</td><td><div className="row-actions"><button className="secondary" onClick={() => setEditing({ ...item })}>Edit</button><button className="danger" onClick={() => remove(item)}>Hapus</button></div></td></tr>)}
      {!loading && !classes.length && <tr><td colSpan="5">Belum ada kelas.</td></tr>}
      {loading && <tr><td colSpan="5">Memuat data...</td></tr>}
    </tbody></table></div></section>
    {editing && <div className="modal-backdrop"><form className="modal-card" onSubmit={save}>
      <header><div><span>DATA SEKOLAH</span><h2>{editing.id ? "Edit Kelas" : "Tambah Kelas"}</h2></div><button type="button" onClick={() => setEditing(null)}>×</button></header>
      <label>Jenjang<select value={editing.gradeLevel} onChange={(event) => setEditing({ ...editing, gradeLevel: event.target.value, name: className(event.target.value, 1) })}><option>X</option><option>XI</option><option>XII</option></select></label>
      <label>Kelas<select value={editing.name} onChange={(event) => setEditing({ ...editing, name: event.target.value })}>{Array.from({ length: editing.gradeLevel === "X" ? 12 : 11 }, (_, i) => className(editing.gradeLevel, i + 1)).map((name) => <option key={name}>{name}</option>)}</select></label>
      <footer><button className="secondary" type="button" onClick={() => setEditing(null)}>Batal</button><button className="primary" disabled={saving}>{saving ? "Menyimpan..." : "Simpan"}</button></footer>
    </form></div>}
  </>;
}

function SubjectsPage() {
  const [subjects, setSubjects] = useState([]);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  async function load() { setSubjects((await adminApi.subjects()).subjects); }
  useEffect(() => {
    let active = true;
    adminApi.subjects().then(({ subjects: values }) => { if (active) setSubjects(values); })
      .catch((requestError) => { if (active) setError(requestError.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  async function save(event) {
    event.preventDefault(); setError(""); setNotice("");
    try {
      await adminApi.saveSubject(editing.id, { name: editing.name });
      await load(); setEditing(null); setNotice("Mata pelajaran berhasil disimpan.");
    } catch (requestError) { setError(requestError.message); }
  }
  async function remove(item) {
    if (!window.confirm(`Hapus mata pelajaran ${item.name}? Soal, paket ujian, dan seluruh riwayat ujian terkait akan dihapus permanen. Akun guru tetap ada dan mapelnya diubah menjadi Umum.`)) return;
    try {
      await adminApi.deleteSubject(item.id); setSubjects((current) => current.filter((value) => value.id !== item.id));
      setNotice("Mata pelajaran berhasil dihapus."); setError("");
    } catch (requestError) { setError(requestError.message); }
  }
  return <>
    <Alert error={error} notice={notice} />
    <div className="toolbar"><p>Menghapus mata pelajaran juga menghapus soal dan paket ujian terkait beserta riwayatnya. Akun guru tetap ada tanpa mapel tersebut.</p><button className="primary" onClick={() => setEditing({ id: null, name: "" })}>+ Tambah Mata Pelajaran</button></div>
    <section className="panel table-panel"><div className="table-scroll"><table><thead><tr><th>Mata Pelajaran</th><th>Guru Pengampu</th><th>Aksi</th></tr></thead><tbody>
      {subjects.map((item) => <tr key={item.id}><td><strong>{item.name}</strong></td><td>{item.teacherCount}</td><td><div className="row-actions"><button className="secondary" onClick={() => setEditing({ ...item })}>Edit</button><button className="danger" onClick={() => remove(item)}>Hapus</button></div></td></tr>)}
      {!loading && !subjects.length && <tr><td colSpan="3">Belum ada mata pelajaran.</td></tr>}
      {loading && <tr><td colSpan="3">Memuat data...</td></tr>}
    </tbody></table></div></section>
    {editing && <div className="modal-backdrop"><form className="modal-card" onSubmit={save}>
      <header><div><span>DATA AKADEMIK</span><h2>{editing.id ? "Edit Mata Pelajaran" : "Tambah Mata Pelajaran"}</h2></div><button type="button" onClick={() => setEditing(null)}>×</button></header>
      <label>Nama Mata Pelajaran<input value={editing.name} onChange={(event) => setEditing({ ...editing, name: event.target.value })} required maxLength="100" /></label>
      <footer><button className="secondary" type="button" onClick={() => setEditing(null)}>Batal</button><button className="primary">Simpan</button></footer>
    </form></div>}
  </>;
}

function ExamsPage() {
  const [exams, setExams] = useState([]);
  const [editingToken, setEditingToken] = useState(null);
  const [tokenSaving, setTokenSaving] = useState(false);
  const [copiedToken, setCopiedToken] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  useEffect(() => {
    let active = true;
    adminApi.exams().then(({ exams: values }) => { if (active) setExams(values); })
      .catch((requestError) => { if (active) setError(requestError.message); });
    return () => { active = false; };
  }, []);
  async function copyToken(code) {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedToken(code);
      setError("");
    } catch {
      setError("Token tidak dapat disalin. Salin token secara manual.");
    }
  }
  async function saveToken(event) {
    event.preventDefault();
    setTokenSaving(true); setError(""); setNotice("");
    try {
      const { exam } = await adminApi.updateExamToken(editingToken.id, editingToken.code);
      setExams((current) => current.map((item) =>
        item.id === exam.id ? { ...item, code: exam.code } : item,
      ));
      setNotice("Token ujian berhasil diperbarui.");
      setEditingToken(null);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setTokenSaving(false);
    }
  }
  return <>
    <Alert error={error} notice={notice} />
    <section className="panel table-panel"><div className="table-scroll"><table><thead><tr><th>Judul Ujian</th><th>Mata Pelajaran</th><th>Guru</th><th>Kelas Tujuan</th><th>Status</th><th>Mulai</th><th>Selesai</th><th>Token</th><th>Aksi</th></tr></thead><tbody>
      {exams.map((exam) => <tr key={exam.id}><td><strong>{exam.title}</strong><small>{exam.questionCount} soal</small></td><td>{exam.subject}</td><td>{exam.teacherName ?? "—"}</td><td>{exam.classes.join(", ") || "—"}</td><td><span className="status active">{exam.status}</span></td><td>{new Date(exam.opensAt).toLocaleString("id-ID")}</td><td>{new Date(exam.closesAt).toLocaleString("id-ID")}</td>
        <td>{exam.publishedAt ? <div className="row-actions"><code>{exam.code}</code><button className="secondary" type="button" onClick={() => copyToken(exam.code)}>{copiedToken === exam.code ? "Tersalin" : "Salin"}</button></div> : "Belum dipublish"}</td>
        <td>{exam.publishedAt && <button className="secondary" type="button" onClick={() => setEditingToken({ id: exam.id, title: exam.title, code: exam.code })}>Ubah Token</button>}</td>
      </tr>)}
      {!exams.length && <tr><td colSpan="9">Belum ada ujian.</td></tr>}
    </tbody></table></div></section>
    {editingToken && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setEditingToken(null); }}>
      <form className="modal-card" onSubmit={saveToken}>
        <header><div><span>KELOLA TOKEN UJIAN</span><h2>Ubah Token</h2></div><button type="button" onClick={() => setEditingToken(null)} aria-label="Tutup">×</button></header>
        <p className="hint">{editingToken.title}</p>
        <label>Token Ujian<input autoFocus value={editingToken.code} onChange={(event) => setEditingToken({ ...editingToken, code: event.target.value.toUpperCase() })} maxLength="6" pattern="[A-Z]{3}[0-9]{2}[#@!]" required /></label>
        <small>Format: 3 huruf, 2 angka, dan satu simbol (#, @, atau !).</small>
        <footer><button className="secondary" type="button" onClick={() => setEditingToken(null)}>Batal</button><button className="primary" disabled={tokenSaving}>{tokenSaving ? "Menyimpan..." : "Simpan Token"}</button></footer>
      </form>
    </div>}
  </>;
}

function SchoolsPage({ schools, selectedSchoolId, onSchoolsChange, onSchoolChange }) {
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  useEffect(() => {
    let active = true;
    adminApi.schools()
      .then(({ schools: values }) => { if (active) onSchoolsChange(values); })
      .catch((requestError) => { if (active) setError(requestError.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  async function refresh() {
    const { schools: values } = await adminApi.schools();
    onSchoolsChange(values);
    if (!selectedSchoolId || !values.some((school) => school.id === selectedSchoolId)) {
      const next = values.find((school) => school.isActive) ?? values[0];
      onSchoolChange(next?.id ?? "");
    }
  }

  async function save(event) {
    event.preventDefault();
    setSaving(true); setError(""); setNotice("");
    try {
      if (editing.isNew) {
        await adminApi.createSchool(editing);
        setNotice("Sekolah berhasil ditambahkan.");
      } else {
        await adminApi.updatePlatformSchool(editing.id, {
          name: editing.name,
          address: editing.address,
          email: editing.email,
          isActive: editing.isActive,
        });
        setNotice("Data sekolah berhasil diperbarui.");
      }
      await refresh();
      setEditing(null);
    } catch (requestError) { setError(requestError.message); }
    finally { setSaving(false); }
  }

  async function remove(school) {
    const confirmed = window.confirm(
      `Hapus sekolah ${school.name}? Seluruh akun, kelas, mata pelajaran, soal, ujian, dan riwayat sekolah ini akan dihapus permanen.`,
    );
    if (!confirmed) return;
    setError(""); setNotice("");
    try {
      const result = await adminApi.deleteSchool(school.id);
      await refresh();
      setNotice(result.deleted ? "Sekolah dan seluruh datanya berhasil dihapus." : "");
    } catch (requestError) { setError(requestError.message); }
  }

  return <>
    <Alert error={error} notice={notice} />
    <div className="toolbar">
      <p>Kelola sekolah dan pantau jumlah guru, siswa, serta kelas. Kode sekolah tidak dapat diubah setelah dibuat.</p>
      <button className="primary" type="button" onClick={() => setEditing({
        isNew: true, id: "", name: "", address: "", email: "", isActive: true,
      })}>+ Tambah Sekolah</button>
    </div>
    <section className="panel table-panel"><div className="table-scroll"><table>
      <thead><tr><th>Sekolah</th><th>Kode</th><th>Alamat</th><th>Email</th><th>Guru</th><th>Siswa</th><th>Kelas</th><th>Status</th><th>Aksi</th></tr></thead>
      <tbody>{schools.map((school) => <tr key={school.id}>
        <td><strong>{school.name}</strong></td><td><code>{school.id}</code></td>
        <td>{school.address || "—"}</td><td>{school.email || "—"}</td>
        <td>{school.teacherCount ?? 0}</td><td>{school.studentCount ?? 0}</td><td>{school.classCount ?? 0}</td>
        <td><span className={`status ${school.isActive ? "active" : "inactive"}`}>{school.isActive ? "Aktif" : "Nonaktif"}</span></td>
        <td><div className="row-actions">
          <button className="secondary" type="button" onClick={() => onSchoolChange(school.id)}>Kelola</button>
          <button className="secondary" type="button" onClick={() => setEditing({ ...school, isNew: false })}>Edit</button>
          <button className="danger" type="button" onClick={() => remove(school)}>Hapus</button>
        </div></td>
      </tr>)}
      {!loading && !schools.length && <tr><td colSpan="9">Belum ada sekolah. Tambahkan sekolah untuk mulai mengelola akun dan kelas.</td></tr>}
      {loading && <tr><td colSpan="9">Memuat data...</td></tr>}
    </tbody></table></div></section>
    {editing && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setEditing(null); }}>
      <form className="modal-card" onSubmit={save}>
        <header><div><span>MASTER SEKOLAH</span><h2>{editing.isNew ? "Tambah Sekolah" : "Edit Sekolah"}</h2></div><button type="button" onClick={() => setEditing(null)} aria-label="Tutup">×</button></header>
        <label>Kode Sekolah<input value={editing.id} onChange={(event) => setEditing({ ...editing, id: event.target.value.toLowerCase() })} required maxLength="80" pattern="[a-z0-9]+(-[a-z0-9]+)*" disabled={!editing.isNew} /></label>
        <label>Nama Sekolah<input value={editing.name} onChange={(event) => setEditing({ ...editing, name: event.target.value })} required minLength="2" maxLength="160" /></label>
        <label>Alamat<textarea value={editing.address ?? ""} onChange={(event) => setEditing({ ...editing, address: event.target.value })} maxLength="500" rows="3" /></label>
        <label>Email<input type="email" value={editing.email ?? ""} onChange={(event) => setEditing({ ...editing, email: event.target.value })} maxLength="254" /></label>
        {!editing.isNew && <label className="check-row"><input type="checkbox" checked={editing.isActive} onChange={(event) => setEditing({ ...editing, isActive: event.target.checked })} /> Sekolah aktif</label>}
        <footer><button className="secondary" type="button" onClick={() => setEditing(null)}>Batal</button><button className="primary" type="submit" disabled={saving}>{saving ? "Menyimpan..." : "Simpan"}</button></footer>
      </form>
    </div>}
  </>;
}

function SchoolSettings({ onSchoolUpdated }) {
  const [school, setSchool] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  useEffect(() => {
    let active = true;
    adminApi.school().then(({ school: value }) => { if (active) setSchool(value); })
      .catch((requestError) => { if (active) setError(requestError.message); });
    return () => { active = false; };
  }, []);
  async function submit(event) {
    event.preventDefault(); setError(""); setNotice("");
    try {
      const { school: value } = await adminApi.updateSchool(school);
      setSchool(value); onSchoolUpdated(value); setNotice("Nama sekolah berhasil diperbarui.");
    } catch (requestError) { setError(requestError.message); }
  }
  return <section className="panel settings-panel">
    <div className="panel-heading"><div><span>SEKOLAH AKTIF</span><h2>Pengaturan Sekolah</h2></div></div>
    <Alert error={error} notice={notice} />
    {school && <form onSubmit={submit}><label>Nama Sekolah<input value={school.name} onChange={(event) => setSchool({ ...school, name: event.target.value })} required maxLength="160" /></label><small>ID Sekolah: {school.id}</small><button className="primary">Simpan Pengaturan</button></form>}
  </section>;
}

function AdminProfile({ user, onProfileUpdated }) {
  const [form, setForm] = useState({ fullName: user.fullName, email: user.email });
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  async function submit(event) {
    event.preventDefault(); setError(""); setNotice("");
    try {
      const { profile } = await adminApi.updateProfile(form);
      setForm(profile); onProfileUpdated(profile); setNotice("Profil Admin berhasil diperbarui.");
    } catch (requestError) { setError(requestError.message); }
  }
  return <section className="panel settings-panel">
    <div className="profile-layout"><span className="profile-avatar">{initials(user.fullName)}</span>
      <form onSubmit={submit}><div className="panel-heading"><div><span>PROFIL PENGGUNA</span><h2>Informasi Admin</h2></div></div>
        <Alert error={error} notice={notice} />
        <label>Nama Lengkap<input value={form.fullName} onChange={(event) => setForm({ ...form, fullName: event.target.value })} required /></label>
        <label>Email<input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required /></label>
        <label>Role<input value="Administrator" disabled /></label>
        <button className="primary">Simpan Profil</button>
      </form>
    </div>
  </section>;
}

function ActivityPage() {
  const [events, setEvents] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    async function poll() {
      try {
        const { events: values, sessions: activeSessions = [] } = await adminApi.activity();
        if (active) {
          setEvents(values);
          setSessions(activeSessions);
          setError("");
        }
      } catch (requestError) { if (active) setError(requestError.message); }
      if (active) window.setTimeout(poll, 15_000);
    }
    poll();
    return () => { active = false; };
  }, []);
  const eventLabels = {
    tab_hidden: "Beralih dari halaman ujian",
    window_blur: "Jendela ujian kehilangan fokus",
    fullscreen_exit: "Keluar dari mode layar penuh",
    print_screen: "Tombol PrintScreen terdeteksi",
    app_closed: "Keluar atau menutup halaman ujian",
  };
  return <>
    <section className="panel table-panel">
      <div className="panel-heading"><div><span>SESI AKTIF</span><h2>Sesi Ujian Berlangsung</h2></div></div>
      <Alert error={error} />
      <div className="table-scroll"><table><thead><tr><th>Siswa</th><th>Kelas</th><th>Ujian</th><th>Mulai</th><th>Status Sesi</th><th>Pelanggaran</th></tr></thead><tbody>
        {sessions.map((session) => {
          const frozen = session.lockedUntil && Date.parse(session.lockedUntil) > Date.now();
          const status = session.disqualifiedAt ? "Perlu verifikasi"
            : frozen ? "Dibekukan sementara"
              : session.lastEventType === "app_closed" ? "Halaman ujian ditutup"
                : "Sedang mengerjakan";
          return <tr key={session.attemptId}>
            <td>{session.studentName}</td><td>{session.className ?? "—"}</td>
            <td>{session.examTitle}</td><td>{new Date(session.startedAt).toLocaleString("id-ID")}</td>
            <td>{status}{session.lastEventType ? ` · ${eventLabels[session.lastEventType] ?? session.lastEventType} (${new Date(session.lastEventAt).toLocaleString("id-ID")})` : ""}</td>
            <td>{session.violationCount}</td>
          </tr>;
        })}
        {!sessions.length && !error && <tr><td colSpan="6">Tidak ada sesi ujian yang sedang berlangsung.</td></tr>}
      </tbody></table></div>
    </section>
    <section className="panel table-panel">
      <div className="panel-heading"><div><span>PEMANTAUAN AKTIVITAS</span><h2>Notifikasi Pelanggaran</h2></div></div>
      <div className="table-scroll"><table><thead><tr><th>Siswa</th><th>Kelas</th><th>Ujian</th><th>Aktivitas</th><th>Pelanggaran</th><th>Waktu</th></tr></thead><tbody>
        {events.map((event) => <tr key={event.id}><td>{event.studentName}</td><td>{event.className ?? "—"}</td><td>{event.examTitle}</td><td>{eventLabels[event.eventType] ?? event.eventType}</td><td>{event.violationNumber}</td><td>{new Date(event.occurredAt).toLocaleString("id-ID")}</td></tr>)}
        {!events.length && !error && <tr><td colSpan="6">Belum ada aktivitas yang dilaporkan.</td></tr>}
      </tbody></table></div>
    </section>
  </>;
}

export default function App({ basePath = "", initialUser = null, onLogout: onGlobalLogout } = {}) {
  const [auth, setAuth] = useState(() => ({
    loading: !initialUser,
    user: initialUser,
  }));
  const [authError, setAuthError] = useState("");
  const [schools, setSchools] = useState([]);
  const [selectedSchoolId, setSelectedSchoolId] = useState("");
  const [scopeLoading, setScopeLoading] = useState(false);
  const [scopeError, setScopeError] = useState("");
  const browserPath = window.location.pathname;
  const path = basePath && browserPath.startsWith(`${basePath}/`)
    ? browserPath.slice(basePath.length)
    : basePath && browserPath === basePath ? "/" : browserPath;
  useEffect(() => {
    if (initialUser) {
      setAuth({ loading: false, user: initialUser });
      return undefined;
    }
    let active = true;
    adminApi.session()
      .then(({ user }) => { if (active) setAuth({ loading: false, user: user?.role === "admin" ? user : null }); })
      .catch((error) => { if (active) { setAuth({ loading: false, user: null }); if (error.message !== "Silakan masuk untuk melanjutkan." && error.message !== "Sesi masuk tidak valid atau telah berakhir.") setAuthError(error.message); } });
    return () => { active = false; };
  }, [initialUser]);
  useEffect(() => {
    if (!auth.user) {
      setAdminSchoolId("");
      setSchools([]);
      setSelectedSchoolId("");
      setScopeError("");
      return undefined;
    }
    if (auth.user.schoolId) {
      setAdminSchoolId(auth.user.schoolId);
      setSchools([{ id: auth.user.schoolId, name: auth.user.schoolName ?? "Sekolah" }]);
      setSelectedSchoolId(auth.user.schoolId);
      setScopeError("");
      return undefined;
    }
    let active = true;
    setScopeLoading(true);
    setScopeError("");
    adminApi.schools()
      .then(({ schools: values }) => {
        if (!active) return;
        const preferredId = localStorage.getItem("nsolve-admin-school");
        const selected = values.find((school) => school.id === preferredId) ?? values[0];
        setSchools(values);
        if (!selected) {
          setScopeError("Belum ada sekolah yang dapat dikelola.");
          return;
        }
        setAdminSchoolId(selected.id);
        setSelectedSchoolId(selected.id);
        localStorage.setItem("nsolve-admin-school", selected.id);
      })
      .catch((requestError) => { if (active) setScopeError(requestError.message); })
      .finally(() => { if (active) setScopeLoading(false); });
    return () => { active = false; };
  }, [auth.user]);
  async function login(credentials) {
    const { user } = await adminApi.login(credentials);
    if (user.role !== "admin") throw new Error("Akun ini tidak memiliki akses Admin.");
    setAuth({ loading: false, user });
    window.history.replaceState(null, "", scopedPath(basePath, "/"));
  }
  async function logout() {
    if (onGlobalLogout) {
      await onGlobalLogout();
      return;
    }
    await adminApi.logout();
    setAuth({ loading: false, user: null });
  }
  function changeSchool(schoolId) {
    setAdminSchoolId(schoolId);
    setSelectedSchoolId(schoolId);
    if (schoolId) localStorage.setItem("nsolve-admin-school", schoolId);
    else localStorage.removeItem("nsolve-admin-school");
  }
  if (auth.loading) return <main className="loading">Memeriksa sesi...</main>;
  if (!auth.user) return <><Login onLogin={login} /><Alert error={authError} /></>;
  if (!auth.user.schoolId && scopeLoading) {
    return <main className="loading">{scopeError || "Memuat daftar sekolah..."}</main>;
  }

  const activeSchool = schools.find((school) => school.id === selectedSchoolId);
  const currentPath = !auth.user.schoolId && !selectedSchoolId
    ? "/sekolah"
    : pathTitles[path] ? path : "/";
  let page;
  if (!auth.user.schoolId && !selectedSchoolId) page = <SchoolsPage
    schools={schools}
    selectedSchoolId={selectedSchoolId}
    onSchoolsChange={setSchools}
    onSchoolChange={changeSchool}
  />;
  else if (path === "/sekolah" && !auth.user.schoolId) page = <SchoolsPage
    schools={schools}
    selectedSchoolId={selectedSchoolId}
    onSchoolsChange={setSchools}
    onSchoolChange={changeSchool}
  />;
  else if (path === "/siswa") page = <UserPage role="student" title="Data Siswa" currentUser={auth.user} schoolName={activeSchool?.name ?? auth.user.schoolName} />;
  else if (path === "/guru") page = <UserPage role="teacher" title="Data Guru" currentUser={auth.user} schoolName={activeSchool?.name ?? auth.user.schoolName} />;
  else if (path === "/admin") page = <UserPage role="admin" title="Data Admin" currentUser={auth.user} schoolName={activeSchool?.name ?? auth.user.schoolName} />;
  else if (path === "/kelas") page = <ClassesPage
    schoolId={activeSchool?.id ?? auth.user.schoolId}
    schoolName={activeSchool?.name ?? auth.user.schoolName}
  />;
  else if (path === "/mapel") page = <SubjectsPage />;
  else if (path === "/ujian") page = <ExamsPage />;
  else if (path === "/pengaturan") page = <SchoolSettings onSchoolUpdated={(school) => setSchools((current) =>
    current.map((item) => item.id === school.id ? school : item),
  )} />;
  else if (path === "/profil") page = <AdminProfile user={auth.user} onProfileUpdated={(profile) => setAuth((current) => ({ ...current, user: { ...current.user, ...profile } }))} />;
  else if (path === "/pengawasan") page = <ActivityPage />;
  else page = <Dashboard basePath={basePath} />;
  return <Shell
    user={auth.user}
    path={currentPath}
    onLogout={logout}
    schools={schools}
    selectedSchoolId={selectedSchoolId}
    onSchoolChange={changeSchool}
    isPlatformAdmin={!auth.user.schoolId}
    basePath={basePath}
  ><div key={selectedSchoolId}>{page}</div></Shell>;
}
