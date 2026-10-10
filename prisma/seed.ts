import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting zeroto1.academy database seed...");

  // Clear existing content tables safely
  await prisma.lessonProgress.deleteMany();
  await prisma.lessonStep.deleteMany();
  await prisma.lesson.deleteMany();
  await prisma.unit.deleteMany();
  await prisma.subject.deleteMany();

  // 1. Create Subjects
  const history = await prisma.subject.create({
    data: {
      slug: "history",
      name: "History",
      description: "Ranging from earliest civilizations to modern times.",
      color: "#e0a322",
      orderIndex: 1,
    },
  });

  const science = await prisma.subject.create({
    data: {
      slug: "science",
      name: "Science",
      description: "Explores everything from life sciences to outer space.",
      color: "#1fa7e1",
      orderIndex: 2,
    },
  });

  const art = await prisma.subject.create({
    data: {
      slug: "art",
      name: "Art",
      description: "Runs from art appreciation to music and theater.",
      color: "#3aaa4a",
      orderIndex: 3,
    },
  });

  console.log("✓ Created 3 subjects (History, Science, Art)");

  // 2. Create Units
  const unitEarlyHumans = await prisma.unit.create({
    data: {
      subjectId: history.id,
      slug: "early-humans",
      title: "Early Humans",
      description: "The journey from hunter-gatherers to toolmakers.",
      bannerImage: "/assets/local/history-units.webp",
      orderIndex: 1,
    },
  });

  const unitFirstCiv = await prisma.unit.create({
    data: {
      subjectId: history.id,
      slug: "first-civilizations",
      title: "First Civilizations",
      description: "Cities along rivers and the invention of writing.",
      bannerImage: "/assets/local/history-units.webp",
      orderIndex: 2,
    },
  });

  const unitLifeScience = await prisma.unit.create({
    data: {
      subjectId: science.id,
      slug: "life-science",
      title: "Life Science & Ecosystems",
      description: "How plants, animals, and living cells thrive.",
      bannerImage: "/assets/local/subject-cards.webp",
      orderIndex: 1,
    },
  });

  const unitPhysicsSpace = await prisma.unit.create({
    data: {
      subjectId: science.id,
      slug: "physics-and-space",
      title: "Physics & Space",
      description: "Light, forces, motion, and the universe beyond.",
      bannerImage: "/assets/local/subject-cards.webp",
      orderIndex: 2,
    },
  });

  const unitVisualArt = await prisma.unit.create({
    data: {
      subjectId: art.id,
      slug: "visual-arts",
      title: "Visual Arts & Masterpieces",
      description: "Color, perspective, and expressing human imagination.",
      bannerImage: "/assets/local/subject-cards.webp",
      orderIndex: 1,
    },
  });

  console.log("✓ Created 5 units across subjects");

  // Helper for generating standard 6-step flow
  function createSteps(lessonTitle: string, question: string) {
    return [
      {
        stepType: "HOOK",
        stepOrder: 1,
        content: JSON.stringify({
          text: `Imagine this: ${lessonTitle} completely changed how people think about ${question}.`,
          imagePrompt: `A vibrant illustration showing curiosity about ${lessonTitle}`,
        }),
      },
      {
        stepType: "VIDEO",
        stepOrder: 2,
        content: JSON.stringify({
          query: `${lessonTitle} educational for kids`,
          channelAllowlist: [
            "SciShow Kids",
            "CrashCourse Kids",
            "National Geographic Kids",
            "Khan Academy",
          ],
        }),
      },
      {
        stepType: "READ",
        stepOrder: 3,
        content: JSON.stringify({
          paragraphs: [
            `When we look closely at ${lessonTitle}, we discover patterns that explain why our world works the way it does.`,
            `Scientists and historians spent centuries gathering clues to answer this exact question: "${question}".`,
            `Now it's your turn to explore the evidence yourself!`,
          ],
        }),
      },
      {
        stepType: "ACTIVITY",
        stepOrder: 4,
        content: JSON.stringify({
          instruction: `Look closely at the diagrams and identify the primary clues that explain ${lessonTitle}.`,
          interactionType: "observe",
        }),
      },
      {
        stepType: "PRACTICE",
        stepOrder: 5,
        content: JSON.stringify({
          questions: [
            {
              prompt: `What is the key takeaway about ${lessonTitle}?`,
              choices: [
                `It follows consistent patterns and natural laws`,
                `It is completely random and cannot be studied`,
                `It only happened once in history`,
                `None of the above`,
              ],
              answerIndex: 0,
              explanation: `Great job! Everything in nature and history follows clear, discoverable patterns.`,
            },
          ],
        }),
      },
      {
        stepType: "DEEP_DIVE",
        stepOrder: 6,
        content: JSON.stringify({
          followUps: [
            `What surprised you the most about ${lessonTitle}?`,
            `If you could ask an expert one question, what would it be?`,
            `Can you find an example of this in your everyday life?`,
          ],
        }),
      },
    ];
  }

  // 3. Define 10 lessons
  const lessonData = [
    // Unit 1: Early Humans
    {
      unitId: unitEarlyHumans.id,
      slug: "caves-carvings-first-images",
      title: "Caves, Carvings, and First Images",
      bigQuestion: "Why did early humans paint on cave walls in total darkness?",
      byTheEnd: "You will be able to explain how early humans communicated without written alphabets.",
      bannerImage: "/assets/local/history-units.webp",
      isPreview: true,
      orderIndex: 1,
    },
    {
      unitId: unitEarlyHumans.id,
      slug: "fire-tools-and-survival",
      title: "Fire, Stone Tools, and Survival",
      bigQuestion: "How did controlling fire transform the human brain?",
      byTheEnd: "You will understand how cooking food and making flint tools allowed early humans to thrive.",
      bannerImage: "/assets/local/history-units.webp",
      isPreview: false,
      orderIndex: 2,
    },
    // Unit 2: First Civilizations
    {
      unitId: unitFirstCiv.id,
      slug: "rivers-mud-bricks-and-cities",
      title: "Rivers, Mud Bricks, and First Cities",
      bigQuestion: "Why did the first major civilizations all begin next to big rivers?",
      byTheEnd: "You will understand irrigation and how fertile river valleys supported large towns.",
      bannerImage: "/assets/local/history-units.webp",
      isPreview: false,
      orderIndex: 1,
    },
    {
      unitId: unitFirstCiv.id,
      slug: "invention-of-writing",
      title: "The Invention of Writing",
      bigQuestion: "How did people remember agreements before anyone wrote things down?",
      byTheEnd: "You will trace writing from clay tokens in Mesopotamia to hieroglyphs in ancient Egypt.",
      bannerImage: "/assets/local/history-units.webp",
      isPreview: false,
      orderIndex: 2,
    },
    // Unit 3: Life Science
    {
      unitId: unitLifeScience.id,
      slug: "plant-parts-work-together",
      title: "Plant Parts Work Together",
      bigQuestion: "How do roots and leaves drink sunlight and soil nutrients together?",
      byTheEnd: "You will explain how roots, stems, and leaves cooperate to keep plants alive.",
      bannerImage: "/assets/img/learn-home-ui.webp",
      isPreview: true,
      orderIndex: 1,
    },
    {
      unitId: unitLifeScience.id,
      slug: "how-whales-talk",
      title: "How Whales Talk Across Oceans",
      bigQuestion: "How can a whale song travel thousands of miles through seawater?",
      byTheEnd: "You will understand echolocation and underwater acoustic waves in marine biology.",
      bannerImage: "/assets/img/own-whale.jpg",
      isPreview: false,
      orderIndex: 2,
    },
    // Unit 4: Physics & Space
    {
      unitId: unitPhysicsSpace.id,
      slug: "light-travels-straight-lines",
      title: "Light Travels in Straight Lines",
      bigQuestion: "Why do shadows form behind opaque objects on sunny days?",
      byTheEnd: "You will demonstrate how light rays travel and how transparent, translucent, and opaque materials work.",
      bannerImage: "/assets/local/lesson-banner.webp",
      isPreview: true,
      orderIndex: 1,
    },
    {
      unitId: unitPhysicsSpace.id,
      slug: "moving-through-water",
      title: "Moving Through Water",
      bigQuestion: "What makes dolphins and sharks so fast underwater?",
      byTheEnd: "You will understand drag, streamlining, and hydrodynamic propulsion in aquatic animals.",
      bannerImage: "/assets/img/moving-through-water-lesson.webp",
      isPreview: false,
      orderIndex: 2,
    },
    // Unit 5: Visual Arts
    {
      unitId: unitVisualArt.id,
      slug: "patterns-color-and-symmetry",
      title: "Patterns, Color, and Symmetry",
      bigQuestion: "Why do human eyes find symmetrical patterns so satisfying?",
      byTheEnd: "You will identify color wheels, contrast, and rotational symmetry in classical art.",
      bannerImage: "/assets/local/subject-cards.webp",
      isPreview: false,
      orderIndex: 1,
    },
    {
      unitId: unitVisualArt.id,
      slug: "secret-patterns-in-music",
      title: "The Secret Patterns in Music",
      bigQuestion: "Why do certain note frequencies sound joyful while others sound tense?",
      byTheEnd: "You will understand harmony, tempo, and mathematical intervals in music composition.",
      bannerImage: "/assets/local/subject-cards.webp",
      isPreview: true,
      orderIndex: 2,
    },
  ];

  for (const l of lessonData) {
    const createdLesson = await prisma.lesson.create({
      data: {
        unitId: l.unitId,
        slug: l.slug,
        title: l.title,
        bigQuestion: l.bigQuestion,
        byTheEnd: l.byTheEnd,
        bannerImage: l.bannerImage,
        isPreview: l.isPreview,
        orderIndex: l.orderIndex,
        steps: {
          create: createSteps(l.title, l.bigQuestion),
        },
      },
    });
    console.log(`  ✓ Seeded lesson: ${createdLesson.title}`);
  }

  console.log("🎉 Database seeded successfully with 10 full 6-step lessons!");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
