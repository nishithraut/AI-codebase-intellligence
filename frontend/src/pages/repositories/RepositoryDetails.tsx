import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import RepositoryHeader from "../../components/repository/RepositoryHeader";
import RepositoryTree from "../../components/repository/RepositoryTree";
import CodeViewer from "../../components/repository/CodeViewer";

import { getRepository } from "../../services/repositoryApi";

import type {
  Repository,
  RepositoryFile,
} from "../../types/repository";

const RepositoryDetails = () => {
  const { repositoryId } = useParams<{ repositoryId: string }>();

  const [repository, setRepository] =
    useState<Repository | null>(null);

  const [files, setFiles] = useState<RepositoryFile[]>([]);

  const [selectedFile, setSelectedFile] =
    useState<RepositoryFile | null>(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRepository = async () => {
      if (!repositoryId) {
        setError("Repository ID is missing");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const response = await getRepository(repositoryId);

        setRepository(response.data.repository);
        setFiles(response.data.files);
      } catch (error) {
        console.error(error);
        setError("Failed to load repository");
      } finally {
        setLoading(false);
      }
    };

    fetchRepository();
  }, [repositoryId]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-black text-gray-400">
        Loading repository...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center bg-black text-red-400">
        {error}
      </div>
    );
  }

  if (!repository) {
    return (
      <div className="flex h-full items-center justify-center bg-black text-gray-400">
        Repository not found
      </div>
    );
  }

  return (
    <main className="min-h-full bg-black p-5">
      <div className="flex flex-col gap-4">

        {/* Repository Header */}
        <section className="overflow-hidden rounded-xl border border-white/10 bg-[#050505]">
          <RepositoryHeader repository={repository} />
        </section>

        {/* Repository Workspace */}
        <section className="min-h-[520px] overflow-hidden rounded-xl border border-white/10 bg-[#050505]">
          <div className="flex items-start">

            {/* Repository Tree */}
            <RepositoryTree
              files={files}
              selectedFileId={selectedFile?._id ?? null}
              onFileSelect={setSelectedFile}
            />

            {/* Code Viewer */}
            <CodeViewer file={selectedFile} />

          </div>
        </section>

      </div>
    </main>
  );
};

export default RepositoryDetails;