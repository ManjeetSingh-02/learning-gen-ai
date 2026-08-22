// external-imports
import { Inngest } from 'inngest';

// create an Inngest client instance
export const inngest = new Inngest({ id: 'testing-inngest' });

// test function
const testFunction = inngest.createFunction(
  { id: 'test-function', triggers: [{ event: 'app/test' }] },
  async function ({ step }) {
    await step.run('test/collection', async () => {
      console.log('Running test collection...');
      return { name: 'John Doe', age: 30 };
    });

    await step.waitForSignal('test/signal', async () => {});

    await step.run('test/research', async () => {
      console.log('Running test research...');
      return { name: 'John Doe', age: 30 };
    });

    await step.sleep('test/sleep', '5s');

    await step.run('test/notification', async () => {
      console.log('Sending test notification...');
      if (Math.random() > 0.5) throw new Error('Failed to send notification');
      console.log('Notification sent successfully');
      // step.invoke('');
      return { success: true };
    });

    await step.waitForEvent('test/event', async () => {});
  }
);

// export the functions
export const functions = [testFunction];
