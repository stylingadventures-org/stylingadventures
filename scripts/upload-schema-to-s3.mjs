#!/usr/bin/env node

/**
 * Upload GraphQL schema to S3 before CDK deployment
 * This bypasses CloudFormation's 51KB template body limit
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { S3Client, PutObjectCommand, CreateBucketCommand, ListBucketsCommand } from "@aws-sdk/client-s3";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const schemaPath = path.resolve(__dirname, "../appsync/schema.graphql");
const schemaContent = fs.readFileSync(schemaPath, "utf8");

const s3 = new S3Client({ region: process.env.AWS_REGION || "us-east-1" });
const bucketName = process.env.SCHEMA_BUCKET_NAME || "styling-adventures-appsync-schema";
const bucketKey = "schema.graphql";

async function uploadSchema() {
  console.log("🔧 Uploading GraphQL schema to S3...");
  console.log(`📝 Schema size: ${Buffer.byteLength(schemaContent)} bytes`);
  console.log(`📦 Bucket: ${bucketName}`);
  console.log(`📄 Key: ${bucketKey}`);

  try {
    // Check if bucket exists, create if not
    const listResult = await s3.send(new ListBucketsCommand({}));
    const bucketExists = listResult.Buckets?.some((b) => b.Name === bucketName);

    if (!bucketExists) {
      console.log(`Creating bucket ${bucketName}...`);
      await s3.send(
        new CreateBucketCommand({
          Bucket: bucketName,
        })
      );
      console.log("✅ Bucket created");
    }

    // Upload schema
    const uploadResult = await s3.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: bucketKey,
        Body: schemaContent,
        ContentType: "text/plain",
      })
    );

    console.log("✅ Schema uploaded successfully!");
    console.log(`📍 S3 Location: s3://${bucketName}/${bucketKey}`);
    console.log(`🔗 ETag: ${uploadResult.ETag}`);

    return { bucketName, bucketKey };
  } catch (error) {
    console.error("❌ Error uploading schema:", error.message);
    process.exit(1);
  }
}

uploadSchema().then(() => {
  console.log("Done!");
  process.exit(0);
});
