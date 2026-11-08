/** A rule the user can act on. `field` attaches the message to a form input. */
export class DomainError extends Error {
  constructor(
    message: string,
    readonly field?: string,
  ) {
    super(message);
  }
}

export class ValidationError extends Error {
  constructor(readonly fieldErrors: Record<string, string>) {
    super("Validation failed");
  }
}
