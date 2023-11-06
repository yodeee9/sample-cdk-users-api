import { DynamoDBClient, ScanCommand } from "@aws-sdk/client-dynamodb";

const ddbClient = new DynamoDBClient({ region: "ap-northeast-1" });

export default {
  async fetch(request: Request) {
    try {
      const tableName = process.env.TABLE_NAME || "";
      const data = await ddbClient.send(
        new ScanCommand({
          TableName: tableName,
        })
      );
      return new Response(JSON.stringify(data.Items), {
        status: 200,
        headers: {
          "content-type": "application/json",
        },
      });
    } catch (error) {
      console.error(error);
      return new Response(JSON.stringify({ message: "Internal Server Error" }), {
        status: 500,
        headers: {
          "content-type": "application/json",
        },
      });
    }
  },
};
