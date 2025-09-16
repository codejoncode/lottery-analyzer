import React, { useRef, useEffect, useMemo, useCallback } from 'react';

interface CorrelationData {
  numbers: string[];
  correlations: number[][];
}

interface CorrelationHeatmapProps {
  data: CorrelationData;
  title?: string;
  height?: number;
  colorScheme?: 'blue' | 'red' | 'green';
}

export const CorrelationHeatmap: React.FC<CorrelationHeatmapProps> = React.memo(({
  data,
  title = 'Number Correlation Heatmap',
  height = 400,
  colorScheme = 'blue'
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Memoized color map to prevent recreation
  const colorMap = useMemo(() => ({
    blue: {
      min: [239, 246, 255], // #eff6ff
      mid: [59, 130, 246],  // #3b82f6
      max: [30, 64, 175]    // #1e40af
    },
    red: {
      min: [254, 242, 242], // #fef2f2
      mid: [239, 68, 68],   // #ef4444
      max: [220, 38, 38]    // #dc2626
    },
    green: {
      min: [240, 253, 244], // #f0fdf4
      mid: [34, 197, 94],   // #22c55e
      max: [22, 163, 74]    // #16a34a
    }
  }), []);

  const colors = useMemo(() => colorMap[colorScheme], [colorMap, colorScheme]);

  // Memoized getColor function
  const getColor = useCallback((value: number): string => {
    if (value === null || value === undefined) return '#f3f4f6';

    const normalizedValue = Math.abs(value);
    let r: number, g: number, b: number;

    if (normalizedValue < 0.3) {
      [r, g, b] = colors.min;
    } else if (normalizedValue < 0.7) {
      [r, g, b] = colors.mid;
    } else {
      [r, g, b] = colors.max;
    }

    return `rgb(${r}, ${g}, ${b})`;
  }, [colors]);

  // Memoized canvas dimensions
  const canvasDimensions = useMemo(() => {
    const cellSize = Math.min(40, Math.floor(600 / data.numbers.length));
    const totalSize = cellSize * data.numbers.length;
    return {
      width: Math.min(600, totalSize),
      height: Math.min(height, totalSize),
      cellSize,
      startX: (Math.min(600, totalSize) - totalSize) / 2,
      startY: (Math.min(height, totalSize) - totalSize) / 2
    };
  }, [data.numbers.length, height]);

  // Optimized canvas drawing function
  const drawHeatmap = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { cellSize, startX, startY } = canvasDimensions;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Batch drawing operations for better performance
    ctx.save();

    // Draw heatmap cells in batches
    const batchSize = 10;
    let batchIndex = 0;

    const drawBatch = () => {
      const startRow = batchIndex * batchSize;
      const endRow = Math.min(startRow + batchSize, data.correlations.length);

      for (let rowIndex = startRow; rowIndex < endRow; rowIndex++) {
        const row = data.correlations[rowIndex];
        for (let colIndex = 0; colIndex < row.length; colIndex++) {
          const correlation = row[colIndex];
          const x = startX + (colIndex * cellSize);
          const y = startY + (rowIndex * cellSize);

          // Fill cell with correlation color
          ctx.fillStyle = getColor(correlation);
          ctx.fillRect(x, y, cellSize, cellSize);

          // Draw border
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1;
          ctx.strokeRect(x, y, cellSize, cellSize);

          // Draw correlation value (only if cell is large enough)
          if (cellSize >= 20) {
            ctx.fillStyle = Math.abs(correlation) > 0.5 ? '#ffffff' : '#000000';
            ctx.font = `${Math.max(8, cellSize / 4)}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(
              correlation.toFixed(2),
              x + cellSize / 2,
              y + cellSize / 2
            );
          }
        }
      }

      batchIndex++;
      if (batchIndex * batchSize < data.correlations.length) {
        requestAnimationFrame(drawBatch);
      } else {
        // Draw axis labels after all cells are drawn
        drawLabels(ctx, startX, startY, cellSize);
      }
    };

    const drawLabels = (ctx: CanvasRenderingContext2D, startX: number, startY: number, cellSize: number) => {
      ctx.fillStyle = '#9ca3af';
      ctx.font = '12px Arial';

      // X-axis labels (bottom)
      ctx.textAlign = 'center';
      data.numbers.forEach((label, index) => {
        const x = startX + (index * cellSize) + cellSize / 2;
        const y = startY + (data.numbers.length * cellSize) + 20;
        ctx.fillText(label, x, y);
      });

      // Y-axis labels (left)
      ctx.textAlign = 'right';
      data.numbers.forEach((label, index) => {
        const x = startX - 10;
        const y = startY + (index * cellSize) + cellSize / 2;
        ctx.fillText(label, x, y);
      });
    };

    drawBatch();
    ctx.restore();
  }, [data, colors, canvasDimensions, getColor]);

  useEffect(() => {
    drawHeatmap();
  }, [drawHeatmap]);

  return (
    <div className="correlation-heatmap" style={{ padding: '20px' }}>
      <h3 style={{ color: '#ffffff', textAlign: 'center', marginBottom: '20px' }}>
        {title}
      </h3>
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <canvas
          ref={canvasRef}
          width={canvasDimensions.width}
          height={canvasDimensions.height}
          style={{
            border: '1px solid #374151',
            borderRadius: '8px',
            backgroundColor: '#1f2937'
          }}
        />
      </div>
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        marginTop: '20px',
        gap: '20px',
        fontSize: '12px',
        color: '#9ca3af'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <div style={{ width: '20px', height: '20px', backgroundColor: `rgb(${colors.min.join(',')})`, border: '1px solid #ffffff' }}></div>
          <span>Low Correlation</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <div style={{ width: '20px', height: '20px', backgroundColor: `rgb(${colors.mid.join(',')})`, border: '1px solid #ffffff' }}></div>
          <span>Medium Correlation</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <div style={{ width: '20px', height: '20px', backgroundColor: `rgb(${colors.max.join(',')})`, border: '1px solid #ffffff' }}></div>
          <span>High Correlation</span>
        </div>
      </div>
    </div>
  );
});