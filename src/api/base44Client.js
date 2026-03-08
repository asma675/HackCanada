const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';
const USER_STORAGE_KEY = 'savoura_local_user';

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  if (res.status === 204) return null;

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const error = new Error(data?.error || data?.message || 'Request failed');
    error.status = res.status;
    error.data = data;
    throw error;
  }
  return data;
}

function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_STORAGE_KEY) || 'null');
  } catch {
    return null;
  }
}

function setStoredUser(user) {
  if (!user) {
    localStorage.removeItem(USER_STORAGE_KEY);
    return;
  }
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
}

function createEntityApi(entityName) {
  return {
    async list(sort = '-created_date', limit = 50) {
      const params = new URLSearchParams({ sort, limit: String(limit) });
      return request(`/entities/${entityName}?${params.toString()}`);
    },
    async create(payload) {
      return request(`/entities/${entityName}`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },
    async filter(filters = {}) {
      return request(`/entities/${entityName}/filter`, {
        method: 'POST',
        body: JSON.stringify(filters),
      });
    },
    async update(id, payload) {
      return request(`/entities/${entityName}/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
    },
  };
}

const entityNames = [
  'MealPlan',
  'UserProfile',
  'SavedRecipe',
  'CommunityRecipe',
  'RecipeRating',
];

const entities = Object.fromEntries(entityNames.map((name) => [name, createEntityApi(name)]));

export const base44 = {
  entities,
  auth: {
    async me() {
      const localUser = getStoredUser();
      if (!localUser) {
        throw new Error('Not authenticated');
      }
      return request('/auth/me', {
        method: 'POST',
        body: JSON.stringify({ email: localUser.email }),
      });
    },
    async login({ email, full_name }) {
      const user = await request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, full_name }),
      });
      setStoredUser(user);
      return user;
    },
    logout() {
      setStoredUser(null);
      window.location.reload();
    },
    redirectToLogin() {
      const email = window.prompt('Enter your email to continue');
      if (!email) return;
      const full_name = window.prompt('Enter your name');
      this.login({ email, full_name: full_name || email.split('@')[0] }).then(() => {
        window.location.reload();
      }).catch((error) => {
        console.error(error);
        window.alert('Could not sign in. Please check the backend is running.');
      });
    },
  },
  integrations: {
    Core: {
      async InvokeLLM(payload) {
        return request('/llm/invoke', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      },
    },
  },
  functions: {
    async invoke(name, payload = {}) {
      const data = await request(`/functions/${name}`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      return { data };
    },
  },
};
