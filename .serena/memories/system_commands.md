# System Commands (Linux/WSL)

## System Information
- **Platform**: Linux (WSL2 on Windows)
- **Kernel**: 6.6.87.2-microsoft-standard-WSL2
- **Shell**: Bash (standard Linux shell)

## File System Commands
```bash
ls                  # List files and directories
ls -la              # List all files including hidden, with details
cd <directory>      # Change directory
pwd                 # Print working directory
mkdir <name>        # Create directory
rm <file>           # Remove file
rm -rf <dir>        # Remove directory recursively
cp <src> <dst>      # Copy file
mv <src> <dst>      # Move/rename file
find <path> -name <pattern>  # Find files by name
```

## File Viewing and Editing
```bash
cat <file>          # Display file contents
head -n <N> <file>  # Show first N lines
tail -n <N> <file>  # Show last N lines
less <file>         # View file with pagination
grep <pattern> <file>  # Search for pattern in file
```

## Git Commands
```bash
git status          # Show working tree status
git add <files>     # Stage files for commit
git commit -m "msg" # Commit staged changes
git push            # Push to remote repository
git pull            # Pull from remote repository
git branch          # List branches
git checkout <branch>  # Switch branch
git log             # Show commit history
git diff            # Show changes
```

## Process Management
```bash
ps aux              # List all running processes
kill <PID>          # Kill process by ID
pkill <name>        # Kill process by name
lsof -i :<port>     # Show what's using a port
top                 # Monitor system resources
```

## Network Commands
```bash
curl <url>          # Make HTTP request
wget <url>          # Download file from URL
ping <host>         # Test network connectivity
```

## Node.js / NPM Commands
```bash
node <file>         # Run JavaScript file
npm install         # Install dependencies
npm run <script>    # Run npm script from package.json
npm list            # List installed packages
npx <command>       # Execute npm package binary
```

## File Permissions
```bash
chmod +x <file>     # Make file executable
chmod 644 <file>    # Set file permissions (rw-r--r--)
chown <user> <file> # Change file owner
```

## Environment Variables
```bash
export VAR=value    # Set environment variable
echo $VAR           # Print environment variable
env                 # List all environment variables
```

## Important Notes for WSL2
- **File paths**: Use Linux-style paths (`/mnt/c/...` for Windows C: drive)
- **Line endings**: Be careful with CRLF vs LF (use `git config core.autocrlf input`)
- **Case sensitivity**: Unlike Windows, Linux is case-sensitive
- **Performance**: Keep project files in WSL filesystem (`/home/...`) for better performance
- **Windows interop**: Can run Windows executables from WSL

## Common Development Workflow
```bash
cd /mnt/c/dev/projects/italian-flashcards  # Navigate to project
git status                                  # Check status
npm run dev                                 # Start dev server
# ... make changes ...
npm run lint                                # Check code quality
npm run test:e2e                           # Run tests
git add .                                   # Stage changes
git commit -m "feat: description"          # Commit
git push                                    # Push to remote
```
