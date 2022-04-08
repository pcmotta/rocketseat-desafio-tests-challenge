import { OperationType } from "@modules/statements/entities/Statement"
import { InMemoryStatementsRepository } from "@modules/statements/repositories/in-memory/InMemoryStatementsRepository"
import { IStatementsRepository } from "@modules/statements/repositories/IStatementsRepository"
import { InMemoryUsersRepository } from "@modules/users/repositories/in-memory/InMemoryUsersRepository"
import { IUsersRepository } from "@modules/users/repositories/IUsersRepository"
import { GetStatementOperationError } from "./GetStatementOperationError"
import { GetStatementOperationUseCase } from "./GetStatementOperationUseCase"

let userRepository: IUsersRepository
let statementRepository: IStatementsRepository
let getStatementOperationUseCase: GetStatementOperationUseCase

describe('Get Statement Operation', () => {
    beforeEach(() => {
        userRepository = new InMemoryUsersRepository()
        statementRepository = new InMemoryStatementsRepository()
        getStatementOperationUseCase = new GetStatementOperationUseCase(
            userRepository,
            statementRepository
        )
    })

    it('should be able to get the statement operation', async () => {
        const user = await userRepository.create({
            name: 'User Statement Operation Test',
            email: 'statement@operation.com',
            password: '123456'
        })

        const statement = await statementRepository.create({
            user_id: user.id as string,
            type: OperationType.DEPOSIT,
            amount: 100,
            description: 'Statement Description'
        })

        const operation = await getStatementOperationUseCase.execute({
            user_id: user.id as string,
            statement_id: statement.id as string
        })

        expect(operation.amount).toEqual(statement.amount)
    })

    it('should not be able to get the statement operation from an unexistent user', () => {
        expect(async () => {
            await getStatementOperationUseCase.execute({
                user_id: '000',
                statement_id: '000'
            })
        }).rejects.toBeInstanceOf(GetStatementOperationError.UserNotFound)
    })

    it('should not be able to get the unexistent statement operation', () => {
        expect(async () => {
            const user = await userRepository.create({
                name: 'User Statement Operation Test',
                email: 'statement@operation.com',
                password: '123456'
            })

            await getStatementOperationUseCase.execute({
                user_id: user.id as string,
                statement_id: '000'
            })
        }).rejects.toBeInstanceOf(GetStatementOperationError.StatementNotFound)
    })
})
