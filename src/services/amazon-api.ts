import ProductAdvertisingAPIv1 from 'paapi5-nodejs-sdk';
import { supabase } from './supabase.js';

// Initialize Amazon Product Advertising API
const defaultClient = ProductAdvertisingAPIv1.ApiClient.instance;
defaultClient.accessKey = process.env.AMAZON_ACCESS_KEY || '';
defaultClient.secretKey = process.env.AMAZON_SECRET_KEY || '';
defaultClient.host = 'webservices.amazon.sa'; // Saudi Arabia endpoint
defaultClient.region = 'eu-west-1'; // Saudi Arabia uses EU region

export interface AmazonProduct {
    asin?: string;
    title: string;
    price?: string;
    priceAmount?: number;
    currency?: string;
    image?: string;
    url?: string;
    detailPageURL?: string;
    rating?: number;
    reviewCount?: number;
    isPrime?: boolean;
    isFulfilledByAmazon?: boolean;
    savingsAmount?: string;
    savingsPercentage?: number;
    lowestPrice?: string;
}

export async function searchAmazonProducts(query: string): Promise<AmazonProduct[]> {
    if (!process.env.AMAZON_ACCESS_KEY || !process.env.AMAZON_SECRET_KEY) {
        console.log('Amazon API keys not configured - returning search URL with affiliate tag');
        // Return a fallback search result with affiliate link
        return [{
            title: query,
            url: `https://www.amazon.sa/s?k=${encodeURIComponent(query)}&tag=mobily00-21&linkCode=ll2`,
            price: 'Check on Amazon',
            image: undefined
        }];
    }

    try {
        const api = new ProductAdvertisingAPIv1.DefaultApi();

        const searchRequest = new ProductAdvertisingAPIv1.SearchItemsRequest();
        searchRequest['PartnerTag'] = 'mobily00-21'; // Saudi Arabia affiliate tag
        searchRequest['PartnerType'] = 'Associates';
        searchRequest['Keywords'] = query;
        searchRequest['SearchIndex'] = 'Electronics';
        searchRequest['ItemCount'] = 5;
        searchRequest['Marketplace'] = 'www.amazon.sa'; // Saudi Arabia marketplace
        searchRequest['CurrencyOfPreference'] = 'SAR'; // Saudi Riyals
        searchRequest['LanguagesOfPreference'] = ['ar_SA']; // Arabic content
        searchRequest['Condition'] = 'New'; // Only new items
        searchRequest['DeliveryFlags'] = ['Prime', 'FulfilledByAmazon']; // Prime and FBA items
        searchRequest['SortBy'] = 'Relevance'; // Sort by relevance
        searchRequest['Resources'] = [
            'ItemInfo.Title',
            'Images.Primary.Small',
            'Images.Primary.Medium',
            'Images.Primary.Large',
            'Offers.Listings.Price',
            'Offers.Listings.SavingBasis',
            'Offers.Summaries.LowestPrice',
            'Offers.Listings.DeliveryInfo.IsPrimeEligible',
            'Offers.Listings.DeliveryInfo.IsFreeShippingEligible',
            'Offers.Listings.DeliveryInfo.IsAmazonFulfilled',
            'CustomerReviews.Count',
            'CustomerReviews.StarRating'
        ];

        const response = await new Promise<any>((resolve, reject) => {
            api.searchItems(searchRequest, (error: any, data: any) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(data);
                }
            });
        });

        if (!response?.SearchResult?.Items) {
            return [];
        }

        const products = await Promise.all(response.SearchResult.Items.map(async (item: any) => {
            // Use DetailPageURL for exact product link with affiliate tag
            const detailPageURL = item.DetailPageURL;
            console.log('Amazon DetailPageURL:', detailPageURL);

            // Get best available image (fallback from Large to Medium to Small)
            const imageUrl = item.Images?.Primary?.Large?.URL ||
                           item.Images?.Primary?.Medium?.URL ||
                           item.Images?.Primary?.Small?.URL;

            // Extract price information
            const listing = item.Offers?.Listings?.[0];
            const priceAmount = listing?.Price?.Amount;
            const displayPrice = listing?.Price?.DisplayAmount;
            const savingsAmount = listing?.Price?.Savings?.Amount;
            const savingsPercentage = listing?.Price?.Savings?.Percentage;
            const lowestPrice = item.Offers?.Summaries?.[0]?.LowestPrice?.DisplayAmount;

            // Extract delivery information
            const isPrime = listing?.DeliveryInfo?.IsPrimeEligible || false;
            const isFulfilledByAmazon = listing?.DeliveryInfo?.IsAmazonFulfilled || false;

            const product: AmazonProduct = {
                asin: item.ASIN,
                title: item.ItemInfo?.Title?.DisplayValue || 'Unknown Product',
                price: displayPrice || lowestPrice || 'Check on Amazon',
                priceAmount: priceAmount,
                currency: listing?.Price?.Currency || 'SAR',
                image: imageUrl,
                url: detailPageURL, // Using DetailPageURL for exact product
                detailPageURL: detailPageURL,
                rating: item.CustomerReviews?.StarRating?.Value,
                reviewCount: item.CustomerReviews?.Count,
                isPrime: isPrime,
                isFulfilledByAmazon: isFulfilledByAmazon,
                savingsAmount: savingsAmount ? `Save ${listing?.Price?.Savings?.DisplayAmount}` : undefined,
                savingsPercentage: savingsPercentage,
                lowestPrice: lowestPrice
            };

            // Store in affiliate_data table for caching and analytics
            if (item.ASIN) {
                try {
                    await supabase.from('affiliate_data').upsert({
                        asin: item.ASIN,
                        product_name: product.title,
                        detail_page_url: detailPageURL,
                        image_url: imageUrl,
                        price: priceAmount,
                        currency: product.currency,
                        is_prime: isPrime,
                        is_fulfilled_by_amazon: isFulfilledByAmazon,
                        rating: product.rating,
                        reviews_count: product.reviewCount,
                        lowest_price: item.Offers?.Summaries?.[0]?.LowestPrice?.Amount,
                        savings_amount: savingsAmount,
                        savings_percentage: savingsPercentage,
                        last_updated: new Date()
                    });

                    // Increment search count
                    await supabase.rpc('increment_search_count', { p_asin: item.ASIN });
                } catch (dbError) {
                    console.error('Error storing affiliate data:', dbError);
                }
            }

            return product;
        }));

        return products;

    } catch (error: any) {
        console.error('Amazon API error:', error.message);

        // Try to fetch from cache first
        try {
            const { data: cachedProducts } = await supabase
                .from('affiliate_data')
                .select('*')
                .ilike('product_name', `%${query}%`)
                .order('last_updated', { ascending: false })
                .limit(5);

            if (cachedProducts && cachedProducts.length > 0) {
                console.log('Returning cached products');
                return cachedProducts.map(p => ({
                    asin: p.asin,
                    title: p.product_name,
                    price: p.price ? `${p.currency} ${p.price}` : 'Check on Amazon',
                    url: p.detail_page_url,
                    detailPageURL: p.detail_page_url,
                    image: p.image_url,
                    isPrime: p.is_prime,
                    rating: p.rating,
                    reviewCount: p.reviews_count
                }));
            }
        } catch (cacheError) {
            console.error('Cache lookup failed:', cacheError);
        }

        // Final fallback with search URL
        return [{
            title: query,
            url: `https://www.amazon.sa/s?k=${encodeURIComponent(query)}&tag=mobily00-21&linkCode=ll2`,
            price: 'Check on Amazon',
            image: undefined
        }];
    }
}

