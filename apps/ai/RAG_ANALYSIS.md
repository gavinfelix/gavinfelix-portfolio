# RAG Implementation Analysis

## Current AI SDK Configuration

### 1. Provider Setup (`lib/ai/providers.ts`)

The project uses **Vercel AI Gateway** via `@ai-sdk/gateway`:

```typescript
import { gateway } from "@ai-sdk/gateway";
import { customProvider } from "ai";

export const myProvider = customProvider({
  languageModels: {
    "chat-model": gateway.languageModel("xai/grok-2-vision-1212"),
    "chat-model-reasoning": gateway.languageModel("xai/grok-3-mini"),
    "title-model": gateway.languageModel("xai/grok-2-1212"),
    "artifact-model": gateway.languageModel("xai/grok-2-1212"),
  },
});
```

**Key Points:**
- Uses `@ai-sdk/gateway` package (version 1.0.40)
- Creates models via `gateway.languageModel(modelId)`
- Currently only configures **language models** (no embedding models)
- Models are accessed via `myProvider.languageModel(modelId)`

### 2. Chat API Usage (`app/(chat)/api/chat/route.ts`)

The chat API uses the AI SDK's `streamText` function:

```typescript
import { streamText } from "ai";
import { myProvider } from "@/lib/ai/providers";

// Inside the route handler:
const streamTextOptions = {
  model: myProvider.languageModel(effectiveModel),  // Uses gateway-based model
  system: finalSystemPrompt,
  messages: convertToModelMessages(uiMessages),
  temperature: effectiveTemperature,
  // ... other options
};

const result = streamText({ ...streamTextOptions });
```

**Key Points:**
- Uses `streamText` from `ai` package (version 5.0.26)
- Models are accessed through `myProvider.languageModel()`
- No direct OpenAI client usage in chat API

### 3. Current Embedding Implementation

**In RAG Upload API (`app/api/rag/upload/route.ts`):**
```typescript
async function generateEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.OPENAI_API_KEY;  // ❌ Direct OpenAI API key needed
  
  const response = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,  // ❌ Direct API call
    },
    body: JSON.stringify({
      model: "text-embedding-3-small",
      input: text,
      dimensions: 1536,
    }),
  });
  // ...
}
```

**In Chat API (`app/(chat)/api/chat/route.ts`):**
- Similar direct OpenAI API call for embeddings

## Analysis: Can We Use Existing Provider?

### Option 1: Use Vercel AI Gateway for Embeddings

**Question:** Does Vercel AI Gateway support embedding models?

**Answer:** Based on the current configuration:
- The `gateway` object only has `languageModel()` method visible
- No `embeddingModel()` or similar method in the current setup
- Vercel AI Gateway is primarily designed for language models

**However**, Vercel AI Gateway might support OpenAI embeddings through gateway. Let's check if we can use:
- `gateway.embeddingModel("openai/text-embedding-3-small")` (if supported)
- Or configure embedding models in `myProvider`

### Option 2: Add OpenAI Provider for Embeddings Only

The AI SDK supports OpenAI provider directly. We could:

1. Install `@ai-sdk/openai` package
2. Create an OpenAI provider specifically for embeddings
3. Use it alongside the existing gateway provider

```typescript
import { createOpenAI } from "@ai-sdk/openai";

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,  // Still need the key
});

// Use openai.embedding() for embeddings
```

### Option 3: Check if Gateway Supports OpenAI Embeddings

Vercel AI Gateway might proxy OpenAI embeddings if configured. We should check:
- Can we use `gateway.embeddingModel("openai/text-embedding-3-small")`?
- Or does gateway need to be configured differently?

## Recommendation

Since your project already uses Vercel AI Gateway for language models, the **cleanest approach** would be:

1. **Check if Vercel AI Gateway supports embeddings** - If yes, use `gateway.embeddingModel()`
2. **If not**, add `@ai-sdk/openai` as a separate provider for embeddings only
3. **Keep using gateway** for language models (current setup)
4. **Use OpenAI provider** specifically for embeddings

This maintains consistency with the AI SDK ecosystem while keeping language models through gateway.

## Next Steps

1. Verify if `gateway.embeddingModel()` exists
2. If not, install and configure `@ai-sdk/openai` for embeddings
3. Update both RAG upload and chat APIs to use the SDK approach instead of raw fetch calls

