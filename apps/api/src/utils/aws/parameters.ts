import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm'

export interface DatabaseParameters {
  host: string
  name: string
  password: string
  port: number
  uri: string
  user: string
}

const ssm = new SSMClient({ region: process.env.AWS_REGION ?? 'ap-southeast-2' })

export async function getSecureParameter(name: string): Promise<string> {
  const command = new GetParameterCommand({ Name: name, WithDecryption: true })
  const response = await ssm.send(command)
  if (!response.Parameter?.Value) throw new Error(`SSM parameter not found: ${name}`)
  return response.Parameter.Value
}

export async function getDatabaseParameters(): Promise<DatabaseParameters> {
  const [host, name, password, port, uri, user] = await Promise.all([
    getSecureParameter(process.env.DB_HOST_PARAM!),
    getSecureParameter(process.env.DB_NAME_PARAM!),
    getSecureParameter(process.env.DB_PASS_PARAM!),
    getSecureParameter(process.env.DB_PORT_PARAM!),
    getSecureParameter(process.env.DB_URI_PARAM!),
    getSecureParameter(process.env.DB_USER_PARAM!),
  ])
  return { host, name, password, port: Number(port), uri, user }
}
