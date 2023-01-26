module.exports = {
  parserOptions: {
    tsconfigRootDir: __dirname,
    project: ['./tsconfig.json'],
  },
  extends: ['plugin:@typescript-eslint/recommended'],
  plugins: ['functional'],
  overrides: [
    {
      files: ['*.spec.tsx', '*.spec.ts', '*.stories.tsx'],
      rules: {
        'no-unused-expressions': 'off',
        'functional/immutable-data': 'off',
        '@typescript-eslint/no-non-null-assertion': 'off',
      },
    },
  ],
  rules: {
    'import/no-anonymous-default-export': 'off',
    'no-useless-rename': 'error',
    'object-shorthand': ['error', 'always'],
    '@typescript-eslint/ban-ts-comment': 'off',
    '@typescript-eslint/ban-types': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-loss-of-precision': 'off',
    '@typescript-eslint/no-unused-vars': 'off',
    '@typescript-eslint/no-var-requires': 'off',
  },
};
