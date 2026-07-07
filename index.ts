import cluster from 'cluster'
import os from 'os'

import { Logger } from './src/Modules/Logger'

import { FragmentInstance } from './src/Modules/FragmentTypes'

import { Moonfaker } from './src/Moonfaker';

const clusterLogger = new Logger("Cluster");

const FragmentInstances: FragmentInstance[] = [ 
    new FragmentInstance("Moonfaker", Moonfaker)
]

const FragmentCrashCache: Map<Number, Number[]> = new Map<Number, Number[]>();

if (cluster.isPrimary) {
    clusterLogger.info(`Primary Process Started: ${process.pid}`);

    for (var i = 0; i < FragmentInstances.length; i++) {
        const fragmentInstance: FragmentInstance = FragmentInstances[i];

        var worker: cluster.Worker = cluster.fork({ WORKER_INDEX: i });
        
        (worker as any).workerIndex = i;
    }

    cluster.on('exit', (worker: cluster.Worker, errorCode: number, signal: string) => {
        const WorkerIndex: any = ((worker as any).workerIndex);
        const FragmentEntry: FragmentInstance = FragmentInstances[WorkerIndex];

        clusterLogger.error(`Cluster Fragment Died - ${FragmentEntry.name}`);

        var CrashList: Number[] = FragmentCrashCache.get(WorkerIndex) || [];
        CrashList.push(Date.now());
        FragmentCrashCache.set(WorkerIndex, CrashList);

        var recentCrashes: number = 0;
        for (let i = (CrashList.length - 1); i >= 0; i--) {
            var crashDate: any = CrashList[i];

            if (Date.now() - crashDate < 20000) {
                recentCrashes++;
            }
        }

        if (recentCrashes >= 2) {
            clusterLogger.error(`Fragment ${FragmentEntry.name} has crashed ${recentCrashes} times in the last 20 seconds, ${CrashList.length} in total. Closing server for integrity reasons`);
            process.exit(0);
        }

        const newWorker = cluster.fork({ WORKER_INDEX: WorkerIndex });
        (newWorker as any).workerIndex = WorkerIndex;
    });
    

} else {
    const WorkerIndex: any = process.env.WORKER_INDEX;
    const FragmentEntry: any = FragmentInstances[WorkerIndex];
    clusterLogger.info(`Starting Fragment: ${FragmentEntry.name} - Worker PID: ${process.pid}`);

    const fragment = new (FragmentEntry.instance as any)();
    await fragment.Create();

    process.on("SIGTERM", async () => {
        await fragment.Destroy?.();
        process.exit(0);
    });

    process.on("SIGINT", async () => {
        await fragment.Destroy?.();
        process.exit(0);
    });
}