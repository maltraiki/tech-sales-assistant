export const productImages: Record<string, string> = {
    // iPhones
    "iphone 16 pro max": "https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-16-pro-max-titanium-select?wid=400",
    "iphone 16 pro": "https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-16-pro-titanium-select?wid=400",
    "iphone 16": "https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-16-blue-select?wid=400",
    "iphone 15 pro max": "https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-15-pro-max-titanium-select?wid=400",
    "iphone 15": "https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-15-pink-select?wid=400",

    // Samsung
    "samsung galaxy s24 ultra": "https://images.samsung.com/is/image/samsung/p6pim/sg/2401/gallery/sg-galaxy-s24-s928-sm-s928bztvxsp-thumb-539305459?$344_344_PNG$",
    "samsung galaxy s24": "https://images.samsung.com/is/image/samsung/p6pim/sg/2401/gallery/sg-galaxy-s24-s921-sm-s921blbcxsp-thumb-539305347?$344_344_PNG$",
    "galaxy s24 ultra": "https://images.samsung.com/is/image/samsung/p6pim/sg/2401/gallery/sg-galaxy-s24-s928-sm-s928bztvxsp-thumb-539305459?$344_344_PNG$",
    "galaxy s24": "https://images.samsung.com/is/image/samsung/p6pim/sg/2401/gallery/sg-galaxy-s24-s921-sm-s921blbcxsp-thumb-539305347?$344_344_PNG$",

    // Google Pixel
    "google pixel 9 pro": "https://lh3.googleusercontent.com/T68tJKOncdn_CTsEZGGPRtN3M1DhZmZOiVfhzo2GBVR6PNMJ9OYoFJJhSvZiKKTzCA3yx7Z_3oHMkW5hG5mZBCbT=rw-e365-w400",
    "google pixel 9": "https://lh3.googleusercontent.com/a3U6QZHNjxMCF2sid6XYtByPEh_5gYQM1ympLMXqf-3S5F8IQNhLBpY-8PcvY-8thfk-fCv5aSJqZ3lX5Nh0Bg=rw-e365-w400",
    "pixel 9 pro": "https://lh3.googleusercontent.com/T68tJKOncdn_CTsEZGGPRtN3M1DhZmZOiVfhzo2GBVR6PNMJ9OYoFJJhSvZiKKTzCA3yx7Z_3oHMkW5hG5mZBCbT=rw-e365-w400",
    "pixel 9": "https://lh3.googleusercontent.com/a3U6QZHNjxMCF2sid6XYtByPEh_5gYQM1ympLMXqf-3S5F8IQNhLBpY-8PcvY-8thfk-fCv5aSJqZ3lX5Nh0Bg=rw-e365-w400",

    // OnePlus
    "oneplus 12": "https://image01.oneplus.net/media/202401/16/8e97ca3f8f3d43c1a90ae8e9e4e4e0f9.png",
    "oneplus open": "https://image01.oneplus.net/media/202310/11/92f2ee3c1c6e48e5af91e0e6e1e9e0a1.png",

    // Default
    "default": "https://via.placeholder.com/400x400.png?text=Tech+Product"
};

export const productSpecs: Record<string, any> = {
    "iphone 16 pro max": {
        display: "6.9\" Super Retina XDR OLED, 120Hz ProMotion",
        battery: "4,685 mAh - Up to 33 hours video playback",
        camera: "48MP Main + 48MP Ultra Wide + 12MP 5x Telephoto",
        processor: "A18 Pro Bionic chip",
        price: "$1,199 - $1,599",
        colors: ["Natural Titanium", "Blue Titanium", "White Titanium", "Black Titanium"],
        storage: ["256GB", "512GB", "1TB"]
    },
    "samsung galaxy s24 ultra": {
        display: "6.8\" Dynamic AMOLED 2X, 120Hz",
        battery: "5,000 mAh - All-day battery life",
        camera: "200MP Main + 12MP Ultra Wide + 50MP 5x Periscope + 10MP 3x Telephoto",
        processor: "Snapdragon 8 Gen 3",
        price: "$1,299 - $1,659",
        colors: ["Titanium Black", "Titanium Gray", "Titanium Violet", "Titanium Yellow"],
        storage: ["256GB", "512GB", "1TB"]
    },
    "google pixel 9 pro": {
        display: "6.8\" LTPO OLED, 120Hz",
        battery: "5,050 mAh - 24+ hour battery life",
        camera: "50MP Main + 48MP Ultra Wide + 48MP 5x Telephoto",
        processor: "Google Tensor G4",
        price: "$999 - $1,199",
        colors: ["Obsidian", "Porcelain", "Hazel", "Rose"],
        storage: ["128GB", "256GB", "512GB", "1TB"]
    }
};

export function findProductImage(query: string): string {
    const lowerQuery = query.toLowerCase();

    // Check for exact matches first
    for (const [key, url] of Object.entries(productImages)) {
        if (lowerQuery.includes(key)) {
            return url;
        }
    }

    // Check for partial matches
    const keywords = ["iphone", "samsung", "galaxy", "pixel", "oneplus"];
    for (const keyword of keywords) {
        if (lowerQuery.includes(keyword)) {
            for (const [key, url] of Object.entries(productImages)) {
                if (key.includes(keyword)) {
                    return url;
                }
            }
        }
    }

    return productImages.default;
}

export function getProductSpecs(productName: string): any {
    const lowerName = productName.toLowerCase();

    for (const [key, specs] of Object.entries(productSpecs)) {
        if (lowerName.includes(key) || key.includes(lowerName)) {
            return specs;
        }
    }

    return null;
}