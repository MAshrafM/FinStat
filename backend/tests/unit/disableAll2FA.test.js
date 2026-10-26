const { disableAll2FA } = require('../../scripts/disable-all-2fa');

describe('Step 5A.2: [AUD-OPS-005] Emergency 2FA Reset Utility', () => {
  it('skips users who already have 2FA disabled', async () => {
    const mockUsers = [
      { _id: 'user1', username: 'alice', totpEnabled: false, totpSecret: null, backupCodes: [] },
      { _id: 'user2', username: 'bob', totpEnabled: false, totpSecret: null },
    ];

    const mockUserModel = {
      find: jest.fn().mockResolvedValue(mockUsers),
      updateOne: jest.fn(),
    };

    const mockAuditModel = {
      create: jest.fn(),
    };

    const stats = await disableAll2FA({
      UserModel: mockUserModel,
      LoginAuditModel: mockAuditModel,
      isDryRun: false,
      logger: { log: jest.fn(), error: jest.fn() },
    });

    expect(stats.totalScanned).toBe(2);
    expect(stats.updated).toBe(0);
    expect(stats.skippedAlreadyDisabled).toBe(2);
    expect(mockUserModel.updateOne).not.toHaveBeenCalled();
    expect(mockAuditModel.create).not.toHaveBeenCalled();
  });

  it('correctly simulates updates in dry-run mode without modifying the database', async () => {
    const mockUsers = [
      { _id: 'user1', username: 'alice', totpEnabled: true, totpSecret: 'secret1', backupCodes: ['code1'] },
      { _id: 'user2', username: 'bob', totpEnabled: false, totpSecret: null, backupCodes: [] },
    ];

    const mockUserModel = {
      find: jest.fn().mockResolvedValue(mockUsers),
      updateOne: jest.fn(),
    };

    const mockAuditModel = {
      create: jest.fn(),
    };

    const stats = await disableAll2FA({
      UserModel: mockUserModel,
      LoginAuditModel: mockAuditModel,
      isDryRun: true,
      logger: { log: jest.fn(), error: jest.fn() },
    });

    expect(stats.totalScanned).toBe(2);
    expect(stats.updated).toBe(1);
    expect(stats.skippedAlreadyDisabled).toBe(1);
    expect(mockUserModel.updateOne).not.toHaveBeenCalled();
    expect(mockAuditModel.create).not.toHaveBeenCalled();
  });

  it('updates 2FA-enabled users and logs audit entries in live mutation mode', async () => {
    const mockUsers = [
      { _id: 'user1', username: 'alice', totpEnabled: true, totpSecret: 'secret1', backupCodes: ['code1'] },
      { _id: 'user2', username: 'bob', totpEnabled: false, totpSecret: 'residual_secret', backupCodes: [] },
      { _id: 'user3', username: 'charlie', totpEnabled: false, totpSecret: null, backupCodes: [] },
    ];

    const mockUserModel = {
      find: jest.fn().mockResolvedValue(mockUsers),
      updateOne: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
    };

    const mockAuditModel = {
      create: jest.fn().mockResolvedValue({}),
    };

    const stats = await disableAll2FA({
      UserModel: mockUserModel,
      LoginAuditModel: mockAuditModel,
      isDryRun: false,
      logger: { log: jest.fn(), error: jest.fn() },
    });

    expect(stats.totalScanned).toBe(3);
    expect(stats.updated).toBe(2);
    expect(stats.skippedAlreadyDisabled).toBe(1);
    expect(stats.auditEntriesCreated).toBe(2);

    expect(mockUserModel.updateOne).toHaveBeenCalledTimes(2);
    expect(mockUserModel.updateOne).toHaveBeenCalledWith(
      { _id: 'user1' },
      {
        $set: {
          totpEnabled: false,
          totpSecret: null,
          backupCodes: [],
        },
      }
    );

    expect(mockAuditModel.create).toHaveBeenCalledTimes(2);
    expect(mockAuditModel.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user1',
        action: 'emergency_2fa_reset',
        success: true,
      })
    );
  });
});
