// Vercel serverless function entry point
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { processQuery } from '../dist/services/claude-creative.js';
import { saveConversation, getRecentConversations, getConversationStats } from '../dist/services/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

// Debug environment variables in Vercel
console.log('Environment check:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('ANTHROPIC_API_KEY exists:', !!process.env.ANTHROPIC_API_KEY);
console.log('SERPER_API_KEY exists:', !!process.env.SERPER_API_KEY);
console.log('SUPABASE_URL exists:', !!process.env.SUPABASE_URL);

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        message: 'Tech Sales Assistant API is running on Vercel',
        timestamp: new Date().toISOString()
    });
});

app.post('/search', async (req, res) => {
    const { query, language = 'en' } = req.body;

    if (!query || query.trim().length === 0) {
        return res.status(400).json({
            error: 'Query is required and cannot be empty'
        });
    }

    try {
        const result = await processQuery(query, language);

        // Save conversation to database
        await saveConversation({
            query,
            response: result.response,
            language,
            image_url: result.image || undefined,
            prices: result.prices,
            user_ip: req.ip,
            user_agent: req.headers['user-agent']
        });

        res.json(result);
    } catch (error) {
        console.error('❌ Server error:', error);
        res.status(500).json({
            error: 'An error occurred processing your request',
            details: error.message
        });
    }
});

app.get('/api/history', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const conversations = await getRecentConversations(limit);
        res.json(conversations);
    } catch (error) {
        console.error('❌ History error:', error);
        res.status(500).json({
            error: 'Failed to fetch conversation history',
            details: error.message
        });
    }
});

app.get('/api/stats', async (req, res) => {
    try {
        const stats = await getConversationStats();
        res.json(stats);
    } catch (error) {
        console.error('❌ Stats error:', error);
        res.status(500).json({
            error: 'Failed to fetch statistics',
            details: error.message
        });
    }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

export default app;