// WCAG 2.1 contrast ratio computation
function srgbToLin(c) {
  const v = c / 255;
  return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}
function relLum(r, g, b) {
  return 0.2126 * srgbToLin(r) + 0.7152 * srgbToLin(g) + 0.0722 * srgbToLin(b);
}
function ratio(hex1, hex2) {
  const p = h => [parseInt(h.slice(1,3),16), parseInt(h.slice(3,5),16), parseInt(h.slice(5,7),16)];
  const [r1,g1,b1] = p(hex1);
  const [r2,g2,b2] = p(hex2);
  const L1 = relLum(r1,g1,b1);
  const L2 = relLum(r2,g2,b2);
  const lighter = Math.max(L1, L2);
  const darker = Math.min(L1, L2);
  return (lighter + 0.05) / (darker + 0.05);
}

const checks = [
  ['text-primary #F4F4F6 on canvas #0B0B12', '#F4F4F6', '#0B0B12'],
  ['text-secondary #A0A0AE on card #15151F', '#A0A0AE', '#15151F'],
  ['text-secondary #A0A0AE on canvas #0B0B12', '#A0A0AE', '#0B0B12'],
  ['text-muted #6B6B7B on canvas #0B0B12', '#6B6B7B', '#0B0B12'],
  ['text-muted #6B6B7B on card #15151F', '#6B6B7B', '#15151F'],
  ['accent #6A5AE0 on canvas #0B0B12', '#6A5AE0', '#0B0B12'],
  ['white #FFFFFF on accent #6A5AE0', '#FFFFFF', '#6A5AE0'],
  ['accent #6A5AE0 on white #FFFFFF', '#6A5AE0', '#FFFFFF'],
  // Suspected violation: text-slate-500 (#64748b) on dark canvas
  ['text-slate-500 #64748B on canvas #0B0B12', '#64748B', '#0B0B12'],
  ['text-slate-500 #64748B on card #15151F', '#64748B', '#15151F'],
  // text-slate-400 (#94A3B8) for comparison
  ['text-slate-400 #94A3B8 on canvas #0B0B12', '#94A3B8', '#0B0B12'],
  ['text-slate-300 #CBD5E1 on canvas #0B0B12', '#CBD5E1', '#0B0B12'],
];

const results = [];
checks.forEach(([label, fg, bg]) => {
  const r = ratio(fg, bg);
  const aaNormal = r >= 4.5;
  const aaLarge = r >= 3.0;
  results.push({label, ratio: r.toFixed(2), aaNormal: aaNormal ? 'PASS' : 'FAIL', aaLarge: aaLarge ? 'PASS' : 'FAIL'});
  console.log(label + ' → ' + r.toFixed(2) + ':1 | Normal ' + (aaNormal ? 'PASS' : 'FAIL') + ' | Large ' + (aaLarge ? 'PASS' : 'FAIL'));
});

import { writeFileSync } from 'fs';
writeFileSync('./contrast-checks.json', JSON.stringify(results, null, 2));
console.log('\nSaved contrast-checks.json');
