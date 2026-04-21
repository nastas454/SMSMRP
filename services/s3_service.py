import json
import boto3
from botocore.client import Config
import uuid

from botocore.exceptions import ClientError


class S3Service:
    def __init__(self):
        self.s3_client = boto3.client('s3',
            endpoint_url='http://localhost:9000',
            aws_access_key_id='admin',
            aws_secret_access_key='12345678',
            config=Config(signature_version='s3v4'),
            region_name='us-east-1'
        )
        self.bucket_name = "rehab-courses"

    def upload_course_json(self, course_data: dict, key: str = None) -> str:
        if key is None:
            key = f"courses/{uuid.uuid4()}.json"
        json_body = json.dumps(course_data, ensure_ascii=False).encode('utf-8')
        self.s3_client.put_object(
            Bucket=self.bucket_name,
            Key=key,
            Body=json_body,
            ContentType='application/json'
        )
        return key

    def get_course_json(self, s3_key: str) -> dict:
        try:
            response = self.s3_client.get_object(
                Bucket=self.bucket_name,
                Key=s3_key
            )
            file_data = response['Body'].read()
            json_content = json.loads(file_data.decode('utf-8'))
            return json_content
        except ClientError as e:
            error_code = e.response['Error']['Code']
            print(f"Помилка MinIO при отриманні {s3_key}: {error_code}")
            return {"error": "Файл курсу не знайдено у сховищі", "details": str(e)}
        except json.JSONDecodeError:
            print(f"Помилка парсингу JSON для файлу {s3_key}")
            return {"error": "Файл пошкоджено (некоректний JSON)"}