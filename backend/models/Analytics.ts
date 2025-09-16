import mongoose, { Document, Schema } from 'mongoose';

export interface IAnalytics extends Document {
  _id: mongoose.Types.ObjectId;
  type: 'performance' | 'trends' | 'patterns' | 'accuracy' | 'correlations' | 'risk';
  data: any; // Flexible data structure for different analytics types
  metadata: {
    dateRange?: {
      start: Date;
      end: Date;
    };
    gameType?: string;
    userId?: mongoose.Types.ObjectId;
    sampleSize?: number;
    confidence?: number;
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const AnalyticsSchema = new Schema<IAnalytics>({
  type: {
    type: String,
    required: true,
    enum: ['performance', 'trends', 'patterns', 'accuracy', 'correlations', 'risk'],
    index: true
  },
  data: {
    type: Schema.Types.Mixed,
    required: true
  },
  metadata: {
    dateRange: {
      start: Date,
      end: Date
    },
    gameType: {
      type: String,
      enum: ['powerball', 'megamillions', 'lotto', 'pick3', 'pick4']
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    sampleSize: {
      type: Number,
      min: 0
    },
    confidence: {
      type: Number,
      min: 0,
      max: 1
    }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
AnalyticsSchema.index({ type: 1, createdAt: -1 });
AnalyticsSchema.index({ 'metadata.userId': 1, type: 1 });
AnalyticsSchema.index({ 'metadata.gameType': 1, type: 1 });
AnalyticsSchema.index({ 'metadata.dateRange.start': 1, 'metadata.dateRange.end': 1 });

// TTL index for automatic cleanup of old analytics (90 days)
AnalyticsSchema.index({ createdAt: 1 }, {
  expireAfterSeconds: 90 * 24 * 60 * 60,
  partialFilterExpression: { isActive: false }
});

// Static method to get latest analytics by type
AnalyticsSchema.statics.getLatestByType = function(type: string, userId?: string) {
  const query: any = { type, isActive: true };
  if (userId) {
    query['metadata.userId'] = userId;
  }
  return this.findOne(query).sort({ createdAt: -1 });
};

// Static method to get analytics within date range
AnalyticsSchema.statics.getByDateRange = function(type: string, startDate: Date, endDate: Date, userId?: string) {
  const query: any = {
    type,
    isActive: true,
    'metadata.dateRange.start': { $gte: startDate },
    'metadata.dateRange.end': { $lte: endDate }
  };
  if (userId) {
    query['metadata.userId'] = userId;
  }
  return this.find(query).sort({ createdAt: -1 });
};

export const Analytics = mongoose.model<IAnalytics>('Analytics', AnalyticsSchema);
export default Analytics;