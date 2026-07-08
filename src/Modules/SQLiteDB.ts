import { Logger } from "./Cluster/Logger";
import sqlite3 from "sqlite3";
import crypto from "crypto";
import fs from "fs";

const DATA_DIR = process.env.DATA_DIR || "./data";

if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

export class SQLiteDB {
    private database: sqlite3.Database;
    private logger: Logger = new Logger("SQLiteDB");

    constructor() {
        this.database = new sqlite3.Database(`${DATA_DIR}/cc2.db`, (err) => {
            if (err) {
                this.logger.error("Error opening database:", err.message);
            } else {
                this.logger.info("Opened the SQLite DB File Successfully.");
            }
        });

        this.database.serialize(() => {
            this.database.run(`
                CREATE TABLE IF NOT EXISTS printer_config (
                    id INTEGER PRIMARY KEY CHECK (id = 1),
                    ip TEXT NOT NULL DEFAULT '',
                    printer_id TEXT NOT NULL DEFAULT '',
                    pincode TEXT NOT NULL DEFAULT ''
                )
            `);
            this.database.run(`
                CREATE TABLE IF NOT EXISTS notifications_config (
                    id INTEGER PRIMARY KEY CHECK (id = 1),
                    kind TEXT NOT NULL DEFAULT '',
                    enabled INTEGER NOT NULL DEFAULT 0,
                    label TEXT NOT NULL DEFAULT '',
                    discord_webhook TEXT NOT NULL DEFAULT '',
                    webhook_url TEXT NOT NULL DEFAULT ''
                )
            `);
        });
    }

    async setPrinterConfig(ip: string, pincode: string): Promise<void> {
        return new Promise((resolve, reject) => {
            const printer_id = crypto.createHash("md5").update(ip + pincode).digest("hex");
            this.database.run(
                'INSERT OR REPLACE INTO printer_config (id, ip, printer_id, pincode) VALUES (1, ?, ?, ?)',
                [ip, printer_id, pincode],
                (err: Error | null) => {
                    if (err) reject(err);
                    else resolve();
                }
            );
        });
    }

    async getPrinterConfig(): Promise<{ ip: string; printer_id: string; pincode: string }> {
        return new Promise((resolve, reject) => {
            this.database.get("SELECT * FROM printer_config WHERE id = 1", (err: Error | null, row: any) => {
                if (err) reject(err);
                else {
                    resolve({
                        ip: row?.ip || "",
                        printer_id: row?.printer_id || "",
                        pincode: row?.pincode || "",
                    });
                }
            });
        });
    }

    async getPincode(): Promise<string> {
        return new Promise((resolve, reject) => {
            this.database.get("SELECT pincode FROM printer_config WHERE id = 1", (err: Error | null, row: any) => {
                if (err) reject(err);
                else resolve(row?.pincode || "");
            });
        });
    }

    async getPrinterIP(): Promise<string> {
        return new Promise((resolve, reject) => {
            this.database.get("SELECT ip FROM printer_config WHERE id = 1", (err: Error | null, row: any) => {
                if (err) reject(err);
                else resolve(row?.ip || "");
            });
        });
    }
}