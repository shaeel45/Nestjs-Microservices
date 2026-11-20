export declare enum UserRole {
    CUSTOMER = "CUSTOMER",
    ADMIN = "ADMIN"
}
export declare class CreateUserDto {
    fullname: string;
    lastname: string;
    email: string;
    role: UserRole;
}
export declare class UpdateUserDto {
    fullname: string;
    lastname: string;
    email: string;
    role: UserRole;
}
