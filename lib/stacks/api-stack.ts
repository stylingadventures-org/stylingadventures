// Hello
helloDs.createResolver("Hello", {
  typeName: "Query",
  fieldName: "hello",
  requestMappingTemplate: appsync.MappingTemplate.lambdaRequest(),
  responseMappingTemplate: appsync.MappingTemplate.lambdaResult(),
});

// UpdateProfile
profileDs.createResolver("UpdateProfile", {
  typeName: "Mutation",
  fieldName: "updateProfile",
});
