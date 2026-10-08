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