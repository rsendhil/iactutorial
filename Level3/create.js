import * as uuidgen from "uuid";
import AWS from "aws-sdk";
import { success, failure } from "./response-lib";


exports.main = async (event, context, callback) => {

    console.log("event");
    console.log(event);

    // Request body is passed in as a JSON encoded string in 'event.body'
    const data = JSON.parse(event.body);

    console.log("data:");
    console.log(data);
    console.log("data.content");
    console.log(data.content);

    const region = process.env.region;

    const params = {
        TableName: process.env.demoTableName,
        Item: {
            pk: uuidgen.v4(),
            content: data.content
        }
    };

    console.log("params");
    console.log(params);

    try
    {

        const sts = new AWS.STS({ region: region });

        const roleparams = {
            RoleArn: event.requestContext.authorizer.claims['cognito:roles'],
            RoleSessionName: 'DemoAdministratorsGroupActivity',
            ExternalId: '9edb3c3a-f1e4-4cac-946d-aa579cc6bc25', //Random Password that only we know
            DurationSeconds: 3600,
        };

        const assumeRoleStep1 = await sts.assumeRole(roleparams).promise();
        console.log('Changed to new role' + event.requestContext.authorizer.claims['cognito:roles']);

        const accessparams = {
            accessKeyId: assumeRoleStep1.Credentials.AccessKeyId,
            secretAccessKey: assumeRoleStep1.Credentials.SecretAccessKey,
            sessionToken: assumeRoleStep1.Credentials.SessionToken,
        };

        console.log("accessparams");
        console.log(accessparams);
        const dynamoDb = new AWS.DynamoDB.DocumentClient(accessparams);
        await dynamoDb.put(params).promise();

        return success({ status: true });

    } catch (e)
    {
        console.log("Error unfortunately");
        console.log("Error", e);
        return failure(e);
    }

};