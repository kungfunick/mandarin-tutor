# 🇨🇳 Mandarin Tutor - AI-Powered Chinese Learning Platform

A comprehensive, mobile-first web application for learning Mandarin Chinese with AI-powered conversations, role-based classroom management, and personalized study guidance.

![Version](https://img.shields.io/badge/version-12.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![React](https://img.shields.io/badge/react-19.2.3-61dafb)
![Vite](https://img.shields.io/badge/vite-6.0.7-646cff)
![Tailwind](https://img.shields.io/badge/tailwind-3.4.17-38bdf8)
![Supabase](https://img.shields.io/badge/supabase-2.87.1-3ecf8e)

---

## ✨ Features

### 🎯 Core Learning Features

- **AI-Powered Conversations** - Practice Mandarin with Claude, GPT-4, or Gemini
- **Speech Recognition** - Speak in Chinese and see your text transcribed
- **Text-to-Speech** - Hear proper pronunciation with native voices
- **Automatic Punctuation** - Smart Chinese punctuation (。？！，) for speech input
- **Pinyin & Translation** - Toggle romanization and English translations
- **Error Correction Mode** - Get instant feedback on grammar and usage
- **Difficulty Levels** - Beginner, Intermediate, Advanced, Native
- **Dark Theme** - Eye-friendly interface for extended study sessions

### 👥 Role-Based System (3 User Types)

#### 📚 **Students**
- Personalized study guide with 7 tabs:
  - **Overview** - Vocabulary count, fluency score, strengths/weaknesses
  - **Progress** - Visual charts showing learning trajectory
  - **Goals** - Weekly learning objectives with progress tracking
  - **Tips** - AI-generated study recommendations
  - **Materials** - Learning resources from teacher
  - **Improve** - Targeted feedback from teacher
  - **News** - Important announcements from teacher
- Progress tracking across conversations
- Mobile-optimized icon navigation

#### 👨‍🏫 **Teachers**
- Teacher dashboard (side panel) with 6 tabs:
  - **Students** - View all assigned students with progress stats
  - **Groups** - Create and manage student groups
  - **Overview** - Class-wide statistics and charts
  - **Notes** - Add and view observations for students
  - **Materials** - Upload and share learning resources (links)
  - **Announce** - Post messages to all students or groups
- Student detail view with quick actions
- Assign/unassign students
- Group-based content targeting
- Mobile-first design with touch-friendly interface

#### 🔐 **Admins**
- Administration panel with 3 tabs:
  - **Users** - Search, add, edit, delete users
  - **Permissions** - View role-based permission matrix
  - **System** - Database status and system info
- User management (create, update, delete)
- Password reset functionality
- Role assignment and permissions
- Debug/logging controls (admin only)

### 📱 Mobile-First Design

- **Icon-based navigation** - Clear visual hierarchy
- **No horizontal scrollbars** - All tabs fit on screen
- **Touch-friendly** - 60px+ tap targets throughout
- **Color-coded sections** - Easy mental mapping
- **Responsive breakpoints** - Works on 320px+ screens
- **Bottom-sheet modals** - Native app-like experience on mobile

### 🔧 Advanced Features

- **Production Database** - PostgreSQL via Supabase
- **Real-time Updates** - Live data synchronization
- **Row Level Security** - Server-enforced access control
- **Multiple Log Files** - Separate logs for errors, info, debug, and AI
- **Conversation History** - Browse and reload past sessions
- **Custom API Providers** - Add your own AI endpoints
- **Voice Gender Selection** - Choose male or female voice
- **CORS Proxy** - Built-in proxy for local development

---

## 🛠️ Tech Stack

### Frontend
- **React 19** - UI library with hooks
- **Vite 6** - Build tool and dev server
- **Tailwind CSS 3.4** - Utility-first styling
- **Lucide React** - Icon library
- **Recharts** - Data visualization
- **Context API** - State management

### Backend
- **Supabase** - PostgreSQL database + Auth + Real-time
- **Row Level Security** - Server-enforced permissions
- **JWT Authentication** - Secure token-based auth

### APIs
- **Anthropic Claude** - Primary AI model
- **OpenAI GPT-4** - Alternative AI model
- **Google Gemini** - Alternative AI model
- **Web Speech API** - Browser speech recognition
- **Speech Synthesis API** - Browser text-to-speech

### Deployment
- **Vercel** - Frontend hosting (free tier)
- **Supabase** - Database hosting (free tier)

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Supabase account (free at supabase.com)
- API key for AI provider (Claude, OpenAI, or Gemini)

### Installation

```bash
# Clone the repository
git clone https://github.com/kungfunick/mandarin-tutor.git
cd mandarin-tutor

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit .env with your Supabase credentials
# VITE_SUPABASE_URL=your_url_here
# VITE_SUPABASE_ANON_KEY=your_key_here

# Start development server
npm run dev
```

### Supabase Setup

1. Create account at [supabase.com](https://supabase.com)
2. Create new project
3. Go to SQL Editor
4. Run the migration from `supabase/migrations/20250101000000_initial_schema.sql`
5. Go to Settings → API and copy your URL and anon key
6. Add credentials to `.env` file

### Create First Admin

After registering your first user:

```sql
-- In Supabase SQL Editor:
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'your-email@example.com';
```

---

## 📁 Project Structure

```
mandarin-tutor/
├── src/
│   ├── components/           # React components
│   │   ├── AdminPanel.jsx            # Admin user management
│   │   ├── TeacherDashboard.jsx      # Teacher classroom view (panel)
│   │   ├── StudyGuidePanel.jsx       # Student learning hub
│   │   ├── LoginPage.jsx             # Authentication UI
│   │   ├── MandarinTutor.jsx         # Main chat interface
│   │   ├── Header.jsx                # Top navigation
│   │   ├── SettingsPanel.jsx         # App configuration
│   │   ├── HistoryPanel.jsx          # Past conversations
│   │   ├── ProgressCharts.jsx        # Data visualizations
│   │   └── ...
│   ├── contexts/             # React contexts
│   │   ├── AuthContext.jsx           # Supabase authentication
│   │   └── StudyGuideContext.jsx     # Learning data management
│   ├── hooks/                # Custom React hooks
│   │   ├── useSpeechRecognition.js   # Voice input
│   │   ├── useTextToSpeech.js        # Voice output
│   │   ├── useLocalStorage.js        # Client preferences
│   │   └── useRealtime.js            # Supabase subscriptions
│   ├── services/             # External services
│   │   ├── aiService.js              # AI API integration
│   │   ├── supabase.js               # Supabase client
│   │   └── database.js               # CRUD operations
│   ├── utils/                # Utility functions
│   │   ├── logger.js                 # Multi-file logging
│   │   └── punctuation.js            # Chinese punctuation
│   ├── App.jsx               # Main app component
│   ├── index.jsx             # Entry point
│   └── index.css             # Global styles
├── supabase/
│   └── migrations/           # Database schema
├── proxy-server.js           # CORS proxy for development
├── package.json
├── vite.config.js
├── postcss.config.js
├── tailwind.config.js
└── .env.example
```

---

## 🔑 API Configuration

Configure your AI provider in Settings:

### Anthropic Claude (Recommended)
```
Provider: Anthropic
API Key: sk-ant-...
Model: claude-sonnet-4-20250514
```

### OpenAI
```
Provider: OpenAI
API Key: sk-...
Model: gpt-4-turbo-preview
```

### Google Gemini
```
Provider: Google
API Key: AIza...
Model: gemini-pro
```

---

## 👤 User Roles & Permissions

| Permission | Student | Teacher | Admin |
|------------|---------|---------|-------|
| Chat with AI | ✅ | ✅ | ✅ |
| View own progress | ✅ | ✅ | ✅ |
| View study guide | ✅ | ✅ | ✅ |
| Update own profile | ✅ | ✅ | ✅ |
| Adjust microphone | ✅ | ✅ | ✅ |
| View assigned students | ❌ | ✅ | ✅ |
| Add observations | ❌ | ✅ | ✅ |
| Share materials | ❌ | ✅ | ✅ |
| Post announcements | ❌ | ✅ | ✅ |
| Create groups | ❌ | ✅ | ✅ |
| Manage all users | ❌ | ❌ | ✅ |
| Reset passwords | ❌ | ❌ | ✅ |
| Adjust roles | ❌ | ❌ | ✅ |
| Debug/logging controls | ❌ | ❌ | ✅ |
| API model selection | ❌ | ❌ | ✅ |

---

## 🗄️ Database Schema

### Tables (7)

1. **profiles** - User accounts with roles (admin/teacher/student)
2. **study_guides** - Student progress and learning stats
3. **observations** - Teacher notes about students
4. **learning_materials** - Resources shared by teachers
5. **areas_to_improve** - Targeted feedback for students
6. **announcements** - Teacher messages to students/groups
7. **conversations** - Chat history

### Additional Tables (Groups)

8. **teacher_groups** - Group definitions
9. **group_members** - Student-group relationships

All tables include Row Level Security (RLS) policies.

---

## 🚢 Deployment

### Deploy to Vercel (Recommended)

```bash
# Push to GitHub
git add .
git commit -m "Deploy v12"
git push

# Then in Vercel:
# 1. Import GitHub repository
# 2. Add environment variables:
#    - VITE_SUPABASE_URL
#    - VITE_SUPABASE_ANON_KEY
# 3. Deploy!
```

### Build Commands

```bash
npm run dev       # Development server (port 3000)
npm run build     # Production build
npm run preview   # Preview production build
npm run proxy     # CORS proxy server (port 3001)
```

---

## 💰 Cost

### Free Tier (Perfect for Beta)
- **Supabase**: $0 (500MB database, 50K users)
- **Vercel**: $0 (100GB bandwidth)
- **Total**: $0/month

### When You Scale
- **Supabase Pro**: $25/month (8GB database)
- **Vercel Pro**: $20/month (1TB bandwidth)

---

## 📚 Documentation

- **V12_CHANGES_ONLY.md** - Latest updates
- **V12_COMPLETE_GUIDE.md** - Full setup guide
- **VERSION_HISTORY.md** - Complete changelog

---

## 🐛 Troubleshooting

### CSS Not Loading
1. Ensure using Tailwind v3.4 (not v4)
2. Check `postcss.config.js` has `tailwindcss: {}`
3. Check `index.css` has `@tailwind` directives
4. Delete `node_modules` and reinstall

### Can't Connect to Supabase
1. Check `.env` has correct URL and key
2. Restart dev server after changing `.env`
3. Verify Supabase project is not paused

### Authentication Fails
1. Verify user exists in Supabase dashboard
2. Check password (min 6 characters)
3. Check browser console for errors

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing`)
3. Make changes and test all roles
4. Commit (`git commit -m "Add amazing feature"`)
5. Push (`git push origin feature/amazing`)
6. Open Pull Request

---

## 📄 License

MIT License - see LICENSE file for details

---

## 🙏 Acknowledgments

- **Anthropic** - Claude AI API
- **OpenAI** - GPT models
- **Google** - Gemini AI
- **Supabase** - Database and Auth
- **Tailwind CSS** - Styling framework
- **Lucide** - Icon library
- **Vite** - Build tool
- Chinese language learning community

---

## 📊 Project Stats

- **Version**: 12.0.0
- **Created**: December 2025
- **Components**: 15+
- **Database Tables**: 9
- **Supported Roles**: 3
- **Languages**: Chinese (Mandarin), English

---

**Made with ❤️ for Mandarin learners everywhere**