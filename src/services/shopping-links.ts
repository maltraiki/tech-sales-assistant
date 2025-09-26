interface ShoppingLink {
    store: string;
    url: string;
    price?: string;
    available?: boolean;
    productName?: string;
}

export async function getShoppingLinks(productName: string, language: string = 'en'): Promise<ShoppingLink[]> {
    const links: ShoppingLink[] = [];

    // Clean and encode the product name for URL
    const cleanProductName = productName
        .toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    // Create search-friendly versions
    const searchTerms = {
        amazon: encodeURIComponent(cleanProductName),
        noon: encodeURIComponent(cleanProductName)
    };

    // Amazon Saudi Arabia link with affiliate parameters
    const amazonAffiliateParams = '&linkCode=ll2&tag=mobily00-21&linkId=112a41b46657617b0afd9ddf27343051&language=en_AE&ref_=as_li_ss_tl';
    links.push({
        store: language === 'ar' ? 'أمازون السعودية' : 'Amazon.sa',
        url: `https://www.amazon.sa/s?k=${searchTerms.amazon}${amazonAffiliateParams}`,
        available: true,
        productName: productName
    });

    // Noon.com link
    links.push({
        store: language === 'ar' ? 'نون' : 'Noon.com',
        url: `https://www.noon.com/saudi-en/search/?q=${searchTerms.noon}`,
        available: true
    });

    // Add Extra Stores link if it's a Samsung product
    if (cleanProductName.includes('samsung') || cleanProductName.includes('galaxy')) {
        links.push({
            store: language === 'ar' ? 'اكسترا' : 'Extra Stores',
            url: `https://www.extra.com/en-sa/search/?q=${searchTerms.amazon}`,
            available: true
        });
    }

    // Add Jarir Bookstore for all tech products
    links.push({
        store: language === 'ar' ? 'مكتبة جرير' : 'Jarir Bookstore',
        url: `https://www.jarir.com/sa-en/catalogsearch/result/?q=${searchTerms.amazon}`,
        available: true
    });

    // Add Apple Store link if it's an iPhone
    if (cleanProductName.includes('iphone') || cleanProductName.includes('apple')) {
        const appleProduct = cleanProductName
            .replace('apple', '')
            .replace(/\s+/g, '-')
            .trim();
        links.push({
            store: language === 'ar' ? 'آبل ستور' : 'Apple Store',
            url: `https://www.apple.com/sa/shop/buy-iphone`,
            available: true
        });
    }

    return links;
}

// Function to generate direct product links dynamically for ANY product
export function getDirectProductLinks(productName: string, language: string = 'en'): ShoppingLink[] {
    const links: ShoppingLink[] = [];

    // Clean the product name for URLs
    const cleanName = productName
        .toLowerCase()
        .trim()
        .replace(/[^\w\s]/g, ' ')
        .replace(/\s+/g, '+');

    // Amazon affiliate parameters
    const amazonAffiliateParams = '&linkCode=ll2&tag=mobily00-21&linkId=112a41b46657617b0afd9ddf27343051&language=en_AE&ref_=as_li_ss_tl';

    // Always add Amazon.sa with affiliate link
    links.push({
        store: language === 'ar' ? 'أمازون السعودية' : 'Amazon.sa',
        url: `https://www.amazon.sa/s?k=${cleanName}${amazonAffiliateParams}`,
        available: true,
        productName: productName
    });

    // Always add Noon.com
    links.push({
        store: language === 'ar' ? 'نون' : 'Noon.com',
        url: `https://www.noon.com/saudi-en/search/?q=${encodeURIComponent(productName)}`,
        available: true
    });

    // Always add Jarir Bookstore for tech products
    links.push({
        store: language === 'ar' ? 'مكتبة جرير' : 'Jarir Bookstore',
        url: `https://www.jarir.com/sa-en/catalogsearch/result/?q=${cleanName}`,
        available: true
    });

    // Always add Extra Stores
    links.push({
        store: language === 'ar' ? 'اكسترا' : 'Extra Stores',
        url: `https://www.extra.com/en-sa/search/?q=${cleanName}`,
        available: true
    });

    // Add Apple Store if it's an Apple product
    const lowerName = productName.toLowerCase();
    if (lowerName.includes('iphone') || lowerName.includes('ipad') ||
        lowerName.includes('macbook') || lowerName.includes('apple') ||
        lowerName.includes('airpods') || lowerName.includes('watch')) {
        links.push({
            store: language === 'ar' ? 'آبل ستور' : 'Apple Store',
            url: 'https://www.apple.com/sa/shop',
            available: true
        });
    }

    // Add Samsung Store if it's a Samsung product
    if (lowerName.includes('samsung') || lowerName.includes('galaxy')) {
        links.push({
            store: language === 'ar' ? 'سامسونج' : 'Samsung Store',
            url: `https://www.samsung.com/sa/search/?searchvalue=${encodeURIComponent(productName)}`,
            available: true
        });
    }

    return links;
}