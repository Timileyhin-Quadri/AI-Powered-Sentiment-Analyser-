# SentiTrack Production Deployment Guide (Azure VM + CI/CD)

This guide walks you through deploying **SentiTrack** to an **Azure Linux Virtual Machine** using **Docker Compose** and automated **GitHub Actions CI/CD**.

---

## 1. Why Azure VM over Azure App Service?

| Requirement | Azure VM (Ubuntu 24.04 LTS) | Azure App Service |
| :--- | :--- | :--- |
| **Playwright / Headless Chrome** | ✅ Full OS control; installs Chrome & graphics libs natively | ⚠️ Frequently crashes due to container sandbox & `/dev/shm` limits |
| **Outbound IP Stability** | ✅ **Static Public IP** prevents Twitter session invalidation | ❌ IP changes across shared pools, triggering 2FA/anti-bot locks |
| **Session Cookies Persistence** | ✅ Local disk volume mounts (`.x_session`, `cookies.json`) | ⚠️ Requires Azure Files network storage |
| **Cost for 4GB RAM** | 💰 **~$30/mo** (`Standard_B2s` - 2 vCPU, 4GB RAM) | 💸 ~$80 - $120/mo (`P1v3` or `B2`) |

---

## 2. Step 1: Provision the Azure Virtual Machine

### Recommended Specs:
- **Image**: Ubuntu Server 24.04 LTS (x64)
- **Size**: `Standard_B2s` (2 vCPU, 4 GiB memory) or `Standard_D2s_v5`
- **Authentication**: SSH Public Key (Save your private key `.pem`)
- **Networking / Public IP**: Set to **Static**

### Network Security Group (NSG) Inbound Rules:
Ensure the following ports are open:
- **Port 22** (SSH) — optionally restricted to your IP
- **Port 80** (HTTP) — Source: `Any`
- **Port 443** (HTTPS) — Source: `Any`

---

## 3. Step 2: One-Time VM Preparation

SSH into your new VM:
```bash
ssh -i /path/to/your-key.pem azureuser@<YOUR_VM_PUBLIC_IP>
```

Run this one-liner to install Docker and Git:
```bash
# Update packages
sudo apt update && sudo apt upgrade -y

# Install Docker & Docker Compose plugin
sudo apt install -y ca-certificates curl gnupg git
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch="$(dpkg --print-architecture)" signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  "$(. /etc/os-release && echo "$VERSION_CODENAME")" stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Enable Docker without sudo for the current user
sudo usermod -aG docker $USER

# Create application directory
sudo mkdir -p /opt/sentitrack
sudo chown -R $USER:$USER /opt/sentitrack
```

> **Log out and log back in** (`exit`, then SSH back in) for the Docker group permissions to take effect.

---

## 4. Step 3: Transfer Initial Twitter Session Cookies

From your local machine (where you already have valid `cookies.json` and `session_state.json`), transfer them securely to the VM:

```bash
# Run from your local project root:
scp -i /path/to/your-key.pem cookies.json session_state.json azureuser@<YOUR_VM_PUBLIC_IP>:/opt/sentitrack/
```

---

## 5. Step 4: Configure GitHub Secrets for CI/CD

In your GitHub repository, navigate to **Settings** → **Secrets and variables** → **Actions** → **New repository secret** and add the following 4 secrets:

| Secret Name | Value Description | Example / Format |
| :--- | :--- | :--- |
| `AZURE_VM_IP` | Static public IP address of your Azure VM | `20.120.45.67` |
| `AZURE_VM_USER` | Admin username created during VM setup | `azureuser` or `ubuntu` |
| `AZURE_SSH_PRIVATE_KEY` | Entire content of your SSH private key file | `-----BEGIN OPENSSH PRIVATE KEY----- ... -----END OPENSSH PRIVATE KEY-----` |
| `PROD_ENV` | Full contents of your production `.env` file | See format below |

### Sample `PROD_ENV` Content:
```env
api_key=your_azure_foundry_api_key_here
api_endpoint=https://quadri-rag.services.ai.azure.com
model=gpt-5-mini
model_version=2024-07-18
CHROME_CDP_PORT=9222
CHROME_PATH=/usr/bin/google-chrome-stable
```

---

## 6. Step 5: Trigger CI/CD & Deploy

Whenever you push to the `main` branch:
1. GitHub Actions runs **Stage 1 (CI)**: Builds the React frontend and verifies the backend modules.
2. If tests pass, it runs **Stage 2 (CD)**: Connects via SSH to your VM, pulls the latest code, injects the environment configuration, rebuilds the Docker containers, and performs a live health check.

You can also trigger it manually at any time under **GitHub** → **Actions** → **SentiTrack CI/CD Pipeline** → **Run workflow**.

---

## 7. Step 6: Set Up Free SSL / HTTPS (Let's Encrypt)

Once your domain (e.g. `sentitrack.yourdomain.com`) points to your VM's public IP via an `A` record, you can add SSL encryption:

SSH into the VM:
```bash
sudo apt install -y certbot python3-certbot-nginx
```

You can either:
1. Stop the Docker frontend temporarily (`docker compose stop frontend`), run standalone certbot:
   ```bash
   sudo certbot certonly --standalone -d sentitrack.yourdomain.com
   ```
2. Or use Nginx host mode with SSL termination.

---

## 8. Managing and Monitoring the Production App

Run these commands inside `/opt/sentitrack` on your VM:

- **Check container status**:
  ```bash
  docker compose ps
  ```
- **View live backend logs**:
  ```bash
  docker compose logs -f backend
  ```
- **Restart services**:
  ```bash
  docker compose restart
  ```
- **Perform manual health check**:
  ```bash
  curl http://localhost/api/health
  # Returns: {"status":"healthy","model_loaded":true}
  ```

