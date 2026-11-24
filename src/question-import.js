export const IMPORTED_EXAM_QUESTIONS_KEY = "nsolve-imported-exam-questions";

export function mapImportedQuestionsToExamDraft(questions) {
  if (!Array.isArray(questions) || questions.length === 0) {
    throw new Error("Tidak ada soal impor untuk dimasukkan ke ujian.");
  }
  return questions.map((question, index) => {
    if (!question || typeof question.prompt !== "string" ||
        !Array.isArray(question.options)) {
      throw new Error(`Format soal impor ke-${index + 1} tidak valid.`);
    }
    const options = ["A", "B", "C", "D", "E"].map((label) =>
      question.options.find((option) => option.label === label)?.content ?? "",
    );
    const correctOption = question.answerKey?.toUpperCase();
    if (question.prompt.trim().length < 10 ||
        options.some((option) => !option.trim()) ||
        !["A", "B", "C", "D", "E"].includes(correctOption)) {
      throw new Error(`Soal impor ke-${index + 1} belum lengkap.`);
    }
    return {
      type: "multiple_choice",
      prompt: question.prompt,
      options,
      correctOption,
      answerKey: "",
      points: 1,
    };
  });
}

export function parseImportedQuestions(text) {
  let normalized = text
    .replace(/\r/g, "")
    .replace(/\u00ad/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}(?=[A-E][.)]\s)/g, "\n")
    .replace(/(^|\n)\s*([A-E])[.)]\s*/g, "$1$2. ")
    .replace(/(^|\n)\s*([A-E])\s+([0-9])/g, "$1$2. $3");

  const allNumberedMatches = [...normalized.matchAll(
    /(?:^|\n)\s*(?:Nomor\s*)?(?:Soal\s*)?(\d{1,3})([.)])\s+/gim,
  )];
  const questionMarker = allNumberedMatches[0]?.[2];
  const numberedMatches = allNumberedMatches.filter(
    (match) => match[2] === questionMarker,
  );
  let sections = [];

  if (numberedMatches.length > 1) {
    sections = numberedMatches.map((match, index) => {
      const start = (match.index ?? 0) + match[0].length;
      const end = index + 1 < numberedMatches.length
        ? (numberedMatches[index + 1].index ?? normalized.length)
        : normalized.length;
      return normalized.slice(start, end).trim();
    });
  } else {
    sections = normalized
      .split(/(?:^|\n)\s*Soal\s*[:.)-]?\s*(?=\S)/im)
      .filter((section) => section.trim());
  }
  if (!sections.length && normalized.trim()) sections.push(normalized.trim());
  const questions = [];
  const errors = [];
  sections.forEach((section, index) => {
    const item = {
      academicYear: "2026/2027",
      gradeLevel: "XI",
      chapter: "Bilangan Kuantum",
      difficulty: "sedang",
      type: "multiple_choice",
      prompt: "",
      answerKey: "",
      explanation: "",
      options: [],
    };
    let activeOption = null;
    const sectionLines = section
      .replace(/\s+(?=[A-E][.)]\s+)/g, "\n")
      .replace(/\s+(?=(?:Kunci|Jawaban)(?:\s+Jawaban)?\s*[:=-]?\s*[A-E]\b)/gi, "\n")
      .split(/\r?\n/)
      .filter((line) => line.trim());
    for (const rawLine of sectionLines) {
      let line = rawLine.trim();
      if (!line) continue;

      const keyLine = line.match(
        /^(?:Kunci(?:\s+Jawaban)?|Jawaban(?:\s+Kunci)?|Jawaban)\s*[:=-]?\s*([A-E])\b/i,
      );
      if (keyLine) {
        item.answerKey = keyLine[1].toUpperCase();
        activeOption = null;
        continue;
      }

      const option = line.match(/^([A-E])(?:[.)]\s*|\s*[:=-]\s*)(.*)$/i);
      if (option) {
        const label = option[1].toUpperCase();
        let content = option[2].trim();
        const optionInlineKey = content.match(
          /(?:^|[-—,:;.\s])(?:Kunci(?:\s+Jawaban)?|Jawaban(?:\s+Kunci)?|Jawaban)\s*[:=-]?\s*([A-E])\b/i,
        );
        if (optionInlineKey) {
          item.answerKey = optionInlineKey[1].toUpperCase();
          content = content
            .replace(/(?:[-—,:;.\s])?(?:Kunci(?:\s+Jawaban)?|Jawaban(?:\s+Kunci)?|Jawaban)\s*[:=-]?\s*[A-E]\b/i, "")
            .trim();
        }
        activeOption = item.options.find((value) => value.label === label);
        if (!activeOption) {
          activeOption = { label, content, isCorrect: false };
          item.options.push(activeOption);
        } else {
          activeOption.content = content;
        }
        continue;
      }
      if (activeOption) activeOption.content += `${activeOption.content ? "\n" : ""}${line}`;
      else item.prompt += `${item.prompt ? "\n" : ""}${line}`;
    }
    item.options.sort((left, right) => left.label.localeCompare(right.label));
    item.options.forEach((option) => { option.isCorrect = option.label === item.answerKey; });
    const missing = [];
    if (item.prompt.length < 10) missing.push("pertanyaan");
    if (!["A", "B", "C", "D", "E"].every((label) => item.options.some((option) => option.label === label && option.content))) missing.push("opsi A-E");
    if (!item.answerKey || !item.options.some((option) => option.label === item.answerKey)) missing.push("kunci jawaban");
    if (missing.length) errors.push(`Soal ${index + 1}: lengkapi ${missing.join(", ")}.`);
    questions.push(item);
  });
  if (questions.length > 100) errors.push("Impor dibatasi maksimal 100 soal sekali unggah.");
  return { questions, errors };
}
