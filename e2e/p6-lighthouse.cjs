module.exports = {
  ci: {
    collect: {
      url: [
        '/how-it-works',
        '/about',
        '/proof',
        '/the-honest-marketer',
        '/book',
        '/thanks/magnet',
        '/thanks/booking',
        '/packages',
        '/packages/basic-diy',
        '/packages/executive',
        '/packages/founder',
        '/packages/diamond',
        '/contact',
      ].map((path) => `http://localhost:3003${path}`),
      numberOfRuns: 1,
      settings: { chromeFlags: '--no-sandbox' },
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.95 }],
        'categories:accessibility': ['error', { minScore: 0.95 }],
      },
    },
  },
}
