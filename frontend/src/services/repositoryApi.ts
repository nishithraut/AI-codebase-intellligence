
const API_URL =
  import.meta.env.VITE_API_URL ?? "http://localhost:5000/api";

export interface Repository {
  _id: string;
  userId: string;
  name: string;
  url: string;
  language?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface RepositoryFile {
  _id: string;
  path: string;
  content: string;
}

interface RepositoriesResponse {
  success: boolean;
  data: {
    repositories: Repository[];
  };
}

export interface RepositoryResponse {
  success: boolean;
  data: {
    repository: Repository;
    files: RepositoryFile[];
  };
}

/**
 * Fetch all repositories owned by the logged-in user.
 * Used by the Repositories page.
 */
export const getRepositories = async (): Promise<Repository[]> => {
  const response = await fetch(`${API_URL}/repositories`, {
    method: "GET",
    credentials: "include",
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || "Failed to fetch repositories");
  }

  return (result as RepositoriesResponse).data.repositories;
};

/**
 * Fetch one repository and its files using its MongoDB ID.
 * Used by the Repository Details page.
 */
export const getRepository = async (
  repositoryId: string
): Promise<RepositoryResponse> => {
  const response = await fetch(
    `${API_URL}/repositories/${encodeURIComponent(repositoryId)}`,
    {
      method: "GET",
      credentials: "include",
    }
  );

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || "Failed to fetch repository");
  }

  return result as RepositoryResponse;
};
