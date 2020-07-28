## Github-Scrapper Demo

This Project include helm chart for deploying github-scrapper in k8s.  
Charts in the projecs:  
- [github-scrapper](https://github.com/Amos-85/github-scrapper)  
- [MongoDB](https://hub.helm.sh/charts/bitnami/mongodb/5.14.0)  
- [fluent-bit](https://hub.helm.sh/charts/fluent/fluent-bit)  
- [elasticsearch](https://hub.helm.sh/charts/elastic/elasticsearch)  
- [kibana](https://hub.helm.sh/charts/elastic/kibana)  
- [aws-ebs-csi](https://github.com/kubernetes-sigs/aws-ebs-csi-driver/tree/master/aws-ebs-csi-driver) (for k8s persistent volumes in amazon)  

### Prerequisites  

- [Terraform](https://www.terraform.io/)
- [Terraform RKE provider](https://github.com/rancher/terraform-provider-rke)  
- [Terraform RKE module](https://github.com/Amos-85/rke-tf-module)
- [HELM-v3](https://helm.sh/)
- [Helmfile](https://github.com/roboll/helmfile)
- [Kubectl](https://kubernetes.io/docs/tasks/tools/install-kubectl/)  

### Limitations

- `Terraform RKE module` is a project that still in development early stages:  

  -- no terraform outputs.  
  -- do not change the ami var (must run within RancherOS).

### Project Guidelines  

- Create new tf file like rke.tf exmaple.
- For provisioning k8s cluster, run:  
  `terraform init && terraform apply`  
  You can increase the amount of instances in place by edit `instance_count` tfvar map object.
- `kube_config_cluster.yml` will be created in the project directory after running terraform and you will need to export KUBECONFIG and point this file.  
- Create secret file `github-auth` for github authentication like the exmaple below by running:  
  `kubectl -n github-scrapper create secret generic github-auth --from-literal=GITHUB_USER='my-user' --from-literal=GITHUB_PASSWORD='my_password'`  
- Enter users to search seprated by space in helmfile.yaml github-scrapper release env `GITHUB_SEARCH_USERS`
- For installing the chart within helmfile, run:  
  `helmfile -i -f helmfile.yml apply`

### Kibana

- Checking logs can be access within kubectl port-forward:  
 `kubectl -n kibana port-forward svc/kibana-kibana 5601:5601`
