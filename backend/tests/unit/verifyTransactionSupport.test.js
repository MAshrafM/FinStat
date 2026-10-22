const { verifyTransactionSupport } = require('../../config/verifyTransactionSupport');

describe('verifyTransactionSupport Unit Tests', () => {
  it('should pass and return hello status for a replica set cluster', async () => {
    const mockMongoose = {
      connection: {
        db: {
          admin: () => ({
            command: jest.fn().mockResolvedValue({
              setName: 'rs0',
              hosts: ['localhost:27017'],
              ok: 1,
            }),
          }),
        },
      },
    };

    const result = await verifyTransactionSupport(mockMongoose);
    expect(result).toBeDefined();
    expect(result.setName).toBe('rs0');
  });

  it('should pass and return hello status for a sharded cluster (mongos)', async () => {
    const mockMongoose = {
      connection: {
        db: {
          admin: () => ({
            command: jest.fn().mockResolvedValue({
              msg: 'isdbgrid',
              ok: 1,
            }),
          }),
        },
      },
    };

    const result = await verifyTransactionSupport(mockMongoose);
    expect(result).toBeDefined();
    expect(result.msg).toBe('isdbgrid');
  });

  it('should throw fatal error when connected to a standalone MongoDB instance', async () => {
    const mockMongoose = {
      connection: {
        db: {
          admin: () => ({
            command: jest.fn().mockResolvedValue({
              isWritablePrimary: true,
              ok: 1,
            }),
          }),
        },
      },
    };

    await expect(verifyTransactionSupport(mockMongoose)).rejects.toThrow(
      /FATAL: Multi-document ACID transactions require a replica set or sharded cluster/
    );
  });

  it('should fallback to ismaster when hello throws CommandNotFound (code 59) on pre-5.0 MongoDB', async () => {
    const commandMock = jest
      .fn()
      .mockRejectedValueOnce({ code: 59, message: 'no such command: hello' })
      .mockResolvedValueOnce({ setName: 'rs0', ok: 1 });

    const mockMongoose = {
      connection: {
        db: {
          admin: () => ({ command: commandMock }),
        },
      },
    };

    const result = await verifyTransactionSupport(mockMongoose);
    expect(result.setName).toBe('rs0');
    expect(commandMock).toHaveBeenCalledTimes(2);
    expect(commandMock).toHaveBeenNthCalledWith(1, { hello: 1 });
    expect(commandMock).toHaveBeenNthCalledWith(2, { ismaster: 1 });
  });

  it('should fail fast without fallback if hello throws a network or authentication error', async () => {
    const networkError = new Error('getaddrinfo ENOTFOUND mongodb.example.com');
    const commandMock = jest.fn().mockRejectedValue(networkError);

    const mockMongoose = {
      connection: {
        db: {
          admin: () => ({ command: commandMock }),
        },
      },
    };

    await expect(verifyTransactionSupport(mockMongoose)).rejects.toThrow(networkError);
    expect(commandMock).toHaveBeenCalledTimes(1);
    expect(commandMock).toHaveBeenCalledWith({ hello: 1 });
  });

  it('should preserve diagnostic cause when both hello and ismaster fail', async () => {
    const helloError = { code: 59, message: 'no such command: hello' };
    const isMasterError = new Error('Socket timeout during ismaster');

    const commandMock = jest
      .fn()
      .mockRejectedValueOnce(helloError)
      .mockRejectedValueOnce(isMasterError);

    const mockMongoose = {
      connection: {
        db: {
          admin: () => ({ command: commandMock }),
        },
      },
    };

    try {
      await verifyTransactionSupport(mockMongoose);
      fail('Expected verifyTransactionSupport to throw');
    } catch (err) {
      expect(err.message).toContain('FATAL: Failed to verify transaction support');
      expect(err.cause).toBeDefined();
      expect(err.cause.helloError).toEqual(helloError);
      expect(err.cause.ismasterError).toEqual(isMasterError);
    }
  });
});
