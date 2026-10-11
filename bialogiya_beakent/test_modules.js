// Quick module test
try {
  require('./src/utils/encryption');
  console.log('✅ encryption.js OK');
} catch(e) {
  console.error('❌ encryption.js ERROR:', e.message);
}

try {
  require('./src/utils/smsProvider');
  console.log('✅ smsProvider.js OK');
} catch(e) {
  console.error('❌ smsProvider.js ERROR:', e.message);
}

try {
  require('./src/utils/aiUsageTracker');
  console.log('✅ aiUsageTracker.js OK');
} catch(e) {
  console.error('❌ aiUsageTracker.js ERROR:', e.message);
}

try {
  require('./src/utils/cronJobs');
  console.log('✅ cronJobs.js OK');
} catch(e) {
  console.error('❌ cronJobs.js ERROR:', e.message);
}

try {
  require('./src/middleware/subscriptionGuard');
  console.log('✅ subscriptionGuard.js OK');
} catch(e) {
  console.error('❌ subscriptionGuard.js ERROR:', e.message);
}

try {
  require('./src/controllers/plan.controller');
  console.log('✅ plan.controller.js OK');
} catch(e) {
  console.error('❌ plan.controller.js ERROR:', e.message);
}

try {
  require('./src/controllers/subscription.controller');
  console.log('✅ subscription.controller.js OK');
} catch(e) {
  console.error('❌ subscription.controller.js ERROR:', e.message);
}

try {
  require('./src/controllers/ai-usage.controller');
  console.log('✅ ai-usage.controller.js OK');
} catch(e) {
  console.error('❌ ai-usage.controller.js ERROR:', e.message);
}

try {
  require('./src/controllers/sms.controller');
  console.log('✅ sms.controller.js OK');
} catch(e) {
  console.error('❌ sms.controller.js ERROR:', e.message);
}

try {
  require('./src/controllers/custom-role.controller');
  console.log('✅ custom-role.controller.js OK');
} catch(e) {
  console.error('❌ custom-role.controller.js ERROR:', e.message);
}

try {
  require('./src/routes/plan.routes');
  console.log('✅ plan.routes.js OK');
} catch(e) {
  console.error('❌ plan.routes.js ERROR:', e.message);
}

try {
  require('./src/routes/subscription.routes');
  console.log('✅ subscription.routes.js OK');
} catch(e) {
  console.error('❌ subscription.routes.js ERROR:', e.message);
}

console.log('\n--- Test tugadi ---');
process.exit(0);
