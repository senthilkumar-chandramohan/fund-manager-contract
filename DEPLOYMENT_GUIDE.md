# Deployment Guide - FundManager API

This guide covers deploying the FundManager Deployment API to various platforms.

## Table of Contents
1. [Local Development](#local-development)
2. [Docker](#docker)
3. [Heroku](#heroku)
4. [AWS EC2](#aws-ec2)
5. [DigitalOcean](#digitalocean)
6. [Railway](#railway)
7. [Production Checklist](#production-checklist)

## Local Development

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Setup
```bash
# Install dependencies
npm install

# Create .env file
cp .env.example .env
# Edit .env with your configuration

# Start development server
npm run server

# Server runs on http://localhost:3000
```

## Docker

### Prerequisites
- Docker and Docker Compose installed

### Build and Run
```bash
# Build the Docker image
docker build -t fundmanager-api .

# Run the container
docker run -p 3000:3000 \
  -e RPC_URL="https://sepolia.infura.io/v3/YOUR_KEY" \
  -e PRIVATE_KEY="your_private_key" \
  fundmanager-api
```

### Using Docker Compose
```bash
# Create .env file in root directory
cp .env.example .env
# Edit .env with your RPC_URL and PRIVATE_KEY

# Start services
docker-compose up -d

# Check logs
docker-compose logs -f api

# Stop services
docker-compose down
```

## Heroku

### Prerequisites
- Heroku account
- Heroku CLI installed

### Deployment Steps

```bash
# Login to Heroku
heroku login

# Create a new Heroku app
heroku create your-app-name

# Set environment variables
heroku config:set RPC_URL="https://sepolia.infura.io/v3/YOUR_KEY" -a your-app-name
heroku config:set PRIVATE_KEY="your_private_key" -a your-app-name

# Deploy
git push heroku main

# View logs
heroku logs --tail -a your-app-name

# View deployed app
heroku open -a your-app-name
```

### Heroku Config
Create a `Procfile` in the root directory:
```
web: npm start
```

## AWS EC2

### Prerequisites
- AWS account
- EC2 instance running Ubuntu 22.04 LTS

### Setup Steps

```bash
# SSH into your instance
ssh -i your-key.pem ec2-user@your-instance-ip

# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -sL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2 (process manager)
sudo npm install -g pm2

# Clone repository (or transfer files)
git clone https://github.com/your-repo/fund-manager-contract.git
cd fund-manager-contract

# Install dependencies
npm install

# Build
npm run build

# Create .env file with your configuration
nano .env
# Add: RCP_URL and PRIVATE_KEY

# Start with PM2
pm2 start dist/server.js --name "fundmanager-api"

# Configure PM2 startup
pm2 startup
pm2 save

# Check status
pm2 status
pm2 logs fundmanager-api
```

### Setup Nginx Reverse Proxy
```bash
# Install Nginx
sudo apt install -y nginx

# Create Nginx config
sudo nano /etc/nginx/sites-available/fundmanager-api
```

Add this configuration:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/fundmanager-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## DigitalOcean

### Prerequisites
- DigitalOcean account
- App Platform or Droplet

### Using App Platform (Recommended)

1. Connect your GitHub repository
2. Create new app and select your repository
3. Configure the build command: `npm run build`
4. Configure the run command: `npm start`
5. Add environment variables:
   - `RPC_URL`: Your RPC endpoint
   - `PRIVATE_KEY`: Your wallet private key
   - `NODE_ENV`: production
6. Deploy

### Using Droplet

Similar to AWS EC2 setup above.

## Railway

### Prerequisites
- Railway account
- Railway CLI

### Deployment

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Initialize project
railway init

# Add environment variables
railway link
railway variable add RPC_URL "https://..."
railway variable add PRIVATE_KEY "0x..."

# Deploy
railway up
```

## Production Checklist

### Security
- [ ] Never commit `.env` file
- [ ] Use HTTPS/SSL certificates
- [ ] Implement rate limiting
- [ ] Add authentication/authorization
- [ ] Use environment variables for secrets
- [ ] Enable CORS appropriately
- [ ] Implement request validation
- [ ] Add request logging

### Performance
- [ ] Enable compression
- [ ] Use a CDN for static content
- [ ] Configure database connection pooling
- [ ] Monitor response times
- [ ] Set up auto-scaling

### Monitoring & Logging
- [ ] Set up error tracking (Sentry, etc.)
- [ ] Configure centralized logging
- [ ] Monitor API uptime
- [ ] Set up alerts
- [ ] Track deployment versions

### Infrastructure
- [ ] Use a reverse proxy (Nginx, etc.)
- [ ] Configure firewall rules
- [ ] Set up backups
- [ ] Enable auto-restart on failure
- [ ] Configure load balancing
- [ ] Use managed databases if applicable

### Code Quality
- [ ] Run tests before deployment
- [ ] Use CI/CD pipeline
- [ ] Code review process
- [ ] Automated linting
- [ ] Type checking

## Monitoring Commands

### Check Application Health
```bash
curl http://localhost:3000/health
```

### View Logs
```bash
# Docker
docker logs -f container_name

# PM2
pm2 logs

# Heroku
heroku logs --tail

# SSH into server
ssh user@server_ip
tail -f /var/log/app.log
```

## Troubleshooting

### Port Already in Use
```bash
# Find process using port 3000
lsof -i :3000

# Kill process
kill -9 <PID>
```

### Out of Memory
```bash
# Increase Node.js memory
NODE_OPTIONS=--max-old-space-size=4096 npm start
```

### Database Connection Issues
- Check RPC endpoint is accessible
- Verify private key is valid
- Check network connectivity
- Review firewall rules

### High Response Times
- Check RPC endpoint performance
- Monitor contract deployment complexity
- Review server resources
- Consider caching strategies

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `RPC_URL` | Yes | Ethereum RPC endpoint |
| `PRIVATE_KEY` | Yes | Wallet private key (without 0x) |
| `PORT` | No | Server port (default: 3000) |
| `NODE_ENV` | No | Environment (development/production) |

## Scaling Strategies

### Vertical Scaling
- Increase server resources (CPU, RAM)
- Use a more powerful instance type

### Horizontal Scaling
- Run multiple instances
- Use load balancer
- Implement session/state management

### Database Optimization
- Implement caching layers
- Use connection pooling
- Optimize queries

## Disaster Recovery

1. **Backups**: Regular automated backups
2. **Monitoring**: Set up alerts for failures
3. **Redundancy**: Multiple instances/regions
4. **Rollback Plan**: Easy version rollback
5. **Documentation**: Keep detailed docs

## Support & Maintenance

- Monitor logs regularly
- Keep dependencies updated
- Security patches promptly
- Regular testing
- Performance optimization

For more information, see [SETUP_COMPLETE.md](./SETUP_COMPLETE.md) and [QUICK_START.md](./QUICK_START.md).
