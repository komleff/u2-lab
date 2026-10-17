import { WorkerController, type WorkerCommand } from "./protocol";
const controller = new WorkerController((m) => postMessage(m));
onmessage = (event: MessageEvent<WorkerCommand>) =>
  controller.handle(event.data);
setInterval(() => controller.pump(), 4);
