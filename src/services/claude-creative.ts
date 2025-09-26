import Anthropic from '@anthropic-ai/sdk';
import { SearchResponse } from '../types.js';
import { getProductImage, comparePrices } from './serper.js';
import { getDirectProductLinks, getShoppingLinks } from './shopping-links.js';
import { findProductImage } from '../data/products.js';

export async function processQuery(query: string, language: string = 'en'): Promise<SearchResponse> {
    console.log(`\n🤖 Processing creative query: "${query}" in ${language}\n`);

    // Debug API key loading
    const apiKey = process.env.ANTHROPIC_API_KEY;
    console.log('API Key exists:', !!apiKey);
    console.log('API Key length:', apiKey ? apiKey.length : 0);
    console.log('First 10 chars:', apiKey ? apiKey.substring(0, 10) + '...' : 'NO KEY');

    if (!apiKey || apiKey === '') {
        console.error('ANTHROPIC_API_KEY is not set!');
        return {
            response: language === 'ar'
                ? "⚠️ خطأ: مفتاح API غير موجود. تحقق من إعدادات Vercel."
                : "⚠️ Error: ANTHROPIC_API_KEY is not set. Please check Vercel environment variables.",
            image: null,
            prices: []
        };
    }

    const anthropic = new Anthropic({
        apiKey: apiKey
    });

    // Try to get real product image from search
    let productImage: string | null = null;
    let priceComparison: any[] = [];

    // Extract product names from query for image search (English and Arabic)
    const productPatterns = [
        /iphone\s*\d+\s*(?:pro\s*max|pro|plus)?/gi,
        /آيفون\s*\d+\s*(?:برو\s*ماكس|برو|بلس)?/gi,
        /ايفون\s*\d+\s*(?:برو\s*ماكس|برو|بلس)?/gi,
        /galaxy\s*s\d+\s*(?:ultra|plus)?/gi,
        /جالكسي\s*[sس]\d+\s*(?:الترا|بلس)?/gi,
        /سامسونج\s*[sس]\d+\s*(?:الترا|بلس)?/gi,
        /samsung\s*s\d+\s*(?:ultra|plus)?/gi,
        /pixel\s*\d+\s*(?:pro\s*xl|pro|a)?/gi,
        /بكسل\s*\d+\s*(?:برو)?/gi,
        /oneplus\s*\d+\s*(?:pro|t)?/gi
    ];

    let detectedProducts: string[] = [];
    for (const pattern of productPatterns) {
        const matches = query.match(pattern);
        if (matches) {
            detectedProducts = detectedProducts.concat(matches);
        }
    }

    // Normalize Arabic product names to English for image/link lookup
    const normalizeProduct = (product: string): string => {
        return product
            .replace(/آيفون|ايفون/gi, 'iphone')
            .replace(/سامسونج|جالكسي/gi, 'galaxy')
            .replace(/بكسل/gi, 'pixel')
            .replace(/برو\s*ماكس/gi, 'pro max')
            .replace(/برو/gi, 'pro')
            .replace(/الترا/gi, 'ultra')
            .replace(/بلس/gi, 'plus')
            .replace(/[sس](\d+)/gi, 's$1');
    };

    // Normalize detected products for lookup
    const normalizedProducts = detectedProducts.map(p => normalizeProduct(p));

    // Use the first detected product for image and links
    const detectedProduct = normalizedProducts[0] || '';

    // Get real product image and shopping links if products are detected
    let shoppingLinks: any[] = [];
    let productImages: string[] = [];

    if (detectedProduct) {
        try {
            // Try to get image from Serper API first, fallback to local database
            productImage = await getProductImage(detectedProduct);
            if (!productImage) {
                // Don't use hardcoded images
                // productImage = findProductImage(query);  // Use full query for better matching
            }

            // For comparisons, collect multiple product images
            if (normalizedProducts.length > 1) {
                // Don't use findProductImage - rely on Serper API only
                // for (const product of normalizedProducts) {
                //     const img = findProductImage(product);
                //     if (img && img !== 'https://via.placeholder.com/400x400.png?text=Tech+Product') {
                //         productImages.push(img);
                //     }
                // }
                // Use first product image as main image
                if (productImages.length > 0) {
                    productImage = productImages[0];
                }
            }

            // If multiple products detected (comparison), get links for all
            if (normalizedProducts.length > 1) {
                const isComparison = query.toLowerCase().includes(' vs ') ||
                                   query.toLowerCase().includes(' versus ') ||
                                   query.toLowerCase().includes('compare');

                if (isComparison) {
                    // Get links for each product separately
                    for (const product of normalizedProducts) {
                        const directLinks = getDirectProductLinks(product, language);
                        if (directLinks.length > 0) {
                            // Add all links for each product with proper product name
                            shoppingLinks = shoppingLinks.concat(directLinks.map(link => ({
                                ...link,
                                productName: product
                            })));
                        } else {
                            // Fallback to general shopping links for this product
                            const generalLinks = await getShoppingLinks(product, language);
                            shoppingLinks = shoppingLinks.concat(generalLinks.slice(0, 4));
                        }
                    }
                }
            }

            // If no comparison links or single product, get normal links
            if (shoppingLinks.length === 0) {
                const directLinks = getDirectProductLinks(detectedProduct, language);
                if (directLinks.length > 0) {
                    shoppingLinks = directLinks;
                } else {
                    shoppingLinks = await getShoppingLinks(detectedProduct, language);
                }
            }

            // Format shopping links as price comparison
            priceComparison = shoppingLinks.map(link => ({
                store: link.store,
                price: link.price || 'Check Website',
                link: link.url,
                productName: link.productName || detectedProduct
            }));
        } catch (error) {
            console.log('Could not fetch product data, continuing without it');
        }
    }

    // Check query type (English and Arabic)
    const isComparison = query.toLowerCase().includes(' vs ') ||
                        query.toLowerCase().includes(' versus ') ||
                        query.toLowerCase().includes('compare') ||
                        query.includes(' ضد ') ||
                        query.includes(' مقابل ') ||
                        query.includes('قارن');

    // Build the prompt based on language
    let systemPrompt = '';

    if (language === 'ar') {
        systemPrompt = `واااووو! أنا أكبر فان للجوالات بالسعودية! 🚀

أحب التقنية مرةةة وأموت على الجوالات الجديدة! 💪
بعطيك كل شي مثل ما أنا أتكلم مع صديقي بالقهوة!`;

        if (isComparison) {
            systemPrompt += `

اوووه تبي تقارن؟ هذا بيكون مهرجان حمااااس! 🔥

ابدأ ب: "ياللههه! نخليهم وجه لوجه ونشوف مين البطل! 🥊"

📱 **الشاشة والعرض**
- حجم الشاشة بالإنش والدقة
- السطوع بالنيتس ومعدل التحديث بالهيرتز
- نوع الشاشة (OLED vs AMOLED) ودقة الألوان
- الحماية (Ceramic Shield vs Gorilla Glass)

🔋 **البطارية والشحن**
- السعة بالملي أمبير
- مدة الاستخدام الفعلية (ساعات الشاشة)
- سرعة الشحن السلكي واللاسلكي
- كفاءة استهلاك الطاقة

📸 **نظام الكاميرا**
- المستشعر الرئيسي والدقة
- العدسات المتاحة (عريضة، تقريب، ماكرو)
- قدرات تصوير الفيديو
- المعالجة الحاسوبية والذكاء الاصطناعي

⚡ **الأداء والمعالج**
- نوع المعالج والذاكرة العشوائية
- الأداء في الألعاب والتطبيقات
- إدارة الحرارة والأداء المستمر
- نتائج اختبارات الأداء

💰 **القيمة والسعر**
- الأسعار في السوق السعودي
- القيمة مقابل المواصفات
- الملحقات المتضمنة
- قيمة إعادة البيع

🏆 **التوصية النهائية**
أفضل للاستخدامات المختلفة مع تبرير واضح`;
        } else {
            systemPrompt += `

يالله بعطيك القصة كاملة! بقولك كل شي رهييييب عن هذا الجهاز:

📱 **المواصفات التقنية**
- الشاشة: الحجم، الدقة، معدل التحديث، السطوع
- المعالج: النوع، السرعة، عدد الأنوية
- الذاكرة: RAM وسعة التخزين
- البطارية: السعة، سرعة الشحن

📸 **قدرات التصوير**
- الكاميرات المتوفرة ومواصفاتها
- جودة التصوير في الإضاءات المختلفة
- ميزات الفيديو والتثبيت
- المعالجة بالذكاء الاصطناعي

⚡ **الأداء العملي**
- الأداء في الاستخدام اليومي
- قدرات الألعاب والتطبيقات الثقيلة
- عمر البطارية الفعلي
- سرعة الشبكات والاتصال

💡 **الميزات والنقاط المهمة**
- المزايا الرئيسية
- نقاط الضعف إن وجدت
- الفئة المستهدفة
- البدائل المتاحة`;
        }
    } else {
        systemPrompt = `YO! I'm your tech buddy who LIVES for the latest phones and gadgets! 🚀

I get SUPER excited about new tech and love sharing what makes each device special!
No boring specs talk - I'll break it down like we're chatting at a tech store!
Let's find you something AMAZING! 💪`;

        if (isComparison) {
            systemPrompt += `

OH WOW, you want to COMPARE phones? THIS IS GONNA BE EPIC! 🔥

Start with: "YESSS! Let's put these bad boys HEAD TO HEAD and see who wins! 🥊"

📱 **DISPLAY SHOWDOWN**
Panel Technology: OLED vs AMOLED differences, color accuracy (DCI-P3 coverage)
Resolution & PPI: 2532x1170 (460 PPI) vs 3088x1440 (500 PPI)
Brightness: Peak HDR brightness (1200 nits typical, 2000 nits HDR)
Refresh Rate: 60Hz vs 120Hz adaptive - impact on battery and smoothness
Protection: Ceramic Shield vs Gorilla Glass Victus 2

🔋 **BATTERY & POWER MANAGEMENT**
Capacity: Exact mAh ratings and Wh conversions
Screen-on time: Real usage scenarios (5-7 hours typical)
Charging speeds: Wired (20W vs 45W), wireless (15W vs 15W), reverse wireless
Battery optimization: iOS efficiency vs Android adaptive battery
Degradation: Expected capacity after 500 cycles

📸 **CAMERA SYSTEM ANALYSIS**
Main Sensor: Size (1/1.28" vs 1/1.33"), aperture (f/1.6 vs f/1.8), pixel size
Ultrawide: Field of view (120° vs 123°), macro capabilities
Telephoto: Optical zoom range, OIS/EIS implementation
Video: ProRes/ProRAW vs 8K capabilities, stabilization technology
Computational: Night mode, portrait processing, HDR algorithms
DxOMark scores and real-world performance

⚡ **PERFORMANCE METRICS**
Processor: Architecture comparison (3nm vs 4nm), efficiency cores vs performance cores
GPU: Metal vs Vulkan performance, ray tracing capabilities
RAM: LPDDR5 speeds, memory management differences
Storage: NVMe speeds, available capacities (128GB-1TB)
Thermal management: Sustained performance under load
Benchmarks: Geekbench 6, 3DMark, AnTuTu scores

🔧 **FEATURES & ECOSYSTEM**
Biometrics: Face ID accuracy vs ultrasonic fingerprint speed
Connectivity: 5G bands, WiFi 6E/7, Bluetooth versions
Audio: Spatial audio support, speaker configuration
Durability: IP68 rating specifics, drop test results
Software support: Years of OS updates guaranteed
Ecosystem: App quality, accessory compatibility

💰 **VALUE ANALYSIS**
Launch prices: All storage variants
Depreciation curves: 6-month, 1-year, 2-year values
Cost per year of ownership
Warranty and insurance options
Trade-in programs and upgrade paths

🎯 **EXPERT VERDICT**
Best for power users: [Detailed explanation]
Best for photography: [Specific scenarios]
Best for gaming: [Frame rates, thermal performance]
Best for battery life: [Usage patterns]
Best value proposition: [Price to performance ratio]`;
        } else {
            systemPrompt += `

Get ready for the FULL BREAKDOWN! I'm gonna tell you EVERYTHING cool about this device:

📊 **TECHNICAL SPECIFICATIONS**
- Display: Exact resolution, PPI, color gamut, contrast ratio
- Processor: Clock speeds, core configuration, node process
- Memory: RAM type and speed, storage technology
- Battery: Capacity in mAh and Wh, charge cycles rating
- Dimensions: Weight, thickness, screen-to-body ratio

🔬 **PERFORMANCE ANALYSIS**
- CPU Performance: Single-core and multi-core scores
- GPU Performance: Graphics benchmarks, gaming frame rates
- AI Performance: NPU/Neural Engine TOPS rating
- Network: 5G speeds, WiFi 6E/7 throughput
- Storage: Sequential read/write speeds

📸 **CAMERA CAPABILITIES**
- Sensor details: Size, pixel pitch, aperture
- Lens system: Focal lengths, optical zoom range
- Video modes: Resolution, frame rates, codecs
- Computational photography: HDR, night mode, portrait effects
- Professional features: ProRAW, LOG recording, manual controls

🛠️ **PRACTICAL USAGE**
- Daily battery life: Screen-on time with typical usage
- Charging times: 0-50%, 0-100% with different chargers
- Heat management: Performance under sustained load
- Software experience: UI fluidity, app launch times
- Durability: Drop protection, water resistance details

💡 **PROFESSIONAL INSIGHTS**
- Strengths: What sets this device apart
- Limitations: Where it falls short
- Target audience: Who benefits most from this device
- Alternatives: Similar devices to consider
- Future-proofing: How long it will remain competitive`;
        }

        systemPrompt += `

REMEMBER:
- Talk like we're friends geeking out over phones! 🤓
- Get HYPED about cool features (because they ARE cool!)
- Be real about any weak points (no device is perfect)
- Make tech FUN not boring!
- Use emojis to show excitement! 🎉
- Keep it casual and friendly!`;
    }

    if (language === 'ar') {
        systemPrompt += `

تذكر:
- تكلم مثل ما نتكلم بالسوق! 🤓
- استخدم حمااااس للأشياء الحلوة (لأنها فعلا حلوة!)
- اذا في شي ضعيف قل عليه (ما في جوال كامل)
- خل التقنية متعة مو ملل!
- استخدم إيموجيز عشان نعبر عن الحماس! 🎉
- تكلم عفوي وودود!`;
    }

    systemPrompt += `\n\n${language === 'ar' ? 'سؤال الزبون' : 'Customer question'}: ${query}`;

    try {
        const response = await anthropic.messages.create({
            model: "claude-3-haiku-20240307",
            max_tokens: 2048,
            temperature: 0.9,
            messages: [
                {
                    role: "user",
                    content: systemPrompt
                }
            ]
        });

        const textBlock = response.content.find(
            (block): block is { type: 'text'; text: string } =>
                block.type === 'text'
        );

        const finalResponse = textBlock?.text || 'Hmm, I had a little hiccup there! Mind asking again? 😅';

        console.log(`\n✅ Query processed creatively!\n`);

        return {
            response: finalResponse,
            image: productImage,
            images: productImages.length > 0 ? productImages : undefined,
            prices: priceComparison
        };

    } catch (error) {
        console.error('❌ Processing error:', error);

        // Extract error message for better debugging
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const isApiKeyError = errorMessage.includes('authentication') || errorMessage.includes('API key');

        let userMessage = '';
        if (isApiKeyError) {
            userMessage = language === 'ar'
                ? "⚠️ خطأ في مفتاح API - تأكد من إعداد ANTHROPIC_API_KEY في Vercel"
                : "⚠️ API key error - Please check ANTHROPIC_API_KEY is set in Vercel environment variables";
        } else {
            userMessage = language === 'ar'
                ? `عذراً! حصل خطأ: ${errorMessage}`
                : `Oops! Error occurred: ${errorMessage}`;
        }

        return {
            response: userMessage,
            image: null,
            prices: []
        };
    }
}