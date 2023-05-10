import {
  Server,
  ServerCredentials,
  ServerUnaryCall,
  sendUnaryData,
} from "@grpc/grpc-js";

import { CheckRequest, CheckResponse } from "../proto/rpcs/v1/monitor";

import { sendNotificationToUserByUID } from "../utils/notifications";
import { getPendingMeasurements } from "../crud/patient";
import { monitorServiceDefinition } from "../proto/rpcs/v1/monitor.grpc-server";

const grpcServer = new Server();

async function check(
  call: ServerUnaryCall<CheckRequest, CheckResponse>,
  callback: sendUnaryData<CheckResponse>
) {
  const pendingMeasurements = await getPendingMeasurements();
  for (let pendingMeasurement of pendingMeasurements) {
    await sendNotificationToUserByUID(
      pendingMeasurement.nurse,
      `Need to measure ${pendingMeasurement.patientName}'s ${pendingMeasurement.measurementName}`
    );
  }
  callback(null, {});
}

grpcServer.addService(monitorServiceDefinition, { Check: check });

const serverCredentials = ServerCredentials.createInsecure();

export { grpcServer, serverCredentials };
