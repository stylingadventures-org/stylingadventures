/**
 * Cognito token generation Lambda trigger
 * Adds Cognito groups to the ID token claims so the GraphQL resolver can check tier
 */

export const handler = async (event: any): Promise<any> => {
  console.log("TOKEN_GENERATION trigger fired", JSON.stringify(event, null, 2));

  const { request, response } = event;

  // Add groups to ID token claims
  if (
    request.groupConfiguration &&
    request.groupConfiguration.groupsToOverride
  ) {
    response.claimsOverrideDetails = {
      claimsToAddOrOverride: {
        "cognito:groups": request.groupConfiguration.groupsToOverride.join(","),
      },
      claimsToSuppress: [],
      groupConfiguration: {
        groupsToOverride: request.groupConfiguration.groupsToOverride,
      },
    };
  }

  console.log("Response:", JSON.stringify(response, null, 2));
  return response;
};
