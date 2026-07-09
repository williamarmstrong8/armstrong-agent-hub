import { StreetEasyClient, Areas } from "streeteasy-api";

const client = new StreetEasyClient();

async function search(label, input) {
  try {
    const res = await client.searchRentals(input);
    const edges = res.searchRentals?.edges ?? [];
    const hits = edges.filter((e) => {
      const s = (e.node.street ?? "").toLowerCase();
      return s.includes("186") && s.includes("2nd");
    });
    console.log(`\n=== ${label} ===`);
    console.log("totalCount:", res.searchRentals?.totalCount, "returned:", edges.length);
    if (hits.length) {
      for (const h of hits) {
        const n = h.node;
        console.log("FOUND:", n.id, n.street, n.unit, "$" + n.price, n.bedroomCount + "bd", n.geoPoint);
      }
    } else {
      const second = edges.filter((e) => (e.node.street ?? "").toLowerCase().includes("2nd"));
      console.log("186 2nd not in page. 2nd Ave listings on page:", second.slice(0, 8).map((e) => ({
        id: e.node.id,
        street: e.node.street,
        unit: e.node.unit,
        price: e.node.price,
        beds: e.node.bedroomCount,
      })));
    }
  } catch (e) {
    console.log(`\n=== ${label} FAILED ===`, String(e.message).slice(0, 120));
  }
}

await search("default EV 2br <=5200", {
  filters: {
    areas: [Areas.EAST_VILLAGE],
    rentalStatus: "ACTIVE",
    price: { lowerBound: null, upperBound: 5200 },
    bedrooms: { lowerBound: 2, upperBound: 2 },
  },
  sorting: { attribute: "PRICE", direction: "ASCENDING" },
  perPage: 40,
  page: 1,
});

await search("EV 2br <=5200 page2", {
  filters: {
    areas: [Areas.EAST_VILLAGE],
    rentalStatus: "ACTIVE",
    price: { lowerBound: null, upperBound: 5200 },
    bedrooms: { lowerBound: 2, upperBound: 2 },
  },
  sorting: { attribute: "PRICE", direction: "ASCENDING" },
  perPage: 40,
  page: 2,
});

await search("EV 2br <=5300 (wider)", {
  filters: {
    areas: [Areas.EAST_VILLAGE],
    rentalStatus: "ACTIVE",
    price: { lowerBound: null, upperBound: 5300 },
    bedrooms: { lowerBound: 2, upperBound: 2 },
  },
  sorting: { attribute: "PRICE", direction: "ASCENDING" },
  perPage: 40,
  page: 1,
});

process.exit(0);
