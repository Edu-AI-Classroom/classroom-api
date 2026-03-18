import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { SubscriptionPlanService } from '../../modules/subscription-plan/subscription-plan.service';

/**
 * Guard kiểm tra user đã đăng ký gói subscription còn hạn hay chưa
 * Nếu chưa đăng ký hoặc đã hết hạn sẽ throw ForbiddenException
 *
 * Cách sử dụng:
 * @UseGuards(SubscriptionGuard)
 * async someEndpoint() { ... }
 */
@Injectable()
export class SubscriptionGuard implements CanActivate {
  constructor(
    @Inject(SubscriptionPlanService)
    private subscriptionPlanService: SubscriptionPlanService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId =
      request.user?.userId || request.user?.user_id || request.user?.id;

    if (!userId) {
      throw new ForbiddenException('User not authenticated');
    }

    const subscription =
      await this.subscriptionPlanService.getUserSubscription(userId);

    // Chưa đăng ký
    if (!subscription.hasSubscription) {
      throw new ForbiddenException('Please subscribe to use AI');
    }

    // Đã hết hạn
    if (subscription.isExpired) {
      throw new ForbiddenException(
        'Your subscription has expired, please subscribe again',
      );
    }

    return true;
  }
}
