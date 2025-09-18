#!/bin/bash

# Grid Mapper Web Application Deployment Script

set -e

echo "🚀 Deploying Grid Mapper Web Application..."

# Check if AWS CLI is configured
if ! aws sts get-caller-identity > /dev/null 2>&1; then
    echo "❌ AWS CLI not configured. Please run 'aws configure' first."
    exit 1
fi

# Check if CDK is installed
if ! command -v cdk &> /dev/null; then
    echo "❌ AWS CDK not found. Please install with: npm install -g aws-cdk"
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build TypeScript
echo "🔨 Building TypeScript..."
npm run build

# Bootstrap CDK if needed
echo "🏗️  Checking CDK bootstrap..."
if ! aws cloudformation describe-stacks --stack-name CDKToolkit > /dev/null 2>&1; then
    echo "🏗️  Bootstrapping CDK..."
    cdk bootstrap
fi

# Deploy the stack
echo "🚀 Deploying stack..."
cdk deploy --require-approval never

echo "✅ Deployment complete!"
echo ""
echo "📋 Next steps:"
echo "1. Note the Website URL from the output above"
echo "2. Access your Grid Mapper web application"
echo "3. Upload contest logs and generate maps"
echo ""
echo "🔧 Useful commands:"
echo "  View logs: aws logs tail /aws/lambda/GridMapperWebStack-MapGeneratorFunction --follow"
echo "  Update app: cdk deploy"
echo "  Destroy app: cdk destroy"
