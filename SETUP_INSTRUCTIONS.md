# OpenAI GPT-4o Mini Setup Instructions

## Step 1: Get Your OpenAI API Key

1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in to your account
3. Navigate to **API Keys** section
4. Click **"Create new secret key"**
5. Copy the key (it starts with `sk-`)

## Step 2: Add API Key to Your Project

1. Create a file named `.env.local` in your project root
2. Add this line to the file:
   \`\`\`
   OPENAI_API_KEY=sk-your-actual-api-key-here
   \`\`\`
3. Replace `sk-your-actual-api-key-here` with your real API key

## Step 3: Test Your Setup

1. Start your development server: `npm run dev`
2. Open the JARVIS interface
3. Click the microphone button
4. Say "Jarvis, hello" or "Jarvis, how are you?"
5. JARVIS should respond using GPT-4o mini!

## Important Notes

- **Keep your API key secret** - never share it or commit it to version control
- **GPT-4o mini** is cost-effective and fast
- **Free tier** includes $5 in free credits for new accounts
- **Pricing** is very affordable: ~$0.15 per 1M input tokens

## Troubleshooting

If you get an error:
1. Check that your `.env.local` file is in the project root
2. Verify your API key is correct (starts with `sk-`)
3. Restart your development server after adding the key
4. Check the browser console for error messages

## Example Commands to Test

- "Jarvis, what's the weather like?"
- "Jarvis, search for AI news"
- "Jarvis, tell me a joke"
- "Jarvis, what can you do?"
- "Jarvis, explain quantum computing"
