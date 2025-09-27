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
    user_session_id?: string;
    comparison_query?: boolean;
}

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

console.log('Supabase Init:', {
    url: supabaseUrl ? 'Found' : 'Missing',
    key: supabaseKey ? 'Found' : 'Missing'
});

// Only create client if we have real credentials
export const supabase = (supabaseUrl && supabaseKey)
    ? createClient(supabaseUrl, supabaseKey)
    : null;

// Save conversation to database
export async function saveConversation(conversation: Conversation) {
    if (!supabase) {
        console.log('Supabase not configured - skipping save');
        return null;
    }

    // Check if it's a comparison query
    const isComparison = /vs|compare|versus|او|مقابل|ضد/i.test(conversation.query);

    try {
        const { data, error } = await supabase
            .from('conversations')
            .insert([{
                ...conversation,
                comparison_query: isComparison
            }])
            .select();

        if (error) {
            console.error('Error saving conversation:', error);
            return null;
        }

        if (isComparison) {
            console.log('📊 Marked as comparison query');
        }

        return data;
    } catch (err) {
        console.error('Database error:', err);
        return null;
    }
}

// Get recent conversations
export async function getRecentConversations(limit: number = 10) {
    if (!supabase) {
        console.log('Supabase not configured - returning empty array');
        return [];
    }

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
    if (!supabase) {
        console.log('Supabase not configured - returning default stats');
        return { total: 0, arabic: 0, english: 0 };
    }

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