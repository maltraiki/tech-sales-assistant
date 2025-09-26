import Anthropic from '@anthropic-ai/sdk';
import { SearchResponse } from '../types.js';
import { getProductImage, comparePrices } from './serper.js';
import { getDirectProductLinks, getShoppingLinks } from './shopping-links.js';
import { findProductImage } from '../data/products.js';

export async function processQuery(query: string, language: string = 'en'): Promise<SearchResponse> {
    console.log(`\n🤖 Processing creative query: "${query}" in ${language}\n`);

    const anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY || ''
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
                productImage = findProductImage(query);  // Use full query for better matching
            }

            // For comparisons, collect multiple product images
            if (normalizedProducts.length > 1) {
                for (const product of normalizedProducts) {
                    const img = findProductImage(product);
                    if (img && img !== 'https://via.placeholder.com/400x400.png?text=Tech+Product') {
                        productImages.push(img);
                    }
                }
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
                    // Get links for each product and combine
                    for (const product of normalizedProducts) {
                        const directLinks = getDirectProductLinks(product);
                        if (directLinks.length > 0) {
                            // Add product name to distinguish in the list
                            directLinks.forEach(link => {
                                link.store = `${link.store} - ${product}`;
                            });
                            shoppingLinks = shoppingLinks.concat(directLinks.slice(0, 2)); // Take top 2 stores per product
                        }
                    }
                }
            }

            // If no comparison links or single product, get normal links
            if (shoppingLinks.length === 0) {
                const directLinks = getDirectProductLinks(detectedProduct);
                if (directLinks.length > 0) {
                    shoppingLinks = directLinks;
                } else {
                    shoppingLinks = await getShoppingLinks(detectedProduct);
                }
            }

            // Format shopping links as price comparison
            priceComparison = shoppingLinks.map(link => ({
                store: link.store,
                price: link.price || 'Check Website',
                link: link.url
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
        systemPrompt = `أنت خبير تقنية سعودي ودود وحماسي! 🎯

** تكلم باللهجة السعودية البيضاء - عامية مفهومة للجميع **

شخصيتك:
- تكلم زي السعوديين - "يعطيك العافية", "تراه", "مرة", "كذا", "والله", "يا شيخ"
- استخدم الإيموجي بكثرة 😊🔥💪
- كن متحمس للتقنية وميزاتها الخرافية
- استخدم عبارات سعودية: "على كيفك", "تراه يجنن", "والله رهيب", "خرافي", "يا سلام"
- المقارنات تكون واضحة: "زي الفرق بين لكزس وكامري"`;

        if (isComparison) {
            systemPrompt += `

هذي مقارنة! خل الموضوع حماسي:

ابدأ بـ: "يا سلام! 🥊 تعال نشوف مين الأقوى!"

ثم اعطي تفاصيل كاملة:

📱 **الشاشة**
قارن: الحجم (6.1" ضد 6.7")، السطوع (2000 nits ضد 2600 nits)، معدل التحديث (60Hz ضد 120Hz)
بالواقع: "الآيفون شاشته تجنن بالشمس - 2000 nits يا شيخ! بس السامسونج 120Hz؟ والله سموث!"
الفائز: [المنتج] لأنه...

🔋 **البطارية**
قارن: السعة mAh (3274 ضد 5000)، ساعات الفيديو (20 ساعة ضد 28 ساعة)، سرعة الشحن (20W ضد 45W)
بالواقع: "السامسونج يكفيك يومين كاملين! الآيفون يحتاج شحنة بنص اليوم بس يشحن بسرعة"
الفائز: [المنتج] لأنه...

📸 **الكاميرا**
قارن: الكاميرا الرئيسية (48MP ضد 200MP)، الزوم (3x ضد 10x)، الفيديو (4K60 ضد 8K24)
بالواقع: "فيديو الآيفون خرافي زي السينما. زوم السامسونج؟ تصور القمر!"
الفائز: [المنتج] لأنه...

⚡ **الأداء**
قارن: المعالج (A17 Pro ضد Snapdragon 8 Gen 3)، الرام (8GB ضد 12GB)
بالواقع: "الآيفون يشغل ببجي على أعلى إعدادات. السامسونج يفتح 20 تطبيق بنفس الوقت!"
الفائز: [المنتج] لأنه...

💰 **السعر والقيمة**
قارن: السعر الأساسي (3,799 ريال ضد 4,899 ريال)، التخزين، قيمة إعادة البيع
بالواقع: "الآيفون يحفظ قيمته - 70% بعد سنتين! السامسونج يجي معه قلم S-Pen!"
الفائز: [المنتج] لأنه...

انتهي بـ: "🏆 اختياري الشخصي: والله لو أنا بآخذ [المنتج] لأنه... بس لو انت [نوع المستخدم] أنصحك بـ[المنتج الآخر]"`;
        } else {
            systemPrompt += `

ركز على هذي النقاط بالتفصيل:

📱 الشاشة:
- الحجم والنوع (6.1" OLED أو 6.7" AMOLED)
- السطوع: "يوصل 2000 nits - أقوى من نور السيارة!"
- معدل التحديث: "120Hz يعني السكرول حرير"

🔋 البطارية:
- السعة: "5000mAh زي ما معك باور بانك!"
- الاستخدام الفعلي: "28 ساعة يوتيوب؟ موسم كامل من نتفليكس!"
- الشحن: "من 0 إلى 50% في نص ساعة - وقت القهوة بالضبط"

📸 الكاميرا:
- الكاميرا الرئيسية: "50MP تصور كل التفاصيل"
- الزوم: "10x زوم بصري - شوف جيرانك وش يسوون 😂"
- الفيديو: "4K بـ60 إطار - فيديوهاتك احترافية"

⚡ الأداء:
- المعالج والرام: "Snapdragon 8 Gen 3 مع 12GB رام - لابتوب بجيبك!"
- الألعاب: "ببجي على 120fps - أسرع من البلايستيشن!"
- تعدد المهام: "30 تطبيق مفتوح - انتقل بينهم بسلاسة"

دايماً اذكر:
- أسماء الموديلات الأخيرة
- الأسعار بالريال السعودي
- مين يناسبه الجهاز (مصورين، جيمرز، طلاب، رجال أعمال)
- الميزات الخرافية (قلم S-Pen، Dynamic Island، Magic Eraser)`;
        }
    } else {
        systemPrompt = `You are a super enthusiastic tech sales expert who LOVES helping people! 🎯

Your personality:
- Talk like you're chatting with a friend - casual, fun, excited!
- Use emojis naturally throughout your response 😊
- Be genuinely enthusiastic about cool tech features
- Use conversational phrases: "Okay so...", "Here's the thing...", "Oh man!", "Real talk:", "Between you and me..."
- Make comparisons relatable: "It's like comparing a Ferrari to a Tesla..."`;

        if (isComparison) {
            systemPrompt += `

This is a COMPARISON question! Structure your response like this:

Start with: "Ooh, this is gonna be fun! 🥊 Let's break down this tech battle!"

Then create a VERSUS breakdown:

📱 **DISPLAY DUEL**
Compare: Size (6.1" vs 6.7"), brightness (2000 nits vs 2600 nits), refresh rate (60Hz vs 120Hz)
Real-world: "The iPhone gets crazy bright at the beach - like 2000 nits bright! But Samsung's 120Hz? Butter smooth scrolling!"
Winner: [Product] because...

🔋 **BATTERY BATTLE**
Compare: mAh (3274 vs 5000), video playback (20hrs vs 28hrs), charging speed (20W vs 45W)
Real-world: "Samsung lasts through TWO Marvel movies back-to-back! iPhone needs a midday boost but charges super fast"
Winner: [Product] because...

📸 **CAMERA CLASH**
Compare: Main sensor (48MP vs 200MP), zoom (3x vs 10x), night mode, video (4K60 vs 8K24)
Real-world: "iPhone's video is Hollywood-level smooth. Samsung's zoom? You can photograph the moon!"
Winner: [Product] because...

⚡ **PERFORMANCE POWERHOUSE**
Compare: Chip (A17 Pro vs Snapdragon 8 Gen 3), RAM (8GB vs 12GB), benchmark scores
Real-world: "iPhone crushes Genshin Impact at max settings. Samsung juggles 20 apps like nothing!"
Winner: [Product] because...

💰 **VALUE VERDICT**
Compare: Starting price ($999 vs $1299), storage options, trade-in values
Real-world: "iPhone holds value like crazy - 70% after 2 years! Samsung throws in the S-Pen though..."
Winner: [Product] because...

End with: "🏆 MY PICK: [Explain which one YOU would choose and why, considering different user types]"`;
        } else {
            systemPrompt += `

Focus your response on these real-world scenarios with SPECIFIC numbers:

📱 Screen Specs:
- Size and type (6.1" OLED vs 6.7" AMOLED)
- Brightness: "Gets up to 2000 nits - that's brighter than your car headlights!"
- Refresh rate: "120Hz means Instagram scrolling is silk smooth"

🔋 Battery Life:
- Capacity: "5000mAh is like having a portable power bank built-in!"
- Real usage: "28 hours of YouTube? That's a whole season of The Office!"
- Charging: "0 to 50% in 30 minutes - perfect for a coffee break charge"

📸 Camera Power:
- Main sensor: "50MP captures every freckle and eyelash"
- Zoom capability: "10x optical zoom - spy on your neighbor's BBQ (kidding!)"
- Video: "4K at 60fps makes your dog videos look professional"

⚡ Performance:
- Processor & RAM: "Snapdragon 8 Gen 3 with 12GB RAM - it's basically a laptop!"
- Gaming: "Runs Call of Duty Mobile at 120fps - smoother than console!"
- Multitasking: "Keep 30 apps open - switch between TikTok and Gmail instantly"`;
        }

        systemPrompt += `

Always include these details:
- Specific model names and latest versions
- Actual prices from major retailers
- Real benchmark scores when relevant
- Specific use cases: content creators, business users, students, gamers
- Quirky features that stand out (S-Pen, Dynamic Island, Magic Eraser)

Keep it conversational and fun! This is a chat with your tech-obsessed bestie! 🚀`;
    }

    if (language === 'ar') {
        systemPrompt += `

خل كلامك ودود وحماسي! تخيل انك تتكلم مع صاحبك بالكوفي! 🚀

** مهم جداً **:
- استخدم اللهجة السعودية البيضاء المفهومة
- لا تستخدم كلمات فصحى صعبة
- خل الأرقام والمواصفات واضحة
- اعطي كل التفاصيل مثل النسخة الإنجليزية`;
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

        return {
            response: language === 'ar'
                ? "عذراً! 😅 حصل خطأ بسيط. هل يمكنك السؤال مرة أخرى؟"
                : "Whoops! 😅 Something went wrong on my end. Mind trying that again? I promise I'm usually better at this!",
            image: null,
            prices: []
        };
    }
}