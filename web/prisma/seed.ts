/* Seed BarnBound with the 11 Northern Colorado launch partners and sample
   listings (ported from the original static prototype's data.js).
   Idempotent: businesses are upserted by id; demo sellers + their listings
   are reset on each run. */
import "dotenv/config";
import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

type ListingType = "HORSE" | "TACK" | "EQUIPMENT" | "TRAILER" | "CLOTHING" | "OTHER";

const BUSINESSES = [
  { id: 1, name: "JAX Outdoor Gear, Farm & Ranch", url: "https://jaxgoods.com/", category: "Retail", city: "Fort Collins, CO", lat: 40.5956, lng: -105.0776, image: "/businesses/1-jax.svg", emoji: "🛍️", rating: 4.8, reviewsCount: 312, tags: ["Ranch Supply", "Livestock Feed", "Western Wear", "Outdoor Gear"], description: "Northern Colorado institution combining farm and ranch supplies, livestock feed, and outdoor gear under one roof." },
  { id: 2, name: "Murdoch's Ranch & Home Supply", url: "https://www.murdochs.com/", category: "Retail", city: "Fort Collins, CO", lat: 40.5366, lng: -105.0791, image: "/businesses/2-murdochs.png", emoji: "🤠", rating: 4.7, reviewsCount: 248, tags: ["Ranch Supply", "Western Wear", "Feed & Tack", "Livestock Equipment"], description: "Regional ranch-and-home retailer carrying tack, feed, fencing, livestock equipment, western wear, and power equipment." },
  { id: 3, name: "LeClair Equine", url: "https://leclairequine.com/", category: "Veterinary", city: "Berthoud, CO", lat: 40.3083, lng: -105.0811, image: "/businesses/3-leclair.jpg", emoji: "🩺", rating: 4.9, reviewsCount: 64, tags: ["Ambulatory Vet", "Sports Medicine", "Dentistry", "Lameness"], description: "Berthoud-based equine veterinary practice offering ambulatory field service and haul-in clinic care." },
  { id: 4, name: "Bomgaars", url: "https://www.bomgaars.com/", category: "Retail", city: "Fort Morgan, CO", lat: 40.2485, lng: -103.8013, image: "/businesses/4-bomgaars.png", emoji: "🛍️", rating: 4.6, reviewsCount: 187, tags: ["Farm & Ranch", "Livestock Supply", "Hardware", "Power Equipment"], description: "Regional farm and ranch retailer serving rural communities across Colorado." },
  { id: 5, name: "Tractor Supply Co.", url: "https://www.tractorsupply.com/", category: "Retail", city: "Loveland, CO", lat: 40.408, lng: -105.058, image: "/businesses/5-tractorsupply.jpg", emoji: "🚜", rating: 4.5, reviewsCount: 421, tags: ["Livestock Feed", "Fencing", "Tack Basics", "Farm Supply"], description: "The nation's largest rural lifestyle retailer — horse feed, hay, fencing, stall supplies, tack basics, and animal health products." },
  { id: 6, name: "The Latigo Lariat", url: "https://latigolariat.com/", category: "Feed & Tack", city: "Loveland, CO", lat: 40.3914, lng: -105.0749, image: "/businesses/6-latigo.jpg", emoji: "🤠", rating: 4.9, reviewsCount: 89, tags: ["Western Tack", "Saddles", "Ropes", "Consignment"], description: "Loveland western tack shop with ~250 saddles in stock — roping, barrel, and pleasure rigs." },
  { id: 7, name: "Happy Horse Tack Shop", url: "https://www.happyhorsetack.com/", category: "Feed & Tack", city: "Fort Collins, CO", lat: 40.565, lng: -105.043, image: "/businesses/7-happyhorse.png", emoji: "🎠", rating: 4.8, reviewsCount: 134, tags: ["English Tack", "Western Tack", "Consignment", "Saddle Fitting"], description: "Full-service Northern Colorado tack shop carrying both English and Western gear, plus saddle fitting services." },
  { id: 8, name: "Gargot Farms Equestrian Center", url: "https://www.gargotfarms.com/", category: "Boarding", city: "Berthoud, CO", lat: 40.3165, lng: -105.064, image: "/businesses/8-gargot.jpg", emoji: "🏇", rating: 4.8, reviewsCount: 42, tags: ["Boarding", "Lessons", "Pony Camp", "Youth Programs"], description: "Berthoud-based facility offering horse boarding, riding lessons, and youth pony camp programs." },
  { id: 9, name: "Apollo Equestrian LLC", url: "https://www.apolloequestrianllc.com/", category: "Training", city: "Fort Collins, CO", lat: 40.602, lng: -105.032, image: "/businesses/9-apollo.jpg", emoji: "🎠", rating: 4.9, reviewsCount: 37, tags: ["English Training", "Lessons", "Boarding", "Sales & Leasing"], description: "Fort Collins training barn founded in 2017 — lessons, professional training, boarding, leasing, and horse sales." },
  { id: 10, name: "Rosewood Equestrian Center", url: "https://www.rosewoodeqcenter.com/", category: "Training", city: "Loveland, CO", lat: 40.382, lng: -105.1095, image: "/businesses/10-rosewood.jpg", emoji: "🐴", rating: 4.8, reviewsCount: 51, tags: ["Riding Lessons", "Training", "Hay Sales", "Boarding"], description: "Family-owned 12-acre equestrian facility in southwest Loveland offering lessons, training, and hay sales." },
  { id: 11, name: "Oleo Acres Farrier Supply", url: "https://www.oleoacresfarriersupply.com/", category: "Farrier", city: "Berthoud, CO", lat: 40.3245, lng: -105.092, image: "/businesses/11-oleo.gif", emoji: "🔨", rating: 4.9, reviewsCount: 76, tags: ["Horseshoes", "Farrier Tools", "Forges & Anvils", "Hoof Care"], description: "Colorado-based farrier supply retailer serving equine professionals — horseshoes, nails, rasps, and blacksmith equipment." },
];

