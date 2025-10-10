#!/bin/bash

# Deployment Readiness Check Script

echo "🚀 Checking deployment readiness..."
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

ALL_CHECKS_PASSED=true

print_check() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓${NC} $2"
    else
        echo -e "${RED}✗${NC} $2"
        ALL_CHECKS_PASSED=false
    fi
}

# Check 1: Dependencies
echo "📦 Dependencies..."
[ -d "node_modules" ] && print_check 0 "Installed" || print_check 1 "Run 'npm install'"
echo ""

# Check 2: TypeScript
echo "📝 TypeScript..."
npm run type-check > /dev/null 2>&1
print_check $? "Type checking"
echo ""

# Check 3: Linting
echo "🔍 Code quality..."
npm run lint > /dev/null 2>&1
print_check $? "ESLint"
echo ""

# Check 4: Tests
echo "🧪 Tests..."
npm test > /dev/null 2>&1
print_check $? "All tests passing"
echo ""

# Check 5: Build
echo "🏗️  Build..."
npm run build > /dev/null 2>&1
print_check $? "Production build"
echo ""

# Check 6: Git
echo "📚 Git..."
if [ -d ".git" ]; then
    print_check 0 "Repository initialized"
    if [ -z "$(git status --porcelain)" ]; then
        print_check 0 "No uncommitted changes"
    else
        echo -e "${YELLOW}⚠${NC} Warning: Uncommitted changes"
    fi
else
    print_check 1 "Not a git repository"
fi
echo ""

# Final result
echo "================================"
if [ "$ALL_CHECKS_PASSED" = true ]; then
    echo -e "${GREEN}✓ Ready for deployment!${NC}"
    echo ""
    echo "Next: See DEPLOYMENT.md"
    exit 0
else
    echo -e "${RED}✗ Fix issues before deploying${NC}"
    exit 1
fi
