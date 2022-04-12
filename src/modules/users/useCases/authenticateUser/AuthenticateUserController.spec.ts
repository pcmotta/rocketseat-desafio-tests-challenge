import { v4 as uuidV4 } from 'uuid'
import { app } from '@src/app'
import { Connection } from 'typeorm'
import request from 'supertest'

import createConnection from '@src/database'
import { hash } from 'bcryptjs'

let connection: Connection

describe('Authenticate User', () => {
    beforeAll(async () => {
        connection = await createConnection()
        await connection.runMigrations()

        const id = uuidV4()
        const password = await hash('123456', 8)

        await connection.query(`
            INSERT INTO users(id, name, email, password, created_at, updated_at)
            values('${id}', 'admin', 'admin@finapi.com', '${password}', 'now()', 'now()')
        `)
    })

    afterAll(async () => {
        await connection.dropDatabase()
        await connection.close()
    })

    it('should be able to authenticate an user', async () => {
        const response = await request(app).post('/api/v1/sessions')
            .send({
                email: 'admin@finapi.com',
                password: '123456'
            })

        expect(response.status).toBe(200)
    })

    it('should not be able to authenticate an unexistent user', async () => {
        const response = await request(app).post('/api/v1/sessions')
            .send({
                email: 'admin1@finapi.com',
                password: '123456'
            })

        expect(response.status).toBe(401)
    })

    it('should not be able to authenticate with a wrong password', async () => {
        const response = await request(app).post('/api/v1/sessions')
            .send({
                email: 'admin@finapi.com',
                password: '1234'
            })

        expect(response.status).toBe(401)
    })
})
