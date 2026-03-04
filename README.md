# Dahar Engineer - Online Course Platform

A dark-themed online course platform built with React, TypeScript, Tailwind CSS, and PocketBase. Features progressive learning with step-by-step course completion, LaTeX formula support, and PDF certificate generation.

## Features

- **Dark Theme with Army Green Accent** - Inspired by daharengineer.com design
- **Progressive Learning** - Users must complete steps sequentially
- **Course Progress Tracking** - Visual progress bars and completion status
- **Rich Content Support** - HTML content with LaTeX formula rendering
- **Media Attachments** - Support for images, videos, files, and links
- **PDF Certificate Generation** - Download certificates upon course completion
- **Responsive Design** - Works on desktop and mobile devices

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Backend**: PocketBase
- **PDF Generation**: jsPDF + html2canvas
- **LaTeX Rendering**: KaTeX

## Prerequisites

- Node.js 18+
- PocketBase server running

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and update the PocketBase URL:

```bash
cp .env.example .env
```

Edit `.env`:
```
VITE_POCKETBASE_URL=http://127.0.0.1:8090
```

### 3. Setup PocketBase

1. Download and run PocketBase server
2. Create the following collections:

#### Collection: `users`
- Built-in auth collection
- Add field: `name` (text)
- Add field: `avatar` (file, optional)

#### Collection: `courses`
- `title` (text, required)
- `slug` (text, required, unique)
- `description` (text, required)
- `thumbnail` (file, optional)
- `instructor` (text, required)
- `duration` (text, required)
- `level` (select: beginner, intermediate, advanced)
- `totalModules` (number, required)
- `totalSteps` (number, required)

#### Collection: `modules`
- `courseId` (relation to courses, required)
- `title` (text, required)
- `description` (text)
- `order` (number, required)

#### Collection: `steps`
- `moduleId` (relation to modules, required)
- `title` (text, required)
- `content` (text, required) - HTML content
- `order` (number, required)
- `type` (select: text, video, quiz, assignment)
- `attachments` (json, optional)

#### Collection: `online_course_progress`
- `userId` (relation to users, required)
- `courseId` (relation to courses, required)
- `completedSteps` (json, default: [])
- `completedModules` (json, default: [])
- `currentStepId` (text, optional)
- `currentModuleId` (text, optional)
- `startedAt` (date, required)
- `completedAt` (date, optional)
- `lastAccessedAt` (date, required)
- `certificateIssued` (bool, default: false)
- `certificateUrl` (text, optional)

### 4. Run Development Server

```bash
npm run dev
```

### 5. Build for Production

```bash
npm run build
```

## Usage

1. Register a new account or login with existing credentials
2. Browse available courses on the home page
3. Click on a course to start learning
4. Complete steps sequentially - you cannot skip ahead
5. Track your progress with the visual progress bar
6. Download your certificate upon course completion

## Demo Credentials

- Email: `demo@dahar.engineer`
- Password: `demo123`

## License

MIT License - Dahar Engineer
