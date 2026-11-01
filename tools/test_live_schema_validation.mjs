async function testSchema(path) {
  const res = await fetch('https://anomalybox.com' + path, {
    headers: { 'user-agent': 'Mozilla/5.0 (compatible; Googlebot/2.1)' }
  });
  const html = await res.text();
  const scripts = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi)];
  console.log(path + ' -> ' + scripts.length + ' JSON-LD script tags');
  for (const s of scripts) {
    try {
      const data = JSON.parse(s[1]);
      const types = Array.isArray(data) ? data.map(d => d['@type']).join(', ') : data['@type'];
      console.log('   Schema types: ' + types);
    } catch(e) {
      console.log('   JSON Parse Error: ' + e.message);
    }
  }
}

async function run() {
  await testSchema('/');
  await testSchema('/dossiers/classic-red');
  await testSchema('/tools/first-3-seconds-auditor');
  await testSchema('/resources/creator-decision-fatigue-and-burnout-solution');
}

run().catch(console.error);
