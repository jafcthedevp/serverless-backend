// Test simple para verificar el matching
const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient({ region: 'us-east-1' });

async function testMatching() {
  console.log('🔍 Probando matching con código=082 y monto=50');

  const params = {
    TableName: 'overshark-backend-dev-notificaciones',
    FilterExpression: 'codigo_seguridad = :codigo AND monto = :monto AND estado = :estado',
    ExpressionAttributeValues: {
      ':codigo': '082',
      ':monto': 50,
      ':estado': 'PENDIENTE_VALIDACION',
    }
  };

  console.log('Parámetros:', JSON.stringify(params, null, 2));

  const result = await dynamodb.scan(params).promise();

  console.log(`\n✅ Encontradas ${result.Items.length} notificaciones`);

  if (result.Items.length > 0) {
    console.log('\n📄 Primera notificación:');
    console.log(JSON.stringify(result.Items[0], null, 2));
  }
}

testMatching().catch(console.error);
