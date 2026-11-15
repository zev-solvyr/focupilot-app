# 🚀 FocusPilot (Free Open Clone)

An all-in-one personal goal planner, daily focus scoring cockpit, Pomodoro deep-work timer, and AI executive mentor. Built to mirror the premium FocusPilot app experience with zero subscription fees.

---

## ⚡ Core Features

1. **Daily Focus Score (0 - 100):**
   - Live SVG radial gauge tracking your productivity velocity.
   - Real-time breakdown: Task completion rate (45 pts), Deep work minutes (40 pts), and Mindset calibration (15 pts).
2. **Morning Command Read:**
   - Daily morning check-in to gauge cognitive capacity (1-5) and lock in today's single most important needle-mover.
3. **Strategic Goals Matrix:**
   - Categorized by Life Pillars (Career & Wealth, Health & Body, Knowledge, Finance, Personal).
   - Milestone tracking with progress bars.
   - **AI Auto-Breakdown:** Deconstructs any big ambition into 4 actionable milestones using AI.
4. **Deep Work Focus Cockpit:**
   - 25m Pomodoro, 50m Deep Flow, and 90m Ultradian timers.
   - **Offline Bio-Acoustics:** Generates Gentle Rain, White Noise, and 40Hz Binaural Gamma waves directly through the browser Web Audio API (0 external audio files needed).
   - Auto-logs focus sessions into your daily score.
5. **AI Strategic Mentor:**
   - Executive performance coach trained to analyze your active score, goals, and pending tasks.
   - Integrates with Google Gemini API (100% Free) or runs offline with built-in heuristic coaching.
6. **AI Journal & Voice Dictation:**
   - End-of-day reflection and mood tracker.
   - Includes speech-to-text voice dictation using browser Web Speech API.
7. **Velocity & Performance Analytics:**
   - 7-Day Focus Score trajectory bar chart, total deep work hours, category distribution, and streak tracker.

---

## 📲 How to Run & Install on Your Android Phone

### 1. Run Locally on Your PC
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

### 2. Open & Install on Your Phone (PWA - Recommended)
To use it directly on your Android phone right now over your home Wi-Fi:

1. In your PC terminal, run:
   ```bash
   npm run dev:host
   ```
2. Terminal will display a Network URL (e.g. `http://192.168.1.XX:5173`).
3. Open that URL in **Google Chrome** on your Android phone.
4. Tap the **three dots (⋮)** menu at top-right of Chrome $\rightarrow$ tap **"Add to Home Screen"** or **"Install App"**.
5. It will install with the FocusPilot icon and open full-screen like a native app with offline support!

---

### 3. Generate Standalone `.apk` File (Free via GitHub)
We have included `.github/workflows/build-apk.yml`.
1. Push this folder to your GitHub repository.
2. Go to the **Actions** tab in GitHub $\rightarrow$ **Build Android APK (Free)** $\rightarrow$ click **Run workflow**.
3. In ~2 minutes, GitHub will build and provide a download link for `FocusPilot-Android-APK` (`app-debug.apk`) that you can install directly on your phone!

---

## 🔑 AI Mentor Configuration
In the app, click the **Settings** gear icon:
- Grab a 100% free API key from [Google AI Studio](https://aistudio.google.com/app/apikey).
- Paste it into the Gemini API Key field.
- If left blank, the app will run seamlessly in offline mode with smart built-in coaching models!
