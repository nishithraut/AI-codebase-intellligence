import { useState } from "react";
import type { RepositoryFile } from "../../types/repository";

interface RepositoryTreeProps {
  files: RepositoryFile[];
  selectedFileId: string | null;
  onFileSelect: (file: RepositoryFile) => void;
}

interface TreeNode {
  name: string;
  path: string;
  type: "folder" | "file";
  file?: RepositoryFile;
  children: Record<string, TreeNode>;
}

const buildTree = (files: RepositoryFile[]): TreeNode => {
  const root: TreeNode = {
    name: "",
    path: "",
    type: "folder",
    children: {},
  };

  files.forEach((file) => {
    const parts = file.path.split("/");
    let current = root;

    parts.forEach((part, index) => {
      const isFile = index === parts.length - 1;
      const currentPath = parts.slice(0, index + 1).join("/");

      if (!current.children[part]) {
        current.children[part] = {
          name: part,
          path: currentPath,
          type: isFile ? "file" : "folder",
          children: {},
          file: isFile ? file : undefined,
        };
      }

      current = current.children[part];
    });
  });

  return root;
};

/* -------------------------------- */
/* File Node                        */
/* -------------------------------- */

interface FileNodeProps {
  node: TreeNode;
  depth: number;
  selectedFileId: string | null;
  onFileSelect: (file: RepositoryFile) => void;
}

const FileNode = ({
  node,
  depth,
  selectedFileId,
  onFileSelect,
}: FileNodeProps) => {
  const isSelected = node.file?._id === selectedFileId;

  return (
    <button
      type="button"
      onClick={() => {
        if (node.file) {
          onFileSelect(node.file);
        }
      }}
      className={`flex w-full items-center gap-2 py-1.5 pr-3 text-left text-sm transition ${
        isSelected
          ? "bg-white/10 text-white"
          : "text-gray-500 hover:bg-white/5 hover:text-gray-200"
      }`}
      style={{
        paddingLeft: `${depth * 16 + 28}px`,
      }}
    >
      <span>📄</span>

      <span className="truncate">
        {node.name}
      </span>
    </button>
  );
};

/* -------------------------------- */
/* Folder Node                      */
/* -------------------------------- */

interface FolderNodeProps {
  node: TreeNode;
  depth: number;
  selectedFileId: string | null;
  onFileSelect: (file: RepositoryFile) => void;
}

const FolderNode = ({
  node,
  depth,
  selectedFileId,
  onFileSelect,
}: FolderNodeProps) => {
  const [expanded, setExpanded] = useState(depth === 0);

  const children = Object.values(node.children).sort((a, b) => {
    if (a.type !== b.type) {
      return a.type === "folder" ? -1 : 1;
    }

    return a.name.localeCompare(b.name);
  });

  return (
    <div>
      {/* Folder */}
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        className="flex w-full items-center gap-2 py-1.5 pr-3 text-left text-sm text-gray-400 hover:bg-white/5 hover:text-white"
        style={{
          paddingLeft: `${depth * 16 + 12}px`,
        }}
      >
        <span className="w-4 text-xs text-gray-500">
          {expanded ? "⌄" : "›"}
        </span>

        <span>
          {expanded ? "📂" : "📁"}
        </span>

        <span className="truncate">
          {node.name}
        </span>
      </button>

      {/* Children */}
      {expanded && (
        <div>
          {children.map((child) => {
            if (child.type === "folder") {
              return (
                <FolderNode
                  key={child.path}
                  node={child}
                  depth={depth + 1}
                  selectedFileId={selectedFileId}
                  onFileSelect={onFileSelect}
                />
              );
            }

            return (
              <FileNode
                key={child.path}
                node={child}
                depth={depth + 1}
                selectedFileId={selectedFileId}
                onFileSelect={onFileSelect}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

/* -------------------------------- */
/* Repository Tree                  */
/* -------------------------------- */

const RepositoryTree = ({
  files,
  selectedFileId,
  onFileSelect,
}: RepositoryTreeProps) => {
  const tree = buildTree(files);

  const rootChildren = Object.values(tree.children).sort((a, b) => {
    if (a.type !== b.type) {
      return a.type === "folder" ? -1 : 1;
    }

    return a.name.localeCompare(b.name);
  });

  return (
    <aside className="h-fit min-h-[520px] w-72 shrink-0 border-r border-white/10 bg-[#050505]">
      
      {/* Header */}
      <div className="border-b border-white/10 px-4 py-3">
        <h2 className="text-sm font-semibold text-gray-200">
          Files
        </h2>

        <p className="mt-1 text-xs text-gray-500">
          {files.length} files
        </p>
      </div>

      {/* Tree */}
      <div className="py-2">
        {rootChildren.map((child) => {
          if (child.type === "folder") {
            return (
              <FolderNode
                key={child.path}
                node={child}
                depth={0}
                selectedFileId={selectedFileId}
                onFileSelect={onFileSelect}
              />
            );
          }

          return (
            <FileNode
              key={child.path}
              node={child}
              depth={0}
              selectedFileId={selectedFileId}
              onFileSelect={onFileSelect}
            />
          );
        })}
      </div>
    </aside>
  );
};

export default RepositoryTree;