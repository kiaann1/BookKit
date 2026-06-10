/**
 * PDF.js v5.6+ expects newer JS APIs. Polyfill before importing pdfjs-dist.
 * @see https://github.com/mozilla/pdf.js/wiki/Frequently-Asked-Questions#faq-support
 */
export function ensurePdfJsPolyfills() {
  if (typeof Promise.withResolvers === "undefined") {
    Promise.withResolvers = function withResolvers<T>() {
      let resolve!: (value: T | PromiseLike<T>) => void;
      let reject!: (reason?: unknown) => void;
      const promise = new Promise<T>((res, rej) => {
        resolve = res;
        reject = rej;
      });
      return { promise, resolve, reject };
    };
  }

  if (typeof Map.prototype.getOrInsertComputed === "undefined") {
    Object.defineProperty(Map.prototype, "getOrInsertComputed", {
      value<T>(
        this: Map<unknown, T>,
        key: unknown,
        callbackFn: (key: unknown) => T,
      ): T {
        if (this.has(key)) {
          return this.get(key)!;
        }
        const value = callbackFn(key);
        this.set(key, value);
        return value;
      },
      writable: true,
      configurable: true,
    });
  }

  if (typeof WeakMap.prototype.getOrInsertComputed === "undefined") {
    Object.defineProperty(WeakMap.prototype, "getOrInsertComputed", {
      value<T>(
        this: WeakMap<object, T>,
        key: object,
        callbackFn: (key: object) => T,
      ): T {
        if (this.has(key)) {
          return this.get(key)!;
        }
        const value = callbackFn(key);
        this.set(key, value);
        return value;
      },
      writable: true,
      configurable: true,
    });
  }

  if (typeof Uint8Array.prototype.toHex === "undefined") {
    Object.defineProperty(Uint8Array.prototype, "toHex", {
      value() {
        let hex = "";
        for (let i = 0; i < this.length; i++) {
          hex += this[i]!.toString(16).padStart(2, "0");
        }
        return hex;
      },
      writable: true,
      configurable: true,
    });
  }
}

ensurePdfJsPolyfills();
