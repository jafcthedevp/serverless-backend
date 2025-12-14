
var serverlessSDK = require('./serverless_sdk/index.js');
serverlessSDK = new serverlessSDK({
  orgId: 'jesusflores123',
  applicationName: 'overshark-backend',
  appUid: 'yRypC0Fgr6HXB47mdB',
  orgUid: 'df199eb2-3f94-4ad4-9503-fd687c6e2fa8',
  deploymentUid: '3547efee-5ebd-4cf8-b110-947ecc75be3b',
  serviceName: 'overshark-backend',
  shouldLogMeta: true,
  shouldCompressLogs: true,
  disableAwsSpans: false,
  disableHttpSpans: false,
  stageName: 'dev',
  serverlessPlatformStage: 'prod',
  devModeEnabled: false,
  accessKey: null,
  pluginVersion: '7.2.3',
  disableFrameworksInstrumentation: false
});

const handlerWrapperArgs = { functionName: 'overshark-backend-dev-webhookWhatsApp', timeout: 60 };

try {
  const userHandler = require('./src/handlers/webhookWhatsApp.js');
  module.exports.handler = serverlessSDK.handler(userHandler.handler, handlerWrapperArgs);
} catch (error) {
  module.exports.handler = serverlessSDK.handler(() => { throw error }, handlerWrapperArgs);
}