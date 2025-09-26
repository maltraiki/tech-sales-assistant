interface ShoppingLink {
    store: string;
    url: string;
    price?: string;
    available?: boolean;
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
        available: true
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

// Function to generate direct product links based on known patterns
export function getDirectProductLinks(productName: string, language: string = 'en'): ShoppingLink[] {
    const links: ShoppingLink[] = [];
    const lowerName = productName.toLowerCase();

    // Amazon affiliate parameters
    const amazonAffiliateParams = '&linkCode=ll2&tag=mobily00-21&linkId=112a41b46657617b0afd9ddf27343051&language=en_AE&ref_=as_li_ss_tl';

    // iPhone specific links
    if (lowerName.includes('iphone 16 pro max')) {
        links.push(
            {
                store: language === 'ar' ? 'أمازون السعودية' : 'Amazon.sa',
                url: `https://www.amazon.sa/s?k=iphone+16+pro+max${amazonAffiliateParams}`,
                price: language === 'ar' ? '٥،٣٩٩+ ريال' : 'SAR 5,399+',
                available: true
            },
            {
                store: language === 'ar' ? 'نون' : 'Noon.com',
                url: 'https://www.noon.com/saudi-en/search/?q=iphone%2016%20pro%20max',
                price: language === 'ar' ? '٥،٢٩٩+ ريال' : 'SAR 5,299+',
                available: true
            },
            {
                store: language === 'ar' ? 'اكسترا' : 'Extra Stores',
                url: 'https://www.extra.com/en-sa/search/?q=iphone+16+pro+max',
                price: language === 'ar' ? '٥،٤٩٩+ ريال' : 'SAR 5,499+',
                available: true
            },
            {
                store: language === 'ar' ? 'مكتبة جرير' : 'Jarir Bookstore',
                url: 'https://www.jarir.com/sa-en/catalogsearch/result/?q=iphone+16+pro+max',
                price: language === 'ar' ? '٥،٣٩٩+ ريال' : 'SAR 5,399+',
                available: true
            }
        );
    } else if (lowerName.includes('iphone 16')) {
        links.push(
            {
                store: language === 'ar' ? 'أمازون السعودية' : 'Amazon.sa',
                url: `https://www.amazon.sa/s?k=iphone+16${amazonAffiliateParams}`,
                price: language === 'ar' ? '٣،٣٩٩+ ريال' : 'SAR 3,399+',
                available: true
            },
            {
                store: language === 'ar' ? 'نون' : 'Noon.com',
                url: 'https://www.noon.com/saudi-en/search/?q=iphone%2016',
                price: language === 'ar' ? '٣،٢٩٩+ ريال' : 'SAR 3,299+',
                available: true
            }
        );
    }

    // Samsung Galaxy links
    if (lowerName.includes('galaxy s24 ultra') || lowerName.includes('samsung s24 ultra')) {
        links.push(
            {
                store: language === 'ar' ? 'أمازون السعودية' : 'Amazon.sa',
                url: `https://www.amazon.sa/s?k=samsung+galaxy+s24+ultra${amazonAffiliateParams}`,
                price: language === 'ar' ? '٤،٨٩٩+ ريال' : 'SAR 4,899+',
                available: true
            },
            {
                store: language === 'ar' ? 'نون' : 'Noon.com',
                url: 'https://www.noon.com/saudi-en/search/?q=samsung%20galaxy%20s24%20ultra',
                price: language === 'ar' ? '٤،٧٩٩+ ريال' : 'SAR 4,799+',
                available: true
            },
            {
                store: language === 'ar' ? 'اكسترا' : 'Extra Stores',
                url: 'https://www.extra.com/en-sa/search/?q=samsung+galaxy+s24+ultra',
                price: language === 'ar' ? '٤،٩٩٩+ ريال' : 'SAR 4,999+',
                available: true
            }
        );
    } else if (lowerName.includes('galaxy s24') || lowerName.includes('samsung s24')) {
        links.push(
            {
                store: language === 'ar' ? 'أمازون السعودية' : 'Amazon.sa',
                url: `https://www.amazon.sa/s?k=samsung+galaxy+s24${amazonAffiliateParams}`,
                price: language === 'ar' ? '٣،١٩٩+ ريال' : 'SAR 3,199+',
                available: true
            },
            {
                store: language === 'ar' ? 'نون' : 'Noon.com',
                url: 'https://www.noon.com/saudi-en/search/?q=samsung%20galaxy%20s24',
                price: language === 'ar' ? '٣،٠٩٩+ ريال' : 'SAR 3,099+',
                available: true
            }
        );
    }

    // Google Pixel links
    if (lowerName.includes('pixel 9 pro')) {
        links.push(
            {
                store: language === 'ar' ? 'أمازون السعودية' : 'Amazon.sa',
                url: `https://www.amazon.sa/s?k=google+pixel+9+pro${amazonAffiliateParams}`,
                price: language === 'ar' ? '٣،٧٩٩+ ريال' : 'SAR 3,799+',
                available: true
            },
            {
                store: language === 'ar' ? 'نون' : 'Noon.com',
                url: 'https://www.noon.com/saudi-en/search/?q=google%20pixel%209%20pro',
                price: language === 'ar' ? '٣،٦٩٩+ ريال' : 'SAR 3,699+',
                available: true
            }
        );
    } else if (lowerName.includes('pixel 9')) {
        links.push(
            {
                store: language === 'ar' ? 'أمازون السعودية' : 'Amazon.sa',
                url: `https://www.amazon.sa/s?k=google+pixel+9${amazonAffiliateParams}`,
                price: language === 'ar' ? '٢،٩٩٩+ ريال' : 'SAR 2,999+',
                available: true
            },
            {
                store: language === 'ar' ? 'نون' : 'Noon.com',
                url: 'https://www.noon.com/saudi-en/search/?q=google%20pixel%209',
                price: language === 'ar' ? '٢،٨٩٩+ ريال' : 'SAR 2,899+',
                available: true
            }
        );
    }

    // OnePlus links
    if (lowerName.includes('oneplus 12')) {
        links.push(
            {
                store: language === 'ar' ? 'أمازون السعودية' : 'Amazon.sa',
                url: `https://www.amazon.sa/s?k=oneplus+12${amazonAffiliateParams}`,
                price: language === 'ar' ? '٢،٧٩٩+ ريال' : 'SAR 2,799+',
                available: true
            },
            {
                store: language === 'ar' ? 'نون' : 'Noon.com',
                url: 'https://www.noon.com/saudi-en/search/?q=oneplus%2012',
                price: language === 'ar' ? '٢،٦٩٩+ ريال' : 'SAR 2,699+',
                available: true
            }
        );
    }

    return links;
}