const SyncLeagues = require("../tasks/Franchise/syncLeagues");
const FindAllFranchiseTeams = require("../tasks/FindAllFranchiseTeams/index");
const SyncLeagueFixtures = require("../tasks/Fixtures/index");

const PlayerSync = require("../tasks/playerSync/index");
const PerformanceSync = require("../tasks/PlayerPerformances/index")
const TeamMetaData = require("../tasks/TeamMetaData/index")
const FixtureResults = require("../tasks/FixtureResults/index")
const TeamLogos = require("../tasks/TeamLogos/index")

const GetLeaugeTable = require('../tasks/GetLeagueTable')
const GetFranchiseStats = require('../tasks/FranchiseStats/index') 

// INIT CLASS SYNC FRANCHISES 
async function RunSyncLeagues(FranchiseID) {
  const syncLeaguesInstance = new SyncLeagues();
  const TaskStatus = await syncLeaguesInstance.run(FranchiseID);
  console.log(TaskStatus);
  return TaskStatus;
}

// INIT CLASS SYNC ALL TEAMS IN FRACNHISE TO LEAGUES
async function RunFindAllFranchiseTeams(FranchiseID){ 
  
  const FindAllFranchiseTeamsInstance = new FindAllFranchiseTeams();
  const TaskStatus = await FindAllFranchiseTeamsInstance.run(FranchiseID);
  console.log(TaskStatus);
  return TaskStatus;
}


// INIT CLASS SYNC ALL TEAMS IN FRACNHISE TO LEAGUES
async function RunSyncLeagueFixtures(FranchiseID){ 
   
  const SyncLeagueFixturesInstance = new SyncLeagueFixtures();
  const TaskStatus = await SyncLeagueFixturesInstance.run(FranchiseID);
  console.log(TaskStatus);
  return TaskStatus;
}

// INIT CLASS SYNC ALL PLAYERS IN FRACNHISE TO LEAGUES
async function RunSyncPlayers(FranchiseID){ 
  
  const  PlayerSyncInstance = new PlayerSync();
  const TaskStatus = await PlayerSyncInstance.run(FranchiseID);
  console.log(TaskStatus);
  return TaskStatus;
}

// INIT CLASS SYNC ALL PLAYERS IN FRACNHISE TO LEAGUES
async function RunPerformanceSync(FranchiseID){  
  
  const  PerformanceSyncInstance = new PerformanceSync();
  const TaskStatus = await PerformanceSyncInstance.run(FranchiseID);
  console.log(TaskStatus);
  return TaskStatus;
}

// INIT CLASS SYNC ALL PLAYERS IN FRACNHISE TO LEAGUES
async function RunTeamMetaData(FranchiseID){ 
  
  const  TeamMetaDataInstance = new TeamMetaData();
  const TaskStatus = await TeamMetaDataInstance.run(FranchiseID);
  console.log(TaskStatus);
  return TaskStatus;
}

// INIT CLASS SYNC ALL PLAYERS IN FRACNHISE TO LEAGUES
async function RunFixtureResults(FranchiseID){ 
  
  const  RunFixtureResultsInstance = new FixtureResults();
  const TaskStatus = await RunFixtureResultsInstance.run(FranchiseID);
  console.log(TaskStatus);
  return TaskStatus;
}

// INIT CLASS SYNC ALL PLAYERS IN FRACNHISE TO LEAGUES
async function RunTeamLogos(FranchiseID){ 
  
  const  TeamLogosInstance = new TeamLogos();
  const TaskStatus = await TeamLogosInstance.run(FranchiseID);
  console.log(TaskStatus);
  return TaskStatus;
}

// INIT Get the LEague Table for the WAtchlists

async function RunGetLeaugeTable(FranchiseID){ 
  
  const  GetLeaugeTableInstance = new GetLeaugeTable();
  const TaskStatus = await GetLeaugeTableInstance.run(FranchiseID);
  console.log(TaskStatus);
  return TaskStatus;
}


async function RunGetFranchiseStats(FranchiseID){ 
  
  const  GetFranchiseStatsInstance = new GetFranchiseStats();
  const TaskStatus = await GetFranchiseStatsInstance.run(FranchiseID);
  console.log(TaskStatus);
  return TaskStatus;
}



module.exports = {
  RunSyncLeagues,
  RunFindAllFranchiseTeams,
  RunSyncLeagueFixtures,
  RunSyncPlayers,
  RunPerformanceSync,
  RunTeamMetaData,
  RunFixtureResults,
  RunTeamLogos,
  RunGetLeaugeTable,
  RunGetFranchiseStats

};
