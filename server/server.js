/**
 * ═══════════════════════════════════════════════════════════════
 * MIZUMI — Express Server
 * REST API + Static File Server
 * ═══════════════════════════════════════════════════════════════
 */

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const crypto = require('crypto');
const { body, query, validationResult } = require('express-validator');

const User = require('./models/User');
const Recipe = require('./models/Recipe');
const Subscriber = require('./models/Subscriber');
const { auth, optionalAuth, generateToken } = require('./auth');

const app = express();
const PORT = process.env.PORT || 3000;

/* ── Middleware ───────────────────────────────────────────────── */
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files
app.use(express.static(path.join(__dirname, '..')));

// Serve uploaded images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

/* ── Multer (Image Upload) ───────────────────────────────────── */
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, 'uploads'));
    },
    filename: (req, file, cb) => {
        const uniqueName = `recipe_${Date.now()}_${Math.round(Math.random() * 1E6)}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: (req, file, cb) => {
        const allowed = /jpeg|jpg|png|webp/;
        const ext = allowed.test(path.extname(file.originalname).toLowerCase());
        const mime = allowed.test(file.mimetype);
        if (ext && mime) return cb(null, true);
        cb(new Error('Only image files (JPG, PNG, WebP) are allowed'));
    }
});

/* ══════════════════════════════════════════════════════════════
   AUTH ROUTES
   ══════════════════════════════════════════════════════════════ */

// POST /api/auth/register
app.post('/api/auth/register', [
    body('name').trim().isLength({ min: 2, max: 50 }).withMessage('Name must be 2-50 characters'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ error: errors.array()[0].msg });
        }

        const { name, email, password } = req.body;

        // Check if user exists
        const existing = await User.findOne({ email });
        if (existing) {
            return res.status(400).json({ error: 'An account with this email already exists' });
        }

        const user = new User({ name, email, password });
        await user.save();

        const token = generateToken(user._id);

        res.status(201).json({
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                avatar: user.avatar,
                favorites: user.favorites
            }
        });
    } catch (err) {
        console.error('Register error:', err);
        res.status(500).json({ error: 'Server error during registration' });
    }
});

// POST /api/auth/login
app.post('/api/auth/login', [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ error: 'Invalid email or password' });
        }

        const { email, password } = req.body;

        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const token = generateToken(user._id);

        res.json({
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                avatar: user.avatar,
                favorites: user.favorites
            }
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Server error during login' });
    }
});

// GET /api/auth/me — Get current user
app.get('/api/auth/me', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).populate('favorites');
        res.json({
            id: user._id,
            name: user.name,
            email: user.email,
            avatar: user.avatar,
            favorites: user.favorites
        });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// POST /api/auth/forgot-password
app.post('/api/auth/forgot-password', [
    body('email').isEmail().normalizeEmail().withMessage('Valid email required')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ error: errors.array()[0].msg });
        }

        const user = await User.findOne({ email: req.body.email });
        if (!user) {
            // Return success even if not found to prevent email enumeration
            return res.json({ message: 'If that email is registered, a password reset link has been sent.' });
        }

        const resetToken = crypto.randomBytes(32).toString('hex');
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

        await user.save();

        console.log('\n======================================================');
        console.log('🔑 PASSWORD RESET LINK GENERATED');
        console.log('User:', user.email);
        console.log(`Link: http://localhost:${PORT}/?resetToken=${resetToken}`);
        console.log('======================================================\n');

        res.json({ message: 'If that email is registered, a password reset link has been sent. Check the server console!' });
    } catch (err) {
        console.error('Forgot password error:', err);
        res.status(500).json({ error: 'Server error during forgot password' });
    }
});

// POST /api/auth/reset-password
app.post('/api/auth/reset-password', [
    body('token').notEmpty().withMessage('Reset token is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ error: errors.array()[0].msg });
        }

        const user = await User.findOne({
            resetPasswordToken: req.body.token,
            resetPasswordExpires: { $gt: Date.now() } // Must not be expired
        });

        if (!user) {
            return res.status(400).json({ error: 'Password reset token is invalid or has expired.' });
        }

        user.password = req.body.password; // Model pre-save hook will hash it
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;

        await user.save();

        res.json({ message: 'Password has been successfully reset. You can now log in.' });
    } catch (err) {
        console.error('Reset password error:', err);
        res.status(500).json({ error: 'Server error during password reset' });
    }
});

