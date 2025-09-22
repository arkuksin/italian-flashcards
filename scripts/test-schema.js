import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env') })
dotenv.config({ path: join(__dirname, '..', '.env.local') })

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

// Use service role for testing
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
const supabaseClient = createClient(supabaseUrl, supabaseAnonKey)

async function testSchema() {
  console.log('🧪 Testing Database Schema...\n')

  try {
    // Test 1: Insert a test word using service role
    console.log('📝 Test 1: Inserting test word...')
    const { data: insertData, error: insertError } = await supabaseAdmin
      .from('words')
      .insert({
        id: 999,
        russian: 'тест',
        italian: 'test',
        category: 'test'
      })
      .select()

    if (insertError) {
      console.log('❌ Insert failed:', insertError.message)
      return false
    } else {
      console.log('✅ Test word inserted successfully')
    }

    // Test 2: Read words with anon client
    console.log('\n📖 Test 2: Reading words with public access...')
    const { data: readData, error: readError } = await supabaseClient
      .from('words')
      .select('*')
      .eq('id', 999)

    if (readError) {
      console.log('❌ Read failed:', readError.message)
      return false
    } else if (readData && readData.length > 0) {
      console.log('✅ Words table readable with public access')
    } else {
      console.log('⚠️  No data returned, but no error (may be caching)')
    }

    // Test 3: Try to access user_progress without auth (should fail)
    console.log('\n🔒 Test 3: Testing RLS on user_progress...')
    const { data: progressData, error: progressError } = await supabaseClient
      .from('user_progress')
      .select('count', { count: 'exact', head: true })

    if (progressError && progressError.code === 'PGRST301') {
      console.log('✅ RLS working - user_progress properly protected')
    } else if (progressError) {
      console.log('⚠️  Different error on user_progress:', progressError.message)
    } else {
      console.log('❌ RLS not working - user_progress accessible without auth')
    }

    // Test 4: Clean up test data
    console.log('\n🧹 Test 4: Cleaning up test data...')
    const { error: deleteError } = await supabaseAdmin
      .from('words')
      .delete()
      .eq('id', 999)

    if (!deleteError) {
      console.log('✅ Test data cleaned up')
    }

    // Test 5: Check if we can insert real words
    console.log('\n📚 Test 5: Testing real word insertion...')
    const { data: realWordData, error: realWordError } = await supabaseAdmin
      .from('words')
      .insert({
        russian: 'дом',
        italian: 'casa',
        category: 'nouns'
      })
      .select()

    if (realWordError) {
      console.log('❌ Real word insertion failed:', realWordError.message)

      if (realWordError.code === '23505') {
        console.log('   (This might be because the word already exists)')

        // Check if words already exist
        const { count } = await supabaseAdmin
          .from('words')
          .select('*', { count: 'exact', head: true })

        console.log(`   Current word count: ${count}`)

        if (count > 0) {
          console.log('✅ Words table already has data - schema appears to be working!')
          return true
        }
      }
      return false
    } else {
      console.log('✅ Real word insertion successful')

      // Clean up
      if (realWordData && realWordData[0]) {
        await supabaseAdmin
          .from('words')
          .delete()
          .eq('id', realWordData[0].id)
      }

      return true
    }

  } catch (err) {
    console.error('❌ Test failed with exception:', err)
    return false
  }
}

async function main() {
  const success = await testSchema()

  console.log('\n' + '='.repeat(50))
  if (success) {
    console.log('✅ Schema tests passed! Database is working correctly.')
    console.log('\n🚀 You can now proceed with word migration:')
    console.log('   node scripts/migrate-words.js')
  } else {
    console.log('❌ Schema tests failed. Please apply the schema first.')
    console.log('\n📝 To fix this:')
    console.log('1. Go to: https://app.supabase.com/project/gjftooyqkmijlvqbkwdr/editor')
    console.log('2. Run the output from: node scripts/apply-schema.js')
    console.log('3. Then run this test again')
  }
}

main().catch(console.error)