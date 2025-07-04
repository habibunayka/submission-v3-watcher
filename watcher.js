/**
 * ------------------------------------------------------------------------
 * Auto Project Extractor & Configuration Runner
 *
 * Author        : Habibunayka Miftah Al-Rizqi
 * Description   : Utility script for Submission V3 - Fundamental Backend.
 *                 Automatically extracts ZIP archives, locates each
 *                 project path, resets the PostgreSQL database,
 *                 and runs the project using fallback start commands.
 *
 * @version      : 1.0.0
 * @license      : MIT
 * @lastModified : 2025-07-04
 * ------------------------------------------------------------------------
 */

const fs = require("fs");
const fsPromises = require("fs/promises");
const path = require("path");
const { exec, spawn } = require("child_process");

const WATCH_DIR = __dirname;

// Change this
const CONFIG = {
    db: {
        host: "localhost",
        user: "postgres",
        password: "dev",
        database: "music_db",
        port: 5432,
    },
    smtp: {
        host: "smtp.gmail.com",
        port: 465,
        user: "your@email.com",
        password: "xxxx xxxx xxxx xxxx",
    },
    redis: {
        host: "localhost",
    },
    rabbitmq: {
        server: "amqp://localhost",
    },
    aws: {
        bucket: "xxxx",
        accessKeyId: "xxxx",
        secretAccessKey: "xxxx",
    },
    token: {
        accessKey:
            "xxxx",
        refreshKey:
            "xxxx",
        age: 1800,
    },
    app: {
        host: "localhost",
        port: 5000,
    },
};

const ENV_CONFIG = `
HOST=${CONFIG.app.host}
PORT=${CONFIG.app.port}

PGHOST=${CONFIG.db.host}
PGUSER=${CONFIG.db.user}
PGPASSWORD=${CONFIG.db.password}
PGDATABASE=${CONFIG.db.database}
PGPORT=${CONFIG.db.port}

ACCESS_TOKEN_KEY=${CONFIG.token.accessKey}
REFRESH_TOKEN_KEY=${CONFIG.token.refreshKey}
ACCESS_TOKEN_AGE=${CONFIG.token.age}

RABBITMQ_SERVER=${CONFIG.rabbitmq.server}
REDIS_SERVER=${CONFIG.redis.host}

AWS_BUCKET_NAME=${CONFIG.aws.bucket}
AWS_ACCESS_KEY_ID=${CONFIG.aws.accessKeyId}
AWS_SECRET_ACCESS_KEY=${CONFIG.aws.secretAccessKey}

SMTP_HOST=${CONFIG.smtp.host}
SMTP_PORT=${CONFIG.smtp.port}
SMTP_USER=${CONFIG.smtp.user}
SMTP_PASSWORD=${CONFIG.smtp.password}
`.trim();

// ZIP extractor
async function extractZip(zipPath, destDir) {
    const cmd = `powershell -Command "Expand-Archive -Path '${zipPath}' -DestinationPath '${destDir}' -Force"`;
    await execShell(cmd, WATCH_DIR);
}

// Command executor
function execShell(cmd, cwd) {
    return new Promise((resolve, reject) => {
        exec(cmd, { cwd }, (err, stdout, stderr) => {
            if (err) return reject(stderr);
            resolve(stdout);
        });
    });
}

// Dropping all tables in database
async function dropAllTables() {
    return new Promise((resolve, reject) => {
        const psql = spawn(
            "psql",
            ["-U", CONFIG.db.user, "-d", CONFIG.db.database],
            {
                stdio: ["pipe", "inherit", "pipe"],
                env: { ...process.env, PGPASSWORD: CONFIG.db.password },
            }
        );

        const sql = `
DO $$ DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = current_schema()) LOOP
        EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.tablename) || ' CASCADE';
    END LOOP;
END $$;
        `;

        psql.stdin.write(sql);
        psql.stdin.end();

        let errorOutput = "";
        psql.stderr.on("data", (data) => {
            errorOutput += data.toString();
        });

        psql.on("exit", (code) => {
            if (code === 0) resolve();
            else
                reject(
                    new Error(
                        `⛔ Psql exited with code ${code}: ${errorOutput}`
                    )
                );
        });
    });
}

// Running `npm run start` command in other cmd
function runStartCommand(cwd) {
    const fullCmd = `start "" cmd /k "cd /d \"${cwd}\" && npm run start"`;
    console.log(`🚀 Launching: npm run start in CMD (${cwd})`);
    exec(fullCmd);
}

