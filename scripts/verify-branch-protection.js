#!/usr/bin/env node

/**
 * Branch Protection Verification Script
 * This script verifies that GitHub branch protection is properly configured
 * and provides recommendations for improvement.
 */

import { execSync } from 'child_process';

console.log('🔍 Verifying branch protection configuration...\n');

// Check if GitHub CLI is available
function checkGitHubCLI() {
  try {
    execSync('gh --version', { stdio: 'pipe' });
    return true;
  } catch (error) {
    console.log('❌ GitHub CLI not found. Please install it to use this verification script.');
    console.log('Alternative: Check manually at https://github.com/your-repo/settings/branches');
    return false;
  }
}

// Check authentication
function checkAuth() {
  try {
    execSync('gh auth status', { stdio: 'pipe' });
    return true;
  } catch (error) {
    console.log('❌ GitHub CLI not authenticated. Run: gh auth login');
    return false;
  }
}

// Get repository information
function getRepoInfo() {
  try {
    const repoInfo = execSync('gh repo view --json owner,name,defaultBranchRef', { encoding: 'utf8' });
    const repo = JSON.parse(repoInfo);
    console.log(`📦 Repository: ${repo.owner.login}/${repo.name}`);
    console.log(`🌿 Default Branch: ${repo.defaultBranchRef.name}`);
    return repo;
  } catch (error) {
    console.error('❌ Error getting repository information:', error.message);
    return null;
  }
}

// Check branch protection status
function checkBranchProtection(owner, name, branch = 'main') {
  console.log(`\n🛡️  Checking branch protection for '${branch}'...\n`);
  
  try {
    const protection = execSync(
      `gh api repos/${owner}/${name}/branches/${branch}/protection`, 
      { encoding: 'utf8' }
    );
    const protectionData = JSON.parse(protection);
    
    return analyzeProtection(protectionData);
  } catch (error) {
    if (error.status === 404) {
      console.log('❌ No branch protection found');
      console.log('\n💡 Recommendations:');
      console.log('   • Run: npm run setup:branch-protection');
      console.log('   • Or manually configure at: GitHub Settings > Branches');
      return {
        protected: false,
        score: 0,
        issues: ['No branch protection configured']
      };
    }
    console.error('❌ Error checking branch protection:', error.message);
    return null;
  }
}

// Analyze protection configuration
function analyzeProtection(protection) {
  console.log('✅ Branch protection is enabled\n');
  
  const analysis = {
    protected: true,
    score: 0,
    maxScore: 10,
    issues: [],
    recommendations: []
  };
  
  // Check status checks
  console.log('📋 Status Checks:');
  if (protection.required_status_checks) {
    console.log('   ✅ Status checks required');
    analysis.score += 2;
    
    if (protection.required_status_checks.strict) {
      console.log('   ✅ Up-to-date branches required');
      analysis.score += 1;
    } else {
      console.log('   ⚠️  Up-to-date branches not required');
      analysis.recommendations.push('Enable "Require branches to be up to date before merging"');
    }
    
    const contexts = protection.required_status_checks.contexts || [];
    console.log(`   📝 Required checks (${contexts.length}):`);
    
    const hasE2ECheck = contexts.includes('E2E Status Check');
    if (hasE2ECheck) {
      console.log('      ✅ E2E Status Check');
      analysis.score += 2;
    } else {
      console.log('      ❌ E2E Status Check - MISSING');
      analysis.issues.push('E2E Status Check not configured');
      analysis.recommendations.push('Add "E2E Status Check" to required status checks');
    }
    
    // List other checks
    contexts.filter(c => c !== 'E2E Status Check').forEach(context => {
      console.log(`      ℹ️  ${context}`);
    });
    
    if (contexts.length === 0) {
      console.log('      ❌ No status checks configured');
      analysis.issues.push('No status checks configured');
    }
  } else {
    console.log('   ❌ Status checks not required');
    analysis.issues.push('Status checks not required');
    analysis.recommendations.push('Enable "Require status checks to pass before merging"');
  }
  
  // Check pull request reviews
  console.log('\n👥 Pull Request Reviews:');
  if (protection.required_pull_request_reviews) {
    console.log('   ✅ PR reviews required');
    analysis.score += 2;
    
    const reviewCount = protection.required_pull_request_reviews.required_approving_review_count || 0;
    console.log(`   📊 Required approvals: ${reviewCount}`);
    if (reviewCount >= 1) {
      analysis.score += 1;
    } else {
      analysis.recommendations.push('Require at least 1 approving review');
    }
    
    if (protection.required_pull_request_reviews.dismiss_stale_reviews) {
      console.log('   ✅ Dismiss stale reviews');
      analysis.score += 1;
    } else {
      console.log('   ⚠️  Stale reviews not dismissed');
      analysis.recommendations.push('Enable "Dismiss stale PR reviews when new commits are pushed"');
    }
    
    if (protection.required_pull_request_reviews.require_code_owner_reviews) {
      console.log('   ✅ Code owner reviews required');
      analysis.score += 0.5;
    }
  } else {
    console.log('   ❌ PR reviews not required');
    analysis.recommendations.push('Enable "Require pull request reviews before merging"');
  }
  
  // Check restrictions
  console.log('\n🚫 Push Restrictions:');
  if (protection.restrictions) {
    console.log('   ✅ Push restrictions enabled');
    if (protection.restrictions.users?.length > 0) {
      console.log(`   👤 Allowed users: ${protection.restrictions.users.map(u => u.login).join(', ')}`);
    }
    if (protection.restrictions.teams?.length > 0) {
      console.log(`   👥 Allowed teams: ${protection.restrictions.teams.map(t => t.name).join(', ')}`);
    }
  } else {
    console.log('   ℹ️  No push restrictions (admins can push directly)');
  }
  
  // Check admin enforcement
  console.log('\n👑 Admin Settings:');
  if (protection.enforce_admins) {
    console.log('   ✅ Rules apply to administrators');
    analysis.score += 0.5;
  } else {
    console.log('   ⚠️  Administrators can bypass rules');
    analysis.recommendations.push('Consider enabling "Include administrators"');
  }
  
  // Check force pushes and deletions
  console.log('\n🔒 Branch Protections:');
  if (!protection.allow_force_pushes) {
    console.log('   ✅ Force pushes blocked');
    analysis.score += 0.5;
  } else {
    console.log('   ❌ Force pushes allowed');
    analysis.issues.push('Force pushes are allowed');
  }
  
  if (!protection.allow_deletions) {
    console.log('   ✅ Branch deletions blocked');
    analysis.score += 0.5;
  } else {
    console.log('   ❌ Branch deletions allowed');
    analysis.issues.push('Branch deletions are allowed');
  }
  
  return analysis;
}

