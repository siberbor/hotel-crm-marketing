# 🚀 Deploy to Railway

## Quick Deploy (Recommended)

1. Go to [railway.app](https://railway.app)
2. Login with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select `siberbor/hotel-crm-marketing`
5. Railway автоматически определит Next.js

## Environment Variables

Add these in Railway dashboard (Project → Variables):

```env
DATABASE_URL=postgresql://user:password@host:5432/hotel_crm
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long
JWT_REFRESH_SECRET=your-refresh-secret-key-minimum-32-chars
REDIS_URL=redis://host:6379
NODE_ENV=production
```

## PostgreSQL Database

1. In Railway dashboard, click "New" → "Database" → "PostgreSQL"
2. Copy the connection string to `DATABASE_URL`
3. Run migrations: `railway run npm run db:migrate`
4. Seed data: `railway run npm run db:seed`

## Redis (for BullMQ)

1. Add plugin: "New" → "Database" → "Redis"
2. Copy `REDIS_URL`

## Build & Deploy

Railway автоматически:

- Установит dependencies (`npm install`)
- Построит приложение (`npm run build`)
- Запустит на порту 3000

## Local Development with Docker

```bash
docker-compose up -d
```

Откроется:

- App: http://localhost:3000
- PostgreSQL: localhost:5432
- Redis: localhost:6379

## Troubleshooting

### Build fails

```bash
railway logs
```

### Database connection error

Проверьте `DATABASE_URL` формат:

```
postgresql://username:password@hostname:port/database
```

### Need to re-deploy

```bash
railway up
```
