
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  getConversation,
  streamRepositoryMessage,
  type ChatSource,
} from "../../services/chatApi";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: ChatSource[];
}

interface RepositoryChatProps {
  repositoryId: string;
  initialConversationId?: string | null;
}

const RepositoryChat = ({
  repositoryId,
  initialConversationId = null,
}: RepositoryChatProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [query, setQuery] = useState("");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [, setSearchParams] = useSearchParams();

  useEffect(() => {
    let active = true;

    setMessages([]);
    setQuery("");
    setConversationId(initialConversationId);
    setError("");

    if (!initialConversationId) {
      setSending(false);

      return () => {
        active = false;
      };
    }

    setSending(true);

    getConversation(initialConversationId)
      .then((conversation) => {
        if (!active) return;

        if (conversation.repositoryId !== repositoryId) {
          throw new Error(
            "This conversation belongs to another repository."
          );
        }

        setMessages(
          conversation.messages.map((message) => ({
            id: crypto.randomUUID(),
            role: message.role,
            content: message.content,
          }))
        );

        setConversationId(conversation.conversationId);
      })
      .catch((err: unknown) => {
        if (!active) return;

        setError(
          err instanceof Error
            ? err.message
            : "Failed to load conversation history."
        );
      })
      .finally(() => {
        if (active) setSending(false);
      });

    return () => {
      active = false;
    };
  }, [repositoryId, initialConversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  const handleSend = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    const question = query.trim();

    if (!question || sending) return;

    const userMessageId = crypto.randomUUID();
    const assistantMessageId = crypto.randomUUID();

    const userMessage: ChatMessage = {
      id: userMessageId,
      role: "user",
      content: question,
    };

    const assistantMessage: ChatMessage = {
      id: assistantMessageId,
      role: "assistant",
      content: "",
      sources: [],
    };

    setMessages((previous) => [
      ...previous,
      userMessage,
      assistantMessage,
    ]);

    setQuery("");
    setSending(true);
    setError("");

    let receivedToken = false;

    try {
      await streamRepositoryMessage(
        repositoryId,
        {
          query: question,
          ...(conversationId ? { conversationId } : {}),
          limit: 5,
        },
        {
          onMetadata: (metadata) => {
            setConversationId(metadata.conversationId);
          },

          onToken: (content) => {
            receivedToken = true;

            setMessages((previous) =>
              previous.map((message) =>
                message.id === assistantMessageId
                  ? {
                      ...message,
                      content: message.content + content,
                    }
                  : message
              )
            );
          },

          onSources: (sources) => {
            setMessages((previous) =>
              previous.map((message) =>
                message.id === assistantMessageId
                  ? { ...message, sources }
                  : message
              )
            );
          },

          onDone: () => {
            // The stream completed successfully.
          },
        }
      );
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to stream the response."
      );

      if (!receivedToken) {
        setMessages((previous) =>
          previous.filter(
            (message) => message.id !== assistantMessageId
          )
        );
      }
    } finally {
      setSending(false);
    }
  };

  const startNewConversation = () => {
    if (sending) return;

    setMessages([]);
    setConversationId(null);
    setQuery("");
    setError("");
    setSearchParams({});
  };

  return (
    <section className="flex min-h-[520px] flex-col overflow-hidden rounded-xl border border-white/10 bg-[#050505]">
      <header className="flex items-center justify-between border-b border-white/10 px-5 py-4">
        <div>
          <h2 className="text-base font-semibold text-white">
            Repository Chat
          </h2>
          <p className="mt-1 text-xs text-zinc-500">
            Ask questions about this codebase
          </p>
        </div>

        <button
          type="button"
          onClick={startNewConversation}
          disabled={sending}
          className="rounded-lg border border-white/10 px-3 py-2 text-xs text-zinc-300 transition hover:bg-white/5 disabled:opacity-50"
        >
          New chat
        </button>
      </header>

      <div
        className="flex-1 space-y-5 overflow-y-auto p-5"
        aria-live="polite"
      >
        {messages.length === 0 && (
          <div className="flex min-h-[300px] flex-col items-center justify-center text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-xl text-zinc-300">
              {"</>"}
            </div>

            <h3 className="text-sm font-medium text-zinc-200">
              Explore your codebase
            </h3>

            <p className="mt-2 max-w-sm text-sm leading-6 text-zinc-500">
              Ask how a component works, where a function is defined,
              or how different parts of the repository interact.
            </p>

            <button
              type="button"
              onClick={() =>
                setQuery(
                  "Explain the main components of this codebase."
                )
              }
              className="mt-5 rounded-lg border border-white/10 px-3 py-2 text-sm text-zinc-300 transition hover:bg-white/5"
            >
              Explain this codebase
            </button>
          </div>
        )}

        {messages.map((message) => (
          <article key={message.id} className="space-y-3">
            <div
              className={`max-w-[90%] rounded-xl px-4 py-3 text-sm leading-6 ${
                message.role === "user"
                  ? "ml-auto bg-white text-black"
                  : "mr-auto border border-white/10 bg-white/[0.03] text-zinc-200"
              }`}
            >
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider opacity-60">
                {message.role === "user"
                  ? "You"
                  : "Codebase assistant"}
              </p>

              <div className="whitespace-pre-wrap break-words">
                {message.content}
                {sending &&
                  message.role === "assistant" &&
                  message.id === messages[messages.length - 1]?.id && (
                    <span className="ml-1 inline-block h-4 w-1 animate-pulse bg-current align-middle" />
                  )}
              </div>
            </div>

            {message.role === "assistant" &&
              message.sources &&
              message.sources.length > 0 && (
                <div className="mr-auto max-w-[90%] space-y-2">
                  <p className="text-xs font-medium text-zinc-500">
                    Retrieved sources
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {message.sources.map((source, index) => (
                      <div
                        key={`${source.path}-${source.startLine}-${index}`}
                        className="max-w-full rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2"
                      >
                        <p className="break-all text-xs text-zinc-300">
                          {source.path ?? "Unknown file"}
                        </p>

                        {source.startLine != null &&
                          source.endLine != null && (
                            <p className="mt-1 text-[11px] text-zinc-500">
                              Lines {source.startLine}–{source.endLine}
                            </p>
                          )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
          </article>
        ))}

        {sending &&
          messages[messages.length - 1]?.role === "user" && (
            <div className="mr-auto rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-zinc-400">
              Analyzing repository code...
            </div>
          )}

        <div ref={messagesEndRef} />
      </div>

      {error && (
        <div
          role="alert"
          className="mx-4 mb-3 rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2 text-sm text-red-400"
        >
          {error}
        </div>
      )}

      <form
        onSubmit={handleSend}
        className="border-t border-white/10 p-4"
      >
        <div className="flex items-end gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-2 focus-within:border-white/20">
          <textarea
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (
                event.key === "Enter" &&
                !event.shiftKey
              ) {
                event.preventDefault();
                event.currentTarget.form?.requestSubmit();
              }
            }}
            rows={2}
            maxLength={10000}
            disabled={sending}
            placeholder="Ask about your code..."
            aria-label="Message the repository assistant"
            className="max-h-36 min-h-12 flex-1 resize-y bg-transparent px-2 py-2 text-sm text-white outline-none placeholder:text-zinc-600 disabled:opacity-50"
          />

          <button
            type="submit"
            disabled={sending || !query.trim()}
            className="rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {sending ? "Streaming..." : "Send"}
          </button>
        </div>

        <p className="mt-2 text-[11px] text-zinc-600">
          Enter to send · Shift + Enter for a new line
        </p>
      </form>
    </section>
  );
};

export default RepositoryChat;
