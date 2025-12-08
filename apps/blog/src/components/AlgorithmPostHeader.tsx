interface AlgorithmPostHeaderProps {
  title: string;
  platform?: string;
  problemId?: number | string;
  difficulty?: string;
  tags?: string[];
  date?: string;
}

function getDifficultyClasses(difficulty?: string): string {
  const baseClasses = "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium";
  
  switch (difficulty?.toLowerCase()) {
    case "easy":
      return `${baseClasses} bg-green-50 text-green-700 border border-green-200`;
    case "medium":
      return `${baseClasses} bg-yellow-50 text-yellow-700 border border-yellow-200`;
    case "hard":
      return `${baseClasses} bg-red-50 text-red-700 border border-red-200`;
    default:
      return `${baseClasses} bg-gray-50 text-gray-700 border border-gray-200`;
  }
}

export default function AlgorithmPostHeader({
  title,
  platform,
  problemId,
  difficulty,
  tags,
  date,
}: AlgorithmPostHeaderProps) {
  const formattedDate = date
    ? new Date(date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  return (
    <header className="mb-6">
      <h1 className="text-3xl font-bold tracking-tight mb-2">{title}</h1>
      
      <div className="flex items-center gap-3 flex-wrap mb-2">
        {platform && problemId && (
          <span className="text-sm text-gray-600">
            {platform} #{problemId}
          </span>
        )}
        
        {difficulty && (
          <span className={getDifficultyClasses(difficulty)}>
            {difficulty}
          </span>
        )}
        
        {formattedDate && (
          <time className="text-sm text-gray-600">{formattedDate}</time>
        )}
      </div>
      
      {tags && tags.length > 0 && (
        <div>
          {tags.map((tag, index) => (
            <span
              key={index}
              className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs text-gray-600 mr-2 mt-2"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </header>
  );
}

