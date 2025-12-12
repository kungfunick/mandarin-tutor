# Version History

Complete changelog for Mandarin Tutor. Each version includes what changed, files modified, and migration notes.

---

## V12.0.0 - CSS Fix & Layout Fix (Current)
**Date:** December 2025  
**Focus:** Critical bug fixes

### Changed Files: 6
1. `package.json` - Downgraded Tailwind to v3.4.17
2. `vite.config.js` - Removed @tailwindcss/vite plugin
3. `postcss.config.js` - Standard v3 PostCSS config
4. `tailwind.config.js` - Required v3 config file
5. `src/index.css` - Changed to @tailwind directives
6. `src/components/TeacherDashboard.jsx` - Fixed panel layout

### Issues Fixed:
- ✅ Tailwind CSS classes not rendering (v4 → v3 downgrade)
- ✅ Teacher Dashboard appearing as modal instead of side panel

### Breaking Changes: None

### Migration: Replace 6 files, clean install

---

## V11.0.0 - Teacher Groups & Charts
**Date:** December 2025  
**Focus:** Enhanced teacher functionality

### Changed Files: 3
1. `src/components/TeacherDashboard.jsx` - Added groups, charts
2. `src/components/ProgressCharts.jsx` - New chart components
3. `supabase/migrations/` - Added group tables

### Features Added:
- ✅ Student groups with database persistence
- ✅ Teacher overview charts
- ✅ Group-based content targeting
- ✅ Batch operations for observations
- ✅ Group statistics visualization

### Database Changes:
- Added `teacher_groups` table
- Added `group_members` table

### Breaking Changes: None (new tables only)

---

## V10.0.0 - Supabase Integration
**Date:** December 2025  
**Focus:** Production database

### New Files: 7
1. `src/services/supabase.js` - Supabase client + auth
2. `src/services/database.js` - All CRUD operations
3. `src/hooks/useRealtime.js` - Real-time subscriptions
4. `supabase/migrations/20250101000000_initial_schema.sql` - Database schema
5. `.env.example` - Environment template
6. `V10_COMPLETE_GUIDE.md` - Setup guide
7. Updated `package.json` - Added @supabase/supabase-js

### Updated Files: 2
8. `src/contexts/AuthContext.jsx` - Supabase authentication
9. `src/contexts/StudyGuideContext.jsx` - Database-backed data

### Features Added:
- ✅ PostgreSQL database via Supabase
- ✅ Production authentication (JWT)
- ✅ Row Level Security (RLS)
- ✅ Real-time data synchronization
- ✅ Password reset via email
- ✅ Free cloud deployment (Vercel + Supabase)

### Database Schema (7 Tables):
1. `profiles` - User accounts
2. `study_guides` - Student progress
3. `observations` - Teacher notes
4. `learning_materials` - Shared resources
5. `areas_to_improve` - Student feedback
6. `announcements` - Teacher messages
7. `conversations` - Chat history

### Breaking Changes:
- ⚠️ localStorage → PostgreSQL (data migration needed)
- ⚠️ Users must re-register
- ⚠️ Requires .env configuration

---

## V9.0.0 - Student Guide Redesign
**Date:** December 2025  
**Focus:** UI consistency

### Changed Files: 2
1. `src/components/StudyGuidePanel.jsx` - Icon navigation
2. `src/contexts/AuthContext.jsx` - Teacher name update

### Features Added:
- ✅ Icon-based navigation for student guide (7 tabs)
- ✅ Color-coded tabs matching teacher dashboard
- ✅ Close button (X) on student guide
- ✅ Mobile-first responsive header
- ✅ Teacher renamed from "Zhang" to "Liwen"

### Design:
- Overview (Blue), Goals (Green), Recs (Yellow)
- Materials (Purple), Improve (Orange), News (Red), Notes (Indigo)

### Breaking Changes: None

---

## V8.0.0 - Teacher Dashboard Redesign
**Date:** December 2025  
**Focus:** Mobile-first teacher UI

