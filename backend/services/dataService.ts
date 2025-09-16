import { Prediction, IPrediction } from '@/models/Prediction';
import mongoose from 'mongoose';

export interface ImportData {
  numbers: number[];
  gameType: 'pick3' | 'pick4' | 'powerball' | 'megamillions' | 'lotto';
  strategy?: string;
  drawDate?: Date;
  actualNumbers?: number[];
  isWinner?: boolean;
  winnings?: number;
  confidence?: number;
}

export interface ExportOptions {
  format: 'json' | 'csv' | 'xlsx';
  gameType?: string;
  startDate?: Date;
  endDate?: Date;
}

export interface DataStats {
  totalPredictions: number;
  totalImported: number;
  totalExported: number;
  lastImport?: Date;
  lastExport?: Date;
  storageUsed: string;
}

export class DataService {
  // Check if database is available
  private async isDatabaseAvailable(): Promise<boolean> {
    try {
      await Prediction.findOne({});
      return true;
    } catch (error) {
      return false;
    }
  }

  // Import prediction data
  async importData(userId: string, data: ImportData[], format: string, gameType?: string): Promise<{
    imported: number;
    failed: number;
    errors: string[];
  }> {
    try {
      if (!(await this.isDatabaseAvailable())) {
        throw new Error('Database not available');
      }

      const results = {
        imported: 0,
        failed: 0,
        errors: [] as string[]
      };

      for (let i = 0; i < data.length; i++) {
        try {
          const item = data[i];

          // Validate data
          if (!item.numbers || !Array.isArray(item.numbers)) {
            results.errors.push(`Item ${i}: Missing or invalid numbers array`);
            results.failed++;
            continue;
          }

          if (item.numbers.length < 3 || item.numbers.length > 6) {
            results.errors.push(`Item ${i}: Numbers array must contain 3-6 elements`);
            results.failed++;
            continue;
          }

          if (!item.gameType && !gameType) {
            results.errors.push(`Item ${i}: Missing gameType`);
            results.failed++;
            continue;
          }

          const predictionData = {
            userId: new mongoose.Types.ObjectId(userId),
            numbers: item.numbers,
            gameType: item.gameType || gameType!,
            strategy: item.strategy || 'imported',
            confidence: item.confidence || 0.5,
            isActive: true,
            drawDate: item.drawDate,
            actualNumbers: item.actualNumbers,
            isWinner: item.isWinner,
            winnings: item.winnings
          };

          const prediction = new Prediction(predictionData);
          await prediction.save();
          results.imported++;

        } catch (error) {
          results.errors.push(`Item ${i}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          results.failed++;
        }
      }

      return results;

    } catch (error) {
      console.error('Error importing data:', error);
      throw new Error('Failed to import data');
    }
  }

  // Export prediction data
  async exportData(userId: string, options: ExportOptions): Promise<any[]> {
    try {
      if (!(await this.isDatabaseAvailable())) {
        return [];
      }

      let query: any = {
        userId: new mongoose.Types.ObjectId(userId)
      };

      if (options.gameType) {
        query.gameType = options.gameType;
      }

      if (options.startDate || options.endDate) {
        query.createdAt = {};
        if (options.startDate) {
          query.createdAt.$gte = options.startDate;
        }
        if (options.endDate) {
          query.createdAt.$lte = options.endDate;
        }
      }

      const predictions = await Prediction.find(query)
        .sort({ createdAt: -1 })
        .lean();

      const exportData = predictions.map(prediction => ({
        id: prediction._id.toString(),
        numbers: prediction.numbers,
        gameType: prediction.gameType,
        strategy: prediction.strategy,
        confidence: prediction.confidence,
        isActive: prediction.isActive,
        drawDate: prediction.drawDate,
        actualNumbers: prediction.actualNumbers,
        isWinner: prediction.isWinner,
        winnings: prediction.winnings,
        createdAt: prediction.createdAt,
        updatedAt: prediction.updatedAt
      }));

      return exportData;

    } catch (error) {
      console.error('Error exporting data:', error);
      throw new Error('Failed to export data');
    }
  }

  // Validate data format
  validateData(data: any[]): {
    isValid: boolean;
    validation: {
      total: number;
      valid: number;
      invalid: number;
      errors: string[];
    };
  } {
    const validationResults = {
      total: data.length,
      valid: 0,
      invalid: 0,
      errors: [] as string[]
    };

    data.forEach((item, index) => {
      if (!item.numbers || !Array.isArray(item.numbers)) {
        validationResults.errors.push(`Item ${index}: Missing or invalid numbers array`);
        validationResults.invalid++;
      } else if (item.numbers.length < 3 || item.numbers.length > 6) {
        validationResults.errors.push(`Item ${index}: Numbers array must contain 3-6 elements`);
        validationResults.invalid++;
      } else if (!item.gameType || !['pick3', 'pick4', 'powerball', 'megamillions', 'lotto'].includes(item.gameType)) {
        validationResults.errors.push(`Item ${index}: Invalid or missing gameType`);
        validationResults.invalid++;
      } else {
        validationResults.valid++;
      }
    });

    return {
      isValid: validationResults.invalid === 0,
      validation: validationResults
    };
  }

  // Get data statistics
  async getDataStats(userId: string): Promise<DataStats> {
    try {
      if (!(await this.isDatabaseAvailable())) {
        return {
          totalPredictions: 0,
          totalImported: 0,
          totalExported: 0,
          storageUsed: '0 MB'
        };
      }

      const totalPredictions = await Prediction.countDocuments({
        userId: new mongoose.Types.ObjectId(userId)
      });

      // For now, we'll use mock values for imported/exported counts
      // In a real implementation, you might track these in a separate collection
      const totalImported = Math.floor(totalPredictions * 0.3); // Mock: 30% imported
      const totalExported = Math.floor(totalPredictions * 0.15); // Mock: 15% exported

      // Get last import/export dates (mock for now)
      const lastImport = totalImported > 0 ? new Date() : undefined;
      const lastExport = totalExported > 0 ? new Date() : undefined;

      // Calculate storage used (rough estimate)
      const storageUsed = `${(totalPredictions * 0.5).toFixed(1)} MB`;

      return {
        totalPredictions,
        totalImported,
        totalExported,
        lastImport,
        lastExport,
        storageUsed
      };

    } catch (error) {
      console.error('Error getting data stats:', error);
      throw new Error('Failed to retrieve data statistics');
    }
  }
}