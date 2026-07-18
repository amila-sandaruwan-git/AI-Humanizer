# 🤖 AI Humanizer

<div align="center">

![AI Humanizer Banner](https://img.shields.io/badge/AI-Humanizer-blue?style=for-the-badge&logo=openai)
[![React](https://img.shields.io/badge/React-18.x-61DAFB?style=flat-square&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![MUI](https://img.shields.io/badge/MUI-5.x-007FFF?style=flat-square&logo=mui)](https://mui.com/)
[![Supabase](https://img.shields.io/badge/Supabase-2.x-3ECF8E?style=flat-square&logo=supabase)](https://supabase.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)

**Transform AI-generated text into natural, human-like content instantly.**

[Demo](#-live-demo) • [Features](#-features) • [Installation](#-installation) • [Tech Stack](#-tech-stack) • [Contributing](#-contributing)

</div>

---

## 📖 Table of Contents

- [About](#-about)
- [Features](#-features)
- [Live Demo](#-live-demo)
- [Tech Stack](#-tech-stack)
- [Installation](#-installation)
- [Environment Variables](#-environment-variables)
- [Database Setup](#-database-setup)
- [Usage Guide](#-usage-guide)
- [Screenshots](#-screenshots)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🎯 About

AI Humanizer is a powerful, free, and offline tool designed to transform AI-generated content into natural, human-like writing. Built with React and TypeScript, it uses an extensive dictionary of over **5,000+ words and phrases** to rewrite text while preserving meaning and intent.

### Why AI Humanizer?

- **🧠 Intelligent Transformation** - Uses advanced algorithms to restructure sentences naturally
- **🎨 Multiple Intensity Levels** - Choose from Light, Medium, or Heavy transformation
- **🌍 Tone Options** - Professional, Casual, Academic, or Creative tones
- **🔒 100% Private** - No data sent to external servers (offline dictionary-based)
- **⚡ Instant Results** - No API latency, works entirely offline
- **📁 File Support** - Upload TXT, DOCX, PDF, and MD files

---

## ✨ Features

### Core Features

| Feature | Description |
|---------|-------------|
| **AI Text Humanization** | Transform AI-generated text into natural, human-like content |
| **Dictionary-Based** | 5,000+ word/phrase dictionary for offline transformation |
| **Multiple Intensities** | Light (70-80% similar), Medium (50-60%), Heavy (10-20%) |
| **Tone Selection** | Professional, Casual, Academic, Creative |
| **Style Options** | Concise, Balanced, Detailed |
| **File Upload** | Support for TXT, DOCX, PDF, MD files |
| **Undo/Redo** | Full history tracking with keyboard shortcuts |
| **Dark/Light Mode** | Full theme support with system preference detection |

### User Features

| Feature | Description |
|---------|-------------|
| **User Authentication** | Google and Facebook OAuth login |
| **Profile Management** | View name, email, and avatar |
| **Account Deletion** | Delete account and all associated data |
| **Comments System** | Threaded comments with likes/replies |
| **Comment Voting** | Like/dislike comments |
| **Reply Threads** | Nested replies with collapsible threads |
| **User Avatars** | Profile pictures from OAuth providers |

### Technical Features

| Feature | Description |
|---------|-------------|
| **Offline First** | No API calls for humanization (dictionary-based) |
| **Real-time Updates** | Instant feedback on text changes |
| **Responsive Design** | Works on desktop, tablet, and mobile |
| **Keyboard Shortcuts** | Ctrl+Z (Undo), Ctrl+Y (Redo) |
| **Export Options** | Copy, Download as TXT, Share |
| **Accessibility** | WCAG compliant color contrast |
| **Performance** | Optimized with React.memo and useCallback |

---

## 🚀 Live Demo

[![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)]([https://ai-humanizer.vercel.app](https://ai-humanizer-liart.vercel.app))

> https://ai-humanizer-liart.vercel.app

---

## 🛠️ Tech Stack

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 18.x | UI Framework |
| **TypeScript** | 5.x | Type Safety |
| **Material-UI** | 5.x | Component Library |
| **React Router** | 6.x | Navigation |
| **Emotion** | 11.x | Styling |
| **date-fns** | 2.x | Date Formatting |

### Backend & Services

| Technology | Version | Purpose |
|------------|---------|---------|
| **Supabase** | 2.x | Authentication & Database |
| **PostgreSQL** | 15.x | Database |
| **Supabase Auth** | - | OAuth (Google/Facebook) |

### Development Tools

| Tool | Purpose |
|------|---------|
| **ESLint** | Code Linting |
| **Prettier** | Code Formatting |
| **Git** | Version Control |
| **npm** | Package Management |

---

## 📦 Installation

### Prerequisites

- Node.js (v18 or higher)
- npm (v9 or higher)
- Git
- Supabase account (free tier)

### Step 1: Clone the Repository

```bash
git clone https://github.com/yourusername/ai-humanizer.git
cd ai-humanizer
