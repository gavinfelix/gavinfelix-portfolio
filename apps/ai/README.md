This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

### Environment Variables

Before running the development server, you need to configure the required environment variables.

1. Copy the example environment file:
   ```bash
   cp .env.example .env.local
   ```

2. Update `.env.local` with your actual values:

   - **OPENAI_API_KEY**: Required for RAG (Retrieval-Augmented Generation) functionality. Get your API key from [OpenAI Platform](https://platform.openai.com/api-keys).
   - **POSTGRES_URL**: Your Supabase PostgreSQL connection URL.
   - **AUTH_SECRET**: A random string for NextAuth JWT encryption. Generate one for production.

Example `.env.local`:
```env
OPENAI_API_KEY=sk-your-actual-openai-api-key
POSTGRES_URL=postgresql://user:password@host:port/database
AUTH_SECRET=your-random-secret-string
```

**Note**: The `.env.local` file is git-ignored and should not be committed to version control.

### Run the Development Server

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
