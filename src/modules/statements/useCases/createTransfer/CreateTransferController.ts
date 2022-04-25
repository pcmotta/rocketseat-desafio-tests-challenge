import { Request, Response } from "express";
import { container } from "tsyringe";
import { CreateTransferUseCase } from "./CreateTransferUseCase";

class CreateTransferController {
    async handle(request: Request, response: Response): Promise<Response> {
        const { user_id } = request.params
        const { id: sender_id } = request.user
        const { amount, description } = request.body

        const useCase = container.resolve(CreateTransferUseCase)
        const statement = await useCase.execute({
            user_id,
            sender_id,
            amount,
            description
        })

        return response.status(201).json(statement)
    }
}

export { CreateTransferController }
