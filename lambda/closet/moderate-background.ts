export const handler = async (event: any) => {
  console.log("Moderate background request:", JSON.stringify(event));

  return {
    ...event,
    moderated: true,
  };
};
