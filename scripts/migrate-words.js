import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import fs from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env') }) // Load service role key
dotenv.config({ path: join(__dirname, '..', '.env.local') }) // Load anon key

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase service credentials')
  console.error('Please ensure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env')
  process.exit(1)
}

// Use service role for data migration to bypass RLS
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

function loadWords() {
  try {
    const wordsPath = join(__dirname, '..', 'src', 'data', 'words.ts')
    const wordsContent = fs.readFileSync(wordsPath, 'utf-8')

    // Extract the WORDS array from TypeScript file
    const wordsMatch = wordsContent.match(/export const WORDS: Word\[\] = \[([\s\S]*?)\];/)
    if (!wordsMatch) {
      throw new Error('Could not find WORDS array in words.ts')
    }

    // Parse the words data
    const wordsArrayText = wordsMatch[1]
    const words = []

    // Extract each word object
    const wordMatches = wordsArrayText.match(/\{\s*id:\s*(\d+),\s*russian:\s*'([^']+)',\s*italian:\s*'([^']+)',\s*category:\s*'([^']+)'\s*\}/g)

    if (wordMatches) {
      wordMatches.forEach(match => {
        const wordMatch = match.match(/id:\s*(\d+),\s*russian:\s*'([^']+)',\s*italian:\s*'([^']+)',\s*category:\s*'([^']+)'/)
        if (wordMatch) {
          words.push({
            id: parseInt(wordMatch[1]),
            russian: wordMatch[2],
            italian: wordMatch[3],
            category: wordMatch[4]
          })
        }
      })
    }

    return words
  } catch (error) {
    console.error('Error loading words:', error)
    return []
  }
}

async function migrateWords() {
  const WORDS = loadWords()

  if (WORDS.length === 0) {
    console.error('❌ No words loaded from source file')
    return false
  }

  console.log('🚀 Starting word migration...')
  console.log(`   Total words to migrate: ${WORDS.length}`)

  try {
    // First, check if words table exists and has data
    const { count: existingCount, error: countError } = await supabase
      .from('words')
      .select('*', { count: 'exact', head: true })

    if (countError && countError.code !== '42P01') {
      console.error('❌ Error checking existing words:', countError)
      return false
    }

    if (existingCount > 0) {
      console.log(`⚠️  Words table already contains ${existingCount} words`)
      const answer = await askQuestion('Do you want to clear existing data and re-import? (yes/no): ')

      if (answer.toLowerCase() === 'yes') {
        const { error: deleteError } = await supabase
          .from('words')
          .delete()
          .gte('id', 0) // Delete all records

        if (deleteError) {
          console.error('❌ Error clearing existing words:', deleteError)
          return false
        }
        console.log('✅ Existing words cleared')
      } else {
        console.log('⏭️  Skipping migration')
        return true
      }
    }

    // Prepare words for insertion
    const wordsToInsert = WORDS.map(word => ({
      id: word.id,
      russian: word.russian,
      italian: word.italian,
      category: word.category || 'general'
    }))

    // Insert in batches of 50 to avoid potential size limits
    const batchSize = 50
    let inserted = 0

    for (let i = 0; i < wordsToInsert.length; i += batchSize) {
      const batch = wordsToInsert.slice(i, i + batchSize)

      const { data, error } = await supabase
        .from('words')
        .insert(batch)
        .select()

      if (error) {
        console.error(`❌ Error inserting batch ${Math.floor(i / batchSize) + 1}:`, error)
        return false
      }

      inserted += batch.length
      console.log(`   ✅ Inserted ${inserted}/${wordsToInsert.length} words`)
    }

    console.log('\n✅ Word migration completed successfully!')
    console.log(`   Total words migrated: ${inserted}`)

    // Verify migration
    const { count: finalCount } = await supabase
      .from('words')
      .select('*', { count: 'exact', head: true })

    console.log(`   Words in database: ${finalCount}`)

    return true
  } catch (error) {
    console.error('❌ Migration failed:', error)
    return false
  }
}

function askQuestion(question) {
  return new Promise((resolve) => {
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    })

    readline.question(question, (answer) => {
      readline.close()
      resolve(answer)
    })
  })
}

async function main() {
  const success = await migrateWords()

  if (success) {
    console.log('\n🎉 Migration complete! Your words are now in Supabase.')
  } else {
    console.log('\n❌ Migration failed. Please check the errors above.')
    process.exit(1)
  }
}

main().catch(console.error)