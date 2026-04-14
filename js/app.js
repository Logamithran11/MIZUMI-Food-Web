/* ═══════════════════════════════════════════════════════════════
   MIZUMI — Application Engine (API-Connected)
   SPA Router · Views · Interactions · State Management
   ═══════════════════════════════════════════════════════════════ */

/* ── Global State ────────────────────────────────────────────── */
const State = {
    currentView: 'home',
    currentRecipeId: null,
    user: null,
    favorites: [],      // Array of recipe IDs
    searchQuery: '',
    activeCategory: 'All',
    difficultyFilter: [],
    authMode: 'login',
    // Cached recipe data from API
    allRecipes: [],
    featuredRecipes: [],
    trendingRecipes: [],
    currentRecipe: null,
    favoriteRecipes: [],
    loading: false,
};

const appRoot = document.getElementById('app-root');
const toastContainer = document.getElementById('toast-container');

/* ── Food-Themed Avatar Presets (stored as tiny URL strings — zero DB impact) ── */
const FOOD_AVATARS = [
    { url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=200&h=200&fit=crop&crop=center', label: '🍕 Pizza Pro' },
    { url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200&h=200&fit=crop&crop=center', label: '🍔 Burger Boss' },
    { url: 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=200&h=200&fit=crop&crop=center', label: '🌮 Taco Star' },
    { url: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=200&h=200&fit=crop&crop=center', label: '🍣 Sushi Sensei' },
    { url: 'https://images.unsplash.com/photo-1587668178277-295251f900ce?w=200&h=200&fit=crop&crop=center', label: '🧁 Cupcake Queen' },
    { url: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=200&h=200&fit=crop&crop=center', label: '🍜 Ramen Ninja' },
    { url: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=200&h=200&fit=crop&crop=center', label: '🍩 Donut Dream' },
    { url: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=200&h=200&fit=crop&crop=center', label: '🍪 Cookie Monster' },
    { url: 'https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=200&h=200&fit=crop&crop=center', label: '🍦 Ice Cream King' },
    { url: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=200&h=200&fit=crop&crop=center', label: '🎂 Cake Master' },
];

/* ── Initialize App ──────────────────────────────────────────── */
async function initApp() {
    // Check for password reset token
    const urlParams = new URLSearchParams(window.location.search);
    const resetToken = urlParams.get('resetToken');
    if (resetToken) {
        window.history.replaceState({}, document.title, window.location.pathname);
        State.resetToken = resetToken;
        setTimeout(() => openAuth('reset'), 100);
    }

    // Check if user is logged in (has token)
    if (API.isLoggedIn()) {
        try {
            const userData = await API.getMe();
            State.user = userData;
            State.favorites = (userData.favorites || []).map(f => typeof f === 'object' ? f._id : f);
        } catch (err) {
            // Token expired or invalid
            API.logout();
            State.user = null;
            State.favorites = [];
        }
    }

    // Load initial recipes
    await loadRecipes();
    render();
}

/* ── Data Loading ────────────────────────────────────────────── */
async function loadRecipes() {
    try {
        State.allRecipes = await API.getRecipes();
        State.featuredRecipes = State.allRecipes.filter(r => r.featured);
        State.trendingRecipes = State.allRecipes.filter(r => r.trending);
    } catch (err) {
        console.error('Failed to load recipes:', err);
        showToast('Failed to load recipes. Check server connection.', 'fa-circle-exclamation');
    }
}

/* ── Navigation ──────────────────────────────────────────────── */
async function navigateTo(view, params = {}) {
    State.currentView = view;
    if (params.id) State.currentRecipeId = params.id;

    // Load data for specific views
    if (view === 'recipe-detail' && params.id) {
        try {
            State.currentRecipe = await API.getRecipe(params.id);
        } catch (err) {
            showToast('Failed to load recipe', 'fa-circle-exclamation');
        }
    }

    if (view === 'favorites' && State.user) {
        try {
            State.favoriteRecipes = await API.getFavorites();
        } catch (err) {
            State.favoriteRecipes = [];
        }
    }

    render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    updateActiveNav();
}

function updateActiveNav() {
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    const active = document.querySelector(`.nav-item[data-view="${State.currentView}"]`);
    if (active) active.classList.add('active');

    document.querySelectorAll('.mobile-nav-item').forEach(n => n.classList.remove('active'));
    const activeMob = document.querySelector(`.mobile-nav-item[data-view="${State.currentView}"]`);
    if (activeMob) activeMob.classList.add('active');
}

function updateUserUI() {
    const userBtn = document.getElementById('user-btn');
    if (userBtn) {
        if (State.user) {
            const avatarUrl = State.user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(State.user.name)}&background=f97316&color=fff&size=128`;
            userBtn.innerHTML = `<img src="${avatarUrl}" alt="${State.user.name}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`;
            userBtn.style.padding = '0';
        } else {
            userBtn.innerHTML = `<i class="fa-regular fa-user"></i>`;
            userBtn.style.padding = '';
        }
    }
}

/* ── Render Engine ───────────────────────────────────────────── */
function render() {
    appRoot.innerHTML = '';
    const container = document.createElement('div');
    container.className = 'fade-in';

    switch (State.currentView) {
        case 'home':
            container.innerHTML = renderHome();
            break;
        case 'search':
            container.innerHTML = renderDiscover();
            break;
        case 'favorites':
            container.innerHTML = renderFavorites();
            break;
        case 'submit':
            container.innerHTML = renderSubmit();
            break;
        case 'recipe-detail':
            container.innerHTML = renderRecipeDetail();
            break;
        default:
            container.innerHTML = renderHome();
    }

    appRoot.appendChild(container);
    attachEventListeners();
    updateUserUI();
}

/* ── Toast System ────────────────────────────────────────────── */
function showToast(message, icon = 'fa-check-circle') {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<i class="fa-solid ${icon}"></i> ${message}`;
    toastContainer.appendChild(toast);
    setTimeout(() => {
        toast.classList.add('removing');
        setTimeout(() => toast.remove(), 300);
    }, 2800);
}

/* ── Auth Modal ──────────────────────────────────────────────── */
function openAuth(mode = 'login') {
    State.authMode = mode;
    const overlay = document.getElementById('auth-overlay');
    overlay.querySelector('.auth-content').innerHTML = renderAuthForm();
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
}

function closeAuth() {
    const overlay = document.getElementById('auth-overlay');
    overlay.classList.remove('open');
    document.body.style.overflow = '';
}

function executeSignout() {
    API.logout();
    State.user = null;
    State.favorites = [];
    State.favoriteRecipes = [];
    closeAuth();
    showToast('Signed out successfully', 'fa-right-from-bracket');
    render();
}

async function selectAvatar(index) {
    try {
        const url = FOOD_AVATARS[index].url;
        await API.updateAvatar(url);
        State.user.avatar = url;

        // Update preview in the open modal
        const preview = document.getElementById('current-avatar-preview');
        if (preview) preview.src = url;

        // Update the navbar profile icon
        updateUserUI();

        // Re-render the modal to reflect the new selected state
        const overlay = document.getElementById('auth-overlay');
        overlay.querySelector('.auth-content').innerHTML = renderAuthForm();

        showToast(`Avatar changed to ${FOOD_AVATARS[index].label}!`, 'fa-circle-check');
    } catch (err) {
        showToast(err.message || 'Failed to update avatar', 'fa-circle-exclamation');
    }
}

function renderAuthForm() {
    if (State.authMode === 'signout') {
        const avatarUrl = State.user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(State.user?.name || 'User')}&background=f97316&color=fff&size=128`;

        return `
            <div class="auth-header" style="text-align: center;">
                <img src="${avatarUrl}" alt="User Avatar" id="current-avatar-preview" style="width: 85px; height: 85px; border-radius: 50%; margin: 0 auto 0.8rem; object-fit: cover; border: 3px solid var(--accent); background: var(--bg-card);">
                <h2>${State.user?.name || 'User'}</h2>
                <p style="color: var(--text-muted); font-size: 0.85rem;">${State.user?.email || ''}</p>
            </div>

            <div style="margin-top: 1.5rem;">
                <h4 style="font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); margin-bottom: 0.8rem; font-weight: 600;">
                    <i class="fa-solid fa-camera" style="color: var(--accent); margin-right: 0.3rem;"></i> Choose Your Food Avatar
                </h4>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(60px, 1fr)); gap: 0.6rem;">
                    ${FOOD_AVATARS.map((av, i) => {
                        const isSelected = avatarUrl === av.url;
                        return `
                        <button onclick="selectAvatar(${i})" style="
                            display: flex; flex-direction: column; align-items: center; gap: 0.3rem;
                            border-radius: 12px; border: 2px solid ${isSelected ? 'var(--accent)' : 'var(--glass-border)'};
                            cursor: pointer; padding: 0.4rem; background: ${isSelected ? 'rgba(249,115,22,0.15)' : 'var(--bg-card)'};
                            transition: all 0.2s ease;
                            ${isSelected ? 'box-shadow: 0 0 12px rgba(249,115,22,0.3);' : ''}
                        " onmouseover="this.style.borderColor='var(--accent)'; this.style.background='rgba(249,115,22,0.1)'"
                           onmouseout="this.style.borderColor='${isSelected ? 'var(--accent)' : 'var(--glass-border)'}'; this.style.background='${isSelected ? 'rgba(249,115,22,0.15)' : 'var(--bg-card)'}'"
                            aria-label="${av.label}">
                            <img src="${av.url}" style="width: 100%; aspect-ratio: 1; border-radius: 50%; object-fit: cover;" alt="${av.label}" loading="lazy">
                            <span style="font-size: 0.6rem; color: var(--text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%;">${av.label}</span>
                        </button>`;
                    }).join('')}
                </div>
            </div>

            <div style="display: flex; gap: 1rem; margin-top: 1.5rem;">
                <button type="button" class="btn-secondary" style="flex: 1; justify-content: center;" onclick="closeAuth()">Close</button>
                <button type="button" class="btn-primary" style="flex: 1; justify-content: center; background: #ef4444; border-color: #ef4444;" onclick="executeSignout()">
                    <i class="fa-solid fa-right-from-bracket"></i> Sign Out
                </button>
            </div>
        `;
    }

    if (State.authMode === 'forgot') {
        return `
            <div class="auth-header">
                <div class="logo-icon-bg"><i class="fa-solid fa-unlock-keyhole"></i></div>
                <h2>Reset Password</h2>
                <p>Enter your email and we will send you a reset link.</p>
            </div>
            <form id="auth-form">
                <div class="form-group">
                    <label>Email</label>
                    <input type="email" class="form-control" placeholder="your@email.com" id="auth-email" required>
                </div>
                <div id="auth-error" style="color:#ef4444; font-size:0.85rem; margin-bottom:0.8rem; display:none;"></div>
                <button type="submit" class="btn-primary" id="auth-submit-btn" style="width:100%; justify-content:center; margin-top:0.5rem;">
                    Send Reset Link
                </button>
            </form>
            <div class="auth-switch">
                Remembered your password? <a onclick="openAuth('login')">Sign in</a>
            </div>
        `;
    }

    if (State.authMode === 'reset') {
        return `
            <div class="auth-header">
                <div class="logo-icon-bg"><i class="fa-solid fa-key"></i></div>
                <h2>Set New Password</h2>
                <p>Please enter your new password below.</p>
            </div>
            <form id="auth-form">
                <div class="form-group">
                    <label>New Password</label>
                    <input type="password" class="form-control" placeholder="••••••••" id="auth-password" required minlength="6">
                </div>
                <div id="auth-error" style="color:#ef4444; font-size:0.85rem; margin-bottom:0.8rem; display:none;"></div>
                <button type="submit" class="btn-primary" id="auth-submit-btn" style="width:100%; justify-content:center; margin-top:0.5rem;">
                    Update Password
                </button>
            </form>
        `;
    }

    const isLogin = State.authMode === 'login';
    return `
        <div class="auth-header">
            <div class="logo-img-wrapper" style="margin: 0 auto 1rem;"><img src="assets/logo.png" alt="Logo" style="width:100%; height:100%; object-fit:contain;"></div>
            <h2>${isLogin ? 'Welcome Back' : 'Join MIZUMI'}</h2>
            <p>${isLogin ? 'Sign in to access your favorites and recipes' : 'Create your account and start your culinary journey'}</p>
        </div>

        <form id="auth-form">
            ${!isLogin ? `
                <div class="form-group">
                    <label>Full Name</label>
                    <input type="text" class="form-control" placeholder="Your name" id="auth-name" required minlength="2">
                </div>
            ` : ''}
            <div class="form-group">
                <label>Email</label>
                <input type="email" class="form-control" placeholder="your@email.com" id="auth-email" required>
            </div>
            <div class="form-group">
                <label>Password</label>
                <input type="password" class="form-control" placeholder="••••••••" id="auth-password" required minlength="6">
            </div>
            <div id="auth-error" style="color:#ef4444; font-size:0.85rem; margin-bottom:0.8rem; display:none;"></div>
            <button type="submit" class="btn-primary" id="auth-submit-btn" style="width:100%; justify-content:center; margin-top:0.5rem;">
                ${isLogin ? 'Sign In' : 'Create Account'}
            </button>
        </form>

        ${isLogin ? `
            <div style="text-align:center; margin-top:0.8rem; font-size:0.85rem;">
                <a onclick="openAuth('forgot')" style="color:var(--text-muted); cursor:pointer;">Forgot Password?</a>
            </div>
        ` : ''}

        <div class="auth-switch">
            ${isLogin
                ? 'Don\'t have an account? <a onclick="openAuth(\'signup\')">Sign up</a>'
                : 'Already have an account? <a onclick="openAuth(\'login\')">Sign in</a>'
            }
        </div>
    `;
}

/* ── Favorite Toggle ─────────────────────────────────────────── */
async function toggleFavorite(id) {
    if (!State.user) {
        openAuth('login');
        showToast('Please sign in to save favorites', 'fa-circle-info');
        return;
    }

    try {
        const isFav = State.favorites.includes(id);
        if (isFav) {
            await API.removeFavorite(id);
            State.favorites = State.favorites.filter(fid => fid !== id);
            showToast('Removed from favorites', 'fa-heart-crack');
        } else {
            await API.addFavorite(id);
            State.favorites.push(id);
            showToast('Added to favorites', 'fa-heart');
        }
    } catch (err) {
        showToast(err.message, 'fa-circle-exclamation');
    }
}

/* ══════════════════════════════════════════════════════════════
   VIEW RENDERERS
   ══════════════════════════════════════════════════════════════ */

function getRecipeId(r) {
    return r._id || r.id;
}

function renderRecipeCard(r, extraClass = '') {
    const id = getRecipeId(r);
    const isFav = State.favorites.includes(id);
    return `
        <div class="recipe-card ${extraClass}" data-recipe-id="${id}">
            <img src="${r.image}" alt="${r.title}" loading="lazy">
            <div class="recipe-card-overlay"></div>
            <div class="recipe-cuisine-pill">${r.cuisine}</div>
            <button class="recipe-fav-btn ${isFav ? 'active' : ''}" data-fav-id="${id}" aria-label="Toggle favorite">
                <i class="${isFav ? 'fa-solid' : 'fa-regular'} fa-heart"></i>
            </button>
            <div class="recipe-card-content">
                <h3 class="recipe-card-title">${r.title}</h3>
                <div class="recipe-card-meta">
                    <span><i class="fa-regular fa-clock"></i> ${r.time}</span>
                    <span><i class="fa-solid fa-star"></i> ${r.rating}</span>
                    <span><i class="fa-solid fa-fire"></i> ${r.difficulty}</span>
                </div>
            </div>
        </div>
    `;
}

function renderTrendingCard(r) {
    const id = getRecipeId(r);
    const isFav = State.favorites.includes(id);
    return `
        <div class="trending-card" data-recipe-id="${id}">
            <img src="${r.image}" alt="${r.title}" loading="lazy">
            <div class="recipe-card-overlay"></div>
            <div class="trending-badge"><i class="fa-solid fa-fire"></i> Trending</div>
            <button class="recipe-fav-btn ${isFav ? 'active' : ''}" data-fav-id="${id}" style="top:1.2rem; right:1.2rem;">
                <i class="${isFav ? 'fa-solid' : 'fa-regular'} fa-heart"></i>
            </button>
            <div class="recipe-card-content">
                <h3 class="recipe-card-title">${r.title}</h3>
                <div class="recipe-card-meta">
                    <span><i class="fa-regular fa-clock"></i> ${r.time}</span>
                    <span><i class="fa-solid fa-star"></i> ${r.rating}</span>
                </div>
            </div>
        </div>
    `;
}

/* ── HOME VIEW ───────────────────────────────────────────────── */
function renderHome() {
    return `
        <!-- HERO -->
        <div class="hero-wrapper">
            <img src="https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=1400&q=80"
                 class="hero-bg-image" alt="Chef cooking">
            <div class="hero-gradient"></div>

            <div class="hero-center">
                <div class="hero-pill">
                    <i class="fa-solid fa-wand-magic-sparkles"></i>
                    Discover the Art of Fine Dining at Home
                </div>
                <h1 class="hero-title-main">Elevate Your</h1>
                <h2 class="hero-title-serif">Culinary Experience</h2>
                <p class="hero-subtitle">
                    Explore curated recipes from top chefs worldwide. Master multi-cuisine dishes
                    with step-by-step guidance and visually stunning inspiration.
                </p>
                <div class="hero-cta-group">
                    <button class="btn-primary" data-view="search">
                        <i class="fa-solid fa-compass"></i> Explore Recipes
                    </button>
                    <button class="btn-secondary" onclick="${State.user ? "navigateTo('submit')" : "openAuth('signup')"}">
                        <i class="fa-solid fa-plus"></i> Share a Recipe
                    </button>
                </div>
                <div class="hero-stats">
                    <div class="hero-stat">
                        <div class="hero-stat-number">${State.allRecipes.length > 0 ? State.allRecipes.length * 100 + '+' : '1,200+'}</div>
                        <div class="hero-stat-label">Curated Recipes</div>
                    </div>
                    <div class="hero-stat">
                        <div class="hero-stat-number">8</div>
                        <div class="hero-stat-label">World Cuisines</div>
                    </div>
                    <div class="hero-stat">
                        <div class="hero-stat-number">50K+</div>
                        <div class="hero-stat-label">Home Chefs</div>
                    </div>
                </div>
            </div>
        </div>

        <!-- TRENDING -->
        <div class="content-section content-section--elevated">
            <div class="section-head" style="max-width:var(--container-max); margin-left:auto; margin-right:auto;">
                <div>
                    <h2 class="section-title"><i class="fa-solid fa-fire-flame-curved"></i> Trending Masterpieces</h2>
                    <p class="section-subtitle">The most loved recipes this week — handpicked by our community.</p>
                </div>
                <a class="section-link" data-view="search">View all <i class="fa-solid fa-arrow-right"></i></a>
            </div>
            <div class="trending-scroll-wrapper">
                <button class="scroll-arrow scroll-arrow--left" id="trend-left"><i class="fa-solid fa-chevron-left"></i></button>
                <div class="trending-scroll" id="trending-scroll">
                    ${State.trendingRecipes.map(r => renderTrendingCard(r)).join('')}
                </div>
                <button class="scroll-arrow scroll-arrow--right" id="trend-right"><i class="fa-solid fa-chevron-right"></i></button>
            </div>
        </div>

        <!-- CATEGORIES -->
        <div class="content-section">
            <div class="section-head section-head--center" style="max-width:var(--container-max); margin-left:auto; margin-right:auto;">
                <h2 class="section-title"><i class="fa-solid fa-globe"></i> Explore World Cuisines</h2>
                <p class="section-subtitle">Embark on a global culinary adventure — one cuisine at a time.</p>
            </div>
            <div class="categories-grid stagger-in">
                ${categoriesData.map(c => {
                    const count = State.allRecipes.filter(r => r.cuisine === c.name).length;
                    return `
                    <div class="category-tile" data-cuisine="${c.name}">
                        <div class="category-icon" style="background:${c.color}20; color:${c.color};">
                            <i class="fa-solid ${c.icon}"></i>
                        </div>
                        <div class="category-name">${c.name}</div>
                        <div class="category-count">Browse dishes <i class="fa-solid fa-arrow-right" style="font-size:0.75rem; margin-left:4px;"></i></div>
                    </div>`;
                }).join('')}
            </div>
        </div>

        <!-- PICKED FOR YOU -->
        <div class="content-section content-section--alt">
            <div class="section-head" style="max-width:var(--container-max); margin-left:auto; margin-right:auto;">
                <div>
                    <h2 class="section-title"><i class="fa-solid fa-wand-magic-sparkles"></i> Picked For You</h2>
                    <p class="section-subtitle">Based on your recent culinary adventures.</p>
                </div>
                <a class="section-link" data-view="search">See more <i class="fa-solid fa-arrow-right"></i></a>
            </div>
            <div class="recipes-grid stagger-in">
                ${State.featuredRecipes.map(r => renderRecipeCard(r)).join('')}
            </div>
        </div>

        <!-- NEWSLETTER -->
        <div class="content-section">
            <div class="newsletter-section">
                <h2><i class="fa-solid fa-envelope" style="color:var(--accent); margin-right:0.5rem;"></i> Stay Inspired</h2>
                <p>Get weekly curated recipes, chef tips, and exclusive content delivered to your inbox.</p>
                <div class="newsletter-form">
                    <input type="email" placeholder="Enter your email address" id="newsletter-email">
                    <button class="btn-primary" id="newsletter-btn">Subscribe</button>
                </div>
            </div>
        </div>

        ${renderFooter()}
    `;
}

/* ── DISCOVER VIEW ───────────────────────────────────────────── */
function renderDiscover() {
    // Client-side filtering from already-loaded recipes
    const filtered = State.allRecipes.filter(r => {
        const matchSearch = !State.searchQuery ||
            r.title.toLowerCase().includes(State.searchQuery.toLowerCase()) ||
            r.cuisine.toLowerCase().includes(State.searchQuery.toLowerCase()) ||
            r.description.toLowerCase().includes(State.searchQuery.toLowerCase());
        const matchCat = State.activeCategory === 'All' || r.cuisine === State.activeCategory;
        const matchDiff = State.difficultyFilter.length === 0 || State.difficultyFilter.includes(r.difficulty);
        return matchSearch && matchCat && matchDiff;
    });

    return `
        <div style="padding-top:calc(var(--navbar-height) + 2rem); padding-bottom:4rem;">
            <div class="container">
                <div class="page-header" style="padding-top:1rem; text-align:left; margin-bottom:2rem;">
                    <h1 style="font-size:2.5rem;">Discover Recipes</h1>
                    <p style="max-width:none; margin:0.5rem 0 0;">Find your next culinary masterpiece from ${State.allRecipes.length} curated recipes.</p>
                </div>
                <div class="discover-layout">
                    <aside class="sidebar">
                        <div class="sidebar-section">
                            <h3 class="sidebar-title">Cuisines</h3>
                            <div class="sidebar-list">
                                <button class="${State.activeCategory === 'All' ? 'active' : ''} cat-filter" data-category="All">
                                    <i class="fa-solid fa-layer-group" style="width:18px;"></i> All Recipes
                                </button>
                                ${categoriesData.map(c => `
                                    <button class="${State.activeCategory === c.name ? 'active' : ''} cat-filter" data-category="${c.name}">
                                        <i class="fa-solid ${c.icon}" style="width:18px;"></i> ${c.name}
                                    </button>
                                `).join('')}
                            </div>
                        </div>
                        <div class="sidebar-section">
                            <h3 class="sidebar-title">Difficulty</h3>
                            <label class="sidebar-checkbox"><input type="checkbox" value="Easy" class="diff-filter" ${State.difficultyFilter.includes('Easy') ? 'checked' : ''}> Easy</label>
                            <label class="sidebar-checkbox"><input type="checkbox" value="Medium" class="diff-filter" ${State.difficultyFilter.includes('Medium') ? 'checked' : ''}> Medium</label>
                            <label class="sidebar-checkbox"><input type="checkbox" value="Hard" class="diff-filter" ${State.difficultyFilter.includes('Hard') ? 'checked' : ''}> Hard</label>
                        </div>
                    </aside>
                    <div class="main-discover">
                        <div class="search-wrapper">
                            <i class="fa-solid fa-magnifying-glass"></i>
                            <input type="text" class="search-input" id="search-input"
                                   placeholder="Search by name, cuisine, or description..."
                                   value="${State.searchQuery}">
                        </div>
                        <div class="discover-grid stagger-in">
                            ${filtered.length
                                ? filtered.map(r => renderRecipeCard(r)).join('')
                                : `<div class="empty-state">
                                        <i class="fa-solid fa-magnifying-glass empty-icon"></i>
                                        <h3>No recipes found</h3>
                                        <p>Try adjusting your search or filters.</p>
                                        <button class="btn-primary" onclick="State.searchQuery=''; State.activeCategory='All'; State.difficultyFilter=[]; render();">
                                            Clear Filters
                                        </button>
                                   </div>`
                            }
                        </div>
                    </div>
                </div>
            </div>
        </div>
        ${renderFooter()}
    `;
}

/* ── RECIPE DETAIL VIEW ──────────────────────────────────────── */
function renderRecipeDetail() {
    const recipe = State.currentRecipe;
    if (!recipe) return `<div class="container" style="padding-top:150px; text-align:center;"><h2>Recipe not found</h2></div>`;

    const id = getRecipeId(recipe);
    const isFav = State.favorites.includes(id);
    const related = State.allRecipes.filter(r => r.cuisine === recipe.cuisine && getRecipeId(r) !== id).slice(0, 3);

    return `
        <div class="detail-hero">
            <img src="${recipe.image}" alt="${recipe.title}">
            <div class="detail-hero-overlay"></div>
            <div class="detail-hero-content">
                <button class="icon-circle" onclick="navigateTo('home')" style="margin-bottom:1.5rem;">
                    <i class="fa-solid fa-arrow-left"></i>
                </button>
                <h1>${recipe.title}</h1>
                <p style="color:var(--text-muted); margin-top:0.5rem; max-width:600px; line-height:1.6;">${recipe.description}</p>
                <div class="detail-meta-row">
                    <div class="detail-meta-chip"><i class="fa-regular fa-clock"></i> ${recipe.time}</div>
                    <div class="detail-meta-chip"><i class="fa-solid fa-fire"></i> ${recipe.difficulty}</div>
                    <div class="detail-meta-chip"><i class="fa-solid fa-star"></i> ${recipe.rating}</div>
                    <div class="detail-meta-chip"><i class="fa-solid fa-utensils"></i> ${recipe.servings} servings</div>
                    <div class="detail-meta-chip"><i class="fa-solid fa-bolt"></i> ${recipe.calories} kcal</div>
                    <button class="recipe-fav-btn ${isFav ? 'active' : ''}" data-fav-id="${id}" style="position:static; width:42px; height:42px;">
                        <i class="${isFav ? 'fa-solid' : 'fa-regular'} fa-heart"></i>
                    </button>
                </div>
            </div>
        </div>

        <div class="detail-body">
            <div style="display:flex; align-items:center; gap:1rem; margin-bottom:2rem; padding:1rem 1.5rem; background:var(--bg-card); border:1px solid var(--glass-border); border-radius:var(--radius-md);">
                <img src="${recipe.authorAvatar || 'https://ui-avatars.com/api/?name=Chef&background=f97316&color=fff&size=128'}" alt="${recipe.author}" style="width:48px; height:48px; border-radius:50%;">
                <div>
                    <div style="font-weight:600;">${recipe.author}</div>
                    <div style="font-size:0.85rem; color:var(--text-muted);">Recipe Creator</div>
                </div>
                <div style="margin-left:auto; display:flex; gap:0.8rem;">
                    ${recipe.youtube ? `
                    <a href="${recipe.youtube}" target="_blank" class="btn-primary" style="background:#ef4444; color:white; border-color:#ef4444;">
                        <i class="fa-brands fa-youtube"></i> Watch
                    </a>` : ''}
                    <button class="btn-secondary" style="padding:0.5rem 1.2rem; font-size:0.85rem;" onclick="window.print()">
                        <i class="fa-solid fa-print"></i> Print
                    </button>
                </div>
            </div>

            <div class="nutrition-grid">
                <div class="nutrition-item"><div class="nutrition-value">${recipe.calories}</div><div class="nutrition-label">Calories</div></div>
                <div class="nutrition-item"><div class="nutrition-value">${recipe.servings}</div><div class="nutrition-label">Servings</div></div>
                <div class="nutrition-item"><div class="nutrition-value">${recipe.time}</div><div class="nutrition-label">Prep Time</div></div>
                <div class="nutrition-item"><div class="nutrition-value">${recipe.rating}</div><div class="nutrition-label">Rating</div></div>
            </div>

            <div class="detail-grid">
                <div class="ingredients-card">
                    <h2><i class="fa-solid fa-basket-shopping"></i> Ingredients</h2>
                    <div>
                        ${recipe.ingredients.map(ing => `
                            <label class="ingredient-item"><input type="checkbox"><span>${ing}</span></label>
                        `).join('')}
                    </div>
                </div>
                <div>
                    <h2 style="font-size:1.5rem; font-weight:700; margin-bottom:1.5rem; display:flex; align-items:center; gap:0.6rem;">
                        <i class="fa-solid fa-list-check" style="color:var(--accent);"></i> Instructions
                    </h2>
                    <div class="instructions-list stagger-in">
                        ${recipe.instructions.map((inst, i) => `
                            <div class="instruction-step"><div class="step-number">${i + 1}</div><p>${inst}</p></div>
                        `).join('')}
                    </div>
                </div>
            </div>

            ${related.length > 0 ? `
                <div class="related-section">
                    <h2 class="section-title" style="margin-bottom:1.5rem;"><i class="fa-solid fa-utensils"></i> More ${recipe.cuisine} Recipes</h2>
                    <div class="related-grid stagger-in">${related.map(r => renderRecipeCard(r)).join('')}</div>
                </div>
            ` : ''}
        </div>
        ${renderFooter()}
    `;
}

/* ── FAVORITES VIEW ──────────────────────────────────────────── */
function renderFavorites() {
    if (!State.user) {
        return `
            <div class="page-header"><h1>Your Favorites</h1><p>Sign in to view your saved recipes.</p></div>
            <div class="container" style="padding-bottom:4rem;">
                <div class="empty-state" style="max-width:500px; margin:0 auto;">
                    <i class="fa-solid fa-lock empty-icon"></i>
                    <h3>Sign in to continue</h3>
                    <p>Your favorite recipes are saved to your account.</p>
                    <button class="btn-primary" onclick="openAuth('login')"><i class="fa-solid fa-right-to-bracket"></i> Sign In</button>
                </div>
            </div>
            ${renderFooter()}
        `;
    }

    return `
        <div class="page-header"><h1>Your Favorites</h1><p>Your personal collection of culinary masterpieces.</p></div>
        <div class="container" style="padding-bottom:4rem;">
            <div class="recipes-grid stagger-in">
                ${State.favoriteRecipes.length
                    ? State.favoriteRecipes.map(r => renderRecipeCard(r)).join('')
                    : `<div class="empty-state">
                            <i class="fa-solid fa-heart-crack empty-icon"></i>
                            <h3>No favorites yet</h3>
                            <p>Start discovering amazing recipes and save your favorites here.</p>
                            <button class="btn-primary" data-view="search"><i class="fa-solid fa-compass"></i> Explore Recipes</button>
                       </div>`
                }
            </div>
        </div>
        ${renderFooter()}
    `;
}

/* ── SUBMIT VIEW ─────────────────────────────────────────────── */
function renderSubmit() {
    if (!State.user) {
        return `
            <div class="page-header"><h1>Share Your Recipe</h1><p>Sign in to share your culinary creations.</p></div>
            <div class="container" style="padding-bottom:4rem;">
                <div class="empty-state" style="max-width:500px; margin:0 auto;">
                    <i class="fa-solid fa-lock empty-icon"></i>
                    <h3>Sign in to continue</h3>
                    <p>You need an account to submit recipes.</p>
                    <button class="btn-primary" onclick="openAuth('login')"><i class="fa-solid fa-right-to-bracket"></i> Sign In</button>
                </div>
            </div>
            ${renderFooter()}
        `;
    }

    return `
        <div class="page-header"><h1>Publish a Recipe</h1><p>Share your finest culinary creation with the world.</p></div>
        <div class="container" style="padding-bottom:4rem;">
            <div class="form-card">
                <form id="recipe-form" enctype="multipart/form-data">
                    <div class="form-group">
                        <label>Recipe Title</label>
                        <input type="text" class="form-control" name="title" placeholder="e.g. Handmade Pappardelle al Ragù" required minlength="3">
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Cuisine</label>
                            <select class="form-control" name="cuisine" required>
                                <option value="">Select cuisine</option>
                                ${categoriesData.map(c => `<option value="${c.name}">${c.name}</option>`).join('')}
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Difficulty</label>
                            <select class="form-control" name="difficulty" required>
                                <option value="">Select level</option>
                                <option>Easy</option><option>Medium</option><option>Hard</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Prep Time</label>
                            <input type="text" class="form-control" name="time" placeholder="e.g. 45 min" required>
                        </div>
                        <div class="form-group">
                            <label>Servings</label>
                            <input type="number" class="form-control" name="servings" placeholder="4" min="1" required>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Calories (approx)</label>
                            <input type="number" class="form-control" name="calories" placeholder="e.g. 450" min="0">
                        </div>
                        <div class="form-group"></div>
                    </div>
                    <div class="form-group">
                        <label>Photo</label>
                        <div class="dropzone" id="dropzone" onclick="document.getElementById('recipe-image').click()">
                            <i class="fa-solid fa-cloud-arrow-up"></i>
                            <p id="dropzone-text">Click to upload or drag & drop</p>
                            <p class="text-sub">JPG, PNG, WebP up to 10MB</p>
                        </div>
                        <input type="file" id="recipe-image" name="image" accept="image/*" style="display:none">
                    </div>
                    <div class="form-group">
                        <label>Description</label>
                        <textarea class="form-control" name="description" rows="3" placeholder="Describe your masterpiece..." required minlength="10"></textarea>
                    </div>
                    <div class="form-group">
                        <label>Ingredients (one per line)</label>
                        <textarea class="form-control" name="ingredients" rows="5" placeholder="1 cup flour&#10;2 eggs&#10;200g butter" required></textarea>
                    </div>
                    <div class="form-group">
                        <label>Instructions (one step per line)</label>
                        <textarea class="form-control" name="instructions" rows="5" placeholder="Preheat oven to 180°C&#10;Mix dry ingredients&#10;..." required></textarea>
                    </div>
                    <div id="submit-error" style="color:#ef4444; font-size:0.85rem; margin-bottom:0.8rem; display:none;"></div>
                    <div style="text-align:center; margin-top:2rem;">
                        <button type="submit" class="btn-primary" id="submit-recipe-btn" style="padding:1rem 3rem;">
                            <i class="fa-solid fa-paper-plane"></i> Publish Recipe
                        </button>
                    </div>
                </form>
            </div>
        </div>
        ${renderFooter()}
    `;
}

/* ── FOOTER ──────────────────────────────────────────────────── */
function renderFooter() {
    return `
        <footer class="site-footer">
            <div class="footer-grid">
                <div class="footer-brand">
                    <a class="logo-group" data-view="home">
                        <div class="logo-img-wrapper" style="width: 48px; height: 48px;"><img src="assets/logo.png" alt="MIZUMI Logo" style="width:100%; height:100%; object-fit:contain; filter: drop-shadow(var(--accent-glow));"></div>
                        <div class="logo-text"><strong>MIZUMI</strong></div>
                    </a>
                    <p>Elevate your culinary experience with curated recipes from world-class chefs and passionate home cooks.</p>
                    <div class="footer-social">
                        <a href="#" aria-label="Instagram"><i class="fa-brands fa-instagram"></i></a>
                        <a href="#" aria-label="Twitter"><i class="fa-brands fa-x-twitter"></i></a>
                        <a href="#" aria-label="YouTube"><i class="fa-brands fa-youtube"></i></a>
                        <a href="#" aria-label="Pinterest"><i class="fa-brands fa-pinterest-p"></i></a>
                    </div>
                </div>
                <div class="footer-col">
                    <h4>Cuisines</h4>
                    ${categoriesData.slice(0, 5).map(c => `<a href="#" onclick="State.activeCategory='${c.name}'; navigateTo('search'); return false;">${c.name}</a>`).join('')}
                </div>
                <div class="footer-col">
                    <h4>Platform</h4>
                    <a href="#" data-view="home">Home</a>
                    <a href="#" data-view="search">Discover</a>
                    <a href="#" data-view="favorites">Favorites</a>
                    <a href="#" data-view="submit">Submit Recipe</a>
                </div>
                <div class="footer-col">
                    <h4>Contact Us</h4>
                    <a href="mailto:logamithran111@gmail.com" style="display:flex; align-items:center; gap:0.5rem;">
                        <i class="fa-solid fa-envelope" style="color:var(--accent);"></i> logamithran111@gmail.com
                    </a>
                    <a href="tel:+919585776629" style="display:flex; align-items:center; gap:0.5rem;">
                        <i class="fa-solid fa-phone" style="color:var(--accent);"></i> 9585776629
                    </a>
                    <div style="display:flex; align-items:flex-start; gap:0.5rem; color:var(--text-muted); font-size:0.9rem; margin-top:0.3rem;">
                        <i class="fa-solid fa-location-dot" style="color:var(--accent); margin-top:0.2rem;"></i> Salem
                    </div>
                </div>
            </div>
            <div class="footer-bottom">
                <span>© 2026 MIZUMI. All rights reserved.</span>
                <span style="display:flex; align-items:center; gap:0.4rem;">Made in India <img src="https://flagcdn.com/w20/in.png" alt="India flag" style="width:16px; border-radius:2px;"> | Crafted with <i class="fa-solid fa-heart" style="color:var(--accent);"></i> for food lovers</span>
            </div>
        </footer>
    `;
}

/* ══════════════════════════════════════════════════════════════
   EVENT LISTENERS
   ══════════════════════════════════════════════════════════════ */
function attachEventListeners() {
    // Trending carousel
    const trendScroll = document.getElementById('trending-scroll');
    const trendLeft = document.getElementById('trend-left');
    const trendRight = document.getElementById('trend-right');
    if (trendScroll && trendLeft && trendRight) {
        trendLeft.addEventListener('click', () => trendScroll.scrollBy({ left: -320, behavior: 'smooth' }));
        trendRight.addEventListener('click', () => trendScroll.scrollBy({ left: 320, behavior: 'smooth' }));
    }

    // Newsletter
    const nlBtn = document.getElementById('newsletter-btn');
    if (nlBtn) {
        nlBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            const email = document.getElementById('newsletter-email');
            
            if (email && email.value.includes('@')) {
                const originalBtnText = nlBtn.innerHTML;
                nlBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
                nlBtn.disabled = true;

                try {
                    const res = await API.subscribeNewsletter(email.value);
                    showToast(res.message || 'Subscribed successfully!', 'fa-envelope-circle-check');
                    email.value = '';
                } catch (err) {
                    showToast(err.message, 'fa-circle-exclamation');
                } finally {
                    nlBtn.innerHTML = originalBtnText;
                    nlBtn.disabled = false;
                }
            } else {
                showToast('Please enter a valid email', 'fa-circle-exclamation');
            }
        });
    }

    // File upload preview
    const fileInput = document.getElementById('recipe-image');
    if (fileInput) {
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                document.getElementById('dropzone-text').textContent = file.name;
            }
        });
    }
}

/* ── Global Click Delegation ─────────────────────────────────── */
document.body.addEventListener('click', (e) => {
    // Nav links
    const viewTarget = e.target.closest('[data-view]');
    if (viewTarget && !e.target.closest('.recipe-fav-btn') && e.target.type !== 'submit') {
        e.preventDefault();
        navigateTo(viewTarget.getAttribute('data-view'));
        document.querySelector('.hamburger')?.classList.remove('open');
        document.getElementById('mobile-nav')?.classList.remove('open');
        document.body.style.overflow = '';
        return;
    }

    // Recipe card → detail
    const card = e.target.closest('.recipe-card, .trending-card');
    if (card && !e.target.closest('.recipe-fav-btn')) {
        navigateTo('recipe-detail', { id: card.getAttribute('data-recipe-id') });
        return;
    }

    // Favorite button
    const favBtn = e.target.closest('.recipe-fav-btn');
    if (favBtn) {
        e.stopPropagation();
        e.preventDefault();
        const id = favBtn.getAttribute('data-fav-id');

        toggleFavorite(id).then(() => {
            if (State.currentView === 'favorites' || State.currentView === 'recipe-detail') {
                navigateTo(State.currentView, { id: State.currentRecipeId });
            } else {
                const isFav = State.favorites.includes(id);
                favBtn.classList.toggle('active', isFav);
                const icon = favBtn.querySelector('i');
                icon.classList.toggle('fa-solid', isFav);
                icon.classList.toggle('fa-regular', !isFav);
                favBtn.classList.add('heart-bounce');
                setTimeout(() => favBtn.classList.remove('heart-bounce'), 400);
            }
        });
        return;
    }

    // Category tile
    const catTile = e.target.closest('.category-tile');
    if (catTile) {
        State.activeCategory = catTile.getAttribute('data-cuisine');
        navigateTo('search');
        return;
    }

    // Sidebar category filter
    const catFilter = e.target.closest('.cat-filter');
    if (catFilter) {
        State.activeCategory = catFilter.getAttribute('data-category');
        // Fetch new data from backend (which merges MongoDB + TheMealDB)
        API.getRecipes({ 
            search: State.searchQuery,
            cuisine: State.activeCategory,
            difficulty: State.difficultyFilter.join(',')
        }).then(recipes => {
            State.allRecipes = recipes;
            render();
        }).catch(err => {
            console.error(err);
            render();
        });
        return;
    }

    // User icon
    const userBtn = e.target.closest('#user-btn');
    if (userBtn) {
        if (State.user) {
            openAuth('signout');
        } else {
            openAuth('login');
        }
        return;
    }

    // Auth close
    if (e.target.closest('.auth-close') || (e.target.id === 'auth-overlay')) {
        closeAuth();
        return;
    }

    // Back to top
    if (e.target.closest('.back-to-top')) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
});

/* ── Search ──────────────────────────────────────────────────── */
document.body.addEventListener('input', (e) => {
    if (e.target.id === 'search-input') {
        State.searchQuery = e.target.value;
        clearTimeout(window._searchTimeout);
        window._searchTimeout = setTimeout(async () => {
            State.allRecipes = await API.getRecipes({ 
                search: State.searchQuery,
                cuisine: State.activeCategory,
                difficulty: State.difficultyFilter.join(',')
            });
            render();
            const inp = document.getElementById('search-input');
            if (inp) { inp.focus(); inp.selectionStart = inp.value.length; }
        }, 400); // Slight delay to avoid spamming the backend
    }
});

/* ── Difficulty Filter ───────────────────────────────────────── */
document.body.addEventListener('change', async (e) => {
    if (e.target.classList.contains('diff-filter')) {
        const val = e.target.value;
        if (e.target.checked) State.difficultyFilter.push(val);
        else State.difficultyFilter = State.difficultyFilter.filter(d => d !== val);
        
        State.allRecipes = await API.getRecipes({ 
            search: State.searchQuery,
            cuisine: State.activeCategory,
            difficulty: State.difficultyFilter.join(',')
        });
        render();
    }
});

/* ── Form Submissions ────────────────────────────────────────── */
document.body.addEventListener('submit', async (e) => {
    // Recipe form
    if (e.target.id === 'recipe-form') {
        e.preventDefault();
        const btn = document.getElementById('submit-recipe-btn');
        const errDiv = document.getElementById('submit-error');
        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Publishing...';
        errDiv.style.display = 'none';

        try {
            const form = e.target;
            const formData = new FormData(form);
            await API.submitRecipe(formData);

            showToast('Recipe published successfully!', 'fa-circle-check');
            await loadRecipes(); // Refresh recipes list
            navigateTo('home');
        } catch (err) {
            errDiv.textContent = err.message;
            errDiv.style.display = 'block';
            btn.disabled = false;
            btn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Publish Recipe';
        }
    }

    // Auth form
    if (e.target.id === 'auth-form') {
        e.preventDefault();
        const btn = document.getElementById('auth-submit-btn');
        const errDiv = document.getElementById('auth-error');
        btn.disabled = true;
        errDiv.style.display = 'none';

        try {
            if (State.authMode === 'forgot') {
                const emailInput = document.getElementById('auth-email');
                if (!emailInput) throw new Error("Email is required");
                const email = emailInput.value;
                btn.textContent = 'Sending link...';
                const res = await API.forgotPassword(email);
                showToast(res.message, 'fa-envelope-circle-check');
                openAuth('login');
                return;
            }

            if (State.authMode === 'reset') {
                const passwordInput = document.getElementById('auth-password');
                if (!passwordInput) throw new Error("Password is required");
                const password = passwordInput.value;
                btn.textContent = 'Updating password...';
                const res = await API.resetPassword(State.resetToken, password);
                showToast(res.message, 'fa-circle-check');
                State.resetToken = null;
                openAuth('login');
                return;
            }

            const emailInput = document.getElementById('auth-email');
            const passwordInput = document.getElementById('auth-password');
            if(!emailInput || !passwordInput) throw new Error("Email and password required");
            const email = emailInput.value;
            const password = passwordInput.value;

            let data;
            if (State.authMode === 'login') {
                btn.textContent = 'Signing in...';
                data = await API.login(email, password);
            } else {
                btn.textContent = 'Creating account...';
                const nameInput = document.getElementById('auth-name');
                if (!nameInput) throw new Error("Name is required");
                const name = nameInput.value;
                data = await API.register(name, email, password);
            }

            State.user = data.user;
            State.favorites = (data.user.favorites || []).map(f => typeof f === 'object' ? f._id : f);
            closeAuth();
            render();
            showToast(`Welcome, ${data.user.name}!`, 'fa-circle-check');
        } catch (err) {
            errDiv.textContent = err.message;
            errDiv.style.display = 'block';
            btn.disabled = false;
            let btnText = 'Sign In';
            if (State.authMode === 'signup') btnText = 'Create Account';
            if (State.authMode === 'forgot') btnText = 'Send Reset Link';
            if (State.authMode === 'reset') btnText = 'Update Password';
            btn.textContent = btnText;
        }
    }
});

/* ── Hamburger ───────────────────────────────────────────────── */
document.addEventListener('click', (e) => {
    if (e.target.closest('.hamburger')) {
        document.querySelector('.hamburger').classList.toggle('open');
        const mobileNav = document.getElementById('mobile-nav');
        mobileNav.classList.toggle('open');
        document.body.style.overflow = mobileNav.classList.contains('open') ? 'hidden' : '';
    }
});

/* ── Scroll Effects ──────────────────────────────────────────── */
window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    const backToTop = document.querySelector('.back-to-top');
    navbar.classList.toggle('scrolled', window.scrollY > 60);
    if (backToTop) backToTop.classList.toggle('visible', window.scrollY > 500);
}, { passive: true });

/* ── Init ────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', initApp);
