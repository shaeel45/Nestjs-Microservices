import * as runtime from "@prisma/client/runtime/client";
const config = {
    "previewFeatures": [],
    "clientVersion": "7.10.0",
    "engineVersion": "0edf323efd1d98336f3f0a68684b56f689b900d3",
    "activeProvider": "postgresql",
    "inlineSchema": "generator client {\n  provider = \"prisma-client\"\n  output   = \"../apps/libs/generated/prisma\"\n  runtime  = \"nodejs\"\n}\n\ndatasource db {\n  provider = \"postgresql\"\n}\n\nmodel User {\n  id        Int      @id @default(autoincrement())\n  name      String\n  email     String   @unique\n  password  String\n  createdAt DateTime @default(now())\n  updatedAt DateTime @updatedAt\n}\n\nmodel Auth {\n  id           Int      @id @default(autoincrement())\n  name         String\n  email        String   @unique\n  passwordHash String\n  createdAt    DateTime @default(now())\n  updatedAt    DateTime @updatedAt\n\n  @@map(\"ecommerce_auth\")\n}\n",
    "runtimeDataModel": {
        "models": {},
        "enums": {},
        "types": {}
    },
    "parameterizationSchema": {
        "strings": [],
        "graph": ""
    }
};
config.runtimeDataModel = JSON.parse("{\"models\":{\"User\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"Int\"},{\"name\":\"name\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"email\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"password\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"updatedAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"}],\"dbName\":null,\"schema\":null},\"Auth\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"Int\"},{\"name\":\"name\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"email\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"passwordHash\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"updatedAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"}],\"dbName\":\"ecommerce_auth\",\"schema\":null}},\"enums\":{},\"types\":{}}");
config.parameterizationSchema = {
    strings: JSON.parse("[\"where\",\"User.findUnique\",\"User.findUniqueOrThrow\",\"orderBy\",\"cursor\",\"User.findFirst\",\"User.findFirstOrThrow\",\"User.findMany\",\"data\",\"User.createOne\",\"User.createMany\",\"User.createManyAndReturn\",\"User.updateOne\",\"User.updateMany\",\"User.updateManyAndReturn\",\"create\",\"update\",\"User.upsertOne\",\"User.deleteOne\",\"User.deleteMany\",\"having\",\"_count\",\"_avg\",\"_sum\",\"_min\",\"_max\",\"User.groupBy\",\"User.aggregate\",\"Auth.findUnique\",\"Auth.findUniqueOrThrow\",\"Auth.findFirst\",\"Auth.findFirstOrThrow\",\"Auth.findMany\",\"Auth.createOne\",\"Auth.createMany\",\"Auth.createManyAndReturn\",\"Auth.updateOne\",\"Auth.updateMany\",\"Auth.updateManyAndReturn\",\"Auth.upsertOne\",\"Auth.deleteOne\",\"Auth.deleteMany\",\"Auth.groupBy\",\"Auth.aggregate\",\"AND\",\"OR\",\"NOT\",\"id\",\"name\",\"email\",\"passwordHash\",\"createdAt\",\"updatedAt\",\"equals\",\"in\",\"notIn\",\"lt\",\"lte\",\"gt\",\"gte\",\"not\",\"contains\",\"startsWith\",\"endsWith\",\"password\",\"set\",\"increment\",\"decrement\",\"multiply\",\"divide\"]"),
    graph: "UBUgCSwAAEMAMC0AAAQAEC4AAEMAMC8CAAAAATABAEAAITEBAAAAATNAAEEAITRAAEEAIUABAEAAIQEAAAABACABAAAAAQAgCSwAAEMAMC0AAAQAEC4AAEMAMC8CAD8AITABAEAAITEBAEAAITNAAEEAITRAAEEAIUABAEAAIQADAAAABAAgAwAABQAwBAAAAQAgAwAAAAQAIAMAAAUAMAQAAAEAIAMAAAAEACADAAAFADAEAAABACAGLwIAAAABMAEAAAABMQEAAAABM0AAAAABNEAAAAABQAEAAAABAQgAAAkAIAYvAgAAAAEwAQAAAAExAQAAAAEzQAAAAAE0QAAAAAFAAQAAAAEBCAAACwAwAQgAAAsAMAYvAgBLACEwAQBJACExAQBJACEzQABKACE0QABKACFAAQBJACECAAAAAQAgCAAADgAgBi8CAEsAITABAEkAITEBAEkAITNAAEoAITRAAEoAIUABAEkAIQIAAAAEACAIAAAQACACAAAABAAgCAAAEAAgAwAAAAEAIA8AAAkAIBAAAA4AIAEAAAABACABAAAABAAgBRUAAEwAIBYAAE0AIBcAAFAAIBgAAE8AIBkAAE4AIAksAABCADAtAAAXABAuAABCADAvAgA0ACEwAQA1ACExAQA1ACEzQAA2ACE0QAA2ACFAAQA1ACEDAAAABAAgAwAAFgAwFAAAFwAgAwAAAAQAIAMAAAUAMAQAAAEAIAksAAA-ADAtAAAdABAuAAA-ADAvAgAAAAEwAQBAACExAQAAAAEyAQBAACEzQABBACE0QABBACEBAAAAGgAgAQAAABoAIAksAAA-ADAtAAAdABAuAAA-ADAvAgA_ACEwAQBAACExAQBAACEyAQBAACEzQABBACE0QABBACEAAwAAAB0AIAMAAB4AMAQAABoAIAMAAAAdACADAAAeADAEAAAaACADAAAAHQAgAwAAHgAwBAAAGgAgBi8CAAAAATABAAAAATEBAAAAATIBAAAAATNAAAAAATRAAAAAAQEIAAAiACAGLwIAAAABMAEAAAABMQEAAAABMgEAAAABM0AAAAABNEAAAAABAQgAACQAMAEIAAAkADAGLwIASwAhMAEASQAhMQEASQAhMgEASQAhM0AASgAhNEAASgAhAgAAABoAIAgAACcAIAYvAgBLACEwAQBJACExAQBJACEyAQBJACEzQABKACE0QABKACECAAAAHQAgCAAAKQAgAgAAAB0AIAgAACkAIAMAAAAaACAPAAAiACAQAAAnACABAAAAGgAgAQAAAB0AIAUVAABEACAWAABFACAXAABIACAYAABHACAZAABGACAJLAAAMwAwLQAAMAAQLgAAMwAwLwIANAAhMAEANQAhMQEANQAhMgEANQAhM0AANgAhNEAANgAhAwAAAB0AIAMAAC8AMBQAADAAIAMAAAAdACADAAAeADAEAAAaACAJLAAAMwAwLQAAMAAQLgAAMwAwLwIANAAhMAEANQAhMQEANQAhMgEANQAhM0AANgAhNEAANgAhDRUAADgAIBYAAD0AIBcAADgAIBgAADgAIBkAADgAIDUCAAAAATYCAAAABDcCAAAABDgCAAAAATkCAAAAAToCAAAAATsCAAAAATwCADwAIQ4VAAA4ACAYAAA7ACAZAAA7ACA1AQAAAAE2AQAAAAQ3AQAAAAQ4AQAAAAE5AQAAAAE6AQAAAAE7AQAAAAE8AQA6ACE9AQAAAAE-AQAAAAE_AQAAAAELFQAAOAAgGAAAOQAgGQAAOQAgNUAAAAABNkAAAAAEN0AAAAAEOEAAAAABOUAAAAABOkAAAAABO0AAAAABPEAANwAhCxUAADgAIBgAADkAIBkAADkAIDVAAAAAATZAAAAABDdAAAAABDhAAAAAATlAAAAAATpAAAAAATtAAAAAATxAADcAIQg1AgAAAAE2AgAAAAQ3AgAAAAQ4AgAAAAE5AgAAAAE6AgAAAAE7AgAAAAE8AgA4ACEINUAAAAABNkAAAAAEN0AAAAAEOEAAAAABOUAAAAABOkAAAAABO0AAAAABPEAAOQAhDhUAADgAIBgAADsAIBkAADsAIDUBAAAAATYBAAAABDcBAAAABDgBAAAAATkBAAAAAToBAAAAATsBAAAAATwBADoAIT0BAAAAAT4BAAAAAT8BAAAAAQs1AQAAAAE2AQAAAAQ3AQAAAAQ4AQAAAAE5AQAAAAE6AQAAAAE7AQAAAAE8AQA7ACE9AQAAAAE-AQAAAAE_AQAAAAENFQAAOAAgFgAAPQAgFwAAOAAgGAAAOAAgGQAAOAAgNQIAAAABNgIAAAAENwIAAAAEOAIAAAABOQIAAAABOgIAAAABOwIAAAABPAIAPAAhCDUIAAAAATYIAAAABDcIAAAABDgIAAAAATkIAAAAAToIAAAAATsIAAAAATwIAD0AIQksAAA-ADAtAAAdABAuAAA-ADAvAgA_ACEwAQBAACExAQBAACEyAQBAACEzQABBACE0QABBACEINQIAAAABNgIAAAAENwIAAAAEOAIAAAABOQIAAAABOgIAAAABOwIAAAABPAIAOAAhCzUBAAAAATYBAAAABDcBAAAABDgBAAAAATkBAAAAAToBAAAAATsBAAAAATwBADsAIT0BAAAAAT4BAAAAAT8BAAAAAQg1QAAAAAE2QAAAAAQ3QAAAAAQ4QAAAAAE5QAAAAAE6QAAAAAE7QAAAAAE8QAA5ACEJLAAAQgAwLQAAFwAQLgAAQgAwLwIANAAhMAEANQAhMQEANQAhM0AANgAhNEAANgAhQAEANQAhCSwAAEMAMC0AAAQAEC4AAEMAMC8CAD8AITABAEAAITEBAEAAITNAAEEAITRAAEEAIUABAEAAIQAAAAAAAUEBAAAAAQFBQAAAAAEFQQIAAAABQgIAAAABQwIAAAABRAIAAAABRQIAAAABAAAAAAAAAAAABRUABhYABxcACBgACRkACgAAAAAABRUABhYABxcACBgACRkACgAAAAUVABAWABEXABIYABMZABQAAAAAAAUVABAWABEXABIYABMZABQBAgECAwEFBgEGBwEHCAEJCgEKDAILDQMMDwENEQIOEgQREwESFAETFQIaGAUbGQscGwwdHAweHwwfIAwgIQwhIwwiJQIjJg0kKAwlKgImKw4nLAwoLQwpLgIqMQ8rMhU"
};
async function decodeBase64AsWasm(wasmBase64) {
    const { Buffer } = await import('node:buffer');
    const wasmArray = Buffer.from(wasmBase64, 'base64');
    return new WebAssembly.Module(wasmArray);
}
config.compilerWasm = {
    getRuntime: async () => await import("@prisma/client/runtime/query_compiler_fast_bg.postgresql.mjs"),
    getQueryCompilerWasmModule: async () => {
        const { wasm } = await import("@prisma/client/runtime/query_compiler_fast_bg.postgresql.wasm-base64.mjs");
        return await decodeBase64AsWasm(wasm);
    },
    importName: "./query_compiler_fast_bg.js"
};
export function getPrismaClientClass() {
    return runtime.getPrismaClient(config);
}
//# sourceMappingURL=class.js.map