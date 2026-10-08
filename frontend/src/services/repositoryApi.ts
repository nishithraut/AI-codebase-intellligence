const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

export interface RepositoryFile {
  _id: string;
  path: string;
  content: string;
}

export interface Repository {
  _id: string;
  userId: string;
  name: string;
  url: string;
}

export interface RepositoryResponse {
  success: boolean;
  data: {
    repository: Repository;
    files: RepositoryFile[];
  };
}

export const getRepository = async (
  repositoryId: string
): Promise<RepositoryResponse> => {
  const response = await fetch(
    `${API_URL}/api/repositories/${repositoryId}`
  );

  if (!response.ok) {
    throw new Error("Failed to fetch repository");
  }

  return response.json();
};