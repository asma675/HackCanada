import { GoogleGenAI, Type } from '@google/genai';

function mapSchema(schema) {
  if (!schema) return undefined;
  const typeMap = {
    object: Type.OBJECT,
    array: Type.ARRAY,
    string: Type.STRING,
    number: Type.NUMBER,
    integer: Type.INTEGER,
    boolean: Type.BOOLEAN,
  };
  const mapped = { type: typeMap[schema.type] || Type.STRING };
  if (schema.description) mapped.description = schema.description;
  if (schema.properties) {
    mapped.properties = Object.fromEntries(
      Object.entries(schema.properties).map(([key, value]) => [key, mapSchema(value)])
    );
  }
  if (schema.items) mapped.items = mapSchema(schema.items);
  if (schema.required) mapped.required = schema.required;
  if (schema.enum) mapped.enum = schema.enum;
  return mapped;
}

export async function invokeGemini({ prompt, response_json_schema }) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is missing');
  }

  const ai = new GoogleGenAI({ apiKey });
  const config = {};

  if (response_json_schema) {
    config.responseMimeType = 'application/json';
    config.responseSchema = mapSchema(response_json_schema);
  }

  const response = await ai.models.generateContent({
    model: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
    contents: prompt,
    config,
  });

  const text = response.text || '';
  if (response_json_schema) {
    return JSON.parse(text);
  }
  return { text };
}
