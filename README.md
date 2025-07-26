# JARVIS MVP - AI Assistant

A sophisticated AI assistant inspired by Tony Stark's JARVIS, built with Next.js, React, and multiple AI APIs.

## 🚀 Features

- **Voice Control**: Wake word detection and speech recognition
- **AI Conversations**: Powered by OpenAI GPT-4o mini
- **Premium Voice**: ElevenLabs text-to-speech integration
- **Real-time Search**: Google search via SearchAPI
- **Weather Information**: Live weather data from OpenWeatherMap
- **Latest News**: Current news from NewsAPI
- **System Control**: Simulated PC control commands
- **Sci-fi Interface**: Iron Man inspired design

## 🔧 Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Copy `.env.example` to `.env.local`
4. Add your API keys to `.env.local`
5. Run the development server: `npm run dev`

## 🔑 Required API Keys

### OpenAI API Key (Required)
- Sign up at https://platform.openai.com/
- Create an API key in your dashboard
- Add to `OPENAI_API_KEY` in your `.env.local`

### Free APIs (No Keys Required)
- **Weather**: wttr.in API (completely free)
- **Search**: DuckDuckGo Instant Answer API (free)
- **News**: RSS2JSON API (free tier available)
- **Text-to-Speech**: Browser's built-in Speech Synthesis API

## 🎯 Enhanced Features

Your JARVIS now uses reliable, free APIs:
- **Real-time weather** from wttr.in
- **Instant search results** from DuckDuckGo
- **Latest news** from RSS feeds via RSS2JSON
- **Natural voice** using browser's Speech Synthesis
- **AI conversations** powered by OpenAI GPT-4o mini

## 🚀 Setup (Simplified)

1. Clone the repository
2. Install dependencies: `npm install`
3. Copy `.env.example` to `.env.local`
4. Add only your OpenAI API key to `.env.local`
5. Run: `npm run dev`

That's it! All other services work without API keys.

## 🎯 Usage

1. Click the microphone button to start listening
2. Say "Jarvis" to activate the assistant
3. Give commands like:
   - "Search for the latest AI developments"
   - "What's the weather in London?"
   - "Get me the latest tech news"
   - "Open calculator"
   - "System status"
   - Or have a natural conversation!

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React, TailwindCSS
- **AI**: OpenAI GPT-4o mini
- **Voice**: Web Speech API, ElevenLabs TTS
- **APIs**: SearchAPI, OpenWeatherMap, NewsAPI
- **Styling**: TailwindCSS with sci-fi theme

## 📝 Environment Variables

Create a `.env.local` file with the following variables:

\`\`\`env
OPENAI_API_KEY=your_openai_api_key_here
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
SEARCHAPI_KEY=your_searchapi_key_here
WEATHER_API_KEY=your_openweathermap_api_key_here
NEWS_API_KEY=your_newsapi_key_here
\`\`\`

## 🔒 Security Note

Never commit your `.env.local` file to version control. The `.env.example` file is provided as a template.
