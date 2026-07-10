import { Logger } from "./Cluster/Logger";
import sqlite3 from "sqlite3";
import crypto from "crypto";
import fs from "fs";

const DATA_DIR = process.env.DATA_DIR || "./data";

if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

export class SQLiteDB {
    private logger: Logger = new Logger("SQLiteDB");
    private db!: sqlite3.Database;

    constructor() {
        this.db = new sqlite3.Database(`${DATA_DIR}/cc2.db`, (err) => {
            if (err) {
                this.logger.error("Error opening database:", err.message);
            }
        });

        this.db.serialize(() => {
            this.db.run(`
                CREATE TABLE IF NOT EXISTS printer_config (
                    id INTEGER PRIMARY KEY CHECK (id = 1),
                    ip TEXT NOT NULL DEFAULT '',
                    printer_id TEXT NOT NULL DEFAULT '',
                    pincode TEXT NOT NULL DEFAULT ''
                )
            `);
            this.db.run(`
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
            this.db.run(
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
            this.db.get("SELECT * FROM printer_config WHERE id = 1", (err: Error | null, row: any) => {
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

    async updatePincode(pincode: string): Promise<void> {
        return new Promise((resolve, reject) => {
            this.db.run("UPDATE printer_config SET pincode = ? WHERE id = 1", [pincode], (err: Error | null) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }

    async updatePrinterIP(ip: string): Promise<void> {
        return new Promise((resolve, reject) => {
            this.db.run("UPDATE printer_config SET ip = ? WHERE id = 1", [ip], (err: Error | null) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }

    async getPincode(): Promise<string> {
        return new Promise((resolve, reject) => {
            this.db.get("SELECT pincode FROM printer_config WHERE id = 1", (err: Error | null, row: any) => {
                if (err) reject(err);
                else resolve(row?.pincode || "");
            });
        });
    }

    async getPrinterIP(): Promise<string> {
        return new Promise((resolve, reject) => {
            this.db.get("SELECT ip FROM printer_config WHERE id = 1", (err: Error | null, row: any) => {
                if (err) reject(err);
                else resolve(row?.ip || "");
            });
        });
    }
}