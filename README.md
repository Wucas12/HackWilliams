# Syllabus to Calendar

Transform your syllabus PDFs into structured Google Calendar events with AI-powered extraction and automatic scheduling.

## Features

- 📄 **PDF Syllabus Processing**: Upload PDF syllabi and automatically extract class sessions, assignments, exams, projects, and office hours
- 🤖 **AI-Powered Extraction**: Uses OpenAI GPT-4o for intelligent event extraction with natural language understanding
- 📅 **Google Calendar Integration**: Sync extracted events directly to your Google Calendar with color coding
- ✅ **Clarification System**: Interactive clarification prompts when extraction needs more information
- 📝 **Custom Event Entry**: Manually add events using natural language input
- 🎨 **Color-Coded Events**: Automatic color coding for assignments (green), exams (yellow), and projects (red)
- ⚠️ **Stress Detection**: Automatically detects high-stress periods (busy weeks) in your calendar
- 📚 **Reading Materials**: Extract and include reading assignments in calendar events
- 🤝 **AI Meeting Booking**: Book meetings with others by checking availability and suggesting time slots

## Tech Stack

- **Next.js 15** (App Router)
- **TypeScript**
- **OpenAI GPT-4o** (Structured outputs with Zod)
- **Google Calendar API** (OAuth 2.0)
- **pdf-parse** (PDF text extraction)
- **Tailwind CSS**

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- OpenAI API key
- Google Cloud Project with Calendar API enabled
- Google OAuth 2.0 credentials

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Wucas12/HackWilliams.git
cd HackWilliams
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file in the root directory:
```env
# OpenAI
OPENAI_API_KEY=your_openai_api_key_here

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback
```

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Google Calendar API**
4. Create OAuth 2.0 credentials (Web application)
5. Add authorized redirect URI: `http://localhost:3000/api/auth/google/callback`
6. Copy the Client ID and Client Secret to your `.env.local`

### Running Locally

```bash
# Development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### Processing a Syllabus

1. **Login**: Click "Login with Google" to authenticate with your Google account
2. **Upload PDF**: Navigate to the dashboard and upload a syllabus PDF
3. **Review Extraction**: Review the extracted events and answer any clarification questions
4. **Sync to Calendar**: Click "Sync to Calendar" to add events to your Google Calendar

### Adding Custom Events

1. Click **"+ Add Custom Event"** from the dashboard
2. Choose between **Single Event** or **Multiple Events**
3. Describe your event(s) in natural language (e.g., "Midterm Exam for CS 101 on March 15th at 2:00 PM")
4. Answer any clarification questions
5. Sync to your calendar

### Event Types

The system automatically categorizes events into:
- **Class**: Regular class sessions
- **Assignment**: Homework and assignments
- **Exam**: Tests and quizzes
- **Project**: Long-term projects
- **Reading**: Required readings
- **Office Hours**: Professor/TA office hours
## Project Structure

```
├── app/
│   ├── actions/          # Server actions (calendar sync, stress analysis)
│   ├── api/              # API routes (PDF processing, OAuth)
│   ├── dashboard/        # Main dashboard page
│   ├── add-event/        # Custom event creation page
│   └── layout.tsx        # Root layout
├── components/           # React components
├── hooks/                # Custom React hooks
├── lib/                  # Utility libraries
├── types/                # TypeScript type definitions
└── data/                 # Extracted JSON files (gitignored)
```

## Features in Detail

### AI-Powered Extraction

Uses OpenAI's structured outputs to extract:
- Event titles (specific, not generic)
- Dates (ISO format)
- Times (24-hour format)
- Course names
- Event types
- Locations
- Descriptions

### Clarification System

When extraction is ambiguous, the system asks for clarification on:
- Multiple course sections
- Missing information
- Conflicting dates
- Unclear event types

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Acknowledgments

- OpenAI for GPT-4o
- Google Calendar API
- Next.js team
- Williams Career Center and EphVenture for providing the oppurtunity for this hackathon
