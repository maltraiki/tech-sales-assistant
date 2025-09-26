import axios, { AxiosResponse } from 'axios';
import { SearchResult, PriceInfo, SerperSearchResponse } from '../types.js';

const SERPER_BASE_URL = 'https://google.serper.dev';

export async function searchWeb(query: string): Promise<SearchResult[]> {
    try {
        console.log(`🔍 Searching web: "${query}"`);
        const SERPER_API_KEY = process.env.SERPER_API_KEY || '';

        const response: AxiosResponse<SerperSearchResponse> = await axios.post(
            `${SERPER_BASE_URL}/search`,
            {
                q: query,
                num: 5
            },
            {
                headers: {
                    'X-API-KEY': SERPER_API_KEY,
                    'Content-Type': 'application/json'
                }
            }
        );

        const results = response.data.organic || [];
        console.log(`✅ Found ${results.length} search results`);

        return results.map(r => ({
            title: r.title,
            snippet: r.snippet,
            link: r.link
        }));
    } catch (error) {
        console.error('❌ Search error:', error);
        return [{
            title: 'Search Error',
            snippet: 'Could not fetch search results',
            link: ''
        }];
    }
}

export async function getProductImage(productName: string): Promise<string | null> {
    try {
        console.log(`🖼️ Getting product image: "${productName}"`);
        const SERPER_API_KEY = process.env.SERPER_API_KEY || '';

        const response: AxiosResponse<SerperSearchResponse> = await axios.post(
            `${SERPER_BASE_URL}/images`,
            {
                q: `${productName} official product image site:apple.com OR site:samsung.com OR site:google.com OR site:oneplus.com`,
                num: 5
            },
            {
                headers: {
                    'X-API-KEY': SERPER_API_KEY,
                    'Content-Type': 'application/json'
                }
            }
        );

        const images = response.data.images || [];
        const imageUrl = images.length > 0 ? images[0].imageUrl : null;

        if (imageUrl) {
            console.log(`✅ Found product image`);
        } else {
            console.log(`⚠️ No product image found`);
        }

        return imageUrl;
    } catch (error) {
        console.error('❌ Image search error:', error);
        return null;
    }
}

export async function comparePrices(productName: string): Promise<PriceInfo[]> {
    try {
        console.log(`💰 Comparing prices for: "${productName}"`);
        const SERPER_API_KEY = process.env.SERPER_API_KEY || '';

        const response: AxiosResponse<SerperSearchResponse> = await axios.post(
            `${SERPER_BASE_URL}/search`,
            {
                q: `${productName} price buy online`,
                num: 12
            },
            {
                headers: {
                    'X-API-KEY': SERPER_API_KEY,
                    'Content-Type': 'application/json'
                }
            }
        );

        const results = response.data.organic || [];
        const prices: PriceInfo[] = [];
        const seenStores = new Set<string>();

        results.forEach(result => {
            const priceMatch = (result.title + ' ' + result.snippet).match(/\$[\d,]+(?:\.\d{2})?/);

            if (priceMatch) {
                let storeName = result.title.split('-')[0].trim();

                if (result.link.includes('amazon.com')) storeName = 'Amazon';
                else if (result.link.includes('bestbuy.com')) storeName = 'Best Buy';
                else if (result.link.includes('walmart.com')) storeName = 'Walmart';
                else if (result.link.includes('target.com')) storeName = 'Target';
                else if (result.link.includes('apple.com')) storeName = 'Apple Store';
                else if (result.link.includes('samsung.com')) storeName = 'Samsung Store';
                else storeName = new URL(result.link).hostname.replace('www.', '');

                if (!seenStores.has(storeName)) {
                    seenStores.add(storeName);
                    prices.push({
                        store: storeName,
                        price: priceMatch[0],
                        link: result.link
                    });
                }
            }
        });

        console.log(`✅ Found ${prices.length} price comparisons`);
        return prices.slice(0, 6);
    } catch (error) {
        console.error('❌ Price comparison error:', error);
        return [];
    }
}