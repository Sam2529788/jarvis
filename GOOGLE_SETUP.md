# Google APIs Setup Instructions

## Required Google API Keys

To enable real-time web-based data in JARVIS, you'll need to set up the following Google APIs:

### 1. Google Custom Search API

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the **Custom Search API**
4. Create credentials (API Key)
5. Copy your API key

### 2. Google Custom Search Engine

1. Go to [Google Custom Search Engine](https://cse.google.com/cse/)
2. Click "Add" to create a new search engine
3. Enter `*.com` as the site to search (for web-wide search)
4. Create the search engine
5. Copy your **Search Engine ID**

### 3. Google News Search Engine (Optional)

1. Create another Custom Search Engine
2. Configure it to search news sites like:
   - `cnn.com`
   - `bbc.com`
   - `reuters.com`
   - `techcrunch.com`
3. Copy the **News Search Engine ID**

### 4. Google Maps API

1. In Google Cloud Console, enable **Maps JavaScript API**
2. Enable **Geocoding API**
3. Create or use existing API key
4. Copy your **Maps API Key**

### 5. OpenWeatherMap API (Optional)

1. Go to [OpenWeatherMap](https://openweathermap.org/api)
2. Sign up for free account
3. Get your API key from dashboard

## Environment Variables Setup

Add these to your `.env.local` file:

\`\`\`env
# OpenAI API Key (required)
OPENAI_API_KEY=your_openai_api_key_here

# Google APIs for real-time data
GOOGLE_API_KEY=your_google_api_key_here
GOOGLE_SEARCH_ENGINE_ID=your_custom_search_engine_id_here
GOOGLE_NEWS_SEARCH_ENGINE_ID=your_news_search_engine_id_here
GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here

# Weather API (optional)
OPENWEATHER_API_KEY=your_openweather_api_key_here
\`\`\`

## Features Enabled

With Google APIs, JARVIS can now:

- **Real-time Web Search**: Current information from across the web
- **Live News**: Latest headlines and breaking news
- **Accurate Weather**: Location-based weather with Google Maps integration
- **Stock Prices**: Current market data
- **Cryptocurrency**: Live crypto prices
- **Sports Scores**: Real-time game results
- **Traffic Conditions**: Current traffic information
- **Trending Topics**: What's popular right now

## Usage Examples

- "Jarvis search for latest AI developments"
- "Jarvis what's the current Bitcoin price"
- "Jarvis get me the latest tech news"
- "Jarvis what's the weather outside"
- "Jarvis show trending topics today"
- "Jarvis traffic conditions in New York"

## API Limits

- **Google Custom Search**: 100 queries/day (free tier)
- **Google Maps**: $200 monthly credit (free tier)
- **OpenWeatherMap**: 1000 calls/day (free tier)

For production use, consider upgrading to paid tiers for higher limits.
