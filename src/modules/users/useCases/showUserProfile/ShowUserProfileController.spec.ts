import { Connection } from 'typeorm'
import { v4 as uuidV4 } from 'uuid'
import { hash } from 'bcryptjs'
import request from 'supertest'

import { app } from '@src/app'
import createConnection from '@src/database'

let connection: Connection

describe('Show User Profile', () => {
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

    it('should be able to show the user profile', async () => {
        const responseToken = await request(app).post('/api/v1/sessions')
            .send({
                email: 'admin@finapi.com',
                password: '123456'
            })

        const { token } = responseToken.body

        const response = await request(app).get('/api/v1/profile')
            .set({
                Authorization: `Bearer ${token}`
            })

        expect(response.status).toBe(200)
        expect(response.body.email).toEqual('admin@finapi.com')
    })

    it('should not be able to show the profile with invalid token', async () => {
        const response = await request(app).get('/api/v1/profile')

        expect(response.status).toBe(401)
    })
})
