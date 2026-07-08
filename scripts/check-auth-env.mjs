#!/usr/bin/env node
/** Pre-dev check — AUTH_SECRET and OAuth provider keys for web sign-in. */
const required = ['AUTH_SECRET'];
const optional = ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'SLACK_CLIENT_ID', 'SLACK_CLIENT_SECRET'];

let failed = 0;
for (const key of required) {
  const val = process.env[key]?.trim();
  if (!val && process.env.NODE_ENV === 'production') {
    console.log(`FAIL  ${key} — required in production`);
    failed++;
  } else if (!val) {
    console.log(`WARN  ${key} — empty (dev fallback secret will be used)`);
  } else {
    console.log(`OK    ${key}`);
  }
}

for (const key of optional) {
  console.log(`${process.env[key] ? 'OK   ' : 'WARN '} ${key}${process.env[key] ? '' : ' — sign-in button disabled without this'}`);
}

if (failed > 0) process.exit(1);
console.log('\nAuth env check complete.');
