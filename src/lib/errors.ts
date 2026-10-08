import { ZodError } from "zod";

const STATUS: Record<string, number> = {
  BAD_INPUT: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  NOT_PAYABLE: 409,
  OUT_OF_STOCK: 409,
  RACE_LOST: 409,
  DUPLICATE_CODE: 409,
  DUPLICATE_PAYMENT: 409,
  CONFLICT: 409,
  LIVE_MODE: 409,
  NOT_PAID: 409,
  NOT_DELIVERED: 409,
  NO_CODES: 409,
  EMAIL_FAILED: 502,
  TOO_MANY_PENDING: 429,
  RATE_LIMITED: 429,
};

export class DeskError extends Error {
  constructor(
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = "DeskError";
  }
}

export function toErrorResponse(error: unknown) {
  if (error instanceof ZodError) {
    return Response.json(
      {
        error: {
          code: "BAD_INPUT",
          message: error.issues[0]?.message ?? "Check the form",
        },
      },
      { status: 400 },
    );
  }

  if (error instanceof DeskError) {
    return Response.json(
      { error: { code: error.code, message: error.message } },
      { status: STATUS[error.code] ?? 400 },
    );
  }

  if (error instanceof Error && error.message.length < 180 && !/DEMO-|cipher|BEGIN/.test(error.message)) {
    console.error(error.name, error.message);
  } else {
    console.error("vaulta_request_failed");
  }

  return Response.json(
    { error: { code: "INTERNAL", message: "Something went wrong" } },
    { status: 500 },
  );
}