### Changed Files: 2
1. `src/components/TeacherDashboard.jsx` - Complete redesign
2. `src/components/Header.jsx` - Icon updates

### Features Added:
- ✅ Icon-based navigation (6 tabs)
- ✅ Color-coded sections
- ✅ Close button (X)
- ✅ Touch-friendly tap targets (60px+)
- ✅ Bottom-sheet modals on mobile
- ✅ Gradient header background

### Design:
- Students (Blue), Notes (Purple), Improve (Orange)
- Materials (Green), Announce (Red), Lessons (Indigo)

### Breaking Changes: None

---

## V7.0.0 - Teacher Content Features
**Date:** December 2025  
**Focus:** Teacher-student communication

### Changed Files: 6
1. `src/components/TeacherDashboard.jsx` - New tabs
2. `src/components/StudyGuidePanel.jsx` - New tabs
3. `src/contexts/StudyGuideContext.jsx` - New functions
4. `src/components/Header.jsx` - Icon imports fix
5. `src/components/AdminPanel.jsx` - Close button
6. Various component updates

### Features Added:
- ✅ Learning Materials - Teachers share links
- ✅ Areas to Improve - Targeted feedback
- ✅ Global Announcements - Teacher messages
- ✅ Student guide expanded to 7 tabs
- ✅ Teacher dashboard expanded to 6 tabs
- ✅ Close buttons on all panels

### Breaking Changes: None

---

## V6.0.0 - Icon Fix
**Date:** December 2025  
**Focus:** Bug fix

### Changed Files: 1
1. `src/components/Header.jsx` - Added missing imports

### Fixed:
- ✅ Missing Lucide React icon imports (Users, Shield)

### Breaking Changes: None

---

## V5.0.0 - Chinese Punctuation
**Date:** December 2025  
**Focus:** Speech enhancement

### New Files: 1
1. `src/utils/punctuation.js` - Punctuation utility

### Changed Files: 1
2. `src/hooks/useSpeechRecognition.js` - Auto-punctuation

### Features Added:
- ✅ Automatic Chinese punctuation for speech-to-text
- ✅ Question detection (吗, 什么, 谁, 怎么, etc.)
- ✅ Exclamation detection (太, 真, 多, 好, 非常, etc.)
- ✅ Comma insertion at natural pauses
- ✅ Period at sentence ends

### Breaking Changes: None

---

## V4.0.0 - Authentication System
**Date:** December 2025  
**Focus:** User management

### New Files: 8
1. `src/contexts/AuthContext.jsx` - User authentication
2. `src/contexts/StudyGuideContext.jsx` - Learning data
3. `src/components/LoginPage.jsx` - Login UI
4. `src/components/AdminPanel.jsx` - Admin management
5. `src/components/TeacherDashboard.jsx` - Teacher view
6. `src/components/StudyGuidePanel.jsx` - Student view
7. Plus component updates

### Features Added:
- ✅ Login system with 3 role types
- ✅ Role-Based Access Control (Admin, Teacher, Student)
- ✅ Study Guide System - AI-powered learning
- ✅ Teacher Dashboard - Classroom management
- ✅ Admin Panel - User management
- ✅ Progress tracking (vocabulary, fluency, conversations)
- ✅ Weekly goals with completion tracking
- ✅ Teacher observations
- ✅ AI-generated study recommendations
- ✅ Demo accounts for testing

### Security Note:
⚠️ V4 used localStorage - development only, not production-ready

### Breaking Changes:
- ⚠️ Major - New authentication system
- ⚠️ New contexts required

---

## V3.0.0 - CORS Proxy
**Date:** December 2025  
**Focus:** Development tooling

### New Files: 1
1. `proxy-server.js` - CORS proxy server

### Changed Files: 1
2. `package.json` - Added proxy script

### Features Added:
- ✅ CORS proxy server for local development
- ✅ Handles API requests without CORS issues
- ✅ New npm script: `npm run dev:full`

