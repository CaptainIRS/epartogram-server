const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");

const PROTO_FILE = "./protos/monitor.proto";

const Patient = require("../models/Patient");
const { sendNotifcationToUserByUID } = require("../utils/notifications")

const options = {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
};

const pkgDefs = protoLoader.loadSync(PROTO_FILE, options);

//load Definition into gRPC
const proto = grpc.loadPackageDefinition(pkgDefs).rpcs;

//create gRPC server
const grpcServer = new grpc.Server();

//implement UserService
async function check(call, callback) {
    const notificationDatas = await Patient.checkAllPatients()
    for(let notifcationData of notificationDatas) {
       await sendNotifcationToUserByUID(notifcationData.uid, notifcationData.title, notifcationData.body)
    }
    callback(null, { message: "Success" });
}

grpcServer.addService(proto.MonitorService.service, {
    Check: check,
});


const serverCredentials = grpc.ServerCredentials.createInsecure();

module.exports = { grpcServer, serverCredentials };
