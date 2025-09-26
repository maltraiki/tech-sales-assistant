export interface Tool {
    name: string;
    description: string;
    input_schema: {
        type: string;
        properties: Record<string, any>;
        required: string[];
    };
}

export interface SearchResult {
    title: string;
    snippet: string;
    link: string;
}

export interface PriceInfo {
    store: string;
    price: string;
    link: string;
}

export interface SerperSearchResponse {
    organic?: Array<{
        title: string;
        snippet: string;
        link: string;
    }>;
    images?: Array<{
        imageUrl: string;
    }>;
}

export interface SearchRequest {
    query: string;
    language?: string;
}

export interface SearchResponse {
    response: string;
    image: string | null;
    images?: string[];  // For multiple product images in comparisons
    prices: PriceInfo[];
}

export type MessageContent =
    | { type: 'text'; text: string }
    | { type: 'tool_use'; id: string; name: string; input: any }
    | { type: 'tool_result'; tool_use_id: string; content: string };

export interface Message {
    role: 'user' | 'assistant';
    content: string | MessageContent[];
}