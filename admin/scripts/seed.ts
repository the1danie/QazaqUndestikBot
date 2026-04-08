import * as fs from 'fs';
import * as path from 'path';
import * as mammoth from 'mammoth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ── Folder paths ──────────────────────────────────────────────
const EREЖЕ_DIR = '/Volumes/KINGSTON/Telegram/ереже';
const ZHATTYGHU_DIR = '/Volumes/KINGSTON/Telegram/жаттыгу';
const VIDEO_DIR = '/Volumes/KINGSTON/Telegram/видео';
const TEST_DIR = '/Volumes/KINGSTON/Telegram/тест';

// ── Helpers ───────────────────────────────────────────────────

function getDocxFiles(dir: string): string[] {
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.docx'))
    .sort()
    .map((f) => path.join(dir, f));
}

async function extractText(filePath: string): Promise<string> {
  const result = await mammoth.extractRawText({ path: filePath });
  return result.value.trim();
}

function basename(filePath: string): string {
  return path.basename(filePath, '.docx');
}

function extractUrl(text: string): string | null {
  const match = text.match(/https?:\/\/[^\s]+/);
  return match ? match[0] : null;
}

// Map Kazakh option letters to A/B/C
function kazakhToLetter(kz: string): 'A' | 'B' | 'C' | null {
  const map: Record<string, 'A' | 'B' | 'C'> = {
    А: 'A',
    Ә: 'B',
    Б: 'C',
  };
  return map[kz.trim()] ?? null;
}

// ── Parse тест file ───────────────────────────────────────────
// The file contains multiple test sections separated by headers like:
// "Үндестік заңы тақырыбына арналған тест тапсырмасы"
// Each section has numbered questions with А/Ә/Б options and an answer key.
// There are also non-test "тапсырмалар" sections - we skip those.

interface ParsedQuestion {
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  correctOption: string;
}

function parseTestFile(text: string): ParsedQuestion[] {
  const questions: ParsedQuestion[] = [];

  // Split into sections by "тест тапсырмасы" headers
  // We'll process line by line
  const lines = text.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);

  // Find answer key blocks: lines like "Дұрыс жауаптары:" followed by "1. А", "2. Ә" etc.
  // We need to pair questions with their answers.
  // Strategy:
  //   1. Find blocks delimited by "тест тапсырмасы" heading and "тапсырмалар" heading (or end)
  //   2. Within each block, find "Дұрыс жауаптары:" to get answers, then parse questions before it

  // Split text into test blocks (sections containing "тест тапсырмасы")
  // We'll use a regex to find test question sections
  const testSectionRegex = /тест тапсырмасы/gi;

  // Find indices of test section starts in `lines`
  const sectionStartIndices: number[] = [];
  for (let i = 0; i < lines.length; i++) {
    if (/тест тапсырмасы/i.test(lines[i])) {
      sectionStartIndices.push(i);
    }
  }

  // Also mark "тапсырмалар" section starts (non-test exercises) to know where test sections end
  const tasksStartIndices: number[] = [];
  for (let i = 0; i < lines.length; i++) {
    if (/арналған тапсырмалар$/i.test(lines[i])) {
      tasksStartIndices.push(i);
    }
  }

  for (const sectionStart of sectionStartIndices) {
    // Find end of this test section: next test section, tasks section, or end of file
    let sectionEnd = lines.length;
    for (const idx of [...sectionStartIndices, ...tasksStartIndices]) {
      if (idx > sectionStart && idx < sectionEnd) {
        sectionEnd = idx;
      }
    }

    const sectionLines = lines.slice(sectionStart, sectionEnd);

    // Find "Дұрыс жауаптары:" line
    const answerKeyIdx = sectionLines.findIndex((l) => /Дұрыс жауаптары/i.test(l));
    if (answerKeyIdx === -1) continue;

    // Parse answer key: lines after "Дұрыс жауаптары:" like "1. А", "2. Ә"
    const answers: Record<number, string> = {};
    for (let i = answerKeyIdx + 1; i < sectionLines.length; i++) {
      const m = sectionLines[i].match(/^(\d+)[\.\s]+([АӘБ])/);
      if (m) {
        const num = parseInt(m[1]);
        const letter = kazakhToLetter(m[2]);
        if (letter) answers[num] = letter;
      }
    }

    // Parse questions before "Дұрыс жауаптары:"
    const questionLines = sectionLines.slice(1, answerKeyIdx); // skip section header

    // Group lines into questions
    // A question starts with a number like "1." or "1 ."
    let currentQuestionNum: number | null = null;
    let currentQuestion: string[] = [];
    let currentOptions: string[] = [];
    let inOptions = false;

    const flushQuestion = () => {
      if (currentQuestionNum === null) return;
      if (currentOptions.length < 3) return;

      const optionTexts: string[] = currentOptions.slice(0, 3).map((o) =>
        o.replace(/^[АӘБ]\.\s*/, '').trim()
      );

      const correctLetter = answers[currentQuestionNum];
      if (!correctLetter) return;

      questions.push({
        question: currentQuestion.join(' ').trim(),
        optionA: optionTexts[0] || '',
        optionB: optionTexts[1] || '',
        optionC: optionTexts[2] || '',
        correctOption: correctLetter,
      });
    };

    for (const line of questionLines) {
      // Check if this is a new question number line
      const qMatch = line.match(/^(\d+)[.\s]+(.+)/);
      const optMatch = line.match(/^([АӘБ])[.\s]+(.+)/);

      if (qMatch && !optMatch) {
        // New question
        flushQuestion();
        currentQuestionNum = parseInt(qMatch[1]);
        currentQuestion = [qMatch[2]];
        currentOptions = [];
        inOptions = false;
      } else if (optMatch) {
        inOptions = true;
        currentOptions.push(line);
      } else if (inOptions && currentOptions.length > 0 && currentOptions.length < 3) {
        // continuation of option text (rare)
        currentOptions[currentOptions.length - 1] += ' ' + line;
      } else if (!inOptions && currentQuestion.length > 0) {
        // continuation of question text
        currentQuestion.push(line);
      }
    }
    flushQuestion();
  }

  return questions;
}

