const fs = require('fs');

const data = JSON.parse(fs.readFileSync('lighthouse-report.json', 'utf8'));

console.log('--- SCORES ---');
console.log(`Performance: ${data.categories.performance.score * 100}`);
console.log(`Accessibility: ${data.categories.accessibility.score * 100}`);
console.log(`Best Practices: ${data.categories['best-practices'].score * 100}`);
console.log(`SEO: ${data.categories.seo.score * 100}`);

console.log('\n--- PERFORMANCE METRICS ---');
const audits = data.audits;
console.log(`FCP: ${audits['first-contentful-paint'].displayValue}`);
console.log(`LCP: ${audits['largest-contentful-paint'].displayValue}`);
console.log(`TBT: ${audits['total-blocking-time'].displayValue}`);
console.log(`CLS: ${audits['cumulative-layout-shift'].displayValue}`);
console.log(`Speed Index: ${audits['speed-index'].displayValue}`);

console.log('\n--- OPPORTUNITIES (Performance) ---');
for (const key of Object.keys(audits)) {
    const audit = audits[key];
    if (audit.details && audit.details.type === 'opportunity' && audit.score !== null && audit.score < 1) {
        console.log(`- ${audit.title}: ${audit.displayValue} savings`);
    }
}

console.log('\n--- FAILED AUDITS (SEO & Best Practices & A11y) ---');
for (const key of Object.keys(audits)) {
    const audit = audits[key];
    if (audit.score !== null && audit.score < 1 && audit.scoreDisplayMode !== 'notApplicable' && audit.scoreDisplayMode !== 'informative' && audit.details?.type !== 'opportunity') {
        const categories = Object.keys(data.categories).filter(cat => data.categories[cat].auditRefs.some(ref => ref.id === key));
        if (categories.includes('seo') || categories.includes('best-practices') || categories.includes('accessibility')) {
             console.log(`- [${categories.join(', ')}] ${audit.title}`);
        }
    }
}
