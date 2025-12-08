# GavinFelix Blog — MDX-powered Developer Knowledge Base

A personal blog built with **Next.js 15**, **MDX**, and **Tailwind CSS**, designed for publishing
technical articles and detailed algorithm problem-solving notes.

It supports dynamic content rendering from `.mdx` files and categorizes posts into
general tech articles and algorithm-focused posts.

---

## ✨ Features

- 📝 **MDX powered content**
  - Write posts using Markdown + embedded React components
- 🧩 **Algorithm category & metadata**
  - Tags: Problem ID, difficulty level, short description
  - Listed separately from normal blog posts
- 📚 Automatic blog index page: `/blog`
- ⚙️ Dynamic MDX routing: `/blog/[slug]`
- 📊 Dedicated algorithms page: `/algorithms`
- 🧠 **Custom Algorithm Detail Components**
  - e.g. `<ComplexityCard time="O(n)" space="O(n)" />`

---

## 📁 Project Structure

```
  apps/blog
  ├─ src/app
  │ ├─ blog
  │ │ ├─ page.tsx # Blog index
  │ │ └─ [slug]/page.tsx # Post detail renderer (MDX)
  │ ├─ algorithms/page.tsx # Algorithm section
  │ └─ layout.tsx
  ├─ content/posts/*.mdx # Blog posts
  ├─ components/ComplexityCard.tsx # Reusable MDX component
```

---

## 🛠️ Tech Stack

| Technology   | Purpose                            |
| ------------ | ---------------------------------- |
| Next.js 15   | Routing & Rendering                |
| MDX          | Article content + React components |
| Tailwind CSS | UI styling                         |
| TypeScript   | Type safety                        |

---

## 🧪 Example MDX Usage

```mdx
# LeetCode 1 - Two Sum 解题记录

<ComplexityCard
  time="O(n)"
  space="O(n)"
  note="Hash table stores up to n items"
/>

Solution notes ...
```

🚀 Future Improvements

Full-text search for posts

Automatic GitHub sync for algorithm posts

English/Chinese bilingual content toggle

Post views & like tracking via database

👨‍💻 Author

Gavin Felix Sun
Frontend Developer — AI powered web apps
