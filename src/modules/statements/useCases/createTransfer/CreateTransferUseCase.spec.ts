import { OperationType } from "@modules/statements/entities/Statement"
import { InMemoryStatementsRepository } from "@modules/statements/repositories/in-memory/InMemoryStatementsRepository"
import { IStatementsRepository } from "@modules/statements/repositories/IStatementsRepository"
import { InMemoryUsersRepository } from "@modules/users/repositories/in-memory/InMemoryUsersRepository"
import { IUsersRepository } from "@modules/users/repositories/IUsersRepository"
import { AppError } from "@shared/errors/AppError"
import { CreateTransferUseCase } from "./CreateTransferUseCase"

let statementRepository: IStatementsRepository
let userRepository: IUsersRepository
let createTransferUseCase: CreateTransferUseCase

describe('Create Transfer', () => {
    beforeEach(() => {
        statementRepository = new InMemoryStatementsRepository()
        userRepository = new InMemoryUsersRepository()
        createTransferUseCase = new CreateTransferUseCase(
            statementRepository,
            userRepository
        )
    })

    it('should be able to create a new transfer', async () => {
        const user1 = await userRepository.create({
            email: 'user1@test.com',
            name: 'User 1',
            password: '123456'
        })

        const user2 = await userRepository.create({
            email: 'user2@test.com',
            name: 'User 2',
            password: '123456'
        })

        await statementRepository.create({
            amount: 100,
            description: 'Description',
            type: OperationType.DEPOSIT,
            user_id: user1.id as string
        })

        await statementRepository.create({
            amount: 100,
            description: 'Description',
            type: OperationType.DEPOSIT,
            user_id: user2.id as string
        })

        await createTransferUseCase.execute({
            user_id: user2.id as string,
            sender_id: user1.id as string,
            amount: 50,
            description: 'Transfer'
        })

        const transfer = await createTransferUseCase.execute({
            user_id: user1.id as string,
            sender_id: user2.id as string,
            amount: 30,
            description: 'Transfer'
        })

        const balance = await statementRepository.getUserBalance({
            user_id: user2.id as string,
            with_statement: true
        })

        expect(transfer).toHaveProperty('id')
        expect(transfer).toHaveProperty('sender_id')
        expect(balance.balance).toEqual(120)
    })

    it('should not be able to create a transfer from an unexistent user', async () => {
        const user1 = await userRepository.create({
            email: 'user1@test.com',
            name: 'User 1',
            password: '123456'
        })

        expect(async () => {
            await createTransferUseCase.execute({
                user_id: user1.id as string,
                sender_id: '123',
                amount: 30,
                description: 'Transfer'
            })
        }).rejects.toEqual(new AppError('User not found', 404))
    })

    it('should not be able to create a transfer to an unexistent user', async () => {
        const user1 = await userRepository.create({
            email: 'user1@test.com',
            name: 'User 1',
            password: '123456'
        })

        expect(async () => {
            await createTransferUseCase.execute({
                user_id: '123',
                sender_id: user1.id as string,
                amount: 30,
                description: 'Transfer'
            })
        }).rejects.toEqual(new AppError('User not found', 404))
    })

    it('should not be able to create a transfer with insufficient funds', async () => {
        const user1 = await userRepository.create({
            email: 'user1@test.com',
            name: 'User 1',
            password: '123456'
        })

        const user2 = await userRepository.create({
            email: 'user2@test.com',
            name: 'User 2',
            password: '123456'
        })

        expect(async () => {
            await createTransferUseCase.execute({
                user_id: user2.id as string,
                sender_id: user1.id as string,
                amount: 110,
                description: 'Transfer'
            })
        }).rejects.toEqual(new AppError('Insufficient Funds', 400))
    })
})
