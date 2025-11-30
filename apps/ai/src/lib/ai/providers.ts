import { gateway } from "@ai-sdk/gateway";
import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from "ai";
import { isTestEnvironment } from "../constants";

export const myProvider = isTestEnvironment
  ? (() => {
      const {
        artifactModel,
        chatModel,
        reasoningModel,
        titleModel,
      } = require("./models.mock");
      return customProvider({
        languageModels: {
          "chat-model": chatModel,
          "chat-model-reasoning": reasoningModel,
          "title-model": titleModel,
          "artifact-model": artifactModel,
        },
      });
    })()
  : customProvider({
      languageModels: {
        "chat-model": gateway.languageModel("xai/grok-2-vision-1212"),
        "chat-model-reasoning": wrapLanguageModel({
          model: gateway.languageModel("xai/grok-3-mini"),
          middleware: extractReasoningMiddleware({ tagName: "think" }),
        }),
        "title-model": gateway.languageModel("xai/grok-2-1212"),
        "artifact-model": gateway.languageModel("xai/grok-2-1212"),
      },
    });

// Embedding model for RAG
// Use Gateway's textEmbeddingModel() to access OpenAI embeddings via the same Gateway authentication
// This ensures embeddings use the same authentication mechanism as language models
let _embeddingModel: any = null;
let _embeddingModelError: string | null = null;

function createEmbeddingModel(): any {
  if (isTestEnvironment) {
    return null;
  }

  // Return cached model if available
  if (_embeddingModel !== null && _embeddingModel !== undefined) {
    return _embeddingModel;
  }

  // Return null if we already know there's an error
  if (_embeddingModelError) {
    return null;
  }

  // Check if we're in a server environment (Node.js)
  if (typeof window !== "undefined") {
    // Client-side: return null (embedding model only available server-side)
    return null;
  }

  try {
    // Use Gateway's textEmbeddingModel() method to create the embedding model
    // This uses the same Gateway authentication as language models (no OPENAI_API_KEY needed)
    // Model ID format: "openai/text-embedding-3-small"
    _embeddingModel = gateway.textEmbeddingModel("openai/text-embedding-3-small");
    return _embeddingModel;
  } catch (error: any) {
    // Store error message for better error reporting
    const errorMessage = error?.message || "Unknown error";
    _embeddingModelError = `Failed to create embedding model via Gateway: ${errorMessage}`;
    console.error(`[providers] ${_embeddingModelError}`);
    return null;
  }
}

// Get embedding model with error information
export function getEmbeddingModel() {
  const model = createEmbeddingModel();
  return { model, error: _embeddingModelError };
}
