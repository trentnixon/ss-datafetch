const { parentPort } = require('worker_threads');
const FullUpdateTaskRunner = require('./TaskRunner');
const tasks = require('./lib/TASKS');

parentPort.on('message', async (data) => {
  const { FranchiseID, task } = data;
  const runner = new FullUpdateTaskRunner(FranchiseID, tasks[task]);

  try {
    const result = await runner.start();
    parentPort.postMessage({ result });
  } catch (error) {
    console.error('Error in worker:', error);
    parentPort.postMessage({ error: error.message || 'An error occurred while running the tasks' });
  }
});
