// Dynamic tech jokes for comparisons - never repeat the same one!
export function getTechJoke(product1: string, product2: string, language: string = 'en'): string {
    const englishJokes = [
        `🎭 Plot twist: ${product1} and ${product2} walk into a bar... The bar runs out of battery! 🔋😂`,
        `🤖 Breaking: ${product1} just sent ${product2} a friend request... It got left on "seen" 📱💔`,
        `🎮 ${product1} vs ${product2} is like Batman vs Superman... Everyone wins except your wallet! 💸`,
        `🔥 This comparison is so hot, my processor needs water cooling! 🧊`,
        `📱 ${product1} and ${product2} are having a staring contest... Your screen time is the real winner! 👀`,
        `⚡ Fun fact: Choosing between these two burns more calories than a gym workout! 💪`,
        `🎯 ${product1} or ${product2}? That's like asking me to pick my favorite electron! ⚛️`,
        `🚀 NASA called - they want to use this comparison to launch rockets! 🛸`,
        `💭 ${product1} dreams of electric sheep, ${product2} counts binary sheep! 🐑`,
        `🎪 Welcome to the tech circus where ${product1} and ${product2} are the main act! 🤹`,
        `🌟 Spoiler alert: Both phones think they're the main character! 📽️`,
        `🎲 Rolling dice to choose? The dice just bought both! 🎰`,
        `🏆 Winner of this battle? Your Instagram feed! 📸`,
        `🎭 Shakespeare would write: "To ${product1} or to ${product2}, that is the question!" 📚`,
        `🔮 My crystal ball says... you'll be happy either way! ✨`,
        `🎵 ${product1} and ${product2} should start a band called "The Processors"! 🎸`,
        `🍕 This choice is harder than picking pizza toppings! 🤔`,
        `🌈 Both phones just high-fived through the WiFi! 🤝`,
        `🎢 This comparison is a bigger rollercoaster than your stock portfolio! 📈`,
        `🦸 ${product1} has superpowers, but ${product2} has a cape! Who wins? You do! 🦸‍♂️`
    ];

    const arabicJokes = [
        `😂 ${product1} و ${product2} دخلوا مقهى... القهوة خلصت البطارية! ☕🔋`,
        `🎭 الحقيقة: الاثنين حلوين بس محفظتك راح تبكي! 💸😭`,
        `🔥 المقارنة دي حارة لدرجة إن المكيف طلب إجازة! ❄️`,
        `📱 ${product1} قال ل ${product2}: "أنت مين؟" رد عليه: "أنا المستقبل!" 🚀`,
        `⚡ تدري وش الفرق بينهم؟ واحد يخليك سعيد والثاني يخليك سعيد برضو! 😄`,
        `🎮 هذي مو مقارنة، هذا فيلم أكشن! 🎬`,
        `💭 ${product1} و ${product2} صاروا أصحاب على الواي فاي! 📶`,
        `🎯 الخيار صعب زي اختيار أفضل كباب بالرياض! 🥙`,
        `🌟 النجوم قالت: الاثنين نجوم! ⭐⭐`,
        `🎪 أهلاً بالسيرك التقني! اليوم عندنا عرض مميز! 🤹`,
        `🏆 الفائز الحقيقي؟ السناب شات حقك! 👻`,
        `🎲 رميت زهر؟ طلع ستة ستة... يعني اشتري الاثنين! 🎰`,
        `🔮 الكرة البلورية تقول... بتكون مبسوط بأي واحد! ✨`,
        `🎵 ${product1} و ${product2} بيسوون فرقة اسمها "المعالجات"! 🎸`,
        `🍕 الخيار أصعب من اختيار طبق البيتزا! 🤔`,
        `🌈 الجوالين توهم سلموا على بعض بالبلوتوث! 🤝`,
        `🦸 ${product1} عنده قوة خارقة، بس ${product2} عنده رداء! مين يفوز؟ أنت! 🦸‍♂️`,
        `🎢 المقارنة دي أكبر من رحلة بالملاهي! 🎡`,
        `😎 الاثنين حلوين لدرجة إن النظارة الشمسية لازمة! 🕶️`,
        `🚗 زي تختار بين فيراري ولامبورغيني... بس للجيب! 🏎️`
    ];

    const jokes = language === 'ar' ? arabicJokes : englishJokes;

    // Use a hash of the products to get a consistent but "random" joke
    const hash = (product1 + product2).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const jokeIndex = hash % jokes.length;

    return jokes[jokeIndex];
}

// Get a fun ending message
export function getFunEnding(language: string = 'en'): string {
    const englishEndings = [
        "🎉 Remember: Life's too short for boring phones!",
        "🚀 May the specs be with you!",
        "💫 Choose wisely, young padawan!",
        "🎪 That's all folks! *drops mic* 🎤",
        "🌟 Stay techy, stay awesome!",
        "⚡ Power up and prosper!",
        "🎯 Mission accomplished! Now go shopping!",
        "🔥 You're now 200% more tech-savvy!",
        "🎮 Game over! You won knowledge!",
        "🦾 Go forth and conquer the tech world!"
    ];

    const arabicEndings = [
        "🎉 تذكر: الحياة قصيرة عشان الجوالات المملة!",
        "🚀 القوة معك يا بطل!",
        "💫 اختر بحكمة يا محترف!",
        "🎪 خلاص كذا! *يرمي المايك* 🎤",
        "🌟 خل التقنية تكون معك دايم!",
        "⚡ شحن طاقتك وانطلق!",
        "🎯 المهمة انجزت! يالله للتسوق!",
        "🔥 صرت خبير تقنية ٢٠٠٪!",
        "🎮 انتهت اللعبة! فزت بالمعرفة!",
        "🦾 روح واكسب عالم التقنية!"
    ];

    const endings = language === 'ar' ? arabicEndings : englishEndings;
    return endings[Math.floor(Math.random() * endings.length)];
}