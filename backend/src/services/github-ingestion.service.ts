
import mongoose from "mongoose";
import { RepositoryFile } from "../models/repository-file.model.js";

// Initial ingestion limits for the demo version.
const MAX_FILES = 2_000;
const MAX_FILE_SIZE_BYTES = 500 * 1024;
const MAX_TOTAL_SIZE_BYTES = 25 * 1024 * 1024;
const DOWNLOAD_CONCURRENCY = 8;

interface GitHubTreeItem {
  path: string;
  type: "blob" | "tree" | "commit";
  size?: number;
}

interface GitHubRepositoryMetadata {
  default_branch: string;
}

interface GitHubTreeResponse {
  tree: GitHubTreeItem[];
  truncated: boolean;
}

interface DownloadedFile {
  path: string;
  content: string;
  size: number;
}

export interface IngestionResult {
  storedFiles: number;
  skippedFiles: number;
  partial: boolean;
}

const EXCLUDED_DIRECTORIES = new Set([
  ".git",
  "node_modules",
  "dist",
  "build",
  "coverage",
  ".next",
  ".venv",
  "venv",
  "__pycache__",
  "vendor",
]);

const EXCLUDED_EXTENSIONS = new Set([
  ".png", ".jpg", ".jpeg", ".gif", ".webp", ".ico",
  ".pdf", ".zip", ".gz", ".rar", ".7z", ".tar",
  ".exe", ".dll", ".so", ".dylib", ".class", ".jar",
  ".woff", ".woff2", ".ttf", ".otf", ".mp4", ".mp3",
  ".sqlite", ".db", ".pyc",
]);

/**
 * Makes a request to GitHub's public API.
 * Throws an error if GitHub rejects the request.
 */
const githubApiGet = async <T>(url: string): Promise<T> => {
  const response = await fetch(url, {
    headers: {
      Accept: "application/vnd.github+json",
      "User-Agent": "ai-codebase-intelligence",
    },
    signal: AbortSignal.timeout(20_000),
  });

  if (!response.ok) {
    throw new Error(
      `GitHub API request failed (${response.status}).`
    );
  }

  return (await response.json()) as T;
};

/**
 * Determines whether a path should be excluded from ingestion.
 */
const shouldSkipPath = (path: string): boolean => {
  const segments = path.split("/");
  const filename = segments[segments.length - 1] ?? "";
  const extension = filename.includes(".")
    ? `.${filename.split(".").pop()!.toLowerCase()}`
    : "";

  if (segments.some((segment) => EXCLUDED_DIRECTORIES.has(segment))) {
    return true;
  }

  if (EXCLUDED_EXTENSIONS.has(extension)) {
    return true;
  }

  // Skip environment files that commonly contain secrets.
  if (
    filename === ".env" ||
    filename.startsWith(".env.") ||
    filename.endsWith(".pem") ||
    filename.endsWith(".key")
  ) {
    return true;
  }

  return false;
};

/**
 * Downloads one text file from the selected repository branch.
 * Returns null when the file is binary, too large, or unavailable.
 */
const downloadTextFile = async (
  owner: string,
  repository: string,
  branch: string,
  file: GitHubTreeItem
): Promise<DownloadedFile | null> => {
  if (
    file.type !== "blob" ||
    typeof file.size !== "number" ||
    file.size > MAX_FILE_SIZE_BYTES ||
    file.size === 0 ||
    shouldSkipPath(file.path)
  ) {
    return null;
  }

  const rawUrl = `https://raw.githubusercontent.com/${encodeURIComponent(owner)}/${encodeURIComponent(repository)}/${branch.split("/").map(encodeURIComponent).join("/")}/${file.path.split("/").map(encodeURIComponent).join("/")}`;

  const response = await fetch(rawUrl, {
    headers: {
      "User-Agent": "ai-codebase-intelligence",
    },
    signal: AbortSignal.timeout(20_000),
  });

  if (!response.ok) {
    throw new Error(`Could not download ${file.path}.`);
  }

  // Check the actual response size before reading the body.
  const contentLength = Number(response.headers.get("content-length"));

  if (
    Number.isFinite(contentLength) &&
    contentLength > MAX_FILE_SIZE_BYTES
  ) {
    return null;
  }

  const buffer = await response.arrayBuffer();
  const bytes = new Uint8Array(buffer);

  if (
    buffer.byteLength > MAX_FILE_SIZE_BYTES ||
    bytes.includes(0)
   ) {
    return null;
  }

  // Only store valid UTF-8 text, not arbitrary binary data.
  const content = new TextDecoder("utf-8", { fatal: true }).decode(buffer);

  return {
    path: file.path,
    content,
    size: buffer.byteLength,
  };
};

