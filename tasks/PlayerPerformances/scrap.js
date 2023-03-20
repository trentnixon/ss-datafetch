const cheerio = require("cheerio");
const axios = require("axios");
const dotenv = require("dotenv");
dotenv.config();

const selectors = {
  ParentSelector: "#scorecard-2020-table-block",
  PlayerName: ".sc-player-name",
  PlayerOut: ".sc-player-how-out",
  InfoBlock: "#scorecard-2020-match-info-block",
  STATS_CATCHES: "#scorecard-2020-stats-top-fielders",
  MOMContainer: "#scorecard-2020-pog-container",
  MOMField: "#scorecard-2020-pog-content-left-name",
};

class Scrap {
  //******************************************* */
  // Methods
  //******************************************* */

  fetchURL = async (LEAGUE) => {
    const FixtureID = LEAGUE.attributes.fixtureID;
    const StrapiID = LEAGUE.id;
    const inningsPaths = [
      `${process.env.LMS_ScrapURL}${process.env.LMS_PATH_Innings_1}${FixtureID}`,
      `${process.env.LMS_ScrapURL}${process.env.LMS_PATH_Innings_2}${FixtureID}`,
    ];

    const fixtureStatsPath = `${process.env.LMS_ScrapURL}${process.env.LMS_PATH_Fixture_Stats}${FixtureID}`;
    console.log("fixtureStatsPath ", fixtureStatsPath)
    const fixtureStats = await getInfo(fixtureStatsPath);

    const catchesObj = await getGameCatches(fixtureStats);
    const isManOfMatch = await findManOfMatch(fixtureStats);

    // Get the Fixtures INFO
    const InfoPath = `${process.env.LMS_ScrapURL}${process.env.LMS_PATH_Matchinfo}${FixtureID}`;
    const FIXTUREINFO = await getInfo(InfoPath);
    const INFOSTATS = await createInfoStats(FIXTUREINFO, LEAGUE);

    //console.log(FixtureID, INFOSTATS)

    if (
      INFOSTATS.BattedFirstOBJ === undefined ||
      INFOSTATS.BattedSecondOBJ === undefined
    ) {
      console.log(`"No Game Data for this game" ${FixtureID}`);
      console.log(INFOSTATS);
      // this could be wrong!!!
      //this.MovePointer();
    } else {
      // Get 1stINNGS
      const FIRSTINN = await getInfo(inningsPaths[0]);
      const FIRSTINN_BATTINGOBJ = createBattingObj(
        FIRSTINN,
        INFOSTATS.BattedFirstOBJ.id,
        StrapiID
      );
      const FIRSTINN_BOWLINGOBJ = createBowlingObj(
        FIRSTINN,
        INFOSTATS.BattedSecondOBJ.id,
        StrapiID
      );

      // Get 2ndINNGS
      const SECINN = await getInfo(inningsPaths[1]);
      const SECINN_BATTINGOBJ = createBattingObj(
        SECINN,
        INFOSTATS.BattedSecondOBJ.id,
        StrapiID
      );
      const SECINN_BOWLINGOBJ = createBowlingObj(
        SECINN,
        INFOSTATS.BattedFirstOBJ.id,
        StrapiID
      );
      //console.log(SECINN_BATTINGOBJ, SECINN_BOWLINGOBJ);

      const Merged = mergeArraysByName([
        FIRSTINN_BATTINGOBJ,
        FIRSTINN_BOWLINGOBJ,
        SECINN_BATTINGOBJ,
        SECINN_BOWLINGOBJ,
        catchesObj,
        isManOfMatch,
      ]);
      //console.log("Merged.length ",Merged.length);

      // now add these items to the DB
      return Merged;
    }
  };

  async startScraping(DATA) {
    //console.log(DATA)
    const OBJ = [];
    this.DATA = DATA;
    for (let i = 0; i < this.DATA.length; i++) {

      console.log(`Fetching Player Performces : ${i} of ${this.DATA.length}`)
      const isGame = await CheckifGameWentAhead( 
        this.DATA[i].attributes.fixtureID
      );

      isGame.isGame != undefined
        ? OBJ.push(await this.fetchURL(this.DATA[i]))
        : [];
    }

    const mergedArray = mergeArrays(OBJ);
    /* console.log("mergedArray")
    console.log(mergedArray.length, this.DATA.length) */
  
     return mergedArray;
  }
}

module.exports = Scrap;

