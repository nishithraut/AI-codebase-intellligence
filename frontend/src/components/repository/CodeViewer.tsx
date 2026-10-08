import type { RepositoryFile } from "../../types/repository";

import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

interface CodeViewerProps {
  file: RepositoryFile | null;
};

const getLanguage = (filePath: string): string => {
  const extension = filePath.split(".").pop()?.toLowerCase();

  switch (extension) {
    case "js":
      return "javascript";

    case "jsx":
      return "jsx";

    case "ts":
      return "typescript";

    case "tsx":
      return "tsx";

    case "json":
      return "json";

    case "css":
      return "css";

    case "scss":
      return "scss";

    case "html":
      return "markup";

    case "xml":
      return "markup";

    case "md":
      return "markdown";

    case "py":
      return "python";

    case "java":
      return "java";

    case "c":
      return "c";

    case "cpp":
      return "cpp";

    case "cs":
      return "csharp";

    case "go":
      return "go";

    case "rs":
      return "rust";

    case "sql":
      return "sql";

    case "sh":
      return "bash";

    case "yml":
    case "yaml":
      return "yaml";

    default:
      return "text";
  }
};

const CodeViewer = ({ file }: CodeViewerProps) => {
  if (!file) {
    return (
      <section className="flex h-[520px] min-h-[520px] min-w-0 flex-1 items-center justify-center bg-[#050505]">
        <div className="text-center">
          <p className="text-sm font-medium text-gray-400">
            Select a file
          </p>

          <p className="mt-1 text-xs text-gray-600">
            Choose a file from the repository tree
          </p>
        </div>
      </section>
    );
  }

  const language = getLanguage(file.path);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(file.content);
  };

  return (
    <section className="flex h-[520px] min-h-[520px] min-w-0 flex-1 flex-col bg-[#050505]">

      {/* File Header */}
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-white/10 px-5">
        <p className="truncate text-sm font-medium text-gray-300">
          {file.path}
        </p>

        <button
          type="button"
          onClick={handleCopy}
          className="rounded-md px-3 py-1.5 text-xs text-gray-500 transition hover:bg-white/5 hover:text-white"
        >
          Copy
        </button>
      </div>

      {/* Code Area */}
      <div className="min-h-0 flex-1 overflow-auto">
        <SyntaxHighlighter
          language={language}
          style={vscDarkPlus}
          showLineNumbers
          wrapLongLines={false}
          customStyle={{
            margin: 0,
            minWidth: "max-content",
            minHeight: "100%",
            padding: "16px 20px",
            background: "#050505",
            fontSize: "14px",
            lineHeight: "1.7",
          }}
          codeTagProps={{
            style: {
              fontFamily:
                "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
            },
          }}
          lineNumberStyle={{
            color: "#374151",
            minWidth: "40px",
            paddingRight: "24px",
            userSelect: "none",
          }}
        >
          {file.content}
        </SyntaxHighlighter>
      </div>
    </section>
  );
};

export default CodeViewer;