// ── Main ──────────────────────────────────────────────────────

async function main() {
  let theoryCount = 0;
  let taskCount = 0;
  let videoCount = 0;
  let testCount = 0;

  // 1. Theory (Ереже)
  console.log('\n=== Importing Theory (Ереже) ===');
  const erejeFiles = getDocxFiles(EREЖЕ_DIR);
  for (let i = 0; i < erejeFiles.length; i++) {
    const filePath = erejeFiles[i];
    const title = basename(filePath);
    const content = await extractText(filePath);
    await prisma.theory.upsert({
      where: { title },
      create: { title, content, order: i, published: true },
      update: { content, order: i, published: true },
    });
    console.log(`  [${i + 1}] ${title}`);
    theoryCount++;
  }

  // 2. Tasks (Жаттығу)
  console.log('\n=== Importing Tasks (Жаттығу) ===');
  const zhattyghuFiles = getDocxFiles(ZHATTYGHU_DIR);
  for (let i = 0; i < zhattyghuFiles.length; i++) {
    const filePath = zhattyghuFiles[i];
    const title = basename(filePath);
    const content = await extractText(filePath);
    await prisma.task.upsert({
      where: { title },
      create: { title, content, order: i, published: true },
      update: { content, order: i, published: true },
    });
    console.log(`  [${i + 1}] ${title}`);
    taskCount++;
  }

  // 3. Videos
  console.log('\n=== Importing Videos ===');
  const videoFiles = getDocxFiles(VIDEO_DIR);
  for (const filePath of videoFiles) {
    const title = basename(filePath);
    const text = await extractText(filePath);
    const url = extractUrl(text);
    if (!url) {
      console.log(`  SKIP ${title} — no URL found`);
      continue;
    }
    // Use text before URL as description (first sentence-ish)
    const description = text.replace(url, '').trim() || undefined;
    await prisma.video.upsert({
      where: { title },
      create: { title, url, description, published: true },
      update: { url, description, published: true },
    });
    console.log(`  ${title} → ${url}`);
    videoCount++;
  }

  // 4. Test Questions
  console.log('\n=== Importing Test Questions (Тест) ===');
  const testFiles = getDocxFiles(TEST_DIR);
  for (const filePath of testFiles) {
    const text = await extractText(filePath);
    const parsed = parseTestFile(text);
    console.log(`  Parsed ${parsed.length} questions from ${basename(filePath)}`);
    for (const q of parsed) {
      // Use question text as unique key
      await prisma.testQuestion.upsert({
        where: { question: q.question },
        create: {
          question: q.question,
          optionA: q.optionA,
          optionB: q.optionB,
          optionC: q.optionC,
          optionD: '—', // 3-option questions, placeholder for D
          correctOption: q.correctOption,
          published: true,
        },
        update: {
          optionA: q.optionA,
          optionB: q.optionB,
          optionC: q.optionC,
          optionD: '—',
          correctOption: q.correctOption,
          published: true,
        },
      });
      testCount++;
    }
  }

  console.log('\n=== Import Summary ===');
  console.log(`  Theory records:       ${theoryCount}`);
  console.log(`  Task records:         ${taskCount}`);
  console.log(`  Video records:        ${videoCount}`);
  console.log(`  TestQuestion records: ${testCount}`);
  console.log('Done.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
