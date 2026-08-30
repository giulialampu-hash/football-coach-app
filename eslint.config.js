const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  { ignores: ['android/**', 'dist/**', 'demo/**'] },
  { files: ['app/(tabs)/board.tsx'], rules: { 'react-hooks/immutability': 'off' } },
]);
