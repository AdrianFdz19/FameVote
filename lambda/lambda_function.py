import os
import json
import logging
from collections import Counter
import boto3
from botocore.exceptions import ClientError

logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Inicializar el cliente de DynamoDB
dynamodb = boto3.resource('dynamodb')
TABLE_NAME = os.environ.get('DYNAMODB_TABLE', 'famvote_records')
table = dynamodb.Table(TABLE_NAME)

def lambda_handler(event, context):
    records = event.get('Records', [])
    if not records:
        return {"statusCode": 200, "body": "Sin registros"}

    candidate_counter = Counter()

    # 1. Escritura en lote del historial de votos usando batch_writer
    with table.batch_writer() as batch:
        for record in records:
            try:
                body = json.loads(record['body'])
                user_id = body.get('userId')
                candidate_id = body.get('candidateId')
                timestamp = body.get('timestamp')

                if user_id and candidate_id and timestamp:
                    # Insertar el detalle del voto
                    batch.put_item(
                        Item={
                            'PK': f"USER#{user_id}",
                            'SK': f"VOTE#{timestamp}",
                            'candidateId': candidate_id,
                            'timestamp': timestamp
                        }
                    )
                    candidate_counter[candidate_id] += 1
            except Exception as e:
                logger.error(f"Error procesando mensaje {record['messageId']}: {str(e)}")

    # 2. Incremento atómico del total de votos por candidato
    for candidate_id, count in candidate_counter.items():
        try:
            table.update_item(
                Key={
                    'PK': f"CANDIDATE#{candidate_id}",
                    'SK': "METRICS"
                },
                UpdateExpression="ADD totalVotes :inc",
                ExpressionAttributeValues={':inc': count}
            )
        except ClientError as e:
            logger.error(f"Error actualizando métrica del candidato {candidate_id}: {str(e)}")

    logger.info(f"Éxito: Se procesaron {len(records)} mensajes en el batch.")
    return {"statusCode": 200, "body": "Batch procesado correctamente"}