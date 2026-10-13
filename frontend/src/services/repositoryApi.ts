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

interface ConnectRepositoryResponse {
  success: boolean;
  message: string;
  data: {
    repository: Repository;
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

interface ConnectRepositoryResponse {
  success: boolean;
  message: string;
  data: {
    repository: Repository;
  };
}

/**
 * Connect a public GitHub repository to the logged-in user's account.
 * The backend validates the URL and retrieves the repository metadata.
 */
export const connectRepository = async (
  url: string
): Promise<Repository> => {
  const response = await fetch(`${API_URL}/repositories`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ url }),
  });

  const result = (await response.json()) as ConnectRepositoryResponse;

  if (!response.ok) {
    throw new Error(result.message || "Failed to connect repository.");
  }

  return result.data.repository;
};