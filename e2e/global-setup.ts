import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  const baseURL = process.env.PLAYWRIGHT_TEST_BASE_URL;
  const bypassToken = process.env.VERCEL_BYPASS_TOKEN;

  // Only run bypass setup for Vercel deployments
  if (!baseURL || !bypassToken || !baseURL.includes('vercel.app')) {
    return;
  }

  console.log('Setting up Vercel bypass authentication...');

  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Navigate to the bypass URL to set the cookie
    const bypassUrl = `${baseURL}?x-vercel-set-bypass-cookie=true&x-vercel-protection-bypass=${bypassToken}`;
    console.log('Navigating to bypass URL...');

    await page.goto(bypassUrl, {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    // Wait a moment for the cookie to be set
    await page.waitForTimeout(2000);

    // Save storage state (including cookies) for all tests to use
    await context.storageState({ path: 'playwright-state.json' });
    console.log('✅ Vercel bypass authentication configured successfully');

  } catch (error) {
    console.error('❌ Failed to set up Vercel bypass authentication:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

export default globalSetup;