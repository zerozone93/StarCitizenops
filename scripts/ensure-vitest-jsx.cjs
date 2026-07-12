const fs = require('fs');
const path = require('path');

const tsconfigPath = path.join(__dirname, '..', 'tsconfig.json');

try {
  const raw = fs.readFileSync(tsconfigPath, 'utf8');
  const json = JSON.parse(raw);

  if (!json.compilerOptions) {
    json.compilerOptions = {};
  }

  if (json.compilerOptions.jsx !== 'react-jsx') {
    json.compilerOptions.jsx = 'react-jsx';
    fs.writeFileSync(tsconfigPath, `${JSON.stringify(json, null, 2)}\n`, 'utf8');
    console.log('Updated tsconfig.json jsx to react-jsx for Vitest.');
  }
} catch (error) {
  console.error('Failed to ensure Vitest JSX setting:', error);
  process.exit(1);
}