// Get items by ASIN for efficient comparison
export async function getItemsByASIN(asins: string[]): Promise<AmazonProduct[]> {
    if (!process.env.AMAZON_ACCESS_KEY || !process.env.AMAZON_SECRET_KEY) {
        console.log('Amazon API keys not configured');
        return [];
    }

    try {
        const api = new ProductAdvertisingAPIv1.DefaultApi();

        const getItemsRequest = new ProductAdvertisingAPIv1.GetItemsRequest();
        getItemsRequest['PartnerTag'] = 'mobily00-21';
        getItemsRequest['PartnerType'] = 'Associates';
        getItemsRequest['ItemIds'] = asins;
        getItemsRequest['ItemIdType'] = 'ASIN';
        getItemsRequest['Marketplace'] = 'www.amazon.sa';
        getItemsRequest['CurrencyOfPreference'] = 'SAR';
        getItemsRequest['LanguagesOfPreference'] = ['ar_SA'];
        getItemsRequest['Condition'] = 'New';
        getItemsRequest['Resources'] = [
            'ItemInfo.Title',
            'Images.Primary.Small',
            'Images.Primary.Medium',
            'Images.Primary.Large',
            'Offers.Listings.Price',
            'Offers.Listings.SavingBasis',
            'Offers.Summaries.LowestPrice',
            'Offers.Listings.DeliveryInfo.IsPrimeEligible',
            'Offers.Listings.DeliveryInfo.IsAmazonFulfilled',
            'CustomerReviews.Count',
            'CustomerReviews.StarRating'
        ];

        const response = await new Promise<any>((resolve, reject) => {
            api.getItems(getItemsRequest, (error: any, data: any) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(data);
                }
            });
        });

        if (!response?.ItemsResult?.Items) {
            return [];
        }

        return response.ItemsResult.Items.map((item: any) => {
            const imageUrl = item.Images?.Primary?.Large?.URL ||
                           item.Images?.Primary?.Medium?.URL ||
                           item.Images?.Primary?.Small?.URL;

            const listing = item.Offers?.Listings?.[0];
            const displayPrice = listing?.Price?.DisplayAmount;
            const lowestPrice = item.Offers?.Summaries?.[0]?.LowestPrice?.DisplayAmount;

            return {
                asin: item.ASIN,
                title: item.ItemInfo?.Title?.DisplayValue || 'Unknown Product',
                price: displayPrice || lowestPrice || 'Check on Amazon',
                priceAmount: listing?.Price?.Amount,
                currency: listing?.Price?.Currency || 'SAR',
                image: imageUrl,
                url: item.DetailPageURL,
                detailPageURL: item.DetailPageURL,
                rating: item.CustomerReviews?.StarRating?.Value,
                reviewCount: item.CustomerReviews?.Count,
                isPrime: listing?.DeliveryInfo?.IsPrimeEligible || false,
                isFulfilledByAmazon: listing?.DeliveryInfo?.IsAmazonFulfilled || false,
                savingsAmount: listing?.Price?.Savings?.DisplayAmount,
                savingsPercentage: listing?.Price?.Savings?.Percentage,
                lowestPrice: lowestPrice
            };
        });

    } catch (error: any) {
        console.error('GetItems API error:', error.message);
        return [];
    }
}

