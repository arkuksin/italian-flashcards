#!/usr/bin/env node

// PR Monitoring and Auto-merge Script
import { execSync } from 'child_process';

const PR_NUMBER = 17;
const CHECK_INTERVAL = 30000; // 30 seconds
const MAX_WAIT_TIME = 10 * 60 * 1000; // 10 minutes

console.log(`🔍 Starting PR #${PR_NUMBER} monitoring...`);
console.log(`⏱️  Checking every ${CHECK_INTERVAL/1000} seconds`);
console.log(`⏰ Max wait time: ${MAX_WAIT_TIME/1000/60} minutes\n`);

let startTime = Date.now();

async function checkPRStatus() {
  try {
    console.log(`🔄 Checking PR #${PR_NUMBER} status...`);

    // Get PR status
    const prStatus = JSON.parse(
      execSync(`gh pr view ${PR_NUMBER} --json statusCheckRollup,mergeable,mergeStateStatus`,
      { encoding: 'utf8' })
    );

    console.log(`📊 Merge State: ${prStatus.mergeStateStatus}`);
    console.log(`🔀 Mergeable: ${prStatus.mergeable}`);

    // Check individual status checks
    const checks = prStatus.statusCheckRollup || [];
    const inProgress = checks.filter(check =>
      check.status === 'IN_PROGRESS' || (check.state && check.state === 'PENDING')
    );
    const failed = checks.filter(check =>
      check.conclusion === 'FAILURE' || (check.state && check.state === 'FAILURE')
    );
    const succeeded = checks.filter(check =>
      check.conclusion === 'SUCCESS' || (check.state && check.state === 'SUCCESS')
    );

    console.log(`✅ Passed: ${succeeded.length}`);
    console.log(`🟡 In Progress: ${inProgress.length}`);
    console.log(`❌ Failed: ${failed.length}`);

    // Show in-progress checks
    if (inProgress.length > 0) {
      console.log('🟡 Still waiting for:');
      inProgress.forEach(check => {
        console.log(`   - ${check.name || check.context}`);
      });
    }

    // Check for failures
    if (failed.length > 0) {
      console.log('\n❌ FAILED CHECKS DETECTED:');
      failed.forEach(check => {
        console.log(`   - ${check.name || check.context}: ${check.conclusion || check.state}`);
        if (check.detailsUrl) {
          console.log(`     Details: ${check.detailsUrl}`);
        }
      });
      console.log('\n🚫 NOT MERGING due to failed checks.');
      console.log('📧 Please review the failed checks above.');
      process.exit(1);
    }

    // Check if all checks are complete and successful
    if (inProgress.length === 0 && prStatus.mergeable === 'MERGEABLE') {
      console.log('\n🎉 All checks passed! Attempting to merge...');

      try {
        // Merge the PR
        execSync(`gh pr merge ${PR_NUMBER} --squash --delete-branch`, {
          encoding: 'utf8',
          stdio: 'inherit'
        });

        console.log('\n✅ Successfully merged PR #' + PR_NUMBER + '!');
        console.log('🗑️  Branch deleted automatically');
        console.log('🚀 Changes are now live on main branch');
        process.exit(0);

      } catch (mergeError) {
        console.log('\n❌ Failed to merge PR:');
        console.log(mergeError.message);
        console.log('\n📧 Please merge manually: https://github.com/arkuksin/italian-flashcards/pull/' + PR_NUMBER);
        process.exit(1);
      }
    }

    // Check timeout
    const elapsed = Date.now() - startTime;
    if (elapsed > MAX_WAIT_TIME) {
      console.log(`\n⏰ Timeout reached (${MAX_WAIT_TIME/1000/60} minutes)`);
      console.log('🔄 Some checks are still running. Please check manually:');
      console.log(`🔗 https://github.com/arkuksin/italian-flashcards/pull/${PR_NUMBER}`);
      process.exit(1);
    }

    console.log(`\n⏳ Waiting ${CHECK_INTERVAL/1000}s before next check...\n`);

  } catch (error) {
    console.log('❌ Error checking PR status:');
    console.log(error.message);
    process.exit(1);
  }
}

// Start monitoring
async function startMonitoring() {
  while (true) {
    await checkPRStatus();
    await new Promise(resolve => setTimeout(resolve, CHECK_INTERVAL));
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n⏹️  Monitoring stopped by user');
  console.log(`🔗 Check PR manually: https://github.com/arkuksin/italian-flashcards/pull/${PR_NUMBER}`);
  process.exit(0);
});

startMonitoring().catch(error => {
  console.log('💥 Unexpected error:', error);
  process.exit(1);
});