#!/bin/bash
# Venue Import Helper Script
# Loads environment variables and runs the import script

set -e

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Load environment variables from .env file
if [ -f "$PROJECT_ROOT/.env" ]; then
  export $(grep -E "^NEXT_PUBLIC_SUPABASE_URL|^SUPABASE_SERVICE_ROLE_KEY" "$PROJECT_ROOT/.env" | xargs)
  export SUPABASE_URL="$NEXT_PUBLIC_SUPABASE_URL"
else
  echo "❌ Error: .env file not found at $PROJECT_ROOT/.env"
  exit 1
fi

# Check if required variables are set
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
  echo "❌ Error: Missing required environment variables"
  echo "   Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env"
  exit 1
fi

# Run the import script with all passed arguments
cd "$PROJECT_ROOT"
npx tsx scripts/venue-import/run-import.ts "$@"

