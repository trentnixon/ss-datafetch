const express = require("express");
const app = express();

const FullUpdateTaskRunner = require("./TaskRunner");
/*
  TODO:

*/

// Tasks
const tasks = require("./lib/TASKS");
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

  // Create an async wrapper function for routes
function asyncWrapper(fn) {
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
  console.log("Statto updater is listening on port 3000!");
});
