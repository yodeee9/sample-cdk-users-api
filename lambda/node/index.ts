import { DynamoDBClient, ScanCommand } from "@aws-sdk/client-dynamodb";
import { APIGatewayProxyHandler } from "aws-lambda";
import * as AWSXRay from "aws-xray-sdk";

const ddbClient = AWSXRay.captureAWSv3Client(new DynamoDBClient({ region: "ap-northeast-1" }));

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const tableName = process.env.TABLE_NAME || "";
    const data = await ddbClient.send(
      new ScanCommand({
        TableName: tableName,
      })
    );
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
