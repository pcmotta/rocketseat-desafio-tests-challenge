import { Connection } from "typeorm"
import { v4 } from 'uuid'
import request from 'supertest'
import { hash } from "bcryptjs"

import createConnection from '@src/database'
import { app } from '@src/app'

let connection: Connection
let idUser: string
let idUser2: string

describe('Get Balance', () => {
    beforeAll(async () => {
        connection = await createConnection()
        await connection.runMigrations()

        idUser = v4()
        const password = await hash('123456', 8)

        await connection.query(`
            INSERT INTO users(id, name, email, password, created_at, updated_at)
            values('${idUser}', 'balance', 'balance@finapi.com', '${password}', 'now()', 'now()')
        `)

        idUser2 = v4()

        await connection.query(`
            INSERT INTO users(id, name, email, password, created_at, updated_at)
            values('${idUser2}', 'balance', 'balance2@finapi.com', '${password}', 'now()', 'now()')
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

        const responseToken2 = await request(app).post('/api/v1/sessions')
            .send({
                email: 'balance2@finapi.com',
                password: '123456'
            })

        const { token: token2 } = responseToken2.body

        await request(app).post('/api/v1/statements/deposit')
            .send({
                amount: 100,
                description: 'Deposit'
            }).set({
                Authorization: `Bearer ${token}`
            })

        await request(app).post('/api/v1/statements/deposit')
            .send({
                amount: 100,
                description: 'Deposit'
            }).set({
                Authorization: `Bearer ${token2}`
            })

        await request(app).post('/api/v1/statements/withdraw')
            .send({
                amount: 60,
                description: 'Withdraw'
            }).set({
                Authorization: `Bearer ${token}`
            })

        await request(app).post(`/api/v1/statements/transfers/${idUser}`)
            .send({
                amount: 50,
                description: 'Transfer'
            }).set({
                Authorization: `Bearer ${token2}`
            })

        await request(app).post(`/api/v1/statements/transfers/${idUser2}`)
            .send({
                amount: 30,
                description: 'Transfer'
            }).set({
                Authorization: `Bearer ${token}`
            })

        const response = await request(app).get('/api/v1/statements/balance')
            .set({
                Authorization: `Bearer ${token}`
            })

        expect(response.status).toBe(200)
        expect(response.body.balance).toBe(60)
        expect(response.body.statement.length).toBe(4)
    })

    it('should no be able to get the balance of an unexistent user', async () => {
        const response = await request(app).get('/api/v1/statements/balance')

        expect(response.status).toBe(401)
    })
})
