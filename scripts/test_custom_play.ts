import { prisma } from '../src/lib/prisma';

async function main() {
  const lesson = await prisma.customLesson.findFirst({ orderBy: { createdAt: 'desc' } });
  if (!lesson) {
    console.log('No custom lesson found');
    return;
  }
  console.log('Testing custom lesson ID:', lesson.id);
  const res = await fetch(`http://localhost:3001/custom-lessons/${lesson.id}/play`);
  console.log('Custom Lesson Player HTTP status:', res.status);
  const html = await res.text();
  console.log('Contains Hook step:', html.includes('Hook'));
  console.log('Contains Lesson title:', html.includes(lesson.question) || html.includes('Curiosity') || html.includes('Whale'));
}

main().finally(() => prisma.$disconnect());
