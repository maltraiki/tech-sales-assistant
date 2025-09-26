import { Tool } from './types.js';

export const tools: Tool[] = [
    {
        name: "search_web",
        description: "Search the web for current product information, specifications, reviews, and prices. Use this to get the latest information about any tech product.",
        input_schema: {
            type: "object",
            properties: {
                query: {
                    type: "string",
                    description: "Search query for product information. Be specific and include product names, models, or features."
                }
            },
            required: ["query"]
        }
    },
    {
        name: "get_product_image",
        description: "Get official product image from manufacturer website (Apple, Samsung, Google, etc.)",
        input_schema: {
            type: "object",
            properties: {
                product_name: {
                    type: "string",
                    description: "Full product name to search for official image (e.g., 'iPhone 16 Pro', 'Samsung Galaxy S24')"
                }
            },
            required: ["product_name"]
        }
    },
    {
        name: "compare_prices",
        description: "Compare prices from different online retailers to help customers find the best deal",
        input_schema: {
            type: "object",
            properties: {
                product_name: {
                    type: "string",
                    description: "Product name to compare prices across retailers"
                }
            },
            required: ["product_name"]
        }
    }
];