# Samokat CRM

Прототип внутренней CRM-системы для управления самокатами и арендами.

Стек: **NestJS + TypeORM + PostgreSQL** на бэкенде, **React (Vite) + TypeScript + Ant Design** на фронтенде, real-time через **WebSocket (socket.io)**, всё упаковано в **Docker Compose**.

---

## Возможности

- **Аналитика (главная)** — счётчики самокатов по статусам, активные аренды, средний уровень заряда, всего клиентов. Обновляется в реальном времени.
- **Самокаты** — CRUD, фильтр по статусу, поиск по номеру/модели, диапазон заряда, таблица **и** карта (Leaflet) с маркерами, окрашенными по статусу. Клик по маркеру открывает редактирование.
- **Аренды** — создание (самокат → `in_use`), завершение (самокат → `available`), раздельные списки активных и завершённых аренд с длительностью.
- **Клиенты** — CRUD, поиск по имени/телефону.
- **Аутентификация** — JWT, защищённые роуты, seed-админ при первом старте.
- **Real-time** — WebSocket-шлюз пушит изменения самокатов/аренд/аналитики; фронт переподключается автоматически.

---

## Обоснование выбора стека

Backend **NestJS**. Модульная архитектура (модули/контроллеры/сервисы/DTO), DI, встроенный пайп валидации (`class-validator`), удобная интеграция TypeORM/WebSocket/JWT. Хорошо читается и масштабируется.
ORM **TypeORM**. Зрелый декораторный ORM, нативная интеграция с NestJS, поддержка pg-enum, транзакций и пессимистичных блокировок (используются при создании/завершении аренды).
БД **PostgreSQL**. Требование ТЗ; реляционная модель с `enum` для статусов и FK-связями.
Frontend **React + Vite + TS**. Быстрый dev-сервер, строгая типизация, модульность.
UI **Ant Design**. Богатый набор готовых компонентов (Table, Form, Modal, Statistic, Segmented) — идеально для табличных CRM-интерфейсов, минимум своей вёрстки.
Карта **react-leaflet + Leaflet**. Бесплатная OSM-тайловая карта без API-ключей, маркеры с кастомными иконками.
Auth **JWT (passport-jwt)**. Stateless-токены, простота, seed-админ из коробки.
Real-time **socket.io (NestJS Gateway)**. Надёжная двусторонняя связь с авто-переподключением, удобнее polling.
Инфра **Docker Compose**. Одна команда поднимает БД, backend и frontend.

---

### Доменная модель (PostgreSQL)

```
users        (id uuid PK, email unique, password_hash, name, role enum)
scooters     (id uuid PK, number unique, model, status enum,
              battery_level int, lat/lng numeric, created_at, updated_at)
customers    (id uuid PK, name, phone, created_at)
rentals      (id uuid PK, scooter_id FK, customer_id FK,
              started_at timestamptz, ended_at timestamptz null,
              status enum, created_at)
```

### Бизнес-инварианты

- Создать аренду можно только для самоката в статусе `available` — он переводится в `in_use` в той же транзакции (`pessimistic_write` lock защищает от гонки).
- Завершение аренды фиксирует `endedAt`, ставит `completed` и возвращает самокат в `available` (если он был `in_use`).

---

## Быстрый старт (Docker Compose)

> Требуется **Docker Desktop** (или Docker Engine + Compose v2).

```bash
# 1. Клонировать репозиторий
git clone <repo-url> samokat-rent
cd samokat-rent

# 2. (опционально) скопировать env и при желании поменять секреты
cp .env.example .env

# 3. Поднять всю систему
docker compose up --build
```

После старта:

- Frontend: **http://localhost:8080**
- Backend API: **http://localhost:3000/api**
- PostgreSQL: `localhost:5433` (user/pass/db из `.env`)

Вход: **admin@example.com / admin123** (создаётся автоматически при первом старте).

Остановить:

```bash
docker compose down            # без удаления данных
docker compose down -v         # с удалением тома БД (полный сброс)
```

---

## Локальная разработка (без Docker)

Удобно, когда нужно править код с hot-reload. БД можно поднять через Docker, а backend/frontend запускать напрямую.

### 1. PostgreSQL

```bash
docker compose up -d db          # поднимает только БД на localhost:5433
```

Или используйте любую локальную PostgreSQL 14+.

