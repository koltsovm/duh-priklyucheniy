/** Ошибка с HTTP-статусом, пробрасывается до errorHandler. */
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/** Оборачивает async-роуты, чтобы не дублировать try/catch. */
export const asyncHandler =
  (fn: (req: any, res: any, next: any) => Promise<unknown>) =>
  (req: any, res: any, next: any) => {
    fn(req, res, next).catch(next);
  };