import mongoose, { Schema, Document } from 'mongoose';

type Address = {
  addrLine1: string,
  addrLine2?: string,
  addrCity: string,
  addrState: string,
  addrZip: number
}

type ProfileBanner = {
  gradient: string;
};

const DEFAULT_GRADIENT =
  'linear-gradient(135deg, #030712 0%, #FE9A00 100%)';

const AddressSchema = new Schema<Address>(
  {
    addrLine1: { type: String, required: true },
    addrLine2: { type: String },
    addrCity:  { type: String, required: true },
    addrState: { type: String, required: true },
    addrZip:   { type: Number, required: true },
  },
  { _id: false } 
);

export interface IUser extends Document {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  type: 'user' | 'editor' | 'admin';
  mailingAddress: Address;
  billingAddress: Address;
  sameAddress: boolean;
  profileImage?: string;
  bio?: string;
  profileBanner?: ProfileBanner;
  createdAt: Date;
  updatedAt: Date;
}

const ProfileBannerSchema = new Schema<ProfileBanner>(
  {
    gradient: { type: String, required: true, default: DEFAULT_GRADIENT },
  },
  { _id: false } 
);


const UserSchema: Schema<IUser> = new Schema(
  {
    firstName: { type: String, required: true },
    lastName:  { type: String, required: true },
    email:     { type: String, required: true, unique: true },
    password:  { type: String, required: true },
    type:      { type: String, enum: ['user','editor','admin'], default: 'user' },
    mailingAddress: { type: AddressSchema },
    billingAddress: { type: AddressSchema },
    sameAddress: { type: Boolean },
    profileImage: { type: String },
    bio: { type: String },
    profileBanner: { type: ProfileBannerSchema, default: { gradient: DEFAULT_GRADIENT } },
  },
  { timestamps: true }
);

export const UserModel = mongoose.model<IUser>('User', UserSchema);