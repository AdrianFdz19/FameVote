// scripts/reset-dev.ts
import Redis from 'ioredis';
import { DynamoDBClient, ScanCommand, BatchWriteItemCommand } from '@aws-sdk/client-dynamodb';
import * as dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

// 1. Initialize ioredis client using configuration variables
const host = process.env.REDIS_HOST || 'localhost';
const port = Number(process.env.REDIS_PORT) || 6379;

const redis = new Redis({
  host,
  port,
  maxRetriesPerRequest: 3,
});

// 2. Initialize DynamoDB v3 client
const dynamoClient = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
});

const DYNAMODB_TABLE = process.env.DYNAMODB_TABLE || 'famvote_records';

async function resetRedis() {
  console.log(`🧹 Clearing Redis database at ${host}:${port}...`);
  // flushall removes all keys from Redis
  await redis.flushall();
  console.log('✅ Redis successfully reset.');
}

async function resetDynamoDB() {
  console.log(`🧹 Clearing DynamoDB table: ${DYNAMODB_TABLE}...`);

  // Scan all existing primary keys (PK and SK) in the table
  const scanCommand = new ScanCommand({
    TableName: DYNAMODB_TABLE,
    ProjectionExpression: 'PK, SK',
  });

  const scanResult = await dynamoClient.send(scanCommand);
  const items = scanResult.Items || [];

  if (items.length === 0) {
    console.log('ℹ️ DynamoDB table is already empty.');
    return;
  }

  // Structure delete requests
  const deleteRequests = items.map((item) => ({
    DeleteRequest: {
      Key: {
        PK: item.PK,
        SK: item.SK,
      },
    },
  }));

  // Process in batches of up to 25 items (DynamoDB BatchWriteItem limit)
  for (let i = 0; i < deleteRequests.length; i += 25) {
    const chunk = deleteRequests.slice(i, i + 25);
    await dynamoClient.send(
      new BatchWriteItemCommand({
        RequestItems: {
          [DYNAMODB_TABLE]: chunk,
        },
      })
    );
  }

  console.log(`✅ ${items.length} items deleted from DynamoDB.`);
}

async function main() {
  try {
    console.log('🚀 Starting test environment reset...\n');
    await resetRedis();
    await resetDynamoDB();
    console.log('\n✨ Voting environment cleared successfully.');
  } catch (error) {
    console.error('❌ Error during reset:', error);
  } finally {
    // Disconnect Redis client to release the process
    redis.disconnect();
    process.exit(0);
  }
}

main();