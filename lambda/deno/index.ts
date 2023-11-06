import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "https://deno.land/x/lambda/mod.ts";
import { createClient } from "https://denopkg.com/chiefbiiko/dynamodb/mod.ts";

const ddbClient = createClient({ region: "ap-northeast-1" });

export const handler = async (event: APIGatewayProxyEventV2) => {
  try {
    const tableName = Deno.env.get("TABLE_NAME") || "";
    const data = await ddbClient.scan({
      TableName: tableName,
    });
    return {
      statusCode: 200,
      body: JSON.stringify(data.Items),
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Internal Server Error" }),
    };
  }
};
