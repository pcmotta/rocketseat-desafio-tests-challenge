import { Connection } from "typeorm"
import { v4 } from 'uuid'
import request from 'supertest'

import { app } from '@src/app'
import createConnection from '@src/database'
import { hash } from "bcryptjs"

let connection: Connection
let idAdmin: string
let idUser: string

describe('Create transfer', () => {
    beforeAll(async () => {
        connection = await createConnection()
        await connection.runMigrations()

        idAdmin = v4()
        const password = await hash('123456', 8)

        await connection.query(`
            INSERT INTO users(id, name, email, password, created_at, updated_at)
            values('${idAdmin}', 'admin', 'admin@finapi.com', '${password}', 'now()', 'now()')
        `)

        idUser = v4()

        await connection.query(`
            INSERT INTO users(id, name, email, password, created_at, updated_at)
            values('${idUser}', 'user', 'user@finapi.com', '${password}', 'now()', 'now()')
        `)
    })

    afterAll(async () => {
        await connection.dropDatabase()
        await connection.close()
    })

    it('should be able to create a new transfer', async () => {
        const responseTokenAdmin = await request(app).post('/api/v1/sessions')
            .send({
                email: 'admin@finapi.com',
                password: '123456'
            })

        const { token: tokenAdmin } = responseTokenAdmin.body

        const responseTokenUser = await request(app).post('/api/v1/sessions')
            .send({
                email: 'user@finapi.com',
                password: '123456'
            })

        const { token: tokenUser } = responseTokenUser.body

        await request(app).post('/api/v1/statements/deposit')
            .send({
                amount: 100,
                description: 'Deposit Description'
            })
            .set({
                Authorization: `Bearer ${tokenAdmin}`
            })

        await request(app).post('/api/v1/statements/deposit')
            .send({
                amount: 100,
                description: 'Deposit Description'
            })
            .set({
                Authorization: `Bearer ${tokenUser}`
            })

        const transferResponse = await request(app).post(`/api/v1/statements/transfers/${idUser}`)
            .send({
                amount: 50,
                description: 'Transfer Description'
            })
            .set({
                Authorization: `Bearer ${tokenAdmin}`
            })

        expect(transferResponse.status).toEqual(201)
    })

    it('should not be able to create a new transfer from an unexistent user', async () => {
        const responseTokenAdmin = await request(app).post('/api/v1/sessions')
            .send({
                email: 'admin@finapi.com',
                password: '123456'
            })

        const { token: tokenAdmin } = responseTokenAdmin.body

        const transferResponse = await request(app).post(`/api/v1/statements/transfers/${idAdmin}`)
            .send({
                amount: 50,
                description: 'Transfer Description'
            })
            .set({
                Authorization: `Bearer ${v4()}`
            })

        expect(transferResponse.status).toEqual(401)
    })

    it('should not be able to create a new transfer to an unexistent user', async () => {
        const responseTokenAdmin = await request(app).post('/api/v1/sessions')
            .send({
                email: 'admin@finapi.com',
                password: '123456'
            })

        const { token: tokenAdmin } = responseTokenAdmin.body

        const transferResponse = await request(app).post(`/api/v1/statements/transfers/${v4()}`)
            .send({
                amount: 50,
                description: 'Transfer Description'
            })
            .set({
                Authorization: `Bearer ${tokenAdmin}`
            })

        expect(transferResponse.status).toEqual(404)
    })

    it('should not be able to create a new transfer with insufficient funds', async () => {
        const responseTokenAdmin = await request(app).post('/api/v1/sessions')
            .send({
                email: 'admin@finapi.com',
                password: '123456'
            })

        const { token: tokenAdmin } = responseTokenAdmin.body

        const transferResponse = await request(app).post(`/api/v1/statements/transfers/${idUser}`)
            .send({
                amount: 200,
                description: 'Transfer Description'
            })
            .set({
                Authorization: `Bearer ${tokenAdmin}`
            })

        expect(transferResponse.status).toEqual(400)
    })
})
