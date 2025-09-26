import Anthropic from '@anthropic-ai/sdk';
import { tools } from '../tools.js';
import { Message, MessageContent, SearchResponse } from '../types.js';
import { searchWeb, getProductImage, comparePrices } from './serper.js';

export async function processQuery(query: string): Promise<SearchResponse> {
    console.log(`\n🤖 Processing query: "${query}"\n`);
    console.log(`API Key present: ${!!process.env.ANTHROPIC_API_KEY}`);

    const anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY || ''
    });

    // Start fresh conversation for each query
    let conversationHistory: Message[] = [
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
- Always get the LATEST information using your tools
- Compare products objectively when asked
- Highlight key differences that matter to users
- Mention both official prices AND available deals
- Be specific with numbers and specs

Customer question: ${query}`
        }
    ];

    let productImage: string | null = null;
    let priceComparison: any[] = [];
    let finalResponse: string = '';

    try {
        let continueLoop = true;
        let loopCount = 0;
        const maxLoops = 10;

        while (continueLoop && loopCount < maxLoops) {
            loopCount++;

            const response = await anthropic.messages.create({
                model: "claude-3-5-sonnet-20240620",
                max_tokens: 2048,
                temperature: 0.8,
                tools: tools,
                messages: conversationHistory
            });

            if (response.stop_reason === 'tool_use') {
                const toolUse = response.content.find(
                    (block): block is { type: 'tool_use'; id: string; name: string; input: any } =>
                        block.type === 'tool_use'
                );

                if (toolUse) {
                    let toolResult: any;
                    let toolError = false;

                    try {
                        switch (toolUse.name) {
                            case 'search_web':
                                toolResult = await searchWeb(toolUse.input.query);
                                break;

                            case 'get_product_image':
                                productImage = await getProductImage(toolUse.input.product_name);
                                toolResult = {
                                    image_url: productImage,
                                    success: productImage !== null
                                };
                                break;

                            case 'compare_prices':
                                priceComparison = await comparePrices(toolUse.input.product_name);
                                toolResult = priceComparison;
                                break;

                            default:
                                toolResult = { error: 'Unknown tool' };
                        }
                    } catch (error) {
                        console.error(`Tool error for ${toolUse.name}:`, error);
                        toolResult = {
                            error: 'Tool execution failed',
                            details: error instanceof Error ? error.message : 'Unknown error'
                        };
                        toolError = true;
                    }

                    // Add assistant's tool use to history
                    conversationHistory.push({
                        role: "assistant",
                        content: response.content
                    });

                    // Add tool result to history
                    conversationHistory.push({
                        role: "user",
                        content: [
                            {
                                type: "tool_result",
                                tool_use_id: toolUse.id,
                                content: JSON.stringify(toolResult)
                            }
                        ]
                    });
                }
            } else {
                // Got final response
                const textBlock = response.content.find(
                    (block): block is { type: 'text'; text: string } =>
                        block.type === 'text'
                );
                finalResponse = textBlock?.text || 'I apologize, I could not generate a response.';
                continueLoop = false;
            }
        }

        console.log(`\n✅ Query processed successfully\n`);

        return {
            response: finalResponse || "I'm sorry, I encountered an issue processing your request. Please try again.",
            image: productImage,
            prices: priceComparison
        };

    } catch (error) {
        console.error('❌ Claude processing error:', error);

        // Return a friendly error message
        return {
            response: "I apologize, but I encountered an issue while processing your request. Please try asking your question again in a moment.",
            image: null,
            prices: []
        };
    }
}