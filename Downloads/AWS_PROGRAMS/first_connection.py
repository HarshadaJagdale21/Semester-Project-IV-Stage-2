import boto3

# Replace with your existing bucket name

bucket_name = "harshada-s3-bucket-123"

s3 = boto3.client('s3')

# Create a local file

file_name = "semister .pdf"

with open(file_name, "w") as f:
  f.write("Hello from AWS S3 using Boto3!")

# Upload the file

s3.upload_file(file_name, bucket_name, file_name)

print(f"File '{file_name}' uploaded successfully to '{bucket_name}'")
