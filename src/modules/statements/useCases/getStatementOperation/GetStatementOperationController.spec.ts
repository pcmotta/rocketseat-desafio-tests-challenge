import { Connection } from "typeorm"
import { v4 } from 'uuid'
import request from 'supertest'
import { hash } from "bcryptjs"

import { app } from '@src/app'
import createConnection from '@src/database'

let connection: Connection

describe('Get Statement Operation', () => {
    beforeAll(async () => {
        connection = await createConnection()
        await connection.runMigrations()

        const id = v4()
        const password = await hash('123456', 8)

        await connection.query(`
            INSERT INTO users(id, name, email, password, created_at, updated_at)
            values('${id}', 'operation', 'operation@finapi.com', '${password}', 'now()', 'now()')
        `)
    })

    afterAll(async () => {
        await connection.dropDatabase()
        await connection.close()
    })

    it('should be able to get an operation', async () => {
        const responseToken = await request(app).post('/api/v1/sessions')
            .send({
                email: 'operation@finapi.com',
                password: '123456'
            })

        const { token } = responseToken.body

        const responseDeposit = await request(app).post('/api/v1/statements/deposit')
            .send({
                amount: 100,
                description: 'Deposit Description'
            }).set({
                Authorization: `Bearer ${token}`
            })

        const { id } = responseDeposit.body

        const response = await request(app).get(`/api/v1/statements/${id}`)
            .set({
                Authorization: `Bearer ${token}`
            })

        expect(response.status).toBe(200)
        expect(response.body.description).toEqual('Deposit Description')
    })

    it('should not be able to get an unexistent operation', async () => {
        const responseToken = await request(app).post('/api/v1/sessions')
            .send({
                email: 'operation@finapi.com',
                password: '123456'
            })

        const { token } = responseToken.body

        const id = v4()
        const response = await request(app).get(`/api/v1/statements/${id}`)
            .set({
                Authorization: `Bearer ${token}`
            })

        expect(response.status).toBe(404)
    })

    it('should no be able to get an operation of an unexistent user', async () => {
        const id = v4()
        const response = await request(app).get(`/api/v1/statements/${id}`)

        expect(response.status).toBe(401)
    })
})
