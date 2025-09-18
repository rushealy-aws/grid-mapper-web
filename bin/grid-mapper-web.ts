#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { GridMapperWebStack } from '../lib/grid-mapper-web-stack';

const app = new cdk.App();
new GridMapperWebStack(app, 'GridMapperWebStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});
