# Tech Sales Assistant 🚀

AI-powered bilingual tech sales assistant that helps users compare phones, find deals, and get personalized recommendations. Built with TypeScript, Express, Claude AI, and Amazon Product Advertising API.

_Last deployment: 2025-09-28_

## Features ✨

- 🤖 Powered by Claude AI with conversational personality
- 🌐 **Multi-language Support** - English and Arabic with RTL
- 🛍️ **Saudi Shopping Links** - Amazon.sa, Noon.com, Jarir, Extra
- 📱 **Smart Comparisons** - Detailed side-by-side phone comparisons
- 🖼️ Multiple product images for comparisons
- 💰 Real-time price tracking with Amazon API integration
- 🎯 **Amazon Affiliate Program** - Monetized with tracking
- 📊 **Click Analytics** - Track user engagement and conversions
- ⚡ **Prime Badge Display** - Shows Prime eligible products
- 💾 **Smart Caching** - 24-hour price cache for compliance
- 💬 Enthusiastic, friendly tech expert personality

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables in `.env`:
```env
# Claude AI
ANTHROPIC_API_KEY=your_key_here

# Search API
SERPER_API_KEY=your_serper_key_here

# Amazon Product Advertising API (Saudi Arabia)
AMAZON_ACCESS_KEY=your_amazon_access_key
AMAZON_SECRET_KEY=your_amazon_secret_key

# Supabase Database
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
```

3. Set up the database:

### Database Setup (Supabase)

Run the following SQL migrations in your Supabase SQL Editor:

```sql
-- Run migrations from supabase/migrations/ folder
-- 001_conversations.sql - Basic conversation tracking
-- 002_affiliate_tracking.sql - Affiliate analytics tables
```

The database includes:
- **`conversations`** - Stores chat history
- **`affiliate_data`** - Caches Amazon product data (24hr limit)
- **`click_tracking`** - Analytics for affiliate clicks
- **`product_comparisons`** - Tracks popular comparisons

4. Run in development mode:
```bash
npm run dev
```

5. Open http://localhost:3000 in your browser

## Example Queries

- "What's the latest iPhone?"
- "Compare iPhone 16 vs Samsung S24"
- "Best phone under $500"
- "Google Pixel 9 specs and price"

## Tech Stack

- **Backend**: TypeScript, Express.js
- **AI**: Claude AI (Anthropic)
- **Database**: Supabase (PostgreSQL)
- **APIs**:
  - Amazon Product Advertising API (PAAPI5)
  - Serper API (Google Search)
- **Deployment**: Vercel

## Project Structure

```
tech-sales-assistant/
├── src/
│   ├── types.ts
│   ├── server.ts
│   ├── services/
│   │   ├── amazon-api.ts      # Amazon PAAPI5 integration
│   │   ├── claude-creative.ts # Claude AI responses
│   │   ├── serper.ts          # Image search
│   │   ├── database.ts        # Conversation storage
│   │   ├── click-tracking.ts  # Analytics tracking
│   │   ├── shopping-links.ts  # Multi-store links
│   │   └── supabase.ts        # Database client
│   └── types/
│       └── paapi5-nodejs-sdk.d.ts
├── public/
│   └── index.html             # Frontend with RTL support
├── supabase/
│   └── migrations/            # Database schema
│       ├── 001_conversations.sql
│       └── 002_affiliate_tracking.sql
├── .env
├── package.json
├── tsconfig.json
└── README.md
```

## Database Schema

### Tables

1. **`conversations`** - Chat history and user interactions
2. **`affiliate_data`** - Amazon product cache with 24-hour TTL
3. **`click_tracking`** - Affiliate link click analytics
4. **`product_comparisons`** - Popular product comparison tracking

### Key Features

- Automatic click tracking with session management
- ASIN-based product caching for performance
- 24-hour price cache for Amazon TOS compliance
- Analytics functions for conversion tracking