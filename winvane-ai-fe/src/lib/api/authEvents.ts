type TAuthEventListener = () => void;

class AuthEventEmitter {
  private listeners: Set<TAuthEventListener> = new Set();
  private loggingOut = false;
  private resetTimer: ReturnType<typeof setTimeout> | null = null;

  subscribe(listener: TAuthEventListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  setLoggingOut(value: boolean): void {
    this.loggingOut = value;
    if (this.resetTimer) {
      clearTimeout(this.resetTimer);
      this.resetTimer = null;
    }
    if (value) {
      this.resetTimer = setTimeout(() => {
        this.loggingOut = false;
        this.resetTimer = null;
      }, 5000);
    }
  }

  getIsLoggingOut(): boolean {
    return this.loggingOut;
  }

  emitUnauthorized(): void {
    if (this.loggingOut) {
      return;
    }
    for (const listener of this.listeners) {
      listener();
    }
  }
}

export const authEvents = new AuthEventEmitter();