// PUT /api/auth/avatar — Update user's profile picture
app.put('/api/auth/avatar', auth, async (req, res) => {
    try {
        const { avatar } = req.body;
        if (!avatar || typeof avatar !== 'string') {
            return res.status(400).json({ error: 'Avatar URL is required' });
        }

        const user = await User.findById(req.user._id);
        user.avatar = avatar;
        await user.save();

        res.json({
            message: 'Avatar updated successfully',
            avatar: user.avatar
        });
    } catch (err) {
        console.error('Avatar update error:', err);
        res.status(500).json({ error: 'Failed to update avatar' });
    }
});

/* ══════════════════════════════════════════════════════════════
   THEMEALDB HELPERS (EXTERNAL API)
   ══════════════════════════════════════════════════════════════ */

function mapMealToRecipe(meal) {
    if (!meal) return null;

    // Extract ingredients 1 to 20 safely
    const ingredients = [];
    for (let i = 1; i <= 20; i++) {
        const ing = meal[`strIngredient${i}`];
        const meas = meal[`strMeasure${i}`];
        if (ing && ing.trim() !== '') {
            ingredients.push(meas && meas.trim() !== '' ? `${meas.trim()} ${ing.trim()}` : ing.trim());
        }
    }

    // Split instructions loosely by lines
    const instructions = meal.strInstructions 
        ? meal.strInstructions.split(/\r?\n/).filter(line => line.trim().length > 0)
        : [];

    return {
        _id: meal.idMeal, // Keep raw string ID to identify it's from MealDB
        title: meal.strMeal,
        cuisine: meal.strArea || 'International',
        time: '30 min', // Mock timing
        rating: 4.8,    // Mock rating
        difficulty: ingredients.length > 10 ? 'Hard' : (ingredients.length > 5 ? 'Medium' : 'Easy'), // Derived difficulty
        servings: 4,    // Mock servings
        calories: 450,  // Mock calories
        image: meal.strMealThumb,
        author: 'TheMealDB',
        authorAvatar: 'https://ui-avatars.com/api/?name=TheMealDB&background=ef4444&color=fff&size=128',
        description: `Delightful ${meal.strArea || ''} ${meal.strMeal} featuring ${ingredients[0] || 'delicious ingredients'}.`,
        ingredients: ingredients,
        instructions: instructions,
        featured: false,
        trending: false,
        youtube: meal.strYoutube
    };
}

async function searchMealDB(query) {
    try {
        const url = query ? `https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(query)}`
                          : `https://www.themealdb.com/api/json/v1/1/search.php?s=`; // returns some random meals without query
        const res = await fetch(url);
        const data = await res.json();
        if (data.meals) {
            return data.meals.map(mapMealToRecipe);
        }
        return [];
    } catch (err) {
        console.error('TheMealDB error:', err);
        return [];
    }
}

async function getMealDBById(id) {
    try {
        const res = await fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${id}`);
        const data = await res.json();
        if (data.meals && data.meals.length > 0) {
            return mapMealToRecipe(data.meals[0]);
        }
        return null;
    } catch (err) {
        console.error('TheMealDB lookup error:', err);
        return null;
    }
}

// Maps the slim results from filter.php
function mapSlimMealToRecipe(meal, cuisineArea) {
    if (!meal) return null;
    return {
        _id: meal.idMeal,
        title: meal.strMeal,
        cuisine: cuisineArea || 'International',
        time: '30 min',
        rating: 4.8,
        difficulty: 'Medium',
        servings: 4,
        calories: 350,
        image: meal.strMealThumb,
        author: 'TheMealDB',
        authorAvatar: 'https://ui-avatars.com/api/?name=TheMealDB&background=ef4444&color=fff&size=128',
        description: `Delightful dish from ${cuisineArea || 'TheMealDB'} featuring ${meal.strMeal}. Click to view full recipe ingredients and instructions!`,
        ingredients: [],
        instructions: [],
        featured: false,
        trending: false,
        youtube: null
    };
}

// Fetches an entire category (area) from MealDB
async function filterMealDBByArea(area) {
    try {
        // We must URL encode the area (e.g. "Indian", "Italian")
        const url = `https://www.themealdb.com/api/json/v1/1/filter.php?a=${encodeURIComponent(area)}`;
        const res = await fetch(url);
        const data = await res.json();
        if (data.meals) {
            return data.meals.map(m => mapSlimMealToRecipe(m, area));
        }
        return [];
    } catch (err) {
        console.error('TheMealDB filter error:', err);
        return [];
    }
}

