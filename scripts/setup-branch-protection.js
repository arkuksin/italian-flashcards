#!/usr/bin/env node

/**
 * Automated Branch Protection Setup Script
 * This script configures GitHub branch protection rules for the main branch
 * to require E2E tests to pass before merging pull requests.
 */

import { execSync } from 'child_process';
import fs from 'fs';

console.log('🛡️  Setting up branch protection for main branch...\n');

// Check if GitHub CLI is installed
function checkGitHubCLI() {
  try {
    execSync('gh --version', { stdio: 'pipe' });
    console.log('✅ GitHub CLI is installed');
    return true;
  } catch (error) {
    console.log('❌ GitHub CLI not found');
    console.log('\nPlease install GitHub CLI first:');
    console.log('  - macOS: brew install gh');
    console.log('  - Windows: winget install GitHub.cli');
    console.log('  - Linux: See https://github.com/cli/cli/blob/trunk/docs/install_linux.md');
    return false;
  }
}

// Check if user is authenticated with GitHub CLI
function checkGitHubAuth() {
  try {
    execSync('gh auth status', { stdio: 'pipe' });
    console.log('✅ GitHub CLI is authenticated');
    return true;
  } catch (error) {
    console.log('❌ GitHub CLI not authenticated');
    console.log('\nPlease authenticate with GitHub CLI:');
    console.log('  gh auth login');
    return false;
  }
}

// Get current repository information
function getRepoInfo() {
  try {
    const repoInfo = execSync('gh repo view --json owner,name', { encoding: 'utf8' });
    const repo = JSON.parse(repoInfo);
    console.log(`✅ Repository: ${repo.owner.login}/${repo.name}`);
    return repo;
  } catch (error) {
    console.error('❌ Error getting repository information:', error.message);
    return null;
  }
}

// Check if branch protection already exists
function checkExistingProtection(owner, name) {
  try {
    const protection = execSync(
      `gh api repos/${owner}/${name}/branches/main/protection`, 
      { encoding: 'utf8', stdio: 'pipe' }
    );
    const protectionData = JSON.parse(protection);
    console.log('ℹ️  Existing branch protection found');
    return protectionData;
  } catch (error) {
    if (error.status === 404) {
      console.log('ℹ️  No existing branch protection found');
      return null;
    }
    console.error('❌ Error checking existing protection:', error.message);
    return false;
  }
}

// Create branch protection rule
function createBranchProtection(owner, name) {
  console.log('\n🔧 Creating branch protection rule...');
  
  const protectionConfig = {
    required_status_checks: {
      strict: true,
      contexts: ["E2E Status Check"]
    },
    enforce_admins: false,
    required_pull_request_reviews: {
      required_approving_review_count: 1,
      dismiss_stale_reviews: true,
      require_code_owner_reviews: false
    },
    restrictions: null,
    allow_force_pushes: false,
    allow_deletions: false
  };

  try {
    const command = `gh api repos/${owner}/${name}/branches/main/protection -X PUT --input -`;
    execSync(command, {
      input: JSON.stringify(protectionConfig),
      stdio: ['pipe', 'inherit', 'inherit']
    });
    console.log('✅ Branch protection rule created successfully!');
    return true;
  } catch (error) {
    console.error('❌ Error creating branch protection:', error.message);
    return false;
  }
}

// Update existing branch protection to include E2E status check
function updateBranchProtection(owner, name, existingProtection) {
  console.log('\n🔧 Updating existing branch protection rule...');
  
  // Get current status checks
  const currentContexts = existingProtection.required_status_checks?.contexts || [];
  
  // Add E2E Status Check if not already present
  if (!currentContexts.includes("E2E Status Check")) {
    currentContexts.push("E2E Status Check");
    
    const updatedConfig = {
      ...existingProtection,
      required_status_checks: {
        strict: existingProtection.required_status_checks?.strict || true,
        contexts: currentContexts
      }
    };
    
    // Remove read-only fields
    delete updatedConfig.url;
    delete updatedConfig.enabled;
    
    try {
      const command = `gh api repos/${owner}/${name}/branches/main/protection -X PUT --input -`;
      execSync(command, {
        input: JSON.stringify(updatedConfig),
        stdio: ['pipe', 'inherit', 'inherit']
      });
      console.log('✅ Branch protection rule updated successfully!');
      return true;
    } catch (error) {
      console.error('❌ Error updating branch protection:', error.message);
      return false;
    }
  } else {
    console.log('✅ E2E Status Check is already configured');
    return true;
  }
}

// Verify the branch protection setup
function verifyBranchProtection(owner, name) {
  console.log('\n🔍 Verifying branch protection setup...');
  
  try {
    const protection = execSync(
      `gh api repos/${owner}/${name}/branches/main/protection`, 
      { encoding: 'utf8' }
    );
    const protectionData = JSON.parse(protection);
    
    console.log('\n📋 Branch Protection Status:');
    console.log(`   Status checks required: ${protectionData.required_status_checks ? '✅' : '❌'}`);
    console.log(`   Up-to-date branches required: ${protectionData.required_status_checks?.strict ? '✅' : '❌'}`);
    console.log(`   PR reviews required: ${protectionData.required_pull_request_reviews ? '✅' : '❌'}`);
    console.log(`   Force pushes blocked: ${!protectionData.allow_force_pushes ? '✅' : '❌'}`);
    console.log(`   Deletions blocked: ${!protectionData.allow_deletions ? '✅' : '❌'}`);
    
    const contexts = protectionData.required_status_checks?.contexts || [];
    console.log(`\n📝 Required Status Checks:`);
    if (contexts.length === 0) {
      console.log('   ❌ No status checks configured');
    } else {
      contexts.forEach(context => {
        const isE2E = context === "E2E Status Check";
        console.log(`   ${isE2E ? '✅' : 'ℹ️ '} ${context}`);
      });
    }
    
    return contexts.includes("E2E Status Check");
  } catch (error) {
    console.error('❌ Error verifying branch protection:', error.message);
    return false;
  }
}

// Main execution
async function main() {
  // Step 1: Check prerequisites
  if (!checkGitHubCLI()) {
    process.exit(1);
  }
  
  if (!checkGitHubAuth()) {
    process.exit(1);
  }
  
  // Step 2: Get repository information
  const repo = getRepoInfo();
  if (!repo) {
    process.exit(1);
  }
  
  // Step 3: Check existing protection
  const existingProtection = checkExistingProtection(repo.owner.login, repo.name);
  if (existingProtection === false) {
    process.exit(1);
  }
  
  // Step 4: Create or update branch protection
  let success = false;
  if (existingProtection) {
    success = updateBranchProtection(repo.owner.login, repo.name, existingProtection);
  } else {
    success = createBranchProtection(repo.owner.login, repo.name);
  }
  
  if (!success) {
    process.exit(1);
  }
  
  // Step 5: Verify the setup
  const verified = verifyBranchProtection(repo.owner.login, repo.name);
  
  if (verified) {
    console.log('\n🎉 Branch protection setup complete!');
    console.log('\n📖 What this means:');
    console.log('   • Pull requests to main branch now require E2E tests to pass');
    console.log('   • Pull requests require at least 1 approving review');
    console.log('   • Force pushes to main branch are blocked');
    console.log('   • Main branch cannot be deleted');
    console.log('\n🔄 Next steps:');
    console.log('   • Create a test PR to verify the protection works');
    console.log('   • E2E tests will run automatically on PR creation/updates');
    console.log('   • Merging will be blocked if E2E tests fail');
  } else {
    console.log('\n⚠️  Branch protection setup may be incomplete');
    console.log('Please check the GitHub repository settings manually');
    process.exit(1);
  }
}

main().catch(console.error);