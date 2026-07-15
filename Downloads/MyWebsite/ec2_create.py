import boto3
import time

ec2 = boto3.resource('ec2', region_name='ap-south-1')

instances = ec2.create_instances(
    ImageId='ami-0f5ee92e2d63afc18',  # Amazon Linux (Mumbai)
    MinCount=1,
    MaxCount=1,
    InstanceType='t2.micro',
    KeyName='securitypair',  # CHANGE THIS
    SecurityGroupIds=['sg-0a5c04d6195f626ca'],  # CHANGE THIS
)

instance = instances[0]

print("🚀 Launching EC2 instance...")
print("Instance ID:", instance.id)

# Wait until running
instance.wait_until_running()
instance.reload()

print("✅ Instance is running!")

print("🌐 Public IP:", instance.public_ip_address)