/* ══════════════════════════════════════════════════════════════
   RECIPE ROUTES
   ══════════════════════════════════════════════════════════════ */

// GET /api/recipes — List all recipes (with search, filter)
app.get('/api/recipes', async (req, res) => {
    try {
        const { search, cuisine, difficulty, featured, trending, sort } = req.query;
        const filter = {};

        // Local text search
        if (search) {
            filter.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { cuisine: { $regex: search, $options: 'i' } }
            ];
        }
        if (featured === 'true') filter.featured = true;
        if (trending === 'true') filter.trending = true;

        // Fetch local MongoDB recipes
        let recipes = await Recipe.find(filter).lean();

        // If not strictly filtering for featured/trending (which MealDB doesn't have), pull from TheMealDB!
        if (featured !== 'true' && trending !== 'true') {
            let externalRecipes = [];
            
            // If they are explicitly browsing a specific category WITHOUT a text search
            if (cuisine && cuisine !== 'All' && !search) {
                // For "Snacks" and "Local Food" which MealDB doesn't have as Area, we default to Indian or fallback to general search
                const mappedArea = (cuisine === 'Snacks' || cuisine === 'Local Food') ? 'Indian' : cuisine;
                externalRecipes = await filterMealDBByArea(mappedArea);
            } else {
                // Otherwise do a standard text search
                externalRecipes = await searchMealDB(search || '');
            }

            recipes = [...recipes, ...externalRecipes];
        }

        // Apply shared post-filters
        if (cuisine && cuisine !== 'All') {
            // Because filterMealDBByArea already filters by area for the external recipes, we just ensure 
            // the local recipes and any fallback searches match exactly.
            recipes = recipes.filter(r => {
                if (!r.cuisine) return false;
                // Treat mapped local foods loosely since mealdb might output custom labels
                if (cuisine === 'Snacks' || cuisine === 'Local Food') {
                    return r.cuisine === 'Snacks' || r.cuisine === 'Local Food' || r.cuisine === 'Indian';
                }
                return r.cuisine.toLowerCase() === cuisine.toLowerCase();
            });
        }
        if (difficulty) {
            const diffs = difficulty.split(',');
            recipes = recipes.filter(r => diffs.includes(r.difficulty));
        }

        // Shared Sorting
        if (sort === 'rating') {
            recipes.sort((a, b) => b.rating - a.rating);
        } else {
            // Default newest first (MongoDB dates > then external)
            recipes.sort((a, b) => {
                const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                return timeB - timeA;
            });
        }

        res.json(recipes);
    } catch (err) {
        console.error('Recipes list error:', err);
        res.status(500).json({ error: 'Failed to fetch recipes' });
    }
});

// GET /api/recipes/:id — Get single recipe
app.get('/api/recipes/:id', async (req, res) => {
    try {
        const id = req.params.id;

        // Check if ID is likely a MongoDB ObjectId (24 hex characters)
        if (mongoose.Types.ObjectId.isValid(id) && id.length === 24) {
            const recipe = await Recipe.findById(id);
            if (recipe) return res.json(recipe);
        }

        // If not found locally or not an ObjectId, try TheMealDB
        const mealDBRecipe = await getMealDBById(id);
        if (mealDBRecipe) {
            return res.json(mealDBRecipe);
        }

        res.status(404).json({ error: 'Recipe not found' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch recipe' });
    }
});

// POST /api/recipes — Submit new recipe (auth required)
app.post('/api/recipes', auth, upload.single('image'), [
    body('title').trim().isLength({ min: 3, max: 120 }).withMessage('Title must be 3-120 characters'),
    body('cuisine').isIn(['Italian', 'Japanese', 'Mexican', 'Indian', 'Thai', 'French', 'Snacks', 'Local Food', 'Healthy']),
    body('difficulty').isIn(['Easy', 'Medium', 'Hard']),
    body('time').trim().notEmpty(),
    body('description').trim().isLength({ min: 10, max: 500 })
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ error: errors.array()[0].msg });
        }

        const { title, cuisine, difficulty, time, servings, calories, description, ingredients, instructions } = req.body;

        // Parse ingredients and instructions (sent as newline-separated strings or JSON arrays)
        let parsedIngredients = ingredients;
        let parsedInstructions = instructions;

        if (typeof ingredients === 'string') {
            parsedIngredients = ingredients.split('\n').map(s => s.trim()).filter(Boolean);
        }
        if (typeof instructions === 'string') {
            parsedInstructions = instructions.split('\n').map(s => s.trim()).filter(Boolean);
        }

        const recipe = new Recipe({
            title,
            cuisine,
            difficulty,
            time,
            servings: parseInt(servings) || 4,
            calories: parseInt(calories) || 0,
            description,
            ingredients: parsedIngredients,
            instructions: parsedInstructions,
            image: req.file ? `/uploads/${req.file.filename}` : 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=800&q=80',
            author: req.user.name,
            authorAvatar: req.user.avatar,
            submittedBy: req.user._id,
            rating: 0,
            featured: false,
            trending: false
        });

        await recipe.save();
        res.status(201).json(recipe);
    } catch (err) {
        console.error('Recipe submit error:', err);
        res.status(500).json({ error: 'Failed to submit recipe' });
    }
});

