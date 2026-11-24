# Panduan Guru NSolve-Tech

Panduan ini menjelaskan cara mengelola ujian untuk kelas yang ditugaskan,
membuat atau mengimpor soal, membagikan token, melihat hasil, dan menangani
permohonan remedial.

Portal: [nsolve-tech.vercel.app](https://nsolve-tech.vercel.app)

## 1. Masuk dan mengenal menu

Akun guru disediakan oleh administrator sekolah. Masuk menggunakan email dan
kata sandi akun tersebut; formulir **Daftar** pada portal ditujukan untuk siswa.

Menu utama guru:

- **Dashboard**: ringkasan ujian, kelas mengajar, dan permohonan remedial.
- **Soal**: membuat, mengedit, melihat, atau menghapus ujian.
- **Jadwal Ujian**: memantau ujian draft, terjadwal, aktif, dan selesai.
- **Peserta**: melihat siswa yang terdaftar pada ujian.
- **Hasil Ujian**: melihat rekap nilai dan ketuntasan.
- **Data Kelas**: melihat kelas yang ditugaskan administrator.
- **Profil**: memperbarui nama, jabatan, mata pelajaran, dan tahun ajaran.

Jika mata pelajaran atau kelas yang diperlukan tidak tersedia, hubungi
administrator sekolah.

## 2. Membuat ujian dan soal

1. Buka **Soal → Buat Soal**.
2. Ikuti langkah wizard:
   - **Tipe Soal**: pilih pilihan ganda atau essay.
   - **Mata Pelajaran**: pilih mata pelajaran yang tersedia.
   - **Judul**: isi judul ujian, misalnya *Ulangan Harian Kimia*.
   - **Kelas**: pilih jenjang dan satu atau beberapa kelas tujuan. Siswa di
     kelas yang dipilih akan menjadi peserta ujian. Untuk SMAN 2 Kota Lubuk
     Linggau, kelas XI ditampilkan sebagai **XI F 1** sampai **XI F 11**.
   - **Jadwal**: pilih **Mulai Sekarang** atau **Jadwalkan**. Atur waktu mulai
     (untuk ujian terjadwal), waktu selesai, durasi 1–480 menit, dan KKM 0–100.
     Anda juga dapat memilih apakah nilai langsung ditampilkan kepada siswa.
   - **Token**: gunakan token otomatis atau buat token sendiri. Token khusus
     terdiri dari 3 huruf, 2 angka, dan satu simbol `#`, `@`, atau `!`
     (contoh: `KIM23#`).
   - **Input Soal**: lengkapi pertanyaan dan kunci jawaban. Pilihan ganda
     memerlukan opsi A–E dan satu kunci jawaban. Untuk essay, isi pedoman
     jawaban dan bobot nilai.
   - **Preview**: periksa tampilan soal dan pilihan seperti yang akan dilihat
     siswa.
   - **Publish**: periksa kembali pengaturan, lalu terbitkan ujian.

   Wizard membatasi satu ujian hingga 100 pertanyaan. Teks pertanyaan minimal
   10 karakter. Pilih urutan soal sesuai susunan guru atau acak per siswa pada
   pengaturan jadwal.

   **Catatan tipe soal:** halaman pengerjaan siswa saat ini menampilkan opsi
   pilihan ganda. Gunakan tipe **Pilihan Ganda** untuk ujian yang akan
   dikerjakan siswa; jangan memublikasikan soal essay sampai dukungan jawaban
   essay pada sisi siswa dipastikan tersedia.

Setelah publish, simpan atau salin token yang ditampilkan. Bagikan token hanya
kepada siswa di kelas tujuan. Siswa memerlukan token untuk masuk ke ujian.
Ujian yang dimulai sekarang langsung aktif; ujian terjadwal menunggu waktu
mulainya.

## 3. Mengimpor soal

1. Buka **Soal → Import Soal**.
2. Unggah dokumen Word `.docx`, atau tempel teks soal pada kotak format teks.
   Format `.doc` belum didukung.
3. Untuk pilihan ganda, gunakan penanda `Soal:`, opsi A–E, dan baris kunci.
   Contoh:

   ```text
   Soal:
   Apa nama proses perubahan wujud dari cair menjadi gas?
   A. Membeku
   B. Menguap
   C. Mengembun
   D. Menyublim
   E. Mengkristal
   Kunci: B

   Soal:
   Pertanyaan berikutnya ditulis di sini.
   A. Pilihan A
   B. Pilihan B
   C. Pilihan C
   D. Pilihan D
   E. Pilihan E
   Kunci: A
   ```

4. Tekan **Preview Import Soal**. Periksa jumlah soal, pemisahan paragraf,
   opsi, kunci, dan simbol pada setiap pertanyaan.
5. Jika ada kesalahan, perbaiki teks lalu buat preview lagi. Setelah semua
   benar, pilih **Lanjut Buat Ujian**.
6. Lengkapi mata pelajaran, judul, kelas, jadwal, dan token di wizard. Soal
   import akan langsung disimpan ke ujian yang dibuat; tidak ada penyimpanan
   terpisah ke Bank Soal.

Setiap soal pilihan ganda hasil import harus memiliki pertanyaan, opsi A sampai
E, dan kunci jawaban A–E. Soal bernomor seperti `1.` dan `2.` juga dapat
digunakan; gunakan pola penomoran yang konsisten. Periksa preview sebelum
melanjutkan, terutama untuk memastikan setiap pertanyaan tetap berada pada
paragraf yang benar. Simbol pada soal dapat diketik atau ditempel seperti teks
biasa.

## 4. Mengelola jadwal, token, dan peserta

- Buka **Jadwal Ujian** untuk memfilter ujian berdasarkan status **Draft**,
  **Terjadwal**, **Aktif**, atau **Selesai**.
- Gunakan **Salin Token** pada jadwal atau detail ujian untuk menyalin token.
  Jika penyalinan gagal, salin token yang tampil secara manual.
- Buka judul ujian untuk melihat detail, kelas tujuan, waktu, durasi, token,
  dan daftar soal.
- Gunakan langkah **Preview** pada wizard sebelum publish untuk memeriksa
  susunan soal, kelas tujuan, dan urutan paragraf.
- Halaman peserta menampilkan siswa berdasarkan kelas tujuan, termasuk status
  sudah atau belum mengerjakan.
- Dari menu **Soal**, gunakan **Edit** untuk memperbarui ujian. Penghapusan
  ujian bersifat permanen dan dapat menghapus soal, jawaban, hasil, aktivitas,
  serta data remedial yang terkait. Pastikan ujian yang dipilih benar sebelum
  mengonfirmasi penghapusan.

## 5. Melihat nilai dan analisis

- Buka **Hasil Ujian** untuk melihat ringkasan rata-rata, nilai tertinggi dan
  terendah, jumlah peserta, serta tingkat ketuntasan.
- Pilih judul ujian pada tabel hasil untuk membuka analisis ujian.
- Analisis menampilkan hasil peserta dan ringkasan respons setiap soal. Nilai
  yang belum tersedia atau belum dikerjakan akan ditandai di tabel.
- Pengaturan **Tampilkan nilai kepada siswa** menentukan apakah siswa dapat
  melihat skor dan review setelah mengumpulkan ujian. Jika dimatikan, siswa
  hanya mendapat konfirmasi bahwa ujian selesai.

## 6. Menangani remedial

1. Siswa yang nilainya di bawah KKM dan dapat melihat nilainya dapat menekan
   **Ajukan Remedial** pada halaman nilai.
2. Permohonan muncul pada notifikasi (ikon lonceng) dan bagian remedial di
   dashboard guru.
3. Tinjau nama siswa, kelas, ujian, nilai, dan KKM. Pilih **Setujui** atau
   **Tolak**.
4. Setelah disetujui, pilih salah satu tindakan:
   - **Buat soal baru** untuk menyusun soal remedial baru.
   - **Ulangi soal sebelumnya** untuk menggunakan kembali soal ujian asal,
     jika tipe soalnya didukung.
5. Lengkapi jadwal dan publish ujian remedial. Periksa status permohonan atau
   jadwal remedial pada dashboard/notifikasi.

## 7. Memperbarui profil

Buka **Profil → Edit Profil** untuk memperbarui nama, jabatan, mata pelajaran,
atau tahun ajaran, lalu pilih **Simpan Perubahan**. Informasi sekolah dikelola
oleh administrator.

Jika token, kelas, atau mata pelajaran bermasalah, atau data siswa tidak sesuai,
hubungi administrator sekolah. Jangan membagikan kata sandi atau token kepada
pihak di luar peserta ujian.
