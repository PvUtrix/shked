module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',     // новая функциональность
        'fix',      // исправление ошибки
        'docs',     // изменения в документации
        'style',    // форматирование, отсутствующие точки с запятой и т.д.
        'refactor', // рефакторинг кода
        'perf',     // улучшение производительности
        'test',     // добавление тестов
        'chore',    // обновление задач сборки, конфигурации и т.д.
        'ci',       // изменения в CI/CD
        'build',    // изменения в системе сборки
        'revert'    // откат изменений
      ]
    ],
    'subject-case': [2, 'never', ['start-case', 'pascal-case', 'upper-case']],
    'subject-empty': [2, 'never'],
    'subject-full-stop': [2, 'never', '.'],
    'header-max-length': [2, 'always', 100]
  }
}
