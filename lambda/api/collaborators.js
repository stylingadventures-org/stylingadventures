// Collaborators API Lambda Handler
const AWS = require('aws-sdk')
const eventBridge = new AWS.EventBridge()
const dynamodb = new AWS.DynamoDB.DocumentClient()

exports.handler = async (event) => {
  console.log('Collaborators API', event)
  
  const path = event.path
  const method = event.httpMethod
  const body = event.body ? JSON.parse(event.body) : {}
  
  try {
    switch (path) {
      case '/collaborators/invite':
        return await handleInvite(body, event)
        
      case '/collaborators/accept':
        return await handleAccept(body, event)
        
      case '/collaborators/list':
        return await handleList(event)
        
      case '/collaborators/revoke':
        return await handleRevoke(body, event)
        
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

async function handleInvite(body, event) {
  const { creatorId, email, role } = body
  const userId = event.requestContext.authorizer.claims.sub
  
  // Send invitation event to EventBridge
  await eventBridge.putEvents({
    Entries: [{
      Source: 'collaborators.api',
      DetailType: 'Invitation.Sent',
      Detail: JSON.stringify({
        creatorId,
        invitedEmail: email,
        role,
        invitedBy: userId,
        timestamp: new Date().toISOString()
      })
    }]
  }).promise()
  
  return {
    statusCode: 200,
    body: JSON.stringify({ 
      message: 'Invitation sent',
      invitedEmail: email
    })
  }
}

async function handleAccept(body, event) {
  const { invitationId, accept } = body
  const userId = event.requestContext.authorizer.claims.sub
  
  // Update invitation status in DynamoDB
  await dynamodb.update({
    TableName: 'sa-collaborations',
    Key: { invitationId },
    UpdateExpression: 'SET #status = :status, acceptedAt = :now',
    ExpressionAttributeNames: { '#status': 'status' },
    ExpressionAttributeValues: {
      ':status': accept ? 'ACCEPTED' : 'REJECTED',
      ':now': new Date().toISOString()
    }
  }).promise()
  
  return {
    statusCode: 200,
    body: JSON.stringify({ 
      message: accept ? 'Invitation accepted' : 'Invitation rejected'
    })
  }
}

async function handleList(event) {
  const userId = event.requestContext.authorizer.claims.sub
  
  // List collaborations for the user
  const result = await dynamodb.query({
    TableName: 'sa-collaborations',
    IndexName: 'creatorIdIndex',
    KeyConditionExpression: 'creatorId = :creatorId',
    ExpressionAttributeValues: {
      ':creatorId': userId
    }
  }).promise()
  
  return {
    statusCode: 200,
    body: JSON.stringify(result.Items)
  }
}

async function handleRevoke(body, event) {
  const { collaboratorId } = body
  const userId = event.requestContext.authorizer.claims.sub
  
  // Revoke collaboration
  await dynamodb.delete({
    TableName: 'sa-collaborations',
    Key: { collaboratorId }
  }).promise()
  
  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Collaborator removed' })
  }
}
