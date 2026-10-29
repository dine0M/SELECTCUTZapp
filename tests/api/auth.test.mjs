import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';

// This suite is restricted to the disposable CI API.
const baseUrl = process.env.TEST_API_URL;

if (
  process.env.CI !== 'true' ||
  baseUrl !== 'http://127.0.0.1:8081/api'
) {
  throw new Error(
    'Run these tests only in CI against the temporary local API.'
  );
}

async function request(endpoint, body, token) {
  const headers = {};

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['X-Session-Token'] = token;
  }

  const response = await fetch(`${baseUrl}/${endpoint}`, {
    method: body === undefined ? 'GET' : 'POST',
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(10000)
  });

  const text = await response.text();
  let data;

  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(
      `${endpoint} returned HTTP ${response.status} with invalid JSON.`
    );
  }

  return { status: response.status, data };
}

function assertRejected(response, expectedStatus) {
  assert.equal(response.status, expectedStatus);
  assert.equal(response.data.success, false);
}

test('authentication and session integration', async t => {
  const email = `ci-${randomUUID()}@example.test`;
  const password = 'CI-Customer-Password-123!';
  let token = '';

  await t.test('health endpoint connects to the test database', async () => {
    const response = await request('health.php');

    assert.equal(response.status, 200);
    assert.equal(response.data.success, true);
  });

  await t.test('registration rejects an invalid email', async () => {
    const response = await request('auth.php', {
      action: 'register',
      fullName: 'CI Customer',
      email: 'invalid-email',
      phone: '0123456789',
      password
    });

    assertRejected(response, 400);
  });

  await t.test('registration rejects a short password', async () => {
    const response = await request('auth.php', {
      action: 'register',
      fullName: 'CI Customer',
      email,
      phone: '0123456789',
      password: '123'
    });

    assertRejected(response, 400);
  });

  await t.test('registration creates a customer account', async () => {
    const response = await request('auth.php', {
      action: 'register',
      fullName: 'CI Customer',
      email,
      phone: '0123456789',
      password
    });

    assert.equal(response.status, 200);
    assert.equal(response.data.success, true);
  });

  await t.test('registration rejects a duplicate email', async () => {
    const response = await request('auth.php', {
      action: 'register',
      fullName: 'Another Customer',
      email,
      phone: '0123456789',
      password
    });

    assertRejected(response, 400);
  });

  await t.test('login rejects an incorrect password', async () => {
    const response = await request('auth.php', {
      action: 'login',
      username: email,
      password: 'Incorrect-Password-123!',
      type: 'customer'
    });

    assertRejected(response, 401);
    assert.equal(response.data.sessionToken, undefined);
  });

  await t.test('customer data requires authentication', async () => {
    const response = await request('customer.php');

    assertRejected(response, 401);
  });

  await t.test('login returns a customer session', async () => {
    const response = await request('auth.php', {
      action: 'login',
      username: email,
      password,
      type: 'customer'
    });

    assert.equal(response.status, 200);
    assert.equal(response.data.success, true);
    assert.equal(response.data.user.role, 'customer');
    assert.ok(Number(response.data.user.id) > 0);
    assert.equal(typeof response.data.sessionToken, 'string');
    assert.match(
      response.data.sessionToken,
      /^[A-Za-z0-9,-]{16,128}$/
    );

    token = response.data.sessionToken;
  });

  await t.test('customer session can retrieve customer data', async () => {
    assert.ok(token, 'A successful login must produce a session.');

    const response = await request('customer.php', undefined, token);

    assert.equal(response.status, 200);
    assert.ok(Array.isArray(response.data.bookings));
    assert.ok(Array.isArray(response.data.notifications));
  });

  await t.test('customer session cannot retrieve admin reports', async () => {
    assert.ok(token);

    const response = await request(
      'admin.php',
      { action: 'reports' },
      token
    );

    assertRejected(response, 401);
  });

  await t.test('malformed session tokens are rejected', async () => {
    const response = await request(
      'customer.php',
      undefined,
      'invalid!'
    );

    assertRejected(response, 401);
  });

  await t.test('logout invalidates the customer session', async () => {
    assert.ok(token);

    const logout = await request('logout.php', {}, token);

    assert.equal(logout.status, 200);
    assert.equal(logout.data.success, true);

    const response = await request('customer.php', undefined, token);

    assertRejected(response, 401);
  });
});