### 2. Backend

```bash
cd backend
cp ../.env.example .env          # при необходимости поправить POSTGRES_HOST=localhost
npm install
npm run start:dev                # http://localhost:3000/api
```

При первом старте создаются таблицы (`synchronize: true`) и заливаются демо-данные.

### 3. Frontend

```bash
cd frontend
npm install
npm run dev                      # http://localhost:5173
```

Vite проксирует `/api` и `/events` на `http://localhost:3000`, поэтому никаких отдельных настроек не нужно.

---

## Переменные окружения

| Переменная | По умолчанию | Описание |
|------------|--------------|----------|
| `POSTGRES_HOST/PORT/USER/PASSWORD/DB` | db / 5432 / samokat / samokat / samokat_rent | подключение к БД |
| `CORS_ORIGINS` | http://localhost:5173,http://localhost:4173 | разрешённые origin'ы (через запятую) |
| `JWT_SECRET` | super-secret-change-me | секрет подписи JWT (**поменяйте в проде!**) |
| `JWT_EXPIRES_IN` | 12h | срок жизни токена |
| `SEED_ADMIN_EMAIL/PASSWORD/NAME` | admin@example.com / admin123 / Admin | seed-админ |
| `SYNC_SCHEMA` | true | авто-создание таблиц (выключить в проде, использовать миграции) |
| `VITE_API_URL` | /api | base URL REST API для фронтенда |
| `VITE_WS_URL` | /events | URL WebSocket-шлюза |

---

## API (REST)

Базовый префикс — `/api`. Все эндпоинты, кроме `auth/login`, `auth/register`, требуют заголовок `Authorization: Bearer <token>`.

### Auth
| Метод | Путь | Описание |
|-------|------|----------|
| POST | `/api/auth/login` | вход, возвращает `{ accessToken, user }` |
| POST | `/api/auth/register` | регистрация |
| GET | `/api/auth/me` | текущий пользователь |

### Scooters
| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/api/scooters` | список; query: `status`, `q`, `minBattery`, `maxBattery` |
| GET | `/api/scooters/:id` | один самокат |
| POST | `/api/scooters` | создать |
| PATCH | `/api/scooters/:id` | обновить (частично) |
| DELETE | `/api/scooters/:id` | удалить |

### Customers
| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/api/customers` | список; query: `q` |
| POST | `/api/customers` | создать |
| PATCH | `/api/customers/:id` | обновить |
| DELETE | `/api/customers/:id` | удалить |

### Rentals
| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/api/rentals` | список; query: `status`, `page`, `pageSize` |
| POST | `/api/rentals` | создать аренду (самокат → `in_use`) |
| POST | `/api/rentals/:id/complete` | завершить аренду (самокат → `available`) |

### Analytics
| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/api/analytics/overview` | сводка для дашборда |

### WebSocket

Подключение: `ws://<host>/events` (namespace `events`).

События сервера:
- `scooter:changed` — `{ action: 'created'|'updated'|'deleted', scooter }`
- `rental:changed` — `{ action: 'created'|'completed', rental }`
- `analytics:changed` — `{}` (пересчитать аналитику)

---

## Примеры curl

```bash
# Вход
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@example.com","password":"admin123"}' \
  | python -c "import sys,json; print(json.load(sys.stdin)['accessToken'])")

# Список самокатов (только доступные)
curl -s http://localhost:3000/api/scooters?status=available \
  -H "Authorization: Bearer $TOKEN" | jq

# Создать самокат
curl -s -X POST http://localhost:3000/api/scooters \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"number":"SC-999","model":"Test","lat":55.75,"lng":37.61}' | jq

# Аналитика
curl -s http://localhost:3000/api/analytics/overview \
  -H "Authorization: Bearer $TOKEN" | jq
```

---

## Демо-данные

При первом старте (пустая БД) автоматически создаются:

- **1 админ:** `admin@example.com / admin123`
- **8 самокатов** (SC-001 … SC-008) с разными статусами, зарядом и координатами в центре Москвы
- **3 клиента** (Иван Петров, Анна Смирнова, Дмитрий Иванов)
- **1 активная аренда** (SC-003, начата 25 минут назад)

---

## Проверка качества кода

```bash
# Backend
cd backend && npm run typecheck && npm run build

# Frontend
cd frontend && npm run typecheck && npm run build
```

---