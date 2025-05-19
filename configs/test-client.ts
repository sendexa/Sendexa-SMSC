export const TestClientConfig = {
  clientId: 'test-client',
  clientSecret: 'test-secret',
  allowedSenderIds: ['Sendexa', 'TestSender'],
  rateLimits: {
    messagesPerMinute: 100,
    messagesPerHour: 1000,
    messagesPerDay: 10000
  },
  allowedPrefixes: ['233'] // Ghana numbers
}; 