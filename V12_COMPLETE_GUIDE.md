# V12 Complete Implementation Guide

## ✅ What's in V12

V12 includes critical fixes for CSS styling and component layout, building on V10/V11's Supabase integration.

### Key Fixes
1. **Tailwind CSS v3** - Downgraded from v4 for stability
2. **Teacher Dashboard** - Fixed to render as side panel, not modal
3. **Consistent Layout** - All dashboards now use the same panel pattern

---

## 🚀 Quick Start (New Installation)

### Prerequisites
- Node.js 18+
- npm
- Supabase account (free)
- AI API key (Claude, OpenAI, or Gemini)

### Step 1: Clone & Install (5 min)

```bash
# Clone repository
git clone https://github.com/kungfunick/mandarin-tutor.git
cd mandarin-tutor

# Install dependencies
npm install
```

### Step 2: Setup Supabase (15 min)

1. **Create Account**: Go to [supabase.com](https://supabase.com) and sign up
2. **Create Project**: Click "New Project", choose a name and password
3. **Wait for Setup**: ~2 minutes for project initialization
4. **Run Migration**:
   - Go to SQL Editor in Supabase dashboard
   - Copy contents of `supabase/migrations/20250101000000_initial_schema.sql`
   - Paste and click "Run"
5. **Get API Keys**:
   - Go to Settings → API
   - Copy "Project URL" and "anon public" key

### Step 3: Configure Environment (2 min)

```bash
# Copy template
cp .env.example .env

# Edit .env file
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### Step 4: Create Admin User (3 min)

1. Start the app: `npm run dev`
2. Register a new account through the UI
3. In Supabase SQL Editor, run:

```sql
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'your-email@example.com';
```

4. Log out and log back in

### Step 5: Test (5 min)

- [ ] Login works
- [ ] CSS renders correctly (rounded buttons, shadows, colors)
- [ ] Admin Panel opens as side panel
- [ ] Can create teacher and student users
- [ ] Teacher Dashboard opens as side panel
- [ ] Study Guide opens as side panel

---

## 📦 File Structure

```
mandarin-tutor/
├── src/
│   ├── components/
│   │   ├── AdminPanel.jsx           # Admin management (panel)
│   │   ├── TeacherDashboard.jsx     # Teacher view (panel) ← FIXED
│   │   ├── StudyGuidePanel.jsx      # Student view (panel)
│   │   ├── LoginPage.jsx            # Auth UI
│   │   ├── MandarinTutor.jsx        # Main chat
│   │   ├── Header.jsx               # Navigation
│   │   ├── ProgressCharts.jsx       # Data viz
│   │   └── ...
│   ├── contexts/
│   │   ├── AuthContext.jsx          # Supabase auth
│   │   └── StudyGuideContext.jsx    # Learning data
│   ├── hooks/
│   │   ├── useSpeechRecognition.js  # Voice input
│   │   ├── useTextToSpeech.js       # Voice output
│   │   └── useRealtime.js           # Live updates
│   ├── services/
│   │   ├── supabase.js              # Supabase client
│   │   ├── database.js              # CRUD operations
│   │   └── aiService.js             # AI API
│   ├── utils/
│   │   ├── logger.js                # Logging
│   │   └── punctuation.js           # Chinese punctuation
│   ├── App.jsx
│   ├── index.jsx
│   └── index.css                    # Tailwind directives ← FIXED
├── supabase/
│   └── migrations/
│       └── 20250101000000_initial_schema.sql
├── package.json                     # Dependencies ← FIXED
├── vite.config.js                   # Vite config ← FIXED
├── postcss.config.js                # PostCSS ← FIXED
├── tailwind.config.js               # Tailwind v3 ← REQUIRED
└── .env.example
```

---

## 🗄️ Database Schema

### Core Tables

| Table | Purpose | RLS |
|-------|---------|-----|
| profiles | User accounts | Yes |
| study_guides | Student progress | Yes |
| observations | Teacher notes | Yes |
| learning_materials | Shared resources | Yes |
| areas_to_improve | Student feedback | Yes |
| announcements | Teacher messages | Yes |
| conversations | Chat history | Yes |
| teacher_groups | Group definitions | Yes |
| group_members | Group membership | Yes |

### Row Level Security

All tables enforce:
- Students see only their own data
- Teachers see their assigned students
- Admins see everything
- Server-side enforcement (cannot bypass)

---

## 🎨 UI Architecture

### Layout Pattern

```
┌─────────────────────────────────────────────┐
│  Header (fixed top)                         │
│  [Logo] [Chat] [Settings] [Guide] [Logout]  │
├─────────────────────────────────────────────┤
│                                             │
│  Main Content Area                          │
│  (Chat interface)                           │
│                                             │
├─────────────────────────────────────────────┤
│  Input Area (fixed bottom)                  │
│  [Mic] [Text Input] [Send]                  │
└─────────────────────────────────────────────┘

When panel opens:
┌───────────────────────┬─────────────────────┐
│                       │  Side Panel         │
│  Main Content         │  (Admin/Teacher/    │
│  (narrowed)           │   Study Guide)      │
│                       │                     │
│                       │  [Close X]          │
│                       │  [Tabs]             │
│                       │  [Content]          │
└───────────────────────┴─────────────────────┘
```

### Component Hierarchy

```
App
├── AuthProvider
│   └── AppContent
│       ├── LoginPage (if not authenticated)
│       └── StudyGuideProvider
│           └── MandarinTutor
│               ├── Header
│               ├── ChatArea
│               ├── InputArea
│               ├── SettingsPanel (modal)
│               ├── HistoryPanel (modal)
│               ├── AdminPanel (side panel)
│               ├── TeacherDashboard (side panel)
│               └── StudyGuidePanel (side panel)
```

---

## 🔐 Authentication Flow

```
1. User visits app
2. AuthContext checks Supabase session
3. If no session → Show LoginPage
4. If session → Load profile from database
5. Render appropriate UI based on role
```

### Session Management

- JWT tokens stored in browser
- Auto-refresh before expiry
- Logout clears all session data
- Profile data cached in context

---

## 👥 Role-Based Access

### Students Can:
- Chat with AI
- View own study guide
- See teacher's materials/announcements
- Update own profile
- Adjust microphone settings

### Teachers Can:
- Everything students can
- View assigned students
- Create/manage groups
- Add observations
- Share materials
- Post announcements

### Admins Can:
- Everything teachers can
- View ALL users
- Create/edit/delete users
- Reset passwords
- Adjust roles
- Control debug/logging
- Select API models

---

## 🚢 Deployment to Vercel

### Step 1: Push to GitHub

```bash
git add .
git commit -m "V12 - Production ready"
git push origin main
```

### Step 2: Import to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click "Add New Project"
3. Import your GitHub repository
4. Configure:
   - Framework: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`

### Step 3: Environment Variables

In Vercel Project Settings → Environment Variables, add:

```
VITE_SUPABASE_URL = https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY = your-anon-key
```

### Step 4: Deploy

Click "Deploy" - Vercel will:
1. Clone your repo
2. Install dependencies
3. Run build
4. Deploy to CDN

### Custom Domain (Optional)

1. Go to Project Settings → Domains
2. Add your domain
3. Configure DNS as instructed

---

## 💰 Cost Breakdown

### Free Tier (Recommended for Beta)

| Service | Limit | Cost |
|---------|-------|------|
| Supabase | 500MB, 50K users | $0 |
| Vercel | 100GB bandwidth | $0 |
| **Total** | | **$0/month** |

### Pro Tier (When Scaling)

| Service | Limit | Cost |
|---------|-------|------|
| Supabase Pro | 8GB, 100K users | $25/month |
| Vercel Pro | 1TB bandwidth | $20/month |
| **Total** | | **$45/month** |

---

## 🐛 Troubleshooting

### CSS Not Working

**Symptoms**: No rounded corners, shadows, or colors

**Solution**:
1. Ensure `tailwind.config.js` exists
2. Check `postcss.config.js` has `tailwindcss: {}`
3. Check `index.css` has `@tailwind` directives
4. Delete `node_modules` and `npm install`

### Teacher Dashboard Shows as Modal

**Symptoms**: Dashboard appears as centered popup instead of side panel

**Solution**:
1. Replace `src/components/TeacherDashboard.jsx` with V12 version
2. The component should return `<div className="flex flex-col h-full">`, NOT a modal wrapper

### Can't Connect to Supabase

**Symptoms**: Network errors, auth failures

**Solution**:
1. Check `.env` has correct URL and key
2. Restart dev server (`npm run dev`)
3. Verify project is not paused in Supabase dashboard
4. Check browser console for specific errors

### Build Fails on Vercel

**Symptoms**: Deployment fails with errors

**Solution**:
1. Ensure `npm run build` works locally
2. Check environment variables are set in Vercel
3. Clear Vercel build cache and redeploy
4. Check for case-sensitive import issues (Linux is case-sensitive)

---

## 📋 Testing Checklist

### Before Deployment

- [ ] `npm run dev` works without errors
- [ ] CSS renders correctly
- [ ] Can register new user
- [ ] Can login/logout
- [ ] Admin can see admin panel
- [ ] Admin can create users
- [ ] Teacher can see teacher dashboard (as side panel)
- [ ] Teacher can assign students
- [ ] Student can see study guide
- [ ] Real-time updates work
- [ ] `npm run build` succeeds

### After Deployment

- [ ] Production URL loads
- [ ] HTTPS certificate active
- [ ] Login works
- [ ] All features work as in development
- [ ] No console errors
- [ ] Mobile responsive

---

## 🔄 Updating

### From V11 to V12

```bash
# 1. Backup current code
cp -r mandarin-tutor mandarin-tutor-backup

# 2. Replace config files
# (package.json, vite.config.js, postcss.config.js, 
#  tailwind.config.js, src/index.css)

# 3. Replace TeacherDashboard
# src/components/TeacherDashboard.jsx

# 4. Clean install
rm -rf node_modules package-lock.json
npm install

# 5. Test
npm run dev

# 6. Deploy
git add .
git commit -m "Update to V12"
git push
```

### Future Updates

Watch the repository for new versions. Each version includes:
- `VX_CHANGES_ONLY.md` - What changed
- `VX_COMPLETE_GUIDE.md` - Full instructions
- Changed files clearly documented

---

## 📚 Additional Resources

### Supabase
- Dashboard: https://app.supabase.com
- Docs: https://supabase.com/docs
- Auth Guide: https://supabase.com/docs/guides/auth

### Vercel
- Dashboard: https://vercel.com/dashboard
- Docs: https://vercel.com/docs
- Environment Variables: https://vercel.com/docs/concepts/projects/environment-variables

### Tailwind CSS
- Docs: https://tailwindcss.com/docs
- v3 Migration: https://tailwindcss.com/docs/upgrade-guide

---

## 🎉 You're Ready!

Your Mandarin Tutor app is now:
- ✅ Fully styled with Tailwind CSS
- ✅ Using correct panel layouts
- ✅ Connected to production database
- ✅ Deployed to the cloud
- ✅ Ready for users

**Next Steps:**
1. Create teacher and student accounts
2. Test the full workflow
3. Invite beta testers
4. Collect feedback
5. Iterate and improve

**Happy teaching! 🇨🇳**