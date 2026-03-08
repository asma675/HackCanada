import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { invokeGemini } from './gemini.js';
import { mapsProxy } from './maps.js';
import { createEntity, filterEntities, getUserByEmail, listEntities, readDb, updateEntity, upsertUser, writeDb } from './db.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.post('/api/auth/login', (req, res) => {
  const { email, full_name } = req.body || {};
  if (!email) return res.status(400).json({ error: 'Email is required' });
  const user = upsertUser({ email, full_name });
  res.json(user);
});

app.post('/api/auth/me', (req, res) => {
  const { email } = req.body || {};
  if (!email) return res.status(400).json({ error: 'Email is required' });
  const user = getUserByEmail(email);
  if (!user) return res.status(401).json({ error: 'User not found' });
  res.json(user);
});

app.post('/api/llm/invoke', async (req, res) => {
  try {
    const result = await invokeGemini(req.body || {});
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message || 'LLM request failed' });
  }
});

app.post('/api/functions/:name', async (req, res) => {
  try {
    const { name } = req.params;
    if (name === 'getMapKey') {
      return res.json({ key: process.env.GOOGLE_MAPS_BROWSER_KEY || process.env.GOOGLE_MAPS_API_KEY || '' });
    }
    if (name === 'mapsProxy') {
      return res.json(await mapsProxy(req.body || {}));
    }
    if (name === 'vetRecipe') {
      const recipe = req.body?.recipe;
      const prompt = `You are validating a community recipe submission for nutrition and sustainability.
Return a strict JSON object.
Recipe name: ${recipe?.name}
Description: ${recipe?.description}
Location: ${recipe?.author_location}
Ingredients: ${JSON.stringify(recipe?.ingredients || [])}
Instructions: ${JSON.stringify(recipe?.instructions || [])}`;
      const result = await invokeGemini({
        prompt,
        response_json_schema: {
          type: 'object',
          properties: {
            passes: { type: 'boolean' },
            nutrition_score: { type: 'number' },
            sustainability_score: { type: 'number' },
            ai_feedback: { type: 'string' },
          },
          required: ['passes', 'nutrition_score', 'sustainability_score', 'ai_feedback'],
        },
      });
      return res.json(result);
    }
    return res.status(404).json({ error: 'Function not found' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message || 'Function request failed' });
  }
});

app.get('/api/entities/:entity', (req, res) => {
  const { entity } = req.params;
  const { sort = '-created_date', limit = '50' } = req.query;
  res.json(listEntities(entity, { sort, limit: Number(limit) }));
});

app.post('/api/entities/:entity/filter', (req, res) => {
  const { entity } = req.params;
  res.json(filterEntities(entity, req.body || {}));
});

app.post('/api/entities/:entity', (req, res) => {
  const { entity } = req.params;
  res.json(createEntity(entity, req.body || {}));
});

app.patch('/api/entities/:entity/:id', (req, res) => {
  const { entity, id } = req.params;
  const updated = updateEntity(entity, id, req.body || {});
  if (!updated) return res.status(404).json({ error: 'Record not found' });
  res.json(updated);
});


app.delete('/api/entities/:entity/:id', (req, res) => {
  const { entity, id } = req.params;
  const db = readDb();
  const before = (db[entity] || []).length;
  db[entity] = (db[entity] || []).filter((item) => item.id !== id);
  if (db[entity].length === before) return res.status(404).json({ error: 'Record not found' });
  writeDb(db);
  res.status(204).send();
});

const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`Savoura backend running on http://localhost:${port}`);
});
