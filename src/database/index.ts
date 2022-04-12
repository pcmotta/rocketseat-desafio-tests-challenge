import { Connection, createConnection, getConnectionOptions } from 'typeorm';

export default async (): Promise<Connection> => {
    const defaultOptions = await getConnectionOptions()
    const test = process.env.NODE_ENV === 'test'

    return createConnection(
        Object.assign(defaultOptions, {
            database: test ? 'fin_api_test' : defaultOptions.database
        })
    )
}
