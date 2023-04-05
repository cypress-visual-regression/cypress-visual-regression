interface ErrorProperties {
  [key: string]: any;
}

class CompareSnapshotsPluginError extends Error {
  [prop: string]: any;

  constructor(error: Error) {
    super(error.message);

    Object.getOwnPropertyNames(error).forEach((prop) => {
      this[prop] = (error as ErrorProperties)[prop];
    });
  }
}

const deserializeError = (error: string): CompareSnapshotsPluginError => {
  return new CompareSnapshotsPluginError(JSON.parse(error));
};

const getValueOrDefault = <T>(value: T | undefined, defaultValue: T): T => {
  return value !== undefined ? value : defaultValue;
};

export { CompareSnapshotsPluginError, deserializeError, getValueOrDefault };
