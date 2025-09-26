# Tech Sales Assistant - Deployment Guide

## 🚀 Deploying to Vercel

### Prerequisites
1. Create accounts at:
   - [Vercel](https://vercel.com)
   - [Supabase](https://supabase.com) (for database)

2. Required API Keys:
   - **Anthropic API Key** (Required) - Get from [console.anthropic.com](https://console.anthropic.com)
   - **Serper API Key** (Required for product images) - Your current key: `6d80dae95b04d40930ae6ca4d8e625f40e72d8fb`
     - Or get your own at [serper.dev](https://serper.dev) - Free tier: 2,500 searches/month
   - **Supabase Credentials** (For saving conversations) - From your Supabase project settings

### Step 1: Set up Supabase Database

1. Create a new Supabase project
2. Go to SQL Editor and run the schema from `supabase-schema.sql`
3. Copy your project URL and anon key from Settings > API

### Step 2: Deploy to Vercel

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Build the project:
```bash
npm run build
```

3. Deploy:
```bash
vercel
```

4. Set environment variables in Vercel Dashboard:
   - Go to your project settings
   - Navigate to Environment Variables
   - Add these variables:
```
ANTHROPIC_API_KEY=your_anthropic_key
SERPER_API_KEY=6d80dae95b04d40930ae6ca4d8e625f40e72d8fb
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

   **Note**: The SERPER_API_KEY provided (6d80dae95b04d40930ae6ca4d8e625f40e72d8fb) is the one you're currently using.
   If you need your own key, sign up at [serper.dev](https://serper.dev) for free (2,500 searches/month).

5. Redeploy to apply environment variables:
```bash
vercel --prod
```

## 🗄️ Database Features

The application now includes:

1. **Conversation History**: All queries and responses are saved
2. **Statistics Dashboard**: Track usage by language
3. **Recent Conversations Panel**: View and reload past conversations

### Database Schema

```sql
conversations
├── id (UUID)
├── query (Text)
├── response (Text)
├── language (String)
├── image_url (Text)
├── prices (JSON)
├── created_at (Timestamp)
├── user_ip (String)
└── user_agent (Text)
```

## 🔧 Local Development with Database

1. Update `.env` file with all required credentials:
```env
# Claude AI (Required)
ANTHROPIC_API_KEY=your_anthropic_key

# Serper API for product images (Required)
SERPER_API_KEY=6d80dae95b04d40930ae6ca4d8e625f40e72d8fb

# Supabase Database (Optional but recommended)
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key

# Server Port (Optional - defaults to 3000)
PORT=3002
```

2. Run the development server:
```bash
npm run dev
```

3. Access the app at http://localhost:3002

## 📊 New Features

### Conversation History Panel
- Shows last 20 conversations
- Click to reload any past query
- Displays language and time

### Statistics
- Total queries count
- English vs Arabic usage
- Real-time updates

### Enhanced UI
- Side panel for history
- Responsive design
- RTL support for Arabic

## 🔐 Security Notes

- Never commit API keys to Git
- Use environment variables for all sensitive data
- Enable Row Level Security in Supabase for production
- Consider adding authentication for production use

## 🚦 Testing

1. Test locally first:
```bash
npm run dev
```

2. Build and check for errors:
```bash
npm run build
```

3. Test the production build:
```bash
npm start
```

## 📱 Mobile Optimization

The app is fully responsive and works on:
- Desktop browsers
- Tablets
- Mobile phones
- RTL languages (Arabic)

## 🛠️ Troubleshooting

### Build fails on Vercel
- Check TypeScript errors: `npm run type-check`
- Ensure all dependencies are in `package.json`

### Database not saving
- Verify Supabase credentials in environment variables
- Check Supabase dashboard for any errors
- Ensure table exists with correct schema

### Arabic text display issues
- Font family includes 'Noto Sans Arabic'
- RTL direction properly set
- Shopping links display in Arabic

## 📈 Monitoring

Track your app performance:
1. Vercel Analytics (built-in)
2. Supabase Dashboard for database metrics
3. Check `/api/stats` endpoint for usage statistics

## 🔄 Updates

To update the deployed app:
1. Make changes locally
2. Test thoroughly
3. Commit to Git
4. Deploy: `vercel --prod`

## 💡 Tips

- Use `vercel logs` to debug production issues
- Monitor Supabase usage to stay within free tier
- Consider caching frequently asked questions
- Add rate limiting for production