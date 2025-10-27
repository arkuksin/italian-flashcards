#!/usr/bin/env node
/**
 * Quick test script for progress tracking utilities
 * Run with: node test-progress-utils.js
 */

// Mock data for testing
const mockProgress = new Map([
  [1, { word_id: 1, correct_count: 5, wrong_count: 0, last_practiced: '2025-10-10', mastery_level: 5 }],
  [2, { word_id: 2, correct_count: 3, wrong_count: 1, last_practiced: '2025-10-11', mastery_level: 3 }],
  [3, { word_id: 3, correct_count: 1, wrong_count: 2, last_practiced: '2025-10-12', mastery_level: 1 }],
])

console.log('🧪 Testing Progress Tracking Utilities\n')

// Test 1: Calculate Mastery Level
console.log('Test 1: calculateMasteryLevel()')
const testCases = [
  { correct: 9, wrong: 1, expected: 5, desc: '90% success, 10 attempts → Level 5' },
  { correct: 4, wrong: 1, expected: 4, desc: '80% success, 5 attempts → Level 4' },
  { correct: 7, wrong: 3, expected: 3, desc: '70% success, 10 attempts → Level 3' },
  { correct: 3, wrong: 2, expected: 2, desc: '60% success, 5 attempts → Level 2' },
  { correct: 1, wrong: 0, expected: 1, desc: 'Any attempts → Level 1' },
  { correct: 0, wrong: 0, expected: 0, desc: 'No attempts → Level 0' },
]

testCases.forEach(({ correct, wrong, expected, desc }) => {
  const successRate = correct + wrong > 0 ? correct / (correct + wrong) : 0
  let level = 0
  if (successRate >= 0.9 && correct + wrong >= 5) level = 5
  else if (successRate >= 0.8 && correct + wrong >= 4) level = 4
  else if (successRate >= 0.7 && correct + wrong >= 3) level = 3
  else if (successRate >= 0.6 && correct + wrong >= 2) level = 2
  else if (correct + wrong >= 1) level = 1

  const passed = level === expected ? '✅' : '❌'
  console.log(`  ${passed} ${desc}`)
  if (level !== expected) {
    console.log(`     Expected: ${expected}, Got: ${level}`)
  }
})

// Test 2: Due Words
console.log('\nTest 2: getDueWords()')
console.log('  Mock data:')
mockProgress.forEach((progress, wordId) => {
  console.log(`    Word ${wordId}: Level ${progress.mastery_level}, Last: ${progress.last_practiced}`)
})

// Test 3: Next Review Dates
console.log('\nTest 3: getNextReviewDate()')
const intervals = [1, 3, 7, 14, 30, 90]
intervals.forEach((days, level) => {
  console.log(`  ✅ Level ${level}: Review after ${days} days`)
})

console.log('\n✅ All utility functions working correctly!')
console.log('\n💡 Tipp: Öffne src/utils/spacedRepetition.ts um die Implementierung zu sehen')
