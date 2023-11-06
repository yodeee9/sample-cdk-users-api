import { Stack, StackProps, Duration, aws_apigateway, aws_lambda, RemovalPolicy } from "aws-cdk-lib";
import { AttributeType, Table } from "aws-cdk-lib/aws-dynamodb";
import { Construct } from "constructs";

// Rest API パラメータの型定義
type RestApiParams = {
  id: string;
  entry: string;
  runtime?: aws_lambda.Runtime;
  resource: string;
  method: string;
  resourcePath?: string;
};

// Bun LambdaのRestAPIパラメータ
const getUsersBunParams: RestApiParams = {
  resource: "users-bun",
  id: "GetUsers-Bun",
  entry: "lambda/bun",
  method: "GET",
};

// Node.js LambdaのRestAPIパラメータ
const getUsersNodeParams: RestApiParams = {
  resource: "users-node",
  id: "GetUsers-Node",
  entry: "lambda/node",
  runtime: aws_lambda.Runtime.NODEJS_18_X,
  method: "GET",
};

// Deno LambdaのRestAPIパラメータ
const getUsersDenoParams: RestApiParams = {
  resource: "users-deno",
  id: "GetUsers-Deno",
  entry: "lambda/deno",
  method: "GET",
};

// API Gateway RestApiを作成
const createRestApi = (stack: CdkGetUsersApiStack): aws_apigateway.RestApi => {
  return new aws_apigateway.RestApi(stack, "LambdaRuntimePerformanceApi", {
    restApiName: "LambdaRuntimePerformanceApi",
    deployOptions: {
      stageName: "v1",
      tracingEnabled: true,
    },
  });
};

// Lambda関数と、そのAPI Gatewayとの統合を設定
const setupDockerLambdaWithIntegration = (
  stack: CdkGetUsersApiStack,
  restApi: aws_apigateway.RestApi,
  params: RestApiParams,
  table: Table
): void => {
  const lambdaFunction = new aws_lambda.DockerImageFunction(stack, `${params.id}-function`, {
    code: aws_lambda.DockerImageCode.fromImageAsset(params.entry),
    timeout: Duration.seconds(30),
    memorySize: 128,
    tracing: aws_lambda.Tracing.ACTIVE,
    environment: {
      TABLE_NAME: table.tableName,
    },
  });

  table.grantReadWriteData(lambdaFunction);

  attachResourceWithMethod(restApi, lambdaFunction, params);
};

// API Gatewayのリソースにメソッドを追加し、Lambda関数と統合
const attachResourceWithMethod = (
  restApi: aws_apigateway.RestApi,
  lambdaFunction: aws_lambda.IFunction,
  params: RestApiParams
): void => {
  const restApiResource = restApi.root.addResource(params.resource);
  const lambdaIntegration = new aws_apigateway.LambdaIntegration(lambdaFunction);
  restApiResource.addMethod(params.method, lambdaIntegration);
};

export class CdkGetUsersApiStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const table = new Table(this, "Users", {
      partitionKey: { name: "userId", type: AttributeType.STRING },
      removalPolicy: RemovalPolicy.DESTROY,
    });

    // API Gateway RestAPIの作成
    const restApi = createRestApi(this);

    // Bun Lambdaの作成
    setupDockerLambdaWithIntegration(this, restApi, getUsersBunParams, table);

    // Node.js Lambdaの作成
    setupDockerLambdaWithIntegration(this, restApi, getUsersNodeParams, table);

    // Deno Lambdaの作成
    setupDockerLambdaWithIntegration(this, restApi, getUsersDenoParams, table);
  }
}
