import boto3
import os

# S3 setup
s3 = boto3.client("s3")

bucket_name = "harshada-s3-bucket-123"   # बदलो यहाँ अपना bucket name

# Create sample names for each file
data = {
    "file1.txt": ["Amit", "Rahul", "Suresh"],
    "file2.txt": ["John", "David", "Peter"],
    "file3.txt": ["Ravi", "Karan", "Neha"],
    "file4.txt": ["Aman", "Isha", "Raj"],
    "file5.txt": ["Vikas", "Simran", "Aarti"],
    "file6.txt": ["Mohit", "Anjali", "Deepak"],
    "file7.txt": ["Soham", "Priya", "Kunal"],
    "file8.txt": ["Arjun", "Sneha", "Rohit"],
    "file9.txt": ["Manish", "Pooja", "Nikhil"],
    "file10.txt": ["Aditya", "Meera", "Varun"]
}

folder = "names/"  # S3 folder (optional)

for file_name, names in data.items():

    # create local file
    with open(file_name, "w") as f:
        for name in names:
            f.write(name + "\n")

    # upload to S3
    s3.upload_file(
        file_name,
        bucket_name,
        folder + file_name
    )

    print(f"Uploaded: {file_name}")

print("\nAll files uploaded successfully!")