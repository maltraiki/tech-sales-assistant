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
        console.log('Amazon API keys not configured');
        return [];
    }

    try {
        const api = new ProductAdvertisingAPIv1.DefaultApi();

        const searchRequest = new ProductAdvertisingAPIv1.SearchItemsRequest();
        searchRequest['PartnerTag'] = 'mobily00-21'; // Your affiliate tag
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

        return response.SearchResult.Items.map((item: any) => ({
            title: item.ItemInfo?.Title?.DisplayValue || 'Unknown Product',
            price: item.Offers?.Listings?.[0]?.Price?.DisplayAmount,
            image: item.Images?.Primary?.Large?.URL,
            url: item.DetailPageURL,
            rating: item.CustomerReviews?.Rating?.DisplayValue,
            reviewCount: item.CustomerReviews?.Count?.DisplayValue
        }));

    } catch (error) {
        console.error('Amazon API error:', error);
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
    const products = await searchAmazonProducts(productName);
    if (products.length === 0) return null;

    const product = products[0];

    // Create shopping links array with Amazon data
    const shoppingLinks = [];

    // Add Amazon link with affiliate URL
    if (product.url) {
        shoppingLinks.push({
            store: language === 'ar' ? 'أمازون السعودية' : 'Amazon.sa',
            url: product.url, // This already has the affiliate tag from the API
            price: product.price || 'Check Website',
            available: true,
            productName: product.title,
            isFromAmazonAPI: true // Flag to identify this came from Amazon API
        });
    }

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