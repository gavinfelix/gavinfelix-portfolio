# Environment Variables Configuration

This document describes the required environment variables for the AI Assistant app.

## Required Environment Variables

### 1. OPENAI_API_KEY

**Required for**: RAG (Retrieval-Augmented Generation) functionality - document upload and embedding generation.

**How to get**:
1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Sign in or create an account
3. Create a new API key
4. Copy the key (starts with `sk-`)

**Example**:
```env
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 2. POSTGRES_URL

**Required for**: Database connection (Supabase PostgreSQL).

**How to get**:
1. Go to your Supabase project dashboard
2. Navigate to Settings > Database
3. Copy the connection string from "Connection string" section
4. Use the "URI" format

**Example**:
```env
POSTGRES_URL=postgresql://postgres.xxxxx:[YOUR-PASSWORD]@aws-0-us-west-1.pooler.supabase.com:6543/postgres
```

### 3. AUTH_SECRET

**Required for**: NextAuth JWT token encryption.

**How to generate**:
```bash
openssl rand -base64 32
```

Or use any random string generator.

**Example**:
```env
AUTH_SECRET=your-random-secret-string-at-least-32-characters-long
```

## Setup Instructions

1. **Create `.env.local` file** in the `apps/ai/` directory:
   ```bash
   cd apps/ai
   touch .env.local
   ```

2. **Add the environment variables**:
   ```env
   OPENAI_API_KEY=sk-your-actual-key-here
   POSTGRES_URL=postgresql://your-connection-string
   AUTH_SECRET=your-random-secret
   ```

3. **Restart the development server** for changes to take effect:
   ```bash
   pnpm dev
   ```

## For Production (Vercel)

Add these environment variables in your Vercel project settings:
1. Go to your project on Vercel
2. Navigate to Settings > Environment Variables
3. Add each variable with the appropriate value
4. Redeploy your application

## Troubleshooting

- **"OPENAI_API_KEY environment variable is not set"**: Make sure you've added the variable to `.env.local` and restarted the server.
- **Database connection errors**: Verify your `POSTGRES_URL` is correct and accessible.
- **Authentication errors**: Ensure `AUTH_SECRET` is set and consistent across deployments.

