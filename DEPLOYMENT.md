# Deployment

This guide covers deployment options for DENUEL App Rental.

## Environment
- Provide a `.env` with production values (DATABASE_URL, JWT_SECRET, NEXT_PUBLIC_MAPBOX_TOKEN, S3 settings if used).

## Docker (recommended)
1. Build image: `docker build -t denuel-app .`
2. Run with env and a managed Postgres: `docker run -p 3000:3000 --env-file .env denuel-app`

## Docker Compose (simple)
- Use `docker-compose up -d` with a production DB and secrets configured.

## AWS / ECS
- Build and push container to ECR, then create an ECS service with Fargate tasks using the image.
- Use RDS for Postgres and S3 for media.
- Set environment variables in service task definitions.

## Serverless image processing (SAM)
We provide a SAM template for the image-processor Lambda in `scripts/lambda/template.yaml`.

To deploy via SAM locally:

1. Install SAM CLI (https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-install.html).
2. Build the application:

   sam build --template-file scripts/lambda/template.yaml

3. Deploy (you will be prompted for params or provide all via flags):

   sam deploy --template-file .aws-sam/build/template.yaml --stack-name denuel-image-processor --capabilities CAPABILITY_IAM --parameter-overrides ImageBucket=your-bucket-name

In CI we added `.github/workflows/deploy-image-processor.yml` which will run lambda unit tests and deploy the SAM stack using `secrets.AWS_ACCESS_KEY_ID`, `secrets.AWS_SECRET_ACCESS_KEY` and `secrets.S3_BUCKET`.

## Serverless Framework
A Serverless Framework `scripts/lambda/serverless.yml` is also included if you prefer serverless framework deployments.

## VPS (Ubuntu)
- Install Node, Postgres or use managed DB.
- Pull repo, `npm ci`, `npx prisma migrate deploy`, `npm run build`, then `npm start` behind a reverse proxy (nginx).

## CI/CD
- Recommended: GitHub Actions build/test, push image to container registry, and auto-deploy (ECS/other) on `main`.

Security tips:
- Use HTTPS, strong `JWT_SECRET`, store secrets in a secret manager.
- Configure auto-scaling and health checks in production.
