import os
import json
import pytest
import boto3
from moto import mock_aws

# Seteamos variables de entorno ficticias para los tests
os.environ["AWS_DEFAULT_REGION"] = "us-east-1"
os.environ["DYNAMODB_TABLE"] = "famvote_records_test"

@pytest.fixture
def aws_credentials():
    """Mocked AWS Credentials for moto."""
    os.environ["AWS_ACCESS_KEY_ID"] = "testing"
    os.environ["AWS_SECRET_ACCESS_KEY"] = "testing"

@pytest.fixture
def dynamodb_mock(aws_credentials):
    with mock_aws():
        dynamodb = boto3.resource("dynamodb", region_name="us-east-1")
        # Crear tabla ficticia para el test
        table = dynamodb.create_table(
            TableName="famvote_records_test",
            KeySchema=[
                {"AttributeName": "PK", "KeyType": "HASH"},
                {"AttributeName": "SK", "KeyType": "RANGE"},
            ],
            AttributeDefinitions=[
                {"AttributeName": "PK", "AttributeType": "S"},
                {"AttributeName": "SK", "AttributeType": "S"},
            ],
            BillingMode="PAY_PER_REQUEST",
        )
        yield table

def test_lambda_handler_success(dynamodb_mock):
    # Importamos el handler de tu lambda (ajusta el nombre del archivo si es distinto)
    from lambda_function import lambda_handler

    # Evento simulado de SQS
    fake_sqs_event = {
        "Records": [
            {
                "messageId": "msg-123",
                "body": json.dumps({
                    "userId": "user_abc",
                    "candidateId": "5",
                    "timestamp": "2026-10-01T20:00:00Z"
                })
            }
        ]
    }

    response = lambda_handler(fake_sqs_event, None)

    assert response["statusCode"] == 200

    # Verificar que el ítem del candidato se incrementó
    metrics_item = dynamodb_mock.get_item(
        Key={"PK": "CANDIDATE#5", "SK": "METRICS"}
    )
    assert "Item" in metrics_item
    assert metrics_item["Item"]["totalVotes"] == 1