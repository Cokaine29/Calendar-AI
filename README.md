# 📅 Calendar AI

Calendar AI is a smart scheduling web application that uses Artificial Intelligence to instantly extract event details from messy, unstructured emails and automatically schedule them to your Google Calendar. 

## ✨ Features
- **AI-Powered Extraction:** Paste an email, and the AI (powered by Groq) will intelligently extract the event title, start time, end time, location, and context.
- **Multi-Event Support:** If an email contains a schedule of multiple lectures or workshops, the AI will extract all of them into a clean list.
- **One-Click Scheduling:** Securely log in with Google OAuth and schedule all your extracted events straight to your primary Google Calendar in a single click.
- **Manual Review:** Edit the extracted times or titles, or click the Trash Can icon to remove unwanted events before scheduling.

## 💡 How to Use
1. **Sign In:** Click "Continue with Google" to securely log in. *(Note: If the app is unverified, click "Advanced" -> "Go to Calendar AI" to proceed).*
2. **Paste Text:** Copy and paste any unstructured text—like an email, Slack message, or meeting notes—into the text box.
3. **Magic Extract:** Click "Extract Events" and let the AI instantly parse the dates, times, and context.
4. **Review & Schedule:** Edit the details if needed, or delete unwanted events. Click "Add to Calendar" and they will instantly appear on your Google Calendar!

## 🛠 Tech Stack
- **Frontend:** Next.js 16 (App Router), React, Tailwind CSS v4
- **Backend:** Next.js Serverless API Routes
- **Authentication:** NextAuth.js (Google Provider)
- **AI/LLM:** Groq SDK (`openai/gpt-oss-120b`)
- **Calendar API:** Google APIs (`googleapis`)

---

## 🚀 Local Setup

### 1. Prerequisites
You will need a [Groq API Key](https://console.groq.com/keys) and Google Cloud credentials (Web Client ID and Secret) with the Google Calendar API enabled.

### 2. Clone and Install
```bash
git clone https://github.com/Cokaine29/Calendar-AI.git
cd Calendar-AI
npm install
```

### 3. Environment Variables
Create a `.env.local` file in the root directory and add the following keys:
```env
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

GROQ_API_KEY="your-groq-api-key"

# NextAuth Configuration
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="any-random-string-for-security"
```

### 4. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser. 

*(Note: Ensure your `http://localhost:3000/api/auth/callback/google` is added to your Authorized Redirect URIs in the Google Cloud Console).*

---

## ☁️ Deployment (Vercel)
This app is designed to be easily deployed on [Vercel](https://vercel.com/):
1. Import the GitHub repository to Vercel.
2. Add your 4 Environment Variables in the Vercel dashboard. (You can skip `NEXTAUTH_URL` as Vercel sets it automatically).
3. Click **Deploy**.
4. **Crucial Step:** Once deployed, you must copy your live Vercel URL (e.g., `https://calendar-ai-rouge.vercel.app/api/auth/callback/google`) and add it to your **Authorized redirect URIs** in your Google Cloud Console, otherwise Google will block the login.