// Main process
async function processZip(zipFile) {
    const zipName = path.basename(zipFile, ".zip");
    const extractPath = path.join(WATCH_DIR, zipName);

    try {
        // Step 1: Extract ZIP
        await extractZip(zipFile, extractPath);
        console.log(`✅ Extracted: ${zipFile}`);

        let baseDir = extractPath;

        // Step 2: Check folder
        while (true) {
            const entries = await fsPromises.readdir(baseDir, {
                withFileTypes: true,
            });
            const folders = entries.filter((dirent) => dirent.isDirectory());

            if (folders.length === 1) {
                baseDir = path.join(baseDir, folders[0].name);
                continue;
            }

            if (folders.length !== 2) {
                console.log(
                    `⛔ Expected exactly 2 folders, got ${folders.length}. Skipping...`
                );
                return;
            }

            break;
        }

        const entries = await fsPromises.readdir(baseDir, {
            withFileTypes: true,
        });
        const folders = entries.filter((dirent) => dirent.isDirectory());

        const folderNames = folders.map((f) => f.name);
        const apiFolder = folderNames.find(
            (name) =>
                /api|producer|back-end|backend/i.test(name) ||
                name === "custom-name" // If student submission has custom name
        );

        const consumerFolder = folderNames.find((name) => name !== apiFolder);

        if (!apiFolder || !consumerFolder) {
            console.log("⛔ Required folders not found. Skipping.");
            return;
        }

        // Step 3: Get folder path
        const apiPath = path.join(baseDir, apiFolder);
        const otherPath = path.join(baseDir, consumerFolder);

        // Step 4: npm install on api
        try {
            console.log("📦 Running npm install in API folder...");
            await execShell("npm i", apiPath);
        } catch (err) {
            console.log("⚠️ npm install failed in API folder. Skipping...");
            return;
        }

        // Step 5: Drop all tables
        try {
            console.log("🧨 Dropping all tables...");
            await dropAllTables();
        } catch (err) {
            console.log("⛔ Failed to drop tables:", err);
            return;
        }

        const writeEnvFile = async (targetPath) => {
            const envPath = path.join(targetPath, ".env");
            try {
                await fsPromises.writeFile(envPath, ENV_CONFIG);
                console.log(`📝 .env file written to ${envPath}`);
            } catch (err) {
                console.log(`⚠️ Failed to write .env in ${envPath}:`, err);
            }
        };

        await writeEnvFile(apiPath);
        await writeEnvFile(otherPath);

        // Step 7: Run migration
        try {
            console.log("🚀 Running migration...");
            await execShell("npm run migrate up", apiPath);
        } catch (err) {
            console.log("⚠️ Migration failed:", err);
        }

        // Step 8: npm install on consumer folder
        try {
            console.log("📦 Running npm install in consumer folder...");
            await execShell("npm i", otherPath);
        } catch (err) {
            console.log("⚠️ npm install failed in consumer folder.");
        }

        const finalDir = path.dirname(otherPath);

        // Step 9: Running project at api and consumer folder
        await runStartCommand(apiPath);
        await runStartCommand(otherPath);

        // Step 10: Open in VSCode
        try {
            console.log("🧠 Opening folder in VS Code...");
            await execShell("code .", finalDir);
        } catch (err) {
            console.log("⚠️ Gagal membuka folder di VS Code.");
        }

        // Step 11: Delete Zip (Optional)
        try {
            await fsPromises.unlink(zipFile);
            console.log(`🗑️ Deleted zip file: ${zipFile}`);
        } catch (err) {
            console.log(`⚠️ Failed to delete zip file: ${zipFile}`, err);
        }

        console.log("✅ DONE!");
    } catch (err) {
        console.error("❌ Error during processing:", err);
    }
}

// Watcher
fs.watch(WATCH_DIR, async (eventType, filename) => {
    if (eventType === "rename" && filename.endsWith(".zip")) {
        const zipPath = path.join(WATCH_DIR, filename);

        const waitForFileReady = async (path, timeout = 3000) => {
            let lastSize = 0;
            for (let i = 0; i < timeout / 500; i++) {
                try {
                    const { size } = await fsPromises.stat(path);
                    if (size === lastSize) return true;
                    lastSize = size;
                    await new Promise((res) => setTimeout(res, 500));
                } catch (_) {}
            }
            return false;
        };

        const ready = await waitForFileReady(zipPath);
        if (ready) {
            processZip(zipPath);
        } else {
            console.log(`⚠️ File ${filename} is not stable. Skipping.`);
        }
    }
});
