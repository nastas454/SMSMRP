import json
import boto3
from botocore.client import Config
import uuid


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

    def upload_course_json(self, course_data: dict) -> str:

        file_name = f"courses/{uuid.uuid4()}.json"

        json_body = json.dumps(course_data, ensure_ascii=False).encode('utf-8')

        self.s3_client.put_object(
            Bucket=self.bucket_name,
            Key=file_name,
            Body=json_body,
            ContentType='application/json'
        )

        return file_name