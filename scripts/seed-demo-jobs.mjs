import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs';

const env = Object.fromEntries(
  fs.readFileSync('.env', 'utf8')
    .split(/\n/)
    .filter(Boolean)
    .map((line) => {
      const [key, ...value] = line.split('=');
      return [key, value.join('=').replace(/^"|"$/g, '')];
    })
);

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_PUBLISHABLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const email = `demo-client-chambalink-${Date.now()}@example.com`;
const password = `Demo-${Date.now()}-ChambaLink!`;

const { data: authData, error: signUpError } = await supabase.auth.signUp({
  email,
  password,
  options: { data: { full_name: 'Cliente Demo ChambaLink', role: 'client' } },
});

if (signUpError) throw signUpError;
if (!authData.session || !authData.user) {
  throw new Error('Supabase requiere confirmación de email; no se pudo crear sesión para sembrar trabajos.');
}

const { data: categories, error: categoriesError } = await supabase
  .from('categories')
  .select('id,name');
if (categoriesError) throw categoriesError;

const categoryByName = new Map(categories.map((category) => [category.name, category.id]));
const categoryId = (preferred) => categoryByName.get(preferred) || categories[0]?.id || null;

const geo = (lat, lng) => `\n\n[geo:${lat.toFixed(6)},${lng.toFixed(6)},25]`;

const jobs = [
  {
    title: 'Instalar aire acondicionado split en Chacao',
    description: `Necesito instalar un aire split de 12.000 BTU en apartamento. Tengo el equipo, falta instalación, base y revisión eléctrica.${geo(10.4958, -66.8536)}`,
    location: 'Caracas, Chacao',
    category_id: categoryId('Aire Acondicionado'),
    budget_min: 45,
    budget_max: 80,
    job_type: 'presencial',
    urgency: 'asap',
  },
  {
    title: 'Reparar fuga de agua en cocina - El Cafetal',
    description: `Hay una fuga debajo del fregadero. Necesito diagnóstico y reparación con materiales incluidos si es posible.${geo(10.4642, -66.8266)}`,
    location: 'Caracas, El Cafetal',
    category_id: categoryId('Plomería'),
    budget_min: 25,
    budget_max: 55,
    job_type: 'presencial',
    urgency: 'flexible',
  },
  {
    title: 'Revisión eléctrica de local en Naguanagua',
    description: `Local pequeño necesita revisar breakers, tomas y luces. Busco electricista con experiencia en comercios.${geo(10.2469, -68.0077)}`,
    location: 'Valencia, Naguanagua',
    category_id: categoryId('Electricidad'),
    budget_min: 40,
    budget_max: 90,
    job_type: 'presencial',
    urgency: 'fecha_especifica',
  },
  {
    title: 'Servicio de limpieza profunda para apartamento en Maracaibo',
    description: `Apartamento de 2 habitaciones necesita limpieza profunda antes de mudanza. Ideal con equipo propio.${geo(10.6545, -71.6372)}`,
    location: 'Maracaibo, Tierra Negra',
    category_id: categoryId('Limpieza'),
    budget_min: 35,
    budget_max: 70,
    job_type: 'presencial',
    urgency: 'flexible',
  },
  {
    title: 'Fotos para cumpleaños en Barquisimeto',
    description: `Necesito fotógrafo por 3 horas para cumpleaños familiar. Entrega digital, fotos editadas básicas.${geo(10.0678, -69.3474)}`,
    location: 'Barquisimeto, Este',
    category_id: categoryId('Fotografía') || categoryId('Eventos'),
    budget_min: 60,
    budget_max: 120,
    job_type: 'presencial',
    urgency: 'fecha_especifica',
  },
  {
    title: 'Diseño de logo para emprendimiento de comida',
    description: 'Necesito logo simple, paleta de colores y 3 versiones para redes sociales. Trabajo 100% remoto.',
    location: 'Remoto',
    category_id: categoryId('Diseño Gráfico') || categoryId('Diseño'),
    budget_min: 30,
    budget_max: 80,
    job_type: 'remoto',
    urgency: 'flexible',
  },
];

const { data: inserted, error: insertError } = await supabase
  .from('jobs')
  .insert(jobs.map((job) => ({ ...job, client_id: authData.user.id, status: 'open' })))
  .select('id,title,location');

if (insertError) throw insertError;

console.log(JSON.stringify({ email, inserted }, null, 2));
