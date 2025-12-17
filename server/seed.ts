import { db } from "./db";
import { users, videos } from "@shared/schema";

async function seed() {
  console.log("🌱 Seeding database...");

  // Create initial user
  const [user] = await db
    .insert(users)
    .values({
      username: "Whiskers McGee",
      tagline: "Professional Napper & Treat Connoisseur",
      avatar: "/api/placeholder-cat.jpg",
      avatarColor: "#FF0055",
      walletBalance: 1250,
      totalViews: 125000,
    })
    .onConflictDoNothing()
    .returning();

  console.log("✅ Created user:", user.username);

  // Create sample videos
  const sampleVideos = [
    {
      userId: user.id,
      youtubeId: "J---aiyznGQ",
      title: "Keyboard Cat - The Original",
      description: "The legendary keyboard performance that started it all",
      type: "video",
      thumbnail: "https://i.ytimg.com/vi/J---aiyznGQ/hqdefault.jpg",
      views: 50000,
      earnings: 2500,
    },
    {
      userId: user.id,
      youtubeId: "jI4Ojgz-MSE",
      title: "Cat Wants Petting NOW",
      description: "When belly rubs are urgently required",
      type: "video",
      thumbnail: "https://i.ytimg.com/vi/jI4Ojgz-MSE/hqdefault.jpg",
      views: 35000,
      earnings: 1750,
    },
    {
      userId: user.id,
      youtubeId: "eX2qFMC8cFo",
      title: "My Cat From Hell - The Most Dangerous Cat",
      description: "Lux the cat takes over the house",
      type: "video",
      thumbnail: "https://i.ytimg.com/vi/eX2qFMC8cFo/hqdefault.jpg",
      views: 28000,
      earnings: 1400,
    },
    {
      userId: user.id,
      youtubeId: "nlYlNF30bVg",
      title: "Cat Slap Compilation",
      description: "Cats delivering swift justice",
      type: "short",
      thumbnail: "https://i.ytimg.com/vi/nlYlNF30bVg/hqdefault.jpg",
      views: 45000,
      earnings: 2250,
    },
    {
      userId: user.id,
      youtubeId: "0Bmhjf0rKe8",
      title: "Screaming Cat Meme",
      description: "The infamous table cat argument",
      type: "short",
      thumbnail: "https://i.ytimg.com/vi/0Bmhjf0rKe8/hqdefault.jpg",
      views: 62000,
      earnings: 3100,
    },
  ];

  for (const video of sampleVideos) {
    await db.insert(videos).values(video).onConflictDoNothing();
  }

  console.log(`✅ Created ${sampleVideos.length} sample videos`);
  console.log("🎉 Seeding complete!");
  process.exit(0);
}

seed().catch((error) => {
  console.error("❌ Seeding failed:", error);
  process.exit(1);
});
