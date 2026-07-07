import { Logger } from "../Modules/Logger";
import { Fragment } from "../Modules/FragmentTypes"

export class Moonfaker extends Fragment {
    private logger: Logger = new Logger("Moonfaker");
    private server!: ReturnType<typeof Bun.serve>;

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
        const body = (await req.text()).trim();

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

        const response = await this.routeRequest(url, body, req);
        
        response.headers.set("Access-Control-Allow-Origin", "*");
        return response;
    }

    private async routeRequest(url: URL, body: string, req: Request): Promise<Response> {
        switch (url.pathname) {
            case "/server/info": {
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