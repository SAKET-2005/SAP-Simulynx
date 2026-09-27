import cds from "@sap/cds";

async function main() {
  console.log("=================================================");
  console.log("SAP Simulynx - Database Initialization & Seeding");
  console.log("=================================================");

  try {
    // Connect to CAP runtime
    const csn = await cds.load(["db/schema", "srv/simulynx-service"]);
    cds.model = cds.compile.for.nodejs(csn);

    const db = await cds.connect.to("db");
    console.log("Connected to database successfully.");

    // Deploy schema to database (e.g. SQLite for local, or HANA)
    await cds.deploy(csn).to(db);
    console.log("Schema deployed successfully.");

    // Serve services programmatically
    console.log("Serving SimulynxService...");
    const services = await cds.serve("all").from(csn);
    const srv = services.SimulynxService || (await cds.connect.to("SimulynxService"));
    console.log("Seeding demo data (300 personas + 5 enterprise scenarios)...");

    const result = await srv.send("seedDemoData", {});
    console.log("Seeding completed successfully!");
    console.log(`- Personas: ${result.personaCount}`);
    console.log(`- Scenarios: ${result.scenarioCount}`);
    console.log(`- Active Simulations: ${result.simulationCount}`);
    console.log("=================================================");
    process.exit(0);
  } catch (err) {
    console.error("Seeding failed with error:", err);
    process.exit(1);
  }
}

main();
