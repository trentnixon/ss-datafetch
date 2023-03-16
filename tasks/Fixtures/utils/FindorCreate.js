const fetcher = require("../../../utils/fetcher");
const qs = require("qs");

const PUTNEWITEM = async (URL, DATA) => {
  //console.log("PUTNEWITEM");
  return await fetcher(URL, "PUT", DATA);
};

const POSTNEWITEM = async (URL, DATA) => {
  //console.log("POSTNEWITEM", URL);
  return await fetcher(URL, "POST", DATA);
};

const AddUmpires = async (umpire, ID) => {
  const query = qs.stringify(
    {
      filters: {
        Name: {
          $eq: umpire.trim(),
        },
      },
    },
    {
      encodeValuesOnly: true, // prettify URL
    }
  );

  const umpires = await fetcher(`umpires?${query}`);

  if (umpires.length !== 0) {
    await PUTNEWITEM(`fixtures/${ID}`, { data: { umpire: [umpires[0].id] } });
  }

  return true;
};


async function AddGround(GROUND, ID) {
  const query = qs.stringify(
    {
      filters: {
        Name: {
          $eq: GROUND.trim(),
        },
      },
    },
    {
      encodeValuesOnly: true, // prettify URL
    }
  );

  const Grounds = await fetcher(`grounds?${query}`); 

  if (Grounds[0]?.id) {
    await PUTNEWITEM(`fixtures/${ID}`, { data: { ground: [Grounds[0].id] } });
    return Grounds[0].id;
  } else {
    const NEWITEM = await POSTNEWITEM(`grounds`, {
      data: { Name: GROUND.trim() },
    });

    await PUTNEWITEM(`fixtures/${ID}`, { data: { ground: [NEWITEM.id] } });
    return NEWITEM.id;
  }
}


async function Addteams(HOME, AWAY, ID) {
  //console.log("ADD TEAM", HOME, AWAY, ID)
  const QueryHome = qs.stringify(
    {
      filters: {
        Name: {
          $eq: HOME.trim(), 
        },
      },
    },
    {
      encodeValuesOnly: true, // prettify URL
    }
  );
  const QueryAWAY = qs.stringify(
    {
      filters: {
        Name: {
          $eq: AWAY.trim(),
        },
      },
    },
    {
      encodeValuesOnly: true, // prettify URL
    }
  );
  const HomeRes = await fetcher(`teams?${QueryHome}`);
  const AWAYRes = await fetcher(`teams?${QueryAWAY}`);

  if (HomeRes.length && AWAYRes.length) {
    await PUTNEWITEM(`fixtures/${ID}`, { data: { teams : [HomeRes[0]?.id, AWAYRes[0]?.id] } });
    return { status: true };
  } else {
    console.log('-----------------------------------------------')
    console.error(`Error storing Teams on Fixture ${ID}`)
    console.error(`Home Team ${HOME.trim()},  ${HomeRes[0]?.id}`)
    console.error(`Away Team ${AWAY.trim()}, ${AWAYRes[0]?.id}`)
    return { status: false };
  }
}


module.exports = {
  AddGround,
  Addteams,
  AddUmpires,
};
