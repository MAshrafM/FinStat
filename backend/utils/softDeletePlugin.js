// backend/utils/softDeletePlugin.js

/**
 * Mongoose plugin to enable soft deletes across models.
 * Adds deletedAt field, softDelete() and restore() instance methods.
 * @param {import('mongoose').Schema} schema
 */
const softDeletePlugin = (schema) => {
  if (!schema.path('deletedAt')) {
    schema.add({
      deletedAt: {
        type: Date,
        default: null,
        index: true,
      },
    });
  }

  // Instance method to soft delete
  schema.methods.softDelete = async function (session = null) {
    this.deletedAt = new Date();
    return await this.save(session ? { session } : undefined);
  };

  // Instance method to restore
  schema.methods.restore = async function (session = null) {
    this.deletedAt = null;
    return await this.save(session ? { session } : undefined);
  };

  // Query helper for active (not soft-deleted) documents
  schema.query.notDeleted = function () {
    return this.where({ deletedAt: null });
  };

  // Query helper for only soft-deleted documents
  schema.query.onlyDeleted = function () {
    return this.where({ deletedAt: { $ne: null } });
  };
};

module.exports = softDeletePlugin;
