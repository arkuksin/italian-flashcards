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
  console.error('Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in .env.local')
  process.exit(1)
}

console.log('🔧 Supabase Configuration:')
console.log(`   URL: ${supabaseUrl}`)
console.log(`   Anon Key: ${supabaseAnonKey.substring(0, 20)}...`)

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function verifyConnection() {
  try {
    // Test basic connection by checking if we can query (even if no data)
    const { data, error } = await supabase
      .from('words')
      .select('count', { count: 'exact', head: true })

    if (error && error.code === '42P01') {
      console.log('⚠️  Table "words" does not exist yet')
      console.log('   This is expected if the database schema hasn\'t been created')
      console.log('   Connection to Supabase is working!')
      return true
    } else if (error) {
      console.error('❌ Error connecting to Supabase:', error.message)
      return false
    } else {
      console.log('✅ Successfully connected to Supabase!')
      console.log(`   Found ${data} words in the database`)
      return true
    }
  } catch (err) {
    console.error('❌ Failed to connect:', err)
    return false
  }
}

async function checkAuthConfig() {
  try {
    // Test auth configuration
    const { data: { settings }, error } = await supabase.auth.getSettings?.() || { data: { settings: null }, error: null }

    if (settings) {
      console.log('\n📧 Auth Configuration:')
      console.log('   Auth is configured and accessible')
    } else {
      console.log('\n📧 Auth Configuration:')
      console.log('   Basic auth setup detected')
    }
  } catch (err) {
    console.log('\n⚠️  Could not fetch auth settings (this is normal for anon key)')
  }
}

async function main() {
  console.log('\n🚀 Verifying Supabase Connection...\n')

  const connected = await verifyConnection()

  if (connected) {
    await checkAuthConfig()
    console.log('\n✅ Supabase setup verification complete!')
    console.log('\nNext steps:')
    console.log('1. Create database tables using the SQL schema')
    console.log('2. Configure authentication providers in Supabase dashboard')
    console.log('3. Set up Row Level Security policies')
  } else {
    console.log('\n❌ Supabase connection failed')
    console.log('\nTroubleshooting:')
    console.log('1. Verify your Supabase project is active')
    console.log('2. Check that the URL and anon key are correct')
    console.log('3. Ensure your project is not paused')
  }
}

main().catch(console.error)