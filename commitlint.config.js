export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      ['feat', 'fix', 'refactor', 'test', 'docs', 'chore', 'perf', 'build', 'ci'],
    ],
    'scope-enum': [2, 'always', ['core', 'sort', 'render', 'ui', 'ci']],
    'header-max-length': [0, 'always'],
    'body-max-line-length': [0, 'always'],
    'subject-full-stop': [0, 'always'],
  },
};
