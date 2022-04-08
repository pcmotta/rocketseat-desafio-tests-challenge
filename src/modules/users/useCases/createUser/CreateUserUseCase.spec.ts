import { InMemoryUsersRepository } from "@modules/users/repositories/in-memory/InMemoryUsersRepository"
import { IUsersRepository } from "@modules/users/repositories/IUsersRepository"
import { CreateUserError } from "./CreateUserError"

import { CreateUserUseCase } from './CreateUserUseCase'

let userRepository: IUsersRepository
let createUserUseCase: CreateUserUseCase

describe('Create User', () => {
    beforeEach(() => {
        userRepository = new InMemoryUsersRepository()
        createUserUseCase = new CreateUserUseCase(userRepository)
    })

    it('should be able to create an user', async () => {
        const user = await createUserUseCase.execute({
            name: 'Teste',
            email: 'teste@teste.com.br',
            password: '123456'
        })

        expect(user).toHaveProperty('id')
    })

    it('should not be able to create an user with an existent email', () => {
        expect(async () => {
            await createUserUseCase.execute({
                name: 'Teste',
                email: 'teste1@teste.com.br',
                password: '123456'
            })

            await createUserUseCase.execute({
                name: 'Teste 2',
                email: 'teste1@teste.com.br',
                password: '123456'
            })
        }).rejects.toBeInstanceOf(CreateUserError)
    })
})
