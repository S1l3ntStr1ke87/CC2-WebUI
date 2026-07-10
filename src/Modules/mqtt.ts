import mqtt from "mqtt";
import { SQLiteDB } from "./SQLiteDB";

const db = new SQLiteDB();
const PRINTER_IP = process.env.PRINTER_IP || await db.getPrinterIP();
const PINCODE = process.env.PINCODE || await db.getPincode();

export class MQTT {
    private client: mqtt.MqttClient | null = null;

    private constructor() {}

    public async connect(): Promise<void> {
        const clientId = `cc2_disc_${Math.floor(1000 + Math.random() * 9000)}`;
        mqtt.connect(`mqtt://${PRINTER_IP}:1883`, {
            clientId,
            username: "elegoo",
            password: PINCODE || "",
            clean: true,
            keepalive: 60,
            connectTimeout: 8000,
        });
    }
}