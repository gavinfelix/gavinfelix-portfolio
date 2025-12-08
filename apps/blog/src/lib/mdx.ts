import fs from "fs";
import path from "path";
import matter from "gray-matter";

// Absolute path to the content/posts directory
export const POSTS_PATH = path.join(process.cwd(), "content", "posts");

/**
 * Get all post slugs from the posts directory
 * @returns Array of slugs without the .mdx extension
 */
export function getPostSlugs(): string[] {
  if (!fs.existsSync(POSTS_PATH)) {
    return [];
  }

  const fileNames = fs.readdirSync(POSTS_PATH);
  return fileNames
    .filter((name) => name.endsWith(".mdx"))
    .map((name) => name.replace(/\.mdx$/, ""));
}

/**
 * Get a post by its slug
 * @param slug - The post slug (without .mdx extension)
 * @returns Post object with slug, frontmatter, and content
 */
export function getPostBySlug(slug: string): {
  slug: string;
  frontmatter: Record<string, any>;
  content: string;
} {
  const filePath = path.join(POSTS_PATH, `${slug}.mdx`);
  const fileContents = fs.readFileSync(filePath, "utf8");
  const { data, content } = matter(fileContents);

  return {
    slug,
    frontmatter: data,
    content,
  };
}

/**
 * Get all posts sorted by date (newest first)
 * @returns Array of posts sorted by frontmatter.date in descending order
 */
export function getAllPosts(): Array<{
  slug: string;
  frontmatter: Record<string, any>;
  content: string;
}> {
  const slugs = getPostSlugs();
  const posts = slugs.map((slug) => getPostBySlug(slug));

  return posts.sort((a, b) => {
    const dateA = a.frontmatter.date || "";
    const dateB = b.frontmatter.date || "";
    if (dateA < dateB) {
      return 1;
    } else {
      return -1;
    }
  });
}
