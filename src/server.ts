import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { processQuery } from './services/claude-creative.js';
import { SearchRequest } from './types.js';

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
        res.json(result);
    } catch (error) {
        console.error('❌ Server error:', error);
        res.status(500).json({
            error: 'An error occurred processing your request',
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