import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.join(__dirname, 'data.json');

const EMPTY_DB = {
  users: [],
  MealPlan: [],
  UserProfile: [],
  SavedRecipe: [],
  CommunityRecipe: [],
  RecipeRating: [],
};

function ensureDb() {
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify(EMPTY_DB, null, 2));
  }
}

export function readDb() {
  ensureDb();
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
}

export function writeDb(db) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

export function upsertUser({ email, full_name }) {
  const db = readDb();
  let user = db.users.find((u) => u.email === email);
  if (!user) {
    user = {
      id: crypto.randomUUID(),
      email,
      full_name: full_name || email.split('@')[0],
      created_date: new Date().toISOString(),
    };
    db.users.unshift(user);
    writeDb(db);
  }
  return user;
}

export function getUserByEmail(email) {
  const db = readDb();
  return db.users.find((u) => u.email === email) || null;
}

export function listEntities(entityName, { sort = '-created_date', limit = 50 } = {}) {
  const db = readDb();
  const items = [...(db[entityName] || [])];
  const descending = sort.startsWith('-');
  const key = descending ? sort.slice(1) : sort;
  items.sort((a, b) => {
    const av = a[key] ?? '';
    const bv = b[key] ?? '';
    return descending ? String(bv).localeCompare(String(av)) : String(av).localeCompare(String(bv));
  });
  return items.slice(0, limit);
}

export function filterEntities(entityName, filters = {}) {
  const db = readDb();
  return (db[entityName] || []).filter((item) => {
    return Object.entries(filters).every(([key, value]) => {
      if (Array.isArray(value)) return Array.isArray(item[key]) && value.every((v) => item[key].includes(v));
      return item[key] === value;
    });
  });
}

export function createEntity(entityName, payload) {
  const db = readDb();
  const item = {
    id: crypto.randomUUID(),
    created_date: new Date().toISOString(),
    ...payload,
  };
  db[entityName] = [item, ...(db[entityName] || [])];
  writeDb(db);
  return item;
}

export function updateEntity(entityName, id, payload) {
  const db = readDb();
  const index = (db[entityName] || []).findIndex((item) => item.id === id);
  if (index === -1) return null;
  db[entityName][index] = {
    ...db[entityName][index],
    ...payload,
    updated_date: new Date().toISOString(),
  };
  writeDb(db);
  return db[entityName][index];
}
