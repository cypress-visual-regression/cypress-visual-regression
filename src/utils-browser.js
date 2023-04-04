class CompareSnapshotsPluginError extends Error {
  constructor(error) {
    super(error.message);
    Object.getOwnPropertyNames(error).forEach((prop) => {
      this[prop] = error[prop];
    });
  }
}

const deserializeError = (error) => new CompareSnapshotsPluginError(JSON.parse(error));

const getValueOrDefault = (value, defaultValue) => value || defaultValue;

module.exports = { deserializeError, getValueOrDefault };
