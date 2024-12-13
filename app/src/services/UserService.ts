import { AppDataSource } from '../data-source';
import { User } from '../entities/User';
import { UserDTO } from '../dtos/UserDTO';
import { CognitoIdentityProviderClient, InitiateAuthCommand, GetUserCommand, AuthFlowType } from '@aws-sdk/client-cognito-identity-provider';
import crypto from 'crypto';

const cognitoClient = new CognitoIdentityProviderClient({
    region: process.env.REGION,
});

const clientId = process.env.CLIENT_ID || '';
const clientSecret =  process.env.CLIENT_SECRET || '';

export class UserService {
    private userRepository = AppDataSource.getRepository(User);

    async getAllUsers(): Promise<User[]> {
        return await this.userRepository.find();
    }

    async updateUser(id: number, data: Partial<UserDTO>): Promise<User | null> {
        const user = await this.userRepository.findOneBy({ id });
        if (!user) return null;

        Object.assign(user, data);
        
        return await this.userRepository.save(user);
    }

    async authenticateUser(email: string, password: string): Promise<{ accessToken: string, profile: string }> {


        const secretHash = crypto
            .createHmac('sha256', clientSecret)
            .update(email + clientId)
            .digest('base64');

        const params = {
            AuthFlow: 'USER_PASSWORD_AUTH' as AuthFlowType,
            ClientId: clientId,
            AuthParameters: {
                USERNAME: email,
                PASSWORD: password,
                SECRET_HASH: secretHash,
            },
        };

        const command = new InitiateAuthCommand(params);

        try {
            const data = await cognitoClient.send(command);

            if (data.AuthenticationResult?.AccessToken) {

                const accessToken = data.AuthenticationResult.AccessToken;

                const userParams = {
                    AccessToken: accessToken,
                };
                const userCommand = new GetUserCommand(userParams);

                const userData = await cognitoClient.send(userCommand);

                const profile = userData.UserAttributes?.find(attr => attr.Name === 'profile')?.Value || '';

                return {
                    accessToken,
                    profile
                };
            } else {
                throw new Error('ID Token não encontrado na resposta do Cognito');
            }
        } catch (error) {
            if (error instanceof Error) {
                throw new Error('Erro ao autenticar no Cognito: ' + error.message);
            } else {
                throw new Error('Erro desconhecido ao autenticar no Cognito');
            }
        }
    }

    async findByEmail(email: string): Promise<User | null> {
        return await this.userRepository.findOne({ where: { email } });
    }

    async createUser(userData: Partial<User>): Promise<User> {
        const user = this.userRepository.create(userData);
        return await this.userRepository.save(user);
    }
}
