import Anthropic from '@anthropic-ai/sdk';
import { SearchResponse } from '../types.js';

export async function processQuery(query: string): Promise<SearchResponse> {
    console.log(`\n🤖 Processing query: "${query}"\n`);
    console.log(`API Key present: ${!!process.env.ANTHROPIC_API_KEY}`);

    const anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY || ''
    });

    try {
        const response = await anthropic.messages.create({
            model: "claude-3-haiku-20240307",
            max_tokens: 2048,
            temperature: 0.8,
            messages: [
                {
                    role: "user",
                    content: `You are an expert sales engineer for tech products with deep knowledge of smartphones, laptops, tablets, and consumer electronics.

Your personality:
- Professional yet friendly and approachable
- Enthusiastic about technology
- Honest about pros and cons
- Focused on helping customers make informed decisions
- Use natural, conversational language (not overly formal)

Your approach:
- Share your knowledge about the latest tech products (as of your knowledge cutoff)
- Compare products objectively when asked
- Highlight key differences that matter to users
- Mention typical price ranges and value propositions
- Be specific with numbers and specs when you know them
- If you don't have the latest pricing, mention typical price ranges

Customer question: ${query}`
                }
            ]
        });

        const textBlock = response.content.find(
            (block): block is { type: 'text'; text: string } =>
                block.type === 'text'
        );

        const finalResponse = textBlock?.text || 'I apologize, I could not generate a response.';

        console.log(`\n✅ Query processed successfully\n`);

        return {
            response: finalResponse,
            image: null,
            prices: []
        };

    } catch (error) {
        console.error('❌ Claude processing error:', error);

        // Return a friendly error message
        return {
            response: "I apologize, but I encountered an issue while processing your request. Please make sure your API key is configured correctly and try again.",
            image: null,
            prices: []
        };
    }
}