// Get product image from Amazon
export async function getAmazonProductImage(productName: string): Promise<string | null> {
    const products = await searchAmazonProducts(productName);
    return products[0]?.image || null;
}

// Get product details with price and shopping links
export async function getAmazonProductDetails(productName: string, language: string = 'en') {
    console.log('Amazon API: Getting details for:', productName);
    const products = await searchAmazonProducts(productName);
    if (products.length === 0) {
        console.log('Amazon API: No products found, using fallback');
        // Always return a result with affiliate link
        return {
            name: productName,
            price: 'Check on Amazon',
            image: undefined,
            url: `https://www.amazon.sa/s?k=${encodeURIComponent(productName)}&tag=mobily00-21&linkCode=ll2`,
            shoppingLinks: [{
                store: language === 'ar' ? 'أمازون السعودية' : 'Amazon.sa',
                url: `https://www.amazon.sa/s?k=${encodeURIComponent(productName)}&tag=mobily00-21&linkCode=ll2`,
                price: 'Check Website',
                available: true,
                productName: productName,
                isFromAmazonAPI: true
            }]
        };
    }

    const product = products[0];

    // Create shopping links array with Amazon data
    const shoppingLinks = [];

    // Always add Amazon link with affiliate URL
    const affiliateUrl = product.url || `https://www.amazon.sa/s?k=${encodeURIComponent(productName)}&tag=mobily00-21`;

    // Ensure affiliate tag is present
    const urlWithTag = affiliateUrl.includes('tag=') ? affiliateUrl :
                       (affiliateUrl.includes('?') ? `${affiliateUrl}&tag=mobily00-21` : `${affiliateUrl}?tag=mobily00-21`);

    shoppingLinks.push({
        store: language === 'ar' ? 'أمازون السعودية' : 'Amazon.sa',
        url: urlWithTag,
        price: product.price || 'Check Website',
        available: true,
        productName: product.title || productName,
        isFromAmazonAPI: true, // Flag to identify this came from Amazon API
        isPrime: product.isPrime, // Pass Prime eligibility
        isFulfilledByAmazon: product.isFulfilledByAmazon, // Pass FBA status
        asin: product.asin // Pass ASIN for tracking
    });

    return {
        name: product.title,
        price: product.price,
        image: product.image,
        url: product.url,
        rating: product.rating,
        reviews: product.reviewCount,
        shoppingLinks
    };
}