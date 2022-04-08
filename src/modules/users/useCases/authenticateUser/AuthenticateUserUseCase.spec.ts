import { InMemoryUsersRepository } from "@modules/users/repositories/in-memory/InMemoryUsersRepository"
import { IUsersRepository } from "@modules/users/repositories/IUsersRepository"
import { hash } from "bcryptjs"
import { AuthenticateUserUseCase } from "./AuthenticateUserUseCase"
import { IncorrectEmailOrPasswordError } from "./IncorrectEmailOrPasswordError"

let userRepository: IUsersRepository
let authenticateUserUseCase: AuthenticateUserUseCase

describe('Authenticate User', () => {
    beforeEach(() => {
        userRepository = new InMemoryUsersRepository()
        authenticateUserUseCase = new AuthenticateUserUseCase(userRepository)
    })

    it('should be able to authenticate an user', async () => {
        const user = await userRepository.create({
            name: 'Teste Authentication',
            email: "auth@test.com.br",
            password: await hash('123456', 8)
        })

        const auth = await authenticateUserUseCase.execute({
            email: user.email,
            password: '123456'
        })

        expect(auth).toHaveProperty('token')
    })

    it('should not be able to authenticate an unenxistent user', () => {
        expect(async () => {
            await authenticateUserUseCase.execute({
                email: 'unenxistent@user.com.br',
                password: '123456'
            })
        }).rejects.toBeInstanceOf(IncorrectEmailOrPasswordError)
    })

    it('should not be able to authenticate with a wrong password', () => {
        expect(async () => {
            const user = await userRepository.create({
                name: 'Test Authentication Wrong Password',
                email: "wrong@password.com",
                password: await hash('123456', 8)
            })

            await authenticateUserUseCase.execute({
                email: user.email,
                password: 'abcdef'
            })
        }).rejects.toBeInstanceOf(IncorrectEmailOrPasswordError)
    })
})
