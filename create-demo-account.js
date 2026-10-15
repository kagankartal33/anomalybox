// Run with: node create-demo-account.js
// Set the two env vars first (get SUPABASE_SERVICE_ROLE_KEY from `supabase status` or `supabase start` output)
//
// Example (PowerShell):
//   $env:NEXT_PUBLIC_SUPABASE_URL = "http://127.0.0.1:55321"
//   $env:SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
//   node create-demo-account.js

import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:55321';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!serviceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY not found in env. Please set it or run with proper .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const DEMO_EMAIL = 'demo.creator@viralbox.test';
const DEMO_PASSWORD = 'DemoViralBox2026!';
const DEMO_NAME = 'Demo Creator';

const CATEGORY_SLUG = 'beauty';
const PERSONA_SLUG = 'luxury_editor';

async function main() {
  console.log('🚀 Creating demo account...');

  // 1. Create auth user
  const { data: userData, error: createError } = await supabase.auth.admin.createUser({
    email: DEMO_EMAIL,
    password: DEMO_PASSWORD,
    email_confirm: true,
    user_metadata: { display_name: DEMO_NAME }
  });

  if (createError) {
    console.error('User creation error:', createError.message);
    // If user already exists, we can continue
    if (!createError.message.includes('already been registered')) {
      process.exit(1);
    }
  }

  let userId;
  if (userData?.user) {
    userId = userData.user.id;
    console.log('✅ User created:', userId);
  } else {
    // Try to find existing
    const { data: users } = await supabase.auth.admin.listUsers();
    const existing = users?.users?.find(u => u.email === DEMO_EMAIL);
    if (existing) {
      userId = existing.id;
      console.log('ℹ️ Using existing user:', userId);
    } else {
      console.error('Could not find or create user');
      process.exit(1);
    }
  }

  // 2. Ensure profile
  await supabase.from('profiles').upsert({
    id: userId,
    display_name: DEMO_NAME,
    role: 'creator',
  }, { onConflict: 'id' });

  await supabase.from('creator_profiles').upsert({
    user_id: userId,
    handle: '@democreator',
    niche: 'beauty and lifestyle',
    default_platforms: ['instagram_reels']
  }, { onConflict: 'user_id' });

  // 3. Set category preference
  const { data: category } = await supabase.from('categories').select('id').eq('slug', CATEGORY_SLUG).single();
  const { data: persona } = await supabase.from('creator_personas').select('id').eq('slug', PERSONA_SLUG).single();

  if (category && persona) {
    await supabase.from('creator_category_preferences').upsert({
      user_id: userId,
      category_id: category.id,
      persona_id: persona.id,
      priority: 1
    }, { onConflict: 'user_id,category_id,persona_id' });
  }

  console.log('✅ Profile and preferences set');

  // 4. Get box products
  const { data: boxes } = await supabase
    .from('box_products')
    .select('*')
    .in('slug', ['viral_box_500', 'premium_viral_box_1000']);

  if (!boxes || boxes.length < 2) {
    console.error('Box products not found. Make sure seeds are applied.');
    process.exit(1);
  }

  const box500 = boxes.find(b => b.slug === 'viral_box_500');
  const box1000 = boxes.find(b => b.slug === 'premium_viral_box_1000');

  // 5. Create sample idea cards and deliveries (bypassing full inventory for demo)
  const now = new Date().toISOString();

  // Create two deliveries
  const delivery500 = {
    id: randomUUID(),
    user_id: userId,
    box_product_id: box500.id,
    category_id: category?.id,
    persona_id: persona?.id,
    status: 'delivered',
    allocation: { low: 1, high: 1 },
    delivered_at: now,
    created_at: now
  };

  const delivery1000 = {
    id: randomUUID(),
    user_id: userId,
    box_product_id: box1000.id,
    category_id: category?.id,
    persona_id: persona?.id,
    status: 'delivered',
    allocation: { low: 2, mid: 1, high: 2 },
    delivered_at: now,
    created_at: now
  };

  await supabase.from('idea_box_deliveries').upsert([delivery500, delivery1000]);

  // Create sample idea_cards and link them
  const sampleCards = [
    {
      idea_id: randomUUID(),
      title: 'The Decision Filter Before the Final Shot',
      card: {
        one_sentence_premise: 'Show the choices that happen before the polished final look.',
        idea_summary: { title: 'The Decision Filter Before the Final Shot' },
        video_blueprint: { duration_seconds: 28, opening_visual: 'Close-up of perfect final', scene_arc: 'Decision → proof → checklist' },
        scene_script: [{ purpose: 'Hook', beat: 'Final look reveal' }, { purpose: 'Proof', beat: '3 elimination questions' }],
        brand_lift_statement: 'Positions you as someone with taste and standards, not just a product user.',
        brand_safety: { disclosure_text: 'If sponsored, disclose clearly.' }
      }
    },
    {
      idea_id: randomUUID(),
      title: 'Edit to Look Expensive, Not Just Styled',
      card: {
        one_sentence_premise: 'Demonstrate that luxury comes from thoughtful subtraction.',
        idea_summary: { title: 'Edit to Look Expensive, Not Just Styled' },
        video_blueprint: { duration_seconds: 32 },
        scene_script: [{ purpose: 'Problem', beat: 'Overdone look' }, { purpose: 'Solution', beat: 'Elimination process' }],
        brand_lift_statement: 'Shows sophisticated judgment and restraint.',
      }
    }
  ];

  // Insert idea_cards
  for (const card of sampleCards) {
    await supabase.from('idea_cards').upsert({
      idea_id: card.idea_id,
      title: card.title,
      card: card.card
    });
  }

  // Create box items for both deliveries
  const items500 = [
    { id: randomUUID(), delivery_id: delivery500.id, user_id: userId, inventory_id: randomUUID(), idea_id: sampleCards[0].idea_id, slot_index: 1, assigned_band: 'high' },
  ];

  const items1000 = [
    { id: randomUUID(), delivery_id: delivery1000.id, user_id: userId, inventory_id: randomUUID(), idea_id: sampleCards[0].idea_id, slot_index: 1, assigned_band: 'low' },
    { id: randomUUID(), delivery_id: delivery1000.id, user_id: userId, inventory_id: randomUUID(), idea_id: sampleCards[1].idea_id, slot_index: 2, assigned_band: 'high' },
  ];

  await supabase.from('idea_box_items').upsert([...items500, ...items1000]);

  // Mark as opened for one of them so user can see cards immediately
  await supabase.from('idea_box_deliveries').update({
    metadata: { opened_at: now, opened_by: userId }
  }).eq('id', delivery1000.id);

  console.log('\n✅ Demo account ready!');
  console.log('Email:    ', DEMO_EMAIL);
  console.log('Password: ', DEMO_PASSWORD);
  console.log('You have:');
  console.log('  - 1 × $500 box (sealed)');
  console.log('  - 1 × $1000 box (already opened with sample cards)');
  console.log('\nGo to http://localhost:3000/login and use the Sign in form.');
  console.log('Go to /boxes to test the reveal experience.');
}

main().catch(console.error);