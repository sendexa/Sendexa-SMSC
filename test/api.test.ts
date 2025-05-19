import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/v1/messages';
const TEST_CREDENTIALS = {
  clientId: 'test-client',
  clientSecret: 'test-secret'
};

// Helper function to get auth header
const getAuthHeader = (): string => {
  const credentials = Buffer.from(`${TEST_CREDENTIALS.clientId}:${TEST_CREDENTIALS.clientSecret}`).toString('base64');
  return `Basic ${credentials}`;
};

// Helper function to get query params
const getQueryParams = (): string => {
  return `clientid=${TEST_CREDENTIALS.clientId}&clientsecret=${TEST_CREDENTIALS.clientSecret}`;
};

// Helper function to handle errors
const handleError = (error: unknown, context: string): void => {
  if (error instanceof Error) {
    const err = error as any;
    if (err.response?.data) {
      console.error(`${context} error:`, err.response.data);
    } else {
      console.error(`${context} error:`, err.message);
    }
  } else {
    console.error(`${context} unknown error:`, error);
  }
};

async function testSendSms(): Promise<string | undefined> {
  console.log('\nTesting Send SMS...');

  // Test GET endpoint
  try {
    const getResponse = await axios.get(`${API_BASE_URL}/send?${getQueryParams()}&from=Sendexa&to=233501234567&content=Hello from GET`);
    console.log('GET /send response:', getResponse.data);
  } catch (error: unknown) {
    handleError(error, 'GET /send');
  }

  // Test POST endpoint
  try {
    const postResponse = await axios.post(
      `${API_BASE_URL}/send`,
      {
        from: 'Sendexa',
        to: '233501234567',
        content: 'Hello from POST'
      },
      {
        headers: {
          Authorization: getAuthHeader(),
          'Content-Type': 'application/json'
        }
      }
    );
    console.log('POST /send response:', postResponse.data);
    const data = postResponse.data as { messageId?: string };
    return data.messageId;
  } catch (error: unknown) {
    handleError(error, 'POST /send');
  }
}

async function testBatchSms(): Promise<string | undefined> {
  console.log('\nTesting Batch SMS...');

  try {
    const response = await axios.post(
      `${API_BASE_URL}/batch/simple/send`,
      {
        from: 'Sendexa',
        recipients: ['233501234567', '233509876543'],
        content: 'Hello from Batch SMS'
      },
      {
        headers: {
          Authorization: getAuthHeader(),
          'Content-Type': 'application/json'
        }
      }
    );
    console.log('POST /batch/simple/send response:', response.data);
    const data = response.data as { batchId?: string };
    return data.batchId;
  } catch (error: unknown) {
    handleError(error, 'POST /batch/simple/send');
  }
}

async function testPersonalizedBatchSms(): Promise<string | undefined> {
  console.log('\nTesting Personalized Batch SMS...');

  try {
    const response = await axios.post(
      `${API_BASE_URL}/batch/personalized/send`,
      {
        from: 'Sendexa',
        personalizedRecipients: [
          { to: '233501234567', content: 'Hello John from Personalized Batch' },
          { to: '233509876543', content: 'Hello Jane from Personalized Batch' }
        ]
      },
      {
        headers: {
          Authorization: getAuthHeader(),
          'Content-Type': 'application/json'
        }
      }
    );
    console.log('POST /batch/personalized/send response:', response.data);
    const data = response.data as { batchId?: string };
    return data.batchId;
  } catch (error: unknown) {
    handleError(error, 'POST /batch/personalized/send');
  }
}

async function testMessageStatus(messageId: string): Promise<void> {
  console.log('\nTesting Message Status...');

  try {
    const response = await axios.get(`${API_BASE_URL}/${messageId}?${getQueryParams()}`);
    console.log('GET /:messageId response:', response.data);
  } catch (error: unknown) {
    handleError(error, 'GET /:messageId');
  }
}

async function testInvalidRequests(): Promise<void> {
  console.log('\nTesting Invalid Requests...');

  const cases = [
    {
      label: 'Invalid sender ID',
      payload: { from: 'S', to: '233501234567', content: 'Hello' }
    },
    {
      label: 'Invalid phone number',
      payload: { from: 'Sendexa', to: '123456', content: 'Hello' }
    },
    {
      label: 'Invalid content',
      payload: { from: 'Sendexa', to: '233501234567', content: 'a'.repeat(161) }
    }
  ];

  for (const testCase of cases) {
    try {
      await axios.post(`${API_BASE_URL}/send`, testCase.payload, {
        headers: {
          Authorization: getAuthHeader(),
          'Content-Type': 'application/json'
        }
      });
    } catch (error: unknown) {
      handleError(error, testCase.label);
    }
  }
}

async function runTests(): Promise<void> {
  console.log('Starting API Tests...');

  const messageId = await testSendSms();
  await testBatchSms();
  await testPersonalizedBatchSms();

  if (messageId) {
    await testMessageStatus(messageId);
  }

  await testInvalidRequests();

  console.log('\nAPI Tests Completed!');
}

runTests().catch(console.error);
