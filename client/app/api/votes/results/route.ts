import { NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import { redis } from '@/lib/redis'; // Asegúrate de ajustar la ruta a tu cliente ioredis

// 1. Inicializar cliente DynamoDB
const rawClient = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
});

const docClient = DynamoDBDocumentClient.from(rawClient);
const DYNAMODB_TABLE = process.env.DYNAMODB_TABLE;
const CACHE_KEY = 'cache:votes:total';
const CACHE_TTL_SECONDS = 10; // Pequeña ventana de caché para proteger DynamoDB ante ráfagas de lectura

export async function GET() {
  try {
    // A. Intentar leer desde el caché de Redis primero
    const cachedTotal = await redis.get(CACHE_KEY);
    if (cachedTotal !== null) {
      return NextResponse.json(
        {
          totalVotes: Number(cachedTotal),
          source: 'cache',
        },
        { status: 200 }
      );
    }

    // B. Si no está en caché, consultar DynamoDB
    // Opción 1: Escanear solo los registros de métricas (PK empieza con CANDIDATE# o SK es METRICS)
    const scanCommand = new ScanCommand({
      TableName: DYNAMODB_TABLE,
      FilterExpression: 'SK = :sk',
      ExpressionAttributeValues: {
        ':sk': 'METRICS',
      },
    });

    const response = await docClient.send(scanCommand);
    const items = response.Items || [];

    // Sumar los totalVotes de cada candidato/métricas existentes
    const totalVotes = items.reduce((acc, item) => acc + Number(item.totalVotes || 0), 0);

    // C. Guardar en Redis por N segundos
    await redis.set(CACHE_KEY, totalVotes, 'EX', CACHE_TTL_SECONDS);

    return NextResponse.json(
      {
        totalVotes,
        source: 'database',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching total votes:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}