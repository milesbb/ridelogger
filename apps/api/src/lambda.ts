import serverlessExpress from "@vendia/serverless-express"
import app from "./app"

// Lambda entry point — env vars are fetched from SSM at runtime on first use
export const handler = serverlessExpress({ app })
