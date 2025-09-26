# 🚨 URGENT: Security Credentials Exposed

## IMMEDIATE STEPS TO SECURE YOUR PROJECT:

### 1. Reset All Supabase Credentials NOW
1. Go to https://app.supabase.com/project/jgngernmvqhlfpmcjmyc/settings/database
2. Click "Reset database password"
3. Go to API settings and regenerate all keys

### 2. Update Vercel Environment Variables
After resetting, update only these in Vercel:
```
SUPABASE_URL=https://jgngernmvqhlfpmcjmyc.supabase.co
SUPABASE_ANON_KEY=[YOUR_NEW_ANON_KEY]
```

### 3. What Was Exposed (DO NOT USE THESE):
- Database passwords: peP4sDJhGmSwTp5C and T+9QnYWH/aHSLFJ
- Service role key (FULL ADMIN ACCESS)
- JWT secret
- All connection strings

### 4. Your App Only Needs:
```
ANTHROPIC_API_KEY=your_anthropic_key
SERPER_API_KEY=6d80dae95b04d40930ae6ca4d8e625f40e72d8fb
SUPABASE_URL=https://jgngernmvqhlfpmcjmyc.supabase.co
SUPABASE_ANON_KEY=[NEW_KEY_AFTER_RESET]
```

## NEVER SHARE:
- SUPABASE_SERVICE_ROLE_KEY (gives full database access!)
- POSTGRES_PASSWORD
- SUPABASE_JWT_SECRET
- Any database connection strings

## Safe to Share (but still keep private):
- SUPABASE_URL (it's public anyway)
- SUPABASE_ANON_KEY (has Row Level Security)

# GO RESET YOUR CREDENTIALS NOW!