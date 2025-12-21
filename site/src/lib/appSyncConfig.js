// AppSync and Cognito configuration from CloudFormation outputs
export const appSyncConfig = {
  graphQLEndpoint: "https://z6cqsgghgvg3jd5vyv3xpyia7y.appsync-api.us-east-1.amazonaws.com/graphql",
  graphQLApiId: "khi2trzjgndmvgucgh42oishuu",
  region: "us-east-1",
};

export const cognitoConfig = {
  userPoolId: "us-east-1_aXLKIxbqK",
  userPoolWebClientId: "51uc25i7ob3otirvgi66mpht79",
  identityPoolId: "", // Optional: fill if you have Cognito Identity Pool
  region: "us-east-1",
};
