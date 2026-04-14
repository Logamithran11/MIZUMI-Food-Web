/**
 * ═══════════════════════════════════════════════════════════════
 * MIZUMI — API Client
 * Handles all communication with the Express backend
 * ═══════════════════════════════════════════════════════════════
 */

const API = {
    BASE: '/api',

    /* ── Token Management ────────────────────────────────────── */
    getToken() {
        return localStorage.getItem('gm_token');
    },

    setToken(token) {
        localStorage.setItem('gm_token', token);
    },

    clearToken() {
        localStorage.removeItem('gm_token');
    },

    /* ── HTTP Helpers ────────────────────────────────────────── */
    async request(endpoint, options = {}) {
        const url = `${this.BASE}${endpoint}`;
        const headers = options.headers || {};

        // Add auth token if available
        const token = this.getToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        // Add JSON content type for non-FormData requests
        if (!(options.body instanceof FormData)) {
            headers['Content-Type'] = 'application/json';
        }

        try {
            const response = await fetch(url, {
                ...options,
                headers
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || `Request failed (${response.status})`);
            }

            return data;
        } catch (err) {
            if (err.message === 'Failed to fetch') {
                throw new Error('Unable to connect to server. Is the backend running?');
            }
            throw err;
        }
    },

    async get(endpoint) {
        return this.request(endpoint);
    },

    async post(endpoint, body) {
        const options = { method: 'POST' };
        if (body instanceof FormData) {
            options.body = body;
        } else {
            options.body = JSON.stringify(body);
        }
        return this.request(endpoint, options);
    },

    async delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    },

    async put(endpoint, body) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(body)
        });
    },

    /* ══════════════════════════════════════════════════════════
       AUTH
       ══════════════════════════════════════════════════════════ */

    async register(name, email, password) {
        const data = await this.post('/auth/register', { name, email, password });
        this.setToken(data.token);
        return data;
    },

    async login(email, password) {
        const data = await this.post('/auth/login', { email, password });
        this.setToken(data.token);
        return data;
    },

    async getMe() {
        return this.get('/auth/me');
    },

    logout() {
        this.clearToken();
    },

    isLoggedIn() {
        return !!this.getToken();
    },

    async forgotPassword(email) {
        return this.post('/auth/forgot-password', { email });
    },

    async resetPassword(token, password) {
        return this.post('/auth/reset-password', { token, password });
    },

    async updateAvatar(avatar) {
        return this.put('/auth/avatar', { avatar });
    },

    /* ══════════════════════════════════════════════════════════
       RECIPES
       ══════════════════════════════════════════════════════════ */

    async getRecipes(params = {}) {
        const query = new URLSearchParams();
        if (params.search) query.set('search', params.search);
        if (params.cuisine && params.cuisine !== 'All') query.set('cuisine', params.cuisine);
        if (params.difficulty) query.set('difficulty', params.difficulty);
        if (params.featured) query.set('featured', 'true');
        if (params.trending) query.set('trending', 'true');
        if (params.sort) query.set('sort', params.sort);

        const qs = query.toString();
        return this.get(`/recipes${qs ? '?' + qs : ''}`);
    },

    async getRecipe(id) {
        return this.get(`/recipes/${id}`);
    },

    async submitRecipe(formData) {
        return this.post('/recipes', formData);
    },

    /* ══════════════════════════════════════════════════════════
       FAVORITES
       ══════════════════════════════════════════════════════════ */

    async getFavorites() {
        return this.get('/favorites');
    },

    async addFavorite(recipeId) {
        return this.post(`/favorites/${recipeId}`, {});
    },

    async removeFavorite(recipeId) {
        return this.delete(`/favorites/${recipeId}`);
    },

    /* ══════════════════════════════════════════════════════════════
       NEWSLETTER
       ══════════════════════════════════════════════════════════════ */
    async subscribeNewsletter(email) {
        return this.post('/newsletter/subscribe', { email });
    }
};
