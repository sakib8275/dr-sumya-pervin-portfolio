// Polyfill global environment for Node.js test execution
if (typeof globalThis.File === 'undefined') {
  globalThis.File = class File extends Blob {
    constructor(chunks, name, opts = {}) {
      super(chunks, opts);
      this.name = name;
      this.lastModified = opts.lastModified || Date.now();
    }
  };
}
