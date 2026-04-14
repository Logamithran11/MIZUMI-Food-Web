/**
 * MIZUMI — Database Seeder
 * Seeds the 12 curated recipes into MongoDB Atlas
 * Run: npm run seed
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Recipe = require('./models/Recipe');

const seedRecipes = [
    {
        title: 'Truffle Mushroom Risotto',
        cuisine: 'Italian',
        time: '45 min',
        rating: 4.9,
        difficulty: 'Medium',
        servings: 4,
        calories: 520,
        image: 'https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=800&q=80',
        author: 'Chef Marco',
        authorAvatar: 'https://ui-avatars.com/api/?name=Chef+Marco&background=f97316&color=fff&size=128',
        description: 'Creamy Arborio rice slow-cooked with white wine, wild mushrooms, and a luxurious drizzle of truffle oil. A symphony of earthy flavors elevated by Parmigiano-Reggiano.',
        ingredients: ['1.5 cups Arborio Rice', '4 cups Vegetable Broth (warm)', '200g Mixed Wild Mushrooms', '1/2 cup Dry White Wine', '1 Medium Shallot, minced', '2 tbsp Truffle Oil', '60g Parmigiano-Reggiano, grated', '2 tbsp Unsalted Butter', 'Fresh Thyme sprigs', 'Sea Salt & Black Pepper'],
        instructions: ['Clean and slice the wild mushrooms. Sauté in butter over high heat until deeply golden. Season and set aside.', 'In the same pan, sweat minced shallot in olive oil until translucent, about 3 minutes.', 'Add Arborio rice and toast for 2 minutes, stirring constantly until edges become translucent.', 'Deglaze with white wine and stir until fully absorbed.', 'Add warm broth one ladle at a time, stirring continuously. Wait until each addition is absorbed before adding more. This takes about 18 minutes.', 'When rice is al dente, fold in the sautéed mushrooms, grated Parmigiano, and cold butter. Stir vigorously to create a creamy emulsion.', 'Plate immediately. Drizzle generously with truffle oil and garnish with fresh thyme and shaved Parmesan.'],
        featured: true,
        trending: true
    },
    {
        title: 'Premium Omakase Platter',
        cuisine: 'Japanese',
        time: '90 min',
        rating: 5.0,
        difficulty: 'Hard',
        servings: 2,
        calories: 380,
        image: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=800&q=80',
        author: 'Chef Kenji',
        authorAvatar: 'https://ui-avatars.com/api/?name=Chef+Kenji&background=f97316&color=fff&size=128',
        description: 'An exquisite selection of seasonal nigiri and sashimi, presented in the traditional omakase style. Each piece showcases the purest expression of the ocean.',
        ingredients: ['Sushi-grade Salmon (200g)', 'Sushi-grade Tuna (200g)', 'Fresh Uni (Sea Urchin)', 'Sushi Rice (2 cups)', 'Rice Vinegar', 'Wasabi (fresh root)', 'Pickled Ginger', 'Soy Sauce (aged)', 'Nori sheets', 'Shiso leaves'],
        instructions: ['Prepare sushi rice: wash until water runs clear, cook, then season with rice vinegar mixture while still hot. Fan to cool.', 'Sharpen your yanagiba knife. Slice fish at a precise 45-degree angle, cutting against the grain in one smooth pull.', 'Form nigiri: wet hands, take a small ball of rice, press gently, apply a tiny dab of wasabi, and drape the fish over.', 'Arrange on a wooden board or ceramic plate with pickled ginger and fresh wasabi on the side.', 'Serve immediately — temperature and freshness are everything in omakase.'],
        featured: true,
        trending: true
    },
    {
        title: 'Handmade Pappardelle al Ragù',
        cuisine: 'Italian',
        time: '3 hrs',
        rating: 4.8,
        difficulty: 'Medium',
        servings: 6,
        calories: 680,
        image: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=800&q=80',
        author: 'Lucia Conti',
        authorAvatar: 'https://ui-avatars.com/api/?name=Lucia+Conti&background=f97316&color=fff&size=128',
        description: 'Rich, slow-cooked Bolognese meat sauce layered over silky ribbons of fresh egg pasta. A timeless Italian Sunday tradition.',
        ingredients: ['400g Tipo 00 Flour', '4 Large Eggs', '500g Ground Beef (chuck)', '200g Ground Pork', '1 can San Marzano Tomatoes', '1 Medium Onion, diced', '2 Carrots, diced', '2 Celery stalks, diced', '1 cup Red Wine', 'Whole Milk', 'Olive Oil', 'Bay Leaves'],
        instructions: ['Make pasta dough: mound flour, create a well, add eggs. Mix with a fork gradually incorporating flour. Knead for 10 minutes until smooth. Rest 30 minutes.', 'For the ragù: sauté the soffritto (onion, carrot, celery) in olive oil until deeply caramelized.', 'Add ground meats, breaking apart, and brown thoroughly.', 'Deglaze with red wine and reduce by half. Add crushed San Marzano tomatoes.', 'Add a splash of milk for sweetness. Simmer on lowest heat for at least 2 hours, stirring occasionally.', 'Roll pasta through machine to setting 5. Cut into wide pappardelle ribbons.', 'Boil fresh pasta for 2 minutes. Toss thick ribbons into the hot ragù. Serve with grated Pecorino.'],
        featured: true,
        trending: false
    },
    {
        title: 'Decadent Chocolate Entremet',
        cuisine: 'French',
        time: '4 hrs',
        rating: 4.9,
        difficulty: 'Hard',
        servings: 8,
        calories: 450,
        image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=800&q=80',
        author: 'Chef Pierre',
        authorAvatar: 'https://ui-avatars.com/api/?name=Chef+Pierre&background=f97316&color=fff&size=128',
        description: 'Multi-layered chocolate mousse cake with mirror glaze. A French pâtisserie masterpiece with hazelnut praline crunch and dark chocolate ganache.',
        ingredients: ['300g Valrhona Dark Chocolate (70%)', '500ml Heavy Cream', '6 Gelatin Sheets', '100g Almond Flour', '150g Hazelnut Praline Paste', '6 Eggs', '120g Sugar', 'Cocoa Powder', 'Gold Leaf (for garnish)'],
        instructions: ['Bake a thin Joconde sponge base with almond flour. Cool completely.', 'Prepare dark chocolate mousse: melt chocolate, fold into whipped cream and Italian meringue.', 'Create hazelnut praline crunch layer with feuilletine and praline paste.', 'Assemble in a ring mold: sponge, praline, mousse. Freeze overnight until completely solid.', 'Prepare mirror glaze: heat cream, sugar, cocoa, and bloomed gelatin. Cool to 35°C.', 'Pour glaze over frozen entremet in one smooth motion. Garnish with gold leaf.'],
        featured: true,
        trending: true
    },
    {
        title: 'Authentic Chicken Tikka Masala',
        cuisine: 'Indian',
        time: '60 min',
        rating: 4.7,
        difficulty: 'Medium',
        servings: 4,
        calories: 550,
        image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=800&q=80',
        author: 'Arjun Singh',
        authorAvatar: 'https://ui-avatars.com/api/?name=Arjun+Singh&background=f97316&color=fff&size=128',
        description: 'Tender chicken marinated in yogurt and aromatic spices, charred in a tandoor, then simmered in a rich, velvety tomato-cream sauce.',
        ingredients: ['800g Chicken Thighs (boneless)', '200g Greek Yogurt', '2 tbsp Garam Masala', '1 tbsp Kashmiri Chili Powder', '400g Tomato Puree', '200ml Heavy Cream', '1 Large Onion', '4 Garlic Cloves', '2-inch Ginger', 'Fresh Cilantro', 'Butter', 'Basmati Rice'],
        instructions: ['Marinate chicken in yogurt, garam masala, chili powder, ginger-garlic paste, salt, and lemon juice. Refrigerate for at least 2 hours.', 'Thread chicken onto skewers and grill or roast at 260°C until charred edges form.', 'In a heavy pan, cook diced onions in butter until golden. Add spices and bloom for 1 minute.', 'Pour in tomato puree and simmer for 15 minutes until oil separates.', 'Add cream and the charred chicken pieces. Simmer gently for 10 minutes.', 'Finish with butter, dried fenugreek leaves (kasuri methi), and fresh cilantro. Serve over steamed basmati rice.'],
        featured: true,
        trending: false
    },
    {
        title: 'Quinoa Superfood Power Bowl',
        cuisine: 'Healthy',
        time: '20 min',
        rating: 4.5,
        difficulty: 'Easy',
        servings: 2,
        calories: 320,
        image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80',
        author: 'Sarah Vance',
        authorAvatar: 'https://ui-avatars.com/api/?name=Sarah+Vance&background=f97316&color=fff&size=128',
        description: 'Nutrient-packed bowl with fluffy quinoa, creamy avocado, roasted sweet potato, massaged kale, and a zingy lemon-tahini dressing.',
        ingredients: ['1 cup Tri-color Quinoa', '1 Large Sweet Potato', '2 cups Curly Kale', '1 Ripe Avocado', '1/4 cup Tahini', '2 Lemons', 'Pomegranate Seeds', 'Pumpkin Seeds', 'Extra Virgin Olive Oil', 'Sea Salt & Chili Flakes'],
        instructions: ['Roast cubed sweet potatoes at 200°C with olive oil, salt, and smoked paprika for 25 minutes.', 'Cook quinoa in salted water until fluffy. Fluff with a fork.', 'Massage kale with olive oil, lemon juice, and a pinch of salt until tender.', 'Make dressing: whisk tahini, lemon juice, garlic, water, and salt until creamy.', 'Assemble bowls: quinoa base, roasted sweet potato, kale, sliced avocado.', 'Top with pomegranate seeds, pumpkin seeds, and generous drizzle of tahini dressing.'],
        featured: false,
        trending: false
    },
    {
        title: 'Mediterranean Mezze Feast',
        cuisine: 'Mediterranean',
        time: '45 min',
        rating: 4.8,
        difficulty: 'Easy',
        servings: 6,
        calories: 420,
        image: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=800&q=80',
        author: 'Elena Pappas',
        authorAvatar: 'https://ui-avatars.com/api/?name=Elena+Pappas&background=f97316&color=fff&size=128',
        description: 'A vibrant spread of silky hummus, crispy falafel, cool tzatziki, warm pita, and fresh Mediterranean salads — perfect for sharing.',
        ingredients: ['2 cans Chickpeas', '1/2 cup Tahini', 'Fresh Cucumber', '200g Greek Yogurt', 'Feta Cheese block', 'Cherry Tomatoes', 'Kalamata Olives', 'Fresh Mint & Parsley', 'Warm Pita Bread', 'Extra Virgin Olive Oil', "Sumac & Za'atar"],
        instructions: ['Blend chickpeas, tahini, lemon juice, garlic, and ice water until impossibly smooth hummus. Swirl into a bowl and drizzle with olive oil.', 'Make tzatziki: grate and squeeze cucumber, fold into yogurt with garlic, dill, and lemon.', 'Prepare Greek salad with tomatoes, cucumber, red onion, olives, and a slab of feta. Dress with olive oil and oregano.', 'Warm pita bread in the oven until puffed and slightly charred.', "Arrange everything on a large wooden board. Sprinkle za'atar and sumac. Serve family-style."],
        featured: true,
        trending: false
    },
    {
        title: 'Spicy Pad Thai',
        cuisine: 'Thai',
        time: '30 min',
        rating: 4.6,
        difficulty: 'Easy',
        servings: 2,
        calories: 480,
        image: 'https://images.unsplash.com/photo-1559314809-0d155014e29e?w=800&q=80',
        author: 'Nisa Charoenporn',
        authorAvatar: 'https://ui-avatars.com/api/?name=Nisa+C&background=f97316&color=fff&size=128',
        description: 'Wok-charred rice noodles tossed with tamarind sauce, tiger prawns, crunchy peanuts, and fresh bean sprouts. Street food perfected.',
        ingredients: ['200g Flat Rice Noodles', '8 Tiger Prawns', '2 Eggs', '3 tbsp Tamarind Paste', '2 tbsp Fish Sauce', '1 tbsp Palm Sugar', 'Bean Sprouts', 'Roasted Peanuts (crushed)', 'Garlic Chives', 'Lime', 'Dried Chili Flakes'],
        instructions: ['Soak rice noodles in warm water for 30 minutes until pliable but still firm.', 'Make pad thai sauce: mix tamarind paste, fish sauce, palm sugar, and chili flakes.', 'Heat wok until smoking. Sear prawns, push aside. Scramble eggs in the same wok.', 'Add drained noodles and sauce. Toss aggressively over high heat.', 'Add bean sprouts and chives, toss for 30 seconds.', 'Plate and garnish with crushed peanuts, lime wedge, and extra chili flakes.'],
        featured: false,
        trending: true
    },
    {
        title: 'Classic French Croissants',
        cuisine: 'French',
        time: '12 hrs',
        rating: 4.9,
        difficulty: 'Hard',
        servings: 8,
        calories: 340,
        image: 'https://images.unsplash.com/photo-1555507036-ab1f4038024a?w=800&q=80',
        author: 'Marie Dupont',
        authorAvatar: 'https://ui-avatars.com/api/?name=Marie+Dupont&background=f97316&color=fff&size=128',
        description: 'Buttery, flaky, golden laminated pastry with 27 layers of pure French butter. The pinnacle of viennoiserie.',
        ingredients: ['500g Strong Bread Flour', '280g European Butter (cold)', '10g Salt', '80g Sugar', '10g Instant Yeast', '300ml Whole Milk', '1 Egg (for wash)'],
        instructions: ['Make détrempe: mix flour, sugar, salt, yeast, and milk. Knead briefly. Refrigerate 1 hour.', 'Pound cold butter into a flat square between parchment paper.', 'Encase butter in the dough. Perform 3 single folds (letter folds), chilling 30 minutes between each.', 'Roll final dough to 5mm thickness. Cut into long triangles.', 'Roll each triangle tightly from base to tip, curving ends inward.', 'Proof at room temperature for 2 hours until doubled and jiggly.', 'Brush with egg wash. Bake at 200°C for 15 minutes until deep golden and impossibly flaky.'],
        featured: false,
        trending: true
    },
    {
        title: 'Birria Tacos',
        cuisine: 'Mexican',
        time: '3 hrs',
        rating: 4.8,
        difficulty: 'Medium',
        servings: 6,
        calories: 560,
        image: 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=800&q=80',
        author: 'Carlos Mendoza',
        authorAvatar: 'https://ui-avatars.com/api/?name=Carlos+M&background=f97316&color=fff&size=128',
        description: 'Braised beef birria folded into crispy, consommé-dipped corn tortillas with melted Oaxaca cheese. The ultimate taco experience.',
        ingredients: ['1kg Beef Chuck', '6 Dried Guajillo Chiles', '3 Dried Ancho Chiles', 'Corn Tortillas', 'Oaxaca Cheese', '1 White Onion', '4 Roma Tomatoes', 'Cumin & Oregano', 'Apple Cider Vinegar', 'Fresh Cilantro & Diced Onion'],
        instructions: ['Toast dried chiles in a dry pan. Rehydrate in hot water for 20 minutes.', 'Blend chiles with roasted tomatoes, onion, garlic, spices, and vinegar into a smooth adobo.', 'Sear beef chuck on all sides. Place in Dutch oven, cover with adobo sauce and broth.', 'Braise covered at 160°C for 3 hours until fork-tender. Shred the meat.', 'Dip tortillas in the birria consommé (the braising liquid). Fill with shredded meat and cheese.', 'Pan-fry the filled tortillas until crispy and cheese is melted. Serve with consommé for dipping.'],
        featured: true,
        trending: true
    },
    {
        title: 'Matcha Tiramisu',
        cuisine: 'Japanese',
        time: '4 hrs',
        rating: 4.7,
        difficulty: 'Medium',
        servings: 6,
        calories: 390,
        image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=800&q=80',
        author: 'Yuki Tanaka',
        authorAvatar: 'https://ui-avatars.com/api/?name=Yuki+Tanaka&background=f97316&color=fff&size=128',
        description: 'A Japanese twist on the Italian classic — ceremonial-grade matcha layered with mascarpone cream and delicate ladyfingers.',
        ingredients: ['500g Mascarpone', '3 Eggs', '100g Sugar', 'Ceremonial Matcha Powder', 'Ladyfinger Biscuits', '200ml Heavy Cream', 'Vanilla Extract', 'Hot Water'],
        instructions: ['Dissolve 2 tbsp matcha in hot water to create a strong matcha brew. Cool completely.', 'Separate eggs. Whisk yolks with sugar until pale and thick.', 'Fold in mascarpone until smooth. Whip cream separately and fold in gently.', 'Whip egg whites to stiff peaks and fold into the mascarpone mixture.', 'Briefly dip each ladyfinger into the matcha brew. Layer in a dish.', 'Alternate layers of dipped ladyfingers and mascarpone cream.', 'Refrigerate for at least 4 hours. Dust with matcha powder before serving.'],
        featured: false,
        trending: false
    },
    {
        title: 'Butter Chicken Naan Bowl',
        cuisine: 'Indian',
        time: '50 min',
        rating: 4.8,
        difficulty: 'Easy',
        servings: 4,
        calories: 610,
        image: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=800&q=80',
        author: 'Priya Sharma',
        authorAvatar: 'https://ui-avatars.com/api/?name=Priya+Sharma&background=f97316&color=fff&size=128',
        description: 'Silky makhani gravy with tandoori chicken, served over torn garlic naan pieces. Comfort food royalty.',
        ingredients: ['600g Chicken Breast', 'Butter (lots)', '400g Tomato Puree', '200ml Heavy Cream', 'Garlic Naan', 'Kasuri Methi', 'Garam Masala', 'Ginger-Garlic Paste', 'Honey', 'Fresh Cilantro'],
        instructions: ['Marinate chicken in yogurt and tandoori spice mix. Grill until charred.', 'Make makhani gravy: sauté ginger-garlic in butter, add tomato puree, simmer 15 minutes.', 'Blend the sauce smooth. Return to pan, add cream, honey, and kasuri methi.', 'Add grilled chicken pieces to the sauce. Simmer 5 minutes.', 'Tear garlic naan into pieces and arrange in bowls. Ladle butter chicken over.', 'Finish with a swirl of cream and fresh cilantro.'],
        featured: false,
        trending: true
    }
];

async function seed() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB Atlas');

        const count = await Recipe.countDocuments();
        if (count > 0) {
            console.log(`📦 Database already has ${count} recipes. Skipping seed.`);
            console.log('   To reseed, drop the recipes collection first.');
        } else {
            await Recipe.insertMany(seedRecipes);
            console.log(`🌱 Seeded ${seedRecipes.length} recipes successfully!`);
        }

        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
        process.exit(0);
    } catch (err) {
        console.error('❌ Seed error:', err.message);
        process.exit(1);
    }
}

seed();
