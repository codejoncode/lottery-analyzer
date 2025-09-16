import mongoose, { Document, Schema } from 'mongoose';

export interface IPrediction extends Document {
  _id: mongoose.Types.ObjectId;
  userId?: mongoose.Types.ObjectId;
  numbers: number[];
  gameType: string;
  strategy?: string;
  confidence?: number;
  isActive: boolean;
  drawDate?: Date;
  actualNumbers?: number[];
  isWinner?: boolean;
  winnings?: number;
  metadata?: {
    boxes?: number[][];
    columnTop3?: {
      hundreds?: number[];
      tens?: number[];
      units?: number[];
    };
    overallTop5?: number[];
    reasoning?: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

const PredictionSchema = new Schema<IPrediction>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: false // Allow anonymous predictions
  },
  numbers: {
    type: [Number],
    required: true,
    validate: {
      validator: function(numbers: number[]) {
        return numbers.length >= 3 && numbers.length <= 6;
      },
      message: 'Numbers array must contain between 3 and 6 numbers'
    }
  },
  gameType: {
    type: String,
    required: true,
    enum: ['powerball', 'megamillions', 'lotto', 'pick3', 'pick4'],
    default: 'powerball'
  },
  strategy: {
    type: String,
    enum: ['hot_numbers', 'cold_numbers', 'frequency', 'pattern', 'random', 'ai_prediction'],
    default: 'random'
  },
  confidence: {
    type: Number,
    min: 0,
    max: 1,
    default: 0.5
  },
  isActive: {
    type: Boolean,
    default: true
  },
  drawDate: {
    type: Date
  },
  actualNumbers: {
    type: [Number]
  },
  isWinner: {
    type: Boolean,
    default: false
  },
  winnings: {
    type: Number,
    default: 0,
    min: 0
  },
  metadata: {
    type: {
      boxes: [[Number]],
      columnTop3: {
        hundreds: [Number],
        tens: [Number],
        units: [Number]
      },
      overallTop5: [Number],
      reasoning: [String]
    },
    required: false
  }
}, {
  timestamps: true
});

// Index for efficient queries
PredictionSchema.index({ userId: 1, createdAt: -1 });
PredictionSchema.index({ gameType: 1, createdAt: -1 });
PredictionSchema.index({ isWinner: 1 });
PredictionSchema.index({ drawDate: 1 });

// Virtual for prediction age
PredictionSchema.virtual('age').get(function() {
  return Date.now() - this.createdAt.getTime();
});

// Method to check if prediction matches actual numbers
PredictionSchema.methods.checkWinner = function(actualNumbers: number[]): boolean {
  if (!actualNumbers || actualNumbers.length === 0) return false;

  // For simplicity, check if all predicted numbers are in actual numbers
  // In real lottery, this would be more complex based on game rules
  return this.numbers.every((num: number) => actualNumbers.includes(num));
};

export const Prediction = mongoose.model<IPrediction>('Prediction', PredictionSchema);
export default Prediction;