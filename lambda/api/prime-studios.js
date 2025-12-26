// Prime Studios API Lambda Handler
const AWS = require('aws-sdk')
const s3 = new AWS.S3()
const stepFunctions = new AWS.StepFunctions()
const dynamodb = new AWS.DynamoDB.DocumentClient()

exports.handler = async (event) => {
  console.log('Prime Studios API', event)
  
  const path = event.path
  const method = event.httpMethod
  const body = event.body ? JSON.parse(event.body) : {}
  
  try {
    switch (path) {
      case '/prime-studios/create-episode':
        return await handleCreateEpisode(body, event)
        
      case '/prime-studios/upload':
        return await handleUpload(body, event)
        
      case '/prime-studios/publish':
        return await handlePublish(body, event)
        
      case '/prime-studios/components':
        return await handleGetComponents(event)
        
      default:
        return {
          statusCode: 404,
          body: JSON.stringify({ error: 'Not found' })
        }
    }
  } catch (error) {
    console.error('Error:', error)
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    }
  }
}

async function handleCreateEpisode(body, event) {
  const { title, description, components } = body
  const userId = event.requestContext.authorizer.claims.sub
  
  const episodeId = `ep-${Date.now()}`
  
  // Store episode metadata
  await dynamodb.put({
    TableName: 'sa-prime-episodes',
    Item: {
      episodeId,
      createdBy: userId,
      title,
      description,
      components,
      status: 'DRAFT',
      createdAt: new Date().toISOString()
    }
  }).promise()
  
  return {
    statusCode: 200,
    body: JSON.stringify({ 
      episodeId,
      message: 'Episode created',
      status: 'DRAFT'
    })
  }
}

async function handleUpload(body, event) {
  const { episodeId, componentId, fileUrl } = body
  const userId = event.requestContext.authorizer.claims.sub
  
  // Generate presigned URL for upload
  const presignedUrl = s3.getSignedUrl('putObject', {
    Bucket: process.env.UPLOADS_BUCKET,
    Key: `prime-studios/${episodeId}/${componentId}`,
    ContentType: 'application/octet-stream',
    Expires: 3600
  })
  
  return {
    statusCode: 200,
    body: JSON.stringify({ 
      presignedUrl,
      message: 'Upload URL generated'
    })
  }
}

async function handlePublish(body, event) {
  const { episodeId } = body
  const userId = event.requestContext.authorizer.claims.sub
  
  // Start step function to publish episode
  const execution = await stepFunctions.startExecution({
    stateMachineArn: process.env.PUBLICATION_STATE_MACHINE_ARN,
    name: `pub-${episodeId}-${Date.now()}`,
    input: JSON.stringify({
      episodeId,
      publishedBy: userId,
      timestamp: new Date().toISOString()
    })
  }).promise()
  
  return {
    statusCode: 200,
    body: JSON.stringify({ 
      message: 'Publishing started',
      executionArn: execution.executionArn
    })
  }
}

async function handleGetComponents(event) {
  // Return available components for Prime Studios
  const components = [
    {
      id: 'hero-video',
      name: 'Hero Video',
      description: 'Large video component for dramatic reveals',
      category: 'video'
    },
    {
      id: 'carousel-looks',
      name: 'Carousel Looks',
      description: 'Swipeable carousel of outfit looks',
      category: 'gallery'
    },
    {
      id: 'shopping-tiles',
      name: 'Shopping Tiles',
      description: 'Shoppable product tiles',
      category: 'commerce'
    },
    {
      id: 'testimonial',
      name: 'Testimonial',
      description: 'Creator testimonial text block',
      category: 'text'
    },
    {
      id: 'interactive-poll',
      name: 'Interactive Poll',
      description: 'Audience polling component',
      category: 'engagement'
    },
    {
      id: 'countdown-timer',
      name: 'Countdown Timer',
      description: 'Time-sensitive offer timer',
      category: 'engagement'
    }
  ]
  
  return {
    statusCode: 200,
    body: JSON.stringify(components)
  }
}
