import { InMemoryStatementsRepository } from "@modules/statements/repositories/in-memory/InMemoryStatementsRepository"
import { IStatementsRepository } from "@modules/statements/repositories/IStatementsRepository"
import { InMemoryUsersRepository } from "@modules/users/repositories/in-memory/InMemoryUsersRepository"
import { IUsersRepository } from "@modules/users/repositories/IUsersRepository"
import { hash } from "bcryptjs"
import { CreateStatementUseCase } from './CreateStatementUseCase'

import { OperationType } from '@modules/statements/entities/Statement'
import { CreateStatementError } from "./CreateStatementError"
import { AppError } from "@shared/errors/AppError"

let userRepository: IUsersRepository
let statementRepository: IStatementsRepository
let createStatementUseCase: CreateStatementUseCase

describe('Create Statement', () => {
    beforeEach(() => {
        userRepository = new InMemoryUsersRepository()
        statementRepository = new InMemoryStatementsRepository()
        createStatementUseCase = new CreateStatementUseCase(
            userRepository,
            statementRepository
        )
    })

    it('should be able to create a new deposit', async () => {
        const user = await userRepository.create({
            name: 'User Statement Deposit Test',
            email: 'user@deposit.com',
            password: await hash('123456', 8)
        })

        const statement = await createStatementUseCase.execute({
            user_id: user.id as string,
            type: OperationType.DEPOSIT,
            amount: 100,
            description: 'Statement Description'
        })

        expect(statement).toHaveProperty('id')
    })

    it('should be able to create a new withdraw', async () => {
        const user = await userRepository.create({
            name: 'User Statement Withdraw Test',
            email: 'user@withdraw.com',
            password: await hash('123456', 8)
        })

        await createStatementUseCase.execute({
            user_id: user.id as string,
            type: OperationType.DEPOSIT,
            amount: 100,
            description: 'Statement Description'
        })

        const statement = await createStatementUseCase.execute({
            user_id: user.id as string,
            type: OperationType.WITHDRAW,
            amount: 80,
            description: 'Statement Description'
        })

        expect(statement).toHaveProperty('id')
    })

    it('should not be able to create a statement for an unexistent user', () => {
        expect(async () => {
            await createStatementUseCase.execute({
                user_id: '00000',
                type: OperationType.DEPOSIT,
                amount: 100,
                description: 'Statement Description'
            })
        }).rejects.toBeInstanceOf(CreateStatementError.UserNotFound)
    })

    it('should not be able to create a statement for user with insufficient balance', () => {
        expect(async () => {
            const user = await userRepository.create({
                name: 'User Without Balanca Test',
                email: 'user@balance.com',
                password: await hash('123456', 8)
            })

            await createStatementUseCase.execute({
                user_id: user.id as string,
                type: OperationType.WITHDRAW,
                amount: 100,
                description: 'Statement Description'
            })
        }).rejects.toBeInstanceOf(CreateStatementError.InsufficientFunds)
    })
})
