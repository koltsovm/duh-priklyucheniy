# 🏍️ «Дух приключений»

MVP-сервис для публикации маршрутов мотопутешествий. Пользователи регистрируются,
создают маршруты в личном кабинете — те сразу публикуются в общий каталог
(self-publish). На старте маршрут — это текст, метаданные (сложность, регион,
дистанция, дни), точки-остановки и фото. Модель данных уже закладывает координаты
точек (lat/lng) — это фундамент для будущей интеграции Yandex Maps.

## Стек

| Компонент | Технологии |
|---|---|
| Backend | Node.js 20+, Express, TypeScript |
| Frontend | Next.js 14 (App Router, SSR/ISR), React 18 |
| БД в dev | SQLite (не требует установки) |
| БД в prod | PostgreSQL (переключение — одна строка в схеме Prisma) |
| ORM | Prisma (миграции, типы) |
| Контракт API | `@duh/shared` — zod-схемы + TS-типы, общие для web и api |
| Аутентификация | JWT access (15 мин) + refresh в httpOnly-cookie с ротацией |
| Фото | Multer → диск (`uploads/`); в prod — S3/R2/MinIO |
| Пакеты | npm workspaces (монорепозиторий) |

## Структура

```
duh-priklyucheniy/
├── apps/
│   ├── api/                 # Express API (порт 4000)
│   │   ├── prisma/         # схема БД + миграции + seed
│   │   └── src/
│   │       ├── config/     # env (zod)
│   │       ├── db/         # клиент Prisma
│   │       ├── lib/        # jwt, cookies, slugify, ошибки
│   │       ├── middleware/ # auth, validate, upload, rate-limit, errors
│   │       └── modules/    # auth, routes (feature-модули)
│   └── web/           # Next.js (порт 3000)
│       └── src/
│           ├── app/        # страницы (App Router)
│           ├── components/ # RouteCard, RouteForm...
│           └── lib/        # клиент/сервер API-биндинг
└── packages/
    └── shared/        # zod-схемы и типы DTO (контракт API)
```

## Быстрый старт (dev)

Требуется [Node.js ≥ 20](https://nodejs.org). База SQLite — без установки.

```bash
# 1. Зависимости (в корне монорепозитория)
npm install

# 2. Переменные окружения
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.local.example apps/web/.env.local
#   Сгенерируйте свои JWT_ACCESS_SECRET / JWT_REFRESH_SECRET (см. ниже)

# 3. База данных: миграция + демо-данные
npm run db:migrate     # применяется prisma/migrations
npm run db:seed -w @duh/api

# 4. Запуск: API :4000 + Web :3000
npm run dev
```

Открыть:
- Веб: <http://localhost:3000>
- API: <http://localhost:4000/api/v1/health>
- Prisma Studio (БД): `npm run db:studio -w @duh/api`

**Демо-аккаунт:** `demo@duh.ru` / `demo12345`

### Генерация секретов JWT

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```
Впишите результат в `apps/api/.env` в `JWT_ACCESS_SECRET` и `JWT_REFRESH_SECRET`.

## Переключение на PostgreSQL (для продакшена)

1. Установите Postgres или поднимите контейнер:

```bash
docker compose up -d db   # из корня репозитория
```

2. В `apps/api/prisma/schema.prisma` замените provider:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

3. В `apps/api/.env`: `DATABASE_URL="postgresql://duh:duh@localhost:5432/duh"`

4. Применяйте миграции и сид аналогично (`npm run db:migrate`, `npm run db:seed`).
   Миграции создаются один раз в момент эксплуатации; для коллектива
   применяйте `npm run db:deploy -w @duh/api`.

## API v1

| Метод | Путь | Описание |
|---|---|---|
| POST | `/auth/register` | Регистрация (email, пароль, имя) |
| POST | `/auth/login` | Вход → access-token + httpOnly refresh-cookie |
| POST | `/auth/refresh` | Ротация refresh-токена (cookie) → новый access |
| POST | `/auth/logout` | Отзыв текущей сессии |
| GET | `/auth/me` | Текущий пользователь 🔒 |
| GET | `/routes?page=&limit=&sort=&difficulty=&region=` | Публичный каталог |
| GET | `/routes/:slug` | Деталь маршрута (+счётчик просмотров) |
| GET | `/users/me/routes` | Мои маршруты 🔒 |
| POST | `/users/me/routes` | Создать маршрут 🔒 |
| GET | `/users/me/routes/:id` | Один мой маршрут 🔒 |
| PATCH | `/users/me/routes/:id` | Обновить (в т.ч. замена точек) 🔒 |
| DELETE | `/users/me/routes/:id` | Удалить 🔒 |
| POST | `/users/me/routes/:id/photos` | Загрузить фото (multipart, до 5) 🔒 |

🔒 — требует `Authorization: Bearer <accessToken>`.

## Скрипты

```bash
npm run dev          # API + Web одновременно
npm run build        # сборка shared → api → web
npm run typecheck    # TS-проверка всех пакетов
npm run db:migrate   # миграции
npm run db:seed -w @duh/api
```

## Дорожная карта масштабирования

1. **Карты**: Waypoint уже имеет lat/lng → подключить Yandex Maps (построение
   маршрута по точкам на клиенте, сохранение координат).
2. **Фотографии** перенести в S3/R2/MinIO и раздать через CDN (сейчас локальный диск).
3. **Модерация и роли**: статусы DRAFT/MODERATION уже в схеме; добавить
   админ-панель и workflow-статусы.
4. **Производительность**: Redis-кэш каталога, read-replica для Postgres,
   pgBouncer, ISR каталога.
5. **Нагрузка/разделение**: монолит модульный — выделять auth-, routes-, uploads-
   сервисы по мере роста (границы модулей уже прочерчены).
6. **Наблюдаемость**: pino → OpenTelemetry + Grafana; request-id; алерты.
7. **Безопасность**: обновить Next до v15+/т.д. (текущий Next 14.2 в зависимости
   имеет известные CVE-ish advisory, не влияющие на MVP, — обновить версию).

## Технические заметки

- **SQLite и enums**: Prisma не поддерживает enums на SQLite, поэтому
  `difficulty` и `status` хранятся как строки с валидацией на уровне zod
  (`@duh/shared`). Это не мешает продакшну на Postgres.
- **Refresh-сессии**: таблица `Session` хранит только SHA-256 refresh-токена,
  поддержка отзыв сессий и ротация.
- **Middleware Next.js** проверяет наличие refresh-cookie; авторизация каждого
  запроса API — всегда через токен.
- **Login без утечки паролей**: bcrypt, 10 rounds.