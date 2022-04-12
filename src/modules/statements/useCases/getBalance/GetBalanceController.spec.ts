import { Connection } from "typeorm"
import { v4 } from 'uuid'
import request from 'supertest'
import { hash } from "bcryptjs"

import createConnection from '@src/database'
import { app } from '@src/app'

let connection: Connection

describe('Get Balance', () => {
    beforeAll(async () => {
        connection = await createConnection()
        await connection.runMigrations()

        const id = v4()
        const password = await hash('123456', 8)

        await connection.query(`
            INSERT INTO users(id, name, email, password, created_at, updated_at)
            values('${id}', 'balance', 'balance@finapi.com', '${password}', 'now()', 'now()')
        `)
    })

    afterAll(async () => {
        await connection.dropDatabase()
        await connection.close()
    })

    it('should be able to get the balance', async () => {
        const responseToken = await request(app).post('/api/v1/sessions')
            .send({
                email: 'balance@finapi.com',
                password: '123456'
            })

        const { token } = responseToken.body

        await request(app).post('/api/v1/statements/deposit')
            .send({
                amount: 100,
                description: 'Deposit'
            }).set({
                Authorization: `Bearer ${token}`
            })

        await request(app).post('/api/v1/statements/withdraw')
            .send({
                amount: 60,
                description: 'Withdraw'
            }).set({
                Authorization: `Bearer ${token}`
            })

        const response = await request(app).get('/api/v1/statements/balance')
            .set({
                Authorization: `Bearer ${token}`
            })

        expect(response.status).toBe(200)
        expect(response.body.balance).toBe(40)
        expect(response.body.statement.length).toBe(2)
    })

    it('should no be able to get the balance of an unexistent user', async () => {
        const response = await request(app).get('/api/v1/statements/balance')

        expect(response.status).toBe(401)
    })
})
