export default class ApiError extends Error {
  constructor(readonly errorCode: number, readonly errorMessage: string) {
    super(errorMessage);
  }

  get code(): number {
    return this.errorCode;
  }

  override get message(): string {
    return `ApiError [${this.errorCode}]: ${this.errorMessage}`;
  }
}
