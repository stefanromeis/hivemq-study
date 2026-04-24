/** @type {import("eslint").Linter.Config} */
module.exports = {
  root: true,
  extends: [
    './index.js',
    'next/core-web-vitals',
    'plugin:jsx-a11y/recommended',
    'plugin:react-hooks/recommended',
    'prettier',
  ],
  rules: {
    'react/jsx-key': 'error',
    'react/no-unescaped-entities': 'off',
  },
};
