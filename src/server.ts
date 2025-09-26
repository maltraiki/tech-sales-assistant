import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { processQuery } from './services/claude-creative.js';
import { SearchRequest } from './types.js';
import { saveConversation, getRecentConversations, getConversationStats } from './services/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

app.get('/health', (req: Request, res: Response) => {
    res.json({
        status: 'ok',
        message: 'Tech Sales Assistant API is running',
        timestamp: new Date().toISOString()
    });
});

app.post('/search', async (req: Request<{}, {}, SearchRequest>, res: Response) => {
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
            details: (error as Error).message
        });
    }
});

// Get conversation history
app.get('/api/history', async (req: Request, res: Response) => {
    try {
        const limit = parseInt(req.query.limit as string) || 10;
        const conversations = await getRecentConversations(limit);
        res.json(conversations);
    } catch (error) {
        console.error('❌ History error:', error);
        res.status(500).json({
            error: 'Failed to fetch conversation history',
            details: (error as Error).message
        });
    }
});

// Get conversation statistics
app.get('/api/stats', async (req: Request, res: Response) => {
    try {
        const stats = await getConversationStats();
        res.json(stats);
    } catch (error) {
        console.error('❌ Stats error:', error);
        res.status(500).json({
            error: 'Failed to fetch statistics',
            details: (error as Error).message
        });
    }
});

app.get('*', (req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`
╔══════════════════════════════════════════╗
║   🚀 Tech Sales Assistant Server         ║
║                                          ║
║   📡 Server: http://localhost:${PORT}      ║
║   🏥 Health: http://localhost:${PORT}/health ║
║                                          ║
║   💡 Ready to answer tech questions!     ║
╚══════════════════════════════════════════╝
    `);
});