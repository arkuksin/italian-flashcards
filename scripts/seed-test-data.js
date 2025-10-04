import { createClient } from '@supabase/supabase-js';

// Test database credentials
const supabaseUrl = 'https://slhyzoupwluxgasvapoc.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsaHl6b3Vwd2x1eGdhc3ZhcG9jIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTAwMDY5OCwiZXhwIjoyMDc0NTc2Njk4fQ.sHXPnNygm8rNozI-7p4CBxIpWMk49IpqJyLam2F7lLU';

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Test words data (subset for testing)
const testWords = [
  // Basic nouns
  { id: 1, russian: 'дом', italian: 'casa', category: 'nouns' },
  { id: 2, russian: 'вода', italian: 'acqua', category: 'nouns' },
  { id: 3, russian: 'хлеб', italian: 'pane', category: 'nouns' },
  { id: 4, russian: 'молоко', italian: 'latte', category: 'nouns' },
  { id: 5, russian: 'мясо', italian: 'carne', category: 'nouns' },

  // Family
  { id: 11, russian: 'мама', italian: 'mamma', category: 'family' },
  { id: 12, russian: 'папа', italian: 'papà', category: 'family' },
  { id: 13, russian: 'сын', italian: 'figlio', category: 'family' },
  { id: 14, russian: 'дочь', italian: 'figlia', category: 'family' },
  { id: 15, russian: 'брат', italian: 'fratello', category: 'family' },

  // Colors
  { id: 21, russian: 'красный', italian: 'rosso', category: 'colors' },
  { id: 22, russian: 'синий', italian: 'blu', category: 'colors' },
  { id: 23, russian: 'зеленый', italian: 'verde', category: 'colors' },
  { id: 24, russian: 'желтый', italian: 'giallo', category: 'colors' },
  { id: 25, russian: 'белый', italian: 'bianco', category: 'colors' },

  // Common verbs
  { id: 31, russian: 'быть', italian: 'essere', category: 'verbs' },
  { id: 32, russian: 'иметь', italian: 'avere', category: 'verbs' },
  { id: 33, russian: 'делать', italian: 'fare', category: 'verbs' },
  { id: 34, russian: 'говорить', italian: 'parlare', category: 'verbs' },
  { id: 35, russian: 'идти', italian: 'andare', category: 'verbs' },

  // Numbers
  { id: 81, russian: 'один', italian: 'uno', category: 'numbers' },
  { id: 82, russian: 'два', italian: 'due', category: 'numbers' },
  { id: 83, russian: 'три', italian: 'tre', category: 'numbers' },
  { id: 84, russian: 'четыре', italian: 'quattro', category: 'numbers' },
  { id: 85, russian: 'пять', italian: 'cinque', category: 'numbers' },

  // Common words
  { id: 181, russian: 'да', italian: 'sì', category: 'common' },
  { id: 182, russian: 'нет', italian: 'no', category: 'common' },
  { id: 183, russian: 'спасибо', italian: 'grazie', category: 'common' },
  { id: 184, russian: 'пожалуйста', italian: 'prego', category: 'common' },
  { id: 185, russian: 'привет', italian: 'ciao', category: 'common' },
];

async function seedTestData() {
  try {
    console.log('🌱 Seeding test database with sample words...');

    // Clear existing words (if any)
    console.log('🧹 Clearing existing words...');
    const { error: deleteError } = await supabase
      .from('words')
      .delete()
      .neq('id', 0); // Delete all rows

    if (deleteError) {
      console.log('⚠️  Could not clear existing words (table might not exist yet):', deleteError.message);
    }

    // Insert test words
    console.log(`📝 Inserting ${testWords.length} test words...`);
    const { data: insertedWords, error: insertError } = await supabase
      .from('words')
      .insert(testWords)
      .select();

    if (insertError) {
      console.error('❌ Error inserting words:', insertError.message);
      throw insertError;
    }

    console.log(`✅ Successfully inserted ${insertedWords?.length || testWords.length} words!`);

    // Verify the data
    console.log('🔍 Verifying inserted data...');
    const { data: verifyData, error: verifyError } = await supabase
      .from('words')
      .select('id, russian, italian, category')
      .limit(5);

    if (verifyError) {
      console.error('❌ Error verifying data:', verifyError.message);
    } else {
      console.log('✅ Sample words in database:');
      verifyData?.forEach(word => {
        console.log(`  ${word.id}: ${word.russian} → ${word.italian} (${word.category})`);
      });
    }

    // Create a test user and some sample progress (optional)
    console.log('👤 Creating test user data...');

    const testUserId = '12345678-1234-1234-1234-123456789012'; // Mock UUID for testing

    // Insert some sample progress data
    const sampleProgress = [
      {
        user_id: testUserId,
        word_id: 1,
        correct_count: 3,
        wrong_count: 1,
        mastery_level: 2
      },
      {
        user_id: testUserId,
        word_id: 2,
        correct_count: 5,
        wrong_count: 0,
        mastery_level: 3
      },
      {
        user_id: testUserId,
        word_id: 3,
        correct_count: 1,
        wrong_count: 2,
        mastery_level: 1
      }
    ];

    const { error: progressError } = await supabase
      .from('user_progress')
      .insert(sampleProgress);

    if (progressError) {
      console.log('⚠️  Could not insert sample progress (table might need authentication):', progressError.message);
    } else {
      console.log('✅ Sample progress data inserted!');
    }

    // Insert sample user preferences
    const samplePreferences = {
      user_id: testUserId,
      dark_mode: false,
      default_learning_direction: 'ru-it',
      shuffle_mode: true,
      daily_goal: 25
    };

    const { error: prefError } = await supabase
      .from('user_preferences')
      .insert(samplePreferences);

    if (prefError) {
      console.log('⚠️  Could not insert sample preferences (table might need authentication):', prefError.message);
    } else {
      console.log('✅ Sample preferences inserted!');
    }

    console.log('🎉 Test database seeding completed successfully!');
    console.log('📊 Summary:');
    console.log(`   - ${testWords.length} test words inserted`);
    console.log(`   - Sample progress data for testing`);
    console.log(`   - Test user preferences configured`);

  } catch (error) {
    console.error('❌ Error seeding test database:', error.message);
    process.exit(1);
  }
}

seedTestData();