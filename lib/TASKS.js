// Init Classes
const INIT = require("./InitClasses");

// TASK OBJ
const FranchiseInit = {
  name: "SyncLeagues",
  description: "Updating Leagues",
  func: INIT.RunSyncLeagues,
};

const FindAllFranchiseTeams = {
  name: "FindAllFranchiseTeams",
  description: "Finding Teams in Franchise",
  func: INIT.RunFindAllFranchiseTeams,
};
const SyncLeagueFixtures = {
  name: "SyncLeagueFixtures",
  description: "Looking for Fixtures",
  func: INIT.RunSyncLeagueFixtures,
};

const RunSyncPlayers = {
  name: "RunSyncPlayers",
  description: "Looking for Players",
  func: INIT.RunSyncPlayers,
};

const RunPerformanceSync = {
  name: "RunPerformanceSync",
  description: "Looking for Performances",
  func: INIT.RunPerformanceSync,
};

const RunTeamMetaData = {
  name: "RunTeamMetaData",
  description: "Looking for Team Meta Data",
  func: INIT.RunTeamMetaData,
};

const RunFixtureResults = {
  name: "RunFixtureResults",
  description: "Looking for Fixture Results",
  func: INIT.RunFixtureResults,
};

const RunTeamLogos = {
  name: "RunTeamLogos",
  description: "Looking for Team Logos",
  func: INIT.RunTeamLogos,
};

const RunGetLeaugeTable={
  name: "RunGetLeaugeTable",
  description: "Looking for RunGetLeaugeTable",
  func: INIT.RunGetLeaugeTable,
  
}


// Task Groupings
const FULLUPDATE = [
  FranchiseInit,
  FindAllFranchiseTeams,
  SyncLeagueFixtures,
  RunSyncPlayers,
  RunFixtureResults,
  RunPerformanceSync,
  RunTeamMetaData,
  RunTeamLogos, 
  RunGetLeaugeTable,
];
const FranchiseSetup = [
  FranchiseInit,
  FindAllFranchiseTeams,
  SyncLeagueFixtures,                                                    
];

const FixtureUpdate = [
  RunFixtureResults,
  RunSyncPlayers,
  RunPerformanceSync, 
];
const PlayerPerformanceUpdate = [
  RunSyncPlayers,
  RunPerformanceSync,
];

const SyncTeams = [
  FranchiseInit,
  FindAllFranchiseTeams,
  RunTeamMetaData,
  RunTeamLogos, 
];

const SyncLeagueTables = [
  RunGetLeaugeTable
];

// Export task groupings
module.exports = {
  FULLUPDATE,
  FranchiseSetup,
  FixtureUpdate,
  PlayerPerformanceUpdate,
  SyncTeams,
  SyncLeagueTables
};
