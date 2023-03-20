const express = require('express');
const { Worker } = require('worker_threads');
const app = express();
const PORT = process.env.PORT || 3000;

//const FullUpdateTaskRunner = require("./TaskRunner");
/*
  TODO:

*/

/*
Tasks
 FULLUPDATE,
  FranchiseSetup,
  FixtureUpdate,
  PlayerPerformanceUpdate,
  SyncTeams,
  SyncLeagueTables
*/
/*
  "/fullupdate"
  "/SyncLeagueTables"
  "/SyncTeams"
  "/Fixtures"
  "/PlayerPerformance"
  "/FranchiseSetup"
  */




function asyncWrapper(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

async function runTaskWithWorker(req, res, task) {
  const { FranchiseID } = req.query;
  const worker = new Worker('./worker.js');

  worker.on('message', (message) => {
    if (message.error) {
      console.error('Error from worker:', message.error);
      res.status(500).send(message.error);
    } else {
      res.status(200).send(message.result);
    }
  });

  worker.on('error', (error) => {
    console.error(error);
    res.status(500).send('An error occurred while running the tasks');
  });

  worker.postMessage({ FranchiseID, task });
}


// Replace your previous route handlers with the new ones using runTaskWithWorker
app.get('/FranchiseSetup', asyncWrapper(async (req, res) => {
  await runTaskWithWorker(req, res, 'FranchiseSetup');
}));

app.get('/Fixtures', asyncWrapper(async (req, res) => {
  await runTaskWithWorker(req, res, 'FixtureUpdate');
}));

app.get('/PlayerPerformance', asyncWrapper(async (req, res) => {
  await runTaskWithWorker(req, res, 'PlayerPerformanceUpdate');
}));

app.get('/SyncTeams', asyncWrapper(async (req, res) => {
  await runTaskWithWorker(req, res, 'SyncTeams');
}));

app.get('/SyncLeagueTables', asyncWrapper(async (req, res) => {
  await runTaskWithWorker(req, res, 'SyncLeagueTables');
}));

app.get('/fullupdate', asyncWrapper(async (req, res) => {
  await runTaskWithWorker(req, res, 'FULLUPDATE');
}));

app.listen(PORT, () => {
  console.log(`Statto updater is listening on port ${PORT}`);
});


  // Create an async wrapper function for routes
/* function asyncWrapper(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}


// FRANCHISE SETUP
app.get("/FranchiseSetup", asyncWrapper(async (req, res) => {
  try {
    const { FranchiseID } = req.query;
    const runner = new FullUpdateTaskRunner(FranchiseID, tasks.FranchiseSetup);
    const result = await runner.start();
    res.status(200).send(result);
  } catch (error) {
    console.error(error);
    res.status(500).send("An error occurred while running the tasks");
  }
}));

// Fixtures
app.get("/Fixtures", asyncWrapper(async (req, res) => {
  try {
    const { FranchiseID } = req.query;
    const runner = new FullUpdateTaskRunner(FranchiseID, tasks.FixtureUpdate);
    const result = await runner.start();
    res.status(200).send(result);
  } catch (error) {
    console.error(error);
    res.status(500).send("An error occurred while running the tasks");
  }
}));

// PlayerPerformance
app.get("/PlayerPerformance",  asyncWrapper(async (req, res) => {
  try {
    const { FranchiseID } = req.query;
    const runner = new FullUpdateTaskRunner(
      FranchiseID,
      tasks.PlayerPerformanceUpdate
    );
    const result = await runner.start();
    res.status(200).send(result);
  } catch (error) {
    console.error(error);
    res.status(500).send("An error occurred while running the tasks");
  }
}));

// SyncTeams
app.get("/SyncTeams", asyncWrapper(async (req, res) => {
  try {
    const { FranchiseID  } = req.query;
    const runner = new FullUpdateTaskRunner(FranchiseID, tasks.SyncTeams);
    const result = await runner.start();
    res.status(200).send(result);
  } catch (error) {
    console.error(error);
    res.status(500).send("An error occurred while running the tasks");
  }
}));

// SyncLeagueTables
app.get("/SyncLeagueTables", asyncWrapper(async (req, res) => {
  try {
    const { FranchiseID } = req.query;
    const runner = new FullUpdateTaskRunner(
      FranchiseID,
      tasks.SyncLeagueTables
    );
    const result = await runner.start();
    res.status(200).send(result);
  } catch (error) {
    console.error(error);
    res.status(500).send("An error occurred while running the tasks");
  }
}));

// FULL UPDATE
app.get("/fullupdate", asyncWrapper(async (req, res) => {
  try {
    const { FranchiseID } = req.query;
    console.log( `Run QUERY on Franchise ${FranchiseID}`)
    const runner = new FullUpdateTaskRunner(FranchiseID, tasks.FULLUPDATE);
    const result = await runner.start();
    res.status(200).send(result);
  } catch (error) {
    console.error(error);
    res.status(500).send("An error occurred while running the tasks");
  }
}));

const PORT = process.env.PORT || 3000; // Use the assigned Heroku port or default to 3000 for local development

app.listen(PORT, () => {
  console.log(`Statto updater is listening on port  ${PORT}`);
});
 */