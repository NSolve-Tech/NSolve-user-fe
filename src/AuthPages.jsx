import React, { useEffect, useState } from "react";
import Brand from "./Brand.jsx";
import PasswordInput from "./PasswordInput.jsx";
import { studentApi } from "./student-api.js";
import "./auth-pages.css";

export default function AuthPage({ mode, onAuthenticate }) {
  const registering = mode === "register";
  const [values, setValues] = useState({
    fullName: "",
    email: "",
    password: "",
    schoolId: "",
    classId: "",
    gradeLevel: "XI",
  });
  const [registrationOptions, setRegistrationOptions] = useState({
    schools: [],
    school: null,
    classes: [],
  });
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!registering) return undefined;
    let active = true;
    studentApi.getRegistrationOptions()
      .then((options) => {
        if (!active) return;
        setRegistrationOptions(options);
        setValues((current) => ({
          ...current,
          schoolId: options.school?.id ?? "",
          classId: "",
        }));
      })
      .catch((requestError) => {
        if (active) setError(requestError.message);
      });
    return () => { active = false; };
  }, [registering]);

  async function handleSchoolChange(schoolId) {
    setValues((current) => ({ ...current, schoolId, classId: "" }));
    setLoadingClasses(true);
    setError("");
    try {
      const options = await studentApi.getRegistrationOptions(schoolId);
      setRegistrationOptions(options);
    } catch (requestError) {
      setError(requestError.message || "Tidak dapat memuat kelas sekolah.");
    } finally {
      setLoadingClasses(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await onAuthenticate(values);
    } catch (requestError) {
      setError(requestError.message || "Tidak dapat memproses permintaan.");
      setSubmitting(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <Brand variant="top" />
        <div className="auth-heading">
          <span>PORTAL PEMBELAJARAN DIGITAL</span>
          <h1>{registering ? "Buat akun siswa" : "Selamat datang kembali"}</h1>
          <p>
            {registering
              ? "Daftar menggunakan email dan data diri Anda."
              : "Masuk untuk melanjutkan ke pembelajaran Anda."}
          </p>
        </div>
        <form onSubmit={handleSubmit}>
          {registering && (
            <>
              <label>
                Nama lengkap
                <input
                  autoComplete="name"
                  required
                  minLength={2}
                  value={values.fullName}
                  onChange={(event) => setValues({ ...values, fullName: event.target.value })}
                />
              </label>
              <label>
                Sekolah
                <select
                  value={values.schoolId}
                  onChange={(event) => handleSchoolChange(event.target.value)}
                  required
                >
                  <option value="">Pilih sekolah</option>
                  {registrationOptions.schools.map((school) => (
                    <option value={school.id} key={school.id}>{school.name}</option>
                  ))}
                </select>
              </label>
              <label>
                Jenjang
                <select
                  value={values.gradeLevel}
                  onChange={(event) => setValues({
                    ...values,
                    gradeLevel: event.target.value,
                    classId: "",
                  })}
                  required
                >
                  <option value="X">X</option>
                  <option value="XI">XI</option>
                  <option value="XII">XII</option>
                </select>
              </label>
              <label>
                Kelas
                <select
                  value={values.classId}
                  onChange={(event) => setValues({ ...values, classId: event.target.value })}
                  disabled={loadingClasses || !registrationOptions.classes.length}
                  required
                >
                  <option value="">{loadingClasses ? "Memuat kelas..." : "Pilih kelas"}</option>
                  {registrationOptions.classes
                    .filter((item) =>
                      item.gradeLevel === values.gradeLevel,
                    )
                    .filter((item, index, items) =>
                      items.findIndex((candidate) => candidate.name === item.name) === index,
                    )
                    .map((item) => (
                      <option value={item.id} key={item.id}>{item.name}</option>
                    ))}
                </select>
              </label>
            </>
          )}
          <label>
            Email
            <input
              type="email"
              autoComplete="email"
              required
              value={values.email}
              onChange={(event) => setValues({ ...values, email: event.target.value })}
            />
          </label>
          <label>
            Kata sandi
            <PasswordInput
              autoComplete={registering ? "new-password" : "current-password"}
              required
              maxLength={registering ? 128 : undefined}
              value={values.password}
              onChange={(event) => setValues({ ...values, password: event.target.value })}
            />
          </label>
          {error && <p className="auth-error" role="alert">{error}</p>}
          <button type="submit" disabled={submitting}>
            {submitting ? "Memproses..." : registering ? "Daftar" : "Masuk"}
          </button>
        </form>
        <p className="auth-switch">
          {registering ? "Sudah punya akun?" : "Belum punya akun?"}{" "}
          <a href={registering ? "/login" : "/daftar"}>
            {registering ? "Masuk" : "Daftar"}
          </a>
        </p>
      </section>
    </main>
  );
}
