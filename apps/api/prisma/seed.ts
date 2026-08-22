/**
 * Seed демо-данных для разработки:
 *   - тестовый пользователь demo@duh.ru / demo12345
 *   - несколько опубликованных маршрутов
 * Запуск: npm run db:seed -w @duh/api
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { slugify } from "../src/lib/slugify";

const prisma = new PrismaClient();
const routes = prisma.route;

const DEMO_ROUTES = [
  {
    title: "Чуйский тракт: Барнаул — Ташанта",
    description:
      "Легендарная трасса М-52 через Горный Алтай. 960 км асфальта, который меняет пейзажи от равнин до высокогорных перевалов. Обязательно сделать остановку на смотровой в урочище Калбак-Таш и попробовать чегемские лепёшки у торговок на перевалах. Дорога в основном хорошая, но в конце сезона бывают ямы после ремонтов.",
    difficulty: "medium",
    region: "Алтай",
    distanceKm: 962,
    durationDays: 4,
    waypoints: [
      { name: "Барнаул — старт", note: "Заправка и кофе у выезда на М52" },
      { name: "Бийск", note: "Мост через Бию, затяжная пробка в сезон" },
      { name: "Горно-Алтайск", note: "Последний крупный магазин и АЗС" },
      { name: "Семинский перевал", note: "Перевал до 1894 м, красивые виды" },
      { name: "Онгудай", note: "Обед в кафе у трассы" },
      { name: "Улаган / пер. Чике-Таман", note: "Самый живописный участок" },
      { name: "Акт-Ерік боршаск", note: "Заправка 100 км после Онгудая" },
      { name: "Кош-Агач — финиш", note: "Ночлег в гостинице или гестхаусе" },
      { name: "Ташанта — погранпереход", note: "Финал дороги, Монголия за рекой" },
    ],
  },
  {
    title: "Кольцо Байкала на эндуро: от Листвянки до Ольхона",
    description:
      "Приключенческий трек по восточной кольцевой дороге. Часть пути — гравий и бродейние реки, поэтому нужен эндуро и кейсы. Неделя без спешки: рыбацкие деревеньки, кемпинги на берегу, в сезон — ледокол-туризм. Уровень сложности средний, отлично для первого большие путешествия на эндуро.",
    difficulty: "hard",
    region: "Байкал, Иркутская область",
    distanceKm: 1540,
    durationDays: 9,
    waypoints: [
      { name: "Иркутск", note: "Старт и магазины" },
      { name: "Листвянка", note: "Порт, музей Байкала, обед" },
      { name: "Большое Глазунское", note: "Пляж и ночёвка" },
      { name: "Большой Голоустное", note: "Ориентир для фото" },
      { name: "Песча бухта", note: "Только конец лета" },
      { name: "Микрорайон", note: "Кемпинг" },
      { name: "Северобайкальск — финиш", note: "Ледокол и баня" },
    ],
  },
  {
    title: "Кавказ 360: Майкоп — Кисловодск через Хребет",
    description:
      "Панорамный маршрут по предгорьям Кавказа: от цветущих степей до горных перевалов за 5 дней. Дороги серпантинные, хвойные и очень красивые. По пути — минеральные источники, местная кухня и потрясающие виды. Нужен опыт: серпантины и дождевые участки на перевалах.",
    difficulty: "extreme",
    region: "Кавказ",
    distanceKm: 830,
    durationDays: 5,
    waypoints: [
      { name: "Майкоп", note: "Сборная точка" },
      { name: "Перевал Азиш-Тау", note: "Лавочка с мёдом" },
      { name: "Лаго-Наки", note: "Обзорная площадка" },
      { name: "Гузерипль", note: "Кафе и заправка" },
      { name: "Хаджох (Каменномостский)", note: "Тисо-самшитовая роща" },
      { name: "Кисловодск — финиш", note: "Нарзанная галерея" },
    ],
  },
  {
    title: "Летняя Карелия: Сортавала — Рускеала — Путерецк",
    description:
      "Отступая от шума мегаполисов, — дорога на северо-запад: озёра, леса, глушь. Асфальт хороший до Рускеалы, дальше — смешанные участки. Комаров много — берите сетку. Кемпинги на каждом озере, но в сезон лучше бронировать турбазы заранее.",
    difficulty: "easy",
    region: "Карелия",
    distanceKm: 460,
    durationDays: 3,
    waypoints: [
      { name: "Сортавала", note: "Старт, кофе у вокзала" },
      { name: "Рускеала", note: "Горный парк, каньон" },
      { name: "Ладожские шхеры", note: "Смотровая над озером" },
      { name: "Путерецк — финиш", note: "Берег Ладоги, кемпинг" },
    ],
  },
];

async function main() {
  const passwordHash = await bcrypt.hash("demo12345", 10);
  const user = await prisma.user.upsert({
    where: { email: "demo@duh.ru" },
    update: {},
    create: { email: "demo@duh.ru", passwordHash, name: "Демо Байкер" },
  });

  for (const [index, item] of DEMO_ROUTES.entries()) {
    const slug = await uniqueSlug(item.title);
    await prisma.route.upsert({
      where: { slug },
      update: {},
      create: {
        slug,
        authorId: user.id,
        title: item.title,
        description: item.description,
        difficulty: item.difficulty,
        region: item.region,
        distanceKm: item.distanceKm,
        durationDays: item.durationDays,
        status: "PUBLISHED",
        viewCount: Math.floor(Math.random() * 500) + 20,
        publishedAt: new Date(Date.now() - index * 24 * 60 * 60 * 1000),
        waypoints: {
          create: item.waypoints.map((w, i) => ({ order: i, name: w.name, note: w.note ?? null })),
        },
      },
    });
  }

  console.log(`✅ Seed завершён: demo@duh.ru / demo12345, маршрутов: ${DEMO_ROUTES.length}`);
}

async function uniqueSlug(title: string): Promise<string> {
  const base = slugify(title);
  let slug = base;
  let i = 2;
  while (await routes.findUnique({ where: { slug } })) {
    slug = `${base}-${i++}`;
  }
  return slug;
}

main()
  .catch((err) => {
    console.error("❌ Seed failed:", err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());