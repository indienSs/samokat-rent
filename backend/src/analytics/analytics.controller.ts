import { Controller, Get } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { AnalyticsOverview } from './analytics.types';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analytics: AnalyticsService) {}

  @Get('overview')
  overview(): Promise<AnalyticsOverview> {
    return this.analytics.getOverview();
  }
}
