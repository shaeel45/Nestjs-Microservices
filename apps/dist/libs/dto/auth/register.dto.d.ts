import { UserRole } from '../users/create-user.dto.js';
export declare class RegisterDto {
    fullname: string;
    lastname: string;
    email: string;
    password: string;
    role: UserRole;
}
