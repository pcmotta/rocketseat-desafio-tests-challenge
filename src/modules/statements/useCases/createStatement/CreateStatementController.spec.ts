import { Connection } from "typeorm"
import { v4 as uuidV4 } from 'uuid'
import request from 'supertest'

import { app } from '@src/app'
import createConnection from '@src/database'
import { hash } from "bcryptjs"

let connection: Connection

describe('Create Statement', () => {
    beforeAll(async () => {
        connection = await createConnection()
        await connection.runMigrations()

        const idAdmin = uuidV4()
        const password = await hash('123456', 8)

        await connection.query(`
            INSERT INTO users(id, name, email, password, created_at, updated_at)
            values('${idAdmin}', 'admin', 'admin@finapi.com', '${password}', 'now()', 'now()')
        `)

        const idUser = uuidV4()

        await connection.query(`
            INSERT INTO users(id, name, email, password, created_at, updated_at)
            values('${idUser}', 'user', 'user@finapi.com', '${password}', 'now()', 'now()')
        `)
    })

    afterAll(async () => {
        await connection.dropDatabase()
        await connection.close()
    })

    it('should be able to create a deposit', async () => {
        const responseToken = await request(app).post('/api/v1/sessions')
            .send({
                email: 'admin@finapi.com',
                password: '123456'
            })

        const { token } = responseToken.body

        const response = await request(app).post('/api/v1/statements/deposit')
            .send({
                amount: 100,
                description: 'Deposit Description'
            })
            .set({
                Authorization: `Bearer ${token}`
            })

        expect(response.status).toBe(201)
        expect(response.body).toHaveProperty('id')
    })

    it('should be able to create a withdraw', async () => {
        const responseToken = await request(app).post('/api/v1/sessions')
            .send({
                email: 'admin@finapi.com',
                password: '123456'
            })

        const { token } = responseToken.body

        const response = await request(app).post('/api/v1/statements/withdraw')
            .send({
                amount: 50,
                description: 'Withdraw Description'
            })
            .set({
                Authorization: `Bearer ${token}`
            })

        expect(response.status).toBe(201)
        expect(response.body).toHaveProperty('id')
    })

    it('should not be able to create a deposit or a withdraw without an user', async () => {
        const responseWithdraw = await request(app).post('/api/v1/statements/withdraw')
            .send({
                amount: 50,
                description: 'Withdraw Description'
            })

        expect(responseWithdraw.status).toBe(401)

        const responseDeposit = await request(app).post('/api/v1/statements/deposit')
            .send({
                amount: 100,
                description: 'Deposit Description'
            })

        expect(responseDeposit.status).toBe(401)
    })

    it('should not be able to create a withdraw with insufficient funds', async () => {
        const responseToken = await request(app).post('/api/v1/sessions')
            .send({
                email: 'user@finapi.com',
                password: '123456'
            })

        const { token } = responseToken.body

        await request(app).post('/api/v1/statements/deposit')
            .send({
                amount: 100,
                description: 'Deposit Description'
            })
            .set({
                Authorization: `Bearer ${token}`
            })

        const response = await request(app).post('/api/v1/statements/withdraw')
            .send({
                amount: 150,
                description: 'Withdraw Description'
            })
            .set({
                Authorization: `Bearer ${token}`
            })

        expect(response.status).toBe(400)
    })
})
