import { Fragment } from "../Modules/Cluster/FragmentTypes";
import { Logger } from "../Modules/Cluster/Logger";
import { Upload } from "../Modules/upload";
import path from "path";

export class Frontend extends Fragment {
    private logger: Logger = new Logger("Frontend");
    private server!: ReturnType<typeof Bun.serve>;
    private distDir = path.resolve(import.meta.dir, "./dist");

    constructor() { super(); }

    async Create(): Promise<void> {
        this.server = Bun.serve({
            port: "8080",
            fetch: this.handleRequest.bind(this),
        });

        this.logger.info(`Listening on port ${this.server.port}`);
    }

    private async handleRequest(req: Request): Promise<Response> {
        const url = new URL(req.url);

        const response = await this.routeRequest(url, req);
        
        response.headers.set("Access-Control-Allow-Origin", "*");
        return response;
    }

    private async routeRequest(url: URL, req: Request): Promise<Response> {
        switch (url.pathname) {
            case "/": {
                if (req.method !== "GET") {
                    return new Response("Method Not Allowed", { status: 405 });
                }

                const file = Bun.file(path.join(this.distDir, "index.html"))
                if (!(await file.exists())) {
                    return new Response("Vite Failed to build Dist Folder", { status: 500 });
                }
                return new Response(file)
            }
            
            default:
                return new Response("Not Found", { status: 404 });
        }
    }

    public async Destroy(): Promise<void> {
        this.server.stop();
    }
}