type SeedListing = {
  type: ListingType; title: string; price: number; city: string; emoji: string;
  featured: boolean; description: string;
  breed?: string; discipline?: string; age?: number; category?: string;
};

const LISTINGS: SeedListing[] = [
  { type: "HORSE", title: "8yr Quarter Horse Gelding — Ranch Ready", breed: "Quarter Horse", discipline: "Western / Ranch", age: 8, price: 12500, city: "Fort Collins, CO", emoji: "🐎", featured: true, description: "Solid trail and ranch horse. Been everywhere, done everything. Stands for vet and farrier." },
  { type: "HORSE", title: "6yr OTTB — Jumper Prospect", breed: "Thoroughbred", discipline: "Hunter/Jumper", age: 6, price: 18000, city: "Loveland, CO", emoji: "🏇", featured: true, description: "Off-track Thoroughbred, 3 years of retraining. Brave, scopey, jumps 3' courses." },
  { type: "TACK", title: 'Circle Y Barrel Racing Saddle — 15"', category: "Saddle", price: 1850, city: "Windsor, CO", emoji: "🤠", featured: false, description: "Barely used. Full silver, hand-tooled. Ready for the run." },
  { type: "HORSE", title: "12yr Paint Mare — Beginner Safe", breed: "Paint", discipline: "Trail / Lesson", age: 12, price: 6500, city: "Greeley, CO", emoji: "🐴", featured: true, description: "Kid-safe, husband-safe, packer. Will teach someone to ride." },
  { type: "TACK", title: 'Antares Signature Jump Saddle 17.5"', category: "Saddle", price: 3200, city: "Fort Collins, CO", emoji: "🎠", featured: false, description: "French-made jumping saddle, narrow tree, excellent condition." },
  { type: "TRAILER", title: "Featherlite 2-Horse Straight Load Trailer", category: "Trailer", price: 14500, city: "Wellington, CO", emoji: "🚛", featured: false, description: "2018 model. All-aluminum. Well maintained, new tires." },
  { type: "HORSE", title: "3yr Warmblood Filly — Dressage Prospect", breed: "Warmblood", discipline: "Dressage", age: 3, price: 25000, city: "Longmont, CO", emoji: "🐎", featured: true, description: "Imported bloodlines, started under saddle, incredible movement." },
  { type: "TACK", title: "Tucker Endurance Saddle — Wide Tree", category: "Saddle", price: 950, city: "Berthoud, CO", emoji: "🪑", featured: false, description: "Gently used. Perfect for long trail rides. Wide tree, soft seat." },
  { type: "EQUIPMENT", title: "Priefert Round Pen — 50ft, 6 Panels", category: "Equipment", price: 1600, city: "Fort Collins, CO", emoji: "🛠️", featured: false, description: "Like new. Heavy-duty 12ft panels. Disassembles for transport." },
  { type: "HORSE", title: "10yr Appaloosa Gelding — Trail Partner", breed: "Appaloosa", discipline: "Trail", age: 10, price: 8500, city: "Severance, CO", emoji: "🐴", featured: false, description: "Bombproof on the trail. Crosses water, no buck, no spook." },
  { type: "TACK", title: "Professionals Choice SMB Boots — Set of 4", category: "Boots/Wraps", price: 120, city: "Fort Collins, CO", emoji: "👢", featured: false, description: "Medium size. Hot pink. Lightly used." },
  { type: "HORSE", title: "5yr POA Pony Gelding — Kid Jumper", breed: "POA", discipline: "Hunter/Jumper", age: 5, price: 9500, city: "Fort Collins, CO", emoji: "🐴", featured: false, description: "Successful short stirrup pony. Small, brave, tidy jumper." },
  { type: "TRAILER", title: "4-Star 3-Horse Slant Load w/ Living Quarters", category: "Trailer", price: 38500, city: "Windsor, CO", emoji: "🚐", featured: true, description: "2020 4-Star aluminum slant. 8ft short wall living quarters — AC, dinette, queen bed. Clean title." },
  { type: "TRAILER", title: "Sundowner Charter 2-Horse Bumper Pull", category: "Trailer", price: 8900, city: "Loveland, CO", emoji: "🚛", featured: false, description: "2015 Sundowner Charter. Rubber floor mats, new tires last year, swing-out saddle rack." },
  { type: "CLOTHING", title: "Ariat Heritage Roughstock Boots — Men's 11D", category: "Boots", price: 225, city: "Fort Collins, CO", emoji: "👢", featured: true, description: "Worn twice. Full-grain leather, goodyear welt, western heel. Original box." },
  { type: "CLOTHING", title: "Kerrits Fleece Lined Full Seat Tights — Women's M", category: "Apparel", price: 65, city: "Fort Collins, CO", emoji: "🧥", featured: false, description: "Like new condition. Perfect for winter rides. Silicone full seat." },
  { type: "CLOTHING", title: "Carhartt Ranch Jacket — XL", category: "Apparel", price: 85, city: "Loveland, CO", emoji: "🧥", featured: false, description: "Heavy duck canvas, quilted lining. Some wear but plenty of life left." },
  { type: "OTHER", title: "Round Bale Feeder — Heavy Duty", category: "Barn Equipment", price: 350, city: "Wellington, CO", emoji: "🌾", featured: false, description: 'Galvanized steel, 96" diameter. No rust. Pick up only.' },
  { type: "OTHER", title: "Western Show Blanket Set — Navy & Silver", category: "Show Gear", price: 180, city: "Greeley, CO", emoji: "🎽", featured: false, description: "Matching Mayatex pad + headstall + breastcollar. Show-ready." },
  { type: "OTHER", title: "200 Bales — Grass/Alfalfa Mix Hay", category: "Hay & Feed", price: 18, city: "Berthoud, CO", emoji: "🌾", featured: false, description: "Per bale. 2026 cutting, good color, clean. Discount on pallet quantities." },
];

const DEMO_SELLERS = [
  { email: "sage@barnbound.test", name: "Sage Whitfield", location: "Fort Collins, CO", role: "MERCHANT" as const },
  { email: "cody@barnbound.test", name: "Cody Marsh", location: "Loveland, CO", role: "TRAINER" as const },
  { email: "dana@barnbound.test", name: "Dana Reyes", location: "Greeley, CO", role: "RIDER" as const },
];

async function main() {
  // 1) Businesses — upsert by stable integer id.
  for (const b of BUSINESSES) {
    await prisma.business.upsert({
      where: { id: b.id },
      update: { ...b, verified: true, featured: true },
      create: { ...b, verified: true, featured: true },
    });
  }
  // Seeding with explicit ids doesn't advance the identity sequence — fix it
  // so user-created businesses get fresh ids instead of colliding.
  await prisma.$executeRawUnsafe(
    `SELECT setval(pg_get_serial_sequence('"Business"', 'id'), (SELECT MAX(id) FROM "Business"))`,
  );
  console.log(`Seeded ${BUSINESSES.length} businesses.`);

  // 2) Demo sellers — shared password "password123".
  const passwordHash = await bcrypt.hash("password123", 10);
  const sellers = [];
  for (const s of DEMO_SELLERS) {
    const user = await prisma.user.upsert({
      where: { email: s.email },
      update: { name: s.name, location: s.location, role: s.role },
      create: { ...s, passwordHash },
    });
    sellers.push(user);
  }
  console.log(`Seeded ${sellers.length} demo sellers (password: password123).`);

  // 3) Listings — reset demo sellers' listings, then recreate.
  await prisma.listing.deleteMany({ where: { sellerId: { in: sellers.map((s) => s.id) } } });
  let i = 0;
  for (const l of LISTINGS) {
    const seller = sellers[i % sellers.length];
    i++;
    await prisma.listing.create({
      data: {
        type: l.type,
        title: l.title,
        priceCents: l.price * 100,
        city: l.city,
        description: l.description,
        emoji: l.emoji,
        breed: l.breed ?? null,
        discipline: l.discipline ?? null,
        age: l.age ?? null,
        category: l.category ?? null,
        verified: true,
        featured: l.featured,
        sellerId: seller.id,
      },
    });
  }
  console.log(`Seeded ${LISTINGS.length} listings.`);

  // 4) Community — seed only when empty so we never clobber user-created content.
  if ((await prisma.group.count()) === 0) {
    const groups = [
      { icon: "🤠", name: "Front Range Western Riders", description: "Western & ranch riders across the Front Range." },
      { icon: "🎠", name: "Larimer County Hunter/Jumper", description: "Hunter/jumper riders in Larimer County." },
      { icon: "🏇", name: "CSU Equestrian & Alumni", description: "CSU equestrian team, students, and alumni." },
      { icon: "🐎", name: "Northern Colorado Dressage", description: "Dressage enthusiasts across Northern Colorado." },
      { icon: "🏃", name: "Barrel Racers of NoCo", description: "Barrel racing community, jackpots, and tips." },
      { icon: "🌄", name: "Colorado Trail Riders", description: "Trail riding, camping, and conditioning." },
    ];
    for (const g of groups) {
      const group = await prisma.group.create({ data: g });
      for (const s of sellers) {
        await prisma.groupMembership.create({ data: { groupId: group.id, userId: s.id } });
      }
    }
    console.log(`Seeded ${groups.length} groups.`);
  }

  if ((await prisma.thread.count()) === 0) {
    const threads = [
      { icon: "❓", title: "Best winter blanket for a hard keeper?", category: "Horse Care", body: "My older gelding drops weight in winter — what blankets are you using?" },
      { icon: "🐴", title: "Recommendations for a reliable hauler to Texas?", category: "Transport", body: "Need to ship a horse to Texas next month. Who have you trusted?" },
      { icon: "🩺", title: "Anyone tried Equioxx long-term for an older horse?", category: "Health", body: "Vet suggested Equioxx for arthritis. Long-term experiences?" },
      { icon: "🎠", title: "Saddle fitting in Northern Colorado — who do you use?", category: "Tack", body: "Looking for a good independent saddle fitter near Fort Collins." },
      { icon: "🏆", title: "First barrel race — what should I bring?", category: "Competition", body: "Entering my first jackpot. What's on your must-bring list?" },
      { icon: "🌾", title: "Cutting back on alfalfa — what are you feeding?", category: "Nutrition", body: "Trying to reduce alfalfa. What balanced rations work for you?" },
    ];
    let ti = 0;
    for (const t of threads) {
      const author = sellers[ti % sellers.length];
      const thread = await prisma.thread.create({ data: { ...t, authorId: author.id } });
      if (ti < 2) {
        const replier = sellers[(ti + 1) % sellers.length];
        await prisma.reply.create({ data: { threadId: thread.id, authorId: replier.id, body: "Great question — following along!" } });
      }
      ti++;
    }
    console.log(`Seeded ${threads.length} threads.`);
  }

  if ((await prisma.event.count()) === 0) {
    const events = [
      { title: "Front Range Ranch Horse Clinic", date: "2026-11-08", location: "Poudre River Stables", details: "$150 · all levels", category: "Clinic" },
      { title: "Larimer County Saddle Club Show", date: "2026-11-15", location: "Loveland Fairgrounds", details: "All day", category: "Show" },
      { title: "BarnBound Meet & Greet — Fort Collins", date: "2026-11-22", location: "Happy Horse Tack Shop", details: "2pm", category: "Community" },
      { title: "CSU Equine Sciences Open House", date: "2026-12-06", location: "CSU Equine Center", details: "10am", category: "Education" },
      { title: "Winter Dressage Schooling Show", date: "2026-12-13", location: "Mountain View Arena", details: "All day", category: "Show" },
      { title: "Beginner Barrel Racing Clinic", date: "2027-01-10", location: "Soukup Stables", details: "$125", category: "Clinic" },
    ];
    let ei = 0;
    for (const e of events) {
      const event = await prisma.event.create({
        data: { title: e.title, startsAt: new Date(e.date), location: e.location, details: e.details, category: e.category },
      });
      if (ei < 2) await prisma.eventRsvp.create({ data: { eventId: event.id, userId: sellers[ei].id } });
      ei++;
    }
    console.log(`Seeded ${events.length} events.`);
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
    console.log("Seed complete.");
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
