import { createClient } from '@supabase/supabase-js';

// Database schema
export interface Conversation {
    id?: string;
    query: string;
    response: string;
    language: string;
    image_url?: string;
    prices?: any[];
    created_at?: string;
    user_ip?: string;
    user_agent?: string;
}

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseKey);

// Save conversation to database
export async function saveConversation(conversation: Conversation) {
    try {
        const { data, error } = await supabase
            .from('conversations')
            .insert([conversation])
            .select();

        if (error) {
            console.error('Error saving conversation:', error);
            return null;
        }

        return data;
    } catch (err) {
        console.error('Database error:', err);
        return null;
    }
}

// Get recent conversations
export async function getRecentConversations(limit: number = 10) {
    try {
        const { data, error } = await supabase
            .from('conversations')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) {
            console.error('Error fetching conversations:', error);
            return [];
        }

        return data || [];
    } catch (err) {
        console.error('Database error:', err);
        return [];
    }
}

// Get conversation statistics
export async function getConversationStats() {
    try {
        const { data: totalCount } = await supabase
            .from('conversations')
            .select('*', { count: 'exact', head: true });

        const { data: languageStats } = await supabase
            .from('conversations')
            .select('language')
            .order('created_at', { ascending: false })
            .limit(100);

        const arabicCount = languageStats?.filter(c => c.language === 'ar').length || 0;
        const englishCount = languageStats?.filter(c => c.language === 'en').length || 0;

        return {
            total: totalCount || 0,
            arabic: arabicCount,
            english: englishCount
        };
    } catch (err) {
        console.error('Database error:', err);
        return { total: 0, arabic: 0, english: 0 };
    }
}