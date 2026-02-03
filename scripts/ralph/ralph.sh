#!/bin/bash

# Ralph - Autonomous AI Agent Loop
# Based on https://ghuntley.com/ralph/

set -e

# Default values
MAX_ITERATIONS=${1:-10}
TOOL="${2:-amp}"  # amp or claude
RALPH_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$RALPH_DIR/../.." && pwd)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║           Ralph Agent Loop                 ║${NC}"
echo -e "${BLUE}║                                            ║${NC}"
echo -e "${BLUE}║  Max iterations: $MAX_ITERATIONS                         ║${NC}"
echo -e "${BLUE}║  Tool: $TOOL                              ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════╝${NC}"
echo ""

# Check if prd.json exists
if [ ! -f "$RALPH_DIR/prd.json" ]; then
    echo -e "${RED}Error: prd.json not found in $RALPH_DIR${NC}"
    echo "Please create a PRD first using the prd skill, then convert it with the ralph skill."
    exit 1
fi

# Get branch name from prd.json
BRANCH_NAME=$(cat "$RALPH_DIR/prd.json" | grep -o '"branchName": "[^"]*"' | cut -d'"' -f4)

if [ -z "$BRANCH_NAME" ]; then
    echo -e "${RED}Error: Could not extract branchName from prd.json${NC}"
    exit 1
fi

echo -e "${BLUE}Feature branch: $BRANCH_NAME${NC}"

# Check for previous run with different branch
if [ -f "$RALPH_DIR/prd.json" ] && [ -f "$RALPH_DIR/progress.txt" ]; then
    OLD_BRANCH=$(cat "$RALPH_DIR/prd.json" | grep -o '"branchName": "[^"]*"' | cut -d'"' -f4)
    if [ "$OLD_BRANCH" != "$BRANCH_NAME" ]; then
        echo -e "${YELLOW}Archiving previous run...${NC}"
        ARCHIVE_DIR="$PROJECT_ROOT/archive/$(date +%Y-%m-%d)-$(echo $OLD_BRANCH | sed 's/ralph\///')"
        mkdir -p "$ARCHIVE_DIR"
        cp "$RALPH_DIR/prd.json" "$ARCHIVE_DIR/"
        cp "$RALPH_DIR/progress.txt" "$ARCHIVE_DIR/"
        echo -e "${GREEN}Archived to: $ARCHIVE_DIR${NC}"
        
        # Reset progress.txt
        echo "# Ralph Progress Log" > "$RALPH_DIR/progress.txt"
        echo "" >> "$RALPH_DIR/progress.txt"
        echo "Started: $(date)" >> "$RALPH_DIR/progress.txt"
        echo "" >> "$RALPH_DIR/progress.txt"
    fi
fi

# Initialize progress.txt if it doesn't exist
if [ ! -f "$RALPH_DIR/progress.txt" ]; then
    echo "# Ralph Progress Log" > "$RALPH_DIR/progress.txt"
    echo "" >> "$RALPH_DIR/progress.txt"
    echo "Started: $(date)" >> "$RALPH_DIR/progress.txt"
    echo "" >> "$RALPH_DIR/progress.txt"
fi

# Create/check out feature branch
cd "$PROJECT_ROOT"
git fetch origin

if git branch --list | grep -q "$BRANCH_NAME"; then
    echo -e "${BLUE}Checking out existing branch: $BRANCH_NAME${NC}"
    git checkout "$BRANCH_NAME"
else
    echo -e "${BLUE}Creating new branch: $BRANCH_NAME${NC}"
    git checkout -b "$BRANCH_NAME"
fi

# Main loop
iteration=1
while [ $iteration -le $MAX_ITERATIONS ]; do
    echo ""
    echo -e "${YELLOW}════════════════════════════════════════════${NC}"
    echo -e "${YELLOW}  Iteration $iteration / $MAX_ITERATIONS${NC}"
    echo -e "${YELLOW}════════════════════════════════════════════${NC}"
    
    # Check if all stories are complete
    PENDING_STORIES=$(cat "$RALPH_DIR/prd.json" | grep -c '"passes": false' || true)
    
    if [ "$PENDING_STORIES" -eq 0 ]; then
        echo ""
        echo -e "${GREEN}╔════════════════════════════════════════════╗${NC}"
        echo -e "${GREEN}║         ALL STORIES COMPLETE!              ║${NC}"
        echo -e "${GREEN}╚════════════════════════════════════════════╝${NC}"
        echo ""
        echo "Ralph has completed all user stories. Review the changes and merge when ready."
        exit 0
    fi
    
    echo -e "${BLUE}Pending stories: $PENDING_STORIES${NC}"
    
    # Run AI agent
    if [ "$TOOL" = "claude" ]; then
        if ! command -v claude &> /dev/null; then
            echo -e "${RED}Error: Claude Code is not installed${NC}"
            echo "Install with: npm install -g @anthropic-ai/claude-code"
            exit 1
        fi
        
        echo -e "${BLUE}Spawning Claude Code agent...${NC}"
        cd "$PROJECT_ROOT"
        claude -p "$(cat "$RALPH_DIR/CLAUDE.md")" --allowedTools="Bash,Edit,Read,Write,Glob,Grep"
        
    else
        if ! command -v amp &> /dev/null; then
            echo -e "${RED}Error: Amp is not installed${NC}"
            echo "Install from: https://ampcode.com"
            exit 1
        fi
        
        echo -e "${BLUE}Spawning Amp agent...${NC}"
        cd "$PROJECT_ROOT"
        # Note: Amp uses different syntax, adjust as needed
        amp --prompt "$(cat "$RALPH_DIR/CLAUDE.md")"
    fi
    
    # Check if agent signaled completion
    if grep -q "<promise>COMPLETE</promise>" "$RALPH_DIR/progress.txt" 2>/dev/null; then
        echo ""
        echo -e "${GREEN}Agent signaled completion.${NC}"
        exit 0
    fi
    
    iteration=$((iteration + 1))
done

echo ""
echo -e "${YELLOW}════════════════════════════════════════════${NC}"
echo -e "${YELLOW}  Maximum iterations reached ($MAX_ITERATIONS)${NC}"
echo -e "${YELLOW}════════════════════════════════════════════${NC}"
echo ""
echo "Ralph has stopped after $MAX_ITERATIONS iterations."
echo "Check progress.txt and prd.json to see what was completed."
echo "Run again with a higher limit if needed: ./scripts/ralph/ralph.sh [iterations]"
