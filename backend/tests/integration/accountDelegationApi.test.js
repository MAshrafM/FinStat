// backend/tests/integration/accountDelegationApi.test.js
const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../../server');
const testDb = require('../helpers/testDb');
const User = require('../../models/User');
const { createTestUser, generateTestToken } = require('../helpers/authFixtures');

describe('Step 8C.1a: Multi-Tenant Account Delegation & Switching Integration Tests [FEAT-009]', () => {
  let parentManager, childViewer, spouseManager, strangerUser;
  let parentToken, childToken, spouseToken, strangerToken;

  beforeAll(async () => {
    await testDb.connect();
  });

  afterAll(async () => {
    await testDb.closeDatabase();
  });

  beforeEach(async () => {
    await testDb.clearDatabase();

    // 1. Create Parent Manager
    parentManager = await createTestUser({
      username: 'parent_mgr',
      email: 'parent@finstat.io',
      role: 'manager',
      fullName: 'Parent Manager',
    });
    parentToken = generateTestToken(parentManager);

    // 2. Create Child Managed Dependent (managedBy parent)
    childViewer = await createTestUser({
      username: 'child_dep',
      email: 'child@finstat.io',
      role: 'viewer',
      fullName: 'Child Dependent',
      managedBy: parentManager._id,
    });
    childToken = generateTestToken(childViewer);

    // 3. Create Spouse Manager (Independent user who can delegate to Parent)
    spouseManager = await createTestUser({
      username: 'spouse_mgr',
      email: 'spouse@finstat.io',
      role: 'manager',
      fullName: 'Spouse Manager',
    });
    spouseToken = generateTestToken(spouseManager);

    // 4. Create Stranger User (Unrelated tenant)
    strangerUser = await createTestUser({
      username: 'stranger_usr',
      email: 'stranger@finstat.io',
      role: 'manager',
      fullName: 'Stranger User',
    });
    strangerToken = generateTestToken(strangerUser);
  });

  // Test 1: POST /api/users/delegations creates valid delegation between delegator and delegate with relationship and permissions
  test('1. POST /api/users/delegations creates valid delegation between delegator and delegate with relationship and permissions', async () => {
    const res = await request(app)
      .post('/api/users/delegations')
      .set('Authorization', `Bearer ${spouseToken}`)
      .send({
        targetUsername: 'parent_mgr',
        relationship: 'spouse',
        permissions: 'view_only',
        notes: 'Family office tracking access',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.delegation).toBeDefined();
    expect(res.body.delegation.relationship).toBe('spouse');
    expect(res.body.delegation.permissions).toBe('view_only');
    expect(res.body.delegation.status).toBe('active');
  });

  // Test 2: POST /api/users/delegations rejects self-delegation loop when delegator equals delegate (asserts KS-8C-02)
  test('2. POST /api/users/delegations rejects self-delegation loop when delegator equals delegate (asserts KS-8C-02)', async () => {
    const res = await request(app)
      .post('/api/users/delegations')
      .set('Authorization', `Bearer ${parentToken}`)
      .send({
        targetUsername: 'parent_mgr',
        relationship: 'dependent',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  // Test 3: POST /api/users/delegations rejects duplicate delegation for same delegator-delegate pair with HTTP 409 Conflict
  test('3. POST /api/users/delegations rejects duplicate delegation for same delegator-delegate pair with HTTP 409 Conflict', async () => {
    await request(app)
      .post('/api/users/delegations')
      .set('Authorization', `Bearer ${spouseToken}`)
      .send({ targetUsername: 'parent_mgr', relationship: 'spouse' });

    const duplicateRes = await request(app)
      .post('/api/users/delegations')
      .set('Authorization', `Bearer ${spouseToken}`)
      .send({ targetUsername: 'parent_mgr', relationship: 'spouse' });

    expect(duplicateRes.status).toBe(409);
    expect(duplicateRes.body.success).toBe(false);
  });

  // Test 4: POST /api/users/delegations rejects unauthenticated requests with HTTP 401
  test('4. POST /api/users/delegations rejects unauthenticated requests with HTTP 401', async () => {
    const res = await request(app)
      .post('/api/users/delegations')
      .send({ targetUsername: 'parent_mgr' });

    expect(res.status).toBe(401);
  });

  // Test 5: GET /api/users/switchable-accounts returns primary user profile marked with isSelf: true and isCurrent: true
  test('5. GET /api/users/switchable-accounts returns primary user profile marked with isSelf: true and isCurrent: true', async () => {
    const res = await request(app)
      .get('/api/users/switchable-accounts')
      .set('Authorization', `Bearer ${parentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.accounts)).toBe(true);

    const selfAcc = res.body.accounts.find((a) => a.id === parentManager._id.toString());
    expect(selfAcc).toBeDefined();
    expect(selfAcc.isSelf).toBe(true);
    expect(selfAcc.isCurrent).toBe(true);
    expect(selfAcc.username).toBe('parent_mgr');
  });

  // Test 6: GET /api/users/switchable-accounts returns managed dependent accounts where managedBy === user._id
  test('6. GET /api/users/switchable-accounts returns managed dependent accounts where managedBy === user._id', async () => {
    const res = await request(app)
      .get('/api/users/switchable-accounts')
      .set('Authorization', `Bearer ${parentToken}`);

    expect(res.status).toBe(200);
    const childAcc = res.body.accounts.find((a) => a.id === childViewer._id.toString());
    expect(childAcc).toBeDefined();
    expect(childAcc.isManaged).toBe(true);
    expect(childAcc.relationship).toBe('dependent');
  });

  // Test 7: GET /api/users/switchable-accounts returns active delegated accounts where delegate === user._id and status === 'active'
  test("7. GET /api/users/switchable-accounts returns active delegated accounts where delegate === user._id and status === 'active'", async () => {
    // Spouse delegates to Parent
    await request(app)
      .post('/api/users/delegations')
      .set('Authorization', `Bearer ${spouseToken}`)
      .send({ targetUsername: 'parent_mgr', relationship: 'spouse', permissions: 'view_only' });

    const res = await request(app)
      .get('/api/users/switchable-accounts')
      .set('Authorization', `Bearer ${parentToken}`);

    expect(res.status).toBe(200);
    const spouseAcc = res.body.accounts.find((a) => a.id === spouseManager._id.toString());
    expect(spouseAcc).toBeDefined();
    expect(spouseAcc.isDelegated).toBe(true);
    expect(spouseAcc.relationship).toBe('spouse');
  });

  // Test 8: GET /api/users/switchable-accounts excludes revoked delegations from switchable list
  test('8. GET /api/users/switchable-accounts excludes revoked delegations from switchable list', async () => {
    const createRes = await request(app)
      .post('/api/users/delegations')
      .set('Authorization', `Bearer ${spouseToken}`)
      .send({ targetUsername: 'parent_mgr', relationship: 'spouse' });

    const delegationId = createRes.body.delegation._id;

    // Revoke delegation
    await request(app)
      .put(`/api/users/delegations/${delegationId}/revoke`)
      .set('Authorization', `Bearer ${spouseToken}`);

    const res = await request(app)
      .get('/api/users/switchable-accounts')
      .set('Authorization', `Bearer ${parentToken}`);

    expect(res.status).toBe(200);
    const spouseAcc = res.body.accounts.find((a) => a.id === spouseManager._id.toString());
    expect(spouseAcc).toBeUndefined();
  });

  // Test 9: POST /api/users/switch-account successfully generates delegated JWT access token when switching to managed dependent
  test('9. POST /api/users/switch-account successfully generates delegated JWT access token when switching to managed dependent', async () => {
    const res = await request(app)
      .post('/api/users/switch-account')
      .set('Authorization', `Bearer ${parentToken}`)
      .send({ targetUserId: childViewer._id.toString() });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.user).toBeDefined();
    expect(res.body.user.id).toBe(childViewer._id.toString());
    expect(res.body.user.username).toBe('child_dep');
  });

  // Test 10: POST /api/users/switch-account embeds delegatedFrom: originalUserId, isDelegatedSession: true in token payload (asserts INV-8C-02)
  test('10. POST /api/users/switch-account embeds delegatedFrom: originalUserId, isDelegatedSession: true in token payload (asserts INV-8C-02)', async () => {
    const res = await request(app)
      .post('/api/users/switch-account')
      .set('Authorization', `Bearer ${parentToken}`)
      .send({ targetUserId: childViewer._id.toString() });

    expect(res.status).toBe(200);
    const decoded = jwt.decode(res.body.token);
    expect(decoded.user.delegatedFrom).toBe(parentManager._id.toString());
    expect(decoded.user.isDelegatedSession).toBe(true);
  });

  // Test 11: POST /api/users/switch-account clamps token role to 'viewer' and forces canModify: false when delegation permissions are 'view_only' (asserts INV-8C-03)
  test("11. POST /api/users/switch-account clamps token role to 'viewer' and forces canModify: false when delegation permissions are 'view_only' (asserts INV-8C-03)", async () => {
    // Spouse (manager role) delegates with view_only to Parent
    await request(app)
      .post('/api/users/delegations')
      .set('Authorization', `Bearer ${spouseToken}`)
      .send({ targetUsername: 'parent_mgr', relationship: 'spouse', permissions: 'view_only' });

    const res = await request(app)
      .post('/api/users/switch-account')
      .set('Authorization', `Bearer ${parentToken}`)
      .send({ targetUserId: spouseManager._id.toString() });

    expect(res.status).toBe(200);
    const decoded = jwt.decode(res.body.token);
    expect(decoded.user.role).toBe('viewer');
    expect(decoded.user.delegationPermissions).toBe('view_only');
    expect(decoded.user.delegatedFrom).toBe(parentManager._id.toString());
    expect(res.body.user.role).toBe('viewer');
  });

  // Test 12: POST /api/users/switch-account permits switching back to original parent user account using targetUserId === originalUserId
  test('12. POST /api/users/switch-account permits switching back to original parent user account using targetUserId === originalUserId', async () => {
    // First switch to child
    const switchRes = await request(app)
      .post('/api/users/switch-account')
      .set('Authorization', `Bearer ${parentToken}`)
      .send({ targetUserId: childViewer._id.toString() });

    const delegatedToken = switchRes.body.token;

    // Now switch back to parent using the delegated token
    const switchBackRes = await request(app)
      .post('/api/users/switch-account')
      .set('Authorization', `Bearer ${delegatedToken}`)
      .send({ targetUserId: parentManager._id.toString() });

    expect(switchBackRes.status).toBe(200);
    expect(switchBackRes.body.user.id).toBe(parentManager._id.toString());
    expect(switchBackRes.body.user.role).toBe('manager');

    const decoded = jwt.decode(switchBackRes.body.token);
    expect(decoded.user.isDelegatedSession).toBeUndefined();
    expect(decoded.user.delegatedFrom).toBeUndefined();
  });

  // Test 13: POST /api/users/switch-account rejects switch attempt to unauthorized account with HTTP 403 Forbidden (asserts INV-8C-01)
  test('13. POST /api/users/switch-account rejects switch attempt to unauthorized account with HTTP 403 Forbidden (asserts INV-8C-01)', async () => {
    // Parent attempts to switch to unrelated Stranger user
    const res = await request(app)
      .post('/api/users/switch-account')
      .set('Authorization', `Bearer ${parentToken}`)
      .send({ targetUserId: strangerUser._id.toString() });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  // Test 14: PUT /api/users/delegations/:id/revoke revokes delegation status and subsequent switch attempt fails with HTTP 403 (asserts KS-8C-01)
  test('14. PUT /api/users/delegations/:id/revoke revokes delegation status and subsequent switch attempt fails with HTTP 403 (asserts KS-8C-01)', async () => {
    const createRes = await request(app)
      .post('/api/users/delegations')
      .set('Authorization', `Bearer ${spouseToken}`)
      .send({ targetUsername: 'parent_mgr', relationship: 'spouse', permissions: 'view_only' });

    const delegationId = createRes.body.delegation._id;

    // Revoke delegation
    const revokeRes = await request(app)
      .put(`/api/users/delegations/${delegationId}/revoke`)
      .set('Authorization', `Bearer ${spouseToken}`);

    expect(revokeRes.status).toBe(200);
    expect(revokeRes.body.success).toBe(true);
    expect(revokeRes.body.delegation.status).toBe('revoked');

    // Attempt to switch to spouse should now fail
    const switchRes = await request(app)
      .post('/api/users/switch-account')
      .set('Authorization', `Bearer ${parentToken}`)
      .send({ targetUserId: spouseManager._id.toString() });

    expect(switchRes.status).toBe(403);
    expect(switchRes.body.success).toBe(false);
  });
});