### Breaking Changes: None

---

## V2.0.0 - Bug Fixes & Enhancements
**Date:** December 2025  
**Focus:** UX improvements

### Changed Files: 4
1. `src/utils/logger.js` - Multiple log files
2. `src/components/MandarinTutor.jsx` - Bug fixes
3. `src/index.css` - Dark theme
4. `src/components/SettingsPanel.jsx` - Voice gender

### Features Added:
- ✅ Multiple log files (error, info, debug, ai)
- ✅ Dark theme support
- ✅ Voice gender selection (male/female)

### Fixed:
- ✅ Speech recognition start/stop bug
- ✅ Memory leaks in speech hooks
- ✅ Better error handling

### Breaking Changes: None

---

## V1.0.0 - Initial Release
**Date:** December 2025  
**Focus:** Core functionality

### Features:
- ✅ AI-powered Mandarin conversation practice
- ✅ Support for Claude, GPT-4, and Gemini
- ✅ Speech recognition (Web Speech API)
- ✅ Text-to-speech with Chinese voices
- ✅ Pinyin display toggle
- ✅ English translation toggle
- ✅ Error correction mode
- ✅ Difficulty level selection (Beginner to Native)
- ✅ Conversation history
- ✅ Custom API provider support
- ✅ Settings panel
- ✅ Advanced settings (temperature, max tokens)

---

## Quick Reference

| Version | Focus | Files Changed | Breaking? |
|---------|-------|---------------|-----------|
| V12 | CSS Fix, Layout Fix | 6 | No |
| V11 | Teacher Groups | 3 | No |
| V10 | Supabase Database | 9 | Yes |
| V9 | Student Guide UI | 2 | No |
| V8 | Teacher Dashboard UI | 2 | No |
| V7 | Teacher Content | 6 | No |
| V6 | Icon Fix | 1 | No |
| V5 | Punctuation | 2 | No |
| V4 | Auth System | 8+ | Yes |
| V3 | CORS Proxy | 2 | No |
| V2 | Bug Fixes | 4 | No |
| V1 | Initial | - | - |

---

## Feature Matrix

| Feature | V1 | V2 | V3 | V4 | V5 | V6 | V7 | V8 | V9 | V10 | V11 | V12 |
|---------|----|----|----|----|----|----|----|----|----|----|-----|-----|
| AI Chat | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Speech Recognition | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Text-to-Speech | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Dark Theme | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| CORS Proxy | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Login System | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Role-Based Access | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Study Guide | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Auto Punctuation | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Materials | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Announcements | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Mobile-First UI | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| PostgreSQL DB | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| Real-time Updates | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| Student Groups | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| Progress Charts | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |

---

## Migration Guides

### V11 → V12
1. Replace 6 config/component files
2. `rm -rf node_modules && npm install`
3. Test and deploy

### V10 → V11
1. Add new group tables to Supabase
2. Update TeacherDashboard.jsx
3. Add ProgressCharts.jsx

### V9 → V10
1. Create Supabase project
2. Run migration SQL
3. Configure .env
4. Replace contexts and services
5. Create first admin user

### Earlier Versions
See individual version documentation or start fresh with V12.

---

## Roadmap

### V13 (Planned)
- [ ] Lesson plan implementation
- [ ] Real-time notifications
- [ ] Export reports (PDF)
- [ ] Bulk operations UI

### V14 (Future)
- [ ] Mobile app (React Native)
- [ ] Offline mode
- [ ] Push notifications
- [ ] Video call integration

### V15 (Future)
- [ ] Gamification (badges, streaks)
- [ ] Spaced repetition system
- [ ] Voice analysis/feedback
- [ ] Multi-language support

---

## Support

- **GitHub Issues** - Bug reports and feature requests
- **Documentation** - README.md, COMPLETE_GUIDE.md
- **Version Docs** - VX_CHANGES_ONLY.md for each version

---

**Current Version: 12.0.0**  
**Last Updated: December 2025**