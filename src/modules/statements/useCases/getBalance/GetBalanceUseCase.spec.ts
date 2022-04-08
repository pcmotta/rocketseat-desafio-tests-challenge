import { OperationType } from "@modules/statements/entities/Statement"
import { InMemoryStatementsRepository } from "@modules/statements/repositories/in-memory/InMemoryStatementsRepository"
import { IStatementsRepository } from "@modules/statements/repositories/IStatementsRepository"
import { InMemoryUsersRepository } from "@modules/users/repositories/in-memory/InMemoryUsersRepository"
import { IUsersRepository } from "@modules/users/repositories/IUsersRepository"
import { hash } from "bcryptjs"
import { GetBalanceError } from "./GetBalanceError"
import { GetBalanceUseCase } from './GetBalanceUseCase'

let userRepository: IUsersRepository
let statementRepository: IStatementsRepository
let getBalanceUseCase: GetBalanceUseCase

describe('Get Balance', () => {
    beforeEach(() => {
        userRepository = new InMemoryUsersRepository()
        statementRepository = new InMemoryStatementsRepository()
        getBalanceUseCase = new GetBalanceUseCase(
            statementRepository,
            userRepository
        )
    })

    it('should be able to get the user balance', async () => {
        const user = await userRepository.create({
            name: 'User Balance Test',
            email: 'user@balance.com',
            password: await hash('123456', 8)
        })

        await statementRepository.create({
            user_id: user.id as string,
            type: OperationType.DEPOSIT,
            amount: 100,
            description: 'Statement Description'
        })

        await statementRepository.create({
            user_id: user.id as string,
            type: OperationType.WITHDRAW,
            amount: 60,
            description: 'Statement Description'
        })

        const balance = await getBalanceUseCase.execute({ user_id: user.id as string })

        expect(balance.statement.length).toBe(2)
        expect(balance.balance).toBe(40)
    })

    it('should not be able to get a balance from an unexistent user', () => {
        expect(async () => {
            await getBalanceUseCase.execute({ user_id: '000' })
        }).rejects.toBeInstanceOf(GetBalanceError)
    })
})
