import { OperationType, Statement } from "@modules/statements/entities/Statement";
import { IStatementsRepository } from "@modules/statements/repositories/IStatementsRepository";
import { IUsersRepository } from "@modules/users/repositories/IUsersRepository";
import { AppError } from "@shared/errors/AppError";
import { inject, injectable } from "tsyringe";

interface IRequest {
    user_id: string
    sender_id: string
    amount: number
    description: string
}

@injectable()
class CreateTransferUseCase {
    constructor(
        @inject('StatementsRepository')
        private statementRepository: IStatementsRepository,
        @inject('UsersRepository')
        private userRepository: IUsersRepository
    ) {}

    async execute({ user_id, sender_id, amount, description }: IRequest): Promise<Statement> {
        const userTo = await this.userRepository.findById(user_id)

        if (!userTo) {
            throw new AppError('User not found', 404)
        }

        const userFrom = await this.userRepository.findById(sender_id)

        if (!userFrom) {
            throw new AppError('User not found', 404)
        }

        const { balance } = await this.statementRepository.getUserBalance({
            user_id: sender_id
        })

        if (balance < amount) {
            throw new AppError('Insufficient Funds', 400)
        }

        const statement = await this.statementRepository.create({
            user_id,
            sender_id,
            amount,
            description,
            type: OperationType.TRANSFER
        })

        return statement
    }
}

export { CreateTransferUseCase }
