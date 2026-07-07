import { Logger } from "../Modules/Logger";
import { Fragment } from "../Modules/FragmentTypes"
import { Upload } from "../upload";

export class Moonfaker extends Fragment {
    private logger: Logger = new Logger("Moonfaker");
    private server!: ReturnType<typeof Bun.serve>;
    private upload: Upload = new Upload();

    constructor() { super(); }

    async Create(): Promise<void> {
        this.server = Bun.serve({
            port: "7125",
            fetch: this.handleRequest.bind(this),
        });

        this.logger.info(`Listening on port ${this.server.port}`);
    }

    private async handleRequest(req: Request): Promise<Response> {
        const url = new URL(req.url);

        if (req.method === "OPTIONS") {
            return new Response(null, {
                status: 204,
                headers: {
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
                    "Access-Control-Allow-Headers": "Authorization, Content-Type",
                },
            });
        }

        const response = await this.routeRequest(url, req);
        
        response.headers.set("Access-Control-Allow-Origin", "*");
        return response;
    }

    private async routeRequest(url: URL, req: Request): Promise<Response> {
        switch (url.pathname) {
            case "/server/info": {
                if (req.method !== "GET") {
                    return new Response("Method Not Allowed", { status: 405 });
                }
                
                return new Response(JSON.stringify({
                    result: {
                        klippy_connected: true,
                        klippy_state: "ready",
                        components: ["file_manager"],
                        registered_directories: ["gcodes"],
                        moonraker_version: "elegoo-cc2",
                        api_version_string: "1.5.0-cc2",
                    }
                }));
            }

            case "/server/files/upload": {
                if (req.method !== "POST") {
                    return new Response("Method Not Allowed", { status: 405 });
                }

                if (!req.headers.get("content-type")?.startsWith("multipart/form-data")) {
                    return new Response("Unsupported Media Type", { status: 415 });
                }

                const formData = await req.formData();
                const file = formData.get("file") as File;

                if (!file) {
                    return new Response("No file provided", { status: 400 });
                }

                const fileName = file.name.endsWith(".gcode")
                      ? file.name
                        : `${file.name}.gcode`;

                const arrayBuffer = await file.arrayBuffer();
                const buffer = Buffer.from(arrayBuffer);

                await this.upload.uploadToPrinter(fileName, {
                    buffer: buffer,
                    originalname: fileName,
                    mimetype: file.type,
                    size: file.size
                });
                return new Response(JSON.stringify({ result: "ok" }));
            }

            case "/printer/print/start": {
            }
            
            default:
                return new Response("Not Found", { status: 404 });
        }
    }

    public async Destroy(): Promise<void> {
        this.server.stop();
    }
}