// frontend/tests/visual/fixtures/auth.setup.js
const { test: setup } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const AUTH_FILE = path.resolve(__dirname, '.auth.json');

setup('authenticate visual test session', async () => {
  const authPayload = {
    cookies: [],
    origins: [
      {
        origin: 'http://localhost:3000',
        localStorage: [
          {
            name: 'token',
            value: 'mock-visual-harness-token',
          },
          {
            name: 'user',
            value: JSON.stringify({
              _id: 'visual-mock-user-id',
              name: 'Visual Harness User',
              email: 'visual@finstat.test',
              role: 'admin',
            }),
          },
        ],
      },
    ],
  };

  fs.writeFileSync(AUTH_FILE, JSON.stringify(authPayload, null, 2), 'utf8');
});