/* ══════════════════════════════════════════════════════════════
   FAVORITES ROUTES
   ══════════════════════════════════════════════════════════════ */

// GET /api/favorites — Get user's favorites
app.get('/api/favorites', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        
        // Favorites now contain both ObjectIds (for MongoDB) and Strings (for TheMealDB)
        const favoriteRecipes = [];

        for (const favId of user.favorites) {
            // First try looking in MongoDB using lean() so we just get raw JS object
            if (mongoose.Types.ObjectId.isValid(favId) && favId.length === 24) {
                const localRecipe = await Recipe.findById(favId).lean();
                if (localRecipe) {
                    favoriteRecipes.push(localRecipe);
                    continue;
                }
            }

            // If not found in DB, try external TheMealDB
            const externalRecipe = await getMealDBById(favId);
            if (externalRecipe) {
                favoriteRecipes.push(externalRecipe);
            }
        }

        res.json(favoriteRecipes);
    } catch (err) {
        console.error('Favorites fetch error:', err);
        res.status(500).json({ error: 'Failed to fetch favorites' });
    }
});

// POST /api/favorites/:recipeId — Add to favorites
app.post('/api/favorites/:recipeId', auth, async (req, res) => {
    try {
        const recipeId = req.params.recipeId;
        const user = await User.findById(req.user._id);
        
        if (user.favorites.includes(recipeId)) {
            return res.status(400).json({ error: 'Already in favorites' });
        }

        // Technically we should check if the recipe exists, but since we support external string IDs,
        // we'll just push the string directly. It will be validated when viewing favorites.
        user.favorites.push(recipeId);
        await user.save();

        res.json({ message: 'Added to favorites', favorites: user.favorites });
    } catch (err) {
        res.status(500).json({ error: 'Failed to add favorite' });
    }
});

// DELETE /api/favorites/:recipeId — Remove from favorites
app.delete('/api/favorites/:recipeId', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        user.favorites = user.favorites.filter(id => id.toString() !== req.params.recipeId);
        await user.save();

        res.json({ message: 'Removed from favorites', favorites: user.favorites });
    } catch (err) {
        res.status(500).json({ error: 'Failed to remove favorite' });
    }
});

/* ── Newsletter ─────────────────────────────────────────────── */
app.post('/api/newsletter/subscribe', [
    body('email').isEmail().normalizeEmail().withMessage('Invalid email format')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });

        const existing = await Subscriber.findOne({ email: req.body.email });
        if (existing) return res.status(400).json({ error: 'You are already subscribed!' });

        const sub = new Subscriber({ email: req.body.email });
        await sub.save();
        res.status(201).json({ message: 'Subscribed successfully!' });
    } catch (err) {
        console.error('Newsletter error:', err);
        res.status(500).json({ error: 'Failed to subscribe' });
    }
});

/* ── Catch-all: Serve index.html for SPA routes ──────────────── */
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'index.html'));
});

/* ── Error handler ───────────────────────────────────────────── */
app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        return res.status(400).json({ error: `Upload error: ${err.message}` });
    }
    console.error('Server error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

/* ── Connect to MongoDB and Start Server ─────────────────────── */
async function startServer() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB Atlas');

        app.listen(PORT, () => {
            console.log(`🚀 MIZUMI server running at http://localhost:${PORT}`);
            console.log(`📂 Serving static files from: ${path.join(__dirname, '..')}`);
        });
    } catch (err) {
        console.error('❌ Failed to connect to MongoDB:', err.message);
        console.error('   Make sure your MONGODB_URI in .env is correct.');
        process.exit(1);
    }
}

startServer();
