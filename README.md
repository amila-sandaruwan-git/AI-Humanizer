# 🤖 AI Humanizer

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-18.x-61DAFB?logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Material-UI](https://img.shields.io/badge/Material--UI-5.x-007FFF?logo=mui)](https://mui.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?logo=supabase)](https://supabase.com/)

> Transform AI-generated text into natural, human-like content — free, private, and offline.

[Live Demo](https://ai-humanizer.vercel.app) · [Report Bug](https://github.com/yourusername/ai-humanizer/issues) · [Request Feature](https://github.com/yourusername/ai-humanizer/issues)

---
---

## ✨ Features

### 🎯 Core Features
- **Three Intensity Levels**: Light (55%), Medium (75%), Heavy (98%) word replacement
- **Four Tone Options**: Professional, Casual, Academic, Creative
- **Three Style Options**: Concise, Balanced, Detailed
- **Real-time Similarity Score**: See how much the text has changed
- **Preserves Document Structure**: Maintains paragraphs, bullet points, headings, indentation

### 📁 File Support
- **Drag & Drop Upload**: TXT, DOCX, PDF, MD files
- **File Size Limit**: 10MB per upload
- **Structure Preservation**: Maintains original document formatting

### ✍️ Humanization Features
- **Natural Language Transformations**:
  - Remove AI transition words (furthermore, moreover, consequently)
  - Simplify complex verbs (utilize → use, demonstrate → show)
  - Cut filler and redundancy
  - Mix sentence lengths
  - Vary sentence starters
  - Add natural contractions
  - Replace generic phrases with specific language

### 🔍 Grammar Correction
- **LanguageTool API Integration**: Free grammar checking
- **Internal Grammar Rules**:
  - Subject-verb agreement
  - Tense consistency
  - Article usage (a/an/the)
  - Preposition correction
  - Pronoun agreement
  - Double negative removal
  - Capitalization fixes
  - Punctuation fixes

### 💬 Community Features
- **Comment System**: Users can comment with name/email
- **Anonymous Option**: Post as anonymous
- **Like/Dislike**: Vote on comments
- **Reply System**: Threaded replies
- **Edit/Delete**: Users can manage their own comments

### 🎨 UI/UX
- **Dark/Light Mode**: Persistent preference with system detection
- **Undo/Redo**: Keyboard shortcuts (Ctrl+Z, Ctrl+Y)
- **Toast Notifications**: Success, error, info, loading states
- **Responsive Design**: Works on all screen sizes
- **Scroll to Top**: Smooth scrolling button

---

## 🛠️ Tech Stack

### Frontend
| Technology | Description |
|------------|-------------|
| **React 18** | UI framework |
| **TypeScript 5** | Type-safe JavaScript |
| **Material-UI 5** | Component library |
| **React Hook Form** | Form handling |
| **React Hot Toast** | Toast notifications |

### Backend
| Technology | Description |
|------------|-------------|
| **Supabase** | PostgreSQL database + auth |
| **LanguageTool API** | Grammar checking |

### Languages & Tools
| Tool | Purpose |
|------|---------|
| **Inter** | Primary UI font |
| **Playfair Display** | Headers and logo |
| **Vercel** | Deployment |

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18.x or higher
- npm or yarn
- Supabase account (for comments feature)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/ai-humanizer.git
cd ai-humanizer
