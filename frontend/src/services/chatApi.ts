const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5000/api";

export interface ChatSource {
  path: string | null;
  language: string | null;
  startLine: number | null;
  endLine: number | null;
  score: number | null;
}

export interface ChatRequest {
  query: string;
  conversationId?: string;
  limit?: number;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ConversationSummary {
  conversationId: string;
  repositoryId: string;
  repositoryName: string;
  title: string;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface ConversationDetail extends ConversationSummary {
  messages: ChatMessage[];
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export interface StreamMetadata {
  conversationId: string;
  repositoryId: string;
}

export interface StreamCallbacks {
  onMetadata: (metadata: StreamMetadata) => void;
  onToken: (content: string) => void;
  onSources: (sources: ChatSource[]) => void;
  onDone: () => void;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      ...(options?.headers ?? {}),
      "Content-Type": "application/json",
    },
  });

  const result = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      result?.message ||
        result?.detail ||
        `Request failed (${response.status}).`,
    );
  }

  return result as T;
}

export const sendRepositoryMessage = async (
  repositoryId: string,
  input: ChatRequest,
) => {
  const result = await request<
    ApiResponse<{
      conversationId: string;
      repositoryId: string;
      answer: string;
      sources: ChatSource[];
    }>
  >(`/repositories/${encodeURIComponent(repositoryId)}/chat`, {
    method: "POST",
    body: JSON.stringify(input),
  });

  return result.data;
};

export const streamRepositoryMessage = async (
  repositoryId: string,
  input: ChatRequest,
  callbacks: StreamCallbacks,
): Promise<void> => {
  const response = await fetch(
    `${API_URL}/repositories/${encodeURIComponent(repositoryId)}/chat/stream`,
    {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Accept: "text/event-stream",
      },
      body: JSON.stringify({
        query: input.query,
        ...(input.conversationId
          ? { conversationId: input.conversationId }
          : {}),
        limit: input.limit ?? 5,
      }),
    },
  );

  if (!response.ok) {
    const result = await response.json().catch(() => null);

    throw new Error(
      result?.message ||
        result?.detail ||
        `Chat request failed (${response.status}).`,
    );
  }

  if (!response.body) {
    throw new Error("The server did not return a readable stream.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let completed = false;

  const processFrame = (frame: string) => {
    let event = "message";
    const dataLines: string[] = [];

    for (const line of frame.split(/\r?\n/)) {
      if (line.startsWith("event:")) {
        event = line.slice(6).trim();
      } else if (line.startsWith("data:")) {
        dataLines.push(line.slice(5).trimStart());
      }
    }

    if (dataLines.length === 0) return;

    const rawData = dataLines.join("\n");
    let data: Record<string, unknown>;

    try {
      data = JSON.parse(rawData);
    } catch {
      throw new Error("Received an invalid streaming event.");
    }

    switch (event) {
      case "metadata":
        callbacks.onMetadata(data as unknown as StreamMetadata);
        break;

      case "token":
        if (typeof data.content === "string") {
          callbacks.onToken(data.content);
        }
        break;

      case "sources":
        if (Array.isArray(data.sources)) {
          callbacks.onSources(data.sources as ChatSource[]);
        }
        break;

      case "done":
        completed = true;
        callbacks.onDone();
        break;

      case "error":
        throw new Error(
          typeof data.message === "string"
            ? data.message
            : "The AI service failed while generating the answer.",
        );
    }
  };

  try {
    while (true) {
      const { value, done } = await reader.read();

      if (done) {
        buffer += decoder.decode();
        break;
      }

      buffer += decoder.decode(value, { stream: true });

      const frames = buffer.split(/\r?\n\r?\n/);
      buffer = frames.pop() ?? "";

      for (const frame of frames) {
        processFrame(frame);
      }
    }

    if (buffer.trim()) {
      processFrame(buffer);
    }

    if (!completed) {
      throw new Error("The stream ended before the answer completed.");
    }
  } catch (error) {
    await reader.cancel().catch(() => undefined);
    throw error;
  } finally {
    reader.releaseLock();
  }
};

export const getConversations = async (): Promise<ConversationSummary[]> => {
  const result =
    await request<ApiResponse<{ conversations: ConversationSummary[] }>>(
      "/conversations",
    );

  return result.data.conversations;
};

export const getConversation = async (
  conversationId: string,
): Promise<ConversationDetail> => {
  const result = await request<ApiResponse<ConversationDetail>>(
    `/conversations/${encodeURIComponent(conversationId)}`,
  );

  return result.data;
};
