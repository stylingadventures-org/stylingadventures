import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { DynamoDBDocumentClient, PutCommand, GetCommand, DeleteCommand, QueryCommand } from '@aws-sdk/lib-dynamodb'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'

const s3Client = new S3Client()
const dynamoClient = DynamoDBDocumentClient.from(new DynamoDBClient())

interface CreateAssetInput {
  userId: string
  name: string
  type: 'image' | 'video' | 'file'
  url: string
  cabinet: string
}

interface Asset {
  id: string
  userId: string
  name: string
  type: string
  url: string
  cabinet: string
  createdAt: number
}

/**
 * Get presigned URL for uploading a file to S3
 */
export async function getPresignedUrl(userId: string, filename: string, filetype: string) {
  try {
    const key = `assets/${userId}/${Date.now()}-${filename}`

    const command = new PutObjectCommand({
      Bucket: process.env.ASSETS_BUCKET!,
      Key: key,
      ContentType: filetype,
    })

    const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 })

    return {
      statusCode: 200,
      body: JSON.stringify({
        url,
        key,
      }),
    }
  } catch (error) {
    console.error('Error generating presigned URL:', error)
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to generate upload URL' }),
    }
  }
}

/**
 * Create asset record in DynamoDB
 */
export async function createAsset(input: CreateAssetInput): Promise<Asset> {
  const assetId = `asset-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

  const asset: Asset = {
    id: assetId,
    userId: input.userId,
    name: input.name,
    type: input.type,
    url: input.url,
    cabinet: input.cabinet || 'general',
    createdAt: Date.now(),
  }

  await dynamoClient.send(
    new PutCommand({
      TableName: process.env.ASSETS_TABLE!,
      Item: asset,
    })
  )

  return asset
}

/**
 * List creator's assets
 */
export async function listCreatorAssets(userId: string, cabinet?: string) {
  try {
    // Query DynamoDB for assets by userId
    // In a real implementation, you'd use Query with GSI
    // For now, return mock data
    return {
      items: [
        {
          id: 'asset-1',
          name: 'Red Summer Dress',
          type: 'image',
          url: 'https://via.placeholder.com/400?text=Red+Dress',
          cabinet: 'outfits',
          createdAt: Date.now(),
        },
        {
          id: 'asset-2',
          name: 'Blue Jeans',
          type: 'image',
          url: 'https://via.placeholder.com/400?text=Blue+Jeans',
          cabinet: 'outfits',
          createdAt: Date.now(),
        },
      ],
      nextToken: null,
    }
  } catch (error) {
    console.error('Error listing assets:', error)
    throw error
  }
}

/**
 * Delete asset
 */
export async function deleteAsset(assetId: string, userId: string): Promise<boolean> {
  try {
    // Delete from DynamoDB
    await dynamoClient.send(
      new DeleteCommand({
        TableName: process.env.ASSETS_TABLE!,
        Key: { id: assetId, userId },
      })
    )

    return true
  } catch (error) {
    console.error('Error deleting asset:', error)
    throw error
  }
}
