import assert from "node:assert/strict";
import test from "node:test";
import {
  mapImportedQuestionsToExamDraft,
  parseImportedQuestions,
} from "./question-import.js";

test("keeps numbered reaction steps inside one question", () => {
  const text = `24. Perhatikan reaksi berikut:
1) H2C=CH2 + H2 -> H3C-CH3
2) CH4 + Cl2 -> CH3Cl + HCl
3) H3C-CH3 -> H2C=CH2 + H2
4) CH4 + 2O2 -> CO2 + 2H2O
Urutan jenis reaksinya adalah ...
A. Eliminasi, substitusi, adisi, pembakaran
B. Eliminasi, adisi, substitusi, pembakaran
C. Adisi, eliminasi, substitusi, pembakaran
D. Adisi, substitusi, eliminasi, oksidasi
E. Adisi, substitusi, eliminasi, substitusi
Kunci: D`;

  const { questions, errors } = parseImportedQuestions(text);

  assert.deepEqual(errors, []);
  assert.equal(questions.length, 1);
  assert.match(questions[0].prompt, /1\) H2C=CH2/);
  assert.match(questions[0].prompt, /4\) CH4 \+ 2O2/);
  assert.equal(questions[0].options.length, 5);
  assert.equal(questions[0].options.find((option) => option.label === "D").isCorrect, true);
});

test("still separates consecutive questions marked with periods", () => {
  const text = `1. Pertanyaan pertama dengan langkah:
1) Langkah satu
2) Langkah dua
A. Pilihan satu
B. Pilihan dua
C. Pilihan tiga
D. Pilihan empat
E. Pilihan lima
Kunci: A
2. Pertanyaan kedua
A. Pilihan satu
B. Pilihan dua
C. Pilihan tiga
D. Pilihan empat
E. Pilihan lima
Kunci: B`;

  const { questions, errors } = parseImportedQuestions(text);

  assert.deepEqual(errors, []);
  assert.equal(questions.length, 2);
  assert.match(questions[0].prompt, /2\) Langkah dua/);
  assert.equal(questions[1].answerKey, "B");
});

test("maps imported multiple-choice questions into the exam wizard format", () => {
  const { questions } = parseImportedQuestions(`24. Perhatikan reaksi berikut:
1) H2C=CH2 + H2 -> H3C-CH3
A. Pilihan satu
B. Pilihan dua
C. Pilihan tiga
D. Pilihan empat
E. Pilihan lima
Kunci: D`);

  assert.deepEqual(mapImportedQuestionsToExamDraft(questions), [{
    type: "multiple_choice",
    prompt: "24. Perhatikan reaksi berikut: 1) H2C=CH2 + H2 -> H3C-CH3",
    options: ["Pilihan satu", "Pilihan dua", "Pilihan tiga", "Pilihan empat", "Pilihan lima"],
    correctOption: "D",
    answerKey: "",
    points: 1,
  }]);
});
