# Grid Mapper Web Application

A serverless web application for generating Maidenhead Grid Square Contest Maps from amateur radio contest logs. Built with AWS CDK, Lambda, API Gateway, S3, and CloudFront.

## Architecture

- **Frontend**: Static website hosted on S3 with CloudFront distribution
- **Backend**: AWS Lambda function for map generation
- **API**: API Gateway for REST endpoints
- **Storage**: S3 bucket for generated maps (organized by date/callsign)
- **CDN**: CloudFront for global content delivery

## Features

- **Web Interface**: Clean, responsive UI similar to contest log submission forms
- **Multi-format Support**: Cabrillo (.cbr/.log) and CSV (.csv) files
- **File Upload**: Drag-and-drop file upload or paste log content
- **Real-time Processing**: Serverless map generation with progress indicators
- **Instant Download**: Generated maps available immediately via presigned URLs
- **Organized Storage**: Maps stored in S3 by date and callsign for troubleshooting
- **Comprehensive Logging**: CloudWatch logs for debugging and monitoring

## Prerequisites

- AWS CLI configured with appropriate permissions
- Node.js 18+ and npm
- AWS CDK v2 installed globally: `npm install -g aws-cdk`
- Python 3.11+ (for Lambda runtime)

### AWS Configuration

The application uses your default AWS profile and region. Ensure you have:

1. **AWS CLI configured:**
   ```bash
   aws configure
   ```
   This sets your default account credentials and region.

2. **CDK environment variables (optional):**
   The stack automatically uses your default AWS account and region via:
   ```typescript
   env: {
     account: process.env.CDK_DEFAULT_ACCOUNT,
     region: process.env.CDK_DEFAULT_REGION,
   }
   ```

3. **Override region (if needed):**
   ```bash
   export CDK_DEFAULT_REGION=us-east-1
   cdk deploy
   ```

**Note:** S3 bucket names include account ID and region for uniqueness:
- Website bucket: `grid-mapper-web-{account}-{region}`
- Maps bucket: `grid-mapper-maps-{account}-{region}`

## Deployment

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Bootstrap CDK (first time only):**
   ```bash
   cdk bootstrap
   ```

3. **Deploy the stack:**
   ```bash
   cdk deploy
   ```

4. **Note the outputs:**
   - Website URL (CloudFront distribution)
   - API Gateway URL
   - S3 bucket name for maps

## Local Development

1. **Build TypeScript:**
   ```bash
   npm run build
   ```

2. **Watch for changes:**
   ```bash
   npm run watch
   ```

3. **Run tests:**
   ```bash
   npm test
   ```

## Usage

1. **Access the web application** using the CloudFront URL from deployment outputs
2. **Enter your station callsign** (required)
3. **Select continents** to display (optional - auto-detected if not specified)
4. **Upload a contest log file** (.cbr, .log, .csv) or paste log content
5. **Click "Generate Maps"** and wait for processing
6. **Download generated maps** using the provided links

## File Formats Supported

### Cabrillo Format (.cbr, .log)
Standard amateur radio contest log format with QSO lines:
```
QSO:      50 DG 2025-09-13 1801 K1TO              EL87   WA4GPM            EM90
```

### CSV Format (.csv)
Flexible CSV format with automatic column detection:
```csv
callsign,freq,grid,date,time
K1TO,50,EL87,2025-09-13,1801
WA4GPM,50,EM90,2025-09-13,1801
```

## Generated Maps

Maps are automatically generated for each frequency band found in the log:
- **High-resolution PNG format** suitable for presentations
- **Color-coded contact density** visualization
- **Grid square boundaries** and labels for VHF/UHF/microwave bands
- **Geographic context** with coastlines, borders, and Great Lakes
- **Automatic regional zoom** for optimal visibility

## Storage Organization

Maps are stored in S3 with the following structure:
```
s3://bucket-name/
├── 2025-09-18/
│   ├── K2UA/
│   │   ├── K2UA_10G_northeastern_north_america_maidenhead_map.png
│   │   ├── K2UA_24G_northeastern_north_america_maidenhead_map.png
│   │   └── ...
│   └── W1AW/
│       └── ...
└── 2025-09-19/
    └── ...
```

## Monitoring and Troubleshooting

### CloudWatch Logs
- Lambda function logs: `/aws/lambda/GridMapperWebStack-MapGeneratorFunction`
- API Gateway logs: Available in API Gateway console

### Common Issues
1. **Large file uploads**: Lambda has a 6MB payload limit for API Gateway
2. **Processing timeout**: Lambda timeout is set to 5 minutes
3. **Memory issues**: Lambda memory is set to 1024MB for map generation

### Debugging
- Check CloudWatch logs for detailed error messages
- Verify S3 bucket permissions for map storage
- Ensure proper file format for contest logs

## Security

- **CORS enabled** for cross-origin requests
- **HTTPS only** via CloudFront
- **Presigned URLs** for secure map downloads (1-hour expiration)
- **No persistent storage** of uploaded log files
- **IAM roles** with least-privilege permissions

## Cost Optimization

- **S3 Lifecycle policies** can be added to automatically delete old maps
- **Lambda provisioned concurrency** not enabled (pay-per-use)
- **CloudFront caching** optimized for static assets
- **API Gateway caching** disabled for dynamic content

## Cleanup

To remove all resources:
```bash
cdk destroy
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes and test locally
4. Submit a pull request

## License

MIT License - see LICENSE file for details.
