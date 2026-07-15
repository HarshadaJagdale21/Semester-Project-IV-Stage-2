import boto3

s3 = boto3.client("s3")

bucket_name = "harshada-s3-bucket-123"
folder = "names/"

# user input
name1 = input("Enter name 1: ")
name2 = input("Enter name 2: ")
name3 = input("Enter name 3: ")

search_names = {name1, name2, name3}

# get all files from S3
response = s3.list_objects_v2(Bucket=bucket_name, Prefix=folder)

if "Contents" not in response:
    print("No files found in bucket")
    exit()

found = False

print("\nSearching...\n")

for obj in response["Contents"]:
    file_key = obj["Key"]

    file_obj = s3.get_object(Bucket=bucket_name, Key=file_key)
    content = file_obj["Body"].read().decode("utf-8")

    file_names = set(content.splitlines())

    if search_names.issubset(file_names):
        print("✔ All names found in:", file_key)
        found = True

if not found:
    print("❌ No file contains all 3 names")