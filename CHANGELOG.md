# Changelog

All notable changes to Mandarin Tutor will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [9.0.0] - 2025-12-10

### Added
- **Student Guide Icon Navigation** - Icon-based tabs matching teacher dashboard
- 7 color-coded tabs: Overview (Blue), Goals (Green), Recs (Yellow), Materials (Purple), Improve (Orange), News (Red), Notes (Indigo)
- Close button (X) on student guide header
- Mobile-first responsive header for student guide
- Gradient background (red-to-pink) for consistency

### Changed
- Teacher name from "Zhang" to "Liwen"
- Teacher email from zhang@mandarintutor.com to liwen@mandarintutor.com
- Student guide header matches teacher dashboard style
- Navigation text abbreviated on mobile (Over, Goals, Recs, etc.)

### Design
- Unified visual language across all roles
- Consistent icon-based navigation system
- Touch-friendly 60px+ tap targets throughout
- No horizontal scrollbars on any panel

---

## [8.0.0] - 2025-12-09

### Added
- **Teacher Dashboard Mobile-First Redesign** - Icon-based navigation
- 6 color-coded tabs with icons (Students, Notes, Improve, Materials, Announce, Lessons)
- Close button (X) on teacher dashboard
- Touch-friendly tap targets (60px+ height)
- Bottom-sheet modals on mobile
- Gradient header background

### Changed
- Teacher navigation from text-only to icon + text
- Tab layout optimized for mobile (no scrollbar)
- Student cards redesigned with rounded corners
- Modal presentation improved for mobile

### Design
- Color-coded sections: Blue, Purple, Orange, Green, Red, Indigo
- Responsive text (smaller on mobile, full on desktop)
- Active state with colored background + border
- Mobile-first layout structure

---

## [7.0.0] - 2025-12-09

### Added
- **Learning Materials** - Teachers can upload links and assign to students
- **Areas to Improve** - Teachers can add targeted feedback for students
- **Global Announcements** - Teachers can post messages to all students
- Student study guide expanded to 7 tabs
- Materials, Improve, and Announcements tabs in student view
- Close buttons on all panels

### Changed
- Study guide now has 7 tabs instead of 4
- Teacher dashboard now has 6 tabs
- Admin panel includes close button

### Fixed
- Missing icon imports in Header.jsx (Users, Shield)

---

## [6.0.0] - 2025-12-09

### Fixed
- Missing Lucide React icon imports in Header.jsx
- Added Users and Shield icons to import statement

---

## [5.0.0] - 2025-12-08

### Added
- **Automatic Chinese Punctuation** - Smart punctuation for speech-to-text
- Question detection (吗, 什么, 谁, 怎么, etc.)
- Exclamation detection (太, 真, 多, 好, 非常, etc.)
- Comma insertion at natural pauses
- Period at sentence ends
- New utility: `src/utils/punctuation.js`

### Changed
- Speech recognition hook now applies punctuation automatically
- Improved text flow for transcribed speech

---

## [4.0.0] - 2025-12-08

### Added
- **Authentication System** - Login with 3 role types
- **Role-Based Access Control** - Admin, Teacher, Student roles
- **Study Guide System** - AI-powered personalized learning
- **Teacher Dashboard** - Classroom management interface
- **Admin Panel** - User management system
- AuthContext for user state management
- StudyGuideContext for learning data
- LoginPage component
- Progress tracking (vocabulary, fluency, conversations)
- Weekly goals with completion tracking
- Teacher observations
- AI-generated study recommendations
- Demo accounts for testing

### Security
⚠️ **Development only** - Plain text passwords, no backend auth
- Use environment variables for API keys in production
- Implement proper authentication before deployment

---

## [3.0.0] - 2025-12-07

### Added
- **CORS Proxy Server** - Local development proxy for API calls
- `proxy-server.js` for handling CORS issues
- New npm script: `npm run dev:full`

### Changed
- Development workflow now uses proxy server
- API calls routed through localhost:3001

---

## [2.0.0] - 2025-12-07

### Added
- **Multiple Log Files** - Separate logs for errors, info, debug, AI
- **Dark Theme Support** - Toggle between light/dark modes
- **Voice Gender Selection** - Choose male or female voice
- Enhanced logger utility with log rotation

### Fixed
- Speech recognition start/stop bug
- Memory leaks in speech hooks
- Console error handling

### Changed
- Improved error messages
- Better logging structure
- UI polish and refinements

---

## [1.0.0] - 2025-12-06

### Added
- Initial release
- AI-powered Mandarin conversation practice
- Support for Claude, GPT-4, and Gemini
- Speech recognition (Web Speech API)
- Text-to-speech with Chinese voices
- Pinyin display toggle
- English translation toggle
- Error correction mode
- Difficulty level selection (Beginner to Native)
- Conversation history
- Custom API provider support
- Settings panel
- Advanced settings (temperature, max tokens)

### Core Features
- Real-time AI conversations
- Voice input and output
- Translation assistance
- Progress tracking
- Multiple AI model support

---

## Types of Changes

- `Added` - New features
- `Changed` - Changes in existing functionality
- `Deprecated` - Soon-to-be removed features
- `Removed` - Removed features
- `Fixed` - Bug fixes
- `Security` - Security updates

---

## Version Format

**MAJOR.MINOR.PATCH**

- **MAJOR** - Incompatible API changes, major rewrites
- **MINOR** - New features, backwards compatible
- **PATCH** - Bug fixes, small improvements

---

## Upcoming Releases

### [10.0.0] - Planned
- Lesson plan implementation
- Real-time notifications
- Progress charts and graphs
- Export student reports (PDF)
- Bulk operations for teachers

### [11.0.0] - Future
- Supabase PostgreSQL integration
- Production authentication (JWT)
- Password hashing (bcrypt)
- Secure API key storage
- Email password reset
- File uploads (images, documents)

### [12.0.0] - Future
- React Native mobile app
- Offline mode
- Push notifications
- Video call integration
- Gamification (badges, streaks, levels)
- Advanced analytics dashboard

---

## Links

- **GitHub Repo**: https://github.com/yourusername/mandarin-tutor
- **Documentation**: See VERSION_HISTORY.md
- **Latest Changes**: See V9_CHANGES_ONLY.md
- **Contributing**: See CONTRIBUTING.md

---

*Format inspired by [Keep a Changelog](https://keepachangelog.com/)*