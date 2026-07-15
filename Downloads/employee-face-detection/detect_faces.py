import boto3
import json

BUCKET_NAME = "employee-face-bucket-harshada"
IMAGE_NAME = "employee.jpg"

s3 = boto3.client("s3")
rekognition = boto3.client("rekognition")

print("Uploading image to S3...")

s3.upload_file(IMAGE_NAME, BUCKET_NAME, IMAGE_NAME)

print("Image uploaded successfully.")

response = rekognition.detect_faces(
    Image={
        "S3Object": {
            "Bucket": BUCKET_NAME,
            "Name": IMAGE_NAME
        }
    },
    Attributes=["ALL"]
)

faces = response["FaceDetails"]

print("Number of Faces:", len(faces))

result = []

for face in faces:
    print("Face Confidence:", face["Confidence"])

    result.append({
        "Confidence": face["Confidence"]
    })

with open("result.json", "w") as file:
    json.dump(result, file, indent=4)

print("result.json created successfully")