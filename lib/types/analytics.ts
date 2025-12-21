/**
 * Layout Validation Types
 * JSON Schema + WCAG Accessibility Validation
 */

export interface LayoutCoordinate {
  x: number; // 0-1920
  y: number; // 0-1440
}

export interface LayoutBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface LayoutAnchor {
  id: string;
  name: string;
  position: LayoutCoordinate;
  bounds: LayoutBounds;
  interactive: boolean;
  tabOrder?: number;
  ariaLabel?: string;
  ariaRole?: string;
  minTapTarget?: number; // 48x48px WCAG AAA
}

export interface Layout {
  id: string;
  version: number;
  anchors: LayoutAnchor[];
  bounds: LayoutBounds;
  metadata?: {
    createdBy: string;
    createdAt: number;
    updatedAt: number;
    name?: string;
    description?: string;
  };
}

export interface AccessibilityIssue {
  field: string;
  rule: string; // "tap_target_size", "contrast_ratio", "tab_order", etc.
  severity: "error" | "warning" | "info";
  message: string;
  recommendation?: string;
}

export interface LayoutValidationReport {
  layoutValid: boolean;
  version: number;
  issues: AccessibilityIssue[];
  warnings: AccessibilityIssue[];
  score: number; // 0-100 accessibility score
  validation: {
    structureValid: boolean;
    typeCheckValid: boolean;
    sizeConstraintsValid: boolean;
    accessibilityCompliant: boolean;
  };
  wcagCompliance: {
    wcagAA: boolean;
    wcagAAA: boolean;
  };
  checklist: {
    minTapTargets: boolean;
    colorContrast: boolean;
    tabOrder: boolean;
    keyboardNavigation: boolean;
    noOverlap: boolean;
  };
  cacheExpires?: number;
}

export interface LayoutValidationRequest {
  layout: Layout;
  strictMode?: boolean; // enforce AAA vs AA
}

export interface LayoutValidationResponse {
  ok: boolean;
  layoutValid?: boolean;
  report?: LayoutValidationReport;
  error?: string;
  cached?: boolean;
}

/**
 * Analytics & Metrics Types
 * Business Intelligence Dashboard
 */

export enum MetricType {
  GAUGE = "gauge", // current value
  COUNTER = "counter", // cumulative
  HISTOGRAM = "histogram", // distribution
  TREND = "trend", // time-series
}

export interface UserEngagementMetrics {
  dau: number; // Daily Active Users
  mau: number; // Monthly Active Users
  retention: {
    day1: number; // % returning after 1 day
    day7: number; // % returning after 7 days
    day30: number; // % returning after 30 days
  };
  sessionDuration: {
    avg: number; // seconds
    median: number;
    p95: number;
  };
  sessionFrequency: number; // avg sessions per user
}

export interface ContentMetrics {
  itemsCreatedToday: number;
  itemsCreatedThisWeek: number;
  itemsCreatedThisMonth: number;
  itemsApprovedToday: number;
  approvalRate: number; // % of submitted items approved
  avgTimeToApproval: number; // hours
  rejectionRate: number; // % of submitted items rejected
}

export interface FinancialMetrics {
  primeCoinsDisbursedToday: number;
  primeCoinsDisbursedThisMonth: number;
  creatorEarningsToday: number;
  creatorEarningsThisMonth: number;
  tierDistribution: {
    [tier: string]: number; // count
  };
  arpu: number; // Average Revenue Per User
  ltv: number; // Lifetime Value
}

export interface CreatorMetrics {
  activeCreatorsTotal: number;
  activeCreatorsByTier: {
    [tier: string]: number;
  };
  contentVelocity: number; // items per creator per week
  earningsPerCreator: {
    mean: number;
    median: number;
    p95: number;
  };
  collaborationRate: number; // % of creators in active collabs
}

export interface MetricsDashboard {
  timeRange: {
    start: number;
    end: number;
  };
  generatedAt: number;
  userEngagement: UserEngagementMetrics;
  content: ContentMetrics;
  financial: FinancialMetrics;
  creators: CreatorMetrics;
  trends?: {
    [metricName: string]: {
      data: number[];
      timestamps: number[];
      trend: "up" | "down" | "flat";
      changePercent: number;
    };
  };
}

export interface TimeSeriesDataPoint {
  timestamp: number;
  value: number;
  metric: string;
  dimensions?: {
    [key: string]: string;
  };
}

export interface AnalyticsQuery {
  metric: string;
  timeRange: {
    start: number;
    end: number;
  };
  granularity: "hourly" | "daily" | "weekly" | "monthly"; // affects aggregation
  filters?: {
    [key: string]: string | string[];
  };
  limit?: number;
}

export interface AnalyticsResponse {
  ok: boolean;
  metric?: string;
  data?: TimeSeriesDataPoint[];
  dashboard?: MetricsDashboard;
  error?: string;
  cacheInfo?: {
    cached: boolean;
    cacheExpires: number;
  };
}

export interface AnalyticsExportRequest {
  format: "csv" | "json";
  timeRange: {
    start: number;
    end: number;
  };
  metrics: string[];
  filters?: {
    [key: string]: string;
  };
}

export interface AnalyticsAggregation {
  date: string; // YYYY-MM-DD
  dau: number;
  sessions: number;
  avgSessionDuration: number;
  itemsCreated: number;
  itemsApproved: number;
  primeCoinsBilled: number;
  creatorEarnings: number;
}
