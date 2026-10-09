#!/bin/bash
set -e

# Use environment variable if provided, otherwise fallback to default
API_URL="${FAMVOTE_API_URL:-https://tntd2p21b4.execute-api.us-east-1.amazonaws.com/prod/v1/vote}"

echo "=========================================="
echo " 🚀 TESTING FAMVOTE INGESTION ENGINE "
echo "=========================================="
echo "Target Endpoint: $API_URL"
echo ""
echo "Sending POST vote payload..."
echo ""

# Send HTTP POST request
RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST "$API_URL" \
     -H "Content-Type: application/json" \
     -d '{
           "candidateId": "cand_123",
           "voterId": "usr_789",
           "timestamp": "'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'"
         }')

HTTP_BODY=$(echo "$RESPONSE" | sed -e 's/HTTP_STATUS:.*//g')
HTTP_STATUS=$(echo "$RESPONSE" | tr -d '\n' | sed -e 's/.*HTTP_STATUS://')

echo "Response Body: $HTTP_BODY"
echo "HTTP Status Code: $HTTP_STATUS"

if [ "$HTTP_STATUS" -eq 200 ]; then
  echo ""
  echo "✅ Vote successfully accepted and queued by API Gateway!"
else
  echo ""
  echo "❌ Failed to queue vote. Status: $HTTP_STATUS"
  exit 1
fi