'use strict';

const fs = require('fs');
const path = require('path');
const mammoth = require('mammoth');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// ── Folder paths ──────────────────────────────────────────────
const EREЖЕ_DIR = '/Volumes/KINGSTON/Telegram/ереже';
const ZHATTYGHU_DIR = '/Volumes/KINGSTON/Telegram/жаттыгу';
const VIDEO_DIR = '/Volumes/KINGSTON/Telegram/видео';
const TEST_DIR = '/Volumes/KINGSTON/Telegram/тест';

// ── Helpers ───────────────────────────────────────────────────

function getDocxFiles(dir) {
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.docx'))
    .sort()
    .map((f) => path.join(dir, f));
}

async function extractText(filePath) {
  const result = await mammoth.extractRawText({ path: filePath });
  return result.value.trim();
}

function basename(filePath) {
  return path.basename(filePath, '.docx');
}

function extractUrl(text) {
  const match = text.match(/https?:\/\/[^\s]+/);
  return match ? match[0] : null;
}

// Map Kazakh option letters to A/B/C
function kazakhToLetter(kz) {
  const map = { 'А': 'A', 'Ә': 'B', 'Б': 'C' };
  return map[kz.trim()] || null;
}

// ── Parse тест file ───────────────────────────────────────────
function parseTestFile(text) {
  const questions = [];

  const lines = text.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);

  // Find indices of test section starts
  const sectionStartIndices = [];
  for (let i = 0; i < lines.length; i++) {
    if (/тест тапсырмасы/i.test(lines[i])) {
      sectionStartIndices.push(i);
    }
  }

  // Find "тапсырмалар" section starts to mark end of test sections
  const tasksStartIndices = [];
  for (let i = 0; i < lines.length; i++) {
    if (/арналған тапсырмалар$/i.test(lines[i])) {
      tasksStartIndices.push(i);
    }
  }

  for (const sectionStart of sectionStartIndices) {
    // Find end of this test section
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

    // Parse answer key
    const answers = {};
    for (let i = answerKeyIdx + 1; i < sectionLines.length; i++) {
      const m = sectionLines[i].match(/^(\d+)[\.\s]+([АӘБ])/);
      if (m) {
        const num = parseInt(m[1]);
        const letter = kazakhToLetter(m[2]);
        if (letter) answers[num] = letter;
      }
    }

    // Parse questions before "Дұрыс жауаптары:"
    const questionLines = sectionLines.slice(1, answerKeyIdx);

    let currentQuestionNum = null;
    let currentQuestion = [];
    let currentOptions = [];
    let inOptions = false;

    const flushQuestion = () => {
      if (currentQuestionNum === null) return;
      if (currentOptions.length < 3) return;

      const optionTexts = currentOptions.slice(0, 3).map((o) =>
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
      const qMatch = line.match(/^(\d+)[.\s]+(.+)/);
      const optMatch = line.match(/^([АӘБ])[.\s]+(.+)/);

      if (qMatch && !optMatch) {
        flushQuestion();
        currentQuestionNum = parseInt(qMatch[1]);
        currentQuestion = [qMatch[2]];
        currentOptions = [];
        inOptions = false;
      } else if (optMatch) {
        inOptions = true;
        currentOptions.push(line);
      } else if (inOptions && currentOptions.length > 0 && currentOptions.length < 3) {
        currentOptions[currentOptions.length - 1] += ' ' + line;
      } else if (!inOptions && currentQuestion.length > 0) {
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
    const description = text.replace(url, '').trim() || null;
    await prisma.video.upsert({
      where: { title },
      create: { title, url, description, published: true },
      update: { url, description, published: true },
    });
    console.log(`  ${title} -> ${url}`);
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
      await prisma.testQuestion.upsert({
        where: { question: q.question },
        create: {
          question: q.question,
          optionA: q.optionA,
          optionB: q.optionB,
          optionC: q.optionC,
          optionD: '\u2014', // em dash, placeholder for 4th option (questions only have 3)
          correctOption: q.correctOption,
          published: true,
        },
        update: {
          optionA: q.optionA,
          optionB: q.optionB,
          optionC: q.optionC,
          optionD: '\u2014',
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
