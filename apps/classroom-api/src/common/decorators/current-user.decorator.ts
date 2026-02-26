import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    // Get user from request - adjust based on your auth implementation
    // This assumes the user is attached to the request object by your auth middleware
    return request.user || null;
  },
);
