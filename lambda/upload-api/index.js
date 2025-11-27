const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const {
  S3RequestPresigner,
  getSignedUrl,
} = require("@aws-sdk/s3-request-presigner");

const s3 = new S3Client({});

exports.handler = async (event) => {
  const body = JSON.parse(event.body || "{}");

  const { keyHint = "upload", extension = "jpg" } = body;

  const userId =
    event.requestContext.identity?.cognitoIdentityId ||
    "anonymous";

  const key = `${keyHint}/${userId}/${Date.now()}.${extension}`;

  const url = await getSignedUrl(
    s3,
    new PutObjectCommand({
      Bucket: process.env.BUCKET_NAME,
      Key: key,
      ContentType: body.contentType || "image/jpeg",
    }),
    { expiresIn: 3600 }
  );

  return {
    statusCode: 200,
    headers: {
      "access-control-allow-origin": "*",
    },
    body: JSON.stringify({ key, url }),
  };
};
