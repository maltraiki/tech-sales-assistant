import ProductAdvertisingAPIv1 from 'paapi5-nodejs-sdk';

// Initialize Amazon Product Advertising API
const defaultClient = ProductAdvertisingAPIv1.ApiClient.instance;
defaultClient.accessKey = process.env.AMAZON_ACCESS_KEY || '';
defaultClient.secretKey = process.env.AMAZON_SECRET_KEY || '';
defaultClient.host = 'webservices.amazon.sa'; // Saudi Arabia endpoint
defaultClient.region = 'eu-west-1'; // Saudi Arabia uses EU region

export interface AmazonProduct {
    title: string;
    price?: string;
    image?: string;
    url?: string;
    rating?: number;
    reviewCount?: number;
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
        searchRequest['Resources'] = [
            'Images.Primary.Large',
            'ItemInfo.Title',
            'Offers.Listings.Price',
            'CustomerReviews.Rating',
            'CustomerReviews.Count'
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

        return response.SearchResult.Items.map((item: any) => {
            // Log the affiliate URL to verify it has the tag
            const affiliateUrl = item.DetailPageURL;
            console.log('Amazon Affiliate URL:', affiliateUrl);
            console.log('Has affiliate tag?:', affiliateUrl?.includes('tag=mobily00-21'));

            return {
                title: item.ItemInfo?.Title?.DisplayValue || 'Unknown Product',
                price: item.Offers?.Listings?.[0]?.Price?.DisplayAmount,
                image: item.Images?.Primary?.Large?.URL,
                url: affiliateUrl,
                rating: item.CustomerReviews?.Rating?.DisplayValue,
                reviewCount: item.CustomerReviews?.Count?.DisplayValue
            };
        });

    } catch (error: any) {
        console.error('Amazon API error - returning fallback:', error.message);
        // Return fallback search with affiliate link on error
        return [{
            title: query,
            url: `https://www.amazon.sa/s?k=${encodeURIComponent(query)}&tag=mobily00-21&linkCode=ll2`,
            price: 'Check on Amazon',
            image: undefined
        }];
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
        isFromAmazonAPI: true // Flag to identify this came from Amazon API
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