/**
 * Downloads eligible files and stores them in MongoDB.
 * Existing file records are replaced only after the new batch is ready.
 */
export const ingestGitHubRepository = async (
  repositoryId: mongoose.Types.ObjectId,
  owner: string,
  repositoryName: string
): Promise<IngestionResult> => {
  const encodedRepository = `${encodeURIComponent(owner)}/${encodeURIComponent(repositoryName)}`;

  const metadata = await githubApiGet<GitHubRepositoryMetadata>(
    `https://api.github.com/repos/${encodedRepository}`
  );

  const branch = metadata.default_branch;

  const treeResponse = await githubApiGet<GitHubTreeResponse>(
    `https://api.github.com/repos/${encodedRepository}/git/trees/${branch
      .split("/")
      .map(encodeURIComponent)
      .join("/")}?recursive=1`
  );

  const allFiles = treeResponse.tree.filter(
    (item) => item.type === "blob"
  );

  const eligibleFiles = allFiles.filter(
    (file) =>
      !shouldSkipPath(file.path) &&
      typeof file.size === "number" &&
      file.size > 0 &&
      file.size <= MAX_FILE_SIZE_BYTES
  );

  const selectedFiles = eligibleFiles.slice(0, MAX_FILES);

  const downloadedFiles: DownloadedFile[] = [];
  let totalBytes = 0;
  let skippedFiles = allFiles.length - selectedFiles.length;
  let partial = treeResponse.truncated ||
    eligibleFiles.length > selectedFiles.length;

  // Process files in small groups to limit simultaneous network requests.
  for (
    let start = 0;
    start < selectedFiles.length;
    start += DOWNLOAD_CONCURRENCY
  ) {
    const batch = selectedFiles.slice(
      start,
      start + DOWNLOAD_CONCURRENCY
    );

    const results = await Promise.all(
      batch.map(async (file) => {
        try {
          return await downloadTextFile(
            owner,
            repositoryName,
            branch,
            file
          );
        } catch (error) {
          // A single failed download should not abort every other file.
          console.warn(`Skipping ${file.path}:`, error);
          partial = true;
          skippedFiles += 1;
          return null;
        }
      })
    );

    for (const result of results) {
      if (!result) {
        continue;
      }

      if (totalBytes + result.size > MAX_TOTAL_SIZE_BYTES) {
        partial = true;
        skippedFiles += 1;
        continue;
      }

      downloadedFiles.push(result);
      totalBytes += result.size;
    }

    // Stop once the storage budget has been reached.
    if (totalBytes >= MAX_TOTAL_SIZE_BYTES) {
      partial = true;
      skippedFiles += selectedFiles.length - start - batch.length;
      break;
    }
  }

  // Save in batches instead of issuing one database write per file.
  const WRITE_BATCH_SIZE = 100;

  for (
    let start = 0;
    start < downloadedFiles.length;
    start += WRITE_BATCH_SIZE
  ) {
    const batch = downloadedFiles.slice(
      start,
      start + WRITE_BATCH_SIZE
    );

    await RepositoryFile.bulkWrite(
      batch.map((file) => ({
        updateOne: {
          filter: {
            repositoryId,
            path: file.path,
          },
          update: {
            $set: {
              content: file.content,
            },
            $setOnInsert: {
              repositoryId,
              path: file.path,
            },
          },
          upsert: true,
        },
      }))
    );
  }

  // Remove stale files that no longer exist in the new ingestion.
  const storedPaths = downloadedFiles.map((file) => file.path);

  await RepositoryFile.deleteMany({
    repositoryId,
    path: { $nin: storedPaths },
  });

  return {
    storedFiles: downloadedFiles.length,
    skippedFiles,
    partial,
  };
};
