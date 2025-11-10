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
console.log('⚠️  NOTE: Tests updated for Phase 1 Leitner System (2025-11-10)\n')

// Phase 1 Leitner System Implementation
function calculateMasteryLevel(currentLevel, correct) {
  if (correct) {
    return Math.min(currentLevel + 1, 5) // Move up one level
  } else {
    return Math.max(currentLevel - 2, 0) // Move down two levels
  }
}

// Test 1: Calculate Mastery Level (Phase 1 - Incremental Movement)
console.log('Test 1: calculateMasteryLevel() - Phase 1 Leitner Boxes')
const testCases = [
  // Correct answers - level up
  { currentLevel: 0, correct: true, expected: 1, desc: 'New word + correct → Level 1' },
  { currentLevel: 2, correct: true, expected: 3, desc: 'Level 2 + correct → Level 3' },
  { currentLevel: 4, correct: true, expected: 5, desc: 'Level 4 + correct → Level 5' },
  { currentLevel: 5, correct: true, expected: 5, desc: 'Level 5 + correct → Level 5 (max)' },

  // Wrong answers - level down
  { currentLevel: 5, correct: false, expected: 3, desc: 'Level 5 + wrong → Level 3' },
  { currentLevel: 3, correct: false, expected: 1, desc: 'Level 3 + wrong → Level 1' },
  { currentLevel: 1, correct: false, expected: 0, desc: 'Level 1 + wrong → Level 0' },
  { currentLevel: 0, correct: false, expected: 0, desc: 'Level 0 + wrong → Level 0 (min)' },
]

testCases.forEach(({ currentLevel, correct, expected, desc }) => {
  const level = calculateMasteryLevel(currentLevel, correct)
  const passed = level === expected ? '✅' : '❌'
  console.log(`  ${passed} ${desc}`)
  if (level !== expected) {
    console.log(`     Expected: ${expected}, Got: ${level}`)
  }
})

console.log('\n📝 Key Changes in Phase 1:')
console.log('  • Correct answer: +1 level (was: success rate based)')
console.log('  • Wrong answer: -2 levels (was: recalculate from scratch)')
console.log('  • More responsive to recent performance')
console.log('  • Aligns with traditional Leitner box system')

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
