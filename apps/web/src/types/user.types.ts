export type UserType = 'user' | 'editor' | 'admin';

export interface Address {
  addrLine1: string;
  addrLine2?: string;
  addrCity: string;
  addrState: string;
  addrZip: number;
}

export interface ProfileBanner {
  gradient: string;
}

export interface IUser {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  type: UserType;
  mailingAddress?: Address;
  billingAddress?: Address;
  sameAddress?: boolean;
  profileImage?: string;
  bio?: string;
  profileBanner?: ProfileBanner;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserDto {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  type?: UserType;
  mailingAddress?: Address;
  billingAddress?: Address;
  sameAddress?: boolean;
  profileImage?: string;
  bio?: string;
  profileBanner?: ProfileBanner;
}

export interface UpdateUserDto {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  type?: UserType;
  mailingAddress?: Address;
  billingAddress?: Address;
  sameAddress?: boolean;
  profileImage?: string;
  bio?: string;
  profileBanner?: ProfileBanner;
}