export type GitHubRepo = {
  name: string;
  fullName: string;
  description: string | null;
  htmlUrl: string;
  language: string | null;
  stars: number;
  forks: number;
  updatedAt: string;
  topics: string[];
};

export async function getCodeMtaaniRepos(): Promise<GitHubRepo[]> {
  try {
    const res = await fetch("https://api.github.com/users/ederstoneCorp/repos?sort=updated&per_page=10", {
      headers: {
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "CodeMtaani-Platform",
      },
      next: { revalidate: 3600 }, // Cache for 1 hour to prevent rate limiting
    });

    if (!res.ok) {
      console.warn(`GitHub API returned status ${res.status}`);
      return getFallbackRepos();
    }

    const data = await res.json();
    if (!Array.isArray(data)) return getFallbackRepos();

    // Filter to repositories relevant to CodeMtaani or public showcase
    return data
      .filter((repo: Record<string, unknown>) => !repo.fork && !repo.private)
      .map((repo: Record<string, unknown>) => ({
        name: String(repo.name || ""),
        fullName: String(repo.full_name || ""),
        description: repo.description ? String(repo.description) : null,
        htmlUrl: String(repo.html_url || ""),
        language: repo.language ? String(repo.language) : null,
        stars: Number(repo.stargazers_count) || 0,
        forks: Number(repo.forks_count) || 0,
        updatedAt: String(repo.updated_at || ""),
        topics: Array.isArray(repo.topics) ? (repo.topics as string[]) : [],
      }));
  } catch (error) {
    console.warn("Failed to fetch from GitHub API:", error);
    return getFallbackRepos();
  }
}

function getFallbackRepos(): GitHubRepo[] {
  return [
    {
      name: "CodeMtaani-Group",
      fullName: "ederstoneCorp/CodeMtaani-Group",
      description: "Official digital platform and open technology initiatives for CodeMtaani Group.",
      htmlUrl: "https://github.com/ederstoneCorp/CodeMtaani-Group",
      language: "TypeScript",
      stars: 0,
      forks: 0,
      updatedAt: new Date().toISOString(),
      topics: ["nextjs", "typescript", "community", "technology-platform"],
    },
  ];
}
