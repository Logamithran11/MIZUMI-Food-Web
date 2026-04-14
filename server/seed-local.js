require('dotenv').config();
const mongoose = require('mongoose');
const Recipe = require('./models/Recipe');
const User = require('./models/User');

const localSnacks = [
    {
        title: "South Indian Samosa",
        cuisine: "Snacks",
        time: "45 min",
        rating: 4.9,
        difficulty: "Medium",
        servings: 6,
        calories: 320,
        image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&q=80",
        description: "Crispy, golden pastry filled with spiced potatoes, peas, and rich Indian spices. A perfect evening snack with mint chutney.",
        ingredients: [
            "2 cups All-purpose flour",
            "4 large Potatoes, boiled and mashed",
            "1/2 cup Green peas",
            "1 tsp Cumin seeds",
            "1 tsp Garam masala",
            "1 tsp Coriander powder",
            "Oil for deep frying",
            "Salt to taste"
        ],
        instructions: [
            "Prepare the dough by mixing flour, a little oil, salt, and water. Knead well and let it rest.",
            "Heat oil in a pan, add cumin seeds, and let them splutter.",
            "Add mashed potatoes, peas, and all the dry spices. Mix well and cook for 5 mins.",
            "Roll out the dough into small circles, cut them in half, and form cones.",
            "Fill the cones with the potato mixture and seal the edges with water.",
            "Deep fry the samosas in hot oil until they are golden brown and crispy.",
            "Serve hot with coriander or mint chutney."
        ],
        featured: true,
        trending: true
    },
    {
        title: "Chennai Filter Coffee & Medu Vada",
        cuisine: "Local Food",
        time: "40 min",
        rating: 5.0,
        difficulty: "Hard",
        servings: 4,
        calories: 250,
        image: "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=800&q=80",
        description: "The classic South Indian breakfast combo. Crispy, fluffy lentil donuts paired perfectly with strong, aromatic filter coffee.",
        ingredients: [
            "2 cups Urad Dal (Black gram)",
            "2 Green chilies, finely chopped",
            "1 inch Ginger, finely chopped",
            "1 sprig Curry leaves",
            "Salt to taste",
            "Oil for deep frying"
        ],
        instructions: [
            "Soak the urad dal for at least 4 hours.",
            "Grind the dal into a smooth, fluffy batter using very little water.",
            "Add chopped green chilies, ginger, curry leaves, and salt to the batter. Mix vigorously to aerate the batter.",
            "Heat oil in a deep pan. Wet your hands, take a lemon-sized ball of batter, flatten it, and make a hole in the center.",
            "Gently slide it into the hot oil and fry until golden brown and crisp on both sides.",
            "Serve hot with sambar and coconut chutney."
        ],
        featured: false,
        trending: true
    },
    {
        title: "Masala Dosa",
        cuisine: "Local Food",
        time: "30 min",
        rating: 4.8,
        difficulty: "Medium",
        servings: 2,
        calories: 410,
        image: "https://images.unsplash.com/photo-1517244683847-7456b63c5969?w=800&q=80",
        description: "A thin, savory crepe made from a fermented batter of lentils and rice, filled with a flavorful spiced potato curry.",
        ingredients: [
            "3 cups Dosa batter",
            "3 Potatoes, boiled and crumbled",
            "1 large Onion, sliced",
            "1/2 tsp Mustard seeds",
            "1/2 tsp Turmeric powder",
            "2 Green chilies",
            "Ghee or oil for roasting"
        ],
        instructions: [
            "Heat a little oil in a pan, add mustard seeds. Once they pop, add onions, green chilies, and curry leaves.",
            "Add turmeric powder and the crumbled potatoes. Mix well and cook for 3-4 mins. Set the masala aside.",
            "Heat a tawa (griddle). Pour a ladleful of dosa batter and spread it into a thin circle.",
            "Drizzle ghee around the edges and cook until the bottom turns golden and crispy.",
            "Place a generous portion of the potato masala in the center and fold the dosa over it.",
            "Serve immediately with coconut chutney and hot sambar."
        ],
        featured: true,
        trending: false
    },
    {
        title: "Spicy Onion Pakoda",
        cuisine: "Snacks",
        time: "20 min",
        rating: 4.7,
        difficulty: "Easy",
        servings: 4,
        calories: 380,
        image: "https://images.unsplash.com/photo-1599487405967-dfcefd17ad54?w=800&q=80",
        description: "Crispy, deep-fried Indian snack made with onions and gram flour. Perfect with a hot cup of chai on a rainy afternoon.",
        ingredients: [
            "2 large Onions, thinly sliced",
            "1 cup Besan (Gram flour)",
            "1/4 cup Rice flour",
            "1/2 tsp Red chili powder",
            "1/2 tsp Ajwain (Carom seeds)",
            "Salt to taste",
            "Oil for deep frying",
            "Handful of fresh coriander, chopped"
        ],
        instructions: [
            "In a large bowl, mix sliced onions, besan, rice flour, red chili powder, ajwain, coriander, and salt.",
            "Add just enough water to bind the ingredients together. The mixture should be thick and coat the onions well.",
            "Heat oil in a deep frying pan.",
            "Drop small portions of the onion mixture into the hot oil.",
            "Fry until golden brown and crispy.",
            "Remove and drain excess oil on paper towels. Serve hot."
        ],
        featured: false,
        trending: true
    }
];

async function seedLocalFoods() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');
        
        let author = await User.findOne({ email: 'chef@gourmetmake.com' });
        if (!author) {
             author = await User.create({ name: 'System Chef', email: 'sys@chef.com', password: 'mock-password' });
        }

        const recipesToInsert = localSnacks.map(recipe => ({
            ...recipe,
            author: "Local Chef",
            authorAvatar: "https://ui-avatars.com/api/?name=Local+Chef&background=f97316&color=fff&size=128",
            submittedBy: author._id
        }));

        await Recipe.insertMany(recipesToInsert);
        console.log(`Successfully added ${recipesToInsert.length} local snacks!`);
        process.exit(0);
    } catch (e) {
        console.error('Error seeding data:', e);
        process.exit(1);
    }
}

seedLocalFoods();
