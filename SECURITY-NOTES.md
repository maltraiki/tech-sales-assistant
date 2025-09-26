# Security Best Practices

## 🔐 Password Management

### Never Share Passwords
- Don't share database passwords in chat or public forums
- Use environment variables for all sensitive data
- Keep passwords in secure password managers

### Database Access
Your Supabase database can be accessed two ways:

1. **Via API (Recommended)**
   - Uses `SUPABASE_URL` and `SUPABASE_ANON_KEY`
   - Secure, rate-limited, and managed by Supabase
   - This is how your app connects

2. **Direct PostgreSQL Connection**
   - Only use for database administration
   - Connection details are in Supabase Dashboard → Settings → Database
   - Keep the database password secure and never commit it

## 🛡️ Environment Variables

### Local Development
1. Create a `.env` file (never commit this!)
2. Copy from `.env.example` and fill in your values
3. The `.env` file is in `.gitignore` for security

### Production (Vercel)
1. Set environment variables in Vercel Dashboard
2. Never hardcode API keys in your code
3. Use Vercel's built-in secrets management

## 🚫 What NOT to Commit

Never commit these to Git:
- `.env` file
- API keys
- Database passwords
- Private keys
- Any credentials

## ✅ Security Checklist

- [ ] All API keys are in environment variables
- [ ] `.env` is in `.gitignore`
- [ ] No hardcoded credentials in code
- [ ] Database password is secure
- [ ] Using HTTPS in production
- [ ] Row Level Security enabled in Supabase

## 🔄 If a Password is Exposed

1. **Immediately change it** in the service dashboard
2. Update your environment variables
3. Redeploy your application
4. Check logs for any unauthorized access

## 📝 Additional Notes

- Supabase automatically handles database security
- Vercel encrypts environment variables
- Always use the principle of least privilege
- Regular security audits are recommended