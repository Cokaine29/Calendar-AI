<div align="center">
  <h1>Calendar AI</h1>
  <p><strong>The intelligent way to schedule.</strong></p>
  <p>
    <a href="https://calendar-ai-rouge.vercel.app"><b>Live Application</b></a> •
    <a href="#-architecture--workflow"><b>Architecture</b></a> •
    <a href="#-installation"><b>Installation</b></a>
  </p>
  
  ![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)
  ![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue?style=flat-square&logo=typescript)
  ![Tailwind](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=flat-square&logo=tailwind-css)
  ![Groq](https://img.shields.io/badge/LLM-Groq_API-f55036?style=flat-square)
</div>

---

## 📌 Overview

**Calendar AI** is an intelligent scheduling utility designed to eliminate the friction of manual calendar entry. By leveraging Large Language Models (LLMs), it acts as an intermediary pipeline—parsing unstructured text (such as raw emails, Slack messages, or meeting minutes), extracting chronological event data, and interfacing directly with the Google Calendar API to schedule the events securely.

---

## ⚡ Core Features

- **Unstructured Data Parsing:** Extracts strict event parameters (Title, Start Time, End Time, Location, Context) from natural language using the `openai/gpt-oss-120b` model via Groq.
- **Batch Processing:** Automatically detects and isolates multiple distinct events from a single block of text (e.g., parsing a syllabus or itinerary).
- **Automated Scheduling:** Secure OAuth 2.0 integration with Google Workspace to push processed event payloads directly to the authenticated user's primary calendar.
- **Smart Token Rotation:** Implements background refresh-token rotation to maintain persistent OAuth sessions without requiring re-authentication.
- **Hyper-Minimal Interface:** A focus-driven, Apple-style minimalist UI built with Tailwind CSS, strictly optimized for speed and clarity.

---

## 📖 Usage (Hosted App)

If you just want to use the application without deploying it yourself, you can access the live hosted version directly.

1. **Navigate to the App:** Go to [calendar-ai-rouge.vercel.app](https://calendar-ai-rouge.vercel.app).
2. **Authenticate:** Click "Continue with Google". *(Note: Because the app is pending Google Verification, you must click **Advanced** -> **Go to Calendar AI** to bypass the security warning).*
3. **Parse Data:** Paste any unstructured text containing event details into the main text area and click "Extract Events".
4. **Review & Push:** The AI will generate structured event blocks. Review the inferred times/locations, make any necessary edits, and click "Add to Calendar" to immediately sync them to your Google account.

---

## 🏗 Architecture & Workflow

1. **Authentication Layer:** The user authenticates via NextAuth.js utilizing the Google Provider. The application requests `offline` access to generate a persistent refresh token and the `calendar.events` scope.
2. **Inference Pipeline:** Unstructured text is posted to a serverless Next.js API route (`/api/extract`). The backend initializes the Groq SDK, injecting strict JSON schema enforcement prompts to guarantee normalized date-time outputs.
3. **Client Review:** The parsed JSON payload is returned to the client and rendered in an editable schema, allowing the user to mutate or delete inferred event blocks prior to commitment.
4. **Calendar Push:** Finalized payloads are dispatched to `/api/schedule`, where the backend uses the securely stored OAuth access token (rotating it if expired) to invoke the Google Calendar `insert` API.

---

## 💻 Tech Stack

| Domain | Technology |
|---|---|
| **Framework** | Next.js 16 (App Router) |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS v4 |
| **Authentication** | NextAuth.js |
| **LLM Inference** | Groq SDK (`openai/gpt-oss-120b`) |
| **External API** | Google Calendar API (`googleapis`) |

---

## 🚀 Installation

### 1. Prerequisites
- Node.js (v18+)
- A [Groq API Key](https://console.groq.com/keys)
- A Google Cloud Console project with the **Google Calendar API** enabled.

### 2. Clone the Repository
```bash
git clone https://github.com/Cokaine29/Calendar-AI.git
cd Calendar-AI
npm install
```

### 3. Environment Configuration
Create a `.env.local` file at the root of the project and populate the following variables:

```env
# Google OAuth Credentials
GOOGLE_CLIENT_ID="your_google_client_id"
GOOGLE_CLIENT_SECRET="your_google_client_secret"

# LLM Provider
GROQ_API_KEY="your_groq_api_key"

# NextAuth Configuration
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate_a_secure_random_string_here"
```

### 4. Local Execution
```bash
npm run dev
```
Navigate to `http://localhost:3000`. 
> **Important:** Ensure `http://localhost:3000/api/auth/callback/google` is registered under your Authorized Redirect URIs within the Google Cloud Console.

---

## ☁️ Production Deployment (Vercel)

Calendar AI is optimized for Vercel's serverless edge infrastructure.

1. Push your repository to GitHub.
2. Import the project into your Vercel Dashboard.
3. Bind the required Environment Variables (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GROQ_API_KEY`, `NEXTAUTH_SECRET`). Note: Vercel automatically maps `NEXTAUTH_URL` internally.
4. Deploy the application.
5. **OAuth Registration:** Copy your production domain (e.g., `https://calendar-ai-rouge.vercel.app/api/auth/callback/google`) and strictly append it to the Authorized Redirect URIs in your Google Cloud Console. Failure to do so will result in `Error 400: redirect_uri_mismatch`.

---

## 🛡️ License

This project is open-source and available under the [MIT License](LICENSE).