// Check if E2E workflow exists and is properly configured
async function checkE2EWorkflow() {
  console.log('\n🔧 Checking E2E Workflow Configuration...\n');
  
  try {
    const workflowPath = '.github/workflows/pr-e2e-tests.yml';
    const fs = await import('fs');
    
    if (!fs.existsSync(workflowPath)) {
      console.log('❌ E2E workflow file not found');
      return {
        exists: false,
        hasStatusCheck: false,
        issues: ['E2E workflow file missing']
      };
    }
    
    const workflowContent = fs.readFileSync(workflowPath, 'utf8');
    const hasStatusCheck = workflowContent.includes('E2E Status Check');
    const hasStatusCheckJob = workflowContent.includes('status-check:');
    
    console.log('✅ E2E workflow file exists');
    console.log(`${hasStatusCheck ? '✅' : '❌'} E2E Status Check name found`);
    console.log(`${hasStatusCheckJob ? '✅' : '❌'} Status check job defined`);
    
    const issues = [];
    if (!hasStatusCheck) issues.push('E2E Status Check name not found in workflow');
    if (!hasStatusCheckJob) issues.push('Status check job not defined');
    
    return {
      exists: true,
      hasStatusCheck: hasStatusCheck && hasStatusCheckJob,
      issues
    };
  } catch (error) {
    console.error('❌ Error checking E2E workflow:', error.message);
    return {
      exists: false,
      hasStatusCheck: false,
      issues: ['Error reading E2E workflow file']
    };
  }
}

// Generate security score and recommendations
function generateReport(analysis, workflowCheck) {
  console.log('\n' + '='.repeat(60));
  console.log('📊 BRANCH PROTECTION SECURITY REPORT');
  console.log('='.repeat(60));
  
  const scorePercentage = Math.round((analysis.score / analysis.maxScore) * 100);
  const scoreEmoji = scorePercentage >= 80 ? '🟢' : scorePercentage >= 60 ? '🟡' : '🔴';
  
  console.log(`\n${scoreEmoji} Security Score: ${analysis.score}/${analysis.maxScore} (${scorePercentage}%)`);
  
  if (scorePercentage >= 80) {
    console.log('✅ Excellent branch protection configuration!');
  } else if (scorePercentage >= 60) {
    console.log('⚠️  Good branch protection, but could be improved');
  } else {
    console.log('❌ Branch protection needs significant improvement');
  }
  
  // Issues
  if (analysis.issues.length > 0 || workflowCheck.issues.length > 0) {
    console.log('\n🚨 Critical Issues:');
    [...analysis.issues, ...workflowCheck.issues].forEach(issue => {
      console.log(`   • ${issue}`);
    });
  }
  
  // Recommendations
  if (analysis.recommendations.length > 0) {
    console.log('\n💡 Recommendations:');
    analysis.recommendations.forEach(rec => {
      console.log(`   • ${rec}`);
    });
  }
  
  // Action items
  console.log('\n🔧 Action Items:');
  if (!analysis.protected) {
    console.log('   1. Run: npm run setup:branch-protection');
  } else if (analysis.issues.includes('E2E Status Check not configured')) {
    console.log('   1. Run: npm run setup:branch-protection (to add E2E Status Check)');
  }
  
  if (!workflowCheck.hasStatusCheck) {
    console.log('   2. Fix E2E workflow configuration');
  }
  
  console.log('   3. Test with a sample pull request');
  console.log('   4. Verify E2E tests run and block merging when failing');
  
  console.log('\n📖 Documentation:');
  console.log('   • GitHub Branch Protection: https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/defining-the-mergeability-of-pull-requests/about-protected-branches');
  console.log('   • Project E2E Testing: docs/e2e-testing.md');
}

// Main execution
async function main() {
  if (!checkGitHubCLI() || !checkAuth()) {
    return;
  }
  
  const repo = getRepoInfo();
  if (!repo) return;
  
  const defaultBranch = repo.defaultBranchRef.name;
  const analysis = checkBranchProtection(repo.owner.login, repo.name, defaultBranch);
  if (!analysis) return;
  
  const workflowCheck = await checkE2EWorkflow();
  
  generateReport(analysis, workflowCheck);
}

main().catch(console.error);