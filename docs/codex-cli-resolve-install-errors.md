# Codex CLI Prompt: Resolve Installation Errors

Use this prompt with Codex CLI on a machine that has network access and permission to install Node packages. The objective is to restore the project's toolchain so TypeScript scripts (`tsx`) and tests (`vitest`) can run without "command not found" errors.

```
You are Codex CLI operating on my local development machine. Follow these steps to restore the `italian-flashcards` project dependencies and verify tooling:

1. Confirm Node.js v18+ is installed by running `node -v`. If Node is missing, install the current LTS release from https://nodejs.org/ and re-open the shell.
2. Change into the repository root if necessary: `cd /path/to/italian-flashcards`.
3. Ensure npm uses the public registry (avoids private-registry blocks):
   npm config set registry https://registry.npmjs.org/
4. Install dependencies:
   npm install
5. Re-run the install command if prompted about peer dependency conflicts, passing `--legacy-peer-deps` only if the first attempt fails for that reason.
6. After a successful install, verify critical binaries are available:
   npx vitest --version
   npx tsx --version
7. Execute the repository scripts to confirm they no longer fail due to missing packages:
   npm run test -- --runInBand
   npm run migrate -- --check
8. If any script fails because environment variables are missing (e.g., Supabase credentials), report the missing variables but leave the installation intact.
9. Summarize the actions taken and surface any remaining issues.
```

Run the prompt verbatim in Codex CLI; it will handle executing each command on the local machine.
