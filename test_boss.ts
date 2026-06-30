import * as dotenv from "dotenv";
dotenv.config({ path: "./apps/api/.env" });

import PgBoss from 'pg-boss';

async function run() {
    const directUrl = process.env.DATABASE_URL!.replace('-pooler', '');
    console.log("Starting pg-boss with:", directUrl);
    const boss = new PgBoss(directUrl);
    boss.on('error', console.error);
    await boss.start();
    console.log("Started.");
    
    const jobId = await boss.send('test-job', { hello: 'world' });
    console.log("Sent job ID:", jobId);
    
    await boss.stop();
}

run().catch(console.error);