/* ********************************************************************** */
// UTILS

const mergeArrays = (arrays) => {
  const mergedArray = [].concat(...arrays);
  return mergedArray;
};

const mergeArraysByName = (arrays) => {
  const result = [];
  const map = new Map();
  arrays.forEach((array) => {
    array.forEach((obj) => {
      const name = obj.Name;
      if (!map.has(name)) {
        map.set(name, { ...obj });
      } else {
        const existingObj = map.get(name);
        map.set(name, { ...existingObj, ...obj });
      }
    });
  });
  map.forEach((obj) => {
    result.push(obj);
  });
  return result;
};

MergeSTATS_onName = (OBJ1, OBJ2) => {
  return map(OBJ1, function (item) {
    return extend(item, find(OBJ2, { Name: item.Name }));
  });
};

Split = (STRING, VIA) => {
  return STRING.split(VIA);
};

removeSpecial = (STR) => {
  return STR.replace(/[^A-Z0-9]+/gi, "_");
};
removeUnderScorewithSpace = (STR) => {
  return STR.replace("_", " ");
};

getInfo = async (InfoPath) => {
  try {
    const response = await axios.get(InfoPath);
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

CheckIntisNotEmpty = (INT) => {
  if (isNaN(INT) || INT.length === 0) return 0;
  return INT;
};

findStrapiID = (ID) => {
  const PLAYER_STRAPI_ID = this.GAMEROSTER.find((o) => o.PlayerID === ID);

  if (!PLAYER_STRAPI_ID) {
    //console.log(`Player ID ${ID} missing from list`);
    return false;
  }

  if (!PLAYER_STRAPI_ID.STRAPIID) {
    //console.log(`Player ID ${ID} has no STRAPIID`);
    return false;
  }

  return PLAYER_STRAPI_ID.STRAPIID;
};

CheckifGameWentAhead = async (fixtureID) => {
  // Get the Fixtures STATS
  const InfoPath = `${process.env.LMS_ScrapURL}${process.env.LMS_PATH_Matchinfo}${fixtureID}`;
  //console.log(InfoPath)
  const FIXTUREINFO = await getInfo(InfoPath);
  Info = cheerio.load(FIXTUREINFO);
  const INFOBLOCK = Info(selectors.InfoBlock);
  const isGame = Split(
    INFOBLOCK.find("div.match-info-div:nth-child(7)").text(),
    ":"
  )[1];

  isGame != undefined ? true : false;

  return { isGame: isGame };
};

/* ********************************************************************** */
// GAME DATA UTILS
const findManOfMatch = (fixtureStats) => {

  const $info = cheerio.load(fixtureStats);
  const momFieldBlock = $info(selectors.MOMField);
  //console.log(momFieldBlock)
  if (momFieldBlock.length !== 0) {
    const linkSplit = momFieldBlock.find("a").attr("href").split("=");
    return [
      {
        playerID: linkSplit[1],
        isMOM: true,
        Name: momFieldBlock.find("a").text(),
      },
    ];
  } else {
    return false;
  }
};

const getGameCatches = async (fixtureStat) => {
  const CATCHESANDSTUMPINGS = [];
  const $Info = cheerio.load(fixtureStat);
  const CATCHESBLOCK = $Info(selectors.STATS_CATCHES);

  const rows = CATCHESBLOCK.find("table tbody tr").slice(1);

  for (const row of rows) {
    const $row = $Info(row);
    const name = $row.find("td:nth-child(1)").text();
    const catches = $row.find("td:nth-child(2)").text();
    const stumpings = $row.find("td:nth-child(3)").text();
    const team = $row.find("td:nth-child(4)").text();
    CATCHESANDSTUMPINGS.push({
      Name: name,
      PLAYERS_Catches: catches,
      PLAYERS_Stumpings: stumpings,
      TeamName: [team],
    });
  }

  return CATCHESANDSTUMPINGS;
};

const createInfoStats = async (fixtureInfo, league) => {
  try {
    const $info = cheerio.load(fixtureInfo);
    const infoBlock = $info(selectors.InfoBlock);

    const battedFirst = removeSpecial(
      Split(
        infoBlock.find("div.match-info-div:nth-child(7)").text(),
        ":"
      )[1]?.trim()
    );

    const BattedFirstOBJ = league?.attributes?.teams?.data?.find(
      (team) =>
        removeSpecial(team.attributes.Name.trim()) === battedFirst.trim()
    );

    const BattedSecondOBJ = league?.attributes?.teams?.data?.find(
      (team) =>
        removeSpecial(team.attributes.Name.trim()) !== battedFirst.trim()
    );
    /* 
   
    console.log("Check Teams for id", league.id)
    console.log(league?.attributes?.teams?.data)
    console.log("battedFirst", battedFirst, battedFirst.length)
    console.log("BattedFirstOBJ", BattedFirstOBJ)
    console.log("BattedSecondOBJ", BattedSecondOBJ) */

    return {
      Tournament: Split(
        infoBlock.find("div.match-info-div:nth-child(2)").text(),
        ":"
      )[1]?.trim(),
      BattedFirst: removeUnderScorewithSpace(battedFirst),
      BattedFirstOBJ: BattedFirstOBJ,
      BattedSecondOBJ: BattedSecondOBJ,
    };
  } catch (error) {
    console.error(error);
    return null;
  }
};

const createBattingObj = (data, TEAMID, FixtureID) => {
  const battingArr = [];
  const $ = cheerio.load(data);

  const table = $(selectors.ParentSelector).find("table:first tbody");

  if (!table || !table.children().length) {
    console.log("Error: Table is empty");
    return battingArr;
  }

  table.children().each((i, el) => {
    if (i != 0) {
      const playerName = $(el).find(selectors.PlayerName).text();

      if (playerName.length != 0) {
        const linkSplit = $(el)
          .find(selectors.PlayerName)
          .find("a")
          .attr("href")
          .split("=");
        //const playerStrapiID = findStrapiID(linkSplit[1]);
        const playerStrapiID = true;
        if (playerStrapiID !== false) {
          battingArr.push({
            fixture: [FixtureID],
            Name: playerName,
            PlayerID: linkSplit[1],
            //StrapiID: playerStrapiID,
            Link: $(el).find(selectors.PlayerName).find("a").attr("href"),
            BATTING_HowOut: $(el).find(selectors.PlayerOut).text(),
            BATTING_Runs: CheckIntisNotEmpty(
              $(el).find("td:nth-child(2)").text()
            ),
            BATTING_Balls: CheckIntisNotEmpty(
              $(el).find("td:nth-child(3)").text()
            ),
            BATTING_fours: CheckIntisNotEmpty(
              $(el).find("td:nth-child(4)").text()
            ),
            BATTING_sixes: CheckIntisNotEmpty(
              $(el).find("td:nth-child(5)").text()
            ),
            BATTING_SR: CheckIntisNotEmpty(
              $(el).find("td:nth-child(6)").text()
            ),
            team: [TEAMID],
          });
        }
      }
    }
  });

  return battingArr;
};

//INFOSTATS.BattedFirstOBJ.id,FixtureID
const createBowlingObj = (DATA, TEAMID, FixtureID) => {
  const BowlingARR = [];
  const $ = cheerio.load(DATA);
  const rows = $(selectors.ParentSelector) 
    .find("table:nth-child(2) tbody")
    .children()
    .toArray()
    .slice(1); // skip first row

  rows.forEach((row) => {
    const playerName = $(row).find(selectors.PlayerName).text();
    if (playerName) {
      const linkSplit = $(row)
        .find(selectors.PlayerName)
        .find("a")
        .attr("href")
        .split("=");
      //const playerStrapiID = this.findStrapiID(linkSplit[1]);
      const playerStrapiID = true;
      if (playerStrapiID !== false) {
        const bowlingObj = {
          fixture: [FixtureID],
          Name: playerName,
          PlayerID: parseInt(linkSplit[1]),
          //player: [parseInt(linkSplit[1])],
          //StrapiID: playerStrapiID,
          BOWLING_Overs: CheckIntisNotEmpty(
            $(row).find("td:nth-child(2)").text()
          ),
          BOWLING_Runs: CheckIntisNotEmpty(
            $(row).find("td:nth-child(3)").text()
          ),
          BOWLING_Wkts: CheckIntisNotEmpty(
            $(row).find("td:nth-child(4)").text()
          ),
          BOWLING_Maidens: CheckIntisNotEmpty(
            $(row).find("td:nth-child(5)").text()
          ),
          BOWLING_Econ: CheckIntisNotEmpty(
            $(row).find("td:nth-child(6)").text()
          ),
          team: [TEAMID],
        };
        BowlingARR.push(bowlingObj);
      }
    }
  });

  return BowlingARR;
};
