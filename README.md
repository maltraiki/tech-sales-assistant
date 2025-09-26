# Tech Sales Assistant 🚀

AI-powered bilingual tech sales assistant that helps users compare phones, find deals, and get personalized recommendations. Built with TypeScript, Express, and Claude AI.

## Features ✨

- 🤖 Powered by Claude AI with conversational personality
- 🌐 **Multi-language Support** - English and Arabic with RTL
- 🛍️ **Saudi Shopping Links** - Amazon.sa, Noon.com, Jarir, Extra
- 📱 **Smart Comparisons** - Detailed side-by-side phone comparisons
- 🖼️ Multiple product images for comparisons
- 💰 Real-time price tracking across stores
- 💬 Enthusiastic, friendly tech expert personality

## Setup

1. Install dependencies:
```bash
npm install
```

2. Add your Anthropic API key to `.env`:
```
ANTHROPIC_API_KEY=your_key_here
SERPER_API_KEY=6d80dae95b04d40930ae6ca4d8e625f40e72d8fb
```

3. Run in development mode:
```bash
npm run dev
```

4. Open http://localhost:3000 in your browser

## Example Queries

- "What's the latest iPhone?"
- "Compare iPhone 16 vs Samsung S24"
- "Best phone under $500"
- "Google Pixel 9 specs and price"

## Tech Stack

- TypeScript
- Express.js
- Claude AI (Anthropic)
- Serper API (Google Search)

## Project Structure

```
tech-sales-assistant/
├── src/
│   ├── types.ts
│   ├── tools.ts
│   ├── server.ts
│   └── services/
│       ├── serper.ts
│       └── claude.ts
├── public/
│   └── index.html
├── .env
├── package.json
├── tsconfig.json
└── README.md
```