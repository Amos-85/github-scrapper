# Examaple of rke module

# module "rke" {
#   source = "git@github.com:Amos-85/rke-tf-module.git"

#   key_name = "user"
#   subnet_id = "subnet-56ef781a"
#   vpc_security_group_ids = ["sg-0ee023a92f281vf63"]
#   rke_ec2_ssh_key = "~/.ssh/user.pem"
#   k8s-api-sans-hosts = ["k8s.ddns.net"]
#   instance_type = {
#     control-plane = "t2.small"
#     etcd = "t2.small"
#     worker = "t2.large"
#   }
#   s3-backup-config = {
#     interval_hours = 12
#     retention = 6
#     bucket_name = "rancher-backup-12"
#     folder = "rancher"
#     region = "us-east-2"
#     endpoint = "s3.amazonaws.com"
#   }
# }