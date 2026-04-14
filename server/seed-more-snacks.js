require('dotenv').config();
const mongoose = require('mongoose');
const Recipe = require('./models/Recipe');
const User = require('./models/User');

const snacksAndLocal = [
    {
        title: "Pani Puri",
        cuisine: "Snacks",
        time: "30 min",
        rating: 5.0,
        difficulty: "Hard",
        servings: 4,
        calories: 250,
        image: "https://images.unsplash.com/photo-1601050690117-94f5f6af8bb3?w=800&q=80",
        description: "Bite-size hollow, crispy puris filled with an explosion of spicy, tangy mint water and sweet tamarind chutney.",
        ingredients: ["50 Puri shells", "2 cups mint coriander water", "1 cup tamarind chutney", "2 boiled potatoes", "1 cup black chickpeas"],
        instructions: ["Crack the puri", "Stuff with potato", "Dip in spicy water", "Eat in one bite!"]
    },
    {
        title: "Idli Sambar",
        cuisine: "Local Food",
        time: "40 min",
        rating: 4.8,
        difficulty: "Medium",
        servings: 4,
        calories: 300,
        image: "https://images.unsplash.com/photo-1589301760014-d929f39ce9b1?w=800&q=80",
        description: "Soft, fluffy steamed rice cakes dunked in a flavorful lentil stew loaded with vegetables.",
        ingredients: ["2 cups Idli batter", "1 cup Toor dal", "Mixed vegetables", "Sambar powder", "Tamarind extract"],
        instructions: ["Steam the batter for 10 mins", "Boil dal and veggies", "Add spices and temper", "Serve piping hot"]
    },
    {
        title: "Pav Bhaji",
        cuisine: "Local Food",
        time: "45 min",
        rating: 4.9,
        difficulty: "Medium",
        servings: 6,
        calories: 450,
        image: "https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=800&q=80",
        description: "A thick, deeply spiced vegetable mash served with soft bread rolls dripping in Amul butter.",
        ingredients: ["Mixed vegetables (potatoes, peas, carrots)", "Pav buns", "Butter", "Pav Bhaji Masala"],
        instructions: ["Boil and mash veggies", "Cook with spices and a mountain of butter", "Toast pav in butter", "Serve with onions and lemon"]
    },
    {
        title: "Aloo Tikki Chaat",
        cuisine: "Snacks",
        time: "30 min",
        rating: 4.8,
        difficulty: "Easy",
        servings: 2,
        calories: 400,
        image: "https://images.unsplash.com/photo-1626132647523-66f5bf380027?w=800&q=80",
        description: "Crispy potato patties topped with sweet yogurt, mint chutney, and crunchy sev.",
        ingredients: ["4 Potatoes", "Green chutney", "Sweet tamarind chutney", "Yogurt", "Sev"],
        instructions: ["Fry potato patties until crisp", "Crush gently and plate", "Drizzle chutneys and yogurt", "Top with sev and serve immediately"]
    },
    {
        title: "Chicken Kati Roll",
        cuisine: "Snacks",
        time: "35 min",
        rating: 4.9,
        difficulty: "Medium",
        servings: 2,
        calories: 550,
        image: "https://images.unsplash.com/photo-1628840042765-356cda07504e?w=800&q=80",
        description: "Flaky paratha layered with egg, wrapped around perfectly spiced chicken fry and pickled onions.",
        ingredients: ["2 Parathas", "200g Chicken breast", "2 Eggs", "Onions", "Green chutney"],
        instructions: ["Cook chicken in spices", "Fry paratha and coat one side with egg", "Place chicken and onions on paratha", "Roll tightly and wrap in paper"]
    },
    {
        title: "Hyderabadi Chicken Biryani",
        cuisine: "Local Food",
        time: "1.5 hours",
        rating: 5.0,
        difficulty: "Hard",
        servings: 8,
        calories: 700,
        image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&q=80",
        description: "A royal dish of basmati rice and succulent chicken, slow-cooked over Dum with saffron and aromatic spices.",
        ingredients: ["1kg Chicken", "4 cups Basmati rice", "Fried onions", "Yogurt", "Biryani Spices"],
        instructions: ["Marinate chicken overnight", "Parboil rice with whole spices", "Layer chicken and rice in a heavy pot", "Seal and cook on dum for 45 mins"]
    }
];

async function seedMore() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const author = await User.findOne({ email: 'sys@chef.com' }) || await User.findOne();
        
        const recipesToInsert = snacksAndLocal.map(recipe => ({
            ...recipe,
            author: "Local Chef",
            authorAvatar: "https://ui-avatars.com/api/?name=Indian+Chef&background=f97316&color=fff&size=128",
            submittedBy: author._id,
            featured: false,
            trending: false
        }));

        await Recipe.insertMany(recipesToInsert);
        console.log(`Added ${recipesToInsert.length} recipes!`);
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
seedMore();
