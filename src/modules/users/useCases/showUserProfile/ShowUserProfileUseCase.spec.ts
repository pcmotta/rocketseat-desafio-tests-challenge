import { InMemoryUsersRepository } from "@modules/users/repositories/in-memory/InMemoryUsersRepository"
import { IUsersRepository } from "@modules/users/repositories/IUsersRepository"
import { hash } from "bcryptjs"
import { ShowUserProfileError } from "./ShowUserProfileError"
import { ShowUserProfileUseCase } from "./ShowUserProfileUseCase"

let userRepository: IUsersRepository
let showUserProfileUseCase: ShowUserProfileUseCase

describe('Show User Profile', () => {
    beforeEach(() => {
        userRepository = new InMemoryUsersRepository()
        showUserProfileUseCase = new ShowUserProfileUseCase(userRepository)
    })

    it('should be able to show the user profile', async () => {
        const { id, name } = await userRepository.create({
            name: 'User Profile Test',
            email: "user@profile.com",
            password: await hash('123456', 8)
        })

        const profile = await showUserProfileUseCase.execute(id as string)

        expect(profile.name).toEqual(name)
    })

    it('should not be able to show the profile of an unexistent user', () => {
        expect(async () => {
            await showUserProfileUseCase.execute('0000')
        }).rejects.toBeInstanceOf(ShowUserProfileError)
    })
})
