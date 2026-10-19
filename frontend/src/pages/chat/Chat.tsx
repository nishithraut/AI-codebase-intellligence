
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getConversations,
  type ConversationSummary,
} from "../../services/chatApi";

const Chat = () => {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;

    getConversations()
      .then((items) => {
        if (active) setConversations(items);
      })
      .catch((err: unknown) => {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : "Failed to load conversations."
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const openConversation = (conversation: ConversationSummary) => {
    navigate(
      `/repositories/${encodeURIComponent(conversation.repositoryId)}?conversationId=${encodeURIComponent(conversation.conversationId)}`
    );
  };

  return (
    <div className="min-h-full bg-black p-6 text-white">
      <header className="mb-8">
        <h1 className="text-3xl font-semibold">Conversations</h1>
        <p className="mt-2 text-sm text-zinc-500">
          Continue a previous discussion with any connected repository.
        </p>
      </header>

      {loading && (
        <p className="text-sm text-zinc-400">Loading conversations...</p>
      )}

      {error && (
        <div role="alert" className="rounded-lg border border-red-500/20 p-4 text-sm text-red-400">
          {error}
        </div>
      )}

      {!loading && !error && conversations.length === 0 && (
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-8">
          <h2 className="text-lg font-medium">No conversations yet</h2>
          <p className="mt-2 text-sm text-zinc-500">
            Open a repository and ask your first question to start a conversation.
          </p>
          <button
            onClick={() => navigate("/repositories")}
            className="mt-5 rounded-lg bg-white px-4 py-2 text-sm font-medium text-black hover:bg-zinc-200"
          >
            Browse repositories
          </button>
        </div>
      )}

      <div className="grid gap-3">
        {conversations.map((conversation) => (
          <button
            key={conversation.conversationId}
            onClick={() => openConversation(conversation)}
            className="w-full rounded-xl border border-white/10 bg-white/[0.02] p-5 text-left transition hover:border-white/20 hover:bg-white/[0.05]"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                  {conversation.repositoryName}
                </p>
                <h2 className="mt-2 truncate text-base font-medium text-zinc-100">
                  {conversation.title}
                </h2>
              </div>

              <div className="shrink-0 text-xs text-zinc-500">
                {conversation.updatedAt
                  ? `Updated ${new Date(conversation.updatedAt).toLocaleString()}`
                  : "Saved conversation"}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default Chat;
