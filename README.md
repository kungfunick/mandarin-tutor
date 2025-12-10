# Mandarin Tutor - AI-Powered Chinese Learning Platform

A comprehensive, mobile-first web application for learning Mandarin Chinese with AI-powered conversations, role-based classroom management, and personalized study guidance.

![Version](https://img.shields.io/badge/version-9.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![React](https://img.shields.io/badge/react-18.2.0-61dafb)
![Vite](https://img.shields.io/badge/vite-4.4.5-646cff)

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
  - **Goals** - Weekly learning objectives with progress tracking
  - **Recommendations** - AI-generated study suggestions
  - **Materials** - Learning resources from teacher
  - **Areas to Improve** - Targeted feedback from teacher
  - **Announcements** - Important messages from teacher
  - **Notes** - Teacher observations and comments
- Progress tracking across conversations
- Mobile-optimized icon navigation

#### 👨‍🏫 **Teachers**
- Teacher dashboard with 6 tabs:
  - **Students** - View all assigned students with progress stats
  - **Notes** - Add and view observations for students
  - **Areas to Improve** - Set improvement goals for students
  - **Materials** - Upload and share learning resources (links)
  - **Announcements** - Post messages to all students
  - **Lessons** - Create lesson plans (coming soon)
- Student detail view with quick actions
- Global vs. student-specific content visibility
- Mobile-first design with touch-friendly interface

#### 🔐 **Admins**
- Administration panel with 3 tabs:
  - **Users** - Search, add, edit, delete users
  - **Permissions** - View role-based permission matrix
  - **System Settings** - Database status and system info
- User management (create, update, delete)
- Password reset functionality
- Role assignment and permissions

### 📱 Mobile-First Design
- **Icon-based navigation** - Clear visual hierarchy
- **No horizontal scrollbars** - All tabs fit on screen
- **Touch-friendly** - 60px+ tap targets throughout
- **Color-coded sections** - Easy mental mapping
- **Responsive breakpoints** - Works on 320px+ screens
- **Bottom-sheet modals** - Native app-like experience on mobile

### 🔧 Advanced Features
- **Multiple Log Files** - Separate logs for errors, info, debug, and AI
- **Conversation History** - Browse and reload past sessions
- **Custom API Providers** - Add your own AI endpoints
- **Voice Gender Selection** - Choose male or female voice
- **CORS Proxy** - Built-in proxy for local development
- **Real-time Updates** - Dynamic progress tracking

---

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ and npm
- API key for AI provider (Claude, OpenAI, or Gemini)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/mandarin-tutor.git
cd mandarin-tutor

# Install dependencies
npm install

# Start development servers (app + CORS proxy)
npm run dev:full

# Or start separately:
npm run dev        # App only (port 5173)
npm run proxy      # CORS proxy (port 3001)
```

### Configuration

1. **Open the app** at http://localhost:5173
2. **Login** with demo credentials (see below)
3. **Configure API** in Settings:
   - Choose AI provider (Claude/OpenAI/Gemini)
   - Enter your API key
   - Select model and parameters

### Demo Credentials

| Role | Username | Password | Description |
|------|----------|----------|-------------|
| Admin | `admin` | `admin123` | Full system access |
| Teacher | `teacher1` | `teacher123` | Teacher Liwen (manages students) |
| Student | `student1` | `student123` | Student Wang (assigned to Liwen) |
| Student | `student2` | `student123` | Student Li (assigned to Liwen) |

---

## 📖 Usage Guide

### For Students

1. **Login** with student credentials
2. **Start chatting** in Mandarin Chinese
3. **Use voice input** by clicking the microphone button
4. **View study guide** by clicking the book icon in header
5. **Check progress** in the Overview tab
6. **Complete goals** in the Goals tab
7. **Review materials** shared by your teacher
8. **Read feedback** in Areas to Improve tab

### For Teachers

1. **Login** with teacher credentials
2. **Access dashboard** by clicking the users icon
3. **View students** and their progress
4. **Add observations** by clicking on a student
5. **Upload materials** in the Materials tab
6. **Set improvement areas** for specific students
7. **Post announcements** to all students
8. **Track overall progress** across all students

### For Admins

1. **Login** with admin credentials
2. **Access admin panel** by clicking the shield icon
3. **Manage users** - add, edit, delete accounts
4. **Reset passwords** for any user
5. **View permissions** for each role
6. **Monitor system** status

---

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI library
- **Vite 4** - Build tool and dev server
- **Tailwind CSS 3** - Utility-first styling
- **Lucide React** - Icon library
- **Context API** - State management

### APIs
- **Anthropic Claude** - Primary AI model
- **OpenAI GPT-4** - Alternative AI model
- **Google Gemini** - Alternative AI model
- **Web Speech API** - Browser speech recognition
- **Speech Synthesis API** - Browser text-to-speech

### Storage
- **LocalStorage** - Client-side data persistence
- *Coming soon: Supabase PostgreSQL for production*

---

## 📁 Project Structure

```
mandarin-tutor/
├── src/
│   ├── components/          # React components
│   │   ├── AdminPanel.jsx           # Admin user management
│   │   ├── TeacherDashboard.jsx     # Teacher classroom view
│   │   ├── StudyGuidePanel.jsx      # Student learning hub
│   │   ├── LoginPage.jsx            # Authentication UI
│   │   ├── MandarinTutor.jsx        # Main chat interface
│   │   ├── Header.jsx               # Top navigation
│   │   ├── SettingsPanel.jsx        # App configuration
│   │   ├── HistoryPanel.jsx         # Past conversations
│   │   └── ...
│   ├── contexts/            # React contexts
│   │   ├── AuthContext.jsx          # User authentication
│   │   └── StudyGuideContext.jsx    # Learning data
│   ├── hooks/               # Custom React hooks
│   │   ├── useSpeechRecognition.js  # Voice input
│   │   ├── useTextToSpeech.js       # Voice output
│   │   └── useLocalStorage.js       # Persistent storage
│   ├── services/            # External services
│   │   └── aiService.js             # AI API integration
│   ├── utils/               # Utility functions
│   │   ├── logger.js                # Multi-file logging
│   │   └── punctuation.js           # Chinese punctuation
│   └── ...
├── proxy-server.js          # CORS proxy for development
├── package.json
├── vite.config.js
└── tailwind.config.js
```

---

## 🔑 API Configuration

### Anthropic Claude (Recommended)

```javascript
Provider: Anthropic
API Key: sk-ant-...
Model: claude-sonnet-4-20250514
Max Tokens: 1000
Temperature: 0.7
```

### OpenAI

```javascript
Provider: OpenAI
API Key: sk-...
Model: gpt-4-turbo-preview
Max Tokens: 1000
Temperature: 0.7
```

### Google Gemini

```javascript
Provider: Google
API Key: AIza...
Model: gemini-pro
Max Tokens: 1000
Temperature: 0.7
```

### Custom Providers

You can add custom API endpoints in Settings:
1. Click "Add Custom Provider"
2. Enter name, endpoint URL, and API key
3. Configure model and parameters
4. Save and select your custom provider

---

## 🎨 Design System

### Color Palette

**Teacher Dashboard:**
- Students: Blue (#3B82F6)
- Notes: Purple (#9333EA)
- Improve: Orange (#EA580C)
- Materials: Green (#16A34A)
- Announce: Red (#DC2626)
- Lessons: Indigo (#4F46E5)

**Student Guide:**
- Overview: Blue (#3B82F6)
- Goals: Green (#16A34A)
- Recs: Yellow (#CA8A04)
- Materials: Purple (#9333EA)
- Improve: Orange (#EA580C)
- News: Red (#DC2626)
- Notes: Indigo (#4F46E5)

### Typography
- Headers: 18-24px
- Body: 14px
- Navigation: 10-12px (mobile), 12px (desktop)
- Minimum: 10px for mobile labels

### Spacing
- Mobile padding: 12-16px
- Desktop padding: 16-24px
- Gap between elements: 8-12px

---

## 🧪 Testing

```bash
# Run tests (when implemented)
npm test

# Build for production
npm run build

# Preview production build
npm run preview
```

### Manual Testing Checklist

**Core Features:**
- [ ] Login with all roles (admin, teacher, student)
- [ ] Send message and receive AI response
- [ ] Use voice input (microphone)
- [ ] Hear text-to-speech (speaker icon)
- [ ] Toggle translations and pinyin
- [ ] Switch between difficulty levels
- [ ] Enable/disable error correction mode

**Role-Specific:**
- [ ] **Student**: Open study guide, view all 7 tabs
- [ ] **Teacher**: Open dashboard, view students, add materials
- [ ] **Admin**: Open admin panel, manage users

**Mobile:**
- [ ] Resize to 375px width - all tabs visible
- [ ] All icons clear and tappable
- [ ] No horizontal scrollbars
- [ ] Modals slide from bottom

---

## 📦 Deployment

### Production Build

```bash
npm run build
```

Output in `dist/` folder.

### Deployment Options

**Recommended:**
- **Vercel** - Zero-config React deployment
- **Netlify** - Continuous deployment from Git
- **GitHub Pages** - Free static hosting

**Example (Vercel):**
```bash
npm install -g vercel
vercel
```

### Environment Variables

Create `.env` file:
```env
VITE_API_PROXY_URL=http://localhost:3001
```

For production, set appropriate proxy URL or remove if using direct API calls.

---

## 🔐 Security Notes

⚠️ **Current Implementation (Development Only):**
- Passwords stored in plain text
- No server-side authentication
- API keys stored in localStorage
- Mock user database

✅ **For Production (Coming):**
- Supabase PostgreSQL database
- bcrypt password hashing
- JWT token authentication
- Secure API key storage
- Row Level Security (RLS)
- HTTPS only
- Environment variable protection

**Do not use current auth system in production!**

---

## 🗺️ Roadmap

### V10 (Next Release)
- [ ] Lesson plan implementation
- [ ] Real-time notifications
- [ ] Student progress charts
- [ ] Export reports (PDF)
- [ ] Bulk operations for teachers

### V11 (Future)
- [ ] Supabase integration
- [ ] Production authentication
- [ ] Password reset emails
- [ ] File uploads (documents, images)
- [ ] Advanced analytics

### V12 (Future)
- [ ] Mobile app (React Native)
- [ ] Offline mode
- [ ] Push notifications
- [ ] Video call integration
- [ ] Gamification (badges, streaks)

---

## 📚 Documentation

- **V9_CHANGES_ONLY.md** - Latest updates
- **VERSION_HISTORY.md** - Complete changelog
- **MOBILE_FIRST_REDESIGN.md** - UI/UX documentation
- **AUTH_SYSTEM_GUIDE.md** - Authentication details
- **ROLE_BASED_VIEWS_GUIDE.md** - Role system documentation
- **INTEGRATION_INSTRUCTIONS.md** - Setup guide

---

## 🤝 Contributing

We welcome contributions! Here's how to help:

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Make your changes**
4. **Test thoroughly** (all roles, mobile view)
5. **Commit with clear messages**
   ```bash
   git commit -m "Add amazing feature"
   ```
6. **Push to your fork**
   ```bash
   git push origin feature/amazing-feature
   ```
7. **Open a Pull Request**

### Contribution Guidelines

- Follow existing code style
- Update documentation for new features
- Test on mobile and desktop
- No breaking changes to auth system without discussion
- Include before/after screenshots for UI changes

---

## 🐛 Bug Reports

Found a bug? Please open an issue with:
- Description of the problem
- Steps to reproduce
- Expected vs. actual behavior
- Screenshots (if applicable)
- Browser and device information

---

## 💬 Support

- **Issues**: GitHub Issues
- **Discussions**: GitHub Discussions
- **Email**: support@mandarintutor.com (coming soon)

---

## 📄 License

MIT License - see LICENSE file for details

---

## 🙏 Acknowledgments

- **Anthropic** - Claude AI API
- **OpenAI** - GPT models
- **Google** - Gemini AI
- **Tailwind CSS** - Styling framework
- **Lucide** - Icon library
- **Vite** - Build tool
- Chinese language learning community

---

## 📊 Project Stats

- **Version**: 9.0.0
- **Created**: December 2025
- **Lines of Code**: ~15,000
- **Components**: 15+
- **Features**: 50+
- **Supported Roles**: 3
- **Languages**: Chinese (Mandarin), English

---

## 🌟 Star History

If you find this project useful, please consider giving it a star! ⭐

---

## 📞 Contact

**Project Maintainer**: [Your Name]
**Email**: [your.email@example.com]
**GitHub**: [@yourusername](https://github.com/yourusername)

---

**Built with ❤️ for Chinese language learners worldwide** 🇨🇳

---

## Quick Links

- [Live Demo](#) (coming soon)
- [Documentation](./docs)
- [Changelog](./VERSION_HISTORY.md)
- [Contributing Guide](#contributing)
- [License](./LICENSE)

---

*Last Updated: December 2025 | Version 9.0.0*