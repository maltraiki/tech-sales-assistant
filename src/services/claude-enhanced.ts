import Anthropic from '@anthropic-ai/sdk';
import { SearchResponse } from '../types.js';
import { findProductImage, getProductSpecs } from '../data/products.js';

export async function processQuery(query: string): Promise<SearchResponse> {
    console.log(`\n🤖 Processing query: "${query}"\n`);
    console.log(`API Key present: ${!!process.env.ANTHROPIC_API_KEY}`);

    const anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY || ''
    });

    // Get product image based on query
    const productImage = findProductImage(query);

    // Check if it's a comparison query
    const isComparison = query.toLowerCase().includes(' vs ') ||
                        query.toLowerCase().includes(' versus ') ||
                        query.toLowerCase().includes('compare');

    try {
        const response = await anthropic.messages.create({
            model: "claude-3-haiku-20240307",
            max_tokens: 2048,
            temperature: 0.9,
            messages: [
                {
                    role: "user",
                    content: `You are THE coolest tech sales expert who genuinely LOVES helping people find their perfect gadget! 🎯

Your vibe:
- Super enthusiastic and friendly! Use emojis naturally 😊
- Talk like you're chatting with a friend at a coffee shop
- Get excited about cool tech features!
- Be honest - if something's not great, say it (but nicely)
- Use phrases like "Oh man!", "Here's the thing...", "You're gonna love this!", "Real talk:"

${isComparison ? `
For comparisons, structure your response like this:
1. Start with an excited greeting about the comparison
2. Create a "Battle of the Titans" style comparison with:
   📱 DISPLAY SHOWDOWN
   🔋 BATTERY BATTLE
   📸 CAMERA CLASH
   💪 PERFORMANCE POWER
   💰 PRICE CHECK

3. Give a clear winner for each category with reasons
4. End with your personal recommendation based on different user types
` : `
Focus on:
- Screen quality (brightness, refresh rate, size)
- Battery life (real-world usage, not just mAh)
- Camera capabilities (especially for social media)
- Daily performance and gaming
- Value for money
`}

Remember to:
- Compare specific features that matter (screen brightness outdoors, battery during video streaming, camera in low light)
- Mention real-world scenarios ("If you're at the beach...", "For Instagram stories...")
- Be conversational! ("Okay, so here's the deal...", "Between you and me...")
- Add personality! ("The camera on this thing? *Chef's kiss* 🤌")

Customer question: ${query}`
                }
            ]
        });

        const textBlock = response.content.find(
            (block): block is { type: 'text'; text: string } =>
                block.type === 'text'
        );

        const finalResponse = textBlock?.text || 'I apologize, I could not generate a response.';

        // Mock price data for popular products
        const mockPrices = [];
        if (query.toLowerCase().includes('price') || query.toLowerCase().includes('cost')) {
            if (query.toLowerCase().includes('iphone')) {
                mockPrices.push(
                    { store: 'Apple Store', price: '$1,199', link: '#' },
                    { store: 'Best Buy', price: '$1,149', link: '#' },
                    { store: 'Amazon', price: '$1,179', link: '#' }
                );
            } else if (query.toLowerCase().includes('samsung') || query.toLowerCase().includes('galaxy')) {
                mockPrices.push(
                    { store: 'Samsung Store', price: '$1,299', link: '#' },
                    { store: 'Best Buy', price: '$1,249', link: '#' },
                    { store: 'Amazon', price: '$1,279', link: '#' }
                );
            } else if (query.toLowerCase().includes('pixel')) {
                mockPrices.push(
                    { store: 'Google Store', price: '$999', link: '#' },
                    { store: 'Best Buy', price: '$949', link: '#' },
                    { store: 'Amazon', price: '$979', link: '#' }
                );
            }
        }

        console.log(`\n✅ Query processed successfully\n`);

        return {
            response: finalResponse,
            image: productImage !== 'https://via.placeholder.com/400x400.png?text=Tech+Product' ? productImage : null,
            prices: mockPrices
        };

    } catch (error) {
        console.error('❌ Claude processing error:', error);

        // Return a friendly error message
        return {
            response: "Oops! 😅 Something went wrong on my end. Mind trying that again? I promise I'm usually better at this!",
            image: null,
            prices: []
        };
    }
}