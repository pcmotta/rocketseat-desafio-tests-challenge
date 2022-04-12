import { Connection } from "typeorm"
import request from 'supertest'

import { app } from '@src/app'
import createConnection from '@src/database'

let connection: Connection

describe('Create User Controller', () => {
    beforeAll(async () => {
        connection = await createConnection()
        await connection.runMigrations()
    })

    afterAll(async () => {
        await connection.dropDatabase()
        await connection.close()
    })

    it('should be able to create a new user', async () => {
        const response = await request(app).post('/api/v1/users')
            .send({
                name: 'Test Name',
                email: 'test@finapi.com',
                password: '123456'
            })

        expect(response.status).toBe(201)
    })

    it('should not be able to create a new user with the same email', async () => {
        await request(app).post('/api/v1/users')
            .send({
                name: 'Test Name',
                email: 'test1@finapi.com',
                password: '123456'
            })

        const response = await request(app).post('/api/v1/users')
            .send({
                name: 'Test Name 2',
                email: 'test1@finapi.com',
                password: '123456'
            })

        expect(response.status).toBe(400)
    })
})
