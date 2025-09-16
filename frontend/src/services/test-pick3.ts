// Test file to verify Pick3DataManager works in browser
import { pick3DataManager, type Pick3Draw } from './Pick3DataManager';

// Test basic functionality
console.log('Testing Pick3DataManager...');

// Add some test data
const testDraws: Pick3Draw[] = [
  {
    date: '2025-01-01',
    midday: '123',
    evening: '456',
    timestamp: Date.now()
  },
  {
    date: '2025-01-02',
    midday: '789',
    evening: '012',
    timestamp: Date.now() + 86400000
  }
];

pick3DataManager.addDraws(testDraws);

// Test retrieval
const allDraws = pick3DataManager.getDraws();
console.log('All draws:', allDraws);

const stats = pick3DataManager.getDataStats();
console.log('Data stats:', stats);

// Test localStorage persistence
console.log('Data saved to localStorage:', localStorage.getItem('pick3-data') !== null);

console.log('Pick3DataManager test completed successfully!');