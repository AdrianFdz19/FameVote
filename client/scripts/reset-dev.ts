// scripts/reset-dev.ts
import { Redis } from '@upstash/redis';
import ioredis from 'ioredis';
import { DynamoDBClient, ScanCommand, BatchWriteItemCommand } from '@aws-sdk/client-dynamodb';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const DYNAMODB_TABLE = process.env.DYNAMODB_TABLE || 'famvote_records';

async function resetRedis() {
  console.log('🧹 Clearing Redis database...');

  // If Upstash credentials exist, use HTTP SDK; otherwise fallback to local ioredis
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    const upstash = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
    await upstash.flushdb();
    console.log('✅ Upstash Redis successfully reset (FLUSHDB).');
  } else {
    const host = process.env.REDIS_HOST || 'localhost';
    const port = Number(process.env.REDIS_PORT) || 6379;
    const localRedis = new ioredis({ host, port, maxRetriesPerRequest: 3 });
    await localRedis.flushall();
    localRedis.disconnect();
    console.log(`✅ Local Redis (${host}:${port}) successfully reset.`);
  }
}

async function resetDynamoDB() {
  console.log(`🧹 Clearing DynamoDB table: ${DYNAMODB_TABLE}...`);

  const dynamoClient = new DynamoDBClient({
    region: process.env.AWS_REGION || 'us-east-1',
  });

  let totalDeleted = 0;
  let lastEvaluatedKey: Record<string, any> | undefined;

  // Loop to handle DynamoDB 1MB Scan pagination
  do {
    const scanCommand: ScanCommand = new ScanCommand({
      TableName: DYNAMODB_TABLE,
      ProjectionExpression: 'PK, SK',
      ExclusiveStartKey: lastEvaluatedKey,
    });

    const scanResult = await dynamoClient.send(scanCommand);
    const items = scanResult.Items || [];
    lastEvaluatedKey = scanResult.LastEvaluatedKey;

    if (items.length === 0) continue;

    // Build batch delete requests (max 25 items per BatchWriteItemCommand)
    const deleteRequests = items.map((item) => ({
      DeleteRequest: {
        Key: {
          PK: item.PK,
          SK: item.SK,
        },
      },
    }));

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

    totalDeleted += items.length;
  } while (lastEvaluatedKey);

  if (totalDeleted === 0) {
    console.log('ℹ️ DynamoDB table is already empty.');
  } else {
    console.log(`✅ ${totalDeleted} items deleted from DynamoDB.`);
  }
}

async function main() {
  try {
    console.log('🚀 Starting test environment reset...\n');
    await resetRedis();
    await resetDynamoDB();
    console.log('\n✨ Voting environment cleared successfully.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during reset:', error);
    process.exit(1);
  }
}

main();