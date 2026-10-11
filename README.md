# HabitPlus — Gamified Daily Habit Tracker & Routine Manager

A modern, high-performance Progressive Web Application (PWA) designed to master daily routines, maintain discipline, and achieve peak consistency through gamification, strict anti-cheat scoring, and an AI Mentor powered by Google Gemini.

---

## 🌟 Key Features

### 1. 24-Hour Blueprint & Timeline Engine
- **Master Routine Planner**: Design your full 24-hour routine blueprint with customizable "Do" (positive habits) and "Avoid" (bad habits to quit) blocks.
- **Coverage Visualizer**: Real-time 24-hour visual progress meter tracking unallocated gaps and daily coverage percentage.
- **Dynamic 100-Mark Allocation**: Automatically balances exactly 100 points across all active routine tasks using AI evaluation or smart Hare-Niemeyer proportional distribution.

### 2. Live Focus Spotlight & Dashboard
- **Running Now Indicator**: Tracks the currently active task in real time with elapsed duration, remaining minutes, and dynamic progress bar.
- **Up Next Preview**: Instant glance at the immediate next habit and countdown to start.
- **Single-Click Completion**: Mark habits as done within their active window or grace period with celebratory particle effects.

### 3. AI Mentor & Discipline Coach (Gemini 3.8 Flash)
- **3 Coaching Modes**:
  - **English Practice**: Constructive drills, grammar refinement, and sentence scoring.
  - **Daily Coaching**: Atomic habit science, loop optimization, and friction reduction.
  - **Stoic Motivation**: Demotivation countermeasures and mental resilience checks.
- **Failover Engine**: Automated dual-key failover with candidate model discovery and diagnostic suite.

### 4. Streak Safeguard & Anti-Cheat Analytics
- **Dynamic Streak Threshold**: Requires achieving a configurable target percentage (default: 70%) to maintain daily streaks.
- **Historical Immutability**: Past logs cannot be modified, preserving authentic progress records.
- **7-Day Consistency Trend**: Visual performance bar charts with target line benchmarks.

### 5. Multi-Device Luxury Experience
- **100vh Responsive Shell**: Designed for zero-scroll desktop layouts on laptops, tablets, and large PC screens with internal smooth-scrolling panels.
- **Adaptive Day & Night Themes**: Translucent frosted glass (Backdrop-Blur), elegant typography powered by **Inter** and **Plus Jakarta Sans**, and modern tabular numbers.
- **Bilingual Interface**: Full support for English and Bengali (বাংলা).
- **Offline-First PWA**: Installable on Android, iOS, Windows, and macOS with service worker caching and zero backend lock-in (LocalStorage).

---

## 🛠️ Tech Stack

- **Framework**: React 19
- **Build Tool**: Vite 8
- **Styling**: Tailwind CSS v4 (`@tailwindcss/vite`)
- **Typography**: Inter & Plus Jakarta Sans
- **Icons**: Lucide React
- **AI Integration**: Google Gemini REST API (`gemini-3.8-flash`)
- **Effects**: Canvas Confetti

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ installed
- npm or yarn

### Installation
```bash
# Clone the repository
git clone https://github.com/your-username/habit-tracker.git
cd habit-tracker

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
```

### Environment Configuration
Add your Google Gemini API keys to `.env.local`:
```env
VITE_GEMINI_KEY_PRIMARY=your_gemini_primary_api_key
VITE_GEMINI_KEY_SECONDARY=your_gemini_secondary_api_key
```

### Development Server
```bash
npm run dev
```

### Production Build
```bash
npm run build
npm run preview
```

---

## 🔒 Security & Privacy
- All personal habit data and daily logs are stored locally on your device (`localStorage`).
- API keys can be managed via environment variables or customized inside the in-app Settings modal.
- `.env` and `.env.local` are strictly excluded from git tracking.

---

## 📄 License
MIT License. Created with ❤️ for relentless self-improvement.
