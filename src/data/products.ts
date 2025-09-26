// No hardcoded images - all images fetched dynamically from Serper API
export const productImages: Record<string, string> = {};

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

export function findProductImage(query: string): string | null {
    // Return null to force Serper API to fetch real images
    return null;
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