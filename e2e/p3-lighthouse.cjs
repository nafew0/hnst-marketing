module.exports = {
  ci: {
    collect: {
      url: [
        'http://localhost:3003/',
        'http://localhost:3003/packages',
        'http://localhost:3003/contact',
      ],
      numberOfRuns: 1,
      settings: { chromeFlags: '--no-sandbox' },
    },
    assert: {
      assertMatrix: [
        {
          matchingUrlPattern: '^http://localhost:3003/$',
          assertions: {
            'categories:performance': ['error', { minScore: 0.9 }],
            'categories:accessibility': ['error', { minScore: 0.95 }],
          },
        },
        {
          matchingUrlPattern: '^http://localhost:3003/(packages|contact)',
          assertions: {
            'categories:performance': ['error', { minScore: 0.95 }],
            'categories:accessibility': ['error', { minScore: 0.95 }],
          },
        },
      ],
    },
  },
}
