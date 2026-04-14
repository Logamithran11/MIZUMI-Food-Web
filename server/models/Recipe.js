const mongoose = require('mongoose');

const recipeSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Recipe title is required'],
        trim: true,
        maxlength: 120
    },
    cuisine: {
        type: String,
        required: [true, 'Cuisine type is required'],
        enum: ['Italian', 'Japanese', 'Mexican', 'Indian', 'Thai', 'French', 'Snacks', 'Local Food', 'Healthy']
    },
    time: {
        type: String,
        required: true
    },
    rating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
    },
    difficulty: {
        type: String,
        required: true,
        enum: ['Easy', 'Medium', 'Hard']
    },
    servings: {
        type: Number,
        default: 4,
        min: 1
    },
    calories: {
        type: Number,
        default: 0
    },
    image: {
        type: String,
        required: true
    },
    author: {
        type: String,
        required: true
    },
    authorAvatar: {
        type: String,
        default: ''
    },
    submittedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    description: {
        type: String,
        required: true,
        maxlength: 500
    },
    ingredients: [{
        type: String,
        required: true
    }],
    instructions: [{
        type: String,
        required: true
    }],
    featured: {
        type: Boolean,
        default: false
    },
    trending: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Text index for search
recipeSchema.index({ title: 'text', description: 'text', cuisine: 'text' });

module.exports = mongoose.model('Recipe', recipeSchema);
