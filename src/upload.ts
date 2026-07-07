import crypto from "crypto";
import { UploadedFile } from "../types";

const PRINTER_IP = process.env.PRINTER_IP || "";
const PINCODE = process.env.PINCODE || "";

export class Upload {
    async uploadToPrinter(fileName: string, file: UploadedFile): Promise<void> {
        const buffer = file.buffer;
        const total = buffer.length;
        const fileHash = crypto.createHash("md5").update(buffer).digest("hex");
        try {
            let start = 0;
            while (start < total) {
                const end = Math.min(start + 1024 * 1024, total);
                const chunk = buffer.slice(start, end);

                const response = await fetch(`http://${PRINTER_IP}/upload`, {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/octet-stream",
                        "Content-Length": chunk.length.toString(),
                        "Content-Range": `bytes ${start}-${end}/${total}`,
                        "X-File-Name": fileName,
                        "X-File-MD5": fileHash,
                        "X-Token": PINCODE,
                        "Accept": "application/json",
                        "User-Agent": "ElegooLink/1.0.1"
                    },
                    body: chunk
                });
                start = end;
            }
        } catch (error) {
            console.error("Error uploading file to printer:", error);
            throw error;
        }
    }
}