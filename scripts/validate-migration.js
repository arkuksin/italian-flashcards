import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env.local') })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function validateMigration() {
  console.log('🔍 Validating word migration...\n')

  try {
    // Check total count
    const { data, error, count } = await supabase
      .from('words')
      .select('*', { count: 'exact' })

    if (error) {
      console.error('❌ Error querying words table:', error.message)
      return false
    }

    console.log(`📊 Total words in database: ${count}`)

    if (count === 300) {
      console.log('✅ Word count matches expected (300)')
    } else {
      console.log(`⚠️  Word count mismatch. Expected 300, got ${count}`)
    }

    // Check categories
    const { data: allWords, error: allWordsError } = await supabase
      .from('words')
      .select('category')

    if (allWordsError) {
      console.error('❌ Error querying all words:', allWordsError.message)
      return false
    }

    // Count categories manually
    const categoryCount = {}
    allWords.forEach(word => {
      categoryCount[word.category] = (categoryCount[word.category] || 0) + 1
    })

    const categories = Object.entries(categoryCount).map(([category, count]) => ({
      category,
      count
    })).sort((a, b) => a.category.localeCompare(b.category))


    console.log(`\n📋 Categories found: ${categories.length}`)
    categories.forEach(cat => {
      console.log(`   ${cat.category}: ${cat.count} words`)
    })

    // Sample a few words to verify content
    console.log('\n🔍 Sample word verification:')
    const { data: sampleWords, error: sampleError } = await supabase
      .from('words')
      .select('*')
      .limit(5)

    if (sampleError) {
      console.error('❌ Error fetching sample words:', sampleError.message)
      return false
    }

    sampleWords.forEach(word => {
      console.log(`   ID ${word.id}: "${word.russian}" → "${word.italian}" (${word.category})`)
    })

    // Check for required fields
    const { data: incompleteWords, error: incompleteError } = await supabase
      .from('words')
      .select('id')
      .or('russian.is.null,italian.is.null,category.is.null')

    if (incompleteError) {
      console.error('❌ Error checking incomplete words:', incompleteError.message)
      return false
    }

    if (incompleteWords.length === 0) {
      console.log('\n✅ All words have complete data')
    } else {
      console.log(`\n⚠️  Found ${incompleteWords.length} words with missing data`)
    }

    console.log('\n🎉 Migration validation completed!')
    console.log('\nNext steps:')
    console.log('1. Update frontend to load words from database')
    console.log('2. Create word loading functions')
    console.log('3. Test the application with database-driven data')

    return true

  } catch (err) {
    console.error('❌ Validation error:', err.message)
    return false
  }
}

validateMigration().catch(console.error)