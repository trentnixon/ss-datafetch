var moment = require("moment"); // require
const STATSOBJ = {
  RUNS: 0,
  WICKETS: 0,
  OVERS: 0,
  FIXTURES: 0,
  SIXES: 0,
  FOURS: 0,
  Dismissal: {
    Bowled: 0,
    NotOut: 0,
    Caught: 0,
    RunOut: 0,
    Stumped: 0,
    LBW: 0,
  },
  Over50s: 0,
  Ducks: 0,
  FAS3: 0,
  AVGTOTALINNINGSRUNS: 0,
  AVGTOTALINNINGSWICKETS: 0,
  AVGTOTALINNINGSOVERS: 0,
  AVGBATTINGRUNS: 0,
  AVGWICKETS: 0,
  AVGBOWLINGECO: 0,
  AVGBOWLINGSTRIKERATE: 0,
  OverTheSeason: [],
  TeamStats: [],
};

class CricketStatsCalculator {
  constructor(fixtures) {
    this.fixtures = fixtures;
    this.stats = STATSOBJ;
  }

  async calculateStats() {
    const FranciseBasics = [];
  
    this.fixtures.map((fix, i) => {
        findTeamIndex(this.stats.TeamStats, fix.attributes.HomeTeam);
        findTeamIndex(this.stats.TeamStats, fix.attributes.AwayTeam);
      });

    for (const fixture of this.fixtures) {
      const f = fixture.attributes;
      // console.log(f)
      FranciseBasics.push(this.calculateFixtureBasics(f));
    }

    // loop ended
    const totalFranciseBasics = sumObjectValues(FranciseBasics);

    // merge objs
    this.stats = {
      ...this.stats,
      ...totalFranciseBasics,
    };

    // return to parent
    return this.stats;
  }

  calculateFixtureBasics(f) {
    const homeScore = splitScore(f.HomeTeamResult);
    const awayScore = splitScore(f.AwayTeamResult);

    const totalRuns = { RUNS: 0, WICKETS: 0, OVERS: 0, FIXTURES: 0 };

    if (homeScore && awayScore) {
      totalRuns.RUNS = homeScore[0] + awayScore[0];
      totalRuns.WICKETS = homeScore[1] + awayScore[1];
      totalRuns.OVERS = homeScore[2] + awayScore[2];
      totalRuns.FIXTURES = homeScore[3] + awayScore[3];
    }
    return totalRuns;
  }

  statsOverTheSeason() {}
}

module.exports = CricketStatsCalculator;

const splitScore = (score) => {
  if (score) {
    const [runStr, wicketStr] = score.split("/");

    const [wicketsTaken, overStr] = wicketStr.trim().split(" ");
    const oversBowled = parseFloat(overStr.replace(/[\(\)]/g, ""));

    if (isNaN(runStr) || isNaN(wicketsTaken) || isNaN(oversBowled)) {
      return [0, 0, 0, 0];
    }

    return [parseInt(runStr), parseInt(wicketsTaken), oversBowled, 1];
  }
};

function sumObjectValues(array) {
  return array.reduce((accumulator, currentValue) => {
    Object.entries(currentValue).forEach(([key, value]) => {
      accumulator[key] = (accumulator[key] || 0) + value;
    });
    return accumulator;
  }, {});
}


const findTeamIndex = (obj, name) => {
    let index = -1;
    for (let i = 0; i < obj.length; i++) {
      if (obj[i].Name === name) {
        index = i;
        break;
      }
    }
    if (index === -1) {
      obj.push({
        Name: name,
        GAMES: [],
        RUNSFOR: [],
        RUNSAGAINST: [],
        WICKETSFOR: [],
        WICKETSAGAINST: [],
        OVERS: [],
      });
      index = obj.length - 1;
    }
    return index